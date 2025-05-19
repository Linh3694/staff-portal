import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import TicketAdminScreen from '../Ticket/TicketAdminScreen';
import TicketGuestScreen from '../Ticket/TicketGuestScreen';

// Define type cho navigation
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [fullName, setFullName] = useState('');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setFullName(user.fullname || '');
                    setUserRole(user.role || '');
                }
            } catch (e) {
                setFullName('');
                setUserRole('');
            }
        };
        fetchUser();
    }, []);

    const navigateToTicket = async () => {
        try {
            console.log('HomeScreen navigateToTicket - State userRole:', userRole);
            // Kiểm tra từ AsyncStorage một cách cụ thể
            const storedRole = await AsyncStorage.getItem('userRole');
            console.log('HomeScreen navigateToTicket - AsyncStorage userRole:', storedRole);
            
            // Kiểm tra quyền người dùng trước
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const role = (user.role || '').toLowerCase().trim();
                console.log('HomeScreen - Current user role from user object:', role);
                
                if (role === 'user' || storedRole === 'user') {
                    console.log('Người dùng có vai trò USER -> điều hướng đến Ticket (Guest)');
                    navigation.navigate('Ticket');
                    return;
                }
                
                // Phân quyền: superadmin, admin, technical -> TicketAdminScreen
                if (['superadmin', 'admin', 'technical'].includes(role)) {
                    console.log('Điều hướng đến TicketAdminScreen vì người dùng có vai trò', role);
                    navigation.navigate('TicketAdminScreen');
                } else {
                    console.log('Điều hướng đến Ticket vì người dùng có vai trò không xác định:', role);
                    navigation.navigate('Ticket');
                }
            } else {
                // Không tìm thấy thông tin người dùng, điều hướng đến dạng guest
                console.log('Không tìm thấy thông tin người dùng, điều hướng đến Ticket');
                navigation.navigate('Ticket');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra quyền người dùng:', error);
            // Mặc định điều hướng đến dạng guest nếu có lỗi
            console.log('Xảy ra lỗi, điều hướng đến Ticket');
            navigation.navigate('Ticket');
        }
    };

    const menuItems = [
        { id: 1, title: 'Ticket', icon: 'ticket-alt', component: FontAwesome5, color: '#F9FBEB', onPress: navigateToTicket },
    ];

    // Gradient border container
    const GradientBorderContainer = ({ children }: { children: React.ReactNode }) => {
        return (
            <View style={styles.gradientBorderContainer}>
                <LinearGradient
                    colors={['#FFCE02', '#BED232']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBorder}
                />
                <View style={styles.innerContainer}>
                    {children}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView>
                <View className="w-full items-center mt-12">
                    <Text className="text-2xl text-primary font-medium mb-2 text-center">Xin chào WISer</Text>
                    <MaskedView
                        maskElement={
                            <Text className="text-4xl font-bold text-center" style={{ backgroundColor: 'transparent' }}>{fullName}</Text>
                        }
                    >
                        <LinearGradient
                            colors={["#F05023", "#F5AA1E"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text className="text-4xl font-bold opacity-0 text-center">{fullName}</Text>
                        </LinearGradient>
                    </MaskedView>

                    <View className="w-full mt-10 px-5">
                        <Text className="w-full text-lg font-medium text-gray-700 mb-3">Gợi ý</Text>
                        <GradientBorderContainer>
                            <View className="flex-row flex-wrap justify-between">
                                {menuItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        className="w-[30%] items-center my-5"
                                        onPress={item.onPress}
                                    >
                                        <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: `${item.color}` }}>
                                            <item.component name={item.icon} size={28} color={item.color} />
                                        </View>
                                        <Text className="text-sm text-center">{item.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GradientBorderContainer>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    gradientBorderContainer: {
        width: '100%',
        borderRadius: 16,
        position: 'relative',
        padding: 1, // This is the border width
    },
    gradientBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    },
    innerContainer: {
        backgroundColor: 'white',
        borderRadius: 15, // Slightly smaller to show gradient border
        padding: 10,
        width: '100%',
        overflow: 'hidden',
    }
});

export default HomeScreen;
