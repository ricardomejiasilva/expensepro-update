import React, { useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    AnimatedScrollViewProps,
} from 'react-native-reanimated';

interface DisappearingScrollViewProps extends AnimatedScrollViewProps {
    children: React.ReactNode[];
}

interface AnimatedChildProps {
    index: number;
    child: React.ReactNode;
    scrollY: Animated.SharedValue<number>;
    layoutY: number[];
    onLayout: (index: number, y: number) => void;
}

const AnimatedChild: React.FC<AnimatedChildProps> = ({
    index,
    child,
    scrollY,
    layoutY,
    onLayout,
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        const childLayoutY = layoutY[index] || 0;
        const scale = interpolate(
            scrollY.value,
            [childLayoutY - 100, childLayoutY, childLayoutY + 100],
            [1, 1, 0],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [childLayoutY - 100, childLayoutY, childLayoutY + 100],
            [1, 1, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[styles.childView, animatedStyle]}
            onLayout={(event) => onLayout(index, event.nativeEvent.layout.y)}
        >
            {child}
        </Animated.View>
    );
};

const DisappearingScrollView = forwardRef<Animated.ScrollView, DisappearingScrollViewProps>(
    ({ children, style, ...rest }, ref) => {
        const scrollY = useSharedValue(0);
        const layoutYRef = useRef<number[]>([]);
        const [layoutY, setLayoutY] = useState<number[]>([]);

        const scrollHandler = useAnimatedScrollHandler((event) => {
            scrollY.value = event.contentOffset.y;
        });

        const handleLayout = useCallback((index: number, y: number) => {
            layoutYRef.current[index] = y;
            setLayoutY([...layoutYRef.current]);
        }, []);

        return (
            <Animated.ScrollView
                ref={ref}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                scrollEnabled={true}
                style={[styles.container, style]}
                {...rest}
            >
                {children.map((child: React.ReactNode, index: number) => (
                    <AnimatedChild
                        key={index}
                        index={index}
                        child={child}
                        scrollY={scrollY}
                        layoutY={layoutY}
                        onLayout={handleLayout}
                    />
                ))}
            </Animated.ScrollView>
        );
    }
);

export default DisappearingScrollView;

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    childView: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
