"use client";

import { useState } from 'react';
import { Bell, Search, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

const Header = () => {
    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSync = async () => {
        setSyncing(true);
        setStatus('idle');
        try {
            // Use relative path via Firebase Rewrites
            const functionUrl = "/api/manual_amazon_sync";

            // If running strictly locally without emulators, this might fail or needs a mock.
            // But we assume deployed or properly configured environment.
            if (process.env.NODE_ENV === 'development') {
                console.log("Development mode: ensure emulators are running or URL is correct.");
                // Mock success for dev demo if real URL isn't reachable
                // await new Promise(r => setTimeout(r, 2000));
            }

            const response = await fetch(functionUrl, { method: 'POST' });
            if (!response.ok) throw new Error('Sync failed');

            setStatus('success');
            // Refresh page to show new data? Or just let user navigate
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error("Sync error:", error);
            setStatus('error');
        } finally {
            setSyncing(false);
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Dashboard</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-900">Overview</span>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                        status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {syncing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Syncing...
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle size={16} />
                            Synced!
                        </>
                    ) : status === 'error' ? (
                        <>
                            <XCircle size={16} />
                            Failed
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            Sync Now
                        </>
                    )}
                </button>

                <div className="h-6 w-px bg-gray-200"></div>

                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">Alex Morgan</p>
                        <p className="text-xs text-gray-500">Pro Seller</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                        {/* Placeholder for user avatar */}
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-medium">AM</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
