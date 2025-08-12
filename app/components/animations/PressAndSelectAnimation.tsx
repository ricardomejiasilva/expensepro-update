import Colors from 'config/Colors';
import React, { useEffect } from 'react';
import { Platform, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { TouchableWithoutFeedbackProps } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    AnimatedStyle,
    FadeInUp,
} from 'react-native-reanimated';

export interface PressAndSelectAnimationProps {
    id: number;
    children: React.ReactNode;
    onSelect: (id: number) => void;
    isSelected: boolean;
    wrapperStyle?: TouchableWithoutFeedbackProps['style'];
    style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}
const PressAndSelectAnimation: React.FC<PressAndSelectAnimationProps> = ({
    id,
    children,
    onSelect,
    isSelected,
    wrapperStyle,
    style,
}) => {
    const scale = useSharedValue(1);
    const borderColor = useSharedValue(Colors.lightWhite);
    const overlayOpacity = useSharedValue(0);
    const overlayRight = useSharedValue(500);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: borderColor.value,
        backgroundColor: Colors.lightgray,
        ...(Platform.OS === 'ios' && {
            shadowColor: '#000000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 2,
        }),
        ...(Platform.OS === 'android' && {
            elevation: 0,
        }),
    }));

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

    const handlePressIn = () => {
        scale.value = withTiming(0.96, { duration: 200 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = (id: number) => {
        onSelect(id);
    };

    useEffect(() => {
        if (isSelected) {
            scale.value = withTiming(1, { duration: 100 });
            borderColor.value = withTiming(Colors.primary, { duration: 200 });
            overlayOpacity.value = withTiming(1, { duration: 200 });
            overlayRight.value = withTiming(0, { duration: 400 });
        } else {
            scale.value = withTiming(1, { duration: 100 });
            borderColor.value = withTiming(Colors.lightWhite, { duration: 0 });
            overlayOpacity.value = withTiming(0, { duration: 200 });
            overlayRight.value = withTiming(500, { duration: 200 });
        }
    }, [isSelected]);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => handlePress(id)}
            style={[wrapperStyle, { backgroundColor: Colors.lightgray, overflow: 'hidden' }]}
        >
            <Animated.View style={animatedBackgroundStyle}></Animated.View>
            <Animated.View
                style={[
                    style,
                    animatedStyle,
                    {
                        borderWidth: 1,
                    },
                ]}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default PressAndSelectAnimation;
