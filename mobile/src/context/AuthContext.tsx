import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

type AuthContextType = {
    isAuthenticated: boolean;
    loading: boolean;
    user: any;
    login: (token: string, userData: any) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async (): Promise<boolean> => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                setLoading(false);
                return false;
            }

            // Kiểm tra token còn hạn không
            try {
                const decoded: any = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp && decoded.exp < currentTime) {
                    // Token đã hết hạn
                    await logout();
                    return false;
                }

                // Nếu token còn hạn, lấy thông tin user từ AsyncStorage
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    setUser(userData);
                    return true;
                } else {
                    // Nếu không có thông tin user, lấy từ API
                    try {
                        const response = await api.get('/users');
                        if (response.data.success) {
                            const userData = response.data.user;
                            setUser(userData);
                            await AsyncStorage.setItem('user', JSON.stringify(userData));
                            await AsyncStorage.setItem('userId', userData._id);
                            await AsyncStorage.setItem('userFullname', userData.fullname);
                            await AsyncStorage.setItem('userRole', userData.role || 'user');
                            return true;
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy thông tin người dùng:', error);
                        await logout();
                        return false;
                    }
                }
            } catch (error) {
                console.error('Token decode error:', error);
                await logout();
                return false;
            }
        } finally {
            setLoading(false);
        }

        return false;
    };

    const login = async (token: string, userData: any) => {
        try {
            // Lưu token
            await AsyncStorage.setItem('authToken', token);

            // Lưu thông tin user
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('userId', userData._id || userData.id);
                await AsyncStorage.setItem('userFullname', userData.fullname);
                
                const role = userData.role || 'user';
                console.log('AuthContext - Role being saved:', role);
                await AsyncStorage.setItem('userRole', role);
                
                setUser(userData);
            }
        } catch (error) {
            console.error('Lỗi khi đăng nhập:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userFullname');
            await AsyncStorage.removeItem('userRole');
            setUser(null);
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                loading,
                user,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
};
