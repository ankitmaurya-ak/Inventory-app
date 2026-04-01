'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Package2, ArrowLeft, AlertCircle, Hash, User, Mail, Lock, Eye, EyeOff, Store, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';

export default function JoinStorePage() {
    const { joinStore } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ inviteCode: '', name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [storePreview, setStorePreview] = useState<string | null>(null);
    const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-lookup store name while typing invite code
    useEffect(() => {
        const code = form.inviteCode.toUpperCase().trim();
        if (code.length < 6) { setStorePreview(null); setCodeStatus('idle'); return; }

        setCodeStatus('checking');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/auth/store-info/${code}`);
                setStorePreview(res.data.name);
                setCodeStatus('valid');
            } catch {
                setStorePreview(null);
                setCodeStatus('invalid');
            }
        }, 600);
    }, [form.inviteCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await joinStore(form.inviteCode, form.name, form.email, form.password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to join store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4 py-8">
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />

            <div className="relative w-full max-w-md">
                <button onClick={() => router.push('/auth/existing')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Back</span>
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <Package2 size={30} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Join a Store</h1>
                    <p className="text-gray-400 mt-1">Enter your invite code to get started</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
                            <AlertCircle size={16} />{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Invite Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Store Invite Code
                            </label>
                            <div className="relative">
                                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={form.inviteCode}
                                    onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                                    placeholder="STORE-XXXXXX"
                                    maxLength={12}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all font-mono tracking-widest uppercase
                                        ${codeStatus === 'valid' ? 'border-green-500/50 focus:ring-green-500' :
                                          codeStatus === 'invalid' ? 'border-red-500/50 focus:ring-red-500' :
                                          'border-white/10 focus:ring-indigo-500'}`}
                                    required
                                />
                            </div>
                            {/* Store preview */}
                            {codeStatus === 'checking' && (
                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                    <span className="animate-spin inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                                    Looking up store...
                                </p>
                            )}
                            {codeStatus === 'valid' && storePreview && (
                                <div className="flex items-center gap-2 mt-1.5 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                                    <p className="text-xs text-green-300">
                                        Joining: <span className="font-semibold">{storePreview}</span>
                                    </p>
                                </div>
                            )}
                            {codeStatus === 'invalid' && form.inviteCode.length >= 6 && (
                                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} /> Invalid invite code
                                </p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'} value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading || codeStatus === 'invalid'}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                            {loading ? 'Joining Store...' : '🚀 Join Store'}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        Already have an account?{' '}
                        <a href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
