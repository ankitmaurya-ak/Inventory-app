'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Package, TrendingUp, AlertTriangle, XCircle, ShoppingCart, DollarSign, Activity, Play, CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Stats {
    total_items: string; available_items: string; low_stock_items: string;
    out_of_stock: string; needed_items: string; total_value: string;
}

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [trend, setTrend] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Scanner State
    const [scanStatus, setScanStatus] = useState<{ isScanningNow: boolean; nextScan: string | null }>({ isScanningNow: false, nextScan: null });
    const [timeUntilScan, setTimeUntilScan] = useState<string>('');
    const [isTriggering, setIsTriggering] = useState(false);

    useEffect(() => {
        const fetchDashboardData = () => {
            Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/trend'),
                api.get('/dashboard/scan-status'),
            ]).then(([statsRes, trendRes, scanRes]) => {
                setData(statsRes.data);
                setTrend(trendRes.data);
                setScanStatus(scanRes.data);
            }).catch(console.error)
                .finally(() => setLoading(false));
        };
        fetchDashboardData();

        // Refresh scan status every 15 seconds
        const scanInterval = setInterval(() => {
            api.get('/dashboard/scan-status').then(res => setScanStatus(res.data)).catch(() => { });
        }, 15000);

        return () => clearInterval(scanInterval);
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!scanStatus.nextScan) {
            setTimeUntilScan('Waiting...');
            return;
        }

        const interval = setInterval(() => {
            const next = new Date(scanStatus.nextScan!).getTime();
            const now = new Date().getTime();
            const diff = next - now;

            if (diff <= 0) {
                setTimeUntilScan('Scanning soon...');
                return;
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeUntilScan(`${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [scanStatus.nextScan]);

    const handleManualScan = async () => {
        if (isTriggering) return;
        setIsTriggering(true);
        try {
            await api.post('/dashboard/scan-now');
            // Optimistically update UI
            setScanStatus({ ...scanStatus, isScanningNow: true });
            setTimeout(() => {
                // Fetch fresh status after a delay
                api.get('/dashboard/scan-status').then(res => setScanStatus(res.data)).catch(() => { });
                setIsTriggering(false);
            }, 3000);
        } catch (e) {
            console.error(e);
            setIsTriggering(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
        </div>
    );

    const stats: Stats = data?.stats || {};

    const statCards = [
        { label: 'Total Items', value: stats.total_items || 0, icon: Package, color: 'indigo', glow: 'stat-glow-indigo', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
        { label: 'Total Value', value: formatCurrency(Number(stats.total_value) || 0), icon: DollarSign, color: 'emerald', glow: 'stat-glow-emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
        { label: 'Low Stock', value: stats.low_stock_items || 0, icon: AlertTriangle, color: 'amber', glow: 'stat-glow-amber', bg: 'bg-amber-50 dark:bg-amber-900/20', iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' },
        { label: 'Out of Stock', value: stats.out_of_stock || 0, icon: XCircle, color: 'red', glow: 'stat-glow-red', bg: 'bg-red-50 dark:bg-red-900/20', iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
        { label: 'Available', value: stats.available_items || 0, icon: TrendingUp, color: 'indigo', glow: 'stat-glow-indigo', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
        { label: 'Items Needed', value: stats.needed_items || 0, icon: ShoppingCart, color: 'emerald', glow: 'stat-glow-emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
    ];

    const pieData = data?.statusDistribution?.map((d: any) => ({
        name: d.status.replace('_', ' '), value: parseInt(d.count),
    })) || [];

    const categoryData = data?.categoryBreakdown?.map((c: any) => ({
        name: c.category, items: parseInt(c.count), value: parseFloat(c.total_value || 0),
    })) || [];

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Overview of your inventory system</p>
                </div>

                {/* Scanner Controller */}
                <div className="card px-4 py-3 flex items-center gap-4 border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${scanStatus.isScanningNow ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'}`}>
                            {scanStatus.isScanningNow ? <Activity size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {scanStatus.isScanningNow ? 'Scanner Active' : 'System Monitoring'}
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">
                                {scanStatus.isScanningNow
                                    ? 'Checking inventory levels...'
                                    : `Next autocheck in: ${timeUntilScan}`}
                            </p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
                    <button
                        onClick={handleManualScan}
                        disabled={isTriggering || scanStatus.isScanningNow}
                        className="btn-primary py-1.5 px-3 text-xs w-full sm:w-auto flex items-center gap-1.5"
                    >
                        <Play size={12} className={scanStatus.isScanningNow ? 'animate-spin' : ''} />
                        {isTriggering ? 'Triggering...' : 'Scan Now'}
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map(({ label, value, icon: Icon, glow, bg, iconBg }) => (
                    <div key={label} className={`card p-5 ${glow} hover:scale-[1.02] transition-transform duration-200`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${iconBg}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Bar Chart */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Inventory by Category</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => [v, 'Items']} />
                            <Bar dataKey="items" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Pie Chart */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                                paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                {pieData.map((_: any, index: number) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Trend */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activity Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="changes" stroke="#6366f1" strokeWidth={2} dot={false} name="Changes" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            {data?.recentActivity?.length > 0 && (
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                    <div className="space-y-2">
                        {data.recentActivity.map((log: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        <span className="font-medium">{log.item_name || 'Unknown item'}</span>
                                        {' — '}<span className="text-gray-500 capitalize">{log.action.replace(/_/g, ' ')}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">{log.user_name || 'System'}</p>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
