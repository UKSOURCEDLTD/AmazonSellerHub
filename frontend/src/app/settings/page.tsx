"use client";

import { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAccount, SellerAccount } from "@/context/AccountContext";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsPage() {
    const { accounts } = useAccount();
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountRegion, setNewAccountRegion] = useState('NA');

    // Simple state for checkboxes
    const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['US']);

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "seller_accounts"), {
                name: newAccountName,
                region: newAccountRegion,
                marketplaces: selectedMarketplaces,
                created_at: serverTimestamp()
            });
            setIsAdding(false);
            setNewAccountName('');
            setSelectedMarketplaces(['US']);
        } catch (error) {
            console.error("Error adding account:", error);
        }
    };

    const toggleMarketplace = (mp: string) => {
        if (selectedMarketplaces.includes(mp)) {
            setSelectedMarketplaces(selectedMarketplaces.filter(m => m !== mp));
        } else {
            setSelectedMarketplaces([...selectedMarketplaces, mp]);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to remove this account?")) {
            try {
                await deleteDoc(doc(db, "seller_accounts", id));
            } catch (error) {
                console.error("Error deleting account:", error);
            }
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings & Integrations</h2>
                <p className="text-gray-500 mt-1">Manage your Amazon Seller Central connections.</p>
            </div>

            {/* Seller Accounts List */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Shield size={20} className="text-amber-600" />
                            Connected Accounts
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Manage access to different seller accounts.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                    >
                        <Plus size={16} />
                        Add Account
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAddAccount} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
                        <h4 className="font-semibold text-gray-900 mb-4">New Seller Account</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newAccountName}
                                    onChange={e => setNewAccountName(e.target.value)}
                                    placeholder="e.g. My Brand LLC"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={newAccountRegion}
                                    onChange={e => setNewAccountRegion(e.target.value)}
                                >
                                    <option value="NA">North America (NA)</option>
                                    <option value="EU">Europe (EU)</option>
                                    <option value="FE">Far East (FE)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 mb-2">Marketplaces</label>
                            <div className="flex flex-wrap gap-2">
                                {['US', 'CA', 'MX', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP'].map(mp => (
                                    <button
                                        key={mp}
                                        type="button"
                                        onClick={() => toggleMarketplace(mp)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedMarketplaces.includes(mp)
                                                ? 'bg-amber-100 border-amber-200 text-amber-800'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {mp}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 shadow-sm"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {account.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{account.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{account.region}</span>
                                        <span className="text-xs text-gray-400">|</span>
                                        <span className="text-xs text-gray-500">{account.marketplaces?.join(', ') || 'US'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 size={12} />
                                    Active
                                </div>
                                <button
                                    onClick={() => handleDelete(account.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove Account"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            No accounts connected yet. Add one to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* API Keys Info (Static for now as keys are env vars in this MVP) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex gap-3">
                    <AlertCircle className="text-gray-400 shrink-0" size={20} />
                    <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900 mb-1">API Authentication</p>
                        Current version uses environment variables (`LWA_CLIENT_ID`, etc.) for authentication.
                        Multi-account API key support is configured in the backend to specific accounts.
                    </div>
                </div>
            </div>
        </div>
    );
}
