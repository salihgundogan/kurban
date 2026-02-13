import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaTimes, FaHome, FaChartBar, FaBalanceScale,
    FaCashRegister, FaAddressBook, FaBoxes, FaCog
} from 'react-icons/fa';
import clsx from 'clsx';

const menuItems = [
    { path: '/dashboard', label: 'Ana Sayfa', icon: FaHome },
    { path: '/sales-report', label: 'Satış Raporu', icon: FaChartBar },
    { path: '/profit-loss', label: 'Kâr / Zarar', icon: FaBalanceScale },
    { path: '/daily-cash', label: 'Günlük Kasa', icon: FaCashRegister },
    { path: '/customers', label: 'Müşteri Rehberi', icon: FaAddressBook },
    { path: '/inventory', label: 'Envanter', icon: FaBoxes },
    { path: '/settings', label: 'Ayarlar', icon: FaCog },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={clsx(
                    "fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-emerald-600">
                    <h2 className="text-lg font-bold text-white">Kurban Takip</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={clsx(
                                    "w-full flex items-center px-4 py-3.5 text-left transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold border-r-4 border-primary"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon className={clsx("mr-3 text-lg", isActive ? "text-primary" : "text-gray-400")} />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t text-center">
                    <p className="text-[10px] text-gray-400">&copy; {new Date().getFullYear()} Kurban Takip</p>
                </div>
            </div>
        </>
    );
}
