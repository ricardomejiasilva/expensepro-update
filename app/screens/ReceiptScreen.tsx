import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Image,
    TextInput,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Fontisto } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { FontFamily } from 'config/Fonts';
import { useAppContext } from 'contexts/AppContext';
import { ReceiptTransaction } from 'models/types';
import { useFormContext } from 'contexts/FormContext';
import Colors from 'config/Colors';
import Icons from 'config/Icons_temp';
import Screen from 'components/Screen';
import AppLine from 'components/AppLine';
import Header from 'components/Header';
import PCardSelection from 'components/PCardSelection';
import ReceiptCard from 'components/ReceiptCard';
import ReceiptsDueAlert from 'components/ReceiptsDueAlert';
import { type RootStackParamList } from 'models/types';
import TransactionSkeleton from 'components/SkeletonLoader/TransactionSkeleton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DisappearingScrollView from 'components/animations/DisappearingScrollView';
import ErrorSection from 'components/ErrorSection';
import SearchBar from '../components/SearchBar';

type BottomTabRouteProp = RouteProp<RootStackParamList, 'BottomTab'>;

interface ReceiptScreenProps {
    bottomTabParams?: BottomTabRouteProp['params'];
}

const ReceiptSreen: React.FC<ReceiptScreenProps> = ({ bottomTabParams }) => {
    type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Receipts'>;
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');

    const {
        receiptTransactions,
        setSelectedReceiptTransaction,
        isPCardReceiptLoading,
        apiError,
        setLogoutWebviewVisible,
    } = useAppContext();
    const { updateFormValuesFromReceiptTransaction } = useFormContext();

    const filteredAndSortedReceipts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return receiptTransactions
            .filter((item) => item.receiptStatus !== 1 && item.receipt)
            .filter((item) => {
                const descriptionMatch = item.receipt.description.toLowerCase().includes(query);
                const idMatch = `receipt ${item.id}`.toLowerCase().includes(query);

                // Enhanced amount matching to handle decimal searches
                let amountMatch = false;
                if (item.receipt.totalAmount !== undefined && item.receipt.totalAmount !== null) {
                    const amount = item.receipt.totalAmount;
                    const amountStr = amount.toString();
                    const amountFixed = amount.toFixed(2); // e.g., "200.00"

                    // Check if query matches the raw number, formatted number, or partial decimal
                    amountMatch =
                        amountStr.includes(query) ||
                        amountFixed.includes(query) ||
                        (query.endsWith('.') && amountStr === query.slice(0, -1));
                }

                return descriptionMatch || idMatch || amountMatch;
            })
            .sort((a, b) => {
                // Move completed receipts (status 3) to the bottom
                const isAComplete = a.receiptStatus === 3;
                const isBComplete = b.receiptStatus === 3;
                if (isAComplete && !isBComplete) return 1;
                if (!isAComplete && isBComplete) return -1;
                // Otherwise, sort by id descending
                return b.id - a.id;
            });
    }, [receiptTransactions, searchQuery]);

    const handleReceiptPress = (receipt: ReceiptTransaction) => {
        updateFormValuesFromReceiptTransaction(receipt);
        setSelectedReceiptTransaction(receipt);
        navigation.navigate('ReceiptModal', {
            screen: 'ReceiptModal',
        });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Screen style={styles.screen}>
                <Header />
                <PCardSelection />
                <AppLine />

                {apiError === 500 ? (
                    <ErrorSection
                        imageSource={Icons.ErrorBulb}
                        mainText="500 Error"
                        subText="Internal Server Error"
                        buttonText="Log Out"
                        onButtonPress={() => setLogoutWebviewVisible(true)}
                    />
                ) : (
                    <>
                        <ReceiptsDueAlert />
                        <View
                            style={{
                                width: '92%',
                                marginTop: RFPercentage(1.8),
                            }}
                        >
                            <Text
                                style={{
                                    color: '#262626',
                                    fontFamily: FontFamily.bold,
                                    fontSize: RFPercentage(2.2),
                                }}
                            >
                                Submitted Receipts
                            </Text>
                            <Text style={styles.headerDescription}>
                                Receipts submitted in the last 60 days.
                            </Text>
                        </View>

                        {/* Search Bar */}
                        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
                        {isPCardReceiptLoading ? (
                            <View
                                style={{
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <TransactionSkeleton />
                            </View>
                        ) : filteredAndSortedReceipts.length > 0 ? (
                            <DisappearingScrollView
                                contentContainerStyle={{
                                    alignItems: 'center',
                                    paddingBottom: RFPercentage(5),
                                }}
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%', marginTop: RFPercentage(1.4) }}
                            >
                                {filteredAndSortedReceipts.map((item: ReceiptTransaction) => (
                                    <ReceiptCard
                                        key={item.receipt.id}
                                        item={item as ReceiptTransaction}
                                        onPress={() =>
                                            handleReceiptPress(item as ReceiptTransaction)
                                        }
                                    />
                                ))}
                            </DisappearingScrollView>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Image
                                    source={Icons.Noevent}
                                    style={{
                                        width: RFPercentage(16),
                                        height: RFPercentage(10),
                                    }}
                                />
                                <Text
                                    style={{
                                        marginTop: RFPercentage(1),
                                        fontSize: RFPercentage(1.6),
                                        color: Colors.blacktext,
                                    }}
                                >
                                    You have not submitted receipts
                                </Text>
                                <Text style={styles.emptySubtext}>in the last 60 days.</Text>
                            </View>
                        )}
                    </>
                )}
            </Screen>
        </TouchableWithoutFeedback>
    );
};

export default ReceiptSreen;
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    headerDescription: {
        marginTop: RFPercentage(0.5),
        color: Colors.notificationText,
        fontFamily: FontFamily.regular,
        fontSize: RFPercentage(1.6),
    },
    emptyContainer: {
        width: '92%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: RFPercentage(0.15),
        borderColor: Colors.lightWhite,
        borderRadius: RFPercentage(1),
        height: '57%',
        paddingHorizontal: RFPercentage(4),
        marginTop: 16,
    },
    emptySubtext: {
        marginTop: RFPercentage(1),
        marginBottom: RFPercentage(6),
        textAlign: 'center',
        fontSize: RFPercentage(1.6),
        color: Colors.blacktext,
    },
    loading: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: RFPercentage(1.3),
    },
});
