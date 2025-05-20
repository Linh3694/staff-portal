import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Dimensions,
    Animated,
    Easing,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config/constants';
import ReplySvg from '../../../assets/reply.svg';
import ForwardSvg from '../../../assets/forward.svg';
import CopySvg from '../../../assets/copy.svg';
import RevokeSvg from '../../../assets/revoke.svg';
import PinSvg from '../../../assets/pin.svg';
import PinOffSvg from '../../../assets/pin-off.svg';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');


type MessageReactionModalProps = {
    visibleReactionBar: boolean;
    visibleActionBar: boolean;
    onCloseReactionBar: () => void;
    onCloseActionBar: () => void;
    position: { x: number, y: number } | null;
    onReactionSelect: (reaction: { code: string; isCustom: boolean }) => Promise<boolean>;
    onActionSelect: (action: string) => void;
    selectedMessage?: {
        content: string;
        type: string;
        fileUrls?: string[];
        sender: {
            fullname: string;
        };
    } | null;
    onSuccess?: () => void;
    showPinOption?: boolean;
    isPinned?: boolean;
};

// Thêm type cho CustomEmoji
type CustomEmoji = {
    _id: string;
    code: string;
    name: string;
    type: string;
    url: string;
    category: string;
    isDefault: boolean;
};

const REACTION_CODES = ['clap', 'laugh', 'wow', 'cry', 'heart'];

const initializeActions = (isPinned: boolean, messageType: string) => {
    const actions = [
        { icon: 'forward', text: 'Chuyển tiếp', value: 'forward', Svg: ForwardSvg },
        { icon: 'reply', text: 'Trả lời', value: 'reply', Svg: ReplySvg },
    ];

    // Chỉ thêm nút copy cho tin nhắn text
    if (messageType === 'text') {
        actions.push({ icon: 'copy', text: 'Sao chép', value: 'copy', Svg: CopySvg });
    }

    // Thêm tùy chọn ghim hoặc bỏ ghim dựa vào trạng thái hiện tại
    if (isPinned) {
        actions.push({ icon: 'unpin', text: 'Bỏ ghim', value: 'unpin', Svg: PinOffSvg });
    } else {
        actions.push({ icon: 'pin', text: 'Ghim tin nhắn', value: 'pin', Svg: PinSvg });
    }

    // Thêm tùy chọn thu hồi (nếu cần)
    actions.push({ icon: 'revoke', text: 'Thu hồi', value: 'revoke', Svg: RevokeSvg });

    return actions;
};

const MessageReactionModal = ({
    visibleReactionBar,
    visibleActionBar,
    onCloseReactionBar,
    onCloseActionBar,
    position,
    onReactionSelect,
    onActionSelect,
    selectedMessage,
    onSuccess,
    showPinOption = false,
    isPinned = false
}: MessageReactionModalProps) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.5));
    const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionBarHeight, setActionBarHeight] = useState(0);
    const [reactBarHeight, setReactBarHeight] = useState(0);

    useEffect(() => {
        if (visibleReactionBar || visibleActionBar) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.5,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visibleReactionBar, visibleActionBar]);

    useEffect(() => {
        const fetchEmojis = async () => {
            try {
                setIsLoading(true);
                const token = await AsyncStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/emoji/list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                const filteredEmojis = data.filter((emoji: CustomEmoji) =>
                    REACTION_CODES.includes(emoji.code)
                );
                setCustomEmojis(filteredEmojis);
            } catch (error) {
                console.error('Lỗi khi lấy emoji:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (visibleReactionBar) {
            fetchEmojis();
        }
    }, [visibleReactionBar]);

    // Thêm vào component để debug
    useEffect(() => {
        console.log('CustomEmojis:', customEmojis);
    }, [customEmojis]);

    // Danh sách emoji reactions
    const reactions = [
        { emoji: "👍", isCustom: false },
        { emoji: "❤️", isCustom: false },
        { emoji: "😂", isCustom: false },
        { emoji: "😮", isCustom: false },
        { emoji: "😢", isCustom: false },
        { emoji: "🙏", isCustom: false },
    ];

    // Danh sách actions (sử dụng hàm khởi tạo mới với messageType)
    const actions = initializeActions(isPinned, selectedMessage?.type || 'text');

    // Xác định vị trí của modal
    const modalPosition = position ? {
        top: position.y - 150, // Hiện phía trên vị trí nhấn
        left: Math.max(10, Math.min(position.x - 100, width - 210)) // Giữa màn hình có thể
    } : { top: height / 2 - 100, left: width / 2 - 100 };

    // Xử lý khi chọn emoji
    const handleReactionSelect = async (reaction: { code: string, isCustom: boolean }) => {
        setLoading(true);
        try {
            const success = await onReactionSelect(reaction);
            if (success) {
                onSuccess?.();
                onCloseReactionBar();
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tính toán kích thước của các components
    const onReactBarLayout = (event: any) => {
        setReactBarHeight(event.nativeEvent.layout.height);
        setIsLoading(false);
    };

    const onActionBarLayout = (event: any) => {
        setActionBarHeight(event.nativeEvent.layout.height);
        setIsLoading(false);
    };

    if ((!visibleReactionBar && !visibleActionBar) || !position) return null;

    return (
        <Modal
            transparent
            visible={visibleReactionBar || visibleActionBar}
            animationType="none"
            onRequestClose={() => {
                onCloseReactionBar();
                onCloseActionBar();
            }}
        >
            <TouchableWithoutFeedback onPress={() => {
                onCloseReactionBar();
                onCloseActionBar();
            }}>
                <View className="flex-1 bg-black/50 justify-center items-start">
                    {/* Selected Message Preview */}
                    {selectedMessage && (
                        <View className="bg-white p-3 rounded-xl max-w-[80%] mb-3 ml-[3%]">
                            <Text className="text-sm font-bold text-[#00687F] mb-1">{selectedMessage.sender.fullname}</Text>
                            {selectedMessage.type === 'image' && (
                                <View className="flex-row items-center">
                                    <Ionicons name="image-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                                    <Text className="text-base text-[#333]">Hình ảnh</Text>
                                </View>
                            )}
                            {selectedMessage.type === 'multiple-images' && selectedMessage.fileUrls && (
                                <View className="flex-row items-center">
                                    <Ionicons name="images-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                                    <Text className="text-base text-[#333]">
                                        {selectedMessage.fileUrls.length} hình ảnh
                                    </Text>
                                </View>
                            )}
                            {selectedMessage.type === 'file' && (
                                <View className="flex-row items-center">
                                    <Ionicons name="document-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                                    <Text className="text-base text-[#333]">Tệp đính kèm</Text>
                                </View>
                            )}
                            {selectedMessage.type === 'text' && (
                                <Text className="text-base text-[#333]" numberOfLines={1}>
                                    {selectedMessage.content}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Reaction Bar */}
                    {visibleReactionBar && (
                        <Animated.View
                            className="bg-white rounded-full mb-2 shadow-lg ml-[3%]"
                            style={{
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            }}
                        >
                            <View className="flex-row justify-around items-center px-2">
                                {isLoading ? (
                                    <Text>Đang tải...</Text>
                                ) : customEmojis.length > 0 ? (
                                    customEmojis.map((emoji, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.7}
                                            onPress={async () => {
                                                const success = await onReactionSelect({ code: emoji.code, isCustom: true });
                                                if (success) {
                                                    onSuccess?.();
                                                    onCloseReactionBar();
                                                }
                                            }}
                                            onPressIn={() => setHoveredIndex(index)}
                                            onPressOut={() => setHoveredIndex(null)}
                                            className="p-2"
                                            style={{
                                                transform: [
                                                    { scale: hoveredIndex === index ? 1.3 : 1 }
                                                ],
                                            }}
                                        >
                                            <Image
                                                source={{ uri: `${API_BASE_URL}${emoji.url}` }}
                                                className="w-12 h-12"
                                                resizeMode="contain"
                                            />
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text>Không tìm thấy emoji nào</Text>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    {/* Action Bar */}
                    {visibleActionBar && (
                        <Animated.View
                            className="bg-white rounded-2xl w-[65%] shadow-lg ml-[3%]"
                            style={{
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            }}
                        >
                            <View className="py-4 px-2">
                                {/* Chia 2 hàng, mỗi hàng 3 action */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    {[0, 1, 2].map(idx => {
                                        const action = actions[idx];
                                        if (!action) return <View key={idx} style={{ flex: 1 }} />;
                                        const SvgIcon = action.Svg;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={{ flex: 1, alignItems: 'center' }}
                                                onPress={() => {
                                                    onActionSelect(action.value);
                                                    onCloseActionBar();
                                                }}
                                            >
                                                <SvgIcon width={32} height={32} />
                                                <Text style={{ marginTop: 8, fontSize: 14, color: '#212121', fontFamily: 'Mulish-Regular', textAlign: 'center' }}>{action.text}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {[3, 4, 5].map(idx => {
                                        const action = actions[idx];
                                        if (!action) return <View key={idx} style={{ flex: 1 }} />;
                                        const SvgIcon = action.Svg;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={{ flex: 1, alignItems: 'center' }}
                                                onPress={() => {
                                                    onActionSelect(action.value);
                                                    onCloseActionBar();
                                                }}
                                            >
                                                <SvgIcon width={32} height={32} />
                                                <Text style={{ marginTop: 8, fontSize: 14, color: '#212121', fontFamily: 'Mulish-Regular', textAlign: 'center' }}>{action.text}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};



export default MessageReactionModal; 