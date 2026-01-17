// Firebase Configuration for SmartDukaan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAK4v2-v_5IaK2cZTprmS5V8LaSW3_MX5c",
    authDomain: "smartdukaan-e6b3b.firebaseapp.com",
    projectId: "smartdukaan-e6b3b",
    storageBucket: "smartdukaan-e6b3b.firebasestorage.app",
    messagingSenderId: "332197761154",
    appId: "1:332197761154:web:9ea71f4741f6931a6c649b"
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
    signInAnonymously,
    onAuthStateChanged
};

console.log('🔥 Firebase initialized successfully!');
