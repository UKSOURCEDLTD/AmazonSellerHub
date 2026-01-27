import React from 'react';
import { X, Package, DollarSign, Calendar, Truck, AlertCircle } from 'lucide-react';

interface OrderItem {
    sku: string;
    title: string;
    quantity: number;
    item_price: number;
}

interface Order {
    amazon_order_id: string;
    purchase_date: string;
    order_status: string;
    order_total: number;
    currency: string;
    estimated_fees: number;
    estimated_proceeds: number;
    items: OrderItem[];
    fulfillment_channel: string;
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
    if (!isOpen || !order) return null;

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.order_status === 'Shipped' ? 'bg-green-50 text-green-700 border-green-100' :
                                order.order_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-gray-50 text-gray-700 border-gray-100'
                                }`}>
                                {order.order_status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span className="font-mono">{order.amazon_order_id}</span>
                            <span>•</span>
                            <span>{formatDate(order.purchase_date)}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-8">

                    {/* Financial Breakdown */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <DollarSign size={16} className="text-amber-500" />
                            Financial Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Order Total</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(order.order_total, order.currency)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                                <p className="text-xs text-red-600 mb-1">Estimated Fees</p>
                                <p className="text-lg font-bold text-red-700">-{formatCurrency(order.estimated_fees, order.currency)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                                <p className="text-xs text-green-600 mb-1">Net Proceeds</p>
                                <p className="text-lg font-bold text-green-700">{formatCurrency(order.estimated_proceeds, order.currency)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Items */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Package size={16} className="text-amber-500" />
                            Order Items ({order.items.length})
                        </h3>
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-500">Item</th>
                                        <th className="px-4 py-3 font-semibold text-right text-gray-500">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-right text-gray-500">Price</th>
                                        <th className="px-4 py-3 font-semibold text-right text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item, idx) => (
                                        <tr key={`${item.sku}-${idx}`} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 line-clamp-2" title={item.title}>
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{item.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.item_price, order.currency)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                {formatCurrency(item.item_price * item.quantity, order.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Additional Details */}
                    {/* Additional Details */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Truck size={16} className="text-amber-500" />
                            Fulfillment
                        </h3>
                        <div className="p-4 rounded-xl border border-gray-100 text-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">Channel</span>
                                <span className="font-medium text-gray-900">{order.fulfillment_channel === 'AFN' ? 'Amazon FBA' : 'Merchant FBM'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Shipment Status</span>
                                <span className="font-medium text-gray-900">{order.order_status}</span>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
