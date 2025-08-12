import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import Colors from 'config/Colors';
import PlusIcon from './svg/PlusIcon';

interface MissingImageButtonProps {
    onPress: () => void;
}

const MissingImageButton = ({ onPress }: MissingImageButtonProps) => (
    <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
        <PlusIcon />
        <Text style={styles.buttonText}>Upload Receipt Image</Text>
    </TouchableOpacity>
);

export default MissingImageButton;

const styles = StyleSheet.create({
    buttonContainer: {
        width: '92%',
        paddingVertical: RFPercentage(1.9),
        backgroundColor: Colors.uploadGray,
        borderRadius: RFPercentage(1),
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: RFPercentage(1),
    },
    buttonText: {
        fontSize: RFPercentage(1.6),
        color: Colors.blacktext,
        fontFamily: 'System',
        marginTop: RFPercentage(0.8),
    },
});
