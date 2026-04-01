'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Package2, ArrowLeft, AlertCircle, Store, User, Mail, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function CreateStorePage() {
    const { registerStore } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ storeName: '', name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{ invite_code: string; store_name: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await registerStore(form.storeName, form.name, form.email, form.password);
            setSuccess(result);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (success) {
            navigator.clipboard.writeText(success.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Success Screen
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4">
                <div className="relative w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Store Created! 🎉</h2>
                        <p className="text-gray-400 text-sm mb-6">Welcome to <span className="text-indigo-300 font-semibold">{success.store_name}</span></p>

                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6">
                            <p className="text-xs text-indigo-300 mb-2 font-medium uppercase tracking-wider">Your Store Invite Code</p>
                            <p className="text-3xl font-mono font-bold text-white tracking-widest mb-3">{success.invite_code}</p>
                            <p className="text-xs text-gray-400 mb-3">Share this code with your team so they can join your store</p>
                            <button onClick={copyCode}
                                className="flex items-center gap-2 mx-auto text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                                {copied ? <><Check size={14} className="text-green-400" /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                            </button>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30"
                        >
                            Go to Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const fields = [
        { key: 'storeName', label: 'Store Name', placeholder: 'e.g. Alpha Electronics', icon: Store, type: 'text' },
        { key: 'name', label: 'Your Full Name', placeholder: 'John Doe', icon: User, type: 'text' },
        { key: 'email', label: 'Email Address', placeholder: 'you@example.com', icon: Mail, type: 'email' },
    ] as const;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4 py-8">
            <div className="absolute top-20 left-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

            <div className="relative w-full max-w-md">
                <button onClick={() => router.push('/auth')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Back</span>
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <Package2 size={30} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create Your Store</h1>
                    <p className="text-gray-400 mt-1">You'll be the admin of this store</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
                            <AlertCircle size={16} />{error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(({ key, label, placeholder, icon: Icon, type }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                                <div className="relative">
                                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required minLength={6}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 mt-2 disabled:opacity-60">
                            {loading ? 'Creating Store...' : '🏢 Create Store & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
