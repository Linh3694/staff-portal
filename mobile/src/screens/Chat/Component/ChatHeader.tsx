import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from '../../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatDetailParams } from '../../../types/chat';

interface ChatHeaderProps {
    user: User;
    getAvatar: (user: User) => string;
    isUserOnline: (userId: string) => boolean;
    getFormattedLastSeen: (userId: string) => string;
    navigation: NativeStackNavigationProp<{ ChatDetail: ChatDetailParams }, 'ChatDetail'>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    user,
    getAvatar,
    isUserOnline,
    getFormattedLastSeen,
    navigation
}) => {
    return (
        <View className="flex-row items-center p-3 border-gray-200">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                <MaterialIcons name="arrow-back-ios" size={32} color="#009483" />
            </TouchableOpacity>
            <View style={{ position: 'relative', marginRight: 12 }}>
                <Image
                    source={{ uri: getAvatar(user) }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                />
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 14,
                        height: 14,
                        borderRadius: 9999,
                        backgroundColor: isUserOnline(user._id) ? 'green' : '#bbb',
                        borderWidth: 2,
                        borderColor: 'white',
                    }}
                />
            </View>
            <View style={{ justifyContent: 'center' }}>
                <Text className="font-bold text-lg" style={{ marginBottom: 0 }}>{user.fullname}</Text>
                <Text style={{ fontSize: 12, color: '#444', fontFamily: 'Inter', fontWeight: 'medium' }}>
                    {isUserOnline(user._id) ? 'Đang hoạt động' : getFormattedLastSeen(user._id)}
                </Text>
            </View>
        </View>
    );
};

export default ChatHeader; 