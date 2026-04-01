'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';

interface Notification {
    id: string; message: string; type: string; is_read: boolean; timestamp: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications?limit=50');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread);
        } catch (_) { }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        // Listen for real-time notifications
        const socket = getSocket();
        if (socket) {
            socket.on('notification', (notif: Notification) => {
                setNotifications((prev) => [notif, ...prev]);
                setUnreadCount((c) => c + 1);
            });
        }
        return () => {
            socket?.off('notification');
        };
    }, [user, fetchNotifications]);

    const markRead = async (id: string) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all');
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
    return ctx;
};
