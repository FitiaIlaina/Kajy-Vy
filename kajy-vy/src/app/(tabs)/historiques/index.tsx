
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Devis, useDevis } from 'src/contexts/DevisContext';
import MobileSVGRenderer from '../(accueil)/MobileSVGRenderer';
import SVGRenderer from '../(accueil)/SVGRenderer';



const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


interface AnalysisResult {
    type: 'porte' | 'grille';
    prix_total: number;
    dimensions: {
        hauteur_m: number;
        largeur_m: number;
    };
    details: {
        bati?: {
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        cadre?: {
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        tole?: {
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        decoration?: {
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        main_oeuvre: number;
        majoration_30p?: number;
    };
    barres_cadre?: number[];
    barres_deco?: number[];
    svg_path: string;
    message: string;
    timestamp: string;
    svgContent?: string;
}

const HistoryScreen = () => {
    const [search, setSearch] = useState('');
    const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const { state, deleteDevis, clearDevis, refreshDevis } = useDevis();
    const { devis, isLoading } = state;

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [devisToDelete, setDevisToDelete] = useState<{ id: string, title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [clearAllModalVisible, setClearAllModalVisible] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const [fullscreen, setFullscreen] = useState(false);


    useEffect(() => {
        refreshDevis();
    }, []);
    const handleDelete = (id: string, title: string) => {
        setDevisToDelete({ id, title });
        setDeleteModalVisible(true);
    };
    const confirmDelete = async () => {
        if (!devisToDelete) return;

        setIsDeleting(true);
        try {
            await deleteDevis(devisToDelete.id);
            console.log('Suppression réussie');
            setDeleteModalVisible(false);
            setDevisToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            Alert.alert('Erreur', 'Impossible de supprimer le devis');
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        console.log('Suppression annulée');
        setDeleteModalVisible(false);
        setDevisToDelete(null);
    };

    const handleClearALl = () => {
        if (devis.length === 0) return;
        setClearAllModalVisible(true);
    };

    const confirmClearAll = async () => {
        setIsClearing(true);
        try {
            await clearDevis();
            console.log('Suppression de tous les devis réussie');
            setClearAllModalVisible(false);
        } catch (error) {
            console.error('Erreur lors de la suppression de tous les devis:', error);
            Alert.alert('Erreur', 'Impossible de supprimer tous les devis');
        } finally {
            setIsClearing(false);
        }
    };

    const cancelClearAll = () => {
        console.log('Suppression de tous les devis annulée');
        setClearAllModalVisible(false);
    };



    const AfficherDetailDevis = (devis: Devis) => {
        setSelectedDevis(devis);
        setDetailModalVisible(true);
    };


    const PdfHistory = async (devis: Devis) => {
        try {
            console.log('=== GÉNÉRATION PDF ===');
            console.log('Platform:', Platform.OS);
            console.log('Devis:', devis.title);

            const surface = devis.dimensions.surface.toFixed(2);

            // Générer le HTML des détails
            let detailsHTML = '';

            if (devis.details) {
                // BÂTI
                if (devis.details.bati) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Bâti (${devis.details.bati.type_bati || 0})</h3>
                    <div class="detail-row">
                        <span>Nombre de barre(s):</span>
                        <span>${devis.details.bati.longueur_totale_cm || 0} </span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(devis.details.bati.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(devis.details.bati.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // CADRE
                if (devis.details.cadre) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Cadre (${devis.details.cadre.type_cadre || 0})</h3>
                    <div class="detail-row">
                        <span>Nombre de barre(s):</span>
                        <span>${devis.details.cadre.longueur_totale_cm || 0} </span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(devis.details.cadre.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(devis.details.cadre.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // TÔLE
                if (devis.details.tole) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3> Tôle (${devis.details.tole.type_tole || 0})</h3>
                    <div class="detail-row">
                        <span>Mesure totale:</span>
                        <span>${devis.details.tole.longueur_totale_cm || 0} cm</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(devis.details.tole.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(devis.details.tole.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // DÉCORATION
                if (devis.details.decoration) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3> Décoration (${devis.details.decoration.type_decoration || 0}))</h3>
                    <div class="detail-row">
                        <span>Nombre de barre(s):</span>
                        <span>${devis.details.decoration.longueur_totale_cm || 0} </span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(devis.details.decoration.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(devis.details.decoration.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }




                if (devis.details.majoration_30p) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3> Majoration 35%</h3>
                    <div class="detail-row">
                        <span>Montant:</span>
                        <span class="detail-price">${(devis.details.majoration_30p || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }
            }

            if (!detailsHTML) {
                detailsHTML = '<div class="no-details"><strong> Aucun détail disponible</strong></div>';
            }

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Devis ${devis.title}</title>
    <style>
        body { 
            font-family: Arial; 
            
             line-height: 1.6; 
             color: #333; }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
           }
        .header h1 { color: #333; font-size: 22px;  }
        .company { color: #666; font-size: 14px; }
        .info { background: #f8f9fa;border-radius: 8px; }
        .price { border: 3px solid black; color: black; border-radius: 8px; text-align: center;  }
        .detail-card {   border-radius: 5px;  }
        .detail-row { display: flex; justify-content: space-between; }
        .detail-price { font-weight: bold; color: #333; }
    </style>
</head>
<body>

    <div class="header">
    
        <h1>DEVIS ${devis.type.toUpperCase()}</h1>
        <div class="company">ACAMECA</div>
    </div>

    
    <div class="info">
        <p><strong>Titre:</strong> ${devis.title}</p>
        <p><strong>Date:</strong> ${new Date(devis.timestamp).toLocaleDateString('fr-FR')}</p>
        <p><strong>Type:</strong> ${devis.type}</p>
        <p><strong>Dimensions:</strong> ${devis.dimensions.largeur} m × ${devis.dimensions.hauteur} m</p>
        <p><strong>Surface:</strong> ${surface} m²</p>
    </div>
    
    
    
    <h2>Détails de l'analyse</h2>
    ${detailsHTML}
    
<div class="price">
        <div style="font-size: 14px; ">PRIX TOTAL ESTIMÉ</div>
        <div style="font-size: 24px; font-weight: bold;">${devis.prix_total.toLocaleString()} Ar</div>
    </div>

    <div style="text-align: center; color: #666; border-top: 1px solid #eee; ">
        <p>Document créé le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Kajy-Vy</strong></p>
    </div>
</body>
</html>`;
            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();

                    printWindow.onload = () => {
                        printWindow.print();
                        printWindow.close();
                    };

                    Alert.alert(
                        'Impression',
                        'Une nouvelle fenêtre s\'est ouverte. Utilisez Ctrl+P puis "Enregistrer au format PDF" pour sauvegarder votre devis.'
                    );
                } else {
                    Alert.alert('Erreur', 'Impossible d\'ouvrir la fenêtre d\'impression');
                }
            } else {
                // SOLUTION MOBILE: Utiliser expo-print
                const result = await Print.printToFileAsync({
                    html,
                    base64: false
                });

                console.log('PDF généré:', result.uri);

                if (result?.uri) {
                    const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                        await Sharing.shareAsync(result.uri, {
                            mimeType: 'application/pdf',
                            dialogTitle: 'Partager le devis PDF'
                        });
                    } else {
                        Alert.alert('Partage non disponible', 'Le partage n\'est pas disponible sur cet appareil');
                    }
                } else {
                    Alert.alert('Erreur', 'Impossible de générer le PDF');
                }
            }


        } catch (error) {
            console.error('Erreur PDF:', error);
            Alert.alert('Erreur', 'Impossible de générer le PDF');
        }
    };

    const filteredDevis = devis.filter(item => {
        const searchLower = search.toLowerCase();
        const date = new Date(item.timestamp);
        const dateString = date.toLocaleDateString('fr-FR');
        const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        return (
            item.title.toLowerCase().includes(searchLower) ||
            item.type.toLowerCase().includes(searchLower) ||
            dateString.includes(searchLower) ||
            timeString.includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#333" />
                    <Text style={styles.loadingText}>Chargement de l'historique...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un devis..."
                    value={search}
                    onChangeText={setSearch}
                />

                {devis.length > 0 && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={refreshDevis}
                        >
                            <Ionicons name="refresh" size={20} color="black" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clearAllButton}
                            onPress={handleClearALl}
                        >
                            <MaterialIcons name="delete-sweep" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>



            <ScrollView style={styles.scrollView}>
                {filteredDevis.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.devisItem}
                        onPress={() => AfficherDetailDevis(item)}
                    >
                        <View style={styles.devisContent}>
                            <View style={styles.devisHeader}>
                                <Text style={styles.title}>{item.title}</Text>

                            </View>

                            <Text style={styles.date}>
                                Créé le {new Date(item.timestamp).toLocaleDateString('fr-FR')} à {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>

                            <View style={styles.devisDetails}>



                            </View>
                        </View>

                        <View style={styles.devisActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => PdfHistory(item)}
                            >
                                <MaterialIcons name="picture-as-pdf" size={20} color="#333" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDelete(item.id, item.title)}
                            >
                                <Entypo name="trash" size={20} color="#d11a2a" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredDevis.length === 0 && !isLoading && (
                    <View style={styles.emptyContainer}>
                        {search ? (
                            <Text style={styles.emptyText}>
                                Aucun devis trouvé pour "{search}".
                            </Text>
                        ) : (
                            <>
                                <MaterialIcons name="history" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    Aucun devis dans l'historique.
                                </Text>
                                <Text style={styles.emptySubText}>
                                    Créez votre premier devis depuis l'écran principal !
                                </Text>
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={cancelDelete}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModalContainer}>
                        <View style={styles.deleteModalHeader}>
                            <Text style={styles.deleteModalTitle}>Supprimer le devis</Text>
                        </View>

                        <Text style={styles.deleteModalMessage}>
                            Êtes-vous sûr de vouloir supprimer le devis "{devisToDelete?.title}" ?
                        </Text>



                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelDelete}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                                onPress={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={clearAllModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={cancelClearAll}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModalContainer}>
                        <View style={styles.deleteModalHeader}>

                            <Text style={styles.deleteModalTitle}>Supprimer tous les devis</Text>
                        </View>

                        <Text style={styles.deleteModalMessage}>
                            Êtes-vous sûr de vouloir supprimer tous les {devis.length} devis ?
                        </Text>


                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelClearAll}
                                disabled={isClearing}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.clearAllButton_modal, isClearing && styles.deleteButtonDisabled]}
                                onPress={confirmClearAll}
                                disabled={isClearing}
                            >
                                {isClearing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.clearAllButtonText}>Tout Supprimer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            <Modal
                visible={detailModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                {selectedDevis && (
                    <SafeAreaView style={styles.modalContainer}>
                        <ScrollView style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Détails du devis</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setDetailModalVisible(false)}
                                >
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>


                            {/* Image originale ou Dessin SVG */}
                            {(selectedDevis.imageUri || selectedDevis.svgContent) && (
                                <View style={styles.imageContainer}>
                                    <Text style={styles.sectionTitle}>
                                        {selectedDevis.method === 'photo' ? 'Image originale' : 'Dessin réalisé'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setFullscreen(true)}>
                                        {selectedDevis.method === 'photo' ? (
                                            <Image
                                                source={{ uri: selectedDevis.imageUri }}
                                                style={styles.previewImage}
                                                resizeMode="cover"
                                            />
                                        ) : (

                                            Platform.OS === 'web' ? (
                                                <SVGRenderer svg={selectedDevis.svgContent || ''} width={300} height={250} />
                                            ) : (
                                                <MobileSVGRenderer svg={selectedDevis.svgContent || ''} width={300} height={250} />
                                            )

                                        )}
                                    </TouchableOpacity>

                                    <Modal visible={fullscreen} transparent={true}>
                                        <TouchableOpacity
                                            style={styles.fullscreenContainer}
                                            onPress={() => setFullscreen(false)}
                                            activeOpacity={1}
                                        >
                                            {selectedDevis.method === 'photo' ? (
                                                <Image
                                                    source={{ uri: selectedDevis.imageUri }}
                                                    style={styles.fullscreenImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                Platform.OS === 'web' ? (
                                                    <SVGRenderer
                                                        svg={selectedDevis.svgContent || ''}
                                                        width={screenWidth}
                                                        height={screenHeight * 0.8}
                                                    />
                                                ) : (
                                                    <MobileSVGRenderer
                                                        svg={selectedDevis.svgContent || ''}
                                                        width={screenWidth}
                                                        height={screenHeight * 0.8}
                                                    />
                                                )
                                            )}
                                        </TouchableOpacity>
                                    </Modal>
                                </View>
                            )}

                            <View style={styles.generalInfo}>
                                <Text style={styles.cardTitle}>{selectedDevis.title}</Text>
                                <Text style={styles.cardSubtitle}>
                                    {selectedDevis.method === 'photo' ? 'Analyse photo' : 'Dessin manuel'}
                                </Text>
                                <Text style={styles.dateInfo}>
                                    Créé le {new Date(selectedDevis.timestamp).toLocaleDateString('fr-FR')} à{' '}
                                    {new Date(selectedDevis.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={styles.dimensionsText}>
                                    Dimensions: {selectedDevis.dimensions.hauteur} m × {selectedDevis.dimensions.largeur} m
                                </Text>
                            </View>

                            {/* Résultat de l'analyse */}
                            <View style={styles.analysisContainer}>
                                <Text style={styles.analysisTitle}>
                                    Résultat - {selectedDevis.type?.toUpperCase() || 'Structure'}
                                </Text>

                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceLabel}>Prix total estimé</Text>
                                    <Text style={styles.priceValue}>{selectedDevis.prix_total?.toLocaleString() || 'N/A'} Ar</Text>
                                </View>

                                {selectedDevis.details?.bati && (
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailTitle}>
                                            Bâti {selectedDevis.details.bati.type_bati ? `(${selectedDevis.details.bati.type_bati})` : ''}
                                        </Text>
                                        <Text style={styles.detailText}>• Nombre de barre(s) : {selectedDevis.details.bati.longueur_totale_cm?.toLocaleString()}</Text>
                                        <Text style={styles.detailText}>• Prix : {selectedDevis.details.bati.prix_fer?.toLocaleString()} Ar</Text>
                                        <Text style={styles.detailText}>• Prix peinture : {selectedDevis.details.bati.prix_peinture?.toLocaleString()} Ar</Text>
                                    </View>
                                )}

                                {selectedDevis.details?.cadre && (
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailTitle}>
                                            Cadre {selectedDevis.details.cadre.type_cadre ? `(${selectedDevis.details.cadre.type_cadre})` : ''}
                                        </Text>
                                        <Text style={styles.detailText}>• Nombre de barre(s): {selectedDevis.details.cadre.longueur_totale_cm}</Text>
                                        <Text style={styles.detailText}>• Prix fer: {selectedDevis.details.cadre.prix_fer?.toLocaleString()} Ar</Text>
                                        <Text style={styles.detailText}>• Prix peinture: {selectedDevis.details.cadre.prix_peinture?.toLocaleString()} Ar</Text>
                                    </View>
                                )}

                                {selectedDevis.details?.tole && (
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailTitle}>
                                            Tôle {selectedDevis.details.tole.type_tole ? `(${selectedDevis.details.tole.type_tole})` : ''}
                                        </Text>
                                        <Text style={styles.detailText}>• Mesure totale: {selectedDevis.details.tole.longueur_totale_cm} cm</Text>
                                        <Text style={styles.detailText}>• Prix fer: {selectedDevis.details.tole.prix_fer?.toLocaleString()} Ar</Text>
                                        <Text style={styles.detailText}>• Prix peinture: {selectedDevis.details.tole.prix_peinture?.toLocaleString()} Ar</Text>
                                    </View>
                                )}

                                {selectedDevis.details?.decoration && (
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailTitle}>
                                            Décoration {selectedDevis.details.decoration.type_decoration ? `(${selectedDevis.details.decoration.type_decoration})` : ''}
                                        </Text>
                                        <Text style={styles.detailText}>• Nombre de barre(s): {selectedDevis.details.decoration.longueur_totale_cm}</Text>
                                        <Text style={styles.detailText}>• Prix fer: {selectedDevis.details.decoration.prix_fer?.toLocaleString()} Ar</Text>
                                        <Text style={styles.detailText}>• Prix peinture: {selectedDevis.details.decoration.prix_peinture?.toLocaleString()} Ar</Text>
                                    </View>
                                )}

                                {selectedDevis.details?.majoration_30p && (
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailTitle}>Majoration (35%)</Text>
                                        <Text style={styles.detailText}>• Prix: {selectedDevis.details.majoration_30p.toLocaleString()} Ar</Text>
                                    </View>
                                )}


                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 7,
        backgroundColor: '#fff',
        fontSize: 13,
    },
    actionButtons: {
        flexDirection: 'row',
        marginLeft: 12,
        gap: 8,
    },
    refreshButton: {
        padding: 8,
    },
    clearAllButton: {
        padding: 8,
    },
    statsContainer: {
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statsText: {
        fontSize: 14,
        color: '#1976d2',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        padding: 16,
        marginBottom: 45
    },
    devisItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    devisContent: {
        flex: 1,
    },
    devisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    analysisContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    analysisTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    generalInfo: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    dateInfo: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    dimensionsText: {
        fontSize: 14,
        color: '#444',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    typeBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    devisDetails: {
        gap: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#444',
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
    },
    methodText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    devisActions: {
        gap: 12,
        flexDirection: 'row',
    },
    actionButton: {
        padding: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        fontSize: 16,
        marginTop: 16,
    },
    emptySubText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        marginTop: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    detailCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginTop: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    priceContainer: {
        borderColor: 'grey',
        borderWidth: 3,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    priceLabel: {
        fontSize: 14,
        color: 'black',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    imageContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    dimensionsContainer: {
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    deleteModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    deleteModalMessage: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
        lineHeight: 22,
    },
    deleteModalWarning: {
        fontSize: 14,
        color: '#ff6b35',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    deleteButtonDisabled: {
        backgroundColor: '#grey',
        opacity: 0.7,
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },

    clearAllButton_modal: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    clearAllButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    detailItem: {
        padding: 5,
        borderRadius: 8,
        marginBottom: 12,

    },
    detailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'grey',
        marginBottom: 8,
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: {
        width: "100%",
        height: "100%",
    },
    svgContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        overflow: 'hidden',
    },
    previewWebView: {
        width: '100%',
        height: 200,
        backgroundColor: 'transparent',
    },
    fullscreenSvgContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    fullscreenWebView: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },

});

export default HistoryScreen;