import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#056f36" translucent />
            <Image 
                source={require('../../assets/splash.png')} 
                style={styles.splashImage}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashImage: {
        width: '100%',
        height: '100%',
    }
});
