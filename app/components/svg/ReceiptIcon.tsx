import React, { useCallback } from 'react';
import { Path, Svg, G } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface TransactionIconProps {
    width?: number;
    height?: number;
    focused: boolean;
}

const ReceiptIcon = ({ width, height, focused }: TransactionIconProps) => {
    const fill = focused ? '#247060' : 'black';
    const backgroundOpacity = focused ? 0.2 : 0;

    const AnimatedPath = Animated.createAnimatedComponent(Path);

    const animationTranslateY = useSharedValue(0);

    useFocusEffect(
        useCallback(() => {
            // Animate up and out
            animationTranslateY.value = withTiming(
                -20,
                { duration: 300, easing: Easing.out(Easing.cubic) },
                (finished) => {
                    if (finished) {
                        // Animate back in from the bottom
                        animationTranslateY.value = withTiming(40, { duration: 0 }, () => {
                            animationTranslateY.value = withTiming(0, {
                                duration: 300,
                                easing: Easing.out(Easing.cubic),
                            });
                        });
                    }
                }
            );
        }, [])
    );

    const animatedProps = useAnimatedProps(() => {
        return {
            transform: [{ translateY: animationTranslateY.value }],
        };
    });

    return (
        <Svg width={width} height={height} viewBox="0 0 24 25" fill="none">
            <G id="receipt" stroke="none" fill="none" fill-rule="evenodd" stroke-width="1">
                <G id="receipt-outlined">
                    <Path
                        d="M1,22 L1,3.95 C1,3.69804 1.09658,3.45641 1.26849,3.27825 C1.44039,3.10009 1.67355,3 1.91667,3 L22.0833,3 C22.3264,3 22.5596,3.10009 22.7315,3.27825 C22.9034,3.45641 23,3.69804 23,3.95 L23,22 L19.3333,20.1 L15.6667,22 L12,20.1 L8.33333,22 L4.66667,20.1 L1,22 Z"
                        id="background"
                        fill={fill}
                        fill-rule="nonzero"
                        opacity={backgroundOpacity}
                    />
                    <AnimatedPath
                        animatedProps={animatedProps}
                        d="M6.04167,10.3 L17.9583,10.3 M6.04167,13.9 L17.9583,13.9"
                        id="lines"
                        stroke={fill}
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <Path
                        d="M1,22 L1,4.9 C1,4.66131 1.09658,4.43239 1.26849,4.2636 C1.44039,4.09482 1.67355,4 1.91667,4 L22.0833,4 C22.3264,4 22.5596,4.09482 22.7315,4.2636 C22.9034,4.43239 23,4.66131 23,4.9 L23,22 L19.3333,20.2 L15.6667,22 L12,20.2 L8.33333,22 L4.66667,20.2 L1,22 Z"
                        id="outline"
                        stroke={fill}
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </G>
            </G>
        </Svg>
    );
};

export default ReceiptIcon;
