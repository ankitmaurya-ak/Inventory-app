'use client';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, CheckCheck, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const typeIcons: Record<string, any> = {
    low_stock: AlertTriangle, warning: AlertOctagon, info: Info, error: AlertOctagon,
};
const typeBg: Record<string, string> = {
    low_stock: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
    warning: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
    error: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
};
const typeIconColor: Record<string, string> = {
    low_stock: 'text-amber-500', warning: 'text-orange-500', info: 'text-blue-500', error: 'text-red-500',
};

export default function NotificationsPage() {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

    return (
        <div className="space-y-5 animate-slide-up max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <p className="text-gray-500 text-sm">{unreadCount} unread alerts</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="btn-secondary text-xs">
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="card p-16 flex flex-col items-center justify-center text-gray-400">
                    <Bell size={48} className="mb-3 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => {
                        const Icon = typeIcons[notif.type] || Info;
                        return (
                            <div key={notif.id}
                                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:opacity-90
                  ${typeBg[notif.type] || 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}
                  ${!notif.is_read ? 'ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800' : 'opacity-70'}`}
                                onClick={() => !notif.is_read && markRead(notif.id)}>
                                <div className={`mt-0.5 ${typeIconColor[notif.type] || 'text-gray-400'}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.timestamp)}</p>
                                </div>
                                {!notif.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
