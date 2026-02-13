import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals, updateAnimal } from '../services/animals';
import { addPayment, subscribeToPayments } from '../services/payments';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';
import { FaMoneyBillWave, FaSearch, FaCheck, FaTimes, FaHistory, FaArrowRight } from 'react-icons/fa';
import clsx from 'clsx';

export default function Payments() {
    const [animals, setAnimals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentReceiver, setPaymentReceiver] = useState('Salih');
    const [paymentMethod, setPaymentMethod] = useState('Nakit');
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const unsub1 = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        const unsub2 = subscribeToPayments((data) => {
            setPayments(data);
        });
        return () => { unsub1(); unsub2(); };
    }, []);

    // Tüm borçlu müşterileri çıkar
    const debtCustomers = useMemo(() => {
        const customers = [];
        animals.forEach(animal => {
            const shares = animal.shares || [];
            const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);
            shares.forEach(share => {
                if (share.isSold) {
                    const debt = sharePrice - share.paidAmount;
                    customers.push({
                        name: share.customerName,
                        phone: share.customerPhone,
                        animalId: animal.id,
                        animalNo: animal.animalNumber,
                        animalType: animal.type,
                        shareId: share.id,
                        sharePrice,
                        paid: share.paidAmount,
                        debt: Math.max(0, debt),
                        queueNo: animal.queueNo,
                    });
                }
            });
        });
        return customers;
    }, [animals]);

    // Filtreleme
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return debtCustomers.filter(c => c.debt > 0);
        const term = searchTerm.toLowerCase();
        return debtCustomers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term) ||
            String(c.animalNo).includes(term)
        );
    }, [debtCustomers, searchTerm]);

    // Ödeme amountundaki nokta/virgülleri binlik ayracı olarak kabul et
    const parseAmount = (value) => {
        if (!value) return 0;
        return Number(String(value).replace(/[.,]/g, ''));
    };

    const handleAmountChange = (value) => {
        const cleaned = value.replace(/[.,]/g, '').replace(/[^0-9]/g, '');
        setPaymentAmount(cleaned);
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setPaymentAmount('');
        setSuccessMessage('');
    };

    const handlePaymentSubmit = async () => {
        if (!selectedCustomer) return;
        const amount = parseAmount(paymentAmount);
        if (amount <= 0) {
            alert('Lütfen geçerli bir tutar giriniz.');
            return;
        }
        if (amount > selectedCustomer.debt) {
            alert(`Girilen tutar kalan borçtan (${formatCurrency(selectedCustomer.debt)}) fazla olamaz.`);
            return;
        }

        setSaving(true);
        try {
            // 1. Ödeme kaydı oluştur
            await addPayment({
                animalId: selectedCustomer.animalId,
                animalNo: selectedCustomer.animalNo,
                animalType: selectedCustomer.animalType,
                shareId: selectedCustomer.shareId,
                customerName: selectedCustomer.name,
                customerPhone: selectedCustomer.phone,
                amount: amount,
                receiver: paymentReceiver,
                method: paymentMethod,
            });

            // 2. Hayvandaki share'in paidAmount'unu güncelle
            const animal = animals.find(a => a.id === selectedCustomer.animalId);
            if (animal) {
                const updatedShares = (animal.shares || []).map(s => {
                    if (s.id === selectedCustomer.shareId) {
                        return { ...s, paidAmount: s.paidAmount + amount };
                    }
                    return s;
                });
                await updateAnimal(selectedCustomer.animalId, { shares: updatedShares });
            }

            setSuccessMessage(`${selectedCustomer.name} için ${formatCurrency(amount)} ödeme kaydedildi!`);
            setPaymentAmount('');
            setSelectedCustomer(null);

            // 3 saniye sonra mesajı kaldır
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Ödeme geçmişi için tarih formatı
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            {/* Başlık + Tab */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <FaMoneyBillWave className="text-2xl text-gray-400 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-900">Ödeme Al</h1>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={clsx(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                        showHistory
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                >
                    <FaHistory className="mr-1.5" />
                    {showHistory ? 'Ödeme Al' : 'Geçmiş'}
                </button>
            </div>

            {/* Başarı Mesajı */}
            {successMessage && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-4 flex items-center animate-pulse">
                    <FaCheck className="text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-green-700 font-semibold text-sm">{successMessage}</span>
                </div>
            )}

            {showHistory ? (
                /* ============ ÖDEME GEÇMİŞİ ============ */
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-800">Ödeme Geçmişi</h2>
                        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                            {payments.length} kayıt
                        </span>
                    </div>

                    {payments.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic">Henüz ödeme kaydı yok.</div>
                    ) : (
                        <div className="space-y-2">
                            {payments.map(payment => (
                                <div key={payment.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900">{payment.customerName}</p>
                                            <p className="text-xs text-gray-500">
                                                {payment.animalType === 'büyükbaş' ? 'B' : 'K'}-{payment.animalNo} / Hisse {payment.shareId}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">+{formatCurrency(payment.amount)}</p>
                                            <p className="text-[10px] text-gray-400">{formatDate(payment.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 text-[10px]">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                            Alan: {payment.receiver}
                                        </span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                            {payment.method === 'Nakit' ? '💵 Nakit' : '🏦 IBAN'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ============ ÖDEME AL ============ */
                <div>
                    {/* Seçili Müşteri - Ödeme Formu */}
                    {selectedCustomer ? (
                        <div className="bg-white rounded-xl border-2 border-primary shadow-md p-4 mb-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Ödeme Alınacak Kişi</p>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedCustomer.animalType === 'büyükbaş' ? 'B' : 'K'}-{selectedCustomer.animalNo} / Hisse {selectedCustomer.shareId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>

                            {/* Borç Durumu */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-blue-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-blue-600">Hisse Bedeli</p>
                                    <p className="font-bold text-blue-700 text-sm">{formatCurrency(selectedCustomer.sharePrice)}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-green-600">Ödenen</p>
                                    <p className="font-bold text-green-700 text-sm">{formatCurrency(selectedCustomer.paid)}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-red-600">Kalan Borç</p>
                                    <p className="font-bold text-red-700 text-sm">{formatCurrency(selectedCustomer.debt)}</p>
                                </div>
                            </div>

                            {selectedCustomer.debt <= 0 ? (
                                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                                    <FaCheck className="text-green-600 mx-auto mb-1" />
                                    <p className="text-green-700 font-bold">Bu hisse tamamen ödenmiş!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Tutar Girişi */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahsil Edilecek Tutar (TL)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={paymentAmount}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            placeholder="Örn: 5000"
                                            className="w-full border-2 border-gray-300 rounded-xl p-4 text-2xl font-bold text-center focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                            autoFocus
                                        />
                                        {/* Hızlı butonlar */}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => setPaymentAmount(String(selectedCustomer.debt))}
                                                className="flex-1 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100"
                                            >
                                                Tamamını Öde: {formatCurrency(selectedCustomer.debt)}
                                            </button>
                                            <button
                                                onClick={() => setPaymentAmount(String(Math.round(selectedCustomer.debt / 2)))}
                                                className="flex-1 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100"
                                            >
                                                Yarısı: {formatCurrency(Math.round(selectedCustomer.debt / 2))}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Alan Kişi & Yöntem */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alan Kişi</label>
                                            <select
                                                value={paymentReceiver}
                                                onChange={(e) => setPaymentReceiver(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                            >
                                                <option>Salih</option>
                                                <option>Kadir</option>
                                                <option>Hacı</option>
                                                <option>Erdem</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Yöntem</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                            >
                                                <option>Nakit</option>
                                                <option>Kendi IBAN'ıma</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Ödemeyi Kaydet Butonu */}
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={saving || !paymentAmount}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {saving ? 'Kaydediliyor...' : (
                                            <>
                                                <FaCheck className="mr-2" />
                                                ÖDEMEYİ KAYDET
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    ) : null}

                    {/* Arama */}
                    <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="İsim, telefon veya hayvan no ile ara..."
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-base focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    {/* Borçlu Liste */}
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold text-gray-500 uppercase">
                            {searchTerm ? 'Arama Sonuçları' : 'Borçlu Müşteriler'}
                        </h2>
                        <span className="text-xs text-gray-400">{filteredCustomers.length} kişi</span>
                    </div>

                    <div className="space-y-2">
                        {filteredCustomers.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic">
                                {searchTerm ? 'Sonuç bulunamadı.' : 'Borçlu müşteri yok 🎉'}
                            </div>
                        ) : (
                            filteredCustomers.map((customer, idx) => (
                                <div
                                    key={`${customer.animalId}-${customer.shareId}-${idx}`}
                                    onClick={() => handleSelectCustomer(customer)}
                                    className={clsx(
                                        "bg-white rounded-lg border p-3 shadow-sm cursor-pointer transition-colors",
                                        selectedCustomer?.animalId === customer.animalId &&
                                            selectedCustomer?.shareId === customer.shareId
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">{customer.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {customer.animalType === 'büyükbaş' ? 'B' : 'K'}-{customer.animalNo}
                                                {customer.queueNo ? ` • Sıra: ${customer.queueNo}` : ''}
                                                {' '}/ Hisse {customer.shareId}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {customer.debt > 0 ? (
                                                <span className="text-sm font-bold text-red-600">
                                                    {formatCurrency(customer.debt)}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-green-600">ÖDENDİ</span>
                                            )}
                                            <FaArrowRight className="text-gray-300 text-xs" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
