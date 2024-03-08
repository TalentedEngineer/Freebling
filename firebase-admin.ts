const keys = require("./serviceAccountKey.json");
import { credential } from "firebase-admin";
import { App, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const firebaseAdminApp: App =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: credential.cert(keys) });

export const firebaseAdminDb = getFirestore(firebaseAdminApp);
