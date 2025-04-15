import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7i8QDBSuhn1qKop6mG_stBP_FQ_DvfzU",
  authDomain: "financio-f5dec.firebaseapp.com",
  projectId: "financio-f5dec",
  storageBucket: "financio-f5dec.firebasestorage.app",
  messagingSenderId: "318426341631",
  appId: "1:318426341631:web:4edd836dc55b4052a7ecca",
  measurementId: "G-BYLE8W7VY2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }

