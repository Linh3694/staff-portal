import type { User } from '../navigation/AppNavigator';

export type Message = {
    _id: string;
    sender: User;
    content: string;
    chat: string;
    readBy: string[];
    createdAt: string;
    type: string;
    fileUrl?: string;
    fileUrls?: string[];
    isEmoji?: boolean;
    emojiId?: string;
    emojiType?: string;
    emojiName?: string;
    emojiUrl?: string;
    replyTo?: Message;
    reactions: {
        user: string;
        emojiCode: string;
        isCustom: boolean;
    }[];
    isPinned?: boolean;
    pinnedBy?: string;
};

export type Chat = {
    _id: string;
    participants: User[];
};

export type CustomEmoji = {
    _id: string;
    code: string;
    name: string;
    type: string;
    url: string;
    category: string;
    isDefault: boolean;
};

export type ChatDetailParams = {
    user: User;
    chatId?: string
};

export type MessageReaction = {
    user: string;
    emojiCode: string;
    isCustom: boolean;
};

export type NotificationType = {
    visible: boolean;
    type: 'success' | 'error';
    message: string;
}; 