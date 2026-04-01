'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';
import { initSocket, disconnectSocket } from '@/lib/socket';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    store_id: string;
    store_name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    registerStore: (storeName: string, name: string, email: string, password: string) => Promise<{ invite_code: string; store_name: string }>;
    joinStore: (inviteCode: string, name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            initSocket(parsedUser.store_id || parsedUser.id);
        }
        setIsLoading(false);
    }, []);

    const saveSession = (t: string, u: User) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        initSocket(u.store_id);
    };

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        saveSession(res.data.token, res.data.user);
    };

    const registerStore = async (storeName: string, name: string, email: string, password: string) => {
        const res = await api.post('/auth/register-store', { storeName, name, email, password });
        saveSession(res.data.token, res.data.user);
        return { invite_code: res.data.store.invite_code, store_name: res.data.store.name };
    };

    const joinStore = async (inviteCode: string, name: string, email: string, password: string) => {
        const res = await api.post('/auth/join-store', { inviteCode, name, email, password });
        saveSession(res.data.token, res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        disconnectSocket();
        window.location.href = '/auth';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, registerStore, joinStore, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
