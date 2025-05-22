import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../core/config';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Kiểm tra token hết hạn
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
          // Token đã hết hạn
          await logout();
          return;
        }

        // Token còn hạn, lấy thông tin user
        await fetchUserProfile(token);
      } catch (error) {
        console.error('Lỗi decode token:', error);
        await logout();
      }
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái auth:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('role', userData.role);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      await logout();
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Lưu token và role
        localStorage.setItem('authToken', token);
        localStorage.setItem('role', userData.role);
        
        // Cập nhật state user
        setUser(userData);
        
        toast.success('Đăng nhập thành công!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Đăng nhập thất bại');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    setUser(null);
    toast.success('Đăng xuất thành công!');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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