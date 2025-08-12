import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { FontFamily } from 'config/Fonts';
import Colors from 'config/Colors';
import { Notification } from 'models/types';
import CheckMark from './svg/CheckMark';
import CreditCard from './svg/CreditCard';
import PressAnimation from './animations/PressAnimation';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface NotificationCardProps {
    item: Notification;
    index: number;
    onPress: () => void;
    handlePress: (index: number) => void;
    lastFourDigits: string;
}

const getTitleFromType = (type: number): string => {
    switch (type) {
        case 3:
            return 'Expand on Description';
        case 2:
            return 'Improve Receipt Image';
        case 1:
            return 'Reminder to Upload Receipt';
        default:
            return 'Unknown Notification';
    }
};

const NotificationCard = ({
    item,
    index,
    onPress,
    handlePress,
    lastFourDigits,
}: NotificationCardProps) => {
    const styles = StyleSheet.create({
        content: {
            width: '100%',
            borderWidth: RFPercentage(0.1),
            borderRadius: RFPercentage(1),
            borderLeftWidth: item.isRead ? 1 : 8,
            backgroundColor: Colors.white,
            marginVertical: 4,
        },
        layout: {
            paddingLeft: !!item.isRead ? 16 : 9,
            padding: 16,
            paddingVertical: RFPercentage(1.8),
            alignItems: 'center',
            flexDirection: 'row',
        },
        checkboxContainer: {
            width: RFPercentage(2),
            height: RFPercentage(2),
            borderRadius: RFPercentage(0.3),
            borderWidth: RFPercentage(0.1),
            borderColor: Colors.gray,
            backgroundColor: item.isSelected ? Colors.green : Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
        },
        description: {
            marginTop: RFPercentage(0.5),
            color: Colors.notificationText,
            fontFamily: FontFamily.regular,
            fontSize: RFPercentage(1.4),
        },
    });

    const title = getTitleFromType(item.type);

    const borderColor = useSharedValue(Colors.lightWhite);
    const overlayOpacity = useSharedValue(0);
    const overlayRight = useSharedValue(500);

    const animatedStyle = useAnimatedStyle(() => {
        if (!item.isRead) {
            return {
                borderTopColor: Colors.lightWhite,
                borderRightColor: Colors.lightWhite,
                borderBottomColor: Colors.lightWhite,
                borderLeftColor: Colors.primary,
            };
        } else {
            return {
                borderTopColor: Colors.lightWhite,
                borderRightColor: Colors.lightWhite,
                borderBottomColor: Colors.lightWhite,
                borderLeftColor: Colors.lightWhite,
            };
        }
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        height: '100%',
        width: '100%',
        position: 'absolute',
        opacity: overlayOpacity.value,
        top: 0,
        right: overlayRight.value,
        backgroundColor: Colors.primaryLight,
        overflow: 'hidden',
        borderRadius: 8,
    }));

    useEffect(() => {
        if (item.isSelected) {
            borderColor.value = withTiming(Colors.green, { duration: 200 });
            overlayOpacity.value = withTiming(1, { duration: 200 });
            overlayRight.value = withTiming(0, { duration: 400 });
        } else {
            borderColor.value = withTiming(Colors.lightWhite, { duration: 0 });
            overlayOpacity.value = withTiming(0, { duration: 200 });
            overlayRight.value = withTiming(500, { duration: 200 });
        }
    }, [item]);

    return (
        <PressAnimation onPress={onPress} style={[styles.content, animatedStyle]}>
            <Animated.View style={animatedBackgroundStyle}></Animated.View>
            <View style={styles.layout}>
                <TouchableOpacity
                    onPress={() => handlePress(index)}
                    activeOpacity={0.7}
                    style={[styles.checkboxContainer]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {item.isSelected && <CheckMark />}
                </TouchableOpacity>

                <View
                    style={{
                        marginLeft: RFPercentage(1.6),
                        width: '90%',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text
                            style={{
                                color: '#262626',
                                fontFamily: FontFamily.bold,
                                fontSize: RFPercentage(1.4),
                                flex: 1,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: RFPercentage(2),
                            }}
                        >
                            <CreditCard />
                            <Text
                                style={{
                                    color: Colors.darkgray,
                                    fontFamily: FontFamily.medium,
                                    fontSize: RFPercentage(1.4),
                                    marginLeft: RFPercentage(0.5), // Space between icon and text
                                }}
                            >
                                {lastFourDigits}
                            </Text>
                        </View>
                    </View>

                    {item.message && <Text style={styles.description}>{item.message}</Text>}
                </View>
            </View>
        </PressAnimation>
    );
};

export default NotificationCard;
