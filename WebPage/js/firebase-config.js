// Firebase Configuration for SmartDukaan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXea6fNyUqpbhRnkY0nm78BiF9k3uBLLo",
    authDomain: "smartdukaan-3a684.firebaseapp.com",
    projectId: "smartdukaan-3a684",
    storageBucket: "smartdukaan-3a684.firebasestorage.app",
    messagingSenderId: "200407154460",
    appId: "1:200407154460:web:7e108f02ddc9d71ef204d9",
    measurementId: "G-327CCGS4YX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export for use in other modules
export {
    db,
    auth,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    signInWithPhoneNumber,
    onAuthStateChanged,
    RecaptchaVerifier,
    signOut
};

console.log('🔥 Firebase initialized successfully!');
