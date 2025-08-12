import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { FontFamily } from 'config/Fonts';
import type { ExpensePCard } from 'models/types';
import CloseIcon from '../svg/CloseIcon';
import { useAppContext } from 'contexts/AppContext';
import Toast from 'components/Toast';
import Colors from 'config/Colors';
import MenuItemSkeleton from 'components/SkeletonLoader/MenuItemSkeleton';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { ManagePcardRecordStatus } from 'models/receiptStatus';

interface PCardModalProps {
    isModalVisible: boolean;
    setIsModalVisible: (visible: boolean) => void;
}

const { width, height } = Dimensions.get('window');
const isIphoneSE = Platform.OS === 'ios' && width === 375 && height === 667;

const sortPCards = (cards: ExpensePCard[], currentUserId: number) => {
    return [...cards].sort((a, b) => {
        // 1. Open cards come before Closed cards
        if (
            a.status === ManagePcardRecordStatus.Open &&
            b.status === ManagePcardRecordStatus.Closed
        )
            return -1;
        if (
            a.status === ManagePcardRecordStatus.Closed &&
            b.status === ManagePcardRecordStatus.Open
        )
            return 1;

        // 2. Alphabetical by first name
        const firstNameCompare = a.firstName.localeCompare(b.firstName);
        if (firstNameCompare !== 0) return firstNameCompare;

        // 3. Alphabetical by last name (fallback)
        return a.lastName.localeCompare(b.lastName);
    });
};

// Helper functions to filter cards
const getOpenCards = (cards: ExpensePCard[], currentUserId: number) =>
    sortPCards(cards, currentUserId).filter(
        (item) => item.status !== ManagePcardRecordStatus.Closed
    );
const getClosedCards = (cards: ExpensePCard[], currentUserId: number) =>
    sortPCards(cards, currentUserId).filter(
        (item) => item.status === ManagePcardRecordStatus.Closed
    );

export { getOpenCards };

// Card list item component
const PCardListItem: React.FC<{
    item: ExpensePCard;
    isSelected: boolean;
    onPress: (item: ExpensePCard) => void;
    closed?: boolean;
}> = ({ item, isSelected, onPress, closed }) => (
    <TouchableOpacity
        key={item.cardholderId}
        onPress={() => onPress(item)}
        style={[styles.buttonContainer, { backgroundColor: isSelected ? '#DFEEEC' : undefined }]}
        activeOpacity={0.7}
    >
        <View style={{ width: '92%', paddingLeft: closed ? RFPercentage(1) : 0 }}>
            <Text
                style={{
                    color: Colors.blacktext,
                    fontFamily: FontFamily.bold,
                    fontSize: RFPercentage(1.6),
                }}
            >
                {item.legalName}'s PCard - {item.lastFourDigits}
            </Text>
            <View style={{ marginTop: RFPercentage(0.6) }}>
                <Text
                    style={{
                        color: Colors.blacktext,
                        fontFamily: FontFamily.regular,
                        fontSize: RFPercentage(1.6),
                    }}
                >
                    {item.companyName} | {item.departmentName}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
);

const PCardModal: React.FC<PCardModalProps> = ({ isModalVisible, setIsModalVisible }) => {
    const [shouldRenderPcards, setShouldRenderPcards] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const {
        pCards,
        selectedPCard,
        setCardholderId,
        setIsPCardReceiptLoading,
        isPCardListLoading,
        userAccount,
    } = useAppContext();

    const translateY = useSharedValue(height);
    const opacity = useSharedValue(0);
    const startY = useSharedValue(0);
    const hasAnimatedIn = useRef(false);

    const scrollToSelectedCard = () => {
        if (!selectedPCard || !scrollViewRef.current) return;

        const userId = userAccount?.expenseProEmployeeId ?? -1;
        const openCards = getOpenCards(pCards, userId);
        const closedCards = getClosedCards(pCards, userId);

        // Use a more generous estimate for item height to account for all spacing
        // Each item has: padding, margin, text content, and internal spacing
        const estimatedItemHeight = 80; // Generous estimate in pixels
        const viewportPadding = 100; // Extra padding to center the item in viewport

        // Find the index of the selected card in the open cards
        const selectedIndexInOpen = openCards.findIndex(
            (card) => card.cardholderId === selectedPCard.cardholderId
        );

        if (selectedIndexInOpen !== -1) {
            // Card is in open cards section
            const yOffset = Math.max(
                0,
                selectedIndexInOpen * estimatedItemHeight - viewportPadding
            );
            scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
        } else {
            // Card might be in closed cards section
            const selectedIndexInClosed = closedCards.findIndex(
                (card) => card.cardholderId === selectedPCard.cardholderId
            );

            if (selectedIndexInClosed !== -1) {
                // Calculate offset including open cards + section header
                const openCardsHeight = openCards.length * estimatedItemHeight;
                const sectionHeaderHeight = 50; // Estimate for section header
                const yOffset = Math.max(
                    0,
                    openCardsHeight +
                        sectionHeaderHeight +
                        selectedIndexInClosed * estimatedItemHeight -
                        viewportPadding
                );
                scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
            }
        }
    };

    useEffect(() => {
        if (isModalVisible) {
            // Scroll to selected card after the modal has rendered
            setTimeout(() => {
                scrollToSelectedCard();
            }, 500); // Delay to ensure modal animation is complete
        } else {
            hasAnimatedIn.current = false;
            setShouldRenderPcards(false);
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(height, { duration: 300 });
        }
    }, [isModalVisible]);

    // Trigger scroll when cards are rendered
    useEffect(() => {
        if (shouldRenderPcards && selectedPCard) {
            setTimeout(() => {
                scrollToSelectedCard();
            }, 100); // Small delay to ensure rendering is complete
        }
    }, [shouldRenderPcards, selectedPCard]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            const next = startY.value + event.translationY;
            translateY.value = Math.max(0, next);
        })
        .onEnd((event) => {
            const shouldClose = event.translationY > 100 || event.velocityY > 800;
            if (shouldClose) {
                opacity.value = withTiming(0, { duration: 200 });
                translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                    if (finished) runOnJS(setIsModalVisible)(false);
                });
            } else {
                translateY.value = withTiming(0, { duration: 250 });
            }
        });

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handlePress = (item: ExpensePCard) => {
        if (selectedPCard?.cardholderId === item.cardholderId) return;
        setCardholderId(item.cardholderId);
        setIsPCardReceiptLoading(true);
        setIsModalVisible(false);
    };

    const handleClose = () => {
        setShouldRenderPcards(false);
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
            if (finished) runOnJS(setIsModalVisible)(false);
        });
    };

    return (
        <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <Toast />
            <Reanimated.View style={[styles.container, animatedContainerStyle]}>
                <GestureDetector gesture={gesture}>
                    <Reanimated.View
                        onLayout={() => {
                            if (isModalVisible && !hasAnimatedIn.current) {
                                hasAnimatedIn.current = true;
                                opacity.value = withTiming(1, { duration: 400 });
                                translateY.value = withTiming(0, { duration: 400 }, (finished) => {
                                    if (finished) {
                                        runOnJS(setShouldRenderPcards)(true);
                                    }
                                });
                            }
                        }}
                        style={[styles.content, animatedContentStyle]}
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
                                    PCard User
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={{ paddingRight: 8 }}>
                                <CloseIcon />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: RFPercentage(1) }} />

                        <ScrollView ref={scrollViewRef} style={{ width: '100%' }}>
                            {/* Loading skeleton */}
                            {!shouldRenderPcards || isPCardListLoading
                                ? Array.from({ length: 1 }).map((_, index) => (
                                      <View key={index} style={{ paddingHorizontal: 16 }}>
                                          <MenuItemSkeleton />
                                      </View>
                                  ))
                                : (() => {
                                      // Split cards into open and closed
                                      const openCards = getOpenCards(
                                          pCards,
                                          userAccount?.expenseProEmployeeId ?? -1
                                      );
                                      const closedCards = getClosedCards(
                                          pCards,
                                          userAccount?.expenseProEmployeeId ?? -1
                                      );
                                      return (
                                          <>
                                              {/* Open cards */}
                                              {openCards.map((item) => (
                                                  <PCardListItem
                                                      key={item.cardholderId}
                                                      item={item}
                                                      isSelected={
                                                          selectedPCard?.cardholderId ===
                                                          item.cardholderId
                                                      }
                                                      onPress={handlePress}
                                                  />
                                              ))}
                                              {/* Closed cards section */}
                                              {closedCards.length > 0 && (
                                                  <View
                                                      style={{
                                                          paddingHorizontal: RFPercentage(1.9),
                                                          marginTop: 14,
                                                          marginBottom: 6,
                                                      }}
                                                  >
                                                      <Text
                                                          style={{
                                                              color: Colors.blacktext,
                                                              fontFamily: FontFamily.regular,
                                                              fontSize: RFPercentage(1.5),
                                                              opacity: 0.65,
                                                          }}
                                                      >
                                                          Closed Cards
                                                      </Text>
                                                  </View>
                                              )}
                                              {closedCards.map((item) => (
                                                  <PCardListItem
                                                      key={item.cardholderId}
                                                      item={item}
                                                      closed
                                                      isSelected={
                                                          selectedPCard?.cardholderId ===
                                                          item.cardholderId
                                                      }
                                                      onPress={handlePress}
                                                  />
                                              ))}
                                          </>
                                      );
                                  })()}
                        </ScrollView>
                    </Reanimated.View>
                </GestureDetector>
            </Reanimated.View>
        </Modal>
    );
};

export default PCardModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        width: '100%',
        maxHeight: isIphoneSE ? '58%' : '48%',
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingVertical: RFPercentage(1),
        paddingBottom: Platform.OS === 'ios' ? RFPercentage(5) : 16,
        alignItems: 'center',
    },
    modalLine: {
        borderRadius: 2,
        width: 74,
        height: 3,
        backgroundColor: Colors.uploadGray,
        marginTop: RFPercentage(0.6),
    },
    header: {
        width: '92%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: RFPercentage(1.3),
    },
    buttonContainer: {
        paddingVertical: RFPercentage(1.6),
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: RFPercentage(1),
    },
});
