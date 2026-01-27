"use client";

import { useState, useEffect } from 'react';
import { Save, Calculator, AlertCircle, DollarSign } from 'lucide-react';


interface Product {
    id: string;
    title: string;
    sku: string;
    image: string;
    current_cogs: number;
    stock_level?: number;
}

export default function FinancePage() {
    const [cogsData, setCogsData] = useState<Product[]>([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Inventory from Local API
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/inventory');
                const inventoryData: any[] = await res.json();

                const products: Product[] = inventoryData.map(data => ({
                    id: data.id,
                    title: data.title || "Unknown Product",
                    sku: data.sku || "N/A",
                    image: data.image || "",
                    current_cogs: data.cogs || 0,
                    stock_level: data.stock_level || 0
                }));
                setCogsData(products);
            } catch (error) {
                console.error("Error fetching inventory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, []);

    // Profit Calculation Constants (Mocked for now, or could be fetched)
    const GROSS_SALES = 124000.00;
    const REFUNDS = 3200.50;
    const PROMOS = 1500.00;
    const ADS = 12500.00;
    const AMAZON_FEES = 38000.00;

    // Dynamic COGS Total based on stock/sales logic
    // Using stock_level as a proxy for sales volume allocation or just sum of all cogs * some estimated sales ratio
    // For this simple view, we'll approximate: Sum of (COGS * 10% of stock) as if we sold 10% of inventory? 
    // OR just use the example logic: ESTIMATED_UNITS_SOLD * AVG_COGS
    const ESTIMATED_UNITS_SOLD = 2500;
    const validCogsCount = cogsData.filter(p => p.current_cogs > 0).length;
    const avgCogs = validCogsCount > 0
        ? cogsData.reduce((acc, curr) => acc + curr.current_cogs, 0) / validCogsCount
        : 0;

    const TOTAL_COGS = ESTIMATED_UNITS_SOLD * avgCogs;

    const NET_PROFIT = GROSS_SALES - REFUNDS - PROMOS - ADS - AMAZON_FEES - TOTAL_COGS;
    const MARGIN = GROSS_SALES > 0 ? (NET_PROFIT / GROSS_SALES) * 100 : 0;

    const handleCogsChange = (id: string, newValue: string) => {
        const val = parseFloat(newValue);
        if (isNaN(val)) return;

        setCogsData(prev => prev.map(p => p.id === id ? { ...p, current_cogs: val } : p));
        setUnsavedChanges(true);
    };

    const handleSave = async () => {
        alert("Saving COGS is disabled in this local view mode.");
        setUnsavedChanges(false);
    };

    if (loading) {
        return <div className="p-10 text-center">Loading Financial Data...</div>;
    }

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
                            <span className="font-medium text-gray-700">GROSS Sales (Mock)</span>
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
                            <span className="font-medium text-amber-900">Cost of Goods Sold (Est.)</span>
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
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-[600px]">
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
                        {cogsData.length === 0 && <p className="text-sm text-gray-400">No inventory found.</p>}
                        {cogsData.map((product) => (
                            <div key={product.id} className="p-3 border border-gray-100 rounded-xl hover:border-amber-200 transition-colors group">
                                <p className="font-medium text-sm text-gray-900 truncate mb-2">{product.title}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1 rounded truncate max-w-[100px]" title={product.sku}>{product.sku}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Unit Cost:</span>
                                        <div className="relative">
                                            <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={product.current_cogs || ''}
                                                onChange={(e) => handleCogsChange(product.id, e.target.value)}
                                                className={`w-24 pl-6 pr-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-right font-medium ${product.current_cogs === 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!unsavedChanges && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2 items-start shrink-0">
                            <AlertCircle size={14} className="mt-0.5" />
                            <p>All costs are up to date. P&L calculations are based on these values.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
