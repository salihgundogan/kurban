// ============================================================
// payments.test.jsx — Payments (Ödeme Al) sayfası testleri
// ============================================================
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Payments from '../pages/Payments';

// Servisleri mockla
vi.mock('../services/animals', () => ({
    subscribeToAnimals: vi.fn(),
    updateAnimal: vi.fn(),
}));

vi.mock('../services/payments', () => ({
    addPayment: vi.fn(),
    subscribeToPayments: vi.fn(),
}));

import { subscribeToAnimals, updateAnimal } from '../services/animals';
import { addPayment, subscribeToPayments } from '../services/payments';

// Test verisi: 1 hayvan, 2 hisse (1 borçlu, 1 ödenmiş)
const mockAnimals = [
    {
        id: 'animal-1',
        name: 'Test Hayvan',
        animalNumber: 101,
        type: 'büyükbaş',
        totalPrice: 140000,
        totalShares: 7,
        soldShares: 2,
        queueNo: 1,
        shares: [
            {
                id: 1,
                customerName: 'Ali Veli',
                customerPhone: '5551112233',
                paidAmount: 10000,
                paymentReceiver: 'Salih',
                paymentMethod: 'Nakit',
                isSold: true,
            },
            {
                id: 2,
                customerName: 'Ayşe Fatma',
                customerPhone: '5554445566',
                paidAmount: 20000,    // Hisse bedeli = ceil(140000/7) = 20000 → borç = 0
                paymentReceiver: 'Kadir',
                paymentMethod: 'Kendi IBAN\'ıma',
                isSold: true,
            },
        ],
    },
];

const setupMocks = ({ animals = mockAnimals, payments = [] } = {}) => {
    // subscribeToAnimals hemen callback çağırsın
    subscribeToAnimals.mockImplementation((cb) => {
        cb(animals);
        return vi.fn(); // unsubscribe
    });
    subscribeToPayments.mockImplementation((cb) => {
        cb(payments);
        return vi.fn();
    });
    addPayment.mockResolvedValue('payment-1');
    updateAnimal.mockResolvedValue();
};

const renderPayments = () => {
    return render(
        <MemoryRouter>
            <Payments />
        </MemoryRouter>
    );
};

describe('Payments Sayfası', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sayfa başlığı "Ödeme Al" olmalı', () => {
        setupMocks();
        renderPayments();
        expect(screen.getByText('Ödeme Al')).toBeInTheDocument();
    });

    it('borçlu müşteri listede görünmeli', () => {
        setupMocks();
        renderPayments();
        // Ali Veli => hisse 20000, ödemiş 10000, borç 10000
        expect(screen.getByText('Ali Veli')).toBeInTheDocument();
    });

    it('tamamen ödemiş müşteri varsayılan listede görünmemeli (borç = 0)', () => {
        setupMocks();
        renderPayments();
        // Ayşe Fatma tamamen ödemiş. Varsayılan liste sadece borçluları gösterir.
        expect(screen.queryByText('Ayşe Fatma')).not.toBeInTheDocument();
    });

    it('arama yapıldığında ödenmiş müşteri de bulunabilmeli', () => {
        setupMocks();
        renderPayments();
        const searchInput = screen.getByPlaceholderText(/İsim, telefon veya hayvan no ile ara/i);
        fireEvent.change(searchInput, { target: { value: 'Ayşe' } });
        expect(screen.getByText('Ayşe Fatma')).toBeInTheDocument();
    });

    it('müşteri seçildiğinde ödeme formu görünmeli', () => {
        setupMocks();
        renderPayments();
        fireEvent.click(screen.getByText('Ali Veli'));
        expect(screen.getByText('Ödeme Alınacak Kişi')).toBeInTheDocument();
        expect(screen.getByText('Hisse Bedeli')).toBeInTheDocument();
        expect(screen.getByText('Kalan Borç')).toBeInTheDocument();
    });

    it('"Tamamını Öde" hızlı butonu görünmeli', () => {
        setupMocks();
        renderPayments();
        fireEvent.click(screen.getByText('Ali Veli'));
        // "Tamamını Öde" butonu borcun tamamını gösterir
        const tamamButton = screen.getByText(/Tamamını Öde/i);
        expect(tamamButton).toBeInTheDocument();
    });

    it('ödeme kaydedildiğinde addPayment ve updateAnimal çağrılmalı', async () => {
        setupMocks();
        renderPayments();

        // Müşteriyi seç
        fireEvent.click(screen.getByText('Ali Veli'));

        // Tutar gir
        const amountInput = screen.getByPlaceholderText('Örn: 5000');
        fireEvent.change(amountInput, { target: { value: '5000' } });

        // Kaydet
        fireEvent.click(screen.getByText('ÖDEMEYİ KAYDET'));

        await waitFor(() => {
            expect(addPayment).toHaveBeenCalledOnce();
            expect(addPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    animalId: 'animal-1',
                    shareId: 1,
                    customerName: 'Ali Veli',
                    amount: 5000,
                })
            );
        });

        await waitFor(() => {
            expect(updateAnimal).toHaveBeenCalledOnce();
        });
    });

    it('borçtan fazla ödeme girildiğinde alert gösterilmeli', async () => {
        setupMocks();
        renderPayments();

        fireEvent.click(screen.getByText('Ali Veli'));
        const amountInput = screen.getByPlaceholderText('Örn: 5000');
        // Borç 10000, 15000 girmeye çalış
        fireEvent.change(amountInput, { target: { value: '15000' } });
        fireEvent.click(screen.getByText('ÖDEMEYİ KAYDET'));

        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('fazla olamaz')
        );
        expect(addPayment).not.toHaveBeenCalled();
    });

    it('"Geçmiş" butonuna tıklandığında ödeme geçmişi görünmeli', () => {
        setupMocks({
            payments: [
                {
                    id: 'p1',
                    customerName: 'Ali Veli',
                    animalNo: 101,
                    animalType: 'büyükbaş',
                    shareId: 1,
                    amount: 5000,
                    receiver: 'Salih',
                    method: 'Nakit',
                    createdAt: { toDate: () => new Date('2026-02-13T12:00:00') },
                }
            ]
        });
        renderPayments();

        fireEvent.click(screen.getByText('Geçmiş'));
        expect(screen.getByText('Ödeme Geçmişi')).toBeInTheDocument();
        expect(screen.getByText('1 kayıt')).toBeInTheDocument();
    });

    it('hiç hayvan yokken boş durum mesajı gösterilmeli', () => {
        setupMocks({ animals: [] });
        renderPayments();
        expect(screen.getByText(/Borçlu müşteri yok/i)).toBeInTheDocument();
    });
});
