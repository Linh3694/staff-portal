import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList, User } from '../../navigation/ChatStackNavigator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

type Message = {
    _id: string;
    sender: User;
    content: string;
    chat: string;
    readBy: string[];
    createdAt: string;
};

type Chat = {
    _id: string;
    participants: User[];
};

const getAvatar = (user: User) => {
    if (user.avatarUrl) {
        return `${apiUrl}/uploads/Avatar/${user.avatarUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}`;
};

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatDetail'>;

const ChatDetailScreen = ({ route }: Props) => {
    const { user, chatId: routeChatId } = route.params;
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
    const socketRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);
    useEffect(() => {
        // Lấy currentUserId từ token
        const fetchCurrentUser = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const decoded: { id?: string, _id?: string } = jwtDecode(token) as any;
                    if (decoded && (decoded._id || decoded.id)) {
                        const userId = decoded._id || decoded.id;
                        if (userId) {
                            setCurrentUserId(userId);
                        }
                    }
                } catch (err) {
                    console.log('Token decode error:', err);
                }
            }
        };
        fetchCurrentUser();
    }, []);

    // Hide tab bar immediately (already hidden by ChatScreen, but ensure on deep links)
    React.useLayoutEffect(() => {
        const parent = (navigation as any).getParent?.();
        parent?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => {
            parent?.setOptions({ tabBarStyle: undefined });
        };
    }, [navigation]);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Nếu có sẵn chatId từ route.params, sử dụng nó
                if (routeChatId) {
                    // Lấy thông tin chat
                    setChat({ _id: routeChatId, participants: [] as User[] });

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${apiUrl}/api/chats/messages/${routeChatId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const msgData = await msgRes.json();
                    if (Array.isArray(msgData)) {
                        // Sắp xếp tin nhắn từ cũ đến mới
                        const sortedMessages = [...msgData].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        setMessages(sortedMessages);

                        // Đánh dấu tin nhắn là đã đọc nếu có currentUserId
                        if (currentUserId && msgData.length > 0) {
                            markMessagesAsRead(routeChatId, currentUserId, token);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(token, routeChatId);
                } else {
                    // Tạo chat mới nếu không có sẵn chatId
                    const res = await fetch(`${apiUrl}/api/chats/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ participantId: user._id }),
                    });
                    const chatData = await res.json();
                    setChat(chatData);

                    // Lấy tin nhắn
                    const msgRes = await fetch(`${apiUrl}/api/chats/messages/${chatData._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const msgData = await msgRes.json();
                    if (Array.isArray(msgData)) {
                        // Sắp xếp tin nhắn từ cũ đến mới
                        const sortedMessages = [...msgData].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        setMessages(sortedMessages);

                        // Đánh dấu tin nhắn là đã đọc nếu có currentUserId
                        if (currentUserId && msgData.length > 0) {
                            markMessagesAsRead(chatData._id, currentUserId, token);
                        }
                    }

                    // Thiết lập Socket.IO
                    setupSocket(token, chatData._id);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchData();
        }

        return () => {
            // Dọn dẹp socket khi component unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user, routeChatId, currentUserId]);

    // Cuộn xuống tin nhắn mới nhất khi tin nhắn thay đổi
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current && !loading) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [messages, loading]);

    const markMessagesAsRead = async (chatId: string, userId: string, token: string) => {
        try {
            // Sử dụng API mới để đánh dấu tất cả tin nhắn đã đọc
            const response = await fetch(`${apiUrl}/api/chats/read-all/${chatId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                // Cập nhật state tin nhắn
                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.sender._id !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
                            return {
                                ...msg,
                                readBy: [...(msg.readBy || []), userId]
                            };
                        }
                        return msg;
                    })
                );
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const setupSocket = async (token: string | null, chatId: string) => {
        if (!token) return;

        // Dọn dẹp socket cũ nếu có
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Kết nối Socket.IO với token
        socketRef.current = io(apiUrl, {
            query: { token },
            transports: ['websocket']
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');

            // Tham gia phòng chat
            socketRef.current.emit('joinChat', chatId);
        });

        // Lắng nghe tin nhắn mới
        socketRef.current.on('receiveMessage', (newMessage: Message) => {
            console.log('Nhận tin nhắn mới:', newMessage);
            if (newMessage.chat === chatId) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    // Nếu tin nhắn đã tồn tại (_id trùng) thì bỏ qua
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });

                // Cuộn xuống tin nhắn mới nhất
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);

                // Đánh dấu tin nhắn mới là đã đọc nếu bạn không phải người gửi
                if (currentUserId && newMessage.sender._id !== currentUserId) {
                    markMessagesAsRead(chatId, currentUserId, token);
                }
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socketRef.current.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });
    };

    const sendMessage = async () => {
        if (!input.trim() || !chat) return;
        const token = await AsyncStorage.getItem('token');
        const content = input.trim();

        // Xóa input trước để UI phản hồi nhanh hơn
        setInput('');

        try {
            const res = await fetch(`${apiUrl}/api/chats/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId: chat._id, content }),
            });

            const newMessage = await res.json();
            console.log('Gửi tin nhắn mới:', newMessage);

            // Thêm tin nhắn vào state trước khi nhận từ socket để hiển thị ngay lập tức
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    // Kiểm tra tin nhắn đã tồn tại chưa
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });

                // Cuộn xuống tin nhắn mới nhất
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Nếu có lỗi, hiển thị lại input
            setInput(content);
        }
    };


    return (
        <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
            <SafeAreaView>
                <View className="flex-row items-center p-3 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <Text className="text-3xl text-primary">{'‹'}</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: getAvatar(user) }} className="w-12 h-12 rounded-full mr-3" />
                    <Text className="font-bold text-lg">{user.fullname}</Text>
                </View>
            </SafeAreaView>
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <Text>Đang tải tin nhắn...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => item._id || `message-${index}`}
                    renderItem={({ item, index }) => {
                        const isMe = currentUserId && item.sender._id === currentUserId;

                        // Hiển thị avatar của người **khác** chỉ ở tin nhắn cuối cùng trong chuỗi liên tiếp
                        let showAvatar = false;
                        if (!isMe) {
                            const isLast =
                                index === messages.length - 1 ||
                                messages[index + 1].sender._id !== item.sender._id;
                            showAvatar = isLast;
                        }

                        return (
                            <View
                                key={`msg-${item._id || index}`}
                                className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} items-end my-0.5 mx-2`}
                            >
                                {/* Avatar (only for other user) → show on last bubble in a sequence,  
                                    otherwise render placeholder to keep left indent constant */}
                                {!isMe && (
                                    showAvatar ? (
                                        <View className="relative mr-1.5">
                                            <Image
                                                source={{ uri: getAvatar(item.sender) }}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            {/* online dot */}
                                        </View>
                                    ) : (
                                        // placeholder so earlier bubbles align with avatar space
                                        <View className="w-8 mr-1.5" />
                                    )
                                )}
                                <View
                                    className={`${isMe ? 'bg-blue-500' : 'bg-gray-200'
                                        } rounded-2xl py-2 px-3.5 max-w-[75%]`}
                                >
                                    <Text
                                        className={`${isMe ? 'text-white' : 'text-gray-800'
                                            } text-base`}
                                    >
                                        {item.content}
                                    </Text>
                                </View>
                                {isMe && <View className="w-8" />}
                            </View>
                        );
                    }}
                    className="flex-1"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: insets.bottom + 80 }}
                />
            )}
            <View
                style={{ bottom: insets.bottom }}
                className="absolute inset-x-0 flex-row items-center py-2 px-5 bg-white"
            >
                <View className="flex-row items-center flex-1 rounded-full px-3 py-4">
                    <TouchableOpacity>
                        <Ionicons name="camera" size={28} color="#002855" className="mr-2" />
                    </TouchableOpacity>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 h-8 text-base text-primary mb-2"
                        autoFocus={true}
                    />
                    {input.trim() === '' ? (
                        <>
                            <TouchableOpacity>
                                <MaterialIcons name="mic" size={28} color="#757575" className="mx-2" />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Ionicons name="image-outline" size={28} color="#757575" className="mx-2" />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <FontAwesome name="smile-o" size={28} color="#757575" className="ml-2" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={sendMessage} className="ml-2 justify-center">
                            <Ionicons name="send" size={26} color="#002855" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatDetailScreen;