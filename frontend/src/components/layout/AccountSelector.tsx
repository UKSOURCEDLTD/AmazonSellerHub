"use client";

import { useAccount } from "@/context/AccountContext";
import { ChevronDown, Store } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function AccountSelector() {
    const { accounts, selectedAccount, setSelectedAccount, setSelectedMarketplace } = useAccount();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (account: any) => {
        setSelectedAccount(account);
        // Default to first marketplace of the account
        if (account.marketplaces && account.marketplaces.length > 0) {
            setSelectedMarketplace(account.marketplaces[0]);
        }
        setIsOpen(false);
    };

    if (!selectedAccount) return <div className="h-10 animate-pulse bg-gray-100 rounded-lg w-full"></div>;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors"
                title="Switch Account"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Store size={16} />
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedAccount.name}</p>
                        <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{selectedAccount.region} Region</p>
                    </div>
                </div>
                <ChevronDown size={14} className={`text-gray-400 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Account</p>
                        {accounts.map((account) => (
                            <button
                                key={account.id}
                                onClick={() => handleSelect(account)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${selectedAccount.id === account.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${selectedAccount.id === account.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                <span className="truncate">{account.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                        {/* In real implementation, this would likely open a modal or navigate to settings. 
                            For now, we can link to settings or just indicate it adds account. 
                        */}
                        <a href="/settings" className="w-full block text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                            + Add New Account
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
