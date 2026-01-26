"use client"; // Required for Recharts

import StatCard from "@/components/dashboard/StatCard";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface OrderItem {
  sku: string;
  quantity: number;
  item_price: number;
}

interface Order {
  id: string;
  order_total: number;
  estimated_fees: number;
  items: OrderItem[];
  order_status: string;
}

interface InventoryItem {
  sku: string;
  cogs: number;
  stock_level: number;
  status: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalFees: 0,
    totalCOGS: 0,
    netProfit: 0,
    margin: 0,
    inventoryCount: 0,
    inStockScore: 98, // Mocked for now
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Inventory for COGS mapping
        const inventorySnap = await getDocs(collection(db, "inventory"));
        const skuToCogs: Record<string, number> = {};
        let totalInventoryItems = 0;

        inventorySnap.forEach(doc => {
          const data = doc.data() as InventoryItem;
          // IMPORTANT: Default to 0 if COGS is missing
          skuToCogs[data.sku] = data.cogs || 0;
          totalInventoryItems++;
        });

        // 2. Fetch Orders for Sales & Fees
        const ordersSnap = await getDocs(collection(db, "orders"));

        let sales = 0;
        let fees = 0;
        let cogs = 0;

        ordersSnap.forEach(doc => {
          const order = doc.data() as Order;

          // Skip canceled orders for specific metrics if desired, but for now include all verified sales
          if (order.order_status === 'Canceled') return;

          sales += order.order_total || 0;
          fees += order.estimated_fees || 0;

          // Calculate COGS for this order
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              const itemCogs = skuToCogs[item.sku] || 0; // Default 0 if SKU not found or COGS missing
              cogs += itemCogs * (item.quantity || 1);
            });
          }
        });

        // 3. Constants (for now)
        const mockAds = 12500; // Keep consistent with Finance Page mock
        const mockRefunds = 0; // Assuming 'net' sales or separate fetch? For now 0.

        const netProfit = sales - fees - cogs - mockAds - mockRefunds;
        const margin = sales > 0 ? (netProfit / sales) * 100 : 0;

        setMetrics({
          totalSales: sales,
          totalFees: fees,
          totalCOGS: cogs,
          netProfit: netProfit,
          margin: margin,
          inventoryCount: totalInventoryItems,
          inStockScore: 98
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const salesData = [
    { name: 'Achieved', value: metrics.totalSales, color: '#F59E0B' }, // Amber-500
    { name: 'Remaining', value: 150000 - metrics.totalSales > 0 ? 150000 - metrics.totalSales : 0, color: '#FEF3C7' }, // Amber-100
  ];

  const profitData = [
    { name: 'Profit', value: metrics.netProfit > 0 ? metrics.netProfit : 0, color: '#F59E0B' },
    { name: 'Costs', value: metrics.totalSales - metrics.netProfit, color: '#F3F4F6' },
  ];

  const roiData = [
    { name: 'ROI', value: 145, color: '#F59E0B' }, // Hardcoded for now
    { name: 'Spend', value: 100, color: '#F3F4F6' },
  ];

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-gray-500 mt-1">Real-time performance metrics</p>
        </div>

        <div className="bg-white rounded-lg p-1 border border-gray-200 flex text-sm font-medium">
          <button className="px-4 py-1.5 rounded-md bg-gray-900 text-white shadow-sm">Month</button>
          <button className="px-4 py-1.5 rounded-md text-gray-500 hover:text-gray-900">Quarter</button>
          <button className="px-4 py-1.5 rounded-md text-gray-500 hover:text-gray-900">Year</button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={`$${metrics.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change="-"
          changeType="positive"
          data={salesData}
          centerLabel={`$${(metrics.totalSales / 1000).toFixed(1)}k`}
          centerSubLabel="Real Revenue"
          subValue="Real-time from Orders"
        />
        <StatCard
          title="Net Profit"
          value={`$${metrics.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={`${metrics.margin.toFixed(1)}%`}
          changeType={metrics.netProfit >= 0 ? "positive" : "negative"}
          data={profitData}
          centerLabel={`$${(metrics.netProfit / 1000).toFixed(1)}k`}
          centerSubLabel="Net Profit"
          subValue={`COGS: $${metrics.totalCOGS.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <StatCard
          title="ROI"
          value="145%"
          change="0.2%"
          changeType="negative" // Just to show variety
          data={roiData}
          centerLabel="145%"
          centerSubLabel="Return on Ad Spend"
          subValue="Ad Spend: $12.5k (Est)"
        />
      </div>

      {/* Row 2: Inventory, Payout, Refund */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Health - Spans 2 cols on very large screens if needed, but keeping 3 equal for now */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Inventory Health</h3>
              <p className="text-sm text-gray-500">Stock efficiency and availability</p>
            </div>
            <button className="text-amber-500 text-sm font-medium hover:underline">View Report</button>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">{metrics.inStockScore}%</span>
            <span className="text-gray-500 mb-1 font-medium">In Stock Score</span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-6">
            <div className="h-full bg-amber-400 w-[85%]"></div>
            <div className="h-full bg-amber-200 w-[10%]"></div>
            <div className="h-full bg-red-400 w-[5%]"></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total SKUs</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{metrics.inventoryCount}</p>
              <p className="text-xs text-gray-500">Active Items</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-200"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">At Risk</span>
              </div>
              <p className="text-lg font-bold text-gray-900">154</p>
              <p className="text-xs text-gray-500">Low stock</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stranded</span>
              </div>
              <p className="text-lg font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-500">Fix required</p>
            </div>
          </div>
        </div>

        {/* Right Col Items */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Next Payout</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">$12,450</span>
              <span className="text-sm text-gray-400">USD</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm font-medium w-fit">
              Arriving Oct 24
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Refund Rate</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">2.1%</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">-0.5% vs avg</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded text-green-600 flex items-center justify-center">
                {/* Thumbs up icon or similar */}
                <ArrowUpRight size={16} className="rotate-45" />
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
              <div className="w-[30%] h-full bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
