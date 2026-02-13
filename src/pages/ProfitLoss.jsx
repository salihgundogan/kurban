import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals } from '../services/animals';
import { formatCurrency } from '../utils/helpers';
import { FaBalanceScale } from 'react-icons/fa';
import clsx from 'clsx';

export default function ProfitLoss() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const animalProfits = useMemo(() => {
        return animals
            .filter(a => a.buyingPrice && a.totalPrice)
            .map(a => ({
                id: a.id,
                animalNo: a.animalNumber,
                type: a.type,
                name: a.name,
                buyingPrice: a.buyingPrice,
                totalPrice: a.totalPrice,
                profit: a.totalPrice - a.buyingPrice,
                soldShares: a.soldShares,
                totalShares: a.totalShares,
                isSoldOut: a.soldShares === a.totalShares,
            }))
            .sort((a, b) => b.profit - a.profit);
    }, [animals]);

    const totals = useMemo(() => {
        return animalProfits.reduce((acc, a) => ({
            totalBuying: acc.totalBuying + a.buyingPrice,
            totalSelling: acc.totalSelling + a.totalPrice,
            totalProfit: acc.totalProfit + a.profit,
        }), { totalBuying: 0, totalSelling: 0, totalProfit: 0 });
    }, [animalProfits]);

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
                <FaBalanceScale className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Kâr / Zarar Özeti</h1>
            </div>

            {/* Genel Özet */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-semibold">Toplam Alış</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(totals.totalBuying)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 font-semibold">Toplam Satış</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(totals.totalSelling)}</p>
                </div>
                <div className={clsx(
                    "border rounded-lg p-3 text-center",
                    totals.totalProfit >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                )}>
                    <p className={clsx("text-xs font-semibold", totals.totalProfit >= 0 ? "text-green-600" : "text-red-600")}>
                        Toplam {totals.totalProfit >= 0 ? 'Kâr' : 'Zarar'}
                    </p>
                    <p className={clsx("text-xl font-bold", totals.totalProfit >= 0 ? "text-green-700" : "text-red-700")}>
                        {formatCurrency(Math.abs(totals.totalProfit))}
                    </p>
                </div>
            </div>

            {/* Hayvan Bazlı Tablo */}
            <h2 className="text-lg font-bold text-gray-800 mb-3">Hayvan Bazlı Detay</h2>
            <div className="space-y-2">
                {animalProfits.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">
                        Alış fiyatı girilmiş hayvan bulunamadı.
                    </div>
                ) : (
                    animalProfits.map((animal) => (
                        <div key={animal.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded">
                                            {animal.type === 'büyükbaş' ? 'B' : 'K'}-{animal.animalNo}
                                        </span>
                                        <span className="text-sm text-gray-500">{animal.name}</span>
                                        {animal.isSoldOut && (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 rounded">TAMAMLANDI</span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                        <span>Alış: {formatCurrency(animal.buyingPrice)}</span>
                                        <span>Satış: {formatCurrency(animal.totalPrice)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={clsx(
                                        "text-lg font-bold",
                                        animal.profit >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {animal.profit >= 0 ? '+' : ''}{formatCurrency(animal.profit)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {animal.soldShares}/{animal.totalShares} hisse satıldı
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
