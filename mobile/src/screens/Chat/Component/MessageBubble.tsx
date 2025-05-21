import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Pressable, Linking } from 'react-native';
import { Message, Chat } from '../../../types/message';
import { CustomEmoji } from '../../../types/chat';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../config/constants';
import ImageGrid from './ImageGrid';
import MessageStatus from './MessageStatus';

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
    showTime,
    prevMsg
}: MessageBubbleProps) => {
    const isMe = currentUserId && message.sender._id === currentUserId;
    const isImageMsg = message.type === 'image';
    const isMultipleImagesMsg = message.type === 'multiple-images';
    const isStickerMsg = message.type === 'text' && message.isEmoji === true;
    const isFileMsg = message.type === 'file';

    // ─── Explicit text categories ────────────────────────────────
    const isTextNormal = message.type === 'text' && !message.isEmoji && !message.replyTo && !message.isForwarded;
    const isTextReply = message.type === 'text' && !!message.replyTo;
    const isTextForward = message.type === 'text' && message.isForwarded === true;

    // Tính border radius theo yêu cầu
    let borderRadiusStyle: any = {};

    if (isTextNormal) {
        // Text thường ⇒ bo theo isFirst / isLast
        borderRadiusStyle = isMe
            ? {
                borderTopLeftRadius: 20,
                borderTopRightRadius: !isFirst && !isLast ? 4 : (isFirst ? 4 : 20),
                borderBottomRightRadius: !isFirst && !isLast ? 4 : (isLast ? 4 : 20),
                borderBottomLeftRadius: 20,
            }
            : {
                borderTopLeftRadius: !isFirst && !isLast ? 4 : (isFirst ? 4 : 20),
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: !isFirst && !isLast ? 4 : (isLast ? 4 : 20),
            };
    } else {
        // Reply, forward, emoji, image, file … ⇒ bo đều 4 góc
        borderRadiusStyle = {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,
        };
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
                            marginBottom: (message.reactions && message.reactions.length > 0) ? 12 : 1,
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
                        paddingTop: 2,
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
                                backgroundColor: isMe ? '#F5F5ED' : '#00948366',
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
                                                ? (message.replyTo.fileUrl?.startsWith('http') ? message.replyTo.fileUrl : `${API_BASE_URL}${message.replyTo.fileUrl}`)
                                                : (message.replyTo.fileUrls && message.replyTo.fileUrls.length > 0
                                                    ? (message.replyTo.fileUrls[0].startsWith('http') ? message.replyTo.fileUrls[0] : `${API_BASE_URL}${message.replyTo.fileUrls[0]}`)
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
                                <View style={{
                                    backgroundColor: (isImageMsg || isMultipleImagesMsg || isStickerMsg)
                                        ? 'transparent'
                                        : (isMe ? '#009483' : '#F5F5ED'),
                                    position: 'relative',
                                    ...borderRadiusStyle,
                                    alignSelf: 'flex-start',
                                    maxWidth: '100%',
                                    paddingHorizontal: (isImageMsg || isMultipleImagesMsg || isStickerMsg) ? 0 : 14,
                                    paddingVertical: (isImageMsg || isMultipleImagesMsg || isStickerMsg) ? 0 : 8
                                }}>
                                    <View style={{ position: 'relative' }}>
                                        {/* Nội dung chính */}
                                        {message.type === 'file' && message.fileUrl && (
                                            <TouchableOpacity onPress={() => message.fileUrl && Linking.openURL(message.fileUrl)}>
                                                <Text style={{ color: '#0066CC', textDecorationLine: 'underline' }}>Tệp đính kèm</Text>
                                            </TouchableOpacity>
                                        )}
                                        {isImageMsg && message.fileUrl && (
                                            <TouchableOpacity
                                                onPress={() => onImagePress([message.fileUrl || ''], 0)}
                                                onLongPress={(e) => onLongPressIn(message, e)}
                                                onPressOut={onLongPressOut}
                                                delayLongPress={500}
                                            >
                                                <Image
                                                    source={{
                                                        uri: message.fileUrl.startsWith('http')
                                                            ? message.fileUrl
                                                            : `${API_BASE_URL}${message.fileUrl}`
                                                    }}
                                                    style={{ width: 200, height: 200, borderRadius: 12 }}
                                                    resizeMode="cover"
                                                />
                                            </TouchableOpacity>
                                        )}
                                        {isMultipleImagesMsg && message.fileUrls && message.fileUrls.length > 0 && (
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
                                                onLongPress={(index, event) => onLongPressIn(message, event)}
                                                onPressOut={onLongPressOut}
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

                                        {/* Thời gian cho tin nhắn */}
                                        {/* {isFirst && (
                                            isImageMsg || isMultipleImagesMsg || isStickerMsg ? (
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: -20,
                                                    right: 0,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                }}>
                                                    <Text style={{
                                                        color: '#757575',
                                                        fontSize: 12,
                                                        fontFamily: 'Mulish-Regular',
                                                    }}>
                                                        {formatMessageTime(message.createdAt)}
                                                    </Text>
                                                </View>
                                            ) : (
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: -20,
                                                        right: 0,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}>
                                                        <Text style={{
                                                            color: '#757575',
                                                            fontSize: 12,
                                                            fontFamily: 'Mulish-Regular',
                                                        }}>
                                                            {formatMessageTime(message.createdAt)}
                                                        </Text>
                                                    </View>
                                            )
                                        )} */}

                                        {/* Reactions */}
                                        {(message.reactions && message.reactions.length > 0) ? (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: 20,
                                                right: (isImageMsg || isMultipleImagesMsg) ? 12 : 0,
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
                            <View style={{
                                backgroundColor: (isImageMsg || isMultipleImagesMsg || isStickerMsg)
                                    ? 'transparent'
                                    : (isMe ? '#009483' : '#F5F5ED'),
                                position: 'relative',
                                ...borderRadiusStyle,
                                alignSelf: 'flex-start',
                                maxWidth: '100%',
                                paddingHorizontal: (isImageMsg || isMultipleImagesMsg || isStickerMsg) ? 0 : 14,
                                paddingVertical: (isImageMsg || isMultipleImagesMsg || isStickerMsg) ? 0 : 8
                            }}>
                                <View style={{ position: 'relative' }}>
                                    {/* Nội dung chính */}
                                    {message.type === 'file' && message.fileUrl && (
                                        <TouchableOpacity onPress={() => message.fileUrl && Linking.openURL(message.fileUrl)}>
                                            <Text style={{ color: '#0066CC', textDecorationLine: 'underline' }}>Tệp đính kèm</Text>
                                        </TouchableOpacity>
                                    )}
                                    {isImageMsg && message.fileUrl && (
                                        <TouchableOpacity
                                            onPress={() => onImagePress([message.fileUrl || ''], 0)}
                                            onLongPress={(e) => onLongPressIn(message, e)}
                                            onPressOut={onLongPressOut}
                                            delayLongPress={500}
                                        >
                                            <Image
                                                source={{
                                                    uri: message.fileUrl.startsWith('http')
                                                        ? message.fileUrl
                                                        : `${API_BASE_URL}${message.fileUrl}`
                                                }}
                                                style={{ width: 200, height: 200, borderRadius: 12 }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    )}
                                    {isMultipleImagesMsg && message.fileUrls && message.fileUrls.length > 0 && (
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
                                            onLongPress={(index, event) => onLongPressIn(message, event)}
                                            onPressOut={onLongPressOut}
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

                                    {/* Thời gian cho tin nhắn */}
                                    {/* {isFirst && (
                                            isImageMsg || isMultipleImagesMsg || isStickerMsg ? (
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: -20,
                                                    right: 0,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                }}>
                                                    <Text style={{
                                                        color: '#757575',
                                                        fontSize: 12,
                                                        fontFamily: 'Mulish-Regular',
                                                    }}>
                                                        {formatMessageTime(message.createdAt)}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: -20,
                                                    right: 0,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                }}>
                                                    <Text style={{
                                                        color: '#757575',
                                                        fontSize: 12,
                                                        fontFamily: 'Mulish-Regular',
                                                    }}>
                                                        {formatMessageTime(message.createdAt)}
                                                    </Text>
                                                </View>
                                            )
                                        )} */}

                                        {/* Reactions */}
                                        {(message.reactions && message.reactions.length > 0) ? (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: -10,
                                                right: (isImageMsg || isMultipleImagesMsg) ? 12 : 0,
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
                            }}>
                                <Text style={{
                                    color: '#757575',
                                    fontSize: 12,
                                    fontFamily: 'Mulish-Regular',
                                }}>
                                    Đã gửi
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
};

export default MessageBubble;