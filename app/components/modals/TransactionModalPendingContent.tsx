import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import Colors from 'config/Colors';

import { Notification, type IFormContext, type RootStackParamList } from 'models/types';

import AppLine from 'components/AppLine';
import TransactionDetails from 'components/TransactionDetails';
import PrimaryButton from 'components/PrimaryButton';
import SecondaryButton from 'components/SecondaryButton';
import MissingReceipt from 'components/MissingReceipt';
import EditableFormSection from 'components/EditableFormSection';
import AutofilledDetails from 'components/AutofilledDetails';
import Alert from 'components/Alert';
import ImageDisplay from 'components/ImageDisplay';
import AppLoadingWithOverlay from 'components/AppLoadingWithOverlay';
import MissingImageButton from 'components/MisssingImageButton';
import ImageUploader from 'components/ImageUploader';
import UploadModal from './UploadModal';
import { handleUploadSelection } from 'utils/uploadUtils';
import { useNotification } from 'contexts/NotificationContext';
import RequestAlert from 'components/RequestAlert';
import PendingAlert from 'components/PendingAlert';
import AnimatedButton from 'components/AnimatedButton';
import TertiaryButton from 'components/TertiaryButton';

interface TransactionModalPendingContentProps {
    handleCancel: () => void;
    handleEdit: () => void;
    handleEditCancel: () => void;
    handleSave: () => void;
    handleDetach?: () => void;
    isEditingReceiptDetails: boolean;
    formContext: IFormContext;
    image: string | null;
    setImage: (image: string | null) => void;
    shortForm: boolean;
    isUploadModalVisible: boolean;
    setIsUploadModalVisible: (visible: boolean) => void;
    navigation: NativeStackNavigationProp<RootStackParamList, 'TransactionModal'>;
    toggleCategoryEditModal: () => void;
    receiptStatus: number;
    selectedReceiptTransaction: any;
}

// Reusable ActionButtons component
interface ActionButtonsProps {
    isEditingReceiptDetails: boolean;
    handleSave: () => void;
    handleEdit: () => void;
    handleEditCancel: () => void;
    handleCancel: () => void;
    handleDetach?: () => void;
    containerStyle?: any;
    bottomSpacing?: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    isEditingReceiptDetails,
    handleSave,
    handleEdit,
    handleEditCancel,
    handleCancel,
    handleDetach,
    containerStyle,
    bottomSpacing = Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(0),
}) => {
    return (
        <View
            style={[
                {
                    width: '100%',
                    alignItems: 'center',
                    marginTop: RFPercentage(1.9),
                },
                containerStyle,
            ]}
        >
            <AppLine />
            <PrimaryButton
                text={isEditingReceiptDetails ? 'Save Changes' : 'Edit Receipt'}
                onPress={isEditingReceiptDetails ? handleSave : handleEdit}
                containerStyle={styles.button}
            />
            <SecondaryButton
                text="Cancel"
                containerStyle={styles.button}
                onPress={isEditingReceiptDetails ? handleEditCancel : handleCancel}
            />
            {handleDetach && (
                <TertiaryButton
                    text="Detach All & Close"
                    containerStyle={styles.button}
                    onPress={handleDetach}
                />
            )}
            <View
                style={{
                    height: bottomSpacing,
                }}
            />
        </View>
    );
};

const TransactionModalPendingContent: React.FC<TransactionModalPendingContentProps> = ({
    handleCancel,
    handleEdit,
    handleEditCancel,
    handleSave,
    handleDetach,
    isEditingReceiptDetails,
    formContext,
    shortForm,
    image,
    setImage,
    isUploadModalVisible,
    setIsUploadModalVisible,
    navigation,
    receiptStatus,
    selectedReceiptTransaction,
}) => {
    const [extraInput, setExtraInput] = useState(false);
    const [isJobCostInputFocused, setIsJobCostInputFocused] = useState(false);
    const [isMealCountFocused, setIsMealCountFocused] = useState(false);
    const [shouldRunOcrOnImageUpload, setShouldRunOcrOnImageUpload] = useState(false);
    const [hasImageBeenUploaded, setHasImageBeenUploaded] = useState(!!image);

    const { isPending, notifications } = useNotification();

    // Get notifications for current receipt transaction
    const receiptNotifications = notifications
        .filter((n: Notification) => n.receiptTransactionId === selectedReceiptTransaction?.id)
        .sort(
            (a: Notification, b: Notification) =>
                new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        )
        // Keep only the most recent notification of each type
        .filter(
            (notification: Notification, index: number, self: Notification[]) =>
                index === self.findIndex((n: Notification) => n.type === notification.type)
        );

    const isNotComplete = receiptStatus !== 3;

    // Reset OCR flag when image changes and OCR should run
    useEffect(() => {
        if (shouldRunOcrOnImageUpload && image) {
            setShouldRunOcrOnImageUpload(false);
        }
    }, [image, shouldRunOcrOnImageUpload]);

    // Track when an image has been uploaded
    useEffect(() => {
        if (image && !hasImageBeenUploaded) {
            setHasImageBeenUploaded(true);
        }
    }, [image, hasImageBeenUploaded]);

    const handleInputFocusChange = (inputType: string, isFocused: boolean) => {
        if (inputType === 'jobCost') {
            setIsJobCostInputFocused(isFocused);
        } else if (inputType === 'mealCount') {
            setIsMealCountFocused(isFocused);
        }
    };

    const getKeyboardOffset = () => {
        if (isJobCostInputFocused) {
            return RFPercentage(-60);
        } else if (isMealCountFocused) {
            return RFPercentage(-55);
        } else if (extraInput && formContext.errorMessage) {
            return RFPercentage(-55);
        } else if (extraInput && !formContext.errorMessage) {
            return RFPercentage(-48);
        } else {
            return RFPercentage(-40);
        }
    };

    const handleImageUpload = (newImage: string) => {
        setShouldRunOcrOnImageUpload(true);
        setImage(newImage);
    };

    const renderImageComponent = () => {
        if (isEditingReceiptDetails && (image || hasImageBeenUploaded)) {
            return (
                <ImageUploader
                    image={image}
                    setImage={(newImage) => setImage(newImage as string)}
                    updateTransactionDataWithOcrData={true}
                    runOcrOnMount={shouldRunOcrOnImageUpload}
                />
            );
        }

        if (!image && !hasImageBeenUploaded) {
            return isEditingReceiptDetails ? (
                <MissingImageButton onPress={() => setIsUploadModalVisible(true)} />
            ) : (
                <MissingReceipt />
            );
        }

        return <ImageDisplay image={image} />;
    };

    return (
        <>
            <Animated.ScrollView
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{
                    alignItems: 'center',
                    paddingBottom: RFPercentage(1),
                }}
                showsVerticalScrollIndicator={false}
                style={{
                    width: '100%',
                }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1, width: '100%' }}
                    behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
                    keyboardVerticalOffset={getKeyboardOffset()}
                >
                    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        {formContext.isSubmitting && <AppLoadingWithOverlay />}

                        {isNotComplete && isPending && <PendingAlert mTop={16} />}

                        {isNotComplete &&
                            !isPending &&
                            receiptNotifications.map(
                                (notification: Notification, index: number) => (
                                    <RequestAlert
                                        key={notification.id}
                                        type={notification.type}
                                        mTop={index === 0 ? 16 : undefined}
                                    />
                                )
                            )}

                        <TransactionDetails />
                        {formContext.errorMessage && (
                            <Alert description={formContext.errorMessage} isDismissable={false} />
                        )}

                        {renderImageComponent()}

                        {!isEditingReceiptDetails ? (
                            <View style={styles.detailsContainer}>
                                <AutofilledDetails long />
                                <View style={{ marginTop: RFPercentage(2) }} />
                            </View>
                        ) : (
                            <EditableFormSection
                                navigation={navigation}
                                fromModal={true}
                                setExtraInput={setExtraInput}
                                onInputFocusChange={handleInputFocusChange}
                            />
                        )}
                        {isEditingReceiptDetails && (
                            <ActionButtons
                                isEditingReceiptDetails={isEditingReceiptDetails}
                                handleSave={handleSave}
                                handleEdit={handleEdit}
                                handleEditCancel={handleEditCancel}
                                handleCancel={handleCancel}
                                handleDetach={handleDetach}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Animated.ScrollView>
            {!isEditingReceiptDetails && (
                <ActionButtons
                    isEditingReceiptDetails={isEditingReceiptDetails}
                    handleSave={handleSave}
                    handleEdit={handleEdit}
                    handleEditCancel={handleEditCancel}
                    handleCancel={handleCancel}
                    handleDetach={handleDetach}
                    containerStyle={{ marginTop: 0 }}
                    bottomSpacing={Platform.OS === 'ios' ? RFPercentage(3.5) : RFPercentage(1)}
                />
            )}
            <UploadModal
                isModalVisible={isUploadModalVisible}
                setIsModalVisible={setIsUploadModalVisible}
                handleUploadSelection={(item) =>
                    handleUploadSelection(
                        item,
                        setIsUploadModalVisible,
                        navigation as any,
                        shortForm,
                        handleImageUpload
                    )
                }
            />
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        marginTop: RFPercentage(1),
        width: '92%',
        alignItems: 'center',
    },
    detailsContainer: {
        width: '100%',
        overflow: 'hidden',
        alignItems: 'center',
        marginVertical: RFPercentage(0.9),
    },
});

export default TransactionModalPendingContent;
