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
    limit,
    getDocs,
    serverTimestamp
} from "firebase/firestore";

const COLLECTION_NAME = "animals";

// Son hayvan numarasını getir
export const getLastAnimalNumber = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("animalNumber", "desc"), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data().animalNumber || 0;
        }
        return 0;
    } catch (error) {
        console.error("Error getting last animal number:", error);
        return 0;
    }
};

// Hayvan numarasının aynı kategoride (type) var olup olmadığını kontrol et
export const checkAnimalNumberExists = async (animalNumber, type, excludeId = null) => {
    try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const exists = snapshot.docs.some(doc => {
            const data = doc.data();
            // Eğer düzenleme modundaysa, kendi ID'sini hariç tut
            if (excludeId && doc.id === excludeId) return false;
            // Aynı tip ve aynı numara varsa true döndür
            return data.type === type && data.animalNumber === Number(animalNumber);
        });
        return exists;
    } catch (error) {
        console.error("Error checking animal number:", error);
        return false;
    }
};

// Anlık veri dinleme (Real-time updates)
export const subscribeToAnimals = (callback) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const animals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(animals);
    });
};

export const addAnimal = async (animalData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...animalData,
            createdAt: serverTimestamp(),
            soldShares: 0, // Başlangıçta 0
            shares: [] // Hisse sahipleri listesi
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding animal: ", error);
        throw error;
    }
};

export const updateAnimal = async (id, data) => {
    try {
        const animalRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(animalRef, data);
    } catch (error) {
        console.error("Error updating animal: ", error);
        throw error;
    }
};

export const deleteAnimal = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting animal: ", error);
        throw error;
    }
};
