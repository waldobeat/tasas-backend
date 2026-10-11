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
        let isMounted = true;

        const initNotifications = async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (!isMounted) return;

                setExpoPushToken(token);
                if (token && user) {
                    const userId = user.id || user._id;
                    if (userId) {
                        await registerTokenBackend(token, userId);
                    }
                }
            } catch (e) {
                console.log("Notification init error:", e.message);
            }
        };

        // initNotifications();
        console.log("Notifications registration temporarily disabled for debugging");

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Handle received notification foreground
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            // Handle interaction
        });

        return () => {
            isMounted = false;
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
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
            console.log("Error registering token:", e?.message || e);
        }
    };

    return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
    let token;
    if (!Notifications || typeof Notifications.setNotificationChannelAsync !== 'function') {
        console.log("Notifications module not available");
        return;
    }

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance?.MAX || 4,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (err) {
            console.log("Error setting channel:", err);
        }
    }

    if (Device && Device.isDevice) {
        try {
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
            const tokenRes = await Notifications.getExpoPushTokenAsync();
            token = tokenRes?.data;
        } catch (err) {
            console.log("Error getting push token:", err);
        }
    } else {
        console.log('Must use physical device or Device module missing');
    }

    return token;
}
