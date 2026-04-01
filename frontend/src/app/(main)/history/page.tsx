'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { formatDateTime } from '@/lib/utils';
import { History, Package } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
    item_created: 'Item Created', item_updated: 'Item Updated',
    quantity_changed: 'Quantity Changed', status_changed: 'Status Changed',
    supplier_contacted: 'Supplier Contacted', item_deleted: 'Item Deleted',
};
const ACTION_COLORS: Record<string, string> = {
    item_created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    item_updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    quantity_changed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    supplier_contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    item_deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    status_changed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface Log { id: string; item_id: string; item_name: string; user_name: string; action: string; metadata: any; timestamp: string; }

export default function HistoryPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: page.toString(), limit: '20' });
        if (actionFilter) params.set('action', actionFilter);
        api.get(`/logs?${params}`).then(r => { setLogs(r.data.logs); setTotal(r.data.total); }).catch(() => { }).finally(() => setLoading(false));
    }, [page, actionFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory History</h1>
                    <p className="text-gray-500 text-sm">{total} total log entries</p></div>
                <select className="input w-auto" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
                    <option value="">All Actions</option>
                    {Object.keys(ACTION_LABELS).map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                </select>
            </div>

            <div className="card overflow-hidden">
                <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-0">
                        {loading ? (
                            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" /></div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-gray-400"><History size={40} className="mb-3 opacity-30" /><p>No history found</p></div>
                        ) : logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-4 px-6 py-4 relative hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <div className="relative z-10 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || ACTION_COLORS.status_changed}`}>
                                            {ACTION_LABELS[log.action] || log.action}
                                        </span>
                                        {log.item_name && (
                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                <Package size={11} /> {log.item_name}
                                            </span>
                                        )}
                                    </div>
                                    {log.action === 'quantity_changed' && log.metadata && (
                                        <p className="text-xs text-gray-500">
                                            {log.metadata.old_quantity} → <strong>{log.metadata.new_quantity}</strong> units
                                        </p>
                                    )}
                                    {log.action === 'supplier_contacted' && log.metadata && (
                                        <p className="text-xs text-gray-500">Email sent to {log.metadata.supplier_email}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(log.timestamp)} · {log.user_name || 'System'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {total > 20 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 20)}</p>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Prev</button>
                            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
