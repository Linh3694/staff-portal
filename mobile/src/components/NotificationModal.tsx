import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationModalProps {
    visible: boolean;
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

const NotificationModal: React.FC<NotificationModalProps> = ({
    visible,
    type,
    message,
    onClose
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();

            // Tự động đóng sau 2 giây
            const timer = setTimeout(() => {
                handleClose();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            onClose();
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View className="flex-1 justify-start items-center pt-12">
                    <TouchableWithoutFeedback>
                        <Animated.View
                            className="w-[90%] bg-white rounded-2xl overflow-hidden shadow-lg"
                            style={{
                                opacity: fadeAnim,
                                transform: [{
                                    translateY: slideAnim
                                }]
                            }}
                        >
                            <View className={`flex-row items-center p-4 ${type === 'success' ? 'bg-[#E7F3E8]' : 'bg-[#FFEBEB]'}`}>
                                <View className={`w-8 h-8 rounded-full ${type === 'success' ? 'bg-[#4CAF50]' : 'bg-[#FF3B30]'} items-center justify-center mr-3`}>
                                    <Ionicons
                                        name={type === 'success' ? 'checkmark' : 'close'}
                                        size={20}
                                        color="white"
                                    />
                                </View>
                                <Text className={`flex-1 text-base ${type === 'success' ? 'text-[#2E7D32]' : 'text-[#C41E3A]'} font-medium`}>
                                    {message}
                                </Text>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default NotificationModal; 