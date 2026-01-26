"use client";

import { useAccount } from "@/context/AccountContext";
import { Globe } from "lucide-react";

export default function MarketplaceSelector() {
    const { selectedAccount, selectedMarketplace, setSelectedMarketplace } = useAccount();

    if (!selectedAccount) return null;

    const marketplaces = selectedAccount.marketplaces || ['US'];

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            {marketplaces.map((mp) => (
                <button
                    key={mp}
                    onClick={() => setSelectedMarketplace(mp)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedMarketplace === mp
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {mp}
                </button>
            ))}
        </div>
    );
}
