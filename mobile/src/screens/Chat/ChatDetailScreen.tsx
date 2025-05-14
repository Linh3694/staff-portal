import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, SafeAreaView, Linking, Alert, ActionSheetIOS, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { User } from '../../navigation/AppNavigator'; // or wherever User is now defined
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

type Message = {
    _id: string;
    sender: User;
    content: string;
    chat: string;
    readBy: string[];
    createdAt: string;
    type: string;
    fileUrl?: string;
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

type ChatDetailParams = { user: User; chatId?: string };
type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const ChatDetailScreen = ({ route, navigation }: Props) => {
    const { user, chatId: routeChatId } = route.params;
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigationProp = useNavigation<NativeStackNavigationProp<{ ChatDetail: ChatDetailParams }, 'ChatDetail'>>();
    const socketRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const [isOtherOnline, setIsOtherOnline] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    let typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const [imagesToSend, setImagesToSend] = useState<any[]>([]);
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

    useLayoutEffect(() => {
        const parent = navigation.getParent?.();
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

    useEffect(() => {
        if (!socketRef.current) return;

        const handleUserOnline = ({ userId }: { userId: string }) => {
            if (userId === user._id) setIsOtherOnline(true);
        };
        const handleUserOffline = ({ userId }: { userId: string }) => {
            if (userId === user._id) setIsOtherOnline(false);
        };

        socketRef.current.on('userOnline', handleUserOnline);
        socketRef.current.on('userOffline', handleUserOffline);

        // Khi vào chat, gửi sự kiện online cho đối phương
        if (currentUserId && chat?._id) {
            socketRef.current.emit('userOnline', { userId: currentUserId, chatId: chat._id });
        }

        return () => {
            socketRef.current.off('userOnline', handleUserOnline);
            socketRef.current.off('userOffline', handleUserOffline);
        };
    }, [user._id, currentUserId, chat?._id]);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleTyping = ({ userId }: { userId: string }) => {
            if (userId === user._id) setOtherTyping(true);
        };
        const handleStopTyping = ({ userId }: { userId: string }) => {
            if (userId === user._id) setOtherTyping(false);
        };

        socketRef.current.on('userTyping', handleTyping);
        socketRef.current.on('userStopTyping', handleStopTyping);

        return () => {
            socketRef.current.off('userTyping', handleTyping);
            socketRef.current.off('userStopTyping', handleStopTyping);
        };
    }, [user._id]);

    const handleInputChange = (text: string) => {
        setInput(text);
        if (socketRef.current && chat) {
            socketRef.current.emit('typing', { chatId: chat._id, userId: currentUserId });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socketRef.current.emit('stopTyping', { chatId: chat._id, userId: currentUserId });
            }, 1500);
        }
    };

    // Hàm upload file/ảnh lên server
    const uploadAttachment = async (file: any, type: 'image' | 'file') => {
        if (!chat) return;
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('chatId', chat._id);
        if (type === 'image') {
            formData.append('file', {
                uri: file.uri,
                name: file.fileName || file.name || 'image.jpg',
                type: file.mimeType || file.type || 'image/jpeg',
            } as any);
        } else {
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as any);
        }
        try {
            const res = await fetch(`${apiUrl}/api/chats/upload-attachment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });
            const newMessage = await res.json();
            if (newMessage && newMessage._id) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m._id === newMessage._id);
                    return exists ? prevMessages : [...prevMessages, newMessage];
                });
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể gửi file/ảnh.');
        }
    };

    // Hàm chọn/chụp ảnh với ActionSheet
    const handleImageAction = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Chụp ảnh', 'Chọn từ thư viện', 'Hủy'],
                cancelButtonIndex: 2,
            },
            async (buttonIndex) => {
                if (buttonIndex === 0) {
                    // Chụp ảnh
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 1,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                        setImagesToSend(prev => [...prev, ...result.assets]);
                    }
                } else if (buttonIndex === 1) {
                    // Chọn từ thư viện (cho phép nhiều ảnh)
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsMultipleSelection: true,
                        quality: 1,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                        setImagesToSend(prev => [...prev, ...result.assets]);
                    }
                }
            }
        );
    };
    // Xóa ảnh khỏi preview
    const removeImage = (idx: number) => {
        setImagesToSend(prev => prev.filter((_, i) => i !== idx));
    };
    // Gửi tin nhắn (ảnh + text)
    const handleSend = async () => {
        if (imagesToSend.length > 0) {
            for (const img of imagesToSend) {
                await uploadAttachment(img, 'image');
            }
            setImagesToSend([]);
        }
        if (input.trim() && chat) {
            await sendMessage();
        }
    };

    // Hàm chọn file
    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (!result.canceled) {
            await uploadAttachment(result, 'file');
        }
    };

    return (
        <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
            <SafeAreaView>
                <View className="flex-row items-center p-3 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigationProp.goBack()} className="mr-3">
                        <Text className="text-3xl text-primary">{'‹'}</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: getAvatar(user) }} className="w-12 h-12 rounded-full mr-3" />
                    <View>
                        <Text className="font-bold text-lg">{user.fullname}</Text>
                        <View className="flex-row items-center mt-1">
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: (user._id === currentUserId || isOtherOnline) ? 'green' : '#bbb', marginRight: 4 }} />
                            <Text className={`text-xs ${(user._id === currentUserId || isOtherOnline) ? 'text-green-600' : 'text-gray-400'}`}>{(user._id === currentUserId || isOtherOnline) ? 'Online' : 'Offline'}</Text>
                        </View>
                    </View>
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
                        // Hiển thị nội dung tin nhắn
                        let messageContent = null;
                        if (item.type === 'image' && item.fileUrl) {
                            messageContent = (
                                <TouchableOpacity onPress={() => Linking.openURL(apiUrl + item.fileUrl)}>
                                    <Image source={{ uri: apiUrl + item.fileUrl }} style={{ width: 180, height: 180, borderRadius: 12 }} resizeMode="cover" />
                                </TouchableOpacity>
                            );
                        } else if (item.type === 'file' && item.fileUrl) {
                            messageContent = (
                                <TouchableOpacity onPress={() => Linking.openURL(apiUrl + item.fileUrl)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="attach-file" size={22} color="#002855" />
                                    <Text style={{ color: '#002855', textDecorationLine: 'underline', marginLeft: 4 }} numberOfLines={1}>{item.content}</Text>
                                </TouchableOpacity>
                            );
                        } else {
                            messageContent = (
                                <Text className={`${isMe ? 'text-white' : 'text-gray-800'} text-base`}>
                                    {item.content}
                                </Text>
                            );
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
                                    {messageContent}
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
                        <FontAwesome name="smile-o" size={28} color="#002855" style={{ marginRight: 12 }} />
                    </TouchableOpacity>
                    {otherTyping && (
                        <Text className="text-xs text-gray-500 ml-4 mb-1">
                            {user.fullname} đang soạn tin...
                        </Text>
                    )}
                    {/* Preview ảnh đã chọn */}
                    {imagesToSend.length > 0 && (
                        <ScrollView horizontal style={{ maxHeight: 90, marginBottom: 4, marginLeft: 10 }} showsHorizontalScrollIndicator={false}>
                            {imagesToSend.map((img, idx) => (
                                <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                                    <Image source={{ uri: img.uri }} style={{ width: 70, height: 70, borderRadius: 10 }} />
                                    <TouchableOpacity onPress={() => removeImage(idx)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10, padding: 2, elevation: 2 }}>
                                        <MaterialIcons name="close" size={18} color="#002855" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                    <TextInput
                        value={input}
                        onChangeText={handleInputChange}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 h-8 text-base text-primary mb-2"
                        autoFocus={true}
                    />
                    <TouchableOpacity onPress={handleImageAction}>
                        <Ionicons name="image-outline" size={28} color="#002855" style={{ marginHorizontal: 8 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePickFile}>
                        <MaterialIcons name="attach-file" size={28} color="#002855" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    {(input.trim() !== '' || imagesToSend.length > 0) && (
                        <TouchableOpacity onPress={handleSend} className="ml-2 justify-center">
                            <Ionicons name="send" size={26} color="#002855" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatDetailScreen;