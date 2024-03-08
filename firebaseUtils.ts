import configuration from "~/configuration";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";
type Payload = {
  notification: boolean;
  user: User;
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_TOKEN;
export const handleNotification = async (
  payload: Payload
): Promise<{ hasError: boolean; msg: string }> => {
  const { user, notification } = payload;

  if (!notification) {
    if (user?.uid) {
      const ref = await returnUserDocRef(user);
      await updateDoc(ref, {
        notificationToken: null,
        notifications: false,
      });
      console.log("Notification disabled successfully.");
      return { hasError: false, msg: "Notification disabled successfully." };
    }
    return {
      hasError: true,
      msg: "Do not have permission!, Please allow permission",
    };
  }

  console.log("Requesting permission...");
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return {
      hasError: true,
      msg: "Do not have permission!, Please allow permission",
    };
  }

  console.log("Notification permission granted.");
  const app = initializeApp(configuration.firebase);
  const messaging = getMessaging(app);
  const currentToken = await getToken(messaging, {
    vapidKey,
  });

  if (!currentToken) {
    console.log("Can not get token");
    return { hasError: true, msg: "Can not get token" };
  }

  if (!user?.uid) {
    return {
      hasError: true,
      msg: "Do not have permission!, Please allow permission",
    };
  }

  const ref = await returnUserDocRef(user);
  await updateDoc(ref, {
    notificationToken: currentToken,
    notifications: notification,
  });
  console.log("Notification enabled successfully.");
  return {
    hasError: false,
    msg: "Notification enabled successfully.",
  };
};

async function returnUserDocRef(user: User) {
  const qry = query(collection(db, "users"), where("uid", "==", user?.uid));
  const querySnapshot = await getDocs(qry);
  const temp = querySnapshot.docs.map((doc) => doc.ref.id);
  const ref = doc(db, "users", temp[0]);
  return ref;
}