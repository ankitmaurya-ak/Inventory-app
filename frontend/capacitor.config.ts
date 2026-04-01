import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inventoryapp.mobile',
    appName: 'Inventory App',
    webDir: '.next',
    server: {
        url: 'https://inventory-app-frontend-tuib.onrender.com',
        cleartext: false,
    },
    android: {
        allowMixedContent: false,
    },
};

export default config;
