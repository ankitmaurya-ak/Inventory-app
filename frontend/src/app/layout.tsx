import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
    title: 'InventoryPro – Smart Inventory Management',
    description: 'Track, monitor, and manage your inventory with real-time alerts and supplier automation.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'InventoryPro',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: '/icon-512x512.png',
        apple: '/icon-192x192.png',
    },
};

export const viewport: Viewport = {
    themeColor: '#4f46e5',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* PWA - iOS Safari install support */}
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
