"use strict";
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    data: { name: string; value: number; color: string }[];
    centerLabel?: string;
    centerSubLabel?: string;
}

const StatCard = ({ title, value, subValue, change, changeType = 'positive', data, centerLabel, centerSubLabel }: StatCardProps) => { // Removed 'use client' from top, added to page import if needed, or component needs 'use client'
    // Actually, components using Recharts must be client components.

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${changeType === 'positive' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {changeType === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {change}
                    </div>
                )}
            </div>

            <div className="flex-1 relative min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900">{centerLabel || value}</span>
                    {centerSubLabel && <span className="text-xs text-gray-400 mt-1">{centerSubLabel}</span>}
                </div>
            </div>

            <div className="mt-6 text-center">
                {subValue && <p className="text-sm text-gray-400">{subValue}</p>}
            </div>
        </div>
    );
};

export default StatCard;
