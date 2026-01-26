import { Truck, Search, Filter, MoreVertical, MapPin, Calendar, ArrowUpRight } from 'lucide-react';

export default function ShipmentsPage() {
    const shipments = [
        {
            id: 'SHP-2024-001',
            destination: 'LBA4 - Leeds',
            status: 'In Transit',
            items: 450,
            date: 'Jan 24, 2024',
            carrier: 'UPS',
            tracking: '1Z999AA10123456784'
        },
        {
            id: 'SHP-2024-002',
            destination: 'BHX4 - Coventry',
            status: 'Delivered',
            items: 120,
            date: 'Jan 22, 2024',
            carrier: 'DHL',
            tracking: 'JD0146000032402123'
        },
        {
            id: 'SHP-2024-003',
            destination: 'MAN1 - Manchester',
            status: 'Processing',
            items: 850,
            date: 'Jan 26, 2024',
            carrier: 'Amazon Partnered',
            tracking: 'Pending'
        },
        {
            id: 'SHP-2024-004',
            destination: 'LCY2 - Tilbury',
            status: 'Created',
            items: 200,
            date: 'Jan 26, 2024',
            carrier: 'Pending',
            tracking: 'Pending'
        }
    ];

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
                {[
                    { label: 'Active Shipments', value: '12', change: '+2', trend: 'up' },
                    { label: 'In Transit', value: '4', change: '0', trend: 'flat' },
                    { label: 'Delivered (7d)', value: '8', change: '+3', trend: 'up' },
                    { label: 'Total Items', value: '1,420', change: '+15%', trend: 'up' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
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
                            <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                            <Truck size={16} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">{shipment.id}</span>
                                            <span className="block text-xs text-gray-500">{shipment.carrier}</span>
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
                                    {shipment.date}
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
        </div>
    );
}
