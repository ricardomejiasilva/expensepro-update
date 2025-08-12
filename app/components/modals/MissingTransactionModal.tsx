import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'contexts/FormContext';
import { useAppContext } from 'contexts/AppContext';
import { useOcrContext } from 'contexts/OcrContext';
import { type RootStackParamList } from 'models/types';
import { ReceiptStatus } from 'models/receiptStatus';
import StatusTag from 'components/StatusTag';
import Toast from 'components/Toast';
import TransactionModalMissingContent from './TransactionModalMissingContent';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
    Text,
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { FontFamily } from 'config/Fonts';
import Colors from 'config/Colors';
import AppLine from '../AppLine';
import CloseIcon from '../svg/CloseIcon';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface MissingTransactionModalProps {
    isModalVisible: boolean;
    setIsModalVisible: (visible: boolean) => void;
}

const MissingTransactionModal: React.FC<MissingTransactionModalProps> = ({
    isModalVisible,
    setIsModalVisible,
}) => {
    type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
    const navigation = useNavigation<NavigationProp>();

    const appContext = useAppContext();
    const ocrContext = useOcrContext();
    const formContext = useFormContext();
    const {
        selectedReceiptTransaction,
        clearSelectedReceiptTransaction,
        setAttachReceiptModalVisible,
    } = appContext;
    const { resetFormContext, setIsEditingReceiptDetails } = formContext;
    const { ocrState, resetOcrState } = ocrContext;
    const receiptStatus = selectedReceiptTransaction?.receiptStatus;

    const initialImage =
        ocrState.ocrImage && !ocrState.isSubmitting
            ? ocrState.ocrImage
            : selectedReceiptTransaction?.receipt?.filePath || null;
    const [image, setImage] = useState(initialImage);

    useEffect(() => {
        const newImage =
            ocrState.ocrImage && !ocrState.isSubmitting
                ? ocrState.ocrImage
                : selectedReceiptTransaction?.receipt?.filePath || null;
        setImage(newImage);
    }, [selectedReceiptTransaction, ocrState.ocrImage, ocrState.isSubmitting]);

    const handleClose = () => {
        if (ocrContext.ignoreResultRef) {
            ocrContext.ignoreResultRef.current = true;
            ocrContext.activeOcrIdRef.current = 0;
        }
        resetOcrState();
        resetFormContext();
        clearSelectedReceiptTransaction();
        setIsModalVisible(false);
        setIsEditingReceiptDetails(false);
        setImage(initialImage);
    };

    const handleAttach = () => {
        animateAndCloseModal(() => setAttachReceiptModalVisible(true));
    };

    if (!selectedReceiptTransaction) {
        // TODO: Handle this as an error, as this should not happen
        return null;
    }

    // Modal and Animations Below HERE
    const translateY = useSharedValue(height);
    const opacity = useSharedValue(0);
    const startY = useSharedValue(0);
    const hasAnimatedIn = useRef(false);
    const isMounted = useRef(true);

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

    const animateAndCloseModal = (onCloseComplete?: () => void) => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
            if (finished) {
                if (onCloseComplete) {
                    runOnJS(setIsModalVisible)(false);
                    runOnJS(onCloseComplete)();
                } else {
                    runOnJS(handleClose)();
                }
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
                    if (finished) runOnJS(handleClose)();
                });
            } else {
                translateY.value = withTiming(0, { duration: 250 });
            }
        });

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
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: Colors.blacktext,
                                        fontFamily: FontFamily.bold,
                                        fontSize: RFPercentage(1.9),
                                    }}
                                >
                                    Transaction Details
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                {selectedReceiptTransaction && (
                                    <StatusTag item={selectedReceiptTransaction} />
                                )}
                                <TouchableOpacity
                                    onPress={() => animateAndCloseModal()}
                                    style={{ marginLeft: 22, paddingRight: 8 }}
                                >
                                    <CloseIcon />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <AppLine />
                        <Toast />
                        {receiptStatus === ReceiptStatus.Missing && (
                            <TransactionModalMissingContent handleAttach={handleAttach} />
                        )}
                    </Reanimated.View>
                </GestureDetector>
            </Reanimated.View>
        </Modal>
    );
};

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
});

export default MissingTransactionModal;
