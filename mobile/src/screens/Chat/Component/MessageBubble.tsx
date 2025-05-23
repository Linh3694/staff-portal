import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Pressable, Linking, StyleSheet } from 'react-native';
import { Message, Chat } from '../../../types/message';
import { CustomEmoji } from '../../../types/chat';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Entypo } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../config/constants';
import ImageGrid from './ImageGrid';
import MessageStatus from './MessageStatus';
import { processImageUrl } from '../Utils/image';
import { useOnlineStatus } from '../../../context/OnlineStatusContext';
import Avatar from './Avatar';
import MessageContent from './MessageContent';

// Extend the Message type to specify the exact type of isForwarded
interface MessageWithForwarded extends Message {
    isForwarded: boolean;
}

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
    showTime?: boolean;
    prevMsg?: Message;
};

// Component hiển thị thông tin chuyển tiếp
const ForwardedLabel = ({ message, isMe }: { message: Message, isMe: boolean }) => {
    return (
        <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 4,
            paddingHorizontal: 2,
            opacity: 0.8
        }}>
            <MaterialCommunityIcons name="share" size={14} color={isMe ? '#f0f0f0' : '#757575'} />
            <Text style={{ 
                fontSize: 12, 
                color: isMe ? '#f0f0f0' : '#757575', 
                marginLeft: 4,
                fontFamily: 'Mulish-Italic'
            }}>
                Đã chuyển tiếp từ {message.originalSender?.fullname || 'người dùng khác'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    bubble: {
        backgroundColor: 'transparent',
        alignSelf: 'flex-start' as const,
        maxWidth: '100%',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    }
});

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
    chat,
    showTime = false,
    prevMsg
}: MessageBubbleProps) => {
    const isMe = currentUserId && message.sender._id === currentUserId;
    // Only treat as standalone emoji if it's a recognized custom emoji
    const isCustomEmoji = message.isEmoji && customEmojis.some(e => e.code === message.content || e.name === message.content);
    const { isUserOnline, getFormattedLastSeen } = useOnlineStatus();

    // Kiểm tra tin nhắn có hợp lệ không
    if (!message || !message.sender) {
        console.error('Invalid message:', message);
        return null;
    }

    // Tính toán style cho bubble
    const getBubbleStyle = () => {
        // Only treat actual images and multi-image messages as media content
        const isMediaContent = message.type === 'image' || message.type === 'multiple-images';

        const isAlone = isFirst && isLast;
        return {
            ...styles.bubble,
            backgroundColor: isMediaContent ? 'transparent' : (isMe ? '#009483' : '#F5F5ED'),
            paddingHorizontal: isMediaContent ? 0 : 14,
            paddingVertical: isMediaContent ? 0 : 8,
            borderTopLeftRadius: isMe ? 20 : (isAlone ? 20 : (isFirst ? 4 : 20)),
            borderTopRightRadius: isMe ? (isAlone ? 20 : (isFirst ? 4 : 20)) : 20,
            borderBottomRightRadius: isMe ? (isAlone ? 20 : (isLast ? 4 : 20)) : 20,
            borderBottomLeftRadius: isMe ? 20 : (isAlone ? 20 : (isLast ? 4 : 20)),
            minWidth: 48,
            minHeight: 36,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        };
    };

    // Xử lý hiển thị tin nhắn dựa trên loại
    const renderMessageContent = () => {
        // Nếu là emoji custom thì render riêng, không nằm trong bubble
        if (message.isEmoji && typeof message.content === 'string') {
            const emoji = customEmojis.find(e => e.code === message.content || e.name === message.content);
            if (emoji) {
                return (
                    <View style={{
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        justifyContent: 'center',
                        width: '100%',
                        paddingVertical: 8,
                        paddingHorizontal: 0,
                    }}>
                        <Image
                            source={{ uri: emoji.url?.startsWith('http') ? emoji.url : `${API_BASE_URL}${emoji.url}` }}
                            style={{ width: 80, height: 80, borderRadius: 16 }}
                            resizeMode="contain"
                        />
                    </View>
                );
            }
        }
        // Chỉ loại bỏ bubble nếu là image mà không có fileUrl, hoặc multiple-images mà không có fileUrls
        if (
            (message.type === 'image' && !message.fileUrl) ||
            (message.type === 'multiple-images' && (!message.fileUrls || message.fileUrls.length === 0))
        ) {
            return null;
        }
        // Luôn render MessageContent cho các trường hợp còn lại
        return <MessageContent message={message} isMe={!!isMe} customEmojis={customEmojis} />;
    };

    // Xử lý trạng thái tin nhắn
    const renderMessageStatus = () => {
        if (!isMe || !isLatestMessage) return null;

        if (message.readBy && message.readBy.length > 0) {
            return (
                <>
                    <Text style={{
                        color: '#757575',
                        fontSize: 12,
                        fontFamily: 'Mulish-Regular',
                        marginRight: 4
                    }}>
                        Đã xem
                    </Text>
                    <MaterialCommunityIcons name="check-all" size={16} color="#009483" />
                </>
            );
        }

        return (
            <>
                <Text style={{
                    color: '#757575',
                    fontSize: 12,
                    fontFamily: 'Mulish-Regular',
                    marginRight: 4
                }}>
                    Đã gửi
                </Text>
                <MaterialCommunityIcons name="check" size={16} color="#757575" />
            </>
        );
    };

    // Render footer cho tin nhắn
    const renderMessageFooter = () => {
        if (!showTime) return null;

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
                marginRight: 4
            }}>
                <Text style={{
                    color: '#757575',
                    fontSize: 12,
                    fontFamily: 'Mulish-Regular',
                    marginRight: 4
                }}>
                    {formatMessageTime(message.createdAt)}
                </Text>
                {!isMe && (
                    <Text style={{
                        color: '#757575',
                        fontSize: 12,
                        fontFamily: 'Mulish-Regular'
                    }}>
                        • {isUserOnline(message.sender._id) ? 'Đang hoạt động' : getFormattedLastSeen(message.sender._id)}
                    </Text>
                )}
                {isMe && (
                    <MessageStatus message={message} currentUserId={currentUserId} chat={chat} />
                )}
            </View>
        );
    };

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
                            marginBottom: (message.reactions && message.reactions.length > 0) ? 12 : 1,
                            transform: [{ scale: messageScaleAnim }]
                        }
                    ]}
                >
                    {showAvatar ? (
                        <Avatar user={message.sender} size={40} statusSize={12} />
                    ) : (
                            <View style={{ width: isMe ? 8 : 32, marginLeft: 4, marginRight: 4 }} />
                    )}

                    {/* Nếu là emoji thì không render bubble, chỉ render emoji to */}
                    {isCustomEmoji ? (
                        <View style={{ flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                            {renderMessageContent()}
                        </View>
                    ) : (
                        // Container chứa cả reply và bubble tin nhắn
                        <View style={{
                            flexDirection: 'column',
                            paddingTop: 2,
                                paddingLeft: isMe ? 0 : 8,
                                maxWidth: '75%',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                            }}>
                                {/* Preview tin nhắn reply */}
                                {message.replyTo && (
                                    <View style={{
                                        marginBottom: -10,
                                        marginRight: isMe ? 5 : 0,
                                        marginLeft: !isMe ? 5 : 0,
                                        backgroundColor: isMe ? '#F5F5ED' : '#009483',
                                        borderRadius: 20,
                                        paddingVertical: 12,
                                        paddingHorizontal: 12,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 1,
                                        elevation: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        minHeight: 40,
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '100%'
                                    }}>
                                        {/* Thumbnail nếu là ảnh hoặc nhiều ảnh */}
                                        {(message.replyTo.type === 'image' || message.replyTo.type === 'multiple-images') && (
                                            <Image
                                                source={{
                                                    uri: message.replyTo.type === 'image'
                                                        ? processImageUrl(message.replyTo.fileUrl)
                                                        : (message.replyTo.fileUrls && message.replyTo.fileUrls.length > 0
                                                            ? processImageUrl(message.replyTo.fileUrls[0])
                                                            : undefined)
                                                }}
                                                style={{ width: 50, height: 50, borderRadius: 8, marginRight: 8, flexShrink: 0 }}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <View style={{ minWidth: 0, maxWidth: 150 }}>
                                            {message.replyTo.type === 'file' && (
                                                <Text style={{ fontSize: 14, color: '#666' }} numberOfLines={1}>[Tệp đính kèm]</Text>
                                            )}
                                            {message.replyTo.type !== 'image' && message.replyTo.type !== 'multiple-images' && message.replyTo.type !== 'file' && (
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: isMe ? '#757575' : 'white',
                                                    fontFamily: 'Mulish-Regular'
                                                }} numberOfLines={1}>
                                                    {message.replyTo.content}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                                {/* Forwarded header */}
                                {message.isForwarded === true && (
                                    <View style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: 6,
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#BEBEBE',
                                            fontFamily: 'Mulish-Regular'
                                        }}>
                                            {isMe ? 'Bạn' : message.sender.fullname} đã chuyển tiếp tin nhắn từ
                                        </Text>
                                        {message.originalSender && (
                                            <Text style={{
                                                fontSize: 14,
                                                color: '#757575',
                                                fontFamily: 'Mulish-SemiBold',
                                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                marginTop: 4
                                            }}>
                                                {message.originalSender.fullname}
                                            </Text>
                                        )}
                                    </View>
                                )}
                                {/* Bubble tin nhắn chính */}
                                {/* Bubble + vertical bar wrapper */}
                                {message.isForwarded === true ? (
                                    <View style={{
                                        flexDirection: isMe ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start'
                                    }}>
                                        {/* bar */}
                                        <View style={{
                                            width: 4,
                                            backgroundColor: isMe ? '#009483' : '#E6E6E6',
                                            borderRadius: 2,
                                            alignSelf: 'stretch'
                                        }} />
                                        {/* gap */}
                                        <View style={{ width: 8 }} />
                                        {/* bubble */}
                                        <View style={getBubbleStyle()}>
                                            <View style={{ position: 'relative' }}>
                                                {/* Nội dung chính */}
                                                {renderMessageContent()}

                                                {/* Reactions */}
                                                {(message.reactions && message.reactions.length > 0) ? (
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: 20,
                                                        right: (message.type === 'image' || message.type === 'multiple-images') ? 12 : 0,
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
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    // Original bubble (non-forwarded)
                                <View style={getBubbleStyle()}>
                                            <View style={{ position: 'relative' }}>
                                                {/* Nội dung chính */}
                                                {renderMessageContent()}
                                        {/* Reactions */}
                                        {(message.reactions && message.reactions.length > 0) ? (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: -10,
                                                right: (message.type === 'image' || message.type === 'multiple-images') ? 12 : 0,
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
                                        ) : null}
                                    </View>
                                </View>
                                )}
                                {/* Trạng thái tin nhắn cuối cùng */}
                                {isMe && isLatestMessage && (
                                    <View style={{
                                        alignSelf: 'flex-end',
                                        marginTop: 4,
                                        marginRight: 4,
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}>
                                        {renderMessageStatus()}
                                    </View>
                                )}
                                {/* Footer với thời gian và trạng thái online */}
                                {renderMessageFooter()}
                            </View>
                    )}
                </Animated.View>
            </Pressable>
        </View>
    );
};

export default React.memo(MessageBubble);