import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {
    ActivePeriod,
    AppContextType,
    Category,
    ExpenseCategory,
    ExpensePCard,
    ReceiptTransaction,
    UserAccount,
} from 'models/types';
import {
    setTokenToStorage,
    loadTokenFromStorage,
    verifyUserAccount,
    fetchExpenseCategoriesList,
    fetchPCardholders,
    getReceiptsForCardholder,
    getActivePeriod,
} from 'utils/appContextUtils';
import Icons from 'config/Icons_temp';
import { getApp } from '@react-native-firebase/app';
import {
    getAnalytics,
    logLogin,
    setUserId,
    setUserProperties,
} from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import { getOpenCards } from 'components/modals/PCardModal';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string>('');
    const [shortForm, setShortForm] = useState(false);
    const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [categoriesAndIcons, setCategoriesAndIcons] = useState<Category[]>([]);
    const [pCards, setPCards] = useState<ExpensePCard[]>([]);
    const [selectedPCard, setSelectedPCard] = useState<ExpensePCard | null>(null);
    const [activePeriod, setActivePeriod] = useState<ActivePeriod | null>(null);
    const [selectedReceiptTransaction, setSelectedReceiptTransaction] =
        useState<ReceiptTransaction | null>(null);
    const [pCardReceipts, setPCardReceipts] = useState<ReceiptTransaction[]>([]);
    const [isPCardListLoading, setIsPCardListLoading] = useState(false);
    const [isPCardReceiptLoading, setIsPCardReceiptLoading] = useState(false);
    const [cardholderId, setCardholderId] = useState(0);
    const [receiptTransactions, setReceiptTransactions] = useState<ReceiptTransaction[]>([]);
    const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
    const [attachReceiptModalVisible, setAttachReceiptModalVisible] = useState(false);
    const [missingTransactionModalVisible, setMissingTransactionModalVisible] = useState(false);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [isAttachingReceipt, setIsAttachingReceipt] = useState(false);
    const [
        isPreviouslySubmittedReceiptsModalVisible,
        setIsPreviouslySubmittedReceiptsModalVisible,
    ] = useState(false);
    const [logoutWebviewVisible, setLogoutWebviewVisible] = useState(false);
    const [apiError, setApiError] = useState<number | null>(null);

    const isFetchingReceipts = useRef(false);

    const setToken = (newToken: string, expiresAt?: string) => {
        setTokenToStorage(newToken, setTokenState, expiresAt);
    };

    const setAnalyticsUser = async () => {
        if (userAccount) {
            const app = getApp();
            const analyticsInstance = getAnalytics(app);
            if (analyticsInstance) {
                try {
                    // Set user ID and properties before logging events
                    await setUserId(analyticsInstance, userAccount.expenseProEmployeeId.toString());
                    await setUserProperties(analyticsInstance, {
                        userEmail: userAccount.email || '',
                        userName: userAccount.name || '',
                        employeeNumber: userAccount.employeeNumber.toString(),
                    });
                    // Use the imported logLogin function for login events
                    await logLogin(analyticsInstance, { method: Platform.OS });
                } catch (analyticsError) {
                    console.error('Error logging to Firebase Analytics:', analyticsError);
                }
            } else {
                console.error('Firebase Analytics instance is not initialized.');
            }
        }
    };

    useEffect(() => {
        loadTokenFromStorage(setTokenState);
        setIsPCardReceiptLoading(true);
    }, []);

    useEffect(() => {
        if (token) {
            verifyUserAccount(setUserAccount, setShortForm, setApiError, setIsPCardReceiptLoading);
            fetchExpenseCategoriesList(setCategories, setApiError, setIsPCardReceiptLoading);
        }
    }, [token]);

    const categoryIconMap: Record<string, any> = {
        Advertising: Icons.YoutubeLogo,
        'Building/Warehouse': Icons.Buildings,
        'Employee Expense': Icons.Users,
        Freight: Icons.Truck,
        Gas: Icons.Gas,
        IT: Icons.Desktop,
        'Job Cost': Icons.Briefcase,
        Meals: Icons.ForkKnife,
        Travel: Icons.Travel,
        Other: Icons.Other,
    };

    useEffect(() => {
        const mappedCategories = categories.map((category) => ({
            ...category,
            icon: categoryIconMap[category.name] || Icons.Other,
        }));
        setCategoriesAndIcons(mappedCategories);
    }, [categories]);

    useEffect(() => {
        const loadPcards = async () => {
            setIsPCardListLoading(true);
            const fetchedCards = await fetchPCardholders(setPCards, setApiError);
            setIsPCardListLoading(false);

            // Default selection logic
            if (fetchedCards.length > 0) {
                const userId = userAccount?.expenseProEmployeeId ?? -1;
                const ownedNonDept = fetchedCards.filter(
                    (c) => c.employeeId === userId && !c.costCenters
                );
                const ownedDept = fetchedCards.filter(
                    (c) => c.employeeId === userId && c.costCenters
                );
                const delegateCards = fetchedCards.filter((c) => c.employeeId !== userId);

                const combined = [
                    ...getOpenCards(ownedNonDept, userId),
                    ...getOpenCards(ownedDept, userId),
                    ...getOpenCards(delegateCards, userId),
                ];

                if (combined.length > 0) {
                    setSelectedPCard(combined[0]);
                }
            }
        };

        if (userAccount) loadPcards();
        if (userAccount) {
            setAnalyticsUser();
        }
    }, [userAccount]);

    useEffect(() => {
        if (cardholderId) {
            const matchingPCard = pCards.find((card) => card.cardholderId === cardholderId);
            if (matchingPCard) {
                setSelectedPCard(matchingPCard);
            }
        }
    }, [cardholderId, pCards, selectedReceiptTransaction]);

    const refreshPCardReceipts = useCallback(
        async (setIsLoading = true) => {
            if (!selectedPCard) return;
            if (isFetchingReceipts.current) return;

            isFetchingReceipts.current = true;
            setIsPCardReceiptLoading(setIsLoading);

            try {
                await getReceiptsForCardholder(
                    selectedPCard.cardholderId,
                    setPCardReceipts,
                    setReceiptTransactions,
                    setApiError
                );
            } catch (error) {
                console.error('Error fetching receipts:', error);
            } finally {
                isFetchingReceipts.current = false;
                setIsPCardReceiptLoading(false);
            }
        },
        [selectedPCard]
    );

    useEffect(() => {
        if (selectedPCard) {
            refreshPCardReceipts();
            getActivePeriod(selectedPCard.cardholderId, setActivePeriod, setApiError);
        }
    }, [selectedPCard]);

    const quietlyRefreshPCardReceipts = () => {
        refreshPCardReceipts(false);
    };

    const clearSelectedReceiptTransaction = () => {
        setSelectedReceiptTransaction(null);
    };

    return (
        <AppContext.Provider
            value={{
                token,
                setToken,
                userAccount,
                setUserAccount,
                categories,
                setCategories,
                categoriesAndIcons,
                shortForm,
                setShortForm,
                pCards,
                selectedPCard,
                setSelectedPCard,
                pCardReceipts,
                setPCardReceipts,
                quietlyRefreshPCardReceipts,
                cardholderId,
                setCardholderId,
                selectedReceiptTransaction,
                setSelectedReceiptTransaction,
                isPCardReceiptLoading,
                setIsPCardReceiptLoading,
                receiptTransactions,
                clearSelectedReceiptTransaction,
                isTransactionModalVisible,
                setIsTransactionModalVisible,
                attachReceiptModalVisible,
                setAttachReceiptModalVisible,
                missingTransactionModalVisible,
                setMissingTransactionModalVisible,
                isUploadModalVisible,
                setIsUploadModalVisible,
                isAttachingReceipt,
                setIsAttachingReceipt,
                isPreviouslySubmittedReceiptsModalVisible,
                setIsPreviouslySubmittedReceiptsModalVisible,
                activePeriod,
                setActivePeriod,
                isPCardListLoading,
                logoutWebviewVisible,
                setLogoutWebviewVisible,
                apiError,
                setApiError,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
