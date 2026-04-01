'use client';
import { useRouter } from 'next/navigation';
import { Package2, Store, LogIn } from 'lucide-react';

export default function AuthEntryPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4">
            {/* Background orbs */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/40 mb-5">
                        <Package2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">InventoryPro</h1>
                    <p className="text-gray-400 mt-2 text-base">Smart Inventory Management</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white text-center mb-2">Welcome</h2>
                    <p className="text-gray-400 text-sm text-center mb-8">How would you like to get started?</p>

                    <div className="space-y-4">
                        {/* Create New Store */}
                        <button
                            onClick={() => router.push('/auth/create-store')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Store size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Create New Store</p>
                                <p className="text-indigo-200 text-sm">Set up your business from scratch</p>
                            </div>
                        </button>

                        {/* Already Have a Store */}
                        <button
                            onClick={() => router.push('/auth/existing')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <LogIn size={20} className="text-gray-300" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Already Have a Store</p>
                                <p className="text-gray-400 text-sm">Login or join an existing store</p>
                            </div>
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Secure · Multi-tenant · Real-time inventory
                </p>
            </div>
        </div>
    );
}
