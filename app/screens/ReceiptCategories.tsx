import React, { useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AddReceiptLayout from 'components/layouts/AddReceiptLayout';
import { useToastContext } from 'contexts/ToastContext';
import DisappearingScrollView from 'components/animations/DisappearingScrollView';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { useAppContext } from 'contexts/AppContext';
import { Category } from 'models/types';
import ExpenseCategoryItem from 'components/ExpenseCategoryItem';
import { useFormContext } from 'contexts/FormContext';
import Animated from 'react-native-reanimated';

type RootStackParamList = {
    ReceiptCategories: { image: string };
    ReceiptFormLong: { image: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReceiptCategories'>;

const ReceiptCategories = ({ route }: any) => {
    const { image } = route.params;
    const navigation = useNavigation<NavigationProp>();
    const { showToast } = useToastContext();
    const { categoriesAndIcons } = useAppContext();
    const formContext = useFormContext();
    const scrollViewRef = useRef<Animated.ScrollView>(null);

    useFocusEffect(
        React.useCallback(() => {
            // Reset scroll position when screen comes into focus
            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        }, [])
    );

    const handleNext = () => {
        if (formContext.selectedCategory.value) {
            navigation.navigate('ReceiptFormLong', { image });
        } else {
            showToast('Select an expense category.', 'error', false);
        }
    };

    return (
        <AddReceiptLayout
            headerText="Add Receipt"
            step={2}
            subheadText="Select Expense Category"
            forwardButtonLabel="Next"
            forwardButtonOnPress={handleNext}
            backButtonLabel="Back"
            backButtonOnPress={() => navigation.goBack()}
        >
            <DisappearingScrollView
                ref={scrollViewRef}
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={[
                    {
                        alignItems: 'center',
                        paddingBottom: RFPercentage(7),
                    },
                ]}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%' }}
                keyboardShouldPersistTaps="handled"
            >
                {categoriesAndIcons.map((item: Category, i: number) => (
                    <ExpenseCategoryItem
                        key={i}
                        item={item}
                        selectedCategory={formContext.selectedCategory.value}
                        handlePress={(id) =>
                            formContext.setSelectedCategory({ value: id, isError: false })
                        }
                    />
                ))}
            </DisappearingScrollView>
        </AddReceiptLayout>
    );
};

export default ReceiptCategories;
