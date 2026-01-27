"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, RefreshCw, ArrowUpDown } from 'lucide-react';
import { useAccount } from "@/context/AccountContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function InventoryPage() {
    const { selectedAccount, selectedMarketplace } = useAccount();
    const [filter, setFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'stock_level', direction: 'desc' }); // Default sort: Stock High to Low
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        setLoading(true);
        // Real-time listener for Inventory
        const q = collection(db, "inventory");
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: any[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });

            // Filter logic is applied on the full dataset client-side
            // (Efficient enough for <5000 items)

            // Apply Account/Marketplace filters here or in the render
            let filtered = data;
            if (selectedAccount) {
                // filtered = filtered.filter((item: any) => item.accountId === selectedAccount.id);
            }
            if (selectedMarketplace) {
                // filtered = filtered.filter((item: any) => item.marketplaceId === selectedMarketplace);
            }

            setProducts(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching inventory:", error);
            setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, [selectedAccount, selectedMarketplace]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, selectedAccount, selectedMarketplace]);

    const filteredData = filter === 'All'
        ? products
        : products.filter(item => item.status === filter);

    // Sorting Logic
    const sortedData = [...filteredData].sort((a, b) => {
        const { key, direction } = sortConfig;
        let valueA = a[key] ?? '';
        let valueB = b[key] ?? '';

        // Handle numeric sorting
        if (key === 'stock_level' || key === 'price') {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        }
        // Handle Date sorting
        else if (key === 'last_sold_date') {
            valueA = valueA ? new Date(valueA).getTime() : 0;
            valueB = valueB ? new Date(valueB).getTime() : 0;
        }
        // Handle case-insensitive string sorting
        else if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-sm text-gray-500 hidden md:inline">Sort by:</span>
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction });
                            }}
                            className="p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                            <option value="stock_level-desc">Stock: High to Low</option>
                            <option value="stock_level-asc">Stock: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="last_sold_date-desc">Last Sold: Recent First</option>
                            <option value="last_sold_date-asc">Last Sold: Oldest First</option>
                            <option value="title-asc">Name: A-Z</option>
                            <option value="title-desc">Name: Z-A</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { console.log('Refreshed (Realtime)'); }}
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
                                <th className="px-6 py-4 font-semibold text-gray-500">Last Sold</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Available</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Price</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Est. Fees</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Proceeds</th>
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
                                currentItems.map((item) => (
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
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {item.last_sold_date ? new Date(item.last_sold_date).toLocaleDateString() : '-'}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-gray-900">{item.stock_level}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-gray-900">${Number(item.price || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-500 text-xs">-${Number(item.estimated_fees || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${Number(item.estimated_proceeds || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                ${Number(item.estimated_proceeds || 0).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredData.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 px-6 py-4 border-t border-gray-100 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Show rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            >
                                <option value={5}>5</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Logic to show window of pages around current page
                                let pageNum = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => paginate(pageNum)}
                                        className={`w-8 h-8 rounded border text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-amber-500 text-white border-amber-500'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
