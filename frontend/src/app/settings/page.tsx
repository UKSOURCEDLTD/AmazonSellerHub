"use client";

import { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAccount, SellerAccount } from "@/context/AccountContext";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsPage() {
    const { accounts } = useAccount();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountRegion, setNewAccountRegion] = useState('NA');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [refreshToken, setRefreshToken] = useState('');
    const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['US']);

    // UI State
    const [showSecrets, setShowSecrets] = useState(false);

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "seller_accounts"), {
                name: newAccountName,
                region: newAccountRegion,
                marketplaces: selectedMarketplaces,
                // Saving credentials directly for this MVP. 
                // In production, these should be encrypted or stored via a backend function.
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                created_at: serverTimestamp()
            });

            // Reset Form
            setIsAdding(false);
            setNewAccountName('');
            setClientId('');
            setClientSecret('');
            setRefreshToken('');
            setSelectedMarketplaces(['US']);
        } catch (error) {
            console.error("Error adding account:", error);
            alert("Failed to add account. Check console.");
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
                        <p className="text-sm text-gray-500 mt-1">Manage access and API credentials.</p>
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
                        <h4 className="font-semibold text-gray-900 mb-4">New Seller Account Connection</h4>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Account Label</label>
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

                        {/* Credentials Section */}
                        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    <Key size={14} />
                                    SP-API Credentials
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setShowSecrets(!showSecrets)}
                                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                                >
                                    {showSecrets ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showSecrets ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">LWA Client ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                        placeholder="amzn1.application-oa2-client..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">LWA Client Secret</label>
                                    <input
                                        type={showSecrets ? "text" : "password"}
                                        required
                                        value={clientSecret}
                                        onChange={e => setClientSecret(e.target.value)}
                                        placeholder="amzn1.oa2-cs.v1..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Refresh Token</label>
                                    <input
                                        type={showSecrets ? "text" : "password"}
                                        required
                                        value={refreshToken}
                                        onChange={e => setRefreshToken(e.target.value)}
                                        placeholder="Atzr|..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                                    />
                                </div>
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
                                Save Connection
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
                                        {/* Indicator if credentials are set (roughly) */}
                                        {account.client_id ? (
                                            <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                                                <Key size={10} /> Connected
                                            </span>
                                        ) : (
                                            <span className="text-xs text-red-400 flex items-center gap-0.5">
                                                <AlertCircle size={10} /> No Creds
                                            </span>
                                        )}
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
                            No accounts connected yet. Click "Add Account" to connect your Seller Central.
                        </div>
                    )}
                </div>
            </div>

            {/* API Keys Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="flex gap-3">
                    <Shield className="text-blue-600 shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                        <p className="font-bold text-blue-900 mb-1">Secure Connection</p>
                        Your API credentials are stored in your private database. The backend uses these keys to fetch data directly from Amazon SP-API.
                    </div>
                </div>
            </div>
        </div>
    );
}
