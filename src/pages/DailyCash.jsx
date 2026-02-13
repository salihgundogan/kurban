import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals } from '../services/animals';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';
import { FaCashRegister } from 'react-icons/fa';

export default function DailyCash() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const cashData = useMemo(() => {
        let totalExpected = 0;  // Toplam satış bedeli
        let totalCollected = 0; // Toplam tahsilat
        let totalDebt = 0;      // Toplam borç
        let cashTotal = 0;      // Nakit tahsilat
        let ibanTotal = 0;      // IBAN tahsilat
        const byPerson = {};

        animals.forEach(animal => {
            const shares = animal.shares || [];
            const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);

            shares.forEach(share => {
                if (share.isSold) {
                    totalExpected += sharePrice;
                    totalCollected += share.paidAmount;
                    totalDebt += Math.max(0, sharePrice - share.paidAmount);

                    const receiver = share.paymentReceiver || 'Bilinmiyor';
                    if (!byPerson[receiver]) {
                        byPerson[receiver] = { cash: 0, iban: 0, total: 0, shareCount: 0 };
                    }
                    byPerson[receiver].total += share.paidAmount;
                    byPerson[receiver].shareCount += 1;

                    if (share.paymentMethod === 'Nakit') {
                        cashTotal += share.paidAmount;
                        byPerson[receiver].cash += share.paidAmount;
                    } else {
                        ibanTotal += share.paidAmount;
                        byPerson[receiver].iban += share.paidAmount;
                    }
                }
            });
        });

        return {
            totalExpected,
            totalCollected,
            totalDebt,
            cashTotal,
            ibanTotal,
            byPerson: Object.entries(byPerson)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.total - a.total),
            collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0,
        };
    }, [animals]);

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
                <FaCashRegister className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Günlük Kasa</h1>
            </div>

            {/* Ana Durum */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tahsilat Oranı</span>
                        <span className="font-bold">%{cashData.collectionRate}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-primary to-emerald-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, cashData.collectionRate)}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 font-semibold">Beklenen Toplam</p>
                        <p className="text-lg font-bold text-blue-700">{formatCurrency(cashData.totalExpected)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600 font-semibold">Tahsil Edilen</p>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(cashData.totalCollected)}</p>
                    </div>
                </div>

                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 font-semibold">Kalan Borç</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(cashData.totalDebt)}</p>
                </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="text-3xl mb-1">💵</div>
                    <p className="text-xs text-gray-500 font-semibold">Nakit Kasa</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(cashData.cashTotal)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="text-3xl mb-1">🏦</div>
                    <p className="text-xs text-gray-500 font-semibold">IBAN Tahsilat</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(cashData.ibanTotal)}</p>
                </div>
            </div>

            {/* Kişi Bazlı */}
            <h2 className="text-lg font-bold text-gray-800 mb-3">Kişi Bazlı Tahsilat</h2>
            <div className="space-y-2">
                {cashData.byPerson.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">Henüz tahsilat kaydı yok.</div>
                ) : (
                    cashData.byPerson.map((person) => (
                        <div key={person.name} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-900">{person.name}</h3>
                                <span className="text-lg font-bold text-primary">{formatCurrency(person.total)}</span>
                            </div>
                            <div className="flex gap-3 text-xs">
                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    💵 Nakit: {formatCurrency(person.cash)}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    🏦 IBAN: {formatCurrency(person.iban)}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    📋 {person.shareCount} hisse
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
