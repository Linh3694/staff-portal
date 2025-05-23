import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { CustomEmoji } from '../Hook/useEmojis';
import { API_BASE_URL } from '../../../config/constants';

interface EmojiPickerProps {
    customEmojis: CustomEmoji[];
    handleSendEmoji: (emoji: CustomEmoji) => void;
    setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
    customEmojis,
    handleSendEmoji,
    setShowEmojiPicker
}) => {
    // Nhóm emoji theo category
    const groupedEmojis = customEmojis.reduce((acc: Record<string, CustomEmoji[]>, emoji) => {
        if (!acc[emoji.category]) {
            acc[emoji.category] = [];
        }
        acc[emoji.category].push(emoji);
        return acc;
    }, {});

    return (
        <View style={{
            height: 250,
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            width: '100%'
        }}>
            <ScrollView>
                {Object.entries(groupedEmojis).map(([category, emojis]) => (
                    <View key={category} style={{ marginBottom: 10 }}>
                        <Text style={{
                            padding: 10,
                            fontWeight: 'bold',
                            color: '#666'
                        }}>
                            Reactions đã có
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            paddingHorizontal: 5
                        }}>
                            {emojis.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji._id}
                                    style={{
                                        width: 60,
                                        height: 60,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        margin: 5
                                    }}
                                    onPress={() => {
                                        handleSendEmoji(emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                >
                                    <Image
                                        source={{ uri: `${API_BASE_URL}${emoji.url}` }}
                                        style={{ width: 48, height: 48 }}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default EmojiPicker; 