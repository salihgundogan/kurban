import React, { useEffect, useState } from 'react';
import { subscribeToInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/inventory';
import { FaBoxes, FaPlus, FaTimes, FaCheck, FaTrash, FaEdit, FaClipboardCheck } from 'react-icons/fa';
import clsx from 'clsx';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [countMode, setCountMode] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', initialCount: '', currentCount: '' });

    useEffect(() => {
        const unsubscribe = subscribeToInventory((data) => {
            setItems(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openAddModal = () => {
        setEditItem(null);
        setForm({ name: '', initialCount: '', currentCount: '' });
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setForm({ name: item.name, initialCount: String(item.initialCount), currentCount: String(item.currentCount) });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            alert('Ekipman adı giriniz.');
            return;
        }
        const initial = Number(form.initialCount) || 0;
        const current = form.currentCount !== '' ? Number(form.currentCount) : initial;

        try {
            if (editItem) {
                await updateInventoryItem(editItem.id, {
                    name: form.name.trim(),
                    initialCount: initial,
                    currentCount: current,
                });
            } else {
                await addInventoryItem({
                    name: form.name.trim(),
                    initialCount: initial,
                    currentCount: current,
                });
            }
            setModalOpen(false);
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu ekipmanı silmek istediğinize emin misiniz?')) return;
        await deleteInventoryItem(id);
    };

    const handleCountUpdate = async (item, newCount) => {
        const count = Number(newCount);
        if (isNaN(count) || count < 0) return;
        await updateInventoryItem(item.id, { currentCount: count });
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;

    const missingItems = items.filter(i => i.currentCount < i.initialCount);

    return (
        <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
                <FaBoxes className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Envanter</h1>
            </div>

            {/* Üst Butonlar */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={openAddModal}
                    className="bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 flex items-center justify-center"
                >
                    <FaPlus className="mr-2" /> EKİPMAN EKLE
                </button>
                <button
                    onClick={() => setCountMode(!countMode)}
                    className={clsx(
                        "py-3 rounded-xl font-bold shadow-lg flex items-center justify-center transition-colors",
                        countMode
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    )}
                >
                    <FaClipboardCheck className="mr-2" />
                    {countMode ? 'SAYIM MODU AKTİF' : 'SAYIM BAŞLAT'}
                </button>
            </div>

            {/* Eksik Uyarısı */}
            {missingItems.length > 0 && !countMode && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-red-700 mb-1">⚠️ Eksik Ekipmanlar:</p>
                    <div className="flex flex-wrap gap-1">
                        {missingItems.map(item => (
                            <span key={item.id} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                                {item.name} ({item.currentCount}/{item.initialCount})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Liste */}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">
                        Henüz ekipman eklenmedi. "Ekipman Ekle" butonuna tıklayın.
                    </div>
                ) : (
                    items.map(item => {
                        const isMissing = item.currentCount < item.initialCount;
                        return (
                            <div
                                key={item.id}
                                className={clsx(
                                    "bg-white rounded-lg border p-3 shadow-sm",
                                    isMissing ? "border-red-300 bg-red-50/50" : "border-gray-200"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            Başlangıç: {item.initialCount} adet
                                        </p>
                                    </div>

                                    {countMode ? (
                                        /* Sayım Modu: Input */
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Mevcut:</span>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min="0"
                                                value={item.currentCount}
                                                onChange={(e) => handleCountUpdate(item, e.target.value)}
                                                className={clsx(
                                                    "w-16 text-center border rounded-lg p-2 text-lg font-bold",
                                                    isMissing ? "border-red-300 text-red-600" : "border-gray-300 text-green-700"
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        /* Normal Mod: Gösterim */
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "px-3 py-1 rounded-lg font-bold text-lg",
                                                isMissing ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            )}>
                                                {item.currentCount}/{item.initialCount}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Ekle/Düzenle Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="bg-gray-50 p-4 border-b flex justify-between rounded-t-xl">
                            <h3 className="font-bold text-gray-800">
                                {editItem ? 'Ekipman Düzenle' : 'Yeni Ekipman Ekle'}
                            </h3>
                            <button onClick={() => setModalOpen(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ekipman Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Örn: Bıçak, Eldiven, Önlük..."
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Başlangıç Adedi</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        value={form.initialCount}
                                        onChange={(e) => setForm(prev => ({ ...prev, initialCount: e.target.value }))}
                                        placeholder="Örn: 10"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mevcut Adet</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        value={form.currentCount}
                                        onChange={(e) => setForm(prev => ({ ...prev, currentCount: e.target.value }))}
                                        placeholder="Boşsa = başlangıç"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-base"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700"
                            >
                                KAYDET
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
