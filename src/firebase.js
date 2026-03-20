import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBrsh5--eoN-Wc2pHl1O-rl2tQ91vxxelM",
  authDomain: "tattoospot-3fefd.firebaseapp.com",
  projectId: "tattoospot-3fefd",
  storageBucket: "tattoospot-3fefd.firebasestorage.app",
  messagingSenderId: "930208617322",
  appId: "1:930208617322:web:d3b8b0ad6916c366428b13"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);