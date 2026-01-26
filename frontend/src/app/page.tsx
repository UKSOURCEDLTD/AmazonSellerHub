"use client"; // Required for Recharts

import StatCard from "@/components/dashboard/StatCard";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const salesData = [
    { name: 'Achieved', value: 124000, color: '#F59E0B' }, // Amber-500
    { name: 'Remaining', value: 26000, color: '#FEF3C7' }, // Amber-100
  ];

  const profitData = [
    { name: 'Profit', value: 42100, color: '#F59E0B' },
    { name: 'Cost', value: 81900, color: '#F3F4F6' },
  ];

  const roiData = [
    { name: 'ROI', value: 145, color: '#F59E0B' },
    { name: 'Spend', value: 100, color: '#F3F4F6' }, // Abstract
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-gray-500 mt-1">Real-time performance metrics for October 2026</p>
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
          value="$124k"
          change="12%"
          changeType="positive"
          data={salesData}
          centerLabel="$124k"
          centerSubLabel="of $150k goal"
          subValue="Highest daily: $8.2k on Oct 12"
        />
        <StatCard
          title="Net Profit"
          value="$42.1k"
          change="5.4%"
          changeType="positive"
          data={profitData}
          centerLabel="$42.1k"
          centerSubLabel="33.8% Margin"
          subValue="+$2.1k vs last month"
        />
        <StatCard
          title="ROI"
          value="145%"
          change="0.2%"
          changeType="negative" // Just to show variety
          data={roiData}
          centerLabel="145%"
          centerSubLabel="Return on Ad Spend"
          subValue="Ad Spend: $12.5k"
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
            <span className="text-4xl font-bold text-gray-900">98%</span>
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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Healthy</span>
              </div>
              <p className="text-lg font-bold text-gray-900">1,240</p>
              <p className="text-xs text-gray-500">Units</p>
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
