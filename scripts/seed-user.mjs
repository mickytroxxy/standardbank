import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0dJUBCtG1vt6b-xywAasSw4liwrASMXE",
  authDomain: "standardbank-7c3ca.firebaseapp.com",
  projectId: "standardbank-7c3ca",
  storageBucket: "standardbank-7c3ca.firebasestorage.app",
  messagingSenderId: "909459531420",
  appId: "1:909459531420:web:3e7a9c304b87f24d382f59",
  measurementId: "G-NDM6LNCDJ3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const user = {
  phoneNumber: "0658016132",
  pin: "76245",
  title: "Mr",
  firstName: "Lameck",
  lastName: "Ndhlovu",
  accountNumber: "10 12 382 265 1",
  availableBalance: 747749.23,
  latestBalance: 942270.23,
};

await setDoc(doc(db, "accounts", user.phoneNumber), user);
console.log(
  `Seeded user ${user.phoneNumber} (${user.title} ${user.firstName} ${user.lastName})`,
);
process.exit(0);
