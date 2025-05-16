import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Alert,
    TextInput,
    TouchableOpacity,
    Platform,
    ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../../../config/constants';

interface TicketProcessingProps {
    ticketId: string;
    onRefresh: () => void;
}

interface SubTask {
    _id: string;
    status: string;
}

interface Ticket {
    _id: string;
    status: string;
    cancelReason?: string;
    subTasks: SubTask[];
}

const TicketProcessing: React.FC<TicketProcessingProps> = ({
    ticketId,
    onRefresh,
}) => {
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [ticketStatus, setTicketStatus] = useState<string>('Processing');
    const [subTasks, setSubTasks] = useState<SubTask[]>([]);
    const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    /* -------------------------------------------------------------------------- */
    /*                               FETCH DETAILS                                */
    /* -------------------------------------------------------------------------- */
    useEffect(() => {
        fetchTicketDetails();
    }, [ticketId]);

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const res = await axios.get(`${API_BASE_URL}/api/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data: Ticket =
                res.data.success && res.data.ticket ? res.data.ticket : res.data;
            setTicket(data);
            setTicketStatus(normalizeStatus(data.status));
            setSubTasks(data.subTasks || []);
        } catch (err) {
            console.error('Lỗi khi lấy ticket:', err);
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                            STATUS UPDATE HANDLER                           */
    /* -------------------------------------------------------------------------- */
    const handleUpdateStatus = async (newStatus: string) => {
        // 1) Block Processing -> Done when any subTask still In Progress
        if (
            ticketStatus === 'Processing' &&
            newStatus === 'Done' &&
            subTasks.some((t) => t.status === 'In Progress')
        ) {
            Alert.alert(
                'Thông báo',
                'Bạn cần xử lý hết các công việc con trước khi hoàn thành ticket.',
            );
            return;
        }

        // 2) Show cancel reason box
        if (newStatus === 'Cancelled') {
            setShowCancelReasonInput(true);
            return;
        }

        await updateStatusAPI(newStatus);
    };

    const updateStatusAPI = async (status: string, reason = '') => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const payload: any = { status };
            if (status === 'Cancelled' && reason) payload.cancelReason = reason;

            const res = await axios.put(
                `${API_BASE_URL}/api/tickets/${ticketId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (res.data.success) {
                Alert.alert('Thành công', 'Cập nhật trạng thái thành công!');
                setTicketStatus(status);
                onRefresh();
                fetchTicketDetails();
            } else {
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
            }
        } catch (err) {
            console.error('Lỗi cập nhật trạng thái:', err);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                          CANCEL TICKET CONFIRMATION                        */
    /* -------------------------------------------------------------------------- */
    const confirmCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập lý do huỷ.');
            return;
        }
        await updateStatusAPI('Cancelled', cancelReason.trim());
        setCancelReason('');
        setShowCancelReasonInput(false);
    };

    /* -------------------------------------------------------------------------- */
    /*                           HELPER – LABEL & COLOR                           */
    /* -------------------------------------------------------------------------- */
    const normalizeStatus = (status = '') => {
        const lower = status.toLowerCase();
        if (lower === 'processing' || lower === 'in progress') return 'Processing';
        if (lower === 'done' || lower === 'completed') return 'Done';
        if (lower === 'cancelled') return 'Cancelled';
        return status;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Processing':
                return 'Đang xử lý';
            case 'Done':
                return 'Hoàn thành';
            case 'Cancelled':
                return 'Đã huỷ';
            default:
                return status;
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                                   RENDER                                   */
    /* -------------------------------------------------------------------------- */
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#002855" />
            </View>
        );
    }

    const statusOptions = ['Processing', 'Done', 'Cancelled'];

    return (
        <ScrollView className="flex-1 bg-white p-4">
            {/* STATUS BAR */}
            <View className="flex-row items-center mb-4">
                <Text className="font-semibold text-base mr-2">Trạng thái:</Text>
                <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
                    {Platform.OS === 'ios' ? (
                        <Picker
                            selectedValue={ticketStatus}
                            onValueChange={(value) =>
                                value !== ticketStatus && handleUpdateStatus(value)
                            }
                            style={{ height: 45 }}>
                            {statusOptions.map((s) => (
                                <Picker.Item key={s} label={getStatusLabel(s)} value={s} />
                            ))}
                        </Picker>
                    ) : (
                        <View className="bg-gray-100 rounded-lg px-2">
                            <Picker
                                selectedValue={ticketStatus}
                                onValueChange={(value) =>
                                    value !== ticketStatus && handleUpdateStatus(value)
                                }
                                style={{ height: 45 }}>
                                {statusOptions.map((s) => (
                                    <Picker.Item key={s} label={getStatusLabel(s)} value={s} />
                                ))}
                            </Picker>
                        </View>
                    )}
                </View>
            </View>

            {/* CANCEL REASON INPUT */}
            {showCancelReasonInput && (
                <View className="bg-gray-100 p-4 rounded-lg">
                    <Text className="font-medium mb-2">Lý do huỷ ticket:</Text>
                    <TextInput
                        value={cancelReason}
                        onChangeText={setCancelReason}
                        placeholder="Nhập lý do huỷ..."
                        className="bg-white p-3 rounded-lg mb-2"
                        multiline
                    />
                    <View className="flex-row justify-end">
                        <TouchableOpacity
                            onPress={() => {
                                setCancelReason('');
                                setShowCancelReasonInput(false);
                            }}
                            className="bg-gray-300 px-4 py-2 rounded-lg mr-2">
                            <Text className="font-medium">Huỷ bỏ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={confirmCancel}
                            className="bg-red-500 px-4 py-2 rounded-lg">
                            <Text className="font-medium text-white">Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* HIỂN THỊ LÝ DO HUỶ (NẾU CÓ) */}
            {ticketStatus === 'Cancelled' && ticket?.cancelReason && (
                <View className="bg-red-100 p-4 rounded-lg mt-4">
                    <Text className="font-bold text-red-600">Lý do huỷ ticket:</Text>
                    <Text className="text-red-600">{ticket.cancelReason}</Text>
                </View>
            )}
        </ScrollView>
    );
};

export default TicketProcessing;