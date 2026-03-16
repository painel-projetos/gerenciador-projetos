const firebaseConfig = {
  apiKey: "AIzaSyAWixMM_ptQr883odSqNEVSNc4AIDacv7g",
  authDomain: "tateste12.firebaseapp.com",
  projectId: "tateste12",
  storageBucket: "tateste12.firebasestorage.app",
  messagingSenderId: "875359284883",
  appId: "1:875359284883:web:c781edcfe0c8b99649a766"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
