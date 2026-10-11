import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { authService } from '../utils/authService';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumType, setPremiumType] = useState(null);

    const checkAuth = async () => {
        const activeUser = await authService.getUser();
        if (activeUser) {
            setUser(activeUser);
            setIsPremium(activeUser.isPremium);
            setPremiumType(activeUser.premiumType);
        } else {
            setIsPremium(false);
            setPremiumType(null);
            setUser(null);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleAuthSuccess = (u) => {
        setUser(u);
        setIsPremium(u.isPremium);
        setPremiumType(u.premiumType);
    };

    const handleLogout = async (onLogoutSuccess) => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: 'destructive',
                    onPress: async () => {
                        await authService.logout();
                        setUser(null);
                        setIsPremium(false);
                        setPremiumType(null);
                        if (onLogoutSuccess) onLogoutSuccess();
                        Alert.alert("¡Hasta pronto!", "Espero verte de vuelta 👋");
                    }
                }
            ]
        );
    };

    const grantPremiumAccess = async (onSuccess) => {
        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
        try {
            let userId = user?.id || user?._id;
            if (userId) {
                const result = await authService.updatePremiumStatus(userId, true, expiresAt, 'free');
                setUser({ ...user, ...result });
                setIsPremium(result.isPremium);
            }
            if (onSuccess) onSuccess(expiresAt);

            Alert.alert(
                "Acceso por Cortesía",
                "Te hemos concedido 6 horas de acceso libre para probar las funciones."
            );
        } catch (error) {
            console.error("Access sync error:", error);
            if (onSuccess) onSuccess(expiresAt);
            Alert.alert("Acceso Concedido", "Disfruta de tus 6 horas de acceso.");
        }
    };

    return {
        user,
        isPremium,
        premiumType,
        checkAuth,
        handleAuthSuccess,
        handleLogout,
        grantPremiumAccess,
        setUser, // Exposed if needed for direct updates
        setIsPremium
    };
};
