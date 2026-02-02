import React, { useState } from 'react'
import { View, Button, Image, ImageBackground, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native'
import { Stack, Link, router, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '@/components/AuthProvider'

const logoImage = require('assets/images/kajyvy.png')

const signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, isAuthenticated, isLoading } = useAuth();

    const SERVER_URL = 'http://localhost:5000';

    if (isLoading) {
        return (
            <View style={styles.loadingcontainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        )
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)/(accueil)" />
    }

    const SignUpButton = async () => {
        if (!name.trim() || !surname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            await signup(name.trim(), surname.trim(), email.trim(), password);
            Alert.alert('Succès', 'compte créé avec succès');

        } catch (error: unknown) {
            console.error('Signup error:', error);

            let errorMessage = 'Une erreur est survenue lors de l\'inscription';

            if (error instanceof Error) {
                if (error.message.includes('Email déjà utilisé') || error.message.includes('email existe déjà')) {
                    errorMessage = 'Cette adresse email est déjà utilisée';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
                } else {
                    errorMessage = error.message;
                }
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as any).message);
            }

            Alert.alert('Erreur', errorMessage);
        } finally {
            setLoading(false);
        }
    }
        ;


    return (
        <SafeAreaProvider>

            <ScrollView scrollEnabled={true}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20
                }}>
                    <View />
                    <View style={{
                        position: 'absolute',
                        bottom: 150,
                        right: 40,
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: 'black',
                        opacity: 0.03
                    }} />

                    <View style={{ alignItems: 'center', width: '100%' }}>
                        <Image
                            source={logoImage}
                            style={{
                                width: 250,
                                height: 200,
                                marginTop: '10%',


                            }}
                            resizeMode="contain"
                        />
                        <View style={{
                            marginBottom: 40,
                            paddingHorizontal: 20,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontSize: 18,
                                color: 'black',
                                textAlign: 'center',
                                fontWeight: '500',
                                lineHeight: 24
                            }}>
                                Inscrivez-vous pour analyser votre devis
                            </Text>
                        </View>

                        <View style={{
                            width: 320,
                            backgroundColor: 'white',
                            borderRadius: 20,
                            padding: 24,
                            shadowColor: 'black',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 5,
                            elevation: 15,
                            borderWidth: 1,
                            borderColor: '#f0f0f0'
                        }}>
                            <View style={{ marginBottom: 20 }}>

                                <TextInput
                                    keyboardType="email-address"
                                    placeholder="Votre email"
                                    placeholderTextColor="#999"
                                    style={[styles.input, {
                                        fontSize: 16,
                                        color: 'black',
                                        fontWeight: '500',
                                    }]}
                                    onChangeText={setEmail}
                                    value={email}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />

                            </View>
                            <View style={{ marginBottom: 20 }}>

                                <TextInput
                                    keyboardType="default"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    editable={!loading}
                                    placeholder="Nom"
                                    placeholderTextColor="#999"
                                    style={[styles.input, {
                                        fontSize: 16,
                                        color: 'black',
                                        fontWeight: '500'
                                    }]}
                                    onChangeText={setName}
                                    value={name}
                                />

                            </View>
                            <View style={{ marginBottom: 20 }}>

                                <TextInput
                                    keyboardType="default"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    editable={!loading}
                                    placeholder="Prénom(s)"
                                    placeholderTextColor="#999"
                                    style={[styles.input, {
                                        fontSize: 16,
                                        color: 'black',
                                        fontWeight: '500'
                                    }]}
                                    onChangeText={setSurname}
                                    value={surname}
                                />

                            </View>
                            <View style={{ marginBottom: 20 }}>

                                <TextInput
                                    secureTextEntry
                                    placeholder="Votre mot de passe"
                                    placeholderTextColor="#999"
                                    style={[styles.input, {
                                        fontSize: 16,
                                        color: 'black',
                                        fontWeight: '500'
                                    }]}
                                    onChangeText={setPassword}
                                    value={password}
                                />

                            </View>

                            <View style={{ marginBottom: 28 }}>

                                <TextInput
                                    secureTextEntry
                                    editable={!loading}
                                    placeholder=" Confirmez le mot de passe"
                                    placeholderTextColor="#999"
                                    style={[styles.input, {
                                        fontSize: 16,
                                        color: 'black',
                                        fontWeight: '500'
                                    }]}
                                    onChangeText={setConfirmPassword}
                                    value={confirmPassword}

                                />

                            </View>

                            <TouchableOpacity
                                style={[{
                                    width: '100%',
                                    height: 52,
                                    backgroundColor: 'black',
                                    borderRadius: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',

                                    elevation: 8
                                }, loading && { backgroundColor: '#555' }]}
                                disabled={loading}
                                onPress={SignUpButton}
                                activeOpacity={0.9}
                            >
                                {loading ? (<ActivityIndicator size="small" color="#fff" />) : (
                                    <Text style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        letterSpacing: 0.5
                                    }}>S'inscrire</Text>

                                )}

                            </TouchableOpacity>

                            <Link href="/" asChild style={{
                                alignItems: 'center',
                                marginTop: 16
                            }} disabled={loading}>
                                <Text style={{
                                    color: '#666',
                                    fontSize: 14,
                                    textDecorationLine: 'underline'
                                }}>
                                    Vous avez déjà un compte? Connectez-vous.
                                </Text>
                            </Link>
                        </View>

                    </View>
                </View>
            </ScrollView>

            <StatusBar style="dark" translucent={false} />
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        height: 55,
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalBox: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        width: "80%"
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center"
    },
    modalButton: {
        backgroundColor: "grey",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    loadingcontainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
})


export default signup
