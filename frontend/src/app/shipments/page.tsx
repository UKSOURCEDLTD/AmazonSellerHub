'use client';
import { useState, useEffect } from 'react';
import { Truck, Search, Filter, MoreVertical, MapPin, Calendar, ArrowUpRight, X, Package, AlertCircle } from 'lucide-react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<any[]>([]);
    const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const q = collection(db, "shipments");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data: any[] = [];
            snapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });
            // Client-side sort by date descending (optional)
            // data.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

            setShipments(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching shipments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'bg-green-100 text-green-700';
            case 'In Transit': return 'bg-blue-100 text-blue-700';
            case 'Processing': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your FBA incoming shipments</p>
                </div>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Truck size={18} />
                    New Shipment
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Active Shipments',
                            value: shipments.filter(s => ['WORKING', 'SHIPPED', 'IN_TRANSIT', 'RECEIVING'].includes(s.status)).length.toString(),
                            change: '0',
                            trend: 'flat'
                        },
                        {
                            label: 'In Transit',
                            value: shipments.filter(s => s.status === 'IN_TRANSIT').length.toString(),
                            change: '0',
                            trend: 'flat'
                        },
                        {
                            label: 'Delivered (All)',
                            value: shipments.filter(s => ['DELIVERED', 'CLOSED', 'CHECKED_IN'].includes(s.status)).length.toString(),
                            change: '0',
                            trend: 'flat'
                        },
                        {
                            label: 'Items (Est)',
                            value: shipments.reduce((acc, s) => acc + (s.items || 0), 0).toString(),
                            change: '0',
                            trend: 'flat'
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">{stat.label}</p>
                            <div className="flex items-end justify-between mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                {/* Trend UI hidden for now as we don't have historical delta */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by ID, reference or tracking..."
                        className="w-full pl-10 pr-4 py-2 text-sm border-none focus:ring-0 text-gray-900 placeholder-gray-400"
                    />
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <Filter size={16} />
                    Filter
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <Calendar size={16} />
                    Date Range
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipment ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shipments.map((shipment) => (
                            <tr
                                key={shipment.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedShipment(shipment)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                            <Truck size={16} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">{shipment.shipment_name || shipment.id}</span>
                                            <span className="block text-xs text-gray-500">{shipment.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="text-sm">{shipment.destination}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                                        {shipment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {shipment.items} units
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {shipment.created_date || shipment.date}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        {shipment.tracking}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Shipment Details Modal */}
            {
                selectedShipment && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end transition-opacity" onClick={() => setSelectedShipment(null)}>
                        <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right-10 duration-200" onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedShipment.shipment_name || selectedShipment.id}</h2>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedShipment.status)}`}>
                                            {selectedShipment.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm flex items-center gap-2">
                                        <span className="font-mono">{selectedShipment.id}</span>
                                        <span>•</span>
                                        <span>Created {selectedShipment.created_date || selectedShipment.date}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedShipment(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <MapPin size={16} />
                                        <span className="text-xs uppercase font-semibold">Destination</span>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">{selectedShipment.destination}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Truck size={16} />
                                        <span className="text-xs uppercase font-semibold">Tracking</span>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 font-mono">{selectedShipment.tracking || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Contents Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Package size={20} className="text-gray-400" />
                                        Shipment Contents
                                    </h3>
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                        {selectedShipment.shipment_items?.length || 0} SKUs
                                    </span>
                                </div>

                                {!selectedShipment.shipment_items || selectedShipment.shipment_items.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Package size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No content data available.</p>
                                        <p className="text-xs text-gray-400 mt-1">Run a sync to fetch item details.</p>
                                    </div>
                                ) : (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold text-gray-600">SKU / Product</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Shipped</th>
                                                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Received</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedShipment.shipment_items.map((item: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900">{item.sku}</div>
                                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.fulfillment_network_sku}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                            {item.quantity_shipped}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`
                                                            ${item.quantity_received === item.quantity_shipped ? 'text-green-600 font-medium' : ''}
                                                            ${item.quantity_received > 0 && item.quantity_received < item.quantity_shipped ? 'text-amber-600' : ''}
                                                            ${item.quantity_received === 0 ? 'text-gray-400' : ''}
                                                        `}>
                                                                {item.quantity_received}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )
            }
        </div >
    );
}
