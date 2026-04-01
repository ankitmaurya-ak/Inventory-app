'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Search, Trash2, Edit2, Package, Mail } from 'lucide-react';

interface Supplier { id: string; name: string; email: string; phone: string; address: string; item_count: string; }

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);

    const fetchSuppliers = async () => {
        setLoading(true);
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        api.get(`/suppliers${params}`).then(r => setSuppliers(r.data)).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchSuppliers(); }, [search]);

    const openAdd = () => { setEditSupplier(null); setForm({ name: '', email: '', phone: '', address: '' }); setShowModal(true); };
    const openEdit = (s: Supplier) => { setEditSupplier(s); setForm({ name: s.name, email: s.email, phone: s.phone || '', address: s.address || '' }); setShowModal(true); };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editSupplier) { await api.put(`/suppliers/${editSupplier.id}`, form); }
            else { await api.post('/suppliers', form); }
            setShowModal(false); fetchSuppliers();
        } catch (e: any) { alert(e.response?.data?.error || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this supplier?')) return;
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
    };

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
                    <p className="text-gray-500 text-sm">{suppliers.length} total suppliers</p></div>
                <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Supplier</button>
            </div>

            <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map(sup => (
                        <div key={sup.id} className="card p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{sup.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{sup.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                            <Package size={11} /> {sup.item_count || 0} items
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(sup)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDelete(sup.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-500">
                                <div className="flex items-center gap-2"><Mail size={11} /> <span className="truncate">{sup.email}</span></div>
                                {sup.phone && <div>📞 {sup.phone}</div>}
                                {sup.address && <div className="text-gray-400 line-clamp-1">📍 {sup.address}</div>}
                            </div>
                        </div>
                    ))}
                    {suppliers.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400">No suppliers found.</div>}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
                        <div className="space-y-3">
                            {[{ key: 'name', label: 'Company Name', type: 'text' }, { key: 'email', label: 'Email Address', type: 'email' }, { key: 'phone', label: 'Phone (optional)', type: 'tel' }, { key: 'address', label: 'Address (optional)', type: 'text' }].map(({ key, label, type }) => (
                                <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                                    <input type={type} className="input" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={['name', 'email'].includes(key)} /></div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.email} className="btn-primary">{saving ? 'Saving...' : editSupplier ? 'Update' : 'Add Supplier'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
