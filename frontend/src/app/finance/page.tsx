"use client";

import { useState } from 'react';
import { Save, Calculator, AlertCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// Mock Product List for COGS entry
const MOCK_PRODUCTS = [
    { id: 1, title: 'Wireless Ergonomic Mouse - 2.4G', sku: 'MS-ERGO-2024', image: '', current_cogs: 8.50 },
    { id: 2, title: 'Mechanical Gaming Keyboard RGB', sku: 'KB-MECH-RGB', image: '', current_cogs: 24.00 },
    { id: 3, title: 'USB-C Docking Station 9-in-1', sku: 'HUB-USBC-9', image: '', current_cogs: 18.25 },
];

export default function FinancePage() {
    const [cogsData, setCogsData] = useState(MOCK_PRODUCTS);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Profit Calculation Mock
    const GROSS_SALES = 124000.00;
    const REFUNDS = 3200.50;
    const PROMOS = 1500.00;
    const ADS = 12500.00;
    const AMAZON_FEES = 38000.00;

    // Dynamic COGS Total based on mock sales volume (simplified)
    // Real app would sum (units_sold * cogs) per SKUs
    const ESTIMATED_UNITS_SOLD = 2500;
    const AVG_COGS = cogsData.reduce((acc, curr) => acc + curr.current_cogs, 0) / cogsData.length;
    const TOTAL_COGS = ESTIMATED_UNITS_SOLD * AVG_COGS;

    const NET_PROFIT = GROSS_SALES - REFUNDS - PROMOS - ADS - AMAZON_FEES - TOTAL_COGS;
    const MARGIN = (NET_PROFIT / GROSS_SALES) * 100;

    const handleCogsChange = (id: number, newValue: string) => {
        const val = parseFloat(newValue);
        if (isNaN(val)) return;

        setCogsData(prev => prev.map(p => p.id === id ? { ...p, current_cogs: val } : p));
        setUnsavedChanges(true);
    };

    const handleSave = () => {
        // Save to Firestore logic here
        setUnsavedChanges(false);
        alert("COGS updated successfully!"); // Replace with toast
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Financials & Profitability</h2>
                    <p className="text-gray-500 mt-1">Manage Costs of Goods Sold (COGS) and view Profit / Loss.</p>
                </div>

                <div className="bg-white rounded-lg p-1 border border-gray-200 flex text-sm font-medium">
                    <button className="px-4 py-1.5 rounded-md bg-gray-900 text-white shadow-sm">October 2026</button>
                </div>
            </div>

            {/* P&L Breakdown Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calculator size={20} className="text-gray-400" />
                        Profit & Loss Statement
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Gross Sales</span>
                            <span className="font-bold text-gray-900 text-lg">${GROSS_SALES.toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Refunds</span>
                                <span className="font-medium text-red-600">-${REFUNDS.toLocaleString()}</span>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Promos</span>
                                <span className="font-medium text-red-600">-${PROMOS.toLocaleString()}</span>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Ad Spend</span>
                                <span className="font-medium text-red-600">-${ADS.toLocaleString()}</span>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Amazon Fees</span>
                                <span className="font-medium text-red-600">-${AMAZON_FEES.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 border border-amber-100 bg-amber-50/50 rounded-lg">
                            <span className="font-medium text-amber-900">Cost of Goods Sold (Total)</span>
                            <span className="font-bold text-amber-700">-${TOTAL_COGS.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
                            <div>
                                <span className="text-sm text-gray-500">Net Profit</span>
                                <div className="text-3xl font-bold text-gray-900">${NET_PROFIT.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-lg text-sm font-bold ${MARGIN > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {MARGIN.toFixed(1)}% Margin
                            </div>
                        </div>
                    </div>
                </div>

                {/* COGS Entry */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Unit Costs (COGS)</h3>
                            <p className="text-xs text-gray-500 mt-1">Update product costs to ensure accurate P&L.</p>
                        </div>
                        {unsavedChanges && (
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                                <Save size={14} />
                                Save
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {cogsData.map((product) => (
                            <div key={product.id} className="p-3 border border-gray-100 rounded-xl hover:border-amber-200 transition-colors group">
                                <p className="font-medium text-sm text-gray-900 truncate mb-2">{product.title}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1 rounded">{product.sku}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Unit Cost:</span>
                                        <div className="relative">
                                            <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={product.current_cogs}
                                                onChange={(e) => handleCogsChange(product.id, e.target.value)}
                                                className="w-24 pl-6 pr-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-right font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!unsavedChanges && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2 items-start">
                            <AlertCircle size={14} className="mt-0.5" />
                            <p>All costs are up to date. P&L calculations are based on these values.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
