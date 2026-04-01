'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
    onOpenSidebar?: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    }, []);

    const toggleDark = () => {
        const newVal = !isDark;
        setIsDark(newVal);
        document.documentElement.classList.toggle('dark', newVal);
        localStorage.setItem('theme', newVal ? 'dark' : 'light');
    };

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    aria-label="Open navigation"
                >
                    <Menu size={18} />
                </button>
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                        {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={toggleDark}
                    className="p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <Link href="/notifications" className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
