'use client';
import { useRouter } from 'next/navigation';
import { Package2, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export default function ExistingStorePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4">
            <div className="absolute top-20 right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />

            <div className="relative w-full max-w-md">
                {/* Back button */}
                <button onClick={() => router.push('/auth')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Back</span>
                </button>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <Package2 size={30} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">InventoryPro</h1>
                    <p className="text-gray-400 mt-1">Already have a store?</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white text-center mb-2">Choose an option</h2>
                    <p className="text-gray-400 text-sm text-center mb-8">Are you logging back in or joining a new store?</p>

                    <div className="space-y-4">
                        {/* Login */}
                        <button
                            onClick={() => router.push('/auth/login')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <LogIn size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Login to Store</p>
                                <p className="text-indigo-200 text-sm">Sign in with your email & password</p>
                            </div>
                        </button>

                        {/* Join Store */}
                        <button
                            onClick={() => router.push('/auth/join-store')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <UserPlus size={20} className="text-gray-300" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Join with Invite Code</p>
                                <p className="text-gray-400 text-sm">Register using a store invite code</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
