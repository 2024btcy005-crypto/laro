import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './src/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreToken } from './src/store/authSlice';
import { setStoreCart } from './src/store/cartSlice';
import { View, ActivityIndicator, Text, Alert, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

// Configure top-level Expo notification handler
try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: false,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
} catch (e) {
    console.warn('[App] Push notification module not initialized:', e.message);
}


// Import Screens

import HomeScreen from './src/screens/home/HomeScreen';
import { DeliveryLiveStatus } from './src/services/deliveryLiveStatus';
import ShopDetailsScreen from './src/screens/shop/ShopDetailsScreen';
import CartScreen from './src/screens/cart/CartScreen';
import CheckoutScreen from './src/screens/checkout/CheckoutScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import UniversitySelectionScreen from './src/screens/auth/UniversitySelectionScreen';
import LinkWalletScreen from './src/screens/auth/LinkWalletScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import ProductDetailScreen from './src/screens/shop/ProductDetailScreen';
import FoodDeliveryScreen from './src/screens/shop/FoodDeliveryScreen';
import LoyaltyScreen from './src/screens/profile/LoyaltyScreen';
import QuestScreen from './src/screens/home/QuestScreen';
import QuestsTabScreen from './src/screens/home/QuestsTabScreen';
import SearchScreen from './src/screens/search/SearchScreen';

import OrdersScreen from './src/screens/profile/OrdersScreen';
import FavoritesScreen from './src/screens/profile/FavoritesScreen';
import AddressBookScreen from './src/screens/profile/AddressBookScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import AboutScreen from './src/screens/profile/AboutScreen';
import OrderDetailScreen from './src/screens/profile/OrderDetailScreen';
import LaroCurrencyScreen from './src/screens/profile/LaroCurrencyScreen';
import SendCoinsScreen from './src/screens/profile/SendCoinsScreen';
import MyQRScreen from './src/screens/profile/MyQRScreen';
import TransactionDetailScreen from './src/screens/profile/TransactionDetailScreen';
import StreakScreen from './src/screens/profile/StreakScreen';
import ReferralScreen from './src/screens/profile/ReferralScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AnimatedTabButton(props) {
    const { accessibilityState, children, onPress } = props;
    const focused = accessibilityState?.selected;

    const scaleAnim = React.useRef(new Animated.Value(focused ? 1.06 : 0.94)).current;

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: focused ? 1.1 : 0.94,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
        }).start();
    }, [focused]);

    return (
        <TouchableOpacity
            {...props}
            onPress={(e) => {
                if (onPress) onPress(e);
            }}
            activeOpacity={0.85}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
            <Animated.View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: scaleAnim }],
                    paddingHorizontal: 12,
                    paddingVertical: 3,
                    borderRadius: 16,
                    backgroundColor: focused ? '#edf7f0' : 'transparent',
                }}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,

                tabBarButton: (props) => <AnimatedTabButton {...props} />,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#ececec',
                    height: 64,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                tabBarIcon: ({ focused }) => {
                    let iconName;
                    let label;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                        label = 'Home';
                    } else if (route.name === 'Food') {
                        iconName = focused ? 'fast-food' : 'fast-food-outline';
                        label = 'Food';
                    } else if (route.name === 'Orders') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                        label = 'Orders';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                        label = 'Profile';
                    }

                    return (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons
                                name={iconName}
                                size={22}
                                color={focused ? '#056f36' : '#aaaaaa'}
                            />
                            <Text style={{
                                fontSize: 10,
                                fontWeight: focused ? '800' : '500',
                                color: focused ? '#056f36' : '#aaaaaa',
                                marginTop: 2,
                            }}>
                                {label}
                            </Text>
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Food" component={FoodDeliveryScreen} />
            <Tab.Screen name="Orders" component={OrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// Component to handle Auth state logic
function RootNavigator() {
    const { isAuthenticated, isLoading, setupPending } = useSelector(state => state.auth);
    const { items } = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const [hasOnboarded, setHasOnboarded] = React.useState(false);

    useEffect(() => {
        // Debug logging for cart state consistency
        if (items.length > 0) {
            console.log(`[STATE] Cart healthy: ${items.length} items`);
        }
    }, [items]);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let userToken;
            let userData = null;
            let cartData = null;
            try {
                userToken = await AsyncStorage.getItem('userToken');
                const storedUser = await AsyncStorage.getItem('userData');
                const storedCart = await AsyncStorage.getItem('cartData');

                if (userToken && userToken.startsWith('mock_')) {
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userData');
                    userToken = null;
                }

                if (storedUser && userToken) {
                    userData = JSON.parse(storedUser);
                }

                if (storedCart) {
                    cartData = JSON.parse(storedCart);
                }

                // Check if user has completed onboarding
                const onboarded = await AsyncStorage.getItem('laro_onboarded');
                setHasOnboarded(onboarded === 'true');

                // Check for selected university
                const storedUni = await AsyncStorage.getItem('laro_university');
                const selectedUni = storedUni ? JSON.parse(storedUni) : null;

                // Restore Auth
                dispatch(restoreToken({
                    token: userToken,
                    user: userToken ? (userData || { name: 'Guest User' }) : null,
                    selectedUniversity: selectedUni
                }));
            } catch (e) {
                console.log('Restoring data failed', e);
            }

            // Restore Cart
            if (cartData) {
                dispatch(setStoreCart(cartData));
            }
        };
        bootstrapAsync();
    }, [dispatch]);

    // Update cart persistence whenever items change
    useEffect(() => {
        const persistCart = async () => {
            try {
                const cartState = { items, shopId: store.getState().cart.shopId, totalAmount: store.getState().cart.totalAmount };
                await AsyncStorage.setItem('cartData', JSON.stringify(cartState));
            } catch (e) {
                console.log('Saving cart failed');
            }
        };
        if (items.length >= 0) {
            persistCart();
        }
    }, [items]);



    // Register push notification token on login & attach foreground listener
    useEffect(() => {
        if (isAuthenticated) {
            registerForPushNotificationsAsync();

            let Notifications;
            try {
                Notifications = require('expo-notifications');
            } catch (e) {}

            if (Notifications) {
                const subReceived = Notifications.addNotificationReceivedListener(notification => {
                    console.log('[PUSH RECEIVED FOREGROUND]:', notification);
                    const data = notification.request.content.data;
                    if (data && data.type === 'DELIVERY_LIVE_STATUS') {
                        const liveData = {
                            orderId: data.orderId,
                            restaurantName: data.restaurantName || 'Laro Kitchen',
                            deliveryPartnerName: data.deliveryPartnerName || 'Delivery Partner',
                            status: data.status,
                            etaMinutes: data.etaMinutes ? parseInt(data.etaMinutes, 10) : 15,
                            progress: data.progress ? parseFloat(data.progress) : 0.5,
                            deepLink: data.deepLink || `laro://order/${data.orderId}`
                        };

                        if (data.status === 'DELIVERED') {
                            DeliveryLiveStatus.end(liveData);
                        } else if (data.status === 'CANCELLED') {
                            DeliveryLiveStatus.cancel(data.orderId);
                        } else {
                            DeliveryLiveStatus.update(liveData);
                        }
                    }
                });

                const subResponse = Notifications.addNotificationResponseReceivedListener(response => {
                    console.log('[PUSH TAPPED]:', response);
                });

                return () => {
                    subReceived.remove();
                    subResponse.remove();
                };
            }
        }
    }, [isAuthenticated]);


    const { colors, isDarkMode } = useTheme();


    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.black,
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitleVisible: false,
                contentStyle: { backgroundColor: colors.background }
            }}
        >
            {isAuthenticated ? (
                <>
                    {setupPending ? (
                        // Fresh registration: start at step 1 (LinkWallet) with setup params
                        <Stack.Screen
                            name="LinkWallet"
                            component={LinkWalletScreen}
                            options={{ headerShown: false }}
                            initialParams={{ isSetup: true }}
                        />
                    ) : (
                        // Returning user: go straight to Main
                        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
                    )}
                    {/* Always register all authenticated screens */}
                    {setupPending && <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />}
                    {!setupPending && <Stack.Screen name="LinkWallet" component={LinkWalletScreen} options={{ headerShown: false }} />}
                    <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="UniversitySelection" component={UniversitySelectionScreen} options={{ headerShown: false }} />

                    <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ShopDetail" component={ShopDetailsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="FoodDelivery" component={FoodDeliveryScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />

                    {/* Profile Sub-Screens */}
                    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="LaroCurrency" component={LaroCurrencyScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="SendCoins" component={SendCoinsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="MyQR" component={MyQRScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ headerShown: false }} />

                    {/* Manage university selection */}
                    <Stack.Screen name="ChangeUniversity" component={UniversitySelectionScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Quest" component={QuestScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="QuestsList" component={QuestsTabScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Streak" component={StreakScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Referral" component={ReferralScreen} options={{ headerShown: false }} />
                </>
            ) : (
                <>
                    {!hasOnboarded && (
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <Provider store={store}>
            <ThemeProvider>
                <SafeAreaProvider>
                    <AppContent />
                </SafeAreaProvider>
            </ThemeProvider>
        </Provider>
    );
}

const linkingConfig = {
    prefixes: ['laro://', 'https://laro.app', 'exp://'],
    config: {
        screens: {
            Main: {
                screens: {
                    Home: 'home',
                    Orders: 'orders',
                }
            },
            OrderDetail: 'order/:orderId',
        }
    }
};

function AppContent() {
    const { isDarkMode } = useTheme();
    return (
        <NavigationContainer linking={linkingConfig} theme={isDarkMode ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <RootNavigator />
        </NavigationContainer>
    );
}

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
