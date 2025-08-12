import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { FontFamily } from 'config/Fonts';
import Colors from 'config/Colors';

interface ErrorSectionProps {
    imageSource: any;
    mainText: string;
    subText: string;
    buttonText: string;
    onButtonPress: () => void;
}

const ErrorSection: React.FC<ErrorSectionProps> = ({
    imageSource,
    mainText,
    subText,
    buttonText,
    onButtonPress,
}) => (
    <View style={styles.errorContainer}>
        <Image source={imageSource} style={{ width: 161, height: 178 }} />
        <Text
            style={{
                fontSize: RFPercentage(2.2),
                color: Colors.blacktext,
                fontFamily: FontFamily.bold,
                marginTop: RFPercentage(2.4),
            }}
        >
            {mainText}
        </Text>
        <Text style={styles.errorText}>{subText}</Text>
        <TouchableOpacity style={styles.homeButton} onPress={onButtonPress}>
            <Text style={styles.homeButtonText}>{buttonText}</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '92%',
        alignSelf: 'center',
    },
    mainText: {
        fontSize: RFPercentage(2.2),
        color: Colors.blacktext,
        fontFamily: FontFamily.bold,
        marginTop: RFPercentage(2.4),
    },
    errorText: {
        marginTop: RFPercentage(0.9),
        fontSize: RFPercentage(1.6),
        color: Colors.textGray,
        textAlign: 'center',
    },
    homeButton: {
        marginTop: RFPercentage(2),
        backgroundColor: Colors.link,
        borderRadius: 12,
        paddingVertical: RFPercentage(1.6),
        paddingHorizontal: RFPercentage(2),
        alignItems: 'center',
    },
    homeButtonText: {
        color: 'white',
        fontSize: RFPercentage(1.6),
        fontFamily: FontFamily.regular,
    },
});

export default ErrorSection;
