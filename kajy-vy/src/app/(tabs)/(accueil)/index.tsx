import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from 'react-native-webview';
import { useDevis } from 'src/contexts/DevisContext';
import SVGRenderer from './SVGRenderer';
import MobileSVGRenderer from './MobileSVGRenderer';
import { useAuth } from "src/components/AuthProvider"


interface AnalysisResult {
    type: 'porte' | 'grille';
    prix_total: number;
    dimensions: {
        hauteur_m: number;
        largeur_m: number;
    };
    types_selectionnes: {
        bati?: string;
        cadre?: string;
        decoration?: string;
        tole?: string;
    };
    details: {
        bati?: {
            type_bati?: string;
            typeBati: string,
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        cadre?: {
            type_cadre?: string;
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        tole?: {
            type_tole?: string;
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        decoration?: {
            type_decoration?: string;
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
}

interface TabsProps {
    activeTab: string;
    onTabChange: (key: string) => void;
    tabs: Array<{
        key: string;
        label: string;
        content: React.ReactNode;
    }>;
}

const CustomTabs: React.FC<TabsProps> = ({ activeTab, onTabChange, tabs }) => {
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabHeader,
                            activeTab === tab.key && styles.activeTabHeader,
                        ]}
                        onPress={() => onTabChange(tab.key)}
                    >
                        <Text
                            style={[
                                styles.tabHeaderText,
                                activeTab === tab.key && styles.activeTabHeaderText,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.tabContent}>
                {tabs.find(tab => tab.key === activeTab)?.content}
            </View>
        </View>
    )
};

const HomeScreen = () => {

    const { userEmail } = useAuth();

    const [longueur, setLongueur] = useState('');
    const [hauteur, setHauteur] = useState('');
    const [typeStructure, setTypeStructure] = useState<'auto' | 'porte' | 'grille'>('auto');

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisVisible, setAnalysisVisible] = useState(false);
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('1');


    const [typeCadre, setTypeCadre] = useState("");
    const [typeBati, setTypeBati] = useState("");
    const [typeDeco, setTypeDeco] = useState("");
    const [typeTole, setTypeTole] = useState("");
    const [typeVolet, setTypeVolet] = useState("")

    const [listBati, setListBati] = useState<any[]>([]);
    const [listCadrePorte, setListCadrePorte] = useState<any[]>([]);
    const [listCadreGrille, setListCadreGrille] = useState<any[]>([]);
    const [listDecoration, setListDecoration] = useState<any[]>([]);
    const [listTole, setListTole] = useState<any[]>([]);

    const SERVER_URL = 'http://localhost:5000';

    let devisContext;
    try {
        devisContext = useDevis();
    } catch (error) {
        console.error('Error accessing DevisContext:', error);
        devisContext = {
            state: { devis: [], isLoading: false },
            addDevis: async () => {
                console.warn('DevisContext not available - addDevis called');
            },
            deleteDevis: async () => { },
            updateDevis: async () => { },
            clearDevis: async () => { },
            refreshDevis: () => { },
        };
    }

    const { addDevis } = useDevis();

    const pickImage = async () => {

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de l\'autorisation pour accéder à vos photos');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setAnalysisResult(null);
            setAnalysisVisible(false);
            setSvgContent(null);
            setActiveTab('1');
        }
    };

    const PickerTypeFerData = async () => {
        const batiResp = await fetch(`${SERVER_URL}/bati`);
        if (batiResp.ok) {
            const batiData = await batiResp.json();
            setListBati(batiData);
        }

        const cadrePorteResp = await fetch(`${SERVER_URL}/cadre`);
        if (cadrePorteResp.ok) {
            const cadrePorteData = await cadrePorteResp.json();
            setListCadrePorte(cadrePorteData);
        }

        const cadreGrilleResp = await fetch(`${SERVER_URL}/cadre-grille`);
        if (cadreGrilleResp.ok) {
            const cadreGrilleData = await cadreGrilleResp.json();
            setListCadreGrille(cadreGrilleData);
        }

        const decoResp = await fetch(`${SERVER_URL}/decoration`);
        if (decoResp.ok) {
            const decoData = await decoResp.json();
            setListDecoration(decoData);
        }

        const toleResp = await fetch(`${SERVER_URL}/tole`);
        if (toleResp.ok) {
            const toleData = await toleResp.json();
            setListTole(toleData);
        }
    }

    useEffect(() => {
        PickerTypeFerData();
    }, []);

    const analyzeImage = async () => {
        if (!imageUri) {
            Alert.alert('Erreur', 'Veuillez sélectionner une image d\'abord');
            return;
        }

        if (!longueur || !hauteur) {
            Alert.alert('Erreur', 'Veuillez entrer les dimensions avant l\'analyse');
            return;
        }
        if (typeStructure === 'porte') {
            if (!typeCadre || !typeBati || !typeTole || !typeVolet) {
                Alert.alert('Erreur', 'Veuillez sélectionner le type de bâti et de cadre pour une porte');
                return;
            }
        } else if (typeStructure === 'grille') {
            if (!typeCadre) {
                Alert.alert('Erreur', 'Veuillez sélectionner le type de cadre pour une grille');
                return;
            }
        }

        setLoading(true);

        try {
            
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('image', blob, 'structure.jpg');
            } else {
                formData.append('image', {
                    uri: imageUri,
                    type: 'image/jpeg',
                    name: 'structure.jpg',
                } as any);
            }
            formData.append('hauteur', hauteur);
            formData.append('largeur', longueur);

            formData.append('type', typeStructure);

            formData.append('type_cadre', typeCadre);
            if (typeStructure === 'porte') {
                formData.append('type_bati', typeBati);
                formData.append('type_tole', typeTole);
                formData.append('type_volet', typeVolet);
            }
            formData.append('type_deco', typeDeco);

            console.log('Envoi de la requête vers:', `${SERVER_URL}/analyse`);
            console.log('Dimensions:', longueur, 'x', hauteur);
            console.log('Type de structure:', typeStructure);

            const analyseResponse = await fetch(`${SERVER_URL}/analyse`, {
                method: 'POST',
                body: formData,
            });

            console.log('Statut de la réponse:', analyseResponse.status);

            if (!analyseResponse.ok) {
                const errorText = await analyseResponse.text();
                console.log('Erreur du serveur:', errorText);
                throw new Error(`Erreur HTTP: ${analyseResponse.status} - ${errorText}`);
            }

            const result = await analyseResponse.json();
            
            if (result.error) {
                Alert.alert('Erreur', result.error);
                return;
            }

            setAnalysisResult(result);
            setAnalysisVisible(true);

            try {
                const surface = parseFloat(longueur) * parseFloat(hauteur);
                const devisData = {
                    title: `Devis ${result.type?.toUpperCase() || 'Structure'} - ${new Date().toLocaleDateString('fr-FR')}`,
                    date: new Date().toISOString().split('T')[0],
                    type: result.type || 'porte',
                    prix_total: result.prix_total || 0,
                    user_email: userEmail,
                    dimensions: {
                        hauteur: hauteur || '0',
                        largeur: longueur || '0',
                        surface: surface || 0,
                    },
                    details: result.details || {},

                    types_choisis: {
                        cadre: typeCadre,
                        bati: typeBati,
                        decoration: typeDeco,
                        tole: typeTole,
                        volet: typeVolet,
                    },
                    imageUri: imageUri || '',
                    svgContent: svgContent || undefined,
                    analysisResult: result || {},
                    method: 'photo' as const,
                };

                await addDevis({
                    ...devisData,
                    user_email: userEmail || 'anonyme'
                });
            } catch (contextError) {
                console.warn('Failed to save to context:', contextError);
            }

            if (result.svg_path) {
                try {
                    const svgFileName = result.svg_path;
                    const svgResponse = await fetch(`${SERVER_URL}/upload/${svgFileName}`);
                    if (svgResponse.ok) {
                        const svgText = await svgResponse.text();
                        if (typeof svgText === "string" && svgText.trim() !== "") {
                            setSvgContent(svgText);
                            console.log('SVG chargé avec succès:', svgFileName);
                            setActiveTab('2');
                        } else {
                            console.warn("Le SVG reçu n'est pas du texte:", svgText);
                        }
                        setSvgContent(svgText);
                        console.log('SVG chargé avec succès:', svgFileName);
                        setActiveTab('2');
                    }
                } catch (svgError) {
                    console.warn('Failed to load SVG:', svgError);
                }
            }
            result.type === 'grille' ? 'grille' : 'inconnu';



        } catch (error) {
            console.error('Erreur analyse:', error);
            Alert.alert('Erreur', 'Impossible d\'analyser l\'image. Vérifiez que le serveur Flask est démarré.');
        } finally {
            setLoading(false);
        }


    };

    const handleSend = () => {
        if (!longueur || !hauteur) {
            Alert.alert('Erreur', 'Veuillez entrer les dimensions');
            return;
        }
        if (!imageUri) {
            Alert.alert('Erreur', 'Veuillez sélectionner une image');
            return;
        }
        setModalVisible(true);
    };

    const createSVGWebViewContent = (svg: string) => {
        // Nettoyer le SVG
        let cleanedSvg = svg
            .replace(/<\?xml.*?\?>/, "")
            .replace(/<!DOCTYPE.*?>/, "")
            .trim();

        // Extraire viewBox
        const viewBoxMatch = cleanedSvg.match(/viewBox="([^"]+)"/);
        let viewBoxValue = viewBoxMatch ? viewBoxMatch[1] : "0 0 700 450";

        // Forcer les bons attributs
        if (cleanedSvg.includes('<svg')) {
            cleanedSvg = cleanedSvg.replace(
                /<svg[^>]*>/,
                `<svg viewBox="${viewBoxValue}" xmlns="http://www.w3.org/2000/svg">`
            );
        }

        return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
        width: 100%; 
        height: 100%; 
        overflow: hidden;
        background: #fff;
    }
    .container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
    }
    svg {
        max-width: 100%;
        max-height: 100%;
        width: auto !important;
        height: auto !important;
    }
  </style>
</head>
<body>
    <div class="container">
        ${cleanedSvg}
    </div>
</body>
</html>`;
    };

    const handleDownloadPDF = async () => {
        try {
            const surface = longueur && hauteur ? (parseFloat(longueur) * parseFloat(hauteur)).toFixed(2) : '0';

            if (!longueur || !hauteur) {
                Alert.alert('Erreur', 'Dimensions manquantes');
                return;
            }

            let detailsHTML = '';

            if (analysisResult?.details) {
                // BÂTI
                if (analysisResult?.details.bati) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Bâti (${analysisResult?.details.bati.type_bati || 0})</h3>
                    <div class="detail-row">
                        <span>Nombre de barre(s):</span>
                        <span>${analysisResult?.details.bati.longueur_totale_cm || 0}</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(analysisResult?.details?.bati.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(analysisResult?.details.bati.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // CADRE
                if (analysisResult?.details.cadre) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Cadre (${analysisResult?.details.cadre.type_cadre || 0})</h3>
                    <div class="detail-row">
                        <span>Nombre de barre(s):</span>
                        <span>${analysisResult?.details.cadre.longueur_totale_cm || 0} </span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(analysisResult?.details.cadre.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(analysisResult?.details.cadre.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // TÔLE
                if (analysisResult?.details.tole) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Tôle (${analysisResult?.details.tole.type_tole || 0})</h3>
                    <div class="detail-row">
                        <span>Mesure totale:</span>
                        <span>${analysisResult?.details.tole.longueur_totale_cm || 0} cm</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(analysisResult?.details.tole.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(analysisResult?.details.tole.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // DÉCORATION
                if (analysisResult?.details.decoration) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Décoration (${analysisResult?.details.decoration.type_decoration || 0})</h3>
                    <div class="detail-row">
                        <span>Nombre de barre:</span>
                        <span>${analysisResult?.details.decoration.longueur_totale_cm || 0}</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix fer:</span>
                        <span class="detail-price">${(analysisResult?.details.decoration.prix_fer || 0).toLocaleString()} Ar</span>
                    </div>
                    <div class="detail-row">
                        <span>Prix peinture:</span>
                        <span class="detail-price">${(analysisResult?.details.decoration.prix_peinture || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // MAIN D'OEUVRE
                if (analysisResult?.details.main_oeuvre) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Main d'œuvre pour la peinture</h3>
                    <div class="detail-row">
                        <span>Montant:</span>
                        <span class="detail-price">${(analysisResult?.details.main_oeuvre || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }

                // MAJORATION
                if (analysisResult?.details.majoration_30p) {
                    detailsHTML += `
                <div class="detail-card">
                    <h3>Majoration 30%</h3>
                    <div class="detail-row">
                        <span>Montant:</span>
                        <span class="detail-price">${(analysisResult?.details.majoration_30p || 0).toLocaleString()} Ar</span>
                    </div>
                </div>`;
                }
            }

            if (!detailsHTML) {
                detailsHTML = '<div class="no-details"><strong>Aucun détail disponible</strong></div>';
            }

            // Generate a proper title for the PDF
            const pdfTitle = `Devis ${analysisResult?.type?.toUpperCase() || 'Structure'} - ${new Date().toLocaleDateString('fr-FR')}`;

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Devis ${analysisResult?.type?.toUpperCase() || 'Structure'}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .header h1 { 
            color: #333; 
            font-size: 22px; 
            margin-bottom: 5px; 
        }
        .company { 
            color: #666; 
            font-size: 14px; 
        }
        .info { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0; 
        }
        .info p {
            margin: 5px 0;
        }
        .price { 
            border: 3px solid black; 
            color: black; 
            padding: 8px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0; 
        }
        .detail-card { 
            background: #f8f9fa; 
            
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .detail-card h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #333;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            
        }
        .detail-price { 
            font-weight: bold; 
            color: #333; 
        }
        .no-details {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .footer {
            margin-top: 10px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
            
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DEVIS ${analysisResult?.type?.toUpperCase() || 'STRUCTURE'}</h1>
        <div class="company">ACAMECA</div>
    </div>

    <div class="info">
        <p><strong>Titre:</strong> ${pdfTitle}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Type:</strong> ${analysisResult?.type || 'Non défini'}</p>
        <p><strong>Dimensions:</strong> ${longueur} m × ${hauteur} m</p>
        <p><strong>Surface:</strong> ${surface} m²</p>
    </div>
    
   
    
    <h2>Détails de l'analyse</h2>
    ${detailsHTML}

     <div class="price">
        <div style="font-size: 14px; margin-bottom: 8px;">PRIX TOTAL ESTIMÉ</div>
        <div style="font-size: 24px; font-weight: bold;">${analysisResult?.prix_total?.toLocaleString() || 'N/A'} Ar</div>
    </div>
    
    <div class="footer">
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

    const renderAnalysisDetails = () => {
        if (!analysisResult) return null;

        const { type, details, prix_total } = analysisResult;

        return (
            <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>
                    Résultat- {type?.toUpperCase() || 'Structure'}
                </Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Prix total estimé</Text>
                    <Text style={styles.priceValue}>{prix_total?.toLocaleString() || 'N/A'} Ar</Text>
                </View>


                {details?.bati && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>
                            Bâti {details.bati.type_bati ? `(${details.bati.type_bati})` : ''}
                        </Text>
                        <Text>• Nombre de barre(s) : {details.bati.longueur_totale_cm?.toLocaleString()} </Text>
                        <Text>• Prix : {details.bati.prix_fer?.toLocaleString()} Ar</Text>
                        <Text>• Prix peinture : {details.bati.prix_peinture?.toLocaleString()} Ar</Text>
                    </View>
                )}

                {details?.cadre && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>Cadre {details.cadre.type_cadre ? `(${details.cadre.type_cadre})` : ''}</Text>
                        <Text>• Nombre de barre(s): {details.cadre.longueur_totale_cm} </Text>
                        <Text>• Prix fer: {details.cadre.prix_fer?.toLocaleString()} Ar</Text>
                        <Text>• Prix peinture: {details.cadre.prix_peinture?.toLocaleString()} Ar</Text>
                    </View>
                )}
                {details?.tole && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>Tôle {details.tole.type_tole ? `(${details.tole.type_tole})` : ''}</Text>
                        <Text>• Mesure totale: {details.tole.longueur_totale_cm} cm</Text>
                        <Text>• Prix fer: {details.tole.prix_fer?.toLocaleString()} Ar</Text>
                        <Text>• Prix peinture: {details.tole.prix_peinture?.toLocaleString()} Ar</Text>
                    </View>
                )}

                {details?.decoration && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>Décoration {details.decoration.type_decoration ? `(${details.decoration.type_decoration})` : ''}</Text>
                        <Text>• Nombre de barre: {details.decoration.longueur_totale_cm} </Text>
                        <Text>• Prix fer: {details.decoration.prix_fer?.toLocaleString()} Ar</Text>
                        <Text>• Prix peinture: {details.decoration.prix_peinture?.toLocaleString()} Ar</Text>
                    </View>
                )}


                {details?.majoration_30p && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>Majoration (35%)</Text>
                        <Text>• Prix: {details.majoration_30p.toLocaleString()} Ar</Text>
                    </View>
                )}

                <Text style={styles.analysisMessage}>{analysisResult.message}</Text>
            </View>
        );
    };


    const tabsData = [
        {
            key: '1',
            label: 'Originale',
            content: imageUri ? (
                <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 380, position: 'relative' }}>
                        <Image
                            source={{ uri: imageUri }}
                            style={{ width: 380, height: 380, borderRadius: 12 }}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setImageUri(null);
                                setAnalysisResult(null);
                                setAnalysisVisible(false);
                                setSvgContent(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                borderRadius: 16,
                                padding: 8,
                                zIndex: 1,
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>Aucune image sélectionnée</Text>
                </View>
            )
        },
        {
            key: '2',
            label: 'Image vectorisée',
            content: svgContent ? (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
                        Analyse visuelle:
                    </Text>
                    {Platform.OS === 'web' ? (
                        <SVGRenderer svg={svgContent} width={380} height={380} />
                    ) : (
                        <MobileSVGRenderer svg={svgContent} width={380} height={380} />
                    )}
                </View>
            ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>
                        {imageUri ? 'Analyser l\'image pour voir le SVG' : 'Sélectionner une image d\'abord'}
                    </Text>
                </View>
            )
        }
    ];



    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <ScrollView scrollEnabled={true}>

                <Text style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
                    Veuillez choisir le type de structure et insérer les dimensions de la structure à analyser.
                </Text>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                        Choix de la commande:
                    </Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={typeStructure}
                            onValueChange={(itemValue) => setTypeStructure(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Selectionnez la commande" value="aucun" />

                            <Picker.Item label="Porte & fenêtre" value="porte" />
                            <Picker.Item label="Grille de protection" value="grille" />
                        </Picker>
                    </View>

                    {typeStructure === "porte" && (
                        <View style={styles.row}>
                            <View style={styles.subPicker}>
                                <Text style={styles.label}>Bâti</Text>
                                <Picker
                                    selectedValue={typeBati}
                                    onValueChange={(itemValue) => setTypeBati(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Référence" value="aucun" />
                                    {listBati.map((item) => (
                                        <Picker.Item key={item.id_bati} label={item.type_bati} value={item.type_bati} />
                                    ))}
                                </Picker>
                            </View>

                            <View style={styles.subPicker}>
                                <Text style={styles.label}>Cadre</Text>
                                <Picker
                                    selectedValue={typeCadre}
                                    onValueChange={(itemValue) => setTypeCadre(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Référence" value="aucun" />
                                    {listCadrePorte.map((item) => (
                                        <Picker.Item key={item.id_cadre} label={item.type_cadre} value={item.type_cadre} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={styles.subPicker}>
                                <Text style={styles.label}>Tôle</Text>
                                <Picker
                                    selectedValue={typeTole}
                                    onValueChange={(itemValue) => setTypeTole(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Référence" value="aucun" />
                                    {listTole.map((item) => (
                                        <Picker.Item key={item.id_tole} label={item.type_tole} value={item.type_tole} />
                                    ))}


                                </Picker>
                            </View>


                        </View>
                    )}

                    {typeStructure === "grille" && (
                        <View style={styles.row}>
                            <View style={styles.subPicker}>
                                <Text style={styles.label}>Cadre</Text>
                                <Picker
                                    selectedValue={typeCadre}
                                    onValueChange={(itemValue) => setTypeCadre(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Référence" value="aucun" />
                                    {listCadreGrille.map((item) => (
                                        <Picker.Item key={item.id_grille} label={item.type_cadre} value={item.type_cadre} />
                                    ))}

                                </Picker>
                            </View>

                            <View style={styles.subPicker}>
                                <Text style={styles.label}>Décoration</Text>
                                <Picker
                                    selectedValue={typeDeco}
                                    onValueChange={(itemValue) => setTypeDeco(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Référence" value="aucun" />

                                    {listDecoration.map((item) => (
                                        <Picker.Item key={item.id_decoration} label={item.type_decoration} value={item.type_decoration} />
                                    ))}

                                </Picker>
                            </View>
                        </View>
                    )}
                </View>

                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 0,
                    gap: 12,
                }}>
                    <View style={{ flex: 1, minWidth: 120, marginRight: 8 }}>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 55 }]}
                            placeholder="Hauteur (m)"
                            value={hauteur}
                            onChangeText={setHauteur}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={{ flex: 1, minWidth: 120 }}>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 55 }]}
                            placeholder="Largeur (m)"
                            value={longueur}
                            onChangeText={setLongueur}
                            keyboardType="numeric"
                        />
                    </View>
                    {typeStructure === "porte" && (
                        <View style={{ flex: 1, minWidth: 120 }}>
                            <Picker
                                selectedValue={typeVolet}
                                onValueChange={(itemValue) => setTypeVolet(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Volet" value="aucun" />
                                <Picker.Item label="1 volet" value="1" />
                                <Picker.Item label="2 volets" value="2" />
                                <Picker.Item label="3 volets" value="3" />

                            </Picker>
                        </View>
                    )}


                </View>

                {!imageUri ? (
                    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                        <View style={styles.contentimage}>
                            <MaterialCommunityIcons name="image-plus" size={70} color="#ccc" />
                            <Text style={styles.text}>Choisir une image</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.imageWrapper}>

                        <TouchableOpacity style={styles.overlayButton} onPress={pickImage}>
                            <Text style={styles.overlayText}>Choisir une autre image</Text>
                        </TouchableOpacity>
                    </View>
                )}


                {/* Affichage des onglets avec images */}
                {(imageUri || svgContent) && (
                    <View style={{ marginTop: 24 }}>
                        <CustomTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            tabs={tabsData}
                        />
                    </View>
                )}

                {imageUri && !loading && (
                    <TouchableOpacity
                        style={[styles.analysisButton, { backgroundColor: '#333', alignSelf: 'center' }]}
                        onPress={analyzeImage}
                    >
                        <Text style={styles.buttonText}>Analyser la structure</Text>
                    </TouchableOpacity>
                )}

                {loading && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <ActivityIndicator size="large" color="black" />
                        <Text style={{ marginTop: 8, color: '#666' }}>
                            Analyse en cours...
                        </Text>
                    </View>
                )}

                {/* Affichage des résultats d'analyse */}
                {analysisResult && analysisVisible && renderAnalysisDetails()}

               
                {imageUri && (
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleDownloadPDF}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                            Enregistrer le devis en PDF
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    imageButton: {
        width: '100%',
        height: '70%',
        borderWidth: 2,
        borderColor: 'grey',
        backgroundColor: '#fff',
        justifyContent: 'center',
        borderRadius: 16,
        alignItems: 'center',
        marginVertical: 12,
        borderStyle: 'dashed',
        
    },
    contentimage: {
        alignItems: 'center',
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    analysisButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 16,
        alignItems: 'center',
        minWidth: 200,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    sendButton: {
        width: 300,
        height: 50,
        backgroundColor: '#333',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 70,
        alignSelf: 'center',

    },
    devisInfo: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    devisText: {
        fontSize: 18,
        marginBottom: 8,
        color: '#333',
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    analysisContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        margin: 6,
        elevation: 5,
        // borderWidth: 1,
        // borderColor: '#e3f2fd',
    },
    analysisTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    analysisStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,

        borderRadius: 8,
        padding: 15,
    },
    analysisStat: {
        alignItems: 'center',
        flex: 1,
    },
    analysisStatNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    analysisStatLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    priceContainer: {

        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 3,
        borderColor: '#ccc',
    },
    priceLabel: {
        fontSize: 14,
        color: 'black',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 12,
        alignItems: 'center',
    },
    detailItem: {

        padding: 5,

        marginVertical: 6,

        elevation: 2,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        color: 'grey',
    },
    analysisMessage: {
        marginTop: 14,
        fontSize: 15,
        fontStyle: 'italic',
        color: '#34495e',
        textAlign: 'center',
    },
    pickerContainer: {
        marginVertical: 10,
        paddingHorizontal: 1,
        paddingVertical: Platform.OS === 'ios' ? 12 : 0,

    },
    picker: {
        height: 55,
        color: '#2c3e50',
        borderRadius: 10,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        fontSize: 16,

    },
    tabHeader: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeTabHeader: {
        backgroundColor: 'grey',
    },
    tabHeaderText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    activeTabHeaderText: {
        color: '#fff',
        fontWeight: '700',
    },
    tabContent: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
        color: "grey",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    subPicker: {
        flex: 1,
        marginHorizontal: 4,
    },
    imageWrapper: {
        width: "100%",
        borderRadius: 16,
      

    },
    imagePreview: {
    },
    overlayButton: {

        width: '100%',
        backgroundColor: "#333", // fond noir transparent
        padding: 10,
        borderRadius: 8,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    overlayText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    svgWebView: {
        width: 380,
        height: 400,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
    },
    username: {
        fontWeight: 'bold',
        color: '#007bff',
    },
});


export default HomeScreen;
