import { Platform, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHeaderHeight = () => {
    const insets = useSafeAreaInsets();

    // Chiều cao cơ bản của header
    const BASE_HEADER_HEIGHT = 56;

    // Tính toán chiều cao header dựa trên platform
    const getHeaderHeight = () => {
        if (Platform.OS === 'ios') {
            return BASE_HEADER_HEIGHT + insets.top;
        }

        // Với Android, chúng ta cần xem xét StatusBar height
        const statusBarHeight = StatusBar.currentHeight || 0;
        return BASE_HEADER_HEIGHT + statusBarHeight;
    };

    // Tính toán padding top an toàn
    const getSafeAreaPaddingTop = () => {
        if (Platform.OS === 'ios') {
            return insets.top;
        }
        return StatusBar.currentHeight || 0;
    };

    return {
        headerHeight: getHeaderHeight(),
        safeAreaPaddingTop: getSafeAreaPaddingTop(),
        statusBarHeight: StatusBar.currentHeight || 0,
        BASE_HEADER_HEIGHT
    };
}; 