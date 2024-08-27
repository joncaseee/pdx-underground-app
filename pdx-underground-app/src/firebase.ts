// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIG2jdofBK3jvNSK9l2ojfcekQz_dIBXk",
  authDomain: "pdx-underground.firebaseapp.com",
  projectId: "pdx-underground",
  storageBucket: "pdx-underground.appspot.com",
  messagingSenderId: "998303162022",
  appId: "1:998303162022:web:fe6f4047194742b92e9e67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };