declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export type FirebaseApp = any;
}
declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function collection(db: any, ...path: string[]): any;
  export function doc(db: any, ...path: string[]): any;
  export function addDoc(reference: any, data: any): Promise<any>;
  export function setDoc(reference: any, data: any, options?: any): Promise<void>;
  export function getDoc(reference: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function updateDoc(reference: any, data: any): Promise<void>;
  export function deleteDoc(reference: any): Promise<void>;
  export function onSnapshot(reference: any, onNext: any, onError?: any): any;
  export function query(reference: any, ...constraints: any[]): any;
  export function orderBy(fieldPath: string, directionStr?: "asc" | "desc"): any;
  export function serverTimestamp(): any;
  export type Firestore = any;
}
declare module 'firebase/analytics' {
  export function isSupported(): Promise<boolean>;
  export function getAnalytics(app?: any): any;
}
