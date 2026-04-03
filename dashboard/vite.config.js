import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // This enables binding to all network interfaces (e.g., 0.0.0.0) which often fixes "localhost can't be reached"
        port: 5173,
        open: true
    }
});
