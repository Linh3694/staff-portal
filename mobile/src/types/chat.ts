import { User } from './user';
import { User as AppNavigatorUser } from '../navigation/AppNavigator';

export interface Message {
    _id: string;
    content: string;
    sender: User;
    chat: string;
    createdAt: string;
    updatedAt: string;
    readBy: string[];
    type: 'text' | 'image' | 'file' | 'multiple-images';
    fileUrl?: string;
    fileUrls?: string[];
    fileName?: string;
    fileSize?: number;
    isPinned?: boolean;
    pinnedBy?: string;
    reactions?: MessageReaction[];
    replyTo?: Message;
    isEmoji?: boolean;
    emojiUrl?: string;
    isForwarded?: boolean;
    originalSender?: User;
}

export interface MessageReaction {
    userId: string;
    emojiCode: string;
    isCustom: boolean;
    createdAt: string;
}

export interface Chat {
    _id: string;
    participants: User[];
    lastMessage?: Message;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
}

export interface ChatDetailParams {
    user: User;
    chatId?: string;
}

export interface CustomEmoji {
    _id: string;
    name: string;
    code: string;
    url: string;
    type: string;
    category: string;
}

export type NotificationType = 'success' | 'error'; 