import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { OnlineStatusProvider } from './src/context/OnlineStatusContext';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './src/config/constants';
import { AuthProvider } from './src/context/AuthContext';

import './global.css';

// Thiết lập cách xử lý thông báo khi ứng dụng đang chạy
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    'Mulish-Regular': require('./src/assets/fonts/Mulish-Regular.ttf'),
    'Mulish-Medium': require('./src/assets/fonts/Mulish-Medium.ttf'),
    'Mulish-SemiBold': require('./src/assets/fonts/Mulish-SemiBold.ttf'),
    'Mulish-Bold': require('./src/assets/fonts/Mulish-Bold.ttf'),
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [initialRoute, setInitialRoute] = useState({ name: 'Home', params: {} });

  // Xử lý điều hướng khi nhận được thông báo
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as {
      ticketId?: string;
      chatId?: string;
      type?: string;
      senderId?: string;
    };
    console.log('Phản hồi thông báo:', data);

    if (data?.type === 'new_ticket' || data?.type === 'ticket_update') {
      // Kiểm tra xem ứng dụng đã khởi tạo xong chưa
      if (navigationRef.current && data.ticketId) {
        // Nếu đã khởi tạo xong, điều hướng ngay
        navigationRef.current.navigate('TicketDetail', { ticketId: data.ticketId });
      } else if (data.ticketId) {
        // Nếu chưa khởi tạo xong, đặt route ban đầu
        setInitialRoute({
          name: 'TicketDetail',
          params: { ticketId: data.ticketId }
        });
      }
    } else if (data?.type === 'new_chat_message') {
      // Xử lý khi nhận thông báo tin nhắn chat
      if (navigationRef.current && data.chatId && data.senderId) {
        // Tìm thông tin người gửi
        const fetchUserAndNavigate = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/users/${data.senderId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
              const userData = await response.json();
              navigationRef.current?.navigate('ChatDetail', {
                chatId: data.chatId,
                user: userData
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        };

        fetchUserAndNavigate();
      } else if (data.chatId && data.senderId) {
        // Lưu thông tin để điều hướng sau khi khởi động
        setInitialRoute({
          name: 'ChatInit',
          params: {
            chatId: data.chatId,
            senderId: data.senderId
          }
        });
      }
    }
  };

  useEffect(() => {
    // Lắng nghe khi nhận được thông báo (ứng dụng đang chạy)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Thông báo nhận được:', notification);
    });

    // Lắng nghe khi người dùng tương tác với thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Kiểm tra xem có thông báo nào mở ứng dụng không
  useEffect(() => {
    const getInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        handleNotificationResponse(response);
      }
    };

    getInitialNotification();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <OnlineStatusProvider>
        <NavigationContainer
          ref={navigationRef}
        >
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </OnlineStatusProvider>
    </AuthProvider>
  );
}
