"use client";

import { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings & Integrations</h2>
                <p className="text-gray-500 mt-1">Manage your Amazon Seller Central connection and API keys.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Amazon SP-API Connection</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                            To connect your account, you need to add your **Login with Amazon (LWA)** credentials to the system securely.
                            Since this is a self-hosted instance, these keys remain in your private Firebase environment.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
                        <AlertCircle size={20} className="shrink-0" />
                        <div>
                            <span className="font-bold block mb-1">Configuration Required</span>
                            You must set these values in your **Firebase Secrets Manager** (or `.env.local` for local development).
                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                <li><code>LWA_CLIENT_ID</code></li>
                                <li><code>LWA_CLIENT_SECRET</code></li>
                                <li><code>SP_API_REFRESH_TOKEN</code></li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">LWA Client ID</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    disabled
                                    value="amzn1.application-oa2-client.xxxxxxxxxxxxxxxxx"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm font-mono cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                                    Configured in Backend
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">SP-API Refresh Token</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={isVisible ? "text" : "password"}
                                    disabled
                                    value="Atzr|IwEBIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm font-mono cursor-not-allowed"
                                />
                                <button onClick={() => setIsVisible(!isVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                                    {isVisible ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button className="flex items-center gap-2 px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors cursor-not-allowed opacity-50">
                            <CheckCircle2 size={18} />
                            Connection Verified
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
