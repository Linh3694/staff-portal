import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import WelcomeScreen from '../screens/Login/WelcomeScreen';
import LoginScreen from '../screens/Login/SignInScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import { ROUTES } from '../constants/routes';
import ChatScreen from '../screens/Chat/ChatScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface User {
    _id: string;
    fullname: string;
    avatarUrl?: string;
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
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
                <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
                <Stack.Screen name="Main" component={BottomTabNavigator} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ presentation: 'card' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
