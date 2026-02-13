import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals } from '../services/animals';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';
import { FaAddressBook, FaSearch, FaWhatsapp } from 'react-icons/fa';

export default function Customers() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Tüm hissedarları düz liste olarak çıkar
    const allCustomers = useMemo(() => {
        const customers = [];
        animals.forEach(animal => {
            const shares = animal.shares || [];
            shares.forEach(share => {
                if (share.isSold) {
                    const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);
                    customers.push({
                        name: share.customerName,
                        phone: share.customerPhone,
                        phone2: share.customerPhone2 || '',
                        animalNo: animal.animalNumber,
                        animalType: animal.type,
                        shareId: share.id,
                        paid: share.paidAmount,
                        sharePrice,
                        debt: sharePrice - share.paidAmount,
                        hasProxy: share.hasProxy,
                    });
                }
            });
        });
        return customers;
    }, [animals]);

    // Filtrelenmiş müşteriler
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return allCustomers;
        const term = searchTerm.toLowerCase();
        return allCustomers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term) ||
            String(c.animalNo).includes(term)
        );
    }, [allCustomers, searchTerm]);

    const totalDebt = useMemo(() => filteredCustomers.reduce((sum, c) => sum + Math.max(0, c.debt), 0), [filteredCustomers]);

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
                <FaAddressBook className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Müşteri Rehberi</h1>
                <span className="ml-auto bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-full">
                    {filteredCustomers.length} kişi
                </span>
            </div>

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

            {/* Toplam Borç Özeti */}
            {totalDebt > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
                    <span className="text-xs text-red-600 font-semibold">Toplam Kalan Borç: </span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalDebt)}</span>
                </div>
            )}

            {/* Müşteri Listesi */}
            <div className="space-y-2">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">
                        {searchTerm ? 'Sonuç bulunamadı.' : 'Henüz müşteri kaydı yok.'}
                    </div>
                ) : (
                    filteredCustomers.map((customer, idx) => (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900">{customer.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {customer.animalType === 'büyükbaş' ? 'B' : 'K'}-{customer.animalNo} / Hisse {customer.shareId}
                                        {customer.hasProxy && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 rounded text-[10px]">Vekalet</span>}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {customer.debt > 0 ? (
                                        <span className="text-sm font-bold text-red-600">{formatCurrency(customer.debt)} borç</span>
                                    ) : (
                                        <span className="text-sm font-bold text-green-600">ÖDENDİ</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center mt-2 space-x-2">
                                <a
                                    href={`https://wa.me/90${customer.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center hover:bg-green-200"
                                >
                                    <FaWhatsapp className="mr-1" /> {customer.phone}
                                </a>
                                {customer.phone2 && (
                                    <a
                                        href={`https://wa.me/90${customer.phone2.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center hover:bg-green-200"
                                    >
                                        <FaWhatsapp className="mr-1" /> {customer.phone2}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
