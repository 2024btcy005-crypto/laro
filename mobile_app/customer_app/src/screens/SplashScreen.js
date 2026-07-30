import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#006d33" />
            <Text style={styles.brandTitle}>LARO</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#006d33',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 6,
    }
});
