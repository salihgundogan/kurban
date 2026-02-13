// ============================================================
// sidebar.test.jsx — Sidebar bileşeni testleri
// ============================================================
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const renderSidebar = (isOpen = true, onClose = vi.fn()) => {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Sidebar isOpen={isOpen} onClose={onClose} />
        </MemoryRouter>
    );
};

describe('Sidebar', () => {
    it('açıkken tüm menü öğeleri görünür olmalı', () => {
        renderSidebar(true);
        expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
        expect(screen.getByText('Ödeme Al')).toBeInTheDocument();
        expect(screen.getByText('Satış Raporu')).toBeInTheDocument();
        expect(screen.getByText('Kâr / Zarar')).toBeInTheDocument();
        expect(screen.getByText('Günlük Kasa')).toBeInTheDocument();
        expect(screen.getByText('Müşteri Rehberi')).toBeInTheDocument();
        expect(screen.getByText('Envanter')).toBeInTheDocument();
        expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });

    it('8 adet menü öğesi olmalı', () => {
        renderSidebar(true);
        const menuLabels = [
            'Ana Sayfa', 'Ödeme Al', 'Satış Raporu', 'Kâr / Zarar',
            'Günlük Kasa', 'Müşteri Rehberi', 'Envanter', 'Ayarlar'
        ];
        menuLabels.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it('başlıkta "Kurban Takip" yazmalı', () => {
        renderSidebar(true);
        expect(screen.getByText('Kurban Takip')).toBeInTheDocument();
    });

    it('backdrop tıklandığında onClose çağrılmalı', () => {
        const onClose = vi.fn();
        const { container } = renderSidebar(true, onClose);
        // Backdrop = ilk div (opacity-100 olanı)
        const backdrop = container.querySelector('.fixed.inset-0');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('kapatma butonuna tıklandığında onClose çağrılmalı', () => {
        const onClose = vi.fn();
        renderSidebar(true, onClose);
        // FaTimes SVG'si olan buton
        const closeButtons = screen.getAllByRole('button');
        // Header'daki X butonu — ilk buton olmalı
        fireEvent.click(closeButtons[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it('aktif sayfa (dashboard) vurgulanmalı', () => {
        renderSidebar(true);
        const anaSayfaButton = screen.getByText('Ana Sayfa').closest('button');
        expect(anaSayfaButton.className).toContain('text-primary');
        expect(anaSayfaButton.className).toContain('font-bold');
    });

    it('aktif olmayan sayfalar normal renkte olmalı', () => {
        renderSidebar(true);
        const ayarlarButton = screen.getByText('Ayarlar').closest('button');
        expect(ayarlarButton.className).toContain('text-gray-700');
        expect(ayarlarButton.className).not.toContain('border-primary');
    });
});
