// ============================================================
// helpers.test.js — Utility fonksiyonları birim testleri
// ============================================================
import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateSharePrice } from '../utils/helpers';

// ============================================================
// TEST SÜİTİ 1: formatCurrency
// ============================================================
describe('formatCurrency', () => {
    it('pozitif tam sayıyı TL formatında gösterir', () => {
        const result = formatCurrency(10000);
        // Intl.NumberFormat tr-TR çıktısı: "₺10.000"
        expect(result).toContain('10');
        expect(result).toContain('000');
    });

    it('sıfır değerini gösterir', () => {
        const result = formatCurrency(0);
        expect(result).toBeDefined();
        expect(result).not.toBe('-');
    });

    it('null/undefined girdide "-" döndürür', () => {
        expect(formatCurrency(null)).toBe('-');
        expect(formatCurrency(undefined)).toBe('-');
    });

    it('boş string girdide "-" döndürür', () => {
        expect(formatCurrency('')).toBe('-');
    });

    it('negatif sayıyı da formatlar', () => {
        const result = formatCurrency(-5000);
        expect(result).toContain('5');
        expect(result).toContain('000');
    });

    it('büyük sayıları binlik ayırıcıyla gösterir', () => {
        const result = formatCurrency(1500000);
        expect(result).toContain('1');
        expect(result).toContain('500');
        expect(result).toContain('000');
    });
});

// ============================================================
// TEST SÜİTİ 2: calculateSharePrice
// ============================================================
describe('calculateSharePrice', () => {
    it('toplam fiyatı hisse sayısına bölerek yukarı yuvarlar', () => {
        // 70.000 TL / 7 hisse = 10.000 TL (tam bölünme)
        expect(calculateSharePrice(70000, 7)).toBe(10000);
    });

    it('bölünemez fiyatı Math.ceil ile yuvarlar', () => {
        // 100.000 TL / 7 hisse = 14285.71... → Math.ceil → 14286
        expect(calculateSharePrice(100000, 7)).toBe(14286);
    });

    it('hisse sayısı 0 ise 0 döndürür (sıfıra bölme koruması)', () => {
        expect(calculateSharePrice(50000, 0)).toBe(0);
    });

    it('hisse sayısı null/undefined ise 0 döndürür', () => {
        expect(calculateSharePrice(50000, null)).toBe(0);
        expect(calculateSharePrice(50000, undefined)).toBe(0);
    });

    it('1 hisselik hayvanda toplam fiyat = hisse fiyatı', () => {
        expect(calculateSharePrice(25000, 1)).toBe(25000);
    });

    it('toplam fiyat 0 ise hisse fiyatı 0 döner', () => {
        expect(calculateSharePrice(0, 7)).toBe(0);
    });
});
