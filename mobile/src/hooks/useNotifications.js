import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import axios from 'axios';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Replace with your actual backend URL
const API_URL = 'https://tasas-backend.onrender.com/api';

export const useNotifications = (user) => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);
            if (token && user) {
                registerTokenBackend(token, user.id || user._id);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Handle received notification foreground
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            // Handle interaction
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, [user]);

    const registerTokenBackend = async (token, userId) => {
        try {
            await axios.post(`${API_URL}/pushtoken`, {
                token: token,
                userId: userId
            });
            console.log("Push Token Registered for User:", userId);
        } catch (e) {
            console.log("Error registering token:", e.message);
        }
    };

    return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted for push notifications!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
