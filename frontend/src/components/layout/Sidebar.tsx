import Link from 'next/link';
import { LayoutDashboard, BarChart3, Package, DollarSign, Settings, ShoppingCart } from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { name: 'Overview', icon: LayoutDashboard, href: '/', active: true },
        { name: 'Analytics', icon: BarChart3, href: '/analytics', active: false },
        { name: 'Inventory', icon: Package, href: '/inventory', active: false },
        { name: 'Orders', icon: ShoppingCart, href: '/orders', active: false },
        { name: 'Finance', icon: DollarSign, href: '/finance', active: false },
    ];

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <Package size={20} />
                    </div>
                    SellerCenter.
                </h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium ml-10">Pro Dashboard</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active
                            ? 'bg-amber-50 text-amber-600'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <item.icon size={20} />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Settings size={20} />
                    Settings
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
