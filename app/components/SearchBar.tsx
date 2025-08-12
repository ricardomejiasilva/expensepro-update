import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Fontisto } from '@expo/vector-icons';
import Colors from 'config/Colors';

interface SearchBarProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    containerStyle?: object;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search',
    containerStyle,
    ...rest
}) => {
    return (
        <View style={[styles.searchmain, containerStyle]}>
            <TextInput
                style={styles.inputtext}
                onChangeText={onChangeText}
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#979797"
                {...rest}
            />
            <View style={styles.iconContainer}>
                <View style={styles.searchIcon} />
                <Fontisto name="search" size={18} color={Colors.blacktext} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    searchmain: {
        marginTop: RFPercentage(2),
        width: '92%',
        paddingHorizontal: RFPercentage(1.6),
        borderRadius: RFPercentage(1),
        borderWidth: RFPercentage(0.15),
        borderColor: Colors.gray,
        backgroundColor: 'white',
        height: RFPercentage(5),
        marginStart: RFPercentage(0.5),
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputtext: {
        width: '75%',
        fontSize: RFPercentage(1.8),
        color: Colors.black,
        fontFamily: 'System',
    },
    searchIcon: {
        height: '100%',
        width: RFPercentage(0.15),
        backgroundColor: '#979797',
        marginHorizontal: RFPercentage(1.6),
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SearchBar;
