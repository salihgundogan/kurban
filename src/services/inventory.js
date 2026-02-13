import { db } from "../firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";

const COLLECTION_NAME = "inventory";

// Anlık veri dinleme
export const subscribeToInventory = (callback) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    });
};

export const addInventoryItem = async (itemData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...itemData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding inventory item:", error);
        throw error;
    }
};

export const updateInventoryItem = async (id, data) => {
    try {
        const itemRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(itemRef, data);
    } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
    }
};

export const deleteInventoryItem = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting inventory item:", error);
        throw error;
    }
};
