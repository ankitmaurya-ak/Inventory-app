'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <NotificationProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar currentPath={pathname} />
                <div className="flex-1 flex flex-col ml-0 md:ml-64">
                    <Header />
                    <main className="flex-1 p-4 md:p-6 animate-fade-in">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
}
