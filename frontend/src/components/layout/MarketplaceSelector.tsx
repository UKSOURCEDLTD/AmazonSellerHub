"use client";

import { useAccount } from "@/context/AccountContext";
import { Globe } from "lucide-react";

export default function MarketplaceSelector() {
    const { selectedAccount, selectedMarketplace, setSelectedMarketplace } = useAccount();

    if (!selectedAccount) return null;

    const marketplaces = selectedAccount.marketplaces || ['US'];

    return (
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
            {marketplaces.map((mp) => (
                <button
                    key={mp}
                    onClick={() => setSelectedMarketplace(mp)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedMarketplace === mp
                            ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {mp}
                </button>
            ))}
        </div>
    );
}
