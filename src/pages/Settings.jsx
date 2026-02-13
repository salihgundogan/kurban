import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/settings';
import { FaCog, FaPlus, FaTimes, FaSave } from 'react-icons/fa';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newMember, setNewMember] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            alert('Ayarlar kaydedildi!');
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const addMember = () => {
        if (!newMember.trim()) return;
        setSettings(prev => ({
            ...prev,
            teamMembers: [...(prev.teamMembers || []), newMember.trim()]
        }));
        setNewMember('');
    };

    const removeMember = (index) => {
        setSettings(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Yükleniyor...</div>;
    if (!settings) return <div className="p-4 text-center text-red-500">Ayarlar yüklenemedi.</div>;

    return (
        <div className="pb-10 max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <FaCog className="text-2xl text-gray-400 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
            </div>

            <div className="space-y-6">
                {/* Ekip Üyeleri */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Ekip Üyeleri</h2>
                    <div className="space-y-2 mb-3">
                        {(settings.teamMembers || []).map((member, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-800">{member}</span>
                                <button
                                    onClick={() => removeMember(i)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                >
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMember}
                            onChange={(e) => setNewMember(e.target.value)}
                            placeholder="Yeni üye adı..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addMember()}
                        />
                        <button
                            onClick={addMember}
                            className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-600"
                        >
                            <FaPlus />
                        </button>
                    </div>
                </div>

                {/* IBAN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">IBAN Bilgisi</h2>
                    <input
                        type="text"
                        value={settings.iban || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, iban: e.target.value }))}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full border border-gray-300 rounded-lg p-3 text-base font-mono"
                    />
                </div>

                {/* Kesim Yeri */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Kesim Yeri Adresi (Maps Linki)</h2>
                    <input
                        type="url"
                        value={settings.slaughterAddress || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, slaughterAddress: e.target.value }))}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    />
                </div>

                {/* WhatsApp Şablonu */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">WhatsApp Mesaj Şablonu</h2>
                    <textarea
                        rows={6}
                        value={settings.whatsappTemplate || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, whatsappTemplate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                        Kullanılabilir değişkenler: {'{customerName}'}, {'{slaughterTime}'}, {'{debtInfo}'}, {'{address}'}
                    </p>
                </div>

                {/* Kaydet Butonu */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-600 disabled:opacity-70 flex items-center justify-center"
                >
                    <FaSave className="mr-2" />
                    {saving ? 'Kaydediliyor...' : 'AYARLARI KAYDET'}
                </button>
            </div>
        </div>
    );
}
