import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../../navigation/ChatStackNavigator';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { API_BASE_URL } from '../../config/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from './Component/Avatar';

interface User {
    _id: string;
    fullname: string;
    avatarUrl?: string;
}

interface Message {
    _id: string;
    content: string;
    createdAt: string;
    sender: string;
    readBy: string[];
    type?: string;
    fileUrl?: string;
    fileUrls?: string[];
}

interface Chat {
    _id: string;
    participants: User[];
    lastMessage?: Message;
    updatedAt: string;
}

const ChatScreen = () => {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [forwardMode, setForwardMode] = useState(false);
    const [messageToForwardId, setMessageToForwardId] = useState<string | null>(null);
    const { isUserOnline, getFormattedLastSeen } = useOnlineStatus();
    const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
    const route = useRoute();
    const parentTabNav: any = (navigation as any).getParent?.();
    const hideTabBar = () => {
        parentTabNav?.setOptions({ tabBarStyle: { display: 'none' } });
    };
    const socketRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    // Check if we're in forwarding mode based on route params
    useEffect(() => {
        const params = route.params as any;
        if (params && params.forwardMode) {
            const checkForwardMessage = async () => {
                try {
                    const messageId = await AsyncStorage.getItem('messageToForward');
                    if (messageId) {
                        setMessageToForwardId(messageId);
                        setForwardMode(true);
                        Alert.alert('Chuyển tiếp tin nhắn', 'Chọn người nhận để chuyển tiếp tin nhắn');
                    }
                } catch (error) {
                    console.error('Error checking for forwarded message:', error);
                }
            };
            
            checkForwardMessage();
        }
    }, [route.params]);

    useEffect(() => {
        // Chỉ fetch users 1 lần khi load màn hình
        const fetchData = async () => {
            setLoading(true);
            try {
                const usersRes = await fetch(API_BASE_URL + '/api/users');
                const usersData = await usersRes.json();
                setUsers(usersData);

                // Lấy token từ AsyncStorage
                const token = await AsyncStorage.getItem('authToken');
                console.log('Token:', token);
                if (token) {
                    try {
                        const decoded: any = jwtDecode(token);
                        console.log('Decoded:', decoded);
                        // decode JWT to get the current user's id
                        const userId = decoded._id || decoded.id;
                        if (userId) {
                            setCurrentUserId(userId);
                        }
                    } catch (err) {
                        console.log('Token decode error:', err);
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Persistent socket to listen for newChat even when ChatScreen is not focused
    useEffect(() => {
        const setupGlobalSocket = async () => {
            if (!currentUserId || socketRef.current) return;
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            socketRef.current = io(API_BASE_URL, { query: { token }, transports: ['websocket'] });

            // ensure server joins personal room
            socketRef.current.on('connect', () => {
                if (currentUserId) {
                    socketRef.current.emit('joinUserRoom', currentUserId);
                }
            });

            socketRef.current.on('newChat', (chat: any) => {
                setChats(prev => {
                    const idx = prev.findIndex(c => c._id === chat._id);
                    if (idx > -1) {
                        const newArr = [...prev];
                        newArr.splice(idx, 1);
                        return [chat, ...newArr];
                    }
                    return [chat, ...prev];
                });
            });
        };

        setupGlobalSocket();

        return () => {
            // cleanup when ChatScreen unmounts (should rarely happen)
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [currentUserId]);

    // Đặt ngoài useFocusEffect và useEffect
    const fetchChats = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            const res = await fetch(API_BASE_URL + '/api/chats/list', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setChats(data);
        } catch (err) {
            console.error('Error fetching chats:', err);
        }
    };

    // Trong useFocusEffect
    useFocusEffect(
        React.useCallback(() => {
            fetchChats();
        }, [navigation, currentUserId])
    );

    // Trong useEffect
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchChats();
        });
        return unsubscribe;
    }, [navigation, currentUserId]);

    const handleSearch = async (text: string) => {
        try {
            let usersData = [];
            if (text.trim() === "") {
                const usersRes = await fetch(API_BASE_URL + '/api/users');
                usersData = await usersRes.json();
            } else {
                const res = await fetch(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(text)}`);
                if (res.ok) {
                    usersData = await res.json();
                } else {
                    usersData = [];
                }
            }
            setUsers(usersData);
        } catch (err) {
            setUsers([]);
        }
    };

    const debouncedSearch = useCallback(debounce(handleSearch, 400), []);

    const handleChatPress = async (chat: Chat, other: User) => {
        if (forwardMode && messageToForwardId) {
            // Forward the message to this chat
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) return;
                
                const response = await fetch(`${API_BASE_URL}/api/chats/message/forward`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        messageId: messageToForwardId,
                        targetChatId: chat._id
                    })
                });
                
                if (response.ok) {
                    Alert.alert('Thành công', 'Đã chuyển tiếp tin nhắn');
                    // Clear forwarding mode and stored message ID
                    setForwardMode(false);
                    setMessageToForwardId(null);
                    await AsyncStorage.removeItem('messageToForward');
                    
                    // Navigate to the chat
                    hideTabBar();
                    navigation.navigate('ChatDetail', { user: other, chatId: chat._id });
                } else {
                    const errorData = await response.json();
                    Alert.alert('Lỗi', errorData.message || 'Không thể chuyển tiếp tin nhắn');
                }
            } catch (error) {
                console.error('Error forwarding message:', error);
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chuyển tiếp tin nhắn');
            }
        } else {
            // Normal navigation to chat
            hideTabBar();
            navigation.navigate('ChatDetail', { user: other, chatId: chat._id });
        }
    };

    const renderUser = ({ item }: { item: User }) => (
        <TouchableOpacity
            className="items-center mr-4 w-20"
            onPress={() => {
                hideTabBar();
                navigation.navigate('ChatDetail', { user: item });
            }}
        >
            <Avatar user={item} size={64} statusSize={15} />
            <Text className="mt-1 text-xs text-center w-20 font-medium" numberOfLines={1}>{item.fullname}</Text>
        </TouchableOpacity>
    );

    const renderChat = ({ item, index }: { item: Chat, index: number }) => {
        if (!Array.isArray(item.participants)) {
            console.log('Participants is not an array');
            return null;
        }

        if (!currentUserId) {
            return null; // wait until we know who the current user is
        }

        const other = item.participants.find(p => p._id !== currentUserId);
        if (!other) {
            return null;
        }

        // Format time
        const messageTime = item.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt) : null;
        const formattedTime = messageTime ? messageTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        // Kiểm tra xem tin nhắn đã được đọc chưa
        const hasUnreadMessage = item.lastMessage &&
            item.lastMessage.sender !== currentUserId &&
            (!item.lastMessage.readBy || !item.lastMessage.readBy.includes(currentUserId));

        // Xử lý nội dung tin nhắn cuối cùng để hiển thị
        let lastMessageContent = '';
        if (item.lastMessage) {
            // Kiểm tra loại tin nhắn và hiển thị tương ứng
            if (item.lastMessage.type === 'image') {
                // Một ảnh
                lastMessageContent = 'Đã gửi ảnh';
            } else if (item.lastMessage.fileUrls && item.lastMessage.fileUrls.length > 0) {
                // Nhiều ảnh
                lastMessageContent = `${item.lastMessage.fileUrls.length} hình ảnh`;
            } else if (item.lastMessage.type === 'file') {
                // File đính kèm
                lastMessageContent = 'Tệp đính kèm';
            } else {
                // Tin nhắn văn bản thông thường
                lastMessageContent = item.lastMessage.content || '';
            }

            // Thêm tiền tố "Bạn: " nếu người gửi là người dùng hiện tại
            if (item.lastMessage.sender === currentUserId) {
                lastMessageContent = `Bạn: ${lastMessageContent}`;
            }
        }

        return (
            <TouchableOpacity
                key={`chat-item-${item._id || index}`}
                className="flex-row items-center py-3 px-4 border-b border-gray-100"
                onPress={() => handleChatPress(item, other)}
            >
                <Avatar user={other} size={56} statusSize={15} />
                <View className="flex-1 ml-4">
                    <Text className={`${hasUnreadMessage ? 'font-bold' : 'font-medium'} text-lg`} numberOfLines={1}>{other.fullname}</Text>
                    <View className="flex-row items-center">
                        <Text
                            className={`${hasUnreadMessage ? 'text-secondary font-bold' : 'text-gray-500 font-medium'} text-base mr-1`}
                            numberOfLines={1}
                            style={{ maxWidth: '70%' }}
                        >
                            {lastMessageContent}
                        </Text>
                        <Text className="text-xs text-gray-400 font-medium mt-1">
                            • {isUserOnline(other._id) ? 'Đang hoạt động' : getFormattedLastSeen(other._id)}
                        </Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className={`${hasUnreadMessage ? 'text-black font-bold' : 'text-gray-400 font-medium'} text-xs mb-1`}>{formattedTime}</Text>
                    {/* Hiển thị dấu chấm đỏ thay vì số khi có tin nhắn chưa đọc */}
                    {hasUnreadMessage && (
                        <View className="bg-red-500 rounded-full w-3 h-3" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 bg-white">
                <Text className="text-2xl font-medium text-gray-900">Trao đổi</Text>
            </View>
            <ActivityIndicator size="large" color="#002855" className="flex-1" />
        </SafeAreaView>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0 }}
        >
            <View className="p-4 bg-white">
                <Text className="text-2xl font-medium text-gray-900">Trao đổi</Text>
                <View className="flex-row items-center mt-3 bg-white border border-gray-200 rounded-full px-4 py-2">
                    <MaterialIcons name="search" size={22} color="#BDBDBD" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-400 font-medium"
                        style={{
                            height: 36,
                            paddingVertical: 0,
                            textAlignVertical: 'center',
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#BDBDBD"
                        value={search}
                        onChangeText={(text) => {
                            setSearch(text);
                            debouncedSearch(text);
                        }}
                        underlineColorAndroid="transparent"
                    />
                </View>
            </View>
            <View className="mt-2">
                <FlatList
                    data={users}
                    horizontal
                    keyExtractor={item => item._id}
                    renderItem={renderUser}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                />
            </View>
            <Text className="text-lg font-medium text-gray-900 mt-[5%] ml-[5%]">
                Trò chuyện
            </Text>
            {chats.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                    <Text className="text-gray-500 text-center font-medium">
                        {currentUserId
                            ? 'Không có cuộc trò chuyện nào. Hãy bắt đầu cuộc trò chuyện mới!'
                            : 'Đang đợi xác định người dùng...'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item, index) => item._id ? item._id.toString() : `chat-${index}`}
                    renderItem={({ item, index }) => renderChat({ item, index })}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                />
            )}
        </SafeAreaView>
    );
};

export default ChatScreen; 