import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

interface ImageViewerModalProps {
    images: { uri: string }[];
    imageIndex: number;
    visible: boolean;
    onRequestClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    images,
    imageIndex,
    visible,
    onRequestClose
}) => {
    return (
        <ImageViewing
            images={images}
            imageIndex={imageIndex}
            visible={visible}
            onRequestClose={onRequestClose}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
            presentationStyle="fullScreen"
            animationType="fade"
            backgroundColor="rgba(0, 0, 0, 0.95)"
            HeaderComponent={({ imageIndex }) => (
                <View style={{
                    padding: 16,
                    paddingTop: Platform.OS === 'ios' ? 50 : 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%'
                }}>
                    <TouchableOpacity onPress={onRequestClose} style={{ padding: 8 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Inter', fontWeight: 'medium' }}>✕</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Inter', fontWeight: 'medium' }}>
                        {imageIndex + 1}/{images.length}
                    </Text>
                </View>
            )}
        />
    );
};

export default ImageViewerModal; 