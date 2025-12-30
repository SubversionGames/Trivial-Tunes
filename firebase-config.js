// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaVkjG2zXHVnY1NXpwsDXPvg_uCNrDsJ8",
  authDomain: "trivial-tunes.firebaseapp.com",
  projectId: "trivial-tunes",
  storageBucket: "trivial-tunes.firebasestorage.app",
  messagingSenderId: "320428434618",
  appId: "1:320428434618:web:e8c09a5a7a8e47a34fce83"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const app = initializeApp(firebaseConfig);
