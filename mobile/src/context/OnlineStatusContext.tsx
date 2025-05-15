import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { Platform, AppState, AppStateStatus } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

// Map để lưu trạng thái online và last seen
interface OnlineStatusMap {
    [userId: string]: {
        isOnline: boolean;
        lastSeen?: Date;
    };
}

interface OnlineStatusContextType {
    onlineUsers: OnlineStatusMap;
    currentUserId: string | null;
    isUserOnline: (userId: string) => boolean;
    getLastSeen: (userId: string) => Date | undefined;
    getFormattedLastSeen: (userId: string) => string;
    reconnectSocket: () => Promise<void>;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
    onlineUsers: {},
    currentUserId: null,
    isUserOnline: () => false,
    getLastSeen: () => undefined,
    getFormattedLastSeen: () => 'Offline',
    reconnectSocket: async () => { },
});

export const useOnlineStatus = () => useContext(OnlineStatusContext);

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineStatusMap>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const socketRef = useRef<any>(null);
    const appState = useRef(AppState.currentState);

    // Thêm state để theo dõi trạng thái kết nối của socket
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const isInitialized = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Hàm lấy thời gian last seen dạng chuỗi thân thiện
    const getFormattedLastSeen = (userId: string): string => {
        const userStatus = onlineUsers[userId];

        if (!userStatus) return 'Offline';
        if (userStatus.isOnline) return 'Đang hoạt động';
        if (!userStatus.lastSeen) return 'Offline';

        const lastSeen = new Date(userStatus.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeen.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Vừa truy cập';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays === 1) return 'Hôm qua';

        return `${lastSeen.getDate()}/${lastSeen.getMonth() + 1}/${lastSeen.getFullYear()}`;
    };

    // Hàm để reconnect socket
    const reconnectSocket = async () => {
        if (socketRef.current) {
            try {
                socketRef.current.disconnect();
            } catch (e) {
                console.error('Error disconnecting socket:', e);
            }
            socketRef.current = null;
        }

        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            reconnectAttempts.current = 0;
            return;
        }

        reconnectAttempts.current++;
        await initializeSocket();
    };

    // Tách riêng logic khởi tạo socket 
    const initializeSocket = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const decoded: any = jwtDecode(token);
            const userId = decoded._id || decoded.id;
            if (!userId) return;

            setCurrentUserId(userId);

            // Đảm bảo chỉ có một socket instance
            if (socketRef.current) {
                try {
                    socketRef.current.disconnect();
                } catch (e) {
                    console.error('Error disconnecting existing socket:', e);
                }
            }

            // Khởi tạo socket mới
            socketRef.current = io(apiUrl, {
                query: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000
            });

            // Theo dõi trạng thái kết nối
            socketRef.current.on('connect', () => {
                console.log('Global socket connected');
                setIsSocketConnected(true);
                reconnectAttempts.current = 0;

                // Emit sự kiện để thông báo trạng thái online của bản thân khi kết nối
                socketRef.current.emit('joinUserRoom', userId);
                socketRef.current.emit('userOnline', { userId, chatId: 'global' });
                socketRef.current.emit('getUsersOnlineStatus');
            });

            socketRef.current.on('connect_error', (error: any) => {
                console.error('Socket connection error:', error);
                setIsSocketConnected(false);
            });

            socketRef.current.on('disconnect', (reason: string) => {
                console.log('Global socket disconnected. Reason:', reason);
                setIsSocketConnected(false);

                // Tự động reconnect nếu là do lỗi mạng
                if (
                    reason === 'io server disconnect' ||
                    reason === 'transport close' ||
                    reason === 'ping timeout'
                ) {
                    if (appState.current === 'active') {
                        setTimeout(() => reconnectSocket(), 3000);
                    }
                }
            });

            // Lắng nghe sự kiện user online
            socketRef.current.on('userOnline', ({ userId }: { userId: string }) => {
                console.log('Global user online:', userId);
                setOnlineUsers(prev => ({
                    ...prev,
                    [userId]: {
                        isOnline: true,
                        lastSeen: new Date()
                    }
                }));
            });

            // Lắng nghe sự kiện user offline
            socketRef.current.on('userOffline', ({ userId }: { userId: string }) => {
                console.log('Global user offline:', userId);
                setOnlineUsers(prev => ({
                    ...prev,
                    [userId]: {
                        isOnline: false,
                        lastSeen: new Date()
                    }
                }));
            });

            // Lắng nghe danh sách user online hiện tại
            socketRef.current.on('onlineUsers', (users: string[]) => {
                console.log('Received current online users:', users);

                // Reset trạng thái của tất cả người dùng trước
                const updatedStatus: OnlineStatusMap = {};

                // Cập nhật trạng thái cho người dùng online
                users.forEach(id => {
                    updatedStatus[id] = {
                        isOnline: true,
                        lastSeen: new Date()
                    };
                });

                setOnlineUsers(prev => {
                    const newState = { ...prev };

                    // Cập nhật trạng thái cho tất cả người dùng offline trước
                    Object.keys(newState).forEach(id => {
                        if (!users.includes(id)) {
                            newState[id] = {
                                ...newState[id],
                                isOnline: false
                            };
                        }
                    });

                    // Sau đó cập nhật trạng thái online
                    return { ...newState, ...updatedStatus };
                });
            });

            // Lắng nghe thông tin last seen
            socketRef.current.on('userLastSeen', ({ userId, lastSeen }: { userId: string, lastSeen: string }) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [userId]: {
                        isOnline: false,
                        lastSeen: new Date(lastSeen)
                    }
                }));
            });

            // Lắng nghe sự kiện userStatus
            socketRef.current.on('userStatus', ({ userId, status }: { userId: string, status: string }) => {
                console.log(`User ${userId} status updated to ${status}`);
                setOnlineUsers(prev => ({
                    ...prev,
                    [userId]: {
                        isOnline: status === 'online',
                        lastSeen: status === 'offline' ? new Date() : prev[userId]?.lastSeen
                    }
                }));
            });

            isInitialized.current = true;
        } catch (error) {
            console.error('Error setting up online status tracking:', error);
            setIsSocketConnected(false);
        }
    };

    // Init socket và lắng nghe sự kiện
    useEffect(() => {
        if (!isInitialized.current) {
            initializeSocket();
        }

        // Thiết lập ping để duy trì kết nối và trạng thái online
        const pingInterval = setInterval(() => {
            if (socketRef.current && socketRef.current.connected && currentUserId) {
                socketRef.current.emit('ping', { userId: currentUserId });
            } else if (socketRef.current && !socketRef.current.connected && appState.current === 'active') {
                // Thử reconnect nếu không connected và app đang active
                reconnectSocket();
            }
        }, 30000); // Ping mỗi 30 giây

        // Thiết lập sự kiện khi app chuyển vào background hoặc foreground
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            console.log('App state changed:', appState.current, '->', nextAppState);

            if (nextAppState === 'active' && appState.current.match(/inactive|background/)) {
                // App từ background về active
                console.log('App has come to the foreground!');
                if (!socketRef.current || !socketRef.current.connected) {
                    reconnectSocket();
                } else if (socketRef.current && currentUserId) {
                    socketRef.current.emit('userOnline', { userId: currentUserId, chatId: 'global' });
                    socketRef.current.emit('getUsersOnlineStatus');
                }
            } else if (nextAppState.match(/inactive|background/) && appState.current === 'active') {
                // App từ active về background
                console.log('App has gone to the background!');
                if (socketRef.current && socketRef.current.connected && currentUserId) {
                    socketRef.current.emit('userBackground', { userId: currentUserId });
                }
            }

            appState.current = nextAppState;
        };

        // Đăng ký event listener cho app state
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Tự động kiểm tra lại trạng thái online mỗi phút
        const statusRefreshInterval = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('getUsersOnlineStatus');
            }
        }, 60000);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            clearInterval(pingInterval);
            clearInterval(statusRefreshInterval);
            subscription.remove();
        };
    }, [currentUserId]);

    const isUserOnline = (userId: string): boolean => {
        return onlineUsers[userId]?.isOnline || false;
    };

    const getLastSeen = (userId: string): Date | undefined => {
        return onlineUsers[userId]?.lastSeen;
    };

    return (
        <OnlineStatusContext.Provider
            value={{
                onlineUsers,
                currentUserId,
                isUserOnline,
                getLastSeen,
                getFormattedLastSeen,
                reconnectSocket
            }}
        >
            {children}
        </OnlineStatusContext.Provider>
    );
}; 