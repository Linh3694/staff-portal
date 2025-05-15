import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import WelcomeScreen from '../screens/Login/WelcomeScreen';
import LoginScreen from '../screens/Login/SignInScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import { ROUTES } from '../constants/routes';
import ChatScreen from '../screens/Chat/ChatScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';
import TicketGuestScreen from '../screens/Ticket/TicketGuestScreen';
import TicketAdminScreen from '../screens/Ticket/TicketAdminScreen';
import TicketDetailScreen from '../screens/Ticket/TicketDetailScreen';
import TicketCreate from '../screens/Ticket/TicketCreate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface User {
    _id: string;
    fullname: string;
    avatarUrl?: string;
    role?: string;
}

export type ChatStackParamList = {
    ChatList: undefined;
    ChatDetail: { user: User; chatId?: string };
};

export type RootStackParamList = {
  [ROUTES.WELCOME]: undefined;
  [ROUTES.AUTH.LOGIN]: undefined;
  Main: undefined;
  ChatDetail: { user: User; chatId?: string };
    Ticket: undefined;
    TicketDetail: { ticketId: string };
    TicketCreate: undefined;
};

const AppNavigator = () => {
    const [ticketComponent, setTicketComponent] = useState(() => TicketGuestScreen);

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    const role = user.role?.toLowerCase() || '';

                    // Phân quyền: superadmin, admin, technical -> TicketAdminScreen
                    if (['superadmin', 'admin', 'technical'].includes(role)) {
                        console.log('Người dùng có vai trò', role, '-> điều hướng đến TicketAdminScreen');
                        setTicketComponent(() => TicketAdminScreen);
                    } else {
                        console.log('Người dùng có vai trò', role, '-> điều hướng đến TicketGuestScreen');
                        setTicketComponent(() => TicketGuestScreen);
                    }
                } else {
                    console.log('Không tìm thấy thông tin người dùng, mặc định điều hướng đến TicketGuestScreen');
                    setTicketComponent(() => TicketGuestScreen);
                }
            } catch (error) {
                console.error('Lỗi khi lấy vai trò người dùng:', error);
                console.log('Xảy ra lỗi, mặc định điều hướng đến TicketGuestScreen');
                setTicketComponent(() => TicketGuestScreen);
            }
        };

        checkUserRole();
    }, []);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
            <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen
                name="Ticket"
                component={ticketComponent}
                options={{
                    headerShown: true,
                    title: "Ticket hỗ trợ"
                }}
            />
            <Stack.Screen
                name="TicketDetail"
                component={TicketDetailScreen}
                options={{
                    headerShown: true,
                    title: "Chi tiết Ticket"
                }}
            />
            <Stack.Screen
                name="TicketCreate"
                component={TicketCreate}
                options={{
                    headerShown: false,
                    presentation: 'card',
                    animation: 'default'
                }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
