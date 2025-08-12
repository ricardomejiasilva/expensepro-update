/**
 * @name ReceiptImage
 * @description A component that conditionally displays an image or a PDF file based on the file extension.
 * @description It accepts the same props as the Image component from react-native, but with an optional `isModal`.
 * @example
 * <ReceiptImage source={{ uri: "https://example.com/receipt.pdf" }} />
 * @example
 * <ReceiptImage source={{ uri: "https://example.com/receipt.jpg" }} />
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
    ImageProps,
    StyleSheet,
    Button,
    Text,
    TouchableWithoutFeedback,
    ActivityIndicator,
    DimensionValue,
    Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import Colors from 'config/Colors';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { RFPercentage } from 'react-native-responsive-fontsize';
import * as FileSystem from 'expo-file-system';

interface ReceiptImageProps extends ImageProps {
    isModal?: boolean;
    toggleModal?: () => void;
    previewOnly?: boolean;
    pdfHeight?: DimensionValue;
}

const ReceiptImage: React.FC<ReceiptImageProps> = ({
    source,
    style,
    isModal = false,
    toggleModal,
    previewOnly = false,
    pdfHeight = '100%',
    ...rest
}) => {
    const imageIsPDF =
        typeof source === 'object' &&
        'uri' in source &&
        typeof source.uri === 'string' &&
        source.uri.toLowerCase().includes('.pdf');

    const [page, setPage] = useState(1);
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [localPDF, setLocalPDF] = useState<string | null>(null);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const isModalStyles = isModal ? receiptImageStyles.modalImage : {};
    const scale = useSharedValue(1);

    // Cleanup effect - must not be conditional
    useEffect(() => {
        return () => {
            setLocalPDF(null);
            setPage(1);
            setNumberOfPages(0);
        };
    }, []);

    // Download PDF if remote
    useEffect(() => {
        let isMounted = true;
        const downloadPDF = async () => {
            if (
                imageIsPDF &&
                source &&
                typeof source.uri === 'string' &&
                source.uri.startsWith('http')
            ) {
                setLoadingPDF(true);
                try {
                    const localUri = `${FileSystem.cacheDirectory}${Math.random()
                        .toString(36)
                        .substring(7)}.pdf`;
                    const download = await FileSystem.downloadAsync(source.uri, localUri);
                    if (isMounted) {
                        setLocalPDF(download.uri);
                        setLoadingPDF(false);
                    }
                } catch (err) {
                    console.error('PDF Download error', err);
                    if (isMounted) setLoadingPDF(false);
                }
            } else {
                setLocalPDF(null);
            }
        };
        downloadPDF();
        return () => {
            isMounted = false;
        };
    }, [source && (typeof source === 'object' && !Array.isArray(source) ? source.uri : null)]);

    // Pinch gesture
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.max(0.5, Math.min(event.scale, 3));
        })
        .onEnd(() => {
            scale.value = withTiming(1, { duration: 250 });
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    if (imageIsPDF && (isModal === true || previewOnly)) {
        if (loadingPDF) {
            return (
                <View
                    style={[
                        style,
                        isModalStyles,
                        receiptImageStyles.container,
                        { height: pdfHeight, justifyContent: 'center', alignItems: 'center' },
                    ]}
                >
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            );
        }

        const pdfSource =
            localPDF && Platform.OS === 'android'
                ? { uri: localPDF, cache: true }
                : { uri: source.uri, cache: true };

        return (
            <View
                style={[
                    style,
                    isModalStyles,
                    receiptImageStyles.container,
                    isModal ? { flex: 1 } : { height: pdfHeight },
                ]}
            >
                <TouchableWithoutFeedback>
                    <View style={[isModalStyles, receiptImageStyles.pdfContainer]}>
                        <GestureDetector gesture={pinchGesture}>
                            <Animated.View style={[animatedStyle, { flex: 1 }]}>
                                <Pdf
                                    key={pdfSource.uri}
                                    source={pdfSource}
                                    page={previewOnly ? 1 : page}
                                    onLoadComplete={(totalPages) => {
                                        setNumberOfPages(totalPages);
                                        setPage(1);
                                    }}
                                    onPageChanged={(page) => {
                                        setPage(page);
                                    }}
                                    style={receiptImageStyles.pdf}
                                    scale={1.0}
                                    minScale={1.0}
                                    maxScale={3.0}
                                    enablePaging={true}
                                />
                            </Animated.View>
                        </GestureDetector>
                    </View>
                </TouchableWithoutFeedback>
                {!previewOnly && numberOfPages > 0 && (
                    <View style={receiptImageStyles.paginationContainer}>
                        <View style={receiptImageStyles.pagination}>
                            {page === 1 ? (
                                <Button
                                    title={'Close'}
                                    onPress={() => toggleModal && toggleModal()}
                                    color={Colors.link}
                                />
                            ) : (
                                <Button
                                    title={'Previous'}
                                    onPress={() => setPage(page - 1)}
                                    color={Colors.link}
                                />
                            )}

                            <Text style={receiptImageStyles.paginationLabel}>
                                {`Page ${page} / ${numberOfPages}`}
                            </Text>
                            {numberOfPages !== 1 && (
                                <Button
                                    title="Next"
                                    onPress={() => setPage(page + 1)}
                                    disabled={page >= numberOfPages}
                                    color={Colors.link}
                                />
                            )}
                        </View>
                    </View>
                )}
            </View>
        );
    }

    return <Image source={source} style={[style, isModalStyles]} {...rest} />;
};

const receiptImageStyles = StyleSheet.create({
    modalImage: {
        flex: 1,
        alignSelf: 'stretch',
    },
    container: {
        width: '100%',
        height: '100%',
    },
    pdfContainer: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    pdf: {
        width: '100%',
        height: '102%',
        backgroundColor: 'transparent',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    pagination: {
        flex: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    paginationLabel: {
        color: 'white',
        paddingRight: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gray,
    },
    errorText: {
        color: Colors.red,
        textAlign: 'center',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gray,
    },
});

export default ReceiptImage;
