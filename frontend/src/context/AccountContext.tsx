"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SellerAccount {
    id: string;
    name: string;
    region: string;
    marketplaces: string[];
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
}

interface AccountContextType {
    accounts: SellerAccount[];
    selectedAccount: SellerAccount | null;
    selectedMarketplace: string;
    loading: boolean;
    setSelectedAccount: (account: SellerAccount) => void;
    setSelectedMarketplace: (marketplace: string) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
    // Hardcoded default account
    const defaultAccount: SellerAccount = {
        id: "default_account_1",
        name: "Default Account",
        region: "NA", // Assuming North America based on typical usage
        marketplaces: ["US"],
        client_id: process.env.NEXT_PUBLIC_LWA_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_LWA_CLIENT_SECRET,
        refresh_token: process.env.NEXT_PUBLIC_SP_API_REFRESH_TOKEN
    };

    const [accounts, setAccounts] = useState<SellerAccount[]>([defaultAccount]);
    const [selectedAccount, setSelectedAccount] = useState<SellerAccount | null>(defaultAccount);
    const [selectedMarketplace, setSelectedMarketplace] = useState<string>('US');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Enforce the default account execution
        if (!selectedAccount) {
            setSelectedAccount(defaultAccount);
            setSelectedMarketplace('US');
        }
    }, [selectedAccount, defaultAccount]);

    const value = {
        accounts,
        selectedAccount,
        selectedMarketplace,
        loading,
        setSelectedAccount,
        setSelectedMarketplace
    };

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
}
