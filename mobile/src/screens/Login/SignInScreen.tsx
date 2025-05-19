import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography } from '../../theme/typography';
import { useMicrosoftLogin } from './useMicrosoftLogin';
import MicrosoftIcon from '../../assets/microsoft.svg';
import VisibilityIcon from '../../assets/visibility.svg';
import WarningIcon from '../../assets/warning.svg';
import { ROUTES } from '../../constants/routes';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';

const schema = yup.object().shape({
    email: yup.string().required('Email là bắt buộc').email('Email không hợp lệ'),
    password: yup.string().required('Mật khẩu là bắt buộc'),
});

const SignInScreen = () => {
    const navigation = useNavigation();
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const { request, promptAsync } = useMicrosoftLogin((token) => {
        // Lưu token, chuyển màn hình, v.v.
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        setLoginError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, password: data.password })
            });
            const resData = await response.json();

            if (!response.ok) {
                setLoginError(resData.message || 'Đăng nhập thất bại');
                console.error('Lỗi đăng nhập:', resData.message);
            } else {
                try {
                    // Xử lý thông tin người dùng
                    let userId = '';
                    let userFullname = '';
                    let userRole = 'user';

                    if (resData.user) {
                        // Xử lý thông tin người dùng
                        const user = resData.user;
                        // Xử lý ID
                        userId = user._id || user.id || `user_${Date.now()}`;
                        // Xử lý tên hiển thị
                        userFullname = user.fullname || user.name || user.username || data.email.split('@')[0];
                        // Xử lý vai trò
                        userRole = user.role || 'user';
                        console.log('Thông tin vai trò người dùng sau khi đăng nhập:', userRole);

                        const completeUser = {
                            ...user,
                            _id: userId,
                            fullname: userFullname,
                            role: userRole
                        };

                        // Sử dụng context để đăng nhập
                        await login(resData.token, completeUser);
                    } else {
                        // Tạo thông tin người dùng mặc định nếu không có
                        userId = `user_${Date.now()}`;
                        userFullname = data.email.split('@')[0];

                        const defaultUser = {
                            _id: userId,
                            fullname: userFullname,
                            email: data.email,
                            role: 'user'
                        };

                        await AsyncStorage.setItem('user', JSON.stringify(defaultUser));
                        console.warn('Không có thông tin user từ API, đã tạo thông tin mặc định');
                    }

                    // Chuyển đến màn hình chính
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main', params: { screen: ROUTES.MAIN.HOME } }],
                    });
                } catch (storageError) {
                    console.error('Lỗi khi lưu thông tin đăng nhập:', storageError);
                    setLoginError('Đã xảy ra lỗi khi xử lý thông tin đăng nhập');
                }
            }
        } catch (err) {
            console.error('Lỗi đăng nhập:', err);
            setLoginError('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white items-center">
            <View className="w-full mt-[15%] p-5">
                {/* Logo và tiêu đề */}
                <Image
                    source={require('../../assets/wellspring-logo.png')}
                    className="w-[30%] h-16 mb-6"
                    resizeMode="cover"
                />
                <Text className="font-bold text-xl text-primary self-start">Đăng nhập</Text>
                {/* Email */}
                <Text className="self-start mt-6 text-primary font-medium">Tên đăng nhập <Text className="text-error">*</Text></Text>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className="w-full h-12 border border-[#ddd]  font-medium rounded-xl px-3 mt-2 bg-white"
                            placeholder="example@wellspring.edu.vn"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.email && <Text className="text-error self-start ml-2">{errors.email.message}</Text>}
                {/* Password */}
                <Text className="self-start mt-4 text-primary  font-medium">Mật khẩu <Text className="text-error">*</Text></Text>
                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View className="relative w-full">
                            <TextInput
                                className={`w-full h-12 border font-medium rounded-xl px-3 mt-2 bg-white pr-12 ${loginError ? 'border-error' : 'border-[#ddd]'}`}
                                placeholder="Nhập mật khẩu"
                                secureTextEntry={!showPassword}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            <Pressable
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '60%',
                                    transform: [{ translateY: -12 }],
                                    zIndex: 10,
                                }}
                                onPress={() => setShowPassword((prev) => !prev)}
                                hitSlop={8}
                            >
                                <VisibilityIcon width={24} height={24} />
                            </Pressable>
                        </View>
                    )}
                />
                {errors.password && <Text className="text-error self-start ml-2">{errors.password.message}</Text>}
                {/* Hiển thị lỗi đăng nhập */}
                {loginError ? (
                    <View className="flex-row items-center mt-2">
                        <WarningIcon width={20} height={20} style={{ marginRight: 6 }} />
                        <Text className="text-error text-base font-semibold">Tài khoản hoặc mật khẩu không chính xác</Text>
                    </View>
                ) : null}
                {/* Nút đăng nhập */}
                <TouchableOpacity
                    className="w-full bg-secondary rounded-full py-3 items-center mt-6"
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-base">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
                </TouchableOpacity>
                {/* Quên mật khẩu */}
                <TouchableOpacity className="w-full items-center mt-4">
                    <Text className="text-text-secondary  font-medium text-base">Quên mật khẩu?</Text>
                </TouchableOpacity>
                {/* Phân cách */}
                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-[#E0E0E0]" />
                    <Text className="mx-2 text-text-secondary  font-medium text-sm">Đăng nhập với phương thức khác</Text>
                    <View className="flex-1 h-px bg-[#E0E0E0]" />
                </View>
                {/* Nút đăng nhập Microsoft */}
                <TouchableOpacity
                    className="w-full flex-row items-center justify-center rounded-full bg-secondary/10 py-3 mb-2"
                    disabled={!request}
                    onPress={() => promptAsync()}
                >
                    <View style={{ marginRight: 8 }}>
                        <MicrosoftIcon width={20} height={20} />
                    </View>
                    <Text className="text-secondary font-bold text-base">Đăng nhập với Microsoft</Text>
                </TouchableOpacity>
            </View>
            <View className="absolute bottom-12 w-full items-center mt-4">
                <Text className="text-text-secondary  font-medium text-xs text-center mt-8">
                    © Copyright 2025 Wellspring International Bilingual Schools.{"\n"}All Rights Reserved.
                </Text>
            </View>
        </View>
    );
};

export default SignInScreen; 