// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA19b8tIzAcGYGoZFqN6HBIhdbf600BtCc",
  authDomain: "go-market-exe-project.firebaseapp.com",
  projectId: "go-market-exe-project",
  storageBucket: "go-market-exe-project.firebasestorage.app",
  messagingSenderId: "835126209090",
  appId: "1:835126209090:web:85e57b11785644f3405bdb",
  measurementId: "G-NPY2LL2L16"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const auth = getAuth();
export { app, storage, googleProvider, auth };