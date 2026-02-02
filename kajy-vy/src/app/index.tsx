import React, { useState } from 'react'
import { View, Button, Image, ImageBackground, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator } from 'react-native'
import { Stack, Link, useRouter, router, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '@/components/AuthProvider'

const logoImage = require('assets/images/kajyvy.png')

const App = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [modalRemplir, setModalRemplir] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated, isLoading } = useAuth();

    const SERVER_URL = 'http://localhost:5000';

    if (isLoading) {
        return (
            <View style={styles.loadingcontainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        )
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)/(accueil)" />;
    }


    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        try{
            await login(email.trim(), password);
        Alert.alert('Succès', 'Connexion réussie');
        }catch(error){
            Alert.alert('Erreur', 'Échec de la connexion. Vérifiez vos informations.');
        }finally{
            setLoading(false);
        }
    }
    return (
        <SafeAreaProvider>

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
                            marginBottom: -5,

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
                            Connectez-vous pour accéder à Kajy-Vy.
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
                                    fontWeight: '500'
                                }]}
                                onChangeText={setEmail}
                                value={email}
                                autoCapitalize='none'
                                autoCorrect={false}
                                editable={!loading}
                            />

                        </View>

                        <View style={{ marginBottom: 28 }}>
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
                                editable={!loading}
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
                            }, loading && { backgroundColor: '#999' }]}

                            onPress={handleLogin}
                            activeOpacity={0.9}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    letterSpacing: 0.5
                                }}>Se connecter</Text>

                            )}

                        </TouchableOpacity>

                        <Link href="/signup" asChild style={{
                            alignItems: 'center',
                            marginTop: 16
                        }} disabled={loading}>
                            <Text style={{
                                color: '#666',
                                fontSize: 14,
                                textDecorationLine: 'underline'
                            }}>
                                Vous n'avez pas encore de compte? Inscrivez-vous.
                            </Text>
                        </Link>
                    </View>


                </View>
            </View>
            <Modal
                transparent
                animationType="fade"
                visible={modalRemplir}
                onRequestClose={() => setModalRemplir(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalText}> Veuillez remplir tous les champs .</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setModalRemplir(false)}
                        >
                            <Text style={{ color: "#fff" }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </Modal>

            <StatusBar style="dark" translucent={false} />

        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        alignItems: "center",
        height: 55
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


export default App
