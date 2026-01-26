"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InventoryPage() {
    const [filter, setFilter] = useState('All');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Fetch from Firestore
            const querySnapshot = await getDocs(collection(db, "inventory"));
            const data = querySnapshot.docs.map(doc => doc.data());
            setProducts(data);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const filteredData = filter === 'All'
        ? products
        : products.filter(item => item.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Healthy': return 'bg-green-50 text-green-700 border-green-100';
            case 'At Risk': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Stranded': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Healthy': return <CheckCircle size={14} />;
            case 'At Risk': return <AlertTriangle size={14} />;
            case 'Stranded': return <XCircle size={14} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Track stock levels, inbound shipments, and health.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={fetchInventory}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search ASIN, SKU, or Title..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['All', 'Healthy', 'At Risk', 'Stranded'].map((stat) => (
                    <button
                        key={stat}
                        onClick={() => setFilter(stat)}
                        className={`p-4 rounded-xl border text-left transition-all ${filter === stat
                            ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            }`}
                    >
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${filter === stat ? 'text-amber-700' : 'text-gray-400'
                            }`}>
                            {stat} Items
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stat === 'All' ? products.length : products.filter(i => i.status === stat).length}
                        </p>
                    </button>
                ))}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Product Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">ASIN / SKU</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Status</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Available</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading inventory...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400">
                                    {products.length === 0 ? "Inventory syncing... run the script!" : "No products found for this filter."}
                                </td></tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.title || "Unknown Title"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded w-fit mb-1">{item.asin}</span>
                                                <span className="text-xs text-gray-400">{item.sku}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status || 'Healthy')}`}>
                                                {getStatusIcon(item.status || 'Healthy')}
                                                {item.status || 'Healthy'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-gray-900">{item.stock_level}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-gray-900">${item.price}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
