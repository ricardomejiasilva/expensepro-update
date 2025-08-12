import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleProp, ViewStyle } from 'react-native';
import { Path, Svg, G } from 'react-native-svg';
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
    style?: StyleProp<ViewStyle>;
}

const TransactionIcon = ({ width, height, focused, style }: TransactionIconProps) => {
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
        <Svg width={focused ? 24 : 23} height={focused ? 25 : 24} viewBox="0 0 26 27" fill="none">
            <G id="dollar" stroke="none" fill="none" fill-rule="evenodd" stroke-width="1">
                <G id="dollar-circled">
                    <Path
                        d="M12,23.5384615 C18.1176,23.5384615 23.0769231,18.5791385 23.0769231,12.4615385 C23.0769231,6.34392 18.1176,1.38461538 12,1.38461538 C5.88238154,1.38461538 0.923076923,6.34392 0.923076923,12.4615385 C0.923076923,18.5791385 5.88238154,23.5384615 12,23.5384615 Z"
                        id="background"
                        fill={fill}
                        opacity={backgroundOpacity}
                    />
                    <AnimatedPath
                        animatedProps={animatedProps}
                        d="M12,6 L12,7.84615385 M12,17.0769231 L12,18.9230769 M9.23076923,17.0769231 L13.3846154,17.0769231 C13.9966154,17.0769231 14.5836,16.8337846 15.0164308,16.4010462 C15.4491692,15.9682154 15.6923077,15.3812308 15.6923077,14.7692308 C15.6923077,14.1572308 15.4491692,13.5702462 15.0164308,13.1374154 C14.5836,12.7046769 13.9966154,12.4615385 13.3846154,12.4615385 L10.6153846,12.4615385 C10.0033846,12.4615385 9.4164,12.2184 8.98359692,11.7856615 C8.55082154,11.3528308 8.30769231,10.7658462 8.30769231,10.1538462 C8.30769231,9.54184615 8.55082154,8.95483385 8.98359692,8.52205846 C9.4164,8.08928308 10.0033846,7.84615385 10.6153846,7.84615385 L14.7692308,7.84615385"
                        id="dollar"
                        stroke={fill}
                        stroke-width="0.923076923"
                    />
                    <Path
                        d="M23.0769231,12.4615385 C23.0769231,18.5791385 18.1176,23.5384615 12,23.5384615 C5.88238154,23.5384615 0.923076923,18.5791385 0.923076923,12.4615385 C0.923076923,6.34392 5.88238154,1.38461538 12,1.38461538 C18.1176,1.38461538 23.0769231,6.34392 23.0769231,12.4615385 Z"
                        id="circle"
                        stroke={fill}
                        stroke-width="0.923076923"
                    />
                </G>
            </G>
        </Svg>
    );
};
export default TransactionIcon;
