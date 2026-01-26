"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SellerAccount {
    id: string;
    name: string;
    region: string;
    marketplaces: string[];
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
    const [accounts, setAccounts] = useState<SellerAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<SellerAccount | null>(null);
    const [selectedMarketplace, setSelectedMarketplace] = useState<string>('US');
    const [loading, setLoading] = useState(true);

    // Fetch accounts from Firestore
    useEffect(() => {
        const q = query(collection(db, 'seller_accounts'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAccounts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SellerAccount[];

            setAccounts(fetchedAccounts);

            // Auto-select first account if none selected
            if (fetchedAccounts.length > 0 && !selectedAccount) {
                setSelectedAccount(fetchedAccounts[0]);
                // Default to first marketplace of that account or US
                const defaultMp = fetchedAccounts[0].marketplaces && fetchedAccounts[0].marketplaces.length > 0
                    ? fetchedAccounts[0].marketplaces[0]
                    : 'US';
                setSelectedMarketplace(defaultMp);
            }

            setLoading(false);
        }, (error) => {
            console.error("Error fetching seller accounts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // Run once on mount

    // Update marketplace when account changes if current marketplace is invalid for new account - Optional logic
    // For now we keep it simple.

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
