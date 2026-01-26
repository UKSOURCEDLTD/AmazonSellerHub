import { Bell, Search } from 'lucide-react';
import Image from 'next/image'; // Assuming we might use Next/Image later, or just a div for avatar

const Header = () => {
    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Dashboard</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-900">Overview</span>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">Alex Morgan</p>
                        <p className="text-xs text-gray-500">Pro Seller</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                        {/* Placeholder for user avatar */}
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-medium">AM</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
