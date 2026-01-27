"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, DollarSign, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { useAccount } from "@/context/AccountContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import DateRangePicker, { DateRange } from '@/components/dashboard/DateRangePicker';

export default function OrdersPage() {
    const { selectedAccount, selectedMarketplace } = useAccount();
    const [filter, setFilter] = useState('All');
    const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25; // Or 50 / 100

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        label: 'Last 30 Days',
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
    });

    const handleOrderClick = (order: any) => {
        setSelectedOrder(order);
    };

    useEffect(() => {
        setLoading(true);
        const q = collection(db, "orders");

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data: any[] = [];
            snapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });

            // Filter by Account
            if (selectedAccount) {
                // In a real app we might query by accountId in Firestore
                // but for migration parity we filter client side 
                data = data.filter((o: any) => o.accountId === selectedAccount.id);
            }
            if (selectedMarketplace) {
                // data = data.filter((o: any) => o.marketplaceId === selectedMarketplace);
            }

            // Sort
            data.sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

            setOrders(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedAccount, selectedMarketplace]);

    // 1. First, filter by Date (used for Stats)
    const dateFilteredOrders = orders.filter(item => {
        if (!item.purchase_date) return false;
        const orderDate = new Date(item.purchase_date);
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
    });

    // 2. Then, filter by Status & Fulfillment (used for Table)
    const filteredData = dateFilteredOrders.filter(item => {
        const matchesStatus = filter === 'All' || item.order_status === filter;
        const matchesFulfillment = fulfillmentFilter === 'All' ||
            (fulfillmentFilter === 'FBA' && item.fulfillment_channel === 'AFN') ||
            (fulfillmentFilter === 'FBM' && item.fulfillment_channel === 'MFN');

        return matchesStatus && matchesFulfillment;
    });

    // 3. Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedOrders = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, fulfillmentFilter, dateRange]);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Shipped': return 'bg-green-50 text-green-700 border-green-100';
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Canceled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Shipped': return <Truck size={14} />;
            case 'Pending': return <Clock size={14} />;
            case 'Canceled': return <CheckCircle size={14} />;
            default: return <Package size={14} />;
        }
    };

    const formatCurrency = (amount: any) => {
        const num = parseFloat(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    if (!selectedAccount) {
        return <div className="p-8 text-center text-gray-500">Please select an account.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Viewing orders for <span className="font-semibold text-gray-900">{selectedAccount.name}</span> ({selectedMarketplace})
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Order ID, ASIN..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />

                    </div>

                    <div className="bg-white rounded-lg p-0 border border-gray-200 flex text-sm font-medium">
                        <DateRangePicker
                            currentRange={dateRange}
                            onRangeChange={setDateRange}
                        />
                    </div>

                    <select
                        value={fulfillmentFilter}
                        onChange={(e) => setFulfillmentFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    >
                        <option value="All">All Channels</option>
                        <option value="FBA">FBA</option>
                        <option value="FBM">FBM</option>
                    </select>


                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['All', 'Shipped', 'Pending', 'Canceled'].map((stat) => (
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
                            {stat} Orders
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {/* Use dateFilteredOrders here so stats reflect the DATE range but not current Status tab */}
                            {stat === 'All' ? dateFilteredOrders.length : dateFilteredOrders.filter(i => i.order_status === stat).length}
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
                                <th className="px-6 py-4 font-semibold text-gray-500">Order Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Product</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Status</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Total</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Est. Fees</th>
                                <th className="px-6 py-4 font-semibold text-right text-gray-500">Est. Proceeds</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading orders...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400">
                                    {orders.length === 0 ? "No orders found for this account/marketplace." : "No orders matching filter."}
                                </td></tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr
                                        key={order.amazon_order_id}
                                        className="hover:bg-amber-50/10 cursor-pointer transition-colors group"
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">{order.amazon_order_id}</span>
                                                <span className="text-xs text-gray-500">{new Date(order.purchase_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                {order.items && order.items.length > 0 ? (
                                                    <>
                                                        <span className="font-medium text-gray-900 truncate max-w-xs" title={order.items[0].title || order.items[0].sku}>
                                                            {order.items[0].title || "Product Name Unavailable"}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{order.items[0].sku}</span>
                                                        {order.items.length > 1 && <span className="text-xs text-amber-600">+{order.items.length - 1} more items</span>}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">No items</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.order_status)}`}>
                                                {getStatusIcon(order.order_status)}
                                                {order.order_status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-gray-900">{order.currency} {formatCurrency(order.order_total)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-red-600">-{order.currency} {formatCurrency(order.estimated_fees)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-green-700">{order.currency} {formatCurrency(order.estimated_proceeds)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredData.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> orders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <OrderDetailsModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div>
    );
}
