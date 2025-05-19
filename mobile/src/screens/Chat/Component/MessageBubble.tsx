import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Pressable, Linking } from 'react-native';
import { Message, CustomEmoji, Chat } from '../../../types/chat';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../config/constants';
import ImageGrid from './ImageGrid';

type MessageBubbleProps = {
    message: Message;
    currentUserId: string | null;
    customEmojis: CustomEmoji[];
    isFirst: boolean;
    isLast: boolean;
    showAvatar: boolean;
    onLongPressIn: (message: Message, event: any) => void;
    onLongPressOut: () => void;
    onImagePress: (images: string[], index: number) => void;
    messageScaleAnim: Animated.Value;
    formatMessageTime: (timestamp: string) => string;
    getAvatar: (user: any) => string;
    isLatestMessage: boolean;
    chat: Chat | null;
};

// Component hiển thị trạng thái tin nhắn
const MessageStatus = ({ message, currentUserId, chat }: { message: Message, currentUserId: string | null, chat: Chat | null }) => {
    // Chỉ hiển thị status cho tin nhắn của mình
    if (!currentUserId || message.sender._id !== currentUserId) {
        return null;
    }

    // Nếu chưa gửi hoặc đang gửi (không có _id)
    if (!message._id) {
        return <MaterialCommunityIcons name="clock-outline" size={12} color="#8aa0bc" />;
    }

    // Không có chat hoặc không có người tham gia
    if (!chat || !Array.isArray(chat.participants) || chat.participants.length === 0) {
        return <MaterialCommunityIcons name="check" size={12} color="#757575" />;
    }

    // Lấy danh sách người tham gia trừ người gửi
    const otherParticipants = chat.participants
        .filter(user => user._id !== currentUserId)
        .map(user => user._id);

    // Nếu không có người tham gia khác
    if (otherParticipants.length === 0) {
        return <MaterialCommunityIcons name="check" size={14} color="#757575" />;
    }

    // Đảm bảo readBy là một mảng
    const readByArray = Array.isArray(message.readBy) ? [...message.readBy] : [];

    // Lọc ra ID của người đã đọc, không tính người gửi
    const readByOthers = readByArray.filter(id =>
        id !== currentUserId && otherParticipants.includes(id)
    );

    // Kiểm tra xem tất cả người tham gia khác đã đọc chưa
    const allParticipantsRead = otherParticipants.length > 0 &&
        otherParticipants.every(participantId => readByArray.includes(participantId));

    // Nếu tất cả đã đọc - hiển thị tick xanh đậm
    if (allParticipantsRead) {
        return <MaterialCommunityIcons name="check-all" size={14} color="#757575" fontWeight="bold" />;
    }

    // Nếu có người đã đọc nhưng không phải tất cả - hiển thị tick xanh nhạt
    if (readByOthers.length > 0) {
        return <MaterialCommunityIcons name="check-all" size={14} color="#757575" />;
    }

    // Mặc định là đã gửi - hiển thị một tick xám
    return <MaterialCommunityIcons name="check" size={14} color="#757575" />;
};

const MessageBubble = ({
    message,
    currentUserId,
    customEmojis,
    isFirst,
    isLast,
    showAvatar,
    onLongPressIn,
    onLongPressOut,
    onImagePress,
    messageScaleAnim,
    formatMessageTime,
    getAvatar,
    isLatestMessage,
    chat
}: MessageBubbleProps) => {
    const isMe = currentUserId && message.sender._id === currentUserId;
    const isImageMsg = message.type === 'image' || message.type === 'multiple-images';
    const isStickerMsg = message.type === 'text' && message.isEmoji === true;

    // Tính border radius theo yêu cầu
    let borderRadiusStyle = {};
    if (isMe) {
        if (isFirst && isLast) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 20,
            };
        } else if (isLast) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 4,
                borderBottomLeftRadius: 20,
            };
        } else if (isFirst) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 20,
            };
        } else {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                borderBottomLeftRadius: 20,
            };
        }
    } else {
        if (isFirst && isLast) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 20,
            };
        } else if (isLast) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 4,
            };
        } else if (isFirst) {
            borderRadiusStyle = {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 4,
            };
        } else {
            borderRadiusStyle = {
                borderTopLeftRadius: 4,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 4,
            };
        }
    }

    return (
        <View>
            <Pressable
                onPressIn={(e) => onLongPressIn(message, e)}
                onPressOut={onLongPressOut}
                delayLongPress={500}
            >
                <Animated.View
                    style={[
                        {
                            flexDirection: isMe ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            marginBottom: isLast ? (message.reactions && message.reactions.length > 0 ? 14 : 8) : (message.reactions && message.reactions.length > 0 ? 10 : 1),
                            transform: [{ scale: messageScaleAnim }]
                        }
                    ]}
                >
                    {showAvatar ? (
                        <Image
                            source={{ uri: getAvatar(message.sender) }}
                            style={{ width: 40, height: 40, borderRadius: 9999, marginLeft: 4, marginRight: 4, padding: 2 }}
                        />
                    ) : (
                        <View style={{ width: isMe ? 8 : 40, marginLeft: 4, marginRight: 4 }} />
                    )}

                    {/* Container chứa cả reply và bubble tin nhắn */}
                    <View style={{
                        flexDirection: 'column',
                        maxWidth: '75%',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}>
                        {/* Preview tin nhắn reply */}
                        {message.replyTo && (
                            <View style={{
                                marginBottom: -10,
                                marginRight: isMe ? 5 : 0,
                                marginLeft: !isMe ? 5 : 0,
                                backgroundColor: isMe ? '#F5F5ED' : '#00948366',
                                borderRadius: 20,
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 1,
                                elevation: 1,
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                            }}>
                                {message.replyTo.type === 'image' || message.replyTo.type === 'multiple-images' ? (
                                    <Text style={{ fontSize: 16, color: '#666' }}>[Hình ảnh]</Text>
                                ) : message.replyTo.type === 'file' ? (
                                    <Text style={{ fontSize: 16, color: '#666' }}>[Tệp đính kèm]</Text>
                                ) : (
                                    <Text style={{
                                        fontSize: 16,
                                        color: isMe ? '#757575' : 'white',
                                        fontFamily: 'Mulish-Italic'
                                    }} numberOfLines={1}>
                                        {message.replyTo.content}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Bubble tin nhắn chính */}
                        <View style={{
                            backgroundColor: (isImageMsg || isStickerMsg)
                                ? 'transparent'
                                : (isMe ? '#009483' : '#F5F5ED'),
                            paddingVertical: (isImageMsg || isStickerMsg) ? 0 : 8,
                            paddingHorizontal: (isImageMsg || isStickerMsg) ? 0 : 14,
                            position: 'relative',
                            ...borderRadiusStyle,
                            marginBottom: !isMe ? 0 : 0,
                        }}>
                            <View style={{ position: 'relative' }}>
                                {/* Nội dung chính */}
                                {message.type === 'file' && message.fileUrl && (
                                    <TouchableOpacity onPress={() => message.fileUrl && Linking.openURL(message.fileUrl)}>
                                        <Text style={{ color: '#0066CC', textDecorationLine: 'underline' }}>Tệp đính kèm</Text>
                                    </TouchableOpacity>
                                )}
                                {message.type === 'image' && message.fileUrl && (
                                    <TouchableOpacity onPress={() => onImagePress([message.fileUrl || ''], 0)}>
                                        <Image
                                            source={{
                                                uri: message.fileUrl.startsWith('http')
                                                    ? message.fileUrl
                                                    : `${API_BASE_URL}${message.fileUrl}`
                                            }}
                                            style={{ width: 200, height: 150, borderRadius: 12 }}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                                {message.type === 'multiple-images' && message.fileUrls && message.fileUrls.length > 0 && (
                                    <ImageGrid
                                        images={message.fileUrls.map((url: string) =>
                                            url.startsWith('http') ? url : `${API_BASE_URL}${url}`
                                        )}
                                        onPress={(index) => onImagePress(
                                            message.fileUrls?.map((url: string) =>
                                                url.startsWith('http') ? url : `${API_BASE_URL}${url}`
                                            ) || [],
                                            index
                                        )}
                                    />
                                )}
                                {isStickerMsg && message.emojiUrl && (
                                    <Image
                                        source={{
                                            uri: message.emojiUrl.startsWith('http')
                                                ? message.emojiUrl
                                                : `${API_BASE_URL}${message.emojiUrl}`
                                        }}
                                        style={{ width: 120, height: 120, borderRadius: 12 }}
                                        resizeMode="contain"
                                    />
                                )}
                                {message.type === 'text' && !message.isEmoji && (
                                    <Text style={{
                                        color: isMe ? 'white' : '#757575',
                                        fontSize: 16,
                                        fontFamily: 'Mulish-Semibold'
                                    }}>
                                        {message.content}
                                    </Text>
                                )}

                                {/* Thời gian */}
                                {isImageMsg ? (
                                    <View style={{
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        borderRadius: 999,
                                        alignSelf: 'flex-start',
                                        marginTop: 6
                                    }}>
                                        <Text style={{
                                            color: '#fff',
                                            fontSize: 12,
                                            fontFamily: 'Mulish-Semibold'
                                        }}>
                                            {formatMessageTime(message.createdAt)}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={{
                                        color: isMe ? '#fff' : '#888',
                                        fontSize: 12,
                                        marginTop: 4,
                                        fontFamily: 'Mulish-Semibold',
                                        textAlign: 'left'
                                    }}>
                                        {formatMessageTime(message.createdAt)}
                                    </Text>
                                )}

                                {/* Reactions */}
                                {(message.reactions && message.reactions.length > 0) ? (
                                    <View style={{
                                        position: 'absolute',
                                        bottom: -20,
                                        right: 0,
                                        flexDirection: 'row',
                                        backgroundColor: 'white',
                                        borderRadius: 12,
                                        paddingHorizontal: 2,
                                        paddingVertical: 1,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}>
                                        {message.reactions.map((reaction, idx) => {
                                            if (!reaction.isCustom) {
                                                return (
                                                    <Text key={idx} style={{ fontSize: 16, marginRight: 2 }}>
                                                        {reaction.emojiCode}
                                                    </Text>
                                                );
                                            } else {
                                                const emoji = customEmojis.find(e => e.code === reaction.emojiCode);
                                                if (!emoji) return null;
                                                return (
                                                    <Image
                                                        key={idx}
                                                        source={{ uri: `${API_BASE_URL}${emoji.url}` }}
                                                        style={{ width: 18, height: 18 }}
                                                        resizeMode="contain"
                                                    />
                                                );
                                            }
                                        })}
                                    </View>
                                ) : (
                                    !isMe && isLatestMessage && (
                                        <View style={{
                                            position: 'absolute',
                                            bottom: -20,
                                            right: 0,
                                            flexDirection: 'row',
                                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: 12,
                                            paddingHorizontal: 4,
                                            paddingVertical: 2,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.08,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}>
                                            <Text style={{ fontSize: 16, opacity: 0.7 }}>
                                                <Entypo name="emoji-happy" size={12} color="gray" />
                                            </Text>
                                        </View>
                                    )
                                )}
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
            {isMe && isLatestMessage && (
                <View style={{
                    alignSelf: 'flex-end',
                    flexDirection: 'row',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 16,
                }}>
                    <MessageStatus message={message} currentUserId={currentUserId} chat={chat} />
                    <Text style={{ color: '#757575', fontSize: 12, marginLeft: 4, fontFamily: 'Mulish-Semibold' }}>
                        {message._id && message.readBy.includes(currentUserId) && chat && chat.participants.filter(p => p._id !== currentUserId).every(p => message.readBy.includes(p._id))
                            ? 'Đã đọc'
                            : message._id
                                ? 'Đã gửi'
                                : 'Đang gửi'}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default MessageBubble; 