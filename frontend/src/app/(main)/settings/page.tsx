'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Settings, Mail, KeyRound, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({ email_user: '', email_pass: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });

    useEffect(() => {
        if (user?.role !== 'admin') {
            setLoading(false);
            return;
        }
        api.get('/settings').then(res => {
            setForm({
                email_user: res.data.email_user || '',
                email_pass: res.data.email_pass || '',
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: '', isError: false });
        try {
            await api.put('/settings', form);
            setMessage({ text: 'Settings updated successfully!', isError: false });
        } catch (e: any) {
            setMessage({ text: e.response?.data?.error || 'Failed to update settings.', isError: true });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ text: '', isError: false }), 4000);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Settings size={48} className="mb-4 opacity-30" />
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
                <p className="text-gray-500 text-sm mt-0.5">Configure global application variables</p>
            </div>

            <div className="card p-6">
                <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="text-indigo-500" size={20} /> Email Dispatcher Configuration
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Set the sender email address used to contact suppliers when stock runs low.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" /></div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Sender Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="input pl-10"
                                    placeholder="e.g. your-email@gmail.com"
                                    value={form.email_user}
                                    onChange={e => setForm({ ...form, email_user: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                App Password / Server Password
                            </label>
                            <div className="relative">
                                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    className="input pl-10"
                                    placeholder="Enter secure password"
                                    value={form.email_pass}
                                    onChange={e => setForm({ ...form, email_pass: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                For Gmail, you must generate an App Password. Normal passwords will be blocked.
                            </p>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            {message.text ? (
                                <span className={`text-sm font-medium ${message.isError ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {message.text}
                                </span>
                            ) : <span />}

                            <button
                                onClick={handleSave}
                                disabled={saving || !form.email_user}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
