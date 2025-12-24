import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAnimals } from '../services/animals';
import AnimalCard from '../components/AnimalCard';
import AddAnimalModal from '../components/AddAnimalModal';
import { FaPlus, FaFilter } from 'react-icons/fa';
import clsx from 'clsx';
import { calculateSharePrice } from '../utils/helpers';

export default function Dashboard() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('ALL'); // ALL, LARGE, SMALL

    useEffect(() => {
        const unsubscribe = subscribeToAnimals((data) => {
            setAnimals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const processedAnimals = useMemo(() => {
        let filtered = animals;

        // Filter
        if (filterType === 'LARGE') {
            filtered = animals.filter(a => a.type === 'büyükbaş');
        } else if (filterType === 'SMALL') {
            filtered = animals.filter(a => a.type === 'küçükbaş');
        }

        // Sort: 
        // 1. Kategorisel (Önce Büyükbaş - Sadece ALL modunda anlamlı)
        // 2. Fiyata göre (HİSSE FİYATI) Pahalıdan Ucuza
        // 3. Satılanlar en alta (Opsiyonel ama iyi UX)

        return filtered.sort((a, b) => {
            const aSold = (a.totalShares - a.soldShares) === 0;
            const bSold = (b.totalShares - b.soldShares) === 0;
            if (aSold !== bSold) return aSold ? 1 : -1;

            if (filterType === 'ALL') {
                // Önce Büyükbaş
                if (a.type !== b.type) return a.type === 'büyükbaş' ? -1 : 1;
            }

            // Hisse Fiyatı Pahalıdan Ucuza
            const aSharePrice = calculateSharePrice(a.totalPrice, a.totalShares);
            const bSharePrice = calculateSharePrice(b.totalPrice, b.totalShares);

            return bSharePrice - aSharePrice;
        });

    }, [animals, filterType]);

    // İstatistik hesaplamaları
    const stats = useMemo(() => {
        const largeAnimals = animals.filter(a => a.type === 'büyükbaş');
        const smallAnimals = animals.filter(a => a.type === 'küçükbaş');

        const largeSold = largeAnimals.filter(a => a.totalShares === a.soldShares).length;
        const largeRemaining = largeAnimals.length - largeSold;
        const largeRemainingShares = largeAnimals.reduce((sum, a) => sum + (a.totalShares - a.soldShares), 0);

        const smallSold = smallAnimals.filter(a => a.totalShares === a.soldShares).length;
        const smallRemaining = smallAnimals.length - smallSold;
        const smallRemainingShares = smallAnimals.reduce((sum, a) => sum + (a.totalShares - a.soldShares), 0);

        return {
            large: { sold: largeSold, remaining: largeRemaining, remainingShares: largeRemainingShares },
            small: { sold: smallSold, remaining: smallRemaining, remainingShares: smallRemainingShares },
            total: {
                remainingAnimals: largeRemaining + smallRemaining,
                remainingShares: largeRemainingShares + smallRemainingShares
            }
        };
    }, [animals]);

    return (
        <div className="pb-24">
            {/* 1. ÜST BUTONLAR */}
            <div className="mb-4 space-y-3 sticky top-0 bg-gray-50 pt-2 pb-2 z-10 px-1">

                {/* DEV EKLE BUTONU */}
                <button
                    onClick={() => setModalOpen(true)}
                    className="w-full bg-primary text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center"
                >
                    <FaPlus className="mr-2" /> HAYVAN EKLE
                </button>

                {/* FİLTRE TABLARI */}
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    <button
                        onClick={() => setFilterType('LARGE')}
                        className={clsx(
                            "flex-1 py-3 rounded-md font-bold text-sm sm:text-base transition-colors",
                            filterType === 'LARGE' ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        BÜYÜKBAŞ
                    </button>
                    <button
                        onClick={() => setFilterType('SMALL')}
                        className={clsx(
                            "flex-1 py-3 rounded-md font-bold text-sm sm:text-base transition-colors",
                            filterType === 'SMALL' ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        KÜÇÜKBAŞ
                    </button>
                    {/* Opsiyonel: Tümü */}
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={clsx(
                            "flex-none px-4 py-3 rounded-md font-bold text-sm transition-colors",
                            filterType === 'ALL' ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        TÜMÜ
                    </button>
                </div>

                {/* İSTATİSTİK KARTLARI */}
                {!loading && (
                    <div className="space-y-2">
                        {(filterType === 'ALL' || filterType === 'LARGE') && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 shadow-sm">
                                <h3 className="text-xs font-bold text-blue-900 mb-2 flex items-center">
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] mr-2">BÜYÜKBAŞ</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-green-700">{stats.large.sold}</p>
                                        <p className="text-[10px] text-gray-600">Satıldı</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-orange-600">{stats.large.remaining}</p>
                                        <p className="text-[10px] text-gray-600">Kalan</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-red-600">{stats.large.remainingShares}</p>
                                        <p className="text-[10px] text-gray-600">Kalan Hisse</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(filterType === 'ALL' || filterType === 'SMALL') && (
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 shadow-sm">
                                <h3 className="text-xs font-bold text-purple-900 mb-2 flex items-center">
                                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] mr-2">KÜÇÜKBAŞ</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-green-700">{stats.small.sold}</p>
                                        <p className="text-[10px] text-gray-600">Satıldı</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-orange-600">{stats.small.remaining}</p>
                                        <p className="text-[10px] text-gray-600">Kalan</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-red-600">{stats.small.remainingShares}</p>
                                        <p className="text-[10px] text-gray-600">Kalan Hisse</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {filterType === 'ALL' && (
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-3 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center">
                                    <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] mr-2">TOPLAM</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div>
                                        <p className="text-xl font-bold text-orange-600">{stats.total.remainingAnimals}</p>
                                        <p className="text-[10px] text-gray-600">Kalan Hayvan</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-red-600">{stats.total.remainingShares}</p>
                                        <p className="text-[10px] text-gray-600">Kalan Hisse</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LİSTE */}
            <div className="space-y-1">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
                ) : processedAnimals.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">Kayıt bulunamadı.</div>
                ) : (
                    processedAnimals.map(animal => (
                        <AnimalCard key={animal.id} animal={animal} />
                    ))
                )}
            </div>

            <AddAnimalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}
