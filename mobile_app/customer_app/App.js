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
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Import Screens
import HomeScreen from './src/screens/home/HomeScreen';
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
import LoyaltyScreen from './src/screens/profile/LoyaltyScreen';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            top: 0
                        }}>
                            <View style={{
                                width: 45,
                                height: 45,
                                borderRadius: 22.5,
                                backgroundColor: focused ? `${colors.primary}15` : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4
                            }}>
                                <Ionicons name={iconName || 'help-circle-outline'} size={size} color={color} />
                            </View>
                        </View>
                    );
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray,
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    height: 65,
                    elevation: 10,
                    borderRadius: 30,
                    backgroundColor: colors.white,
                    borderTopWidth: 0,
                    paddingTop: 12,
                    paddingBottom: 25,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '900',
                    marginTop: -5,
                    letterSpacing: 0.3
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Laro' }}
                listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{ title: 'Your Orders' }}
                listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
                listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
        </Tab.Navigator>
    );
}

// Component to handle Auth state logic
function RootNavigator() {
    const { isAuthenticated, isLoading, selectedUniversity } = useSelector(state => state.auth);
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
                    {!selectedUniversity ? (
                        <Stack.Screen name="UniversitySelection" component={UniversitySelectionScreen} options={{ headerShown: false }} />
                    ) : (
                        <>
                            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
                            <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />

                            {/* Profile Sub-Screens */}
                            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="LaroCurrency" component={LaroCurrencyScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="SendCoins" component={SendCoinsScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="MyQR" component={MyQRScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="LinkWallet" component={LinkWalletScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ headerShown: false }} />

                            {/* Allow re-selecting university from within Main */}
                            <Stack.Screen name="ChangeUniversity" component={UniversitySelectionScreen} options={{ headerShown: false }} />
                        </>
                    )}
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

function AppContent() {
    const { isDarkMode } = useTheme();
    return (
        <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <RootNavigator />
        </NavigationContainer>
    );
}

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
