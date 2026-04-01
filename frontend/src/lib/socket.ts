import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = (): string => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
        return apiUrl.replace(/\/api\/?$/, '');
    }

    return 'http://localhost:5000';
};

export const initSocket = (userId: string): Socket => {
    if (!socket) {
        socket = io(getSocketUrl(), {
            auth: { token: localStorage.getItem('token') },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
            socket?.emit('join', userId);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
        });
    }
    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
