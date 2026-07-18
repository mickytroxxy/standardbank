import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { Platform } from "react-native";
import { buildPaymentReference } from "./app/review-details";

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
  active: boolean;
};

export type Transaction = {
  id?: string;
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
  branchCode?: string;
  bankName?: string;
  myRef?: string;
  theirRef?: string;
  referenceNumber?: string;
  notificationValue?: string;
  notificationType?: string;
  proofContact?: string;
  senderName?: string;
  latitude?: number;
  longitude?: number;
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
  proofContact?: string;
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

export type Voucher = {
  id?: string;
  phone: string;
  amount: number;
  voucherNumber: string;
  pin: string;
  myRef: string;
  beneficiaryName: string;
  date: string;
};

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
    active: true,
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
  if (info.active === false) {
    throw new Error("Your account has been deactivated.");
  }
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
  return snap.docs.map(
    (d: any) => ({ id: d.id, ...(d.data() as object) }) as Transaction,
  );
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
    (d: any) => ({ id: d.id, ...(d.data() as object) }) as SavedBeneficiary,
  );
}

export async function saveVoucher(
  phoneNumber: string,
  v: Omit<Voucher, "id">,
): Promise<string> {
  const clean: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val !== undefined) clean[k] = val;
  }
  clean.createdAt = serverTimestamp();
  const ref = await addDoc(
    collection(db, ACCOUNTS, phoneNumber, "vouchers"),
    clean,
  );
  return ref.id;
}

export async function fetchVouchers(phoneNumber: string): Promise<Voucher[]> {
  const q = query(
    collection(db, ACCOUNTS, phoneNumber, "vouchers"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d: any) => ({ id: d.id, ...(d.data() as object) }) as Voucher,
  );
}

export async function deleteVoucherDoc(
  phoneNumber: string,
  voucherId: string,
): Promise<void> {
  await deleteDoc(doc(db, ACCOUNTS, phoneNumber, "vouchers", voucherId));
}

export async function updateVoucherPin(
  phoneNumber: string,
  voucherId: string,
  pin: string,
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS, phoneNumber, "vouchers", voucherId), {
    pin,
  });
}

export const sendSms = async (to: string, body: string): Promise<boolean> => {
  const username = "maggroup";
  const password = "M0t0r@cc1d3nt@#12";
  const stripped = to.replace(/\s/g, "").replace(/^(\+|00)/, "");
  const normalised = stripped.startsWith("0")
    ? `27${stripped.slice(1)}`
    : stripped;
  try {
    const res = await fetch("https://api.bulksms.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${username}:${password}`),
      },
      body: JSON.stringify({ to: [normalised], body, from: "011827374849" }),
    });
    console.log("message sent!!!!!", res, normalised);
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export function formatVoucherNumber(voucherNumber: string): string {
  if (voucherNumber.length !== 10) return voucherNumber;
  return `${voucherNumber.slice(0, 2)}_${voucherNumber.slice(2, 6)}_${voucherNumber.slice(6)}`;
}

export async function topUpUserAccount(
  adminPhoneNumber: string | null | undefined,
  userPhoneNumber: string,
  amount: number,
  reference: string,
): Promise<void> {
  const user = await fetchAccountInfo(userPhoneNumber);
  if (!user) {
    throw new Error("User account not found.");
  }

  const newAvailable = user.availableBalance + amount;
  const newLatest = user.latestBalance + amount;

  await updateBalances(userPhoneNumber, newAvailable, newLatest);

  const d = new Date();
  const date = `${d.getDate()} ${d.toLocaleString("en-US", {
    month: "short",
  })}`;
  const fullDate = `${d.getDate()} ${d.toLocaleString("en-US", {
    month: "long",
  })} ${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;

  await addTransaction(userPhoneNumber, {
    date,
    title: reference,
    sub: `PAYMENT RECEIVED`,
    amount: `+${amount.toFixed(2)}`,
    credit: true,
    fullDate,
    time,
    runningBalance: formatRand(newLatest),
    beneficiaryName:
      `${user.firstName} ${user.lastName}`.trim() || "Account Holder",
    account: user.accountNumber,
    myRef: reference,
    theirRef: adminPhoneNumber ?? "ADMIN",
    senderName: adminPhoneNumber ?? "Admin",
    referenceNumber: buildPaymentReference(d),
  });
}

// Admin helpers
export async function fetchAllAccounts(): Promise<
  (AccountInfo & { phoneNumber: string; active: boolean })[]
> {
  const snap = await getDocs(collection(db, ACCOUNTS));
  return snap.docs.map((d: any) => ({
    phoneNumber: d.id,
    ...(d.data() as any),
  }));
}

export async function deleteAccount(phoneNumber: string): Promise<void> {
  await deleteDoc(doc(db, ACCOUNTS, phoneNumber));
}

export async function setAccountActive(
  phoneNumber: string,
  active: boolean,
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS, phoneNumber), { active });
}

export async function migrateAllUsersToActive(): Promise<void> {
  const accounts = await fetchAllAccounts();
  for (const acc of accounts) {
    if (acc.active === undefined) {
      await updateDoc(doc(db, ACCOUNTS, acc.phoneNumber), { active: true });
    }
  }
}

export type AccountWithPhone = AccountInfo & {
  phoneNumber: string;
  active: boolean;
};

export function onAccountsUpdate(
  callback: (accounts: AccountWithPhone[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(collection(db, ACCOUNTS));
  const unsubscribe = onSnapshot(
    q,
    (snapshot: any) => {
      const accounts = snapshot.docs.map((d: any) => ({
        phoneNumber: d.id,
        ...(d.data() as Omit<AccountInfo, "phoneNumber">),
      })) as AccountWithPhone[];
      callback(accounts);
    },
    (error: any) => {
      if (onError) onError(error as Error);
    },
  );
  return unsubscribe;
}

export async function updateTransaction(
  phoneNumber: string,
  transactionId: string,
  partial: Partial<Transaction>,
): Promise<void> {
  await updateDoc(
    doc(db, ACCOUNTS, phoneNumber, "transactions", transactionId),
    partial,
  );
}

export async function deleteTransaction(
  phoneNumber: string,
  transactionId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, ACCOUNTS, phoneNumber, "transactions", transactionId),
  );
}
