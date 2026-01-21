import React, { useState, useEffect } from 'react';
import { addAnimal, updateAnimal, checkAnimalNumberExists } from '../services/animals';
import { FaTimes, FaCamera, FaImage } from 'react-icons/fa';

const DELIVERY_TYPES_CATTLE = ["Hisseli", "Karkas", "Ayaktan"];
const DELIVERY_TYPES_SHEEP = ["Ayaktan", "Karkas", "Parçalanmış"];

export default function AddAnimalModal({ isOpen, onClose, editData = null }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'büyükbaş',
        animalNumber: '', // Manuel girilecek
        name: '', // Küpe No / Tanım
        buyingPrice: '',
        totalPrice: '',
        totalShares: 7,
        deliveryType: 'Hisseli',
        photoUrl: '', // Base64 or URL
        queueNo: '',
        slaughterTime: '',
        notes: ''
    });

    // Otomatik numara kaldırıldı - Manuel girilecek

    // Edit modu veya Modal açılışı için effect
    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                buyingPrice: editData.buyingPrice || '',
                totalPrice: editData.totalPrice || '',
                totalShares: editData.totalShares || 7,
                animalNumber: editData.animalNumber || ''
            });
        } else {
            // Reset Default
            setFormData({
                type: 'büyükbaş',
                animalNumber: '',
                name: '',
                buyingPrice: '',
                totalPrice: '',
                totalShares: 7,
                deliveryType: 'Hisseli',
                photoUrl: '',
                queueNo: '',
                slaughterTime: '',
                notes: ''
            });
        }
    }, [editData, isOpen]);

    // Mantık: Tip veya Teslim Türü değişince Hisse sayısı güncellenecek
    useEffect(() => {
        if (formData.type === 'küçükbaş') {
            if (!DELIVERY_TYPES_SHEEP.includes(formData.deliveryType)) {
                setFormData(prev => ({ ...prev, deliveryType: 'Ayaktan', totalShares: 1 }));
            } else if (formData.totalShares !== 1) {
                setFormData(prev => ({ ...prev, totalShares: 1 }));
            }
        } else {
            // Büyükbaş
            if (!DELIVERY_TYPES_CATTLE.includes(formData.deliveryType)) {
                setFormData(prev => ({ ...prev, deliveryType: 'Hisseli', totalShares: 7 }));
            } else {
                if (formData.deliveryType !== 'Hisseli') {
                    if (formData.totalShares !== 1) setFormData(prev => ({ ...prev, totalShares: 1 }));
                }
            }
        }
    }, [formData.type, formData.deliveryType]);


    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await shrinkImage(file);
                setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
            } catch (error) {
                alert("Fotoğraf işlenirken hata oluştu: " + error.message);
            }
        }
    };

    // Helper to resize and compress image
    const shrinkImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max width/height logic (e.g. 800px)
                    const MAX_SIZE = 800;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation 1: Hayvan numarası boş olamaz
        if (!formData.animalNumber || formData.animalNumber === '') {
            alert("Hata: Hayvan numarası girilmesi zorunludur!");
            return;
        }

        // Validation 2: Hayvan numarası sadece sayı olmalı
        if (!/^[0-9]+$/.test(formData.animalNumber)) {
            alert("Hata: Hayvan numarası sadece rakamlardan oluşmalıdır!");
            return;
        }

        // Validation 3: Aynı kategoride aynı numara var mı?
        const exists = await checkAnimalNumberExists(
            formData.animalNumber,
            formData.type,
            editData?.id // Düzenleme modunda kendi ID'sini hariç tut
        );
        if (exists) {
            alert(`Hata: ${formData.type === 'büyükbaş' ? 'Büyükbaş' : 'Küçükbaş'} kategorisinde ${formData.animalNumber} numaralı hayvan zaten mevcut!`);
            return;
        }

        // Validation 4: Büyükbaş hisse limiti
        if (formData.type === 'büyükbaş' && formData.totalShares > 7) {
            alert("Hata: Büyükbaş hayvan için hisse sayısı en fazla 7 olabilir!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                animalNumber: Number(formData.animalNumber),
                buyingPrice: Number(formData.buyingPrice),
                totalPrice: Number(formData.totalPrice),
                totalShares: Number(formData.totalShares),
            };

            if (editData) {
                await updateAnimal(editData.id, payload);
            } else {
                await addAnimal(payload);
            }
            onClose();
        } catch (error) {
            alert("Hata: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isShareInputDisabled =
        formData.type === 'küçükbaş' ||
        (formData.type === 'büyükbaş' && formData.deliveryType !== 'Hisseli');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editData ? 'Hayvan Düzenle' : 'Yeni Hayvan Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

                    {/* Tür Seçimi */}
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio" name="type" value="büyükbaş"
                                checked={formData.type === 'büyükbaş'}
                                onChange={handleChange}
                                className="w-5 h-5 text-primary"
                            />
                            <span className="font-medium">Büyükbaş</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio" name="type" value="küçükbaş"
                                checked={formData.type === 'küçükbaş'}
                                onChange={handleChange}
                                className="w-5 h-5 text-primary"
                            />
                            <span className="font-medium">Küçükbaş</span>
                        </label>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Temel Bilgiler */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Hayvan No *</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                name="animalNumber"
                                required
                                placeholder="Örn: 1, 23, 45"
                                value={formData.animalNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sıra No</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="queueNo"
                                value={formData.queueNo}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Küpe No / Tanım</label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Örn: TR-1234 veya Sarı Kız"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kesim Saati</label>
                            <input
                                type="time"
                                name="slaughterTime"
                                value={formData.slaughterTime}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base bg-white"
                            />
                        </div>
                    </div>

                    {/* Teslim ve Hisse */}
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teslim Türü</label>
                            <select
                                name="deliveryType"
                                value={formData.deliveryType}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base bg-white"
                            >
                                {(formData.type === 'büyükbaş' ? DELIVERY_TYPES_CATTLE : DELIVERY_TYPES_SHEEP).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Hisse Sayısı</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                name="totalShares"
                                min="1"
                                max={formData.type === 'büyükbaş' ? 7 : 1}
                                required
                                disabled={isShareInputDisabled}
                                value={formData.totalShares}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base disabled:bg-gray-200 disabled:text-gray-500"
                            />
                            {isShareInputDisabled && <span className="text-[10px] text-gray-500 block mt-1">Bu seçimde sabittir.</span>}
                        </div>
                    </div>

                    {/* Fiyatlar */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Alış Fiyatı</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                name="buyingPrice"
                                value={formData.buyingPrice}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Satış Fiyatı (Toplam)</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                name="totalPrice"
                                required
                                value={formData.totalPrice}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 text-base font-bold text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Fotoğraf Yükleme (V3) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fotoğraf Ekle</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <FaImage className="text-3xl text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-600">GALERİDEN SEÇ</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>

                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <FaCamera className="text-3xl text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-600">KAMERA AÇ</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        {formData.photoUrl && (
                            <div className="mt-2 text-center relative">
                                <div className="inline-block relative">
                                    <img src={formData.photoUrl} alt="Preview" className="h-24 w-auto mx-auto rounded border" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                                        title="Fotoğrafı Sil"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                                <span className="text-xs text-green-600 block mt-1">Fotoğraf seçildi</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ekstra Notlar</label>
                        <textarea
                            name="notes"
                            rows="2"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 font-bold shadow-lg disabled:opacity-70 w-full sm:w-auto"
                        >
                            {loading ? 'Kaydediliyor...' : 'KAYDET'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
