import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { FaSignOutAlt, FaHome } from 'react-icons/fa';

export default function Layout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/dashboard" className="flex items-center text-xl font-bold text-gray-900 hover:text-primary transition-colors">
                            <FaHome className="mr-2 text-primary" />
                            Kurban Takip
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full text-gray-500 hover:text-danger hover:bg-gray-100 transition-colors"
                            title="Çıkış Yap"
                        >
                            <FaSignOutAlt size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-4 px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Kurbanlık Satış ve Takip Sistemi
                </div>
            </footer>
        </div>
    );
}
