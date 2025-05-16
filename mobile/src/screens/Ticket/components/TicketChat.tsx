import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface TicketChatProps {
    ticketId: string;
    onRefresh?: () => void;
}

interface Message {
    _id: string;
    sender: {
        _id: string;
        fullname: string;
        avatarUrl?: string;
        email: string;
    };
    text: string;
    timestamp: string;
    type: 'text' | 'image';
}

const TicketChat: React.FC<TicketChatProps> = ({ ticketId, onRefresh }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchMessages();
        fetchCurrentUser();
    }, [ticketId]);

    const fetchCurrentUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setCurrentUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setMessages(response.data.ticket.messages || []);
            }
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) {
            return;
        }

        setSending(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.post(`${API_BASE_URL}/api/tickets/${ticketId}/messages`,
                { text: newMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNewMessage('');
                fetchMessages();
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        // Xin quyền truy cập thư viện ảnh
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Cần quyền truy cập thư viện ảnh để tải lên hình ảnh');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            sendImage(asset.uri);
        }
    };

    const sendImage = async (uri: string) => {
        try {
            // Nén ảnh trước khi gửi
            const manipResult = await manipulateAsync(
                uri,
                [{ resize: { width: 800 } }], // Giảm kích thước ảnh xuống 800px width
                { compress: 0.7, format: SaveFormat.JPEG } // Giảm chất lượng xuống 70%
            );

            // Tạo FormData
            const formData = new FormData();
            const filename = uri.split('/').pop();

            formData.append('file', {
                uri: manipResult.uri,
                name: filename,
                type: 'image/jpeg'
            } as any);

            setSending(true);

            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/tickets/${ticketId}/messages`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.success) {
                fetchMessages();
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Lỗi khi gửi ảnh:', error);
            alert('Không thể gửi ảnh. Vui lòng thử lại sau.');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#002855" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <View className="flex-1 bg-white p-2">
                {/* Tin nhắn */}
                <ScrollView
                    className="flex-1 mb-2"
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-8">
                            <Text className="text-gray-500">Chưa có tin nhắn nào</Text>
                        </View>
                    ) : (
                        messages.map((message, index) => {
                            const isCurrentUser = message.sender._id === currentUser?._id;

                            return (
                                <View
                                    key={index}
                                    className={`mb-3 max-w-[80%] ${isCurrentUser ? 'self-end ml-auto' : 'self-start mr-auto'}`}
                                >
                                    {!isCurrentUser && (
                                        <View className="flex-row items-center mb-1">
                                            <Image
                                                source={{
                                                    uri: message.sender.avatarUrl
                                                        ? `${API_BASE_URL}/uploads/Avatar/${message.sender.avatarUrl}`
                                                        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(message.sender.fullname)
                                                }}
                                                className="w-6 h-6 rounded-full mr-2"
                                            />
                                            <Text className="text-sm text-gray-600">{message.sender.fullname}</Text>
                                        </View>
                                    )}

                                    {message.type === 'image' ? (
                                        <View className={`rounded-xl p-1 ${isCurrentUser ? 'bg-[#002855]' : 'bg-gray-100'}`}>
                                            <Image
                                                source={{ uri: message.text.startsWith('http') ? message.text : `${API_BASE_URL}/${message.text}` }}
                                                className="w-48 h-48 rounded-lg"
                                                resizeMode="cover"
                                            />
                                        </View>
                                    ) : (
                                        <View className={`rounded-xl p-3 ${isCurrentUser ? 'bg-[#002855]' : 'bg-gray-100'}`}>
                                            <Text className={`${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                                {message.text}
                                            </Text>
                                        </View>
                                    )}

                                    <Text className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500`}>
                                        {formatDate(message.timestamp)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Khung nhập tin nhắn */}
                <View className="flex-row items-center border-t border-gray-200 pt-2">
                    <TouchableOpacity
                        onPress={pickImage}
                        className="p-2"
                    >
                        <Ionicons name="image-outline" size={24} color="#002855" />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 mx-2"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className={`p-2 rounded-full ${(!newMessage.trim() || sending) ? 'opacity-50' : ''}`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#002855" />
                        ) : (
                            <Ionicons name="send" size={24} color="#002855" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default TicketChat; 