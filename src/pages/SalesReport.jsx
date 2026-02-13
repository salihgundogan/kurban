import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals } from '../services/animals';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';
import { FaChartBar } from 'react-icons/fa';

export default function SalesReport() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Kişi bazlı satış verileri
    const salesByPerson = useMemo(() => {
        const personMap = {};

        animals.forEach(animal => {
            const shares = animal.shares || [];
            const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);

            shares.forEach(share => {
                if (share.isSold) {
                    const receiver = share.paymentReceiver || 'Bilinmiyor';
                    if (!personMap[receiver]) {
                        personMap[receiver] = {
                            name: receiver,
                            totalSales: 0,
                            totalCollected: 0,
                            totalDebt: 0,
                            cashAmount: 0,
                            ibanAmount: 0,
                            shareCount: 0,
                        };
                    }
                    const p = personMap[receiver];
                    p.shareCount += 1;
                    p.totalSales += sharePrice;
                    p.totalCollected += share.paidAmount;
                    p.totalDebt += Math.max(0, sharePrice - share.paidAmount);

                    if (share.paymentMethod === 'Nakit') {
                        p.cashAmount += share.paidAmount;
                    } else {
                        p.ibanAmount += share.paidAmount;
                    }
                }
            });
        });

        return Object.values(personMap).sort((a, b) => b.totalCollected - a.totalCollected);
    }, [animals]);

    const totals = useMemo(() => {
        return salesByPerson.reduce((acc, p) => ({
            shareCount: acc.shareCount + p.shareCount,
            totalSales: acc.totalSales + p.totalSales,
            totalCollected: acc.totalCollected + p.totalCollected,
            totalDebt: acc.totalDebt + p.totalDebt,
            cashAmount: acc.cashAmount + p.cashAmount,
            ibanAmount: acc.ibanAmount + p.ibanAmount,
        }), { shareCount: 0, totalSales: 0, totalCollected: 0, totalDebt: 0, cashAmount: 0, ibanAmount: 0 });
    }, [salesByPerson]);

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
                <FaChartBar className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Satış Raporu</h1>
            </div>

            {/* Genel Özet */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 font-semibold">Toplam Tahsilat</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(totals.totalCollected)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 font-semibold">Kalan Borç</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(totals.totalDebt)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 font-semibold">Satılan Hisse</p>
                    <p className="text-lg font-bold text-blue-700">{totals.shareCount}</p>
                </div>
            </div>

            {/* Ödeme Yöntemi Dağılımı */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold">💵 Nakit Tahsilat</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(totals.cashAmount)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold">🏦 IBAN Tahsilat</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(totals.ibanAmount)}</p>
                </div>
            </div>

            {/* Kişi Bazlı Detay */}
            <h2 className="text-lg font-bold text-gray-800 mb-3">Kişi Bazlı Satışlar</h2>
            <div className="space-y-3">
                {salesByPerson.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">Henüz satış kaydı yok.</div>
                ) : (
                    salesByPerson.map((person) => (
                        <div key={person.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                                    {person.shareCount} hisse
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-green-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-green-600">Tahsilat</p>
                                    <p className="font-bold text-green-700">{formatCurrency(person.totalCollected)}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-red-600">Kalan Borç</p>
                                    <p className="font-bold text-red-700">{formatCurrency(person.totalDebt)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-500">💵 Nakit</p>
                                    <p className="font-bold text-gray-700">{formatCurrency(person.cashAmount)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-500">🏦 IBAN</p>
                                    <p className="font-bold text-gray-700">{formatCurrency(person.ibanAmount)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
