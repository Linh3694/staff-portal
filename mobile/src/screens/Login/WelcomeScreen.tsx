import React, { useLayoutEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMicrosoftLogin } from './useMicrosoftLogin';
import MicrosoftIcon from '../../assets/microsoft.svg';
import { ROUTES } from '../../constants/routes';
import { API_BASE_URL } from '../../config/constants';

type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    SignIn: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WelcomeScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { width: screenWidth } = Dimensions.get('window');
    const BANNER_WIDTH = 1100;
    const BANNER_HEIGHT = 480;

    const translateX = useRef(new Animated.Value(0)).current;

    useLayoutEffect(() => {
        let isMounted = true;
        const animate = () => {
            if (!isMounted) return;
            translateX.setValue(0);
            Animated.timing(translateX, {
                toValue: -BANNER_WIDTH,
                duration: 18000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => {
                if (isMounted) animate();
            });
        };
        animate();
        return () => { isMounted = false; };
    }, [translateX]);

    // Sử dụng hook đăng nhập Microsoft
    const { request, promptAsync } = useMicrosoftLogin((token) => {
        // Lưu token, chuyển màn hình, v.v.
    });

    return (
        <View className="flex-1 bg-white">
            <View className="flex-1 justify-center mb-[20%] items-center">
                <View className="w-full items-center space-y-5">
                    <View className="mb-5">
                        <Text className="text-lg font-bold text-primary text-center mb-5">
                            Chào mừng Thầy Cô đến với
                        </Text>
                        <Text className="text-5xl font-extrabold text-secondary text-center mb-5">
                            School Portal
                        </Text>
                        <Text className="text-base font-semibold text-text-secondary mb-5 text-center">
                            Đồng hành cùng thế hệ tương lai
                        </Text>
                    </View>
                    {/* Banner động */}
                    <View
                        style={{
                            width: screenWidth,
                            height: BANNER_HEIGHT,
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                            alignSelf: 'center',
                        }}
                    >
                        <Animated.View
                            style={{
                                flexDirection: 'row',
                                width: BANNER_WIDTH * 3,
                                height: BANNER_HEIGHT,
                                transform: [{ translateX }],
                            }}
                        >
                            <Animated.Image
                                source={require('../../assets/welcome.png')}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                            <Animated.Image
                                source={require('../../assets/welcome.png')}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                            <Animated.Image
                                source={require('../../assets/welcome.png')}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
            <View className="absolute bottom-12 w-full items-center">
                <TouchableOpacity
                    onPress={() => promptAsync()}
                    className="w-4/5 flex-row items-center justify-center rounded-full bg-secondary/10 py-4"
                    disabled={!request}
                >
                    <View style={{ marginRight: 8 }}>
                        <MicrosoftIcon width={24} height={24} />
                    </View>
                    <Text className="text-secondary font-bold">Đăng nhập với Microsoft</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}>
                    <Text className="mt-4 text-text-secondary text-base font-semibold">Đăng nhập bằng tài khoản</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default WelcomeScreen; 