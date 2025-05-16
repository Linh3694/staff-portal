import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Thông Tin Cá Nhân</Text>
            </View>
            <View className="flex-1 justify-end pb-10 px-4">
                <TouchableOpacity onPress={handleLogout} className="bg-red-500 rounded-full py-3">
                    <Text className="text-center text-white font-bold text-lg">Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen; 