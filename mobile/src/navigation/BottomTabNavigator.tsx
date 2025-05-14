import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../constants/routes';
import HomeScreen from '../screens/Home/HomeScreen';
import ChatStackNavigator from './ChatStackNavigator';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { Text, View } from 'react-native';
import MenuIcon from '../assets/menu.svg';
import ChatIcon from '../assets/chat.svg';
import NotificationIcon from '../assets/notification.svg';
import ProfileIcon from '../assets/profile.svg';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const tabBarLabel = (label: string, focused: boolean) => (
    <Text className={focused ? 'text-sm font-bold text-[#0A2240] mt-1' : 'text-sm text-gray-400 mt-1'}>{label}</Text>
);

const HIDDEN_ROUTES = ['ChatDetail'];

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    height: 90,
                    paddingBottom: 16,
                    paddingTop: 8,
                },
            }}
        >
            <Tab.Screen
                name={ROUTES.MAIN.HOME}
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View className="items-center">
                            <MenuIcon width={28} height={28} />
                        </View>
                    ),
                    tabBarLabel: ({ focused }) => tabBarLabel('Ứng dụng', focused),
                }}
            />
            <Tab.Screen
                name={ROUTES.MAIN.CHAT}
                component={ChatStackNavigator}
                options={({ route }) => ({
                    tabBarIcon: ({ focused }) => (
                        <View className="items-center">
                            <ChatIcon width={28} height={28} />
                        </View>
                    ),
                    tabBarLabel: ({ focused }) => tabBarLabel('Tin nhắn', focused),
                    tabBarStyle: (() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? '';
                        const shouldHide = HIDDEN_ROUTES.includes(routeName);
                        // Render tab bar out of layout immediately to avoid flicker
                        return shouldHide
                            ? { position: 'absolute', height: 0, overflow: 'hidden' }
                            : {
                                borderTopWidth: 1,
                                height: 90,
                                paddingBottom: 16,
                                paddingTop: 8,
                            };
                    })(),
                })}
            />
            <Tab.Screen
                name={ROUTES.MAIN.NOTIFICATIONS}
                component={NotificationsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View className="items-center">
                            <NotificationIcon width={28} height={28} />
                        </View>
                    ),
                    tabBarLabel: ({ focused }) => tabBarLabel('Thông báo', focused),
                }}
            />
            <Tab.Screen
                name={ROUTES.MAIN.PROFILE}
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View className="items-center">
                            <ProfileIcon width={28} height={28} />
                        </View>
                    ),
                    tabBarLabel: ({ focused }) => tabBarLabel('Hồ sơ', focused),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator; 