import configuration from '~/configuration';
import { getApps } from "firebase/app";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage} from "firebase/storage";

// Initialize Firebase
// check if there is already an app intialuaze 
const app = !getApps().length? initializeApp(configuration.firebase): getApps()[0];
export const auth = getAuth();

// export firestore db 
export const db = getFirestore(app);

// export firebase storage
export const storage = getStorage(app);


export function postToJSON(doc: { data: () => any; }) {
    const data = doc.data();
    return {
      ...data,
      // Gotcha! firestore timestamp NOT serializable to JSON. Must convert to milliseconds
      createdAt: data?.createdAt.toMillis() || 0,
      updatedAt: data?.updatedAt.toMillis() || 0,
    };
}
  
