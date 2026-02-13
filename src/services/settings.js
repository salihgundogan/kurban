import { db } from "../firebase";
import {
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";

const SETTINGS_DOC = "settings/global";

export const getSettings = async () => {
    try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        // Varsayılan ayarlar
        const defaults = {
            teamMembers: ['Salih', 'Kadir', 'Hacı', 'Erdem'],
            iban: '',
            slaughterAddress: 'https://maps.app.goo.gl/71EXtmmpnfNTkx66A',
            whatsappTemplate: 'Merhaba {customerName},\n\n{slaughterTime}{debtInfo}Kesim yerimiz: {address}\n\nHayırlı bayramlar 🌙'
        };
        return defaults;
    } catch (error) {
        console.error("Error getting settings:", error);
        return null;
    }
};

export const updateSettings = async (data) => {
    try {
        const docRef = doc(db, "settings", "global");
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};
