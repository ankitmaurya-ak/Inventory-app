import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        available: 'Available', out_of_stock: 'Out of Stock',
        needed: 'Needed', not_needed: 'Not Needed',
    };
    return map[status] || status;
}

export function isLowStock(quantity: number, threshold: number): boolean {
    return quantity < threshold && quantity > 0;
}
