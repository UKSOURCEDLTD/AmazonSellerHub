"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, DollarSign, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function OrdersPage() {
    const [filter, setFilter] = useState('All');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            const data = querySnapshot.docs.map(doc => doc.data());

            // Sort client-side for simplicity as basic query
            data.sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredData = filter === 'All'
        ? orders
        : orders.filter(item => item.order_status === filter);

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

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
                    <p className="text-gray-500 text-sm mt-1">View recent orders, fees, and net proceeds.</p>
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
                            {stat === 'All' ? orders.length : orders.filter(i => i.order_status === stat).length}
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
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400">
                                    {orders.length === 0 ? "No orders found. Run the sync script!" : "No orders matching filter."}
                                </td></tr>
                            ) : (
                                filteredData.map((order) => (
                                    <tr key={order.amazon_order_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{order.amazon_order_id}</span>
                                                <span className="text-xs text-gray-500">{new Date(order.purchase_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                {order.items && order.items.length > 0 ? (
                                                    <>
                                                        <span className="font-medium text-gray-900 truncate max-w-xs" title={order.items[0].title}>{order.items[0].title}</span>
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
                                            <span className="font-medium text-gray-900">{order.currency} {order.order_total}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-red-600">-{order.currency} {order.estimated_fees}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-green-700">{order.currency} {order.estimated_proceeds}</span>
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
