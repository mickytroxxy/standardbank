import { initializeApp, type FirebaseApp } from "firebase/app";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    type Firestore,
} from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD0dJUBCtG1vt6b-xywAasSw4liwrASMXE",
  authDomain: "standardbank-7c3ca.firebaseapp.com",
  projectId: "standardbank-7c3ca",
  storageBucket: "standardbank-7c3ca.firebasestorage.app",
  messagingSenderId: "909459531420",
  appId: "1:909459531420:web:3e7a9c304b87f24d382f59",
  measurementId: "G-NDM6LNCDJ3",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

if (Platform.OS === "web") {
  import("firebase/analytics")
    .then(({ isSupported, getAnalytics }) =>
      isSupported().then((supported) => supported && getAnalytics(app)),
    )
    .catch(() => undefined);
}

export type Title = "Mr" | "Mrs" | "Ms" | "Miss" | "Dr";
export const TITLES: Title[] = ["Mr", "Mrs", "Ms", "Miss", "Dr"];

export type AccountInfo = {
  phoneNumber: string;
  pin: string;
  title: Title;
  firstName: string;
  lastName: string;
  accountNumber: string;
  availableBalance: number;
  latestBalance: number;
};

export type Transaction = {
  date: string;
  title: string;
  sub: string;
  amount: string;
  credit?: boolean;
  fullDate?: string;
  time?: string;
  runningBalance?: string;
  beneficiaryName?: string;
  account?: string;
  myRef?: string;
  theirRef?: string;
};

export type BankBeneficiary = {
  id?: string;
  type: "bank";
  holderName: string;
  bank: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  theirRef: string;
  myRef: string;
  proof: string;
};

export type CellBeneficiary = {
  id?: string;
  type: "cell";
  name: string;
  surname: string;
  phone: string;
  myRef: string;
};

export type SavedBeneficiary = BankBeneficiary | CellBeneficiary;

export function formatRand(amount: number): string {
  const [whole, fraction] = amount.toFixed(2).split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const digits = sign ? whole.slice(1) : whole;
  const spaced = digits.replace(/\B(?=([0-9]{3})+(?![0-9]))/g, " ");
  return `R ${sign}${spaced}.${fraction}`;
}

export function displayName(info: {
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return [info.title, info.firstName, info.lastName]
    .filter((s) => !!s && s.length > 0)
    .join(" ");
}

function randomAccountNumber(): string {
  let d = "10";
  for (let i = 0; i < 9; i++) d += Math.floor(Math.random() * 10);
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7, 10)} ${d.slice(10)}`;
}

export type RegisterInput = {
  phoneNumber: string;
  pin: string;
  title: Title;
  firstName: string;
  lastName: string;
};

export async function register(input: RegisterInput): Promise<AccountInfo> {
  const existing = await fetchAccountInfo(input.phoneNumber);
  if (existing) {
    throw new Error("An account already exists for this phone number.");
  }
  const info: AccountInfo = {
    ...input,
    accountNumber: randomAccountNumber(),
    availableBalance: 0,
    latestBalance: 0,
  };
  await createAccount(info);
  return info;
}

const ACCOUNTS = "accounts";

export async function fetchAccountInfo(
  phoneNumber: string,
): Promise<AccountInfo | null> {
  const snap = await getDoc(doc(db, ACCOUNTS, phoneNumber));
  return snap.exists() ? (snap.data() as AccountInfo) : null;
}

export async function signIn(
  phoneNumber: string,
  pin: string,
): Promise<AccountInfo | null> {
  const info = await fetchAccountInfo(phoneNumber);
  if (!info || info.pin !== pin) return null;
  return info;
}

export async function createAccount(info: AccountInfo): Promise<void> {
  await setDoc(doc(db, ACCOUNTS, info.phoneNumber), info);
}

export async function updateAccountInfo(
  phoneNumber: string,
  partial: Partial<AccountInfo>,
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS, phoneNumber), partial);
}

export async function updateBalances(
  phoneNumber: string,
  availableBalance: number,
  latestBalance: number,
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS, phoneNumber), {
    availableBalance,
    latestBalance,
  });
}

export async function addTransaction(
  phoneNumber: string,
  tx: Transaction,
): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tx)) {
    if (v !== undefined) clean[k] = v;
  }
  clean.createdAt = serverTimestamp();
  await addDoc(collection(db, ACCOUNTS, phoneNumber, "transactions"), clean);
}

export async function fetchTransactions(
  phoneNumber: string,
): Promise<Transaction[]> {
  const q = query(
    collection(db, ACCOUNTS, phoneNumber, "transactions"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Transaction);
}

export async function saveBeneficiary(
  phoneNumber: string,
  ben: Omit<SavedBeneficiary, "id">,
): Promise<string> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ben)) {
    if (v !== undefined) clean[k] = v;
  }
  clean.createdAt = serverTimestamp();
  const ref = await addDoc(
    collection(db, ACCOUNTS, phoneNumber, "beneficiaries"),
    clean,
  );
  return ref.id;
}

export async function fetchBeneficiaries(
  phoneNumber: string,
): Promise<SavedBeneficiary[]> {
  const q = query(
    collection(db, ACCOUNTS, phoneNumber, "beneficiaries"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as object) }) as SavedBeneficiary,
  );
}
