import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { authService } from '../utils/authService';

const AuthScreen = ({ onAuthSuccess, theme, activeColors, valueDate, date, lastUpdated, onShowPrivacy, onUnlockRegister, isGiftMode = false, onClose }) => {
    // Modes: 'login', 'register', 'verify', 'success'
    const [mode, setMode] = useState(isGiftMode ? 'register' : 'login');
    const [loading, setLoading] = useState(false);

    // Form Data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [premiumCode, setPremiumCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Comment State
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [submittedComment, setSubmittedComment] = useState(false);

    // Captcha State
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
    const [captchaInput, setCaptchaInput] = useState('');

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ num1: n1, num2: n2, answer: n1 + n2 });
        setCaptchaInput('');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Ingresa correo y contraseña.");
            return;
        }

        setLoading(true);
        try {
            const user = await authService.login(email, password);
            // Instead of immediate success, check if we should ask for comment
            // For now, let's just go to success mode if it's a new registration flow or just direct success
            onAuthSuccess(user);
        } catch (error) {
            if (error.status === 'pendiente') {
                Alert.alert("Cuenta Pendiente", error.message);
                setMode('verify');
            } else {
                Alert.alert("Error", error.message || error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !captchaInput) {
            Alert.alert("Error", "Completa todos los campos.");
            return;
        }

        if (parseInt(captchaInput) !== captcha.answer) {
            Alert.alert("Error", "Captcha incorrecto. Intenta de nuevo.");
            generateCaptcha();
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        Keyboard.dismiss(); // Dismiss keyboard to prevent Android UI crash
        try {
            // Pass isGiftMode as isGiftRegistration
            const res = await authService.register(name, email, password, premiumCode, isGiftMode);

            if (isGiftMode) {
                const mockUser = { id: res.id, name: name, email: email };
                await AsyncStorage.setItem('@auth_user_v1', JSON.stringify(mockUser));
                Alert.alert("¡Registro Exitoso!", res.message || "Tu usuario se activará cuando comience la jornada premium.", [
                    { text: "Continuar", onPress: () => setMode('success') }
                ]);
            } else {
                // Normal flow now behaves like instant success
                const mockUser = { id: res.id || Date.now(), name: name, email: email };
                await AsyncStorage.setItem('@auth_user_v1', JSON.stringify(mockUser));
                // Try logging in instantly if the backend allows it
                try {
                    await authService.login(email, password);
                } catch (e) {
                    // Ignore login fail if backend needs a second for state consistency
                }
                Alert.alert("¡Registro Exitoso!", "Bienvenido a nuestra plataforma.", [
                    { text: "Continuar", onPress: () => setMode('success') }
                ]);
            }
        } catch (error) {
            Alert.alert("Error de Registro", typeof error === 'string' ? error : (error.message || "No se pudo completar el registro"));
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            Alert.alert("Error", "Ingresa el código de 6 dígitos.");
            return;
        }

        setLoading(true);
        try {
            await authService.verify(email, verificationCode);
            // After verification, log them in automatically
            const user = await authService.login(email, password);
            setMode('success'); // Show comment screen
        } catch (error) {
            Alert.alert("Error", error.message || "Error de verificación");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const currentUser = await authService.getUser();
        onAuthSuccess(currentUser || { name, email });
    };

    const handleSubmitComment = async () => {
        const currentUser = await authService.getUser();
        if (!comment.trim()) {
            onAuthSuccess(currentUser || { name, email });
            return;
        }

        setLoading(true);
        try {
            if (currentUser) {
                await authService.addComment(currentUser.id, comment, rating);
                Alert.alert("¡Gracias!", "Tu comentario ha sido enviado.");
            }
            onAuthSuccess(currentUser || { name, email });
        } catch (error) {
            console.log("Comment error", error);
            onAuthSuccess(currentUser || { name, email });
        } finally {
            setLoading(false);
        }
    };

    const renderLogin = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.headerTitle, { color: activeColors.textDark }]}>Bienvenido</Text>

            <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Correo Electrónico"
                    placeholderTextColor={activeColors.secondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Contraseña"
                    placeholderTextColor={activeColors.secondary}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Iniciar Sesión</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => {
                setMode('register');
                generateCaptcha();
            }}>
                <Text style={{ color: activeColors.secondary }}>¿No tienes cuenta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Regístrate</Text></Text>
            </TouchableOpacity>
        </View>
    );

    const renderRegister = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.headerTitle, { color: activeColors.textDark }]}>
                {isGiftMode ? "Obtén tu Pase Premium" : "Crear Cuenta"}
            </Text>

            {isGiftMode && (
                <Text style={{ textAlign: 'center', marginBottom: 20, color: activeColors.secondary }}>
                    Regístrate y déjanos tu opinión para obtener pases premium gratis y acceder a todas las mejoras.
                </Text>
            )}

            <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Nombre Completo"
                    placeholderTextColor={activeColors.secondary}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Correo Electrónico"
                    placeholderTextColor={activeColors.secondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Contraseña (Mín. 6 caracteres)"
                    placeholderTextColor={activeColors.secondary}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: activeColors.textDark, marginRight: 10 }}>
                    {captcha.num1} + {captcha.num2} = ?
                </Text>
                <TextInput
                    style={[styles.input, { flex: 1, color: activeColors.textDark, borderColor: activeColors.border }]}
                    placeholder="Respuesta"
                    placeholderTextColor={activeColors.secondary}
                    keyboardType="numeric"
                    value={captchaInput}
                    onChangeText={setCaptchaInput}
                />
                <TouchableOpacity onPress={generateCaptcha} style={{ marginLeft: 10 }}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Registrarse</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('login')}>
                <Text style={{ color: activeColors.secondary }}>¿Ya tienes cuenta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Inicia Sesión</Text></Text>
            </TouchableOpacity>
        </View>
    );

    const renderVerify = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.headerTitle, { color: activeColors.textDark }]}>Verificar Cuenta</Text>
            <Text style={{ textAlign: 'center', marginBottom: 20, color: activeColors.secondary }}>
                Hemos enviado un código a {email}
            </Text>

            <View style={styles.inputGroup}>
                <Ionicons name="key-outline" size={20} color={activeColors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: activeColors.textDark, borderColor: activeColors.border, textAlign: 'center', letterSpacing: 5, fontSize: 24 }]}
                    placeholder="000000"
                    placeholderTextColor={activeColors.secondary}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                />
            </View>

            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.primary }]} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Verificar</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('login')}>
                <Text style={{ color: activeColors.secondary }}>Volver a Inicio de Sesión</Text>
            </TouchableOpacity>
        </View>
    );

    const handleBack = () => {
        if (mode === 'success') {
            onAuthSuccess({ name, email });
        } else if (mode === 'register' && !isGiftMode) {
            setMode('login');
        } else if (mode === 'verify') {
            setMode('login');
        } else if (onClose) {
            onClose();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: activeColors.bg }]}
        >
            <View style={{ flexDirection: 'row', paddingTop: 15, paddingHorizontal: 20 }}>
                {!(mode === 'success') && (
                    <TouchableOpacity onPress={handleBack} style={{ padding: 5, zIndex: 10 }}>
                        <Ionicons
                            name={(mode === 'login' || isGiftMode) ? "close" : "arrow-back"}
                            size={28}
                            color={activeColors.textDark}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoArea}>
                    <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
                        <Ionicons name="wallet" size={scale(40)} color="white" />
                    </View>
                    <Text style={[styles.appTitle, { color: activeColors.textDark }]}>Finanzas Premium</Text>
                </View>

                {mode === 'login' && renderLogin()}
                {mode === 'register' && renderRegister()}
                {mode === 'verify' && renderVerify()}

                {/* Comment Section (Only if logged in context unavailable here, but usually this screen handles auth) 
                    Actually, the user wants the comment prompt *after* registration. 
                    We should probably handle this in the parent modal or add a "success" mode here.
                    Let's add a success mode.
                */}
                {mode === 'success' && (
                    <View style={styles.formContainer}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Ionicons name="checkmark-circle" size={60} color={theme.primary} />
                            <Text style={[styles.headerTitle, { color: activeColors.textDark, marginTop: 10 }]}>¡Gracias por registrarte!</Text>
                            <Text style={{ textAlign: 'center', color: activeColors.secondary }}>Deja tu comentario para ayudarnos a mejorar.</Text>
                        </View>

                        {/* Rating Stars */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={32}
                                        color="#F59E0B"
                                        style={{ marginHorizontal: 5 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 15, color: activeColors.textDark, borderColor: activeColors.border }]}
                                placeholder="Escribe tu opinión..."
                                placeholderTextColor={activeColors.secondary}
                                multiline
                                numberOfLines={4}
                                value={comment}
                                onChangeText={setComment}
                            />
                        </View>

                        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.primary }]} onPress={handleSubmitComment} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Enviar y Continuar</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkBtn} onPress={handleSkip}>
                            <Text style={{ color: activeColors.secondary }}>Omitir por ahora</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.footerDocs, { marginTop: verticalScale(30) }]}>
                    <TouchableOpacity onPress={onShowPrivacy} style={{ marginTop: 10 }}>
                        <Text style={[styles.legalLinksText, { color: theme.primary }]}>Aviso Legal y Privacidad</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: scale(20) },
    logoArea: { alignItems: 'center', marginBottom: verticalScale(30) },
    logoIcon: { width: scale(80), height: scale(80), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    appTitle: { fontSize: moderateScale(26), fontWeight: '900' },
    formContainer: { width: '100%' },
    headerTitle: { fontSize: moderateScale(22), fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    inputIcon: { position: 'absolute', left: 15, zIndex: 1 },
    input: { flex: 1, height: scale(50), borderWidth: 1, borderRadius: 12, paddingLeft: 45, paddingRight: 15, fontSize: moderateScale(16) },
    mainBtn: { height: scale(50), borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    mainBtnText: { color: 'white', fontSize: moderateScale(16), fontWeight: 'bold' },
    linkBtn: { marginTop: 20, alignItems: 'center' },
    footerDocs: { alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
    lastUpdateText: { fontSize: scale(10), marginBottom: 2 },
    legalLinksText: { fontSize: scale(11), fontWeight: 'bold', textDecorationLine: 'underline' }
});

export default AuthScreen;
