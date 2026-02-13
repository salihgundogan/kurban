// ============================================================
// settings.test.jsx — Settings sayfası bileşen testleri
// ============================================================
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../pages/Settings';

// Firebase servisini mockla
vi.mock('../services/settings', () => ({
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
}));

import { getSettings, updateSettings } from '../services/settings';

const renderSettings = () => {
    return render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );
};

describe('Settings Sayfası', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('yükleniyor durumunu gösterir', () => {
        // getSettings'i hiç resolve etme — kalıcı loading
        getSettings.mockReturnValue(new Promise(() => { }));
        renderSettings();
        expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    });

    it('ayarlar yüklendikten sonra tüm başlıklar görünmeli', async () => {
        getSettings.mockResolvedValue({
            teamMembers: ['Salih', 'Kadir'],
            iban: 'TR1234567890',
            slaughterAddress: 'https://maps.app.goo.gl/test',
            whatsappTemplate: 'Merhaba {customerName}',
        });

        renderSettings();

        await waitFor(() => {
            expect(screen.getByText('Ekip Üyeleri')).toBeInTheDocument();
        });

        expect(screen.getByText('IBAN Bilgisi')).toBeInTheDocument();
        expect(screen.getByText('Kesim Yeri Adresi (Maps Linki)')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp Mesaj Şablonu')).toBeInTheDocument();
    });

    it('mevcut ekip üyeleri listelenmeli', async () => {
        getSettings.mockResolvedValue({
            teamMembers: ['Salih', 'Kadir', 'Hacı'],
            iban: '',
            slaughterAddress: '',
            whatsappTemplate: '',
        });

        renderSettings();

        await waitFor(() => {
            expect(screen.getByText('Salih')).toBeInTheDocument();
            expect(screen.getByText('Kadir')).toBeInTheDocument();
            expect(screen.getByText('Hacı')).toBeInTheDocument();
        });
    });

    it('kaydet butonuna tıklandığında updateSettings çağrılmalı', async () => {
        getSettings.mockResolvedValue({
            teamMembers: ['Salih'],
            iban: 'TR00',
            slaughterAddress: '',
            whatsappTemplate: '',
        });
        updateSettings.mockResolvedValue();

        renderSettings();

        await waitFor(() => {
            expect(screen.getByText('AYARLARI KAYDET')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('AYARLARI KAYDET'));

        await waitFor(() => {
            expect(updateSettings).toHaveBeenCalledOnce();
        });
    });

    it('ayarlar yüklenemezse hata mesajı görünmeli', async () => {
        getSettings.mockResolvedValue(null);
        renderSettings();

        await waitFor(() => {
            expect(screen.getByText('Ayarlar yüklenemedi.')).toBeInTheDocument();
        });
    });
});
