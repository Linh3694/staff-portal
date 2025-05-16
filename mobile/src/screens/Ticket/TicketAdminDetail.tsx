import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TicketInformation from './components/TicketInformation';
import TicketProcessing from './components/TicketProcessing';
import TicketChat from './components/TicketChat';
import TicketHistory from './components/TicketHistory';

type TicketDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TicketAdminDetail'>;

interface RouteParams {
    ticketId: string;
}

interface Ticket {
    _id: string;
    ticketCode: string;
    title: string;
    status: string;
    feedback?: {
        rating: number;
        comment?: string;
        badges?: string[];
    };
}

const TicketAdminDetail = () => {
    const navigation = useNavigation<TicketDetailScreenNavigationProp>();
    const route = useRoute();
    const { ticketId } = route.params as RouteParams;
    const [activeTab, setActiveTab] = useState('information');
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTicketData();
    }, [ticketId]);

    const fetchTicketData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setTicket(response.data.ticket);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, index) => (
            <MaterialIcons
                key={index}
                name="star-border"
                size={24}
                color="#9CA3AF"
            />
        ));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'information':
                return (

                    <TicketInformation ticketId={ticketId} />

                );
            case 'processing':
                return (
                    <TicketProcessing ticketId={ticketId} />
                );
            case 'chat':
                return (
                    <TicketChat ticketId={ticketId} />
                );
            case 'history':
                return (
                    <TicketHistory ticketId={ticketId} />
                );
            default:
                return null;
        }
    };

    const statusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'assigned':
                return 'bg-[#002855]';
            case 'processing':
                return 'bg-[#F59E0B]';
            case 'done':
                return 'bg-[#BED232]';
            case 'closed':
                return 'bg-[#009483]';
            case 'cancelled':
                return 'bg-[#F05023]';
            default:
                return 'bg-gray-500';
        }
    };

    const statusLabel = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'assigned':
                return 'Đã tiếp nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'done':
                return 'Đã xử lý';
            case 'closed':
                return 'Đã đóng';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            {loading ? (
                <View className="p-4">
                    <ActivityIndicator size="large" color="#F05023" />
                </View>
            ) : ticket ? (
                <View className="bg-white">
                    <View className="w-full flex-row items-start justify-between px-4 py-4">
                        <Text className="text-black font-semibold text-lg">{ticket.ticketCode}</Text>

                        <TouchableOpacity onPress={handleGoBack}>
                            <AntDesign name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 mb-4">
                        <Text className="text-[#E84A37] font-semibold text-xl">{ticket.title}</Text>
                    </View>

                    <View className="flex-row justify-between items-center pr-[48%] pl-5 mb-6">
                        <View className="w-11 h-11 rounded-full bg-green-600 items-center justify-center">
                            <Ionicons name="checkmark" size={24} color="white" />
                        </View>

                        <View className="w-11 h-11 rounded-full bg-teal-600 items-center justify-center">
                            <FontAwesome5 name="sync-alt" size={16} color="white" />
                        </View>

                        <View className="w-11 h-11 rounded-full bg-yellow-500 items-center justify-center">
                            <FontAwesome5 name="pause" size={16} color="white" />
                        </View>

                        <View className="w-11 h-11 rounded-full bg-red-600 items-center justify-center">
                            <Ionicons name="square" size={16} color="white" />
                        </View>
                    </View>
                </View>
            ) : null}

            {/* Tab Navigation */}
            <View className="flex-row pl-5 ">
                <TouchableOpacity
                    onPress={() => setActiveTab('information')}
                    className={`py-3 mr-6 ${activeTab === 'information' ? 'border-b-2 border-black' : ''}`}
                >
                    <Text className={`${activeTab === 'information' ? 'text-[#002855] font-bold' : 'text-gray-400'}`}>
                        Thông tin
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('processing')}
                    className={`py-3 mr-6 ${activeTab === 'processing' ? 'border-b-2 border-black' : ''}`}
                >
                    <Text className={`${activeTab === 'processing' ? 'text-[#002855] font-bold' : 'text-gray-400'}`}>
                        Tiến trình
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('chat')}
                    className={`py-3 mr-6 ${activeTab === 'chat' ? 'border-b-2 border-black' : ''}`}
                >
                    <Text className={`${activeTab === 'chat' ? 'text-[#002855] font-bold' : 'text-gray-400'}`}>
                        Trao đổi
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    className={`py-3 ${activeTab === 'history' ? 'border-b-2 border-black' : ''}`}
                >
                    <Text className={`${activeTab === 'history' ? 'text-[#002855] font-bold' : 'text-gray-400'}`}>
                        Lịch sử
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

export default TicketAdminDetail; 