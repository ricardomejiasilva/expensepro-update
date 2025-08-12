import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { FontFamily } from 'config/Fonts';
import Colors from 'config/Colors';

type TabBarIconProps = {
    name: string;
    icon: React.ReactNode;
    focused: boolean;
};

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, icon }) => {
    const iconOffset = useSharedValue(0);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: iconOffset.value }],
    }));

    return (
        <View
            style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Animated.View
                style={[
                    iconStyle,
                    {
                        width: 24,
                        height: 24,
                    },
                ]}
            >
                {icon}
            </Animated.View>
            <Text
                style={[
                    styles.text,
                    {
                        color: focused ? Colors.green : Colors.darkgray,
                    },
                ]}
            >
                {name}
            </Text>
            <View
                style={[
                    styles.transactionLine,
                    {
                        opacity: focused ? 1 : 0,
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        marginTop: 2,
    },
    text: {
        marginBottom: RFPercentage(0.4),
        marginTop: RFPercentage(0.6),
        fontFamily: FontFamily.light,
        fontSize: RFPercentage(1.4),
    },
    transactionLine: {
        width: RFPercentage(8.6),
        height: RFPercentage(0.2),
        backgroundColor: Colors.green,
        borderRadius: RFPercentage(1),
    },
});

export default TabBarIcon;
