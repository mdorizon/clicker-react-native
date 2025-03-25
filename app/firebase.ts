import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASZfrsw5SrLSdyN8_eLCgLtxioUSQ-UeU",
  authDomain: "clicker-app-4ed4e.firebaseapp.com",
  projectId: "clicker-app-4ed4e",
  storageBucket: "clicker-app-4ed4e.firebasestorage.app",
  messagingSenderId: "170578083275",
  appId: "1:170578083275:web:104a0517f731f1d9cb8a4e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export de la configuration et de l'instance db
const firebase = {
  app,
  db,
  config: firebaseConfig,
};

export { db };
export default firebase;
