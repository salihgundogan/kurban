import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { updateAnimal, deleteAnimal } from '../services/animals';
import { calculateSharePrice, formatCurrency } from '../utils/helpers';
import { FaArrowLeft, FaWhatsapp, FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import AddAnimalModal from '../components/AddAnimalModal';

export default function AnimalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [editAnimalOpen, setEditAnimalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Share Form State
    const [editingShareId, setEditingShareId] = useState(null);
    const [shareForm, setShareForm] = useState({
        name: '',
        phone1: '',
        phone2: '',
        hasProxy: false,
        paidAmount: '',
        paymentReceiver: 'Salih',
        paymentMethod: 'Nakit'
    });

    useEffect(() => {
        const docRef = doc(db, 'animals', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setAnimal({ id: docSnap.id, ...docSnap.data() });
            } else {
                navigate('/dashboard');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, navigate]);

    if (loading || !animal) return <div className="p-4 text-center">Yükleniyor...</div>;

    const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);
    const shares = animal.shares || [];

    // --- Share Management Logic ---

    const openShareModal = (shareId, existingData = null) => {
        setEditingShareId(shareId);
        if (existingData) {
            setShareForm({
                name: existingData.customerName || '',
                phone1: existingData.customerPhone || '',
                phone2: existingData.customerPhone2 || '',
                hasProxy: existingData.hasProxy || false,
                paidAmount: existingData.paidAmount || 0,
                paymentReceiver: existingData.paymentReceiver || 'Salih',
                paymentMethod: existingData.paymentMethod || 'Nakit'
            });
        } else {
            setShareForm({
                name: '', phone1: '', phone2: '', hasProxy: false,
                paidAmount: '', paymentReceiver: 'Salih', paymentMethod: 'Nakit'
            });
        }
        setShareModalOpen(true);
    };

    const handleShareSubmit = async (e) => {
        e.preventDefault();

        // 1. Validation: Name (Letters only)
        const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/;
        if (!nameRegex.test(shareForm.name)) {
            alert("Hata: İsim soyisim sadece harflerden oluşmalıdır!");
            return;
        }

        // 2. Validation: Payment (Paid > Total Price)
        const totalSharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);
        const paidAmountNum = parsePaidAmount(shareForm.paidAmount);
        if (paidAmountNum > totalSharePrice) {
            alert("Hata: Ödenen miktar, hisse bedelinden büyük olamaz!");
            return;
        }

        try {
            let newShares = [...shares].filter(s => s.id !== editingShareId);

            const newShareItem = {
                id: editingShareId,
                customerName: shareForm.name,
                customerPhone: shareForm.phone1,
                customerPhone2: shareForm.phone2,
                hasProxy: shareForm.hasProxy,
                paidAmount: paidAmountNum,
                paymentReceiver: shareForm.paymentReceiver,
                paymentMethod: shareForm.paymentMethod,
                isSold: true
            };

            newShares.push(newShareItem);
            newShares.sort((a, b) => a.id - b.id);

            await updateAnimal(id, {
                shares: newShares,
                soldShares: newShares.length
            });
            setShareModalOpen(false);
        } catch (error) {
            alert("Hata: " + error.message);
        }
    };

    // Input Handlers for Validation
    const handleNameChange = (e) => {
        // Allow only letters
        if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(e.target.value) || e.target.value === '') {
            setShareForm({ ...shareForm, name: e.target.value });
        }
    };

    const handlePhoneChange = (field, value) => {
        // Allow only numbers
        if (/^[0-9]*$/.test(value) || value === '') {
            setShareForm({ ...shareForm, [field]: value });
        }
    };

    // Ödenen miktar için handler - nokta ve virgülleri binlik ayracı olarak kabul edip siler
    const handlePaidAmountChange = (value) => {
        // Nokta ve virgülleri kaldır, sadece rakamlara izin ver
        const cleanedValue = value.replace(/[.,]/g, '').replace(/[^0-9]/g, '');
        setShareForm({ ...shareForm, paidAmount: cleanedValue });
    };

    // paidAmount'u sayıya çevirmek için helper
    const parsePaidAmount = (value) => {
        if (!value) return 0;
        return Number(String(value).replace(/[.,]/g, ''));
    };

    const handleDeleteShare = async (shareId) => {
        if (!window.confirm("Hisse kaydını silmek istiyor musunuz?")) return;
        const newShares = shares.filter(s => s.id !== shareId);
        await updateAnimal(id, { shares: newShares, soldShares: newShares.length });
    };

    const handleDeleteAnimal = async () => {
        if (!window.confirm("BU HAYVANI KOMPLE SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?")) return;
        await deleteAnimal(id);
        navigate('/dashboard');
    }

    // --- UI ---

    const shareRows = [];
    for (let i = 1; i <= animal.totalShares; i++) {
        shareRows.push({ id: i, data: shares.find(s => s.id === i) });
    }

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => {
                        if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            navigate('/dashboard');
                        }
                    }}
                    className="text-gray-600 flex items-center font-medium p-2 -ml-2 active:opacity-60 transition-opacity"
                >
                    <FaArrowLeft className="mr-2" /> Listeye Dön
                </button>
                <button
                    onClick={() => setEditAnimalOpen(true)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded flex items-center text-sm font-bold"
                >
                    <FaEdit className="mr-1" /> DÜZENLE
                </button>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                {/* Cover Photo */}
                <div className="h-48 bg-gray-200 relative">
                    {animal.photoUrl ? (
                        <img src={animal.photoUrl} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Görsel Yok</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-sm">
                        {animal.deliveryType}
                    </div>
                </div>

                {/* Details */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{animal.name}</h1>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-primary">{formatCurrency(animal.totalPrice)}</span>
                            <span className="text-xs text-gray-500">Toplam Fiyat</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                        <div>
                            <span className="block text-xs text-gray-500">Sıra No</span>
                            <span className="font-semibold text-gray-800">{animal.queueNo || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Tahmini Kesim Saati</span>
                            <span className="font-semibold text-gray-800">{animal.slaughterTime || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Hisse Başına</span>
                            <span className="font-bold text-green-700 text-lg">{formatCurrency(sharePrice)}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Alış Fiyatı</span>
                            <span className="font-semibold text-gray-600 text-sm">
                                {animal.buyingPrice ? formatCurrency(animal.buyingPrice) : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Ağırlık Bilgileri */}
                    {(animal.liveWeight || animal.carcassWeight) ? (
                        <div className="grid grid-cols-3 gap-4 bg-amber-50 p-3 rounded-lg border border-amber-200 mb-2">
                            <div>
                                <span className="block text-xs text-amber-700 font-semibold">Canlı Ağırlık</span>
                                <span className="font-bold text-gray-900 text-lg">{animal.liveWeight ? `${animal.liveWeight} kg` : '-'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-amber-700 font-semibold">Karkas Ağırlık</span>
                                <span className="font-bold text-gray-900 text-lg">{animal.carcassWeight ? `${animal.carcassWeight} kg` : '-'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-amber-700 font-semibold">Kemikli Hisse</span>
                                <span className="font-bold text-amber-800 text-lg">
                                    {animal.carcassWeight && animal.totalShares > 0
                                        ? `${(animal.carcassWeight / animal.totalShares).toFixed(2)} kg`
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    ) : null}

                    {animal.notes && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-100">
                            <strong>Not:</strong> {animal.notes}
                        </div>
                    )}

                    <div className="mt-4 pt-2 border-t text-right">
                        <button onClick={handleDeleteAnimal} className="text-red-400 text-xs underline hover:text-red-600">Bu Kaydı Sil</button>
                    </div>
                </div>
            </div>

            {/* SHARES LIST */}
            <h2 className="text-xl font-bold text-gray-800 mb-3 px-1">Hissedarlar ({animal.soldShares}/{animal.totalShares})</h2>
            <div className="space-y-3">
                {shareRows.map(({ id: sId, data }) => {
                    const isSold = !!data;
                    const remainingDebt = isSold ? sharePrice - data.paidAmount : sharePrice;

                    return (
                        <div key={sId} className={clsx("border rounded-lg overflow-hidden", isSold ? "bg-white border-green-200 shadow-sm" : "bg-gray-50 border-dashed border-gray-300")}>
                            {/* Header Row of Share */}
                            <div
                                onClick={() => !isSold && openShareModal(sId)}
                                className={clsx("p-3 flex justify-between items-center cursor-pointer", !isSold && "hover:bg-gray-100")}
                            >
                                <div className="flex items-center">
                                    <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center mr-3">
                                        {sId}
                                    </span>
                                    {isSold ? (
                                        <div>
                                            <p className="font-bold text-gray-900">{data.customerName}</p>
                                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                                                <span>{data.customerPhone}</span>
                                                {data.hasProxy && <span className="bg-blue-100 text-blue-800 px-1.5 rounded-[3px]">Vekalet Var</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 font-medium">-- Boş Hisse --</span>
                                    )}
                                </div>

                                <div className="text-right">
                                    {isSold ? (
                                        <div>
                                            <p className={clsx("font-bold", remainingDebt > 0 ? "text-red-600" : "text-green-600")}>
                                                {remainingDebt > 0 ? `${formatCurrency(remainingDebt)} Borç` : "ÖDENDİ"}
                                            </p>
                                            <p className="text-[10px] text-gray-500">Alan: {data.paymentReceiver}</p>
                                        </div>
                                    ) : (
                                        <FaUserPlus className="text-gray-300 text-xl" />
                                    )}
                                </div>
                            </div>

                            {/* Actions / Details if Sold */}
                            {isSold && (
                                <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex space-x-1">
                                        {/* WhatsApp Buttons */}
                                        <button onClick={() => {
                                            const customerName = data.customerName || 'Değerli Müşterimiz';
                                            const slaughterTime = animal.slaughterTime ? `Kurbanınız ${animal.slaughterTime} civarında kesilecektir.\n` : '';
                                            const remainingDebt = sharePrice - data.paidAmount;
                                            const debtInfo = remainingDebt > 0 ? `Kalan borcunuz: ${remainingDebt.toLocaleString('tr-TR')} TL\n\nÖdeme için IBAN bilgisi isteyebilir veya nakit vermek için bizimle iletişime geçebilirsiniz.\n\n` : '';
                                            const msg = `Merhaba ${customerName},\n\n${slaughterTime}${debtInfo}Kesim yerimiz: https://maps.app.goo.gl/71EXtmmpnfNTkx66A\n\nHayırlı bayramlar 🌙`;
                                            window.open(`https://wa.me/90${data.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
                                        }} className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 text-xs flex items-center font-bold">
                                            <FaWhatsapp className="mr-1" /> Tel 1
                                        </button>

                                        {data.customerPhone2 && (
                                            <button onClick={() => {
                                                const customerName = data.customerName || 'Değerli Müşterimiz';
                                                const slaughterTime = animal.slaughterTime ? `Kurbanınız ${animal.slaughterTime} civarında kesilecektir.\n` : '';
                                                const remainingDebt = sharePrice - data.paidAmount;
                                                const debtInfo = remainingDebt > 0 ? `Kalan borcunuz: ${remainingDebt.toLocaleString('tr-TR')} TL\n\nÖdeme için IBAN bilgisi isteyebilir veya nakit vermek için bizimle iletişime geçebilirsiniz.\n\n` : '';
                                                const msg = `Merhaba ${customerName},\n\n${slaughterTime}${debtInfo}Kesim yerimiz: https://maps.app.goo.gl/71EXtmmpnfNTkx66A\n\nHayırlı bayramlar 🌙`;
                                                window.open(`https://wa.me/90${data.customerPhone2.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
                                            }} className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 text-xs flex items-center font-bold">
                                                <FaWhatsapp className="mr-1" /> Tel 2
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button onClick={() => openShareModal(sId, data)} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteShare(sId)} className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Edit Animal Modal */}
            <AddAnimalModal
                isOpen={editAnimalOpen}
                onClose={() => setEditAnimalOpen(false)}
                editData={animal}
            />

            {/* Customer / Share Modal */}
            {shareModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex justify-between">
                            <h3 className="font-bold text-gray-800">Hisse {editingShareId} Detayları</h3>
                            <button onClick={() => setShareModalOpen(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleShareSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                    value={shareForm.name}
                                    onChange={handleNameChange}
                                    placeholder="Sadece harf giriniz"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tel 1</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                        value={shareForm.phone1}
                                        onChange={(e) => handlePhoneChange('phone1', e.target.value)}
                                        placeholder="5XX..."
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tel 2</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                        value={shareForm.phone2}
                                        onChange={(e) => handlePhoneChange('phone2', e.target.value)}
                                        placeholder="5XX..."
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <input type="checkbox" id="proxy" className="w-6 h-6 text-primary rounded focus:ring-primary" checked={shareForm.hasProxy} onChange={e => setShareForm({ ...shareForm, hasProxy: e.target.checked })} />
                                <label htmlFor="proxy" className="ml-3 font-medium text-gray-700 text-base">Vekaleti Alındı</label>
                            </div>

                            <hr className="border-gray-200" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ödenen (TL)</label>
                                    <input type="text" inputMode="numeric" required className="w-full border border-gray-300 rounded-lg p-3 text-base font-bold text-gray-900" value={shareForm.paidAmount} onChange={e => handlePaidAmountChange(e.target.value)} placeholder="Örn: 10000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kalan Borç</label>
                                    <div className="w-full bg-gray-100 p-3 rounded-lg text-red-600 font-bold border border-gray-200 flex items-center h-[50px]">
                                        {formatCurrency(sharePrice - parsePaidAmount(shareForm.paidAmount))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alan Kişi</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 text-base" value={shareForm.paymentReceiver} onChange={e => setShareForm({ ...shareForm, paymentReceiver: e.target.value })}>
                                        <option>Salih</option>
                                        <option>Kadir</option>
                                        <option>Hacı</option>
                                        <option>Erdem</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Yöntem</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 text-base" value={shareForm.paymentMethod} onChange={e => setShareForm({ ...shareForm, paymentMethod: e.target.value })}>
                                        <option>Nakit</option>
                                        <option>Kendi IBAN'ıma</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3">
                                <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700">
                                    KAYDET
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
