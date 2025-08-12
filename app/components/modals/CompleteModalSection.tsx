import React, { useState } from 'react';
import { Animated, View } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import ImageDisplay from '../ImageDisplay';
import MissingReceipt from '../MissingReceipt';
import CompletedAlert from '../CompletedAlert';
import AutofilledDetails from '../AutofilledDetails';
import { ReceiptTransaction } from 'models/types';
import TransactionDetails from 'components/TransactionDetails';

interface CompleteModalSectionProps {
    image: string | null;
    displayAlert?: boolean;
    selectedReceiptTransaction?: ReceiptTransaction;
}

const CompleteModalSection: React.FC<CompleteModalSectionProps> = ({
    image,
    displayAlert = true,
}) => {
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    return (
        <Animated.ScrollView
            automaticallyAdjustKeyboardInsets={true}
            automaticallyAdjustContentInsets={true}
            contentContainerStyle={{
                alignItems: 'center',
                paddingBottom: 28,
            }}
            showsVerticalScrollIndicator={false}
            style={{
                width: '100%',
                marginTop: -RFPercentage(1),
            }}
        >
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {displayAlert && isAlertVisible && (
                    <CompletedAlert setIsAlertVisible={setIsAlertVisible} />
                )}

                <TransactionDetails />

                {image ? <ImageDisplay image={image} /> : <MissingReceipt />}

                <AutofilledDetails long />
            </View>
        </Animated.ScrollView>
    );
};

export default CompleteModalSection;
