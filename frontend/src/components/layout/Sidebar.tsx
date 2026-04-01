'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard, Package, Users, Bell, History, LogOut, Package2, ChevronRight, Settings, X
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/suppliers', label: 'Suppliers', icon: Users },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
    currentPath: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ currentPath, isOpen = false, onClose }: SidebarProps) {
    const { user, logout } = useAuth();

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    onClick={onClose}
                    className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-40 md:hidden"
                    aria-label="Close navigation overlay"
                />
            )}
            <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 shadow-sm transform transition-transform duration-200 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo + Store Name */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
                    <Package2 size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {user?.store_name || 'InventoryPro'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">Inventory Management</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close navigation"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = currentPath === href || currentPath.startsWith(href + '/');
                    return (
                        <Link key={href} href={href} onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${active
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}>
                            <Icon size={18} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                            {label}
                            {active && <ChevronRight size={14} className="ml-auto text-indigo-500" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User profile */}
            <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <button onClick={logout} title="Logout"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
            </aside>
        </>
    );
}
