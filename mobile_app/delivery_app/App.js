import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import PartnerSetupScreen from './src/screens/auth/PartnerSetupScreen';
import PartnerHomeScreen from './src/screens/PartnerHomeScreen';
import ActiveDeliveryScreen from './src/screens/ActiveDeliveryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileDetailScreen from './src/screens/ProfileDetailScreen';
import DeliveryHistoryScreen from './src/screens/DeliveryHistoryScreen';
import { COLORS } from './src/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray,
                headerShown: false,
                tabBarStyle: {
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.lightGray,
                    backgroundColor: colors.white,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '700',
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={PartnerHomeScreen}
                options={{ title: 'Dashboard' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'My Profile' }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

function AppContent() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [initialRoute, setInitialRoute] = React.useState('Login');
    const { colors, isDarkMode } = useTheme();

    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('deliveryToken');
                const partnerDataStr = await AsyncStorage.getItem('deliveryPartner');
                let partnerProfile = null;
                if (partnerDataStr) {
                    partnerProfile = JSON.parse(partnerDataStr);
                }

                if (token) {
                    if (partnerProfile && !partnerProfile.universityId) {
                        setInitialRoute('PartnerSetup');
                    } else {
                        setInitialRoute('Main');
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <NavigationContainer theme={isDarkMode ? NavDarkTheme : NavDefaultTheme}>
                <Stack.Navigator
                    initialRouteName={initialRoute}
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.white },
                        headerTintColor: colors.black,
                        headerTitleStyle: { fontWeight: 'bold' },
                        headerBackTitleVisible: false,
                        headerShadowVisible: false,
                        contentStyle: { backgroundColor: colors.background }
                    }}
                >
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="PartnerSetup"
                        component={PartnerSetupScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Main"
                        component={TabNavigator}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ActiveDelivery"
                        component={ActiveDeliveryScreen}
                        options={{ title: 'Live Order' }}
                    />
                    <Stack.Screen
                        name="ProfileDetail"
                        component={ProfileDetailScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="DeliveryHistory"
                        component={DeliveryHistoryScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
