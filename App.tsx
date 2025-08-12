import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from 'contexts/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useFonts,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as TrackingTransparancy from 'expo-tracking-transparency';
import { FormProvider } from 'contexts/FormContext';
import { AppProvider } from 'contexts/AppContext';
import { ModalProvider } from 'contexts/ModalContext';
import { OcrProvider } from 'contexts/OcrContext';
import { checkUser } from './app/utils/apis';
import { ToastProvider } from 'contexts/ToastContext';
import Toast from 'components/Toast';

import NavigationStack from './app/navigation/NavigationStack';
import AppLoading from './app/components/AppLoading';
import { DNS_URL } from 'utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthData } from 'utils/authUtils';
import { getAnalytics, logScreenView } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

const queryClient = new QueryClient();

Sentry.init({
    dsn: DNS_URL,
});

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const [fontsLoaded] = useFonts({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
    });

    const checkLoginStatus = async () => {
        try {
            // Get stored cookies
            const storedCookie = await AsyncStorage.getItem('userCookie');
            const cookieHeader = await AsyncStorage.getItem('cookieHeader');
            if (storedCookie && cookieHeader) {
                try {
                    const { cookie, expiresAt } = JSON.parse(storedCookie);

                    // Check if cookies are expired
                    if (!expiresAt || new Date(expiresAt) < new Date()) {
                        await clearAuthData();
                        setIsLoggedIn(false);
                        return;
                    }

                    const response = await checkUser();

                    if (response?.data && response.status === 200) {
                        setIsLoggedIn(true);
                    } else {
                        throw new Error('Invalid user response');
                    }
                } catch (error) {
                    console.error('Error parsing stored cookie or validating user:', error);
                    await clearAuthData();
                    setIsLoggedIn(false);
                }
            } else {
                // If no cookies found, set logged out
                await clearAuthData();
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            await clearAuthData();
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    const requestATT = async () => {
        if (TrackingTransparancy.isAvailable()) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await TrackingTransparancy.requestTrackingPermissionsAsync();
        }
    };

    useEffect(() => {
        requestATT();
        checkLoginStatus();
    }, []);

    const navigationRef = useNavigationContainerRef();
    const routeNameRef = React.useRef<string | undefined>();
    const app = getApp();
    const analyticsInstance = getAnalytics(app);

    if (loading || !fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <AppProvider>
                    <ModalProvider>
                        <NotificationProvider>
                            <FormProvider>
                                <OcrProvider>
                                    <NavigationContainer
                                        ref={navigationRef}
                                        onReady={() => {
                                            routeNameRef.current =
                                                navigationRef.current?.getCurrentRoute?.()?.name;
                                        }}
                                        onStateChange={async () => {
                                            const previousRouteName = routeNameRef.current;
                                            const currentRouteName =
                                                navigationRef.current?.getCurrentRoute?.()?.name ??
                                                '';
                                            const trackScreenView = (routeName: string) => {
                                                // Log screen view to Firebase Analytics
                                                logScreenView(analyticsInstance, {
                                                    screen_name: routeName,
                                                    screen_class: routeName,
                                                });
                                            };

                                            if (previousRouteName !== currentRouteName) {
                                                // Replace the line below to add the tracker from a mobile analytics SDK
                                                await trackScreenView(currentRouteName);
                                            }

                                            // Save the current route name for later comparison
                                            routeNameRef.current = currentRouteName;
                                        }}
                                    >
                                        <ToastProvider>
                                            <Toast />
                                            <NavigationStack isLoggedIn={isLoggedIn ?? false} />
                                        </ToastProvider>
                                    </NavigationContainer>
                                </OcrProvider>
                            </FormProvider>
                        </NotificationProvider>
                    </ModalProvider>
                </AppProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
};

export default Sentry.wrap(App);
