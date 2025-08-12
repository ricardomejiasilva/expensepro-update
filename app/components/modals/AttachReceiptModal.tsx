import React, { useState, useEffect, useRef } from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
    Text,
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { FontFamily } from 'config/Fonts';
import { useNavigation } from '@react-navigation/native';
import { handleUploadSelection } from '../../utils/uploadUtils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'models/types';
import Colors from 'config/Colors';
import AppLine from '../AppLine';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import CloseIcon from '../svg/CloseIcon';
import { useAppContext } from 'contexts/AppContext';
import { handleAttachReceipt } from 'utils/appContextUtils';
import Toast from 'components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from 'contexts/ToastContext';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AttachReceiptModalProps {
    isModalVisible: boolean;
    setIsModalVisible: (visible: boolean) => void;
}

const AttachReceiptModal = ({ isModalVisible, setIsModalVisible }: AttachReceiptModalProps) => {
    const translateY = useSharedValue(height);
    const opacity = useSharedValue(0);
    const startY = useSharedValue(0);
    const hasAnimatedIn = useRef(false);
    const isMounted = useRef(true);

    const {
        shortForm,
        pCardReceipts,
        selectedReceiptTransaction,
        setIsUploadModalVisible,
        setIsAttachingReceipt,
        setIsPreviouslySubmittedReceiptsModalVisible,
    } = useAppContext();
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!isModalVisible) {
            hasAnimatedIn.current = false;
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(height, { duration: 300 });
        }
    }, [isModalVisible]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const closeModalAnimated = () => {
        setIsModalVisible(false);
    };

    const animateAndCloseModal = (onCloseComplete?: () => void) => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
            if (finished) {
                runOnJS(closeModalAnimated)();
                if (onCloseComplete) runOnJS(onCloseComplete)();
            }
        });
    };

    const gesture = Gesture.Pan()
        .onStart(() => {
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            translateY.value = Math.max(0, startY.value + event.translationY);
        })
        .onEnd((event) => {
            const shouldClose = event.translationY > 100 || event.velocityY > 800;
            if (shouldClose) {
                opacity.value = withTiming(0, { duration: 200 });
                translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                    if (finished) runOnJS(closeModal)();
                });
            } else {
                translateY.value = withTiming(0, { duration: 250 });
            }
        });

    const closeAndOpenUploadModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setIsAttachingReceipt(true);
            setIsUploadModalVisible(true);
        }, 50);
    };

    const handlePrimaryPress = async () => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
            if (finished) {
                runOnJS(closeAndOpenUploadModal)();
            }
        });
    };

    const closeAndOpenPreviouslySubmittedReceiptsModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setIsAttachingReceipt(true);
            setIsPreviouslySubmittedReceiptsModalVisible(true);
        }, 50);
    };

    const handleSecondaryPress = () => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
            if (finished) {
                runOnJS(closeAndOpenPreviouslySubmittedReceiptsModal)();
            }
        });
    };

    const handleContinueWithoutReceipt = async () => {
        handleUploadSelection(
            null,
            setIsUploadModalVisible,
            navigation,
            shortForm,
            null,
            true,
            () => {
                setIsModalVisible(false);
            }
        );
        setIsModalVisible(false);
        await AsyncStorage.setItem('isAttachingReceipt', 'true');
    };

    const submittedReceipts = pCardReceipts.filter((item) => !item.transaction);
    const emptyReceipts = submittedReceipts.length === 0;

    const truncateTitle = (title: string) =>
        title.length > 15 ? title.substring(0, 15) + '...' : title;

    return (
        <Modal visible={isModalVisible} transparent animationType="none">
            <Toast />
            <Reanimated.View style={[styles.container, animatedContainerStyle]}>
                <GestureDetector gesture={gesture}>
                    <Reanimated.View
                        style={[styles.content, animatedContentStyle]}
                        onLayout={() => {
                            if (isModalVisible && !hasAnimatedIn.current) {
                                hasAnimatedIn.current = true;
                                opacity.value = withTiming(1, { duration: 350 });
                                translateY.value = withTiming(0, { duration: 400 });
                            }
                        }}
                    >
                        <View style={styles.modalLine} />
                        <View style={styles.header}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={{
                                        color: Colors.blacktext,
                                        fontFamily: FontFamily.bold,
                                        fontSize: RFPercentage(1.9),
                                    }}
                                >
                                    Attach Receipt -{' '}
                                </Text>
                                <Text
                                    style={{
                                        color: Colors.textGray,
                                        fontFamily: FontFamily.regular,
                                        fontSize: RFPercentage(1.9),
                                    }}
                                >
                                    {truncateTitle(selectedReceiptTransaction?.supplier ?? '')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => animateAndCloseModal()}
                                style={{ paddingRight: 8 }}
                            >
                                <CloseIcon />
                            </TouchableOpacity>
                        </View>

                        <AppLine />

                        <View style={{ width: '92%' }}>
                            <PrimaryButton
                                text={'New Receipt'}
                                onPress={handlePrimaryPress}
                                containerStyle={styles.loginbutton}
                            />
                            <SecondaryButton
                                text={'Previously Submitted Receipt'}
                                containerStyle={styles.loginbutton}
                                onPress={handleSecondaryPress}
                            />
                        </View>

                        <TouchableOpacity
                            style={{
                                width: '100%',
                                alignItems: 'center',
                                marginTop: RFPercentage(2.2),
                            }}
                            onPress={handleContinueWithoutReceipt}
                        >
                            <Text style={{ color: Colors.link, fontSize: RFPercentage(1.9) }}>
                                Continue without receipt image
                            </Text>
                        </TouchableOpacity>
                    </Reanimated.View>
                </GestureDetector>
            </Reanimated.View>
        </Modal>
    );
};

export default AttachReceiptModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingVertical: RFPercentage(1),
        paddingBottom: Platform.OS === 'ios' ? RFPercentage(5) : RFPercentage(1.9),
        alignItems: 'center',
    },
    modalLine: {
        borderRadius: 2,
        width: 74,
        height: 3,
        backgroundColor: Colors.uploadGray,
        marginTop: RFPercentage(0.2),
        marginBottom: RFPercentage(0.4),
    },
    header: {
        width: '92%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: RFPercentage(1),
        marginBottom: RFPercentage(1.9),
    },
    loginbutton: {
        marginTop: RFPercentage(1.2),
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
