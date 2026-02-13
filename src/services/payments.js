import { db } from "../firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    where,
    getDocs,
    limit
} from "firebase/firestore";

const COLLECTION_NAME = "payments";

// Ödeme kaydet
export const addPayment = async (paymentData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...paymentData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding payment:", error);
        throw error;
    }
};

// Tüm ödemeleri dinle (son 200)
export const subscribeToPayments = (callback) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(payments);
    });
};

// Belirli bir hayvan+hisse için ödemeleri getir
export const getPaymentsForShare = async (animalId, shareId) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("animalId", "==", animalId),
            where("shareId", "==", shareId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting payments for share:", error);
        return [];
    }
};
