import { StackScreenWithSearchBar } from "@/constants/layout"
import { defaultStyles } from "@/styles"
import { Ionicons } from "@expo/vector-icons"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useAuth } from "src/components/AuthProvider"
const logoImage = require('assets/images/kajyvy.png')

const HomeScreenLayout = () => {
    const { isAuthenticated, isLoading, userEmail, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="black" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="black" />
                <Text style={styles.loadingText}>Déconnexion...</Text>
            </View>
        );
    }

    const handleProfilePress = () => {
        console.log('Profile button pressed');
        setShowProfileMenu(true);
    };

    const logoutButton = async () => {
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);
            console.log('Début déconnexion');
            setShowLogoutModal(false);
            setShowProfileMenu(false);

            await logout();

            console.log('Logout terminé');

        } catch (error) {
            console.error('Erreur logout:', error);
        } finally {
      
        }
    };

    if (isLoggingOut) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="black" />
                <Text style={styles.loadingText}>Déconnexion en cours...</Text>
            </View>
        );
    }

    return (
        <View style={defaultStyles.container}>
            <StatusBar style="dark" translucent={false} />
            <Stack>
                <Stack.Screen name="index" options={{
                    ...StackScreenWithSearchBar,
                    headerTitle: () => (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flex: 1,
                            backgroundColor: '#fff'
                        }}>
                            <Image
                                source={logoImage}
                                style={{ width: 100, height: 70, resizeMode: 'contain' }}
                            />
                        </View>
                    ),
                    headerShown: true,
                    headerRight: () => (
                        <Pressable
                            onPress={handleProfilePress}
                            style={({ pressed }) => [
                                styles.profileButton,
                                pressed && styles.profileButtonPressed
                            ]}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                            android_ripple={{ 
                                color: 'rgba(0,0,0,0.1)', 
                                borderless: true,
                                radius: 28 
                            }}
                        >
                            <Ionicons name="person-circle-outline" size={35} color="black" />
                        </Pressable>
                    ),
                }}
                />
            </Stack>

            <Modal
                transparent={true}
                visible={showProfileMenu}
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
                statusBarTranslucent={true}
            >
                <Pressable
                    style={styles.menuOverlay}
                    onPress={() => {
                        setShowProfileMenu(false);
                    }}
                >
                    <Pressable
                        style={styles.menuContainer}
                        onPress={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <View style={styles.menuContent}>
                            <View style={styles.emailContainer}>
                                <Text style={styles.emailText} numberOfLines={1}>
                                    {userEmail}
                                </Text>
                            </View>

                            <View style={styles.menuDivider} />

                            <Pressable
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && styles.menuItemPressed
                                ]}
                                onPress={() => {
                                    setShowProfileMenu(false);
                                    setTimeout(() => {
                                        setShowLogoutModal(true);
                                    }, 300);
                                }}
                            >
                                <Ionicons name="log-out-outline" size={20} color="black" />
                                <Text style={styles.logoutText}>Se déconnecter</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                transparent={true}
                visible={showLogoutModal}
                animationType="fade"
                onRequestClose={() => {
                    if (!isLoggingOut) {
                        setShowLogoutModal(false);
                    }
                }}
                statusBarTranslucent={false}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            Voulez-vous vraiment vous déconnecter ?
                        </Text>

                        <View style={styles.modalButtonContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.modalButton,
                                    styles.confirmButton,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={logoutButton}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Oui</Text>
                                )}
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.modalButton,
                                    styles.cancelButton,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={() => {
                                    setShowLogoutModal(false);
                                }}
                                disabled={isLoggingOut}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    profileButton: {
        padding: 8,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 28,
        minWidth: 48,
        minHeight: 48,
    },
    profileButtonPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 80 : 70,
        right: 10,
        minWidth: 250,
        zIndex: 1000,
        elevation: 10,
    },
    menuContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    emailText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderRadius: 8,
    },
    menuItemPressed: {
        backgroundColor: '#f0f0f0',
    },
    logoutText: {
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 12,
        width: "80%",
        maxWidth: 400,
        alignItems: "center",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 24,
        textAlign: 'center',
        color: '#333',
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    confirmButton: {
        backgroundColor: "#333"
    },
    cancelButton: {
        backgroundColor: "gray"
    },
    confirmButtonText: {
        color: "#fff",
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButtonText: {
        color: "#fff",
        fontWeight: '600',
        fontSize: 16,
    }
});

export default HomeScreenLayout;