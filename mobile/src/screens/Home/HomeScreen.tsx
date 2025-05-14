import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = () => {
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setFullName(user.fullname || '');
                }
            } catch (e) {
                setFullName('');
            }
        };
        fetchUser();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white items-center">
            <View className="w-full items-center mt-12">
                <Text className="text-2xl text-primary font-medium mb-2 text-center">Xin chào WISer</Text>
                <MaskedView
                    maskElement={
                        <Text className="text-4xl font-bold text-center" style={{ backgroundColor: 'transparent' }}>{fullName}</Text>
                    }
                >
                    <LinearGradient
                        colors={["#F05023", "#F5AA1E"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text className="text-6xl font-bold opacity-0 text-center">{fullName}</Text>
                    </LinearGradient>
                </MaskedView>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;
