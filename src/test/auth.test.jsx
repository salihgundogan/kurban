// ============================================================
// auth.test.js — AuthContext birim testleri
// ============================================================
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// AuthContext'i test etmek için küçük bir yardımcı bileşen
function AuthTestConsumer() {
    const { isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</span>
            <button data-testid="login-correct" onClick={() => login('1234')}>Doğru PIN</button>
            <button data-testid="login-wrong" onClick={() => login('0000')}>Yanlış PIN</button>
            <button data-testid="logout" onClick={() => logout()}>Çıkış</button>
        </div>
    );
}

const renderWithAuth = () => {
    return render(
        <AuthProvider>
            <AuthTestConsumer />
        </AuthProvider>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('başlangıçta kullanıcı giriş yapmamış olmalı', () => {
        renderWithAuth();
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    });

    it('doğru PIN ile giriş yapılabilmeli', () => {
        renderWithAuth();
        fireEvent.click(screen.getByTestId('login-correct'));
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
    });

    it('yanlış PIN ile giriş yapılmamalı', () => {
        renderWithAuth();
        fireEvent.click(screen.getByTestId('login-wrong'));
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    });

    it('giriş yapıldığında localStorage güncellenmeli', () => {
        renderWithAuth();
        fireEvent.click(screen.getByTestId('login-correct'));
        expect(window.localStorage.setItem).toHaveBeenCalledWith('isAuthenticated', 'true');
    });

    it('çıkış yapıldığında isAuthenticated false olmalı', () => {
        renderWithAuth();
        // Önce giriş yap
        fireEvent.click(screen.getByTestId('login-correct'));
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
        // Sonra çıkış yap
        fireEvent.click(screen.getByTestId('logout'));
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    });

    it('çıkış yapıldığında localStorage temizlenmeli', () => {
        renderWithAuth();
        fireEvent.click(screen.getByTestId('login-correct'));
        fireEvent.click(screen.getByTestId('logout'));
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('isAuthenticated');
    });
});
