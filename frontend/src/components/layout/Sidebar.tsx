import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, Package, DollarSign, Settings, ShoppingCart, Truck, X } from 'lucide-react';
import AccountSelector from './AccountSelector';
import MarketplaceSelector from './MarketplaceSelector';
import { useSidebar } from '@/context/SidebarContext';

const Sidebar = () => {
    const { isMobileSidebarOpen, closeMobileSidebar } = useSidebar();
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMobileSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                closeMobileSidebar();
            }
        };

        if (isMobileSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileSidebarOpen, closeMobileSidebar]);

    const menuItems = [
        { name: 'Overview', icon: LayoutDashboard, href: '/', active: true },
        { name: 'Analytics', icon: BarChart3, href: '/analytics', active: false },
        { name: 'Inventory', icon: Package, href: '/inventory', active: false },
        { name: 'Orders', icon: ShoppingCart, href: '/orders', active: false },
        { name: 'Shipments', icon: Truck, href: '/shipments', active: false },
        { name: 'Finance', icon: DollarSign, href: '/finance', active: false },
    ];

    // Mobile overlay
    const overlay = isMobileSidebarOpen ? (
        <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={closeMobileSidebar}
            aria-hidden="true"
        />
    ) : null;

    return (
        <>
            {overlay}
            <div
                ref={sidebarRef}
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
                    ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                <Package size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800 leading-tight">SellerCenter.</h1>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pro Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={closeMobileSidebar}
                            className="p-2 text-gray-500 hover:text-gray-700 md:hidden"
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <AccountSelector />
                        <MarketplaceSelector />
                    </div>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={closeMobileSidebar}
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
                        onClick={closeMobileSidebar}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
