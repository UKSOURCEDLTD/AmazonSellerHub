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
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store size={18} />
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedAccount.name}</p>
                        <p className="text-xs text-gray-500 truncate">{selectedAccount.region} Region</p>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
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
                        <button className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                            + Add New Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
