import React from 'react';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function AnimalCard({ animal }) {
    const navigate = useNavigate();
    const sharePrice = calculateSharePrice(animal.totalPrice, animal.totalShares);
    const remainingShares = animal.totalShares - animal.soldShares;
    const isSoldOut = remainingShares === 0;

    return (
        <div
            onClick={() => navigate(`/animal/${animal.id}`)}
            className={clsx(
                "bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-3 flex items-center cursor-pointer active:bg-gray-50",
                isSoldOut && "opacity-70 grayscale bg-gray-50"
            )}
        >
            {/* 0. KESİM SIRASI - En Solda, Büyük Punto */}
            <div className="flex-shrink-0 w-12 h-16 bg-primary/10 rounded-md flex flex-col items-center justify-center mr-2 border border-primary/20">
                <span className="text-[9px] text-primary font-bold uppercase leading-tight">Sıra</span>
                <span className="text-xl font-black text-primary leading-tight">{animal.queueNo || '-'}</span>
            </div>

            {/* 1. KÜÇÜK FOTO (Thumbnail) */}
            <div className="flex-shrink-0 w-14 h-14 bg-gray-200 rounded-md overflow-hidden mr-3">
                {animal.photoUrl ? (
                    <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] text-center p-1">
                        Resim Yok
                    </div>
                )}
            </div>

            {/* 2. ORTA BİLGİLER */}
            <div className="flex-grow grid grid-cols-3 gap-2 items-center">

                {/* Küpe / Tanım */}
                <div className="col-span-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {animal.type === 'büyükbaş' ? 'Küpe No' : 'Tanım'}
                    </p>
                    <p className="text-xs font-medium text-gray-700 truncate">
                        {animal.name}
                    </p>
                </div>

                {/* Mevcut Hisse */}
                <div className="col-span-1 text-center">
                    <p className="text-[10px] text-gray-500">Mevcut</p>
                    <span className={clsx(
                        "inline-block px-2 py-0.5 rounded text-sm font-bold",
                        isSoldOut ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                    )}>
                        {isSoldOut ? "0" : remainingShares}
                    </span>
                </div>

                {/* Hisse Fiyatı - En Sağ */}
                <div className="col-span-1 text-right">
                    <p className="text-[10px] text-gray-500">Hisse Fiyatı</p>
                    <p className="text-sm font-bold text-primary">
                        {formatCurrency(sharePrice)}
                    </p>
                </div>

            </div>
        </div>
    );
}
