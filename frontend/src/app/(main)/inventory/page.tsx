'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { formatCurrency, formatDate, getStatusLabel, isLowStock } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, Filter, AlertTriangle } from 'lucide-react';

interface Item {
    id: string; name: string; category: string; quantity: number; price: number;
    threshold: number; supplier_name: string; supplier_id: string;
    location: string; status: string; updated_at: string;
}

interface Supplier { id: string; name: string; email: string; }

const STATUS_OPTIONS = ['', 'available', 'out_of_stock', 'needed', 'not_needed'];

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Item | null>(null);
    const [form, setForm] = useState({ name: '', category: '', quantity: 0, price: 0, threshold: 10, supplier_id: '', location: '', status: 'available' });
    const [saving, setSaving] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        if (lowStockOnly) params.set('low_stock', 'true');
        params.set('page', page.toString());
        params.set('limit', '15');
        try {
            const res = await api.get(`/items?${params}`);
            setItems(res.data.items); setTotal(res.data.total);
        } catch (_) { } finally { setLoading(false); }
    }, [search, statusFilter, lowStockOnly, page]);

    useEffect(() => { fetchItems(); }, [fetchItems]);
    useEffect(() => {
        api.get('/suppliers').then(r => setSuppliers(r.data)).catch(() => { });
    }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', category: '', quantity: 0, price: 0, threshold: 10, supplier_id: '', location: '', status: 'available' });
        setShowModal(true);
    };
    const openEdit = (item: Item) => {
        setEditItem(item);
        setForm({ name: item.name, category: item.category || '', quantity: item.quantity, price: item.price, threshold: item.threshold, supplier_id: item.supplier_id || '', location: item.location || '', status: item.status });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editItem) { await api.put(`/items/${editItem.id}`, form); }
            else { await api.post('/items', form); }
            setShowModal(false); fetchItems();
        } catch (e: any) { alert(e.response?.data?.error || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item?')) return;
        await api.delete(`/items/${id}`);
        fetchItems();
    };

    const statusBadgeClass: Record<string, string> = {
        available: 'badge-available', out_of_stock: 'badge-out_of_stock',
        needed: 'badge-needed', not_needed: 'badge-not_needed',
    };

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                    <p className="text-gray-500 text-sm">{total} total items</p></div>
                <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Item</button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input pl-9" placeholder="Search items..." value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                </select>
                <button onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
                    className={`btn-secondary ${lowStockOnly ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400' : ''}`}>
                    <AlertTriangle size={15} /> Low Stock
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                {['Item', 'Category', 'Quantity', 'Price', 'Status', 'Supplier', 'Updated', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No items found.</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                        {item.location && <div className="text-xs text-gray-400">{item.location}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.category || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-medium ${isLowStock(item.quantity, item.threshold) ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                                            {item.quantity}
                                        </span>
                                        {isLowStock(item.quantity, item.threshold) && (
                                            <AlertTriangle size={12} className="inline ml-1 text-amber-500" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</td>
                                    <td className="px-4 py-3">
                                        <span className={statusBadgeClass[item.status] || 'badge-available'}>{getStatusLabel(item.status)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.supplier_name || '—'}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(item.updated_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {total > 15 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500">Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total}</p>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Prev</button>
                            <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editItem ? 'Edit Item' : 'Add New Item'}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Item Name *</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Quantity *</label>
                                <input type="number" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} min={0} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Price ($)</label>
                                <input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} step={0.01} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Low Stock Threshold</label>
                                <input type="number" className="input" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} min={1} /></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                </select></div>
                            <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
                                <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                                    <option value="">— No Supplier —</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
                                {saving ? 'Saving...' : editItem ? 'Update Item' : 'Create Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
