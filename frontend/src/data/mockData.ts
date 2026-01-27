export interface OrderItem {
    sku: string;
    quantity: number;
    item_price: number;
}

export interface Order {
    id: string;
    order_total: number;
    estimated_fees: number;
    items: OrderItem[];
    order_status: string;
    purchase_date?: string;
}

export interface InventoryItem {
    id: string;
    sku: string;
    cogs: number;
    stock_level: number;
    status: string;
    title: string;
    asin: string;
    price: number;
}

export const mockInventory: InventoryItem[] = [
    {
        id: "inv_1",
        sku: "SKU-001",
        cogs: 12.50,
        stock_level: 150,
        status: "Healthy",
        title: "Wireless Ergonomic Mouse",
        asin: "B08XYZ1234",
        price: 29.99
    },
    {
        id: "inv_2",
        sku: "SKU-002",
        cogs: 8.00,
        stock_level: 20,
        status: "At Risk",
        title: "USB-C Charging Cable 6ft",
        asin: "B09ABC5678",
        price: 14.99
    },
    {
        id: "inv_3",
        sku: "SKU-003",
        cogs: 45.00,
        stock_level: 0,
        status: "Stranded",
        title: "Noise Cancelling Headphones",
        asin: "B07DEF9012",
        price: 89.99
    },
    {
        id: "inv_4",
        sku: "SKU-004",
        cogs: 3.50,
        stock_level: 500,
        status: "Healthy",
        title: "Screen Cleaner Spray",
        asin: "B01GHI3456",
        price: 9.99
    },
    {
        id: "inv_5",
        sku: "SKU-005",
        cogs: 18.00,
        stock_level: 45,
        status: "Healthy",
        title: "Laptop Stand Aluminum",
        asin: "B05JKL7890",
        price: 34.99
    }
];

export const mockOrders: Order[] = [
    {
        id: "114-1234567-1234567",
        order_total: 29.99,
        estimated_fees: 4.50,
        order_status: "Shipped",
        items: [{ sku: "SKU-001", quantity: 1, item_price: 29.99 }],
        purchase_date: "2023-10-25T14:30:00Z"
    },
    {
        id: "114-7654321-7654321",
        order_total: 14.99,
        estimated_fees: 2.25,
        order_status: "Shipped",
        items: [{ sku: "SKU-002", quantity: 1, item_price: 14.99 }],
        purchase_date: "2023-10-25T15:45:00Z"
    },
    {
        id: "114-9999999-9999999",
        order_total: 44.98,
        estimated_fees: 6.75,
        order_status: "Pending",
        items: [
            { sku: "SKU-001", quantity: 1, item_price: 29.99 },
            { sku: "SKU-002", quantity: 1, item_price: 14.99 }
        ],
        purchase_date: "2023-10-26T09:15:00Z"
    }
];
