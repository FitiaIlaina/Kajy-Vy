import { Entypo, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Modal, Image, Button, Dimensions, Linking } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const logo = require('assets/images/kajyvy.png')

const AboutScreen = () => {
    const handleImagePress = () => {
        const email = 'fandriamalala3@gmail.com'; 
        const subject = 'Contact depuis l\'application';
        const body = 'Bonjour,\n\nJe vous contacte depuis votre application.';
        
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        Linking.openURL(mailtoUrl).catch(err => {
            Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
        });
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.imageBanner} 
                onPress={handleImagePress}
                activeOpacity={0.8}
            >
                <Image
                    source={logo} 
                    style={styles.bannerImage}
                    resizeMode="contain"
                />
                
                <View style={styles.emailOverlay}>
                    <MaterialIcons name="email" size={24} color="white" />
                    <Text style={styles.contactText}>Contactez-nous</Text>
                </View>
            </TouchableOpacity>
            
         
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>À propos</Text>
                <Text style={{ fontSize: 13, marginBottom: 16 }}>
                   Cette application permet d'analyser et d'afficher le devis de votre structure métallique (porte & fenêtre, grille de protection), en insérant votre photo ou en dessinant votre modèle.
                </Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Version</Text>
                <Text style={{ fontSize: 16, marginBottom: 24 }}>1.0</Text>
                <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 32 }}>
                    © {new Date().getFullYear()} ANDRIAMALALA Fitia Ilaina. Tous droits réservés.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageBanner: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    emailOverlay: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default AboutScreen;