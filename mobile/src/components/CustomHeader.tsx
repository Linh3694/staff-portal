import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar
} from 'react-native';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import { useNavigation } from '@react-navigation/native';

interface CustomHeaderProps {
    title: string;
    showBack?: boolean;
    rightComponent?: React.ReactNode;
    backgroundColor?: string;
    titleColor?: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
    title,
    showBack = true,
    rightComponent,
    backgroundColor = '#FFFFFF',
    titleColor = '#000000'
}) => {
    const navigation = useNavigation();
    const { headerHeight, safeAreaPaddingTop, BASE_HEADER_HEIGHT } = useHeaderHeight();

    return (
        <View style={[
            styles.container,
            {
                height: headerHeight,
                backgroundColor: backgroundColor,
                paddingTop: safeAreaPaddingTop
            }
        ]}>
            <StatusBar
                backgroundColor={backgroundColor}
                barStyle={backgroundColor === '#FFFFFF' ? 'dark-content' : 'light-content'}
            />
            <View style={[styles.content, { height: BASE_HEADER_HEIGHT }]}>
                {showBack && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={{ fontSize: 24, color: titleColor }}>+</Text>
                    </TouchableOpacity>
                )}

                <Text
                    style={[
                        styles.title,
                        { color: titleColor },
                        showBack ? styles.titleWithBack : styles.titleWithoutBack
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Text>

                <View style={styles.rightComponent}>
                    {rightComponent}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    titleWithBack: {
        marginLeft: 32,
    },
    titleWithoutBack: {
        marginLeft: 8,
    },
    rightComponent: {
        marginLeft: 'auto',
    }
}); 