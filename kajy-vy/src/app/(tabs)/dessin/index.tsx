import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, PanResponder, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useAuth } from "src/components/AuthProvider";
import { useDevis } from 'src/contexts/DevisContext';

const { width, height } = Dimensions.get('window');

type Point = { x: number; y: number };
type Line = Point[];
type ZoneLines = Line[][];

interface AnalysisResult {
    type: 'porte' | 'grille';
    prix_total: number;
    dimensions: {
        hauteur_m: number;
        largeur_m: number;
    };
    details: {
        bati?: {
            type_bati?: string,
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        cadre?: {
            type_cadre?: string
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        tole?: {
            type_tole?: string
            longueur_totale_cm: number;
            prix_fer: number;
            prix_peinture: number;
        };
        decoration?: {
            type_decoration?: string
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
    image_preview?: string;
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

const DrawScreen = () => {

    const { userEmail } = useAuth();

    const [zoneCount, setZoneCount] = useState<number>(2);
    const [lines, setLines] = useState<ZoneLines>(() => Array.from({ length: 2 }, () => []));
    const [undoneLines, setUndoneLines] = useState<ZoneLines>(() => Array.from({ length: 2 }, () => []));
    const currentLine = useRef<Line>([]);
    const lastZoneDrawnRef = useRef<number | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    const [cleanImage, setCleanImage] = useState<string | null>(null);
    const [hauteur, setHauteur] = useState('');
    const [largeur, setLargeur] = useState('');
    const [typeStructure, setTypeStructure] = useState<'auto' | 'porte' | 'grille'>('auto');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [analysisVisible, setAnalysisVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    const [typeVolet, setTypeVolet] = useState("");

    const [typeBati, setTypeBati] = useState("");
    const [typeCadre, setTypeCadre] = useState("");
    const [typeDeco, setTypeDeco] = useState("");
    const [typeTole, setTypeTole] = useState("");


    const [listBati, setListBati] = useState<any[]>([]);
    const [listCadrePorte, setListCadrePorte] = useState<any[]>([]);
    const [listCadreGrille, setListCadreGrille] = useState<any[]>([]);
    const [listDecoration, setListDecoration] = useState<any[]>([]);
    const [listTole, setListTole] = useState<any[]>([]);


    const zoneHeight = 300;
    const { addDevis } = useDevis();
    const SERVER_URL = 'http://localhost:5000';


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
    
    const straightenLine = (line: Line): Line => {
        if (line.length < 2) return line;

        const firstPoint = line[0];
        const lastPoint = line[line.length - 1];

        //  les différences
        const dx = Math.abs(lastPoint.x - firstPoint.x);
        const dy = Math.abs(lastPoint.y - firstPoint.y);

        // Seuil de tolérance pour considérer qu'une ligne doit être rectifiée
        const tolerance = 40; 

        // Ligne trop courte
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        if (lineLength < 50) return line;

        // Si la ligne est proche de la verticale
        if (dx < tolerance && dy > dx * 1.5) {
            const avgX = (firstPoint.x + lastPoint.x) / 2;
            const numPoints = Math.min(line.length, 10); // Limiter à 10 points
            const newLine: Line = [];

            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                const y = firstPoint.y + t * (lastPoint.y - firstPoint.y);
                newLine.push({ x: avgX, y });
            }
            return newLine;
        }

        // Si la ligne est proche de l'horizontale
        if (dy < tolerance && dx > dy * 1.5) {
            const avgY = (firstPoint.y + lastPoint.y) / 2;
            const numPoints = Math.min(line.length, 10);
            const newLine: Line = [];

            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                const x = firstPoint.x + t * (lastPoint.x - firstPoint.x);
                newLine.push({ x, y: avgY });
            }
            return newLine;
        }
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const absAngle = Math.abs(angle);

        
        if ((absAngle > 42 && absAngle < 48) || (absAngle > 132 && absAngle < 138)) {
            const length = Math.max(dx, dy);
            const dirX = lastPoint.x > firstPoint.x ? 1 : -1;
            const dirY = lastPoint.y > firstPoint.y ? 1 : -1;

            const numPoints = Math.min(line.length, 10);
            const newLine: Line = [];

            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                newLine.push({
                    x: firstPoint.x + t * length * dirX,
                    y: firstPoint.y + t * length * dirY
                });
            }
            return newLine;
        }
        return line;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt, gestureState) => {

                setIsDrawing(true);
                setScrollEnabled(false);


                const zoneIndex = Math.min(
                    Math.floor(gestureState.y0 / zoneHeight),
                    zoneCount - 1
                );
                lastZoneDrawnRef.current = zoneIndex;

                const newLine: Line = [{ x: gestureState.x0, y: gestureState.y0 }];
                currentLine.current = newLine;

                setLines(prev => {
                    const updated = [...prev];
                    updated[zoneIndex] = [...updated[zoneIndex], newLine];
                    return updated;
                });

                setUndoneLines(prev => {
                    const updated = [...prev];
                    updated[zoneIndex] = [];
                    return updated;
                });
            },
            onPanResponderMove: (evt, gestureState) => {
                const zoneIndex = lastZoneDrawnRef.current;
                if (zoneIndex === null) return;

                const point = { x: gestureState.moveX, y: gestureState.moveY };

                if (
                    point.y < zoneIndex * zoneHeight ||
                    point.y > (zoneIndex + 1) * zoneHeight
                ) {
                    return;
                }

                currentLine.current.push(point);
                setLines(prev => {
                    const updated = [...prev];
                    updated[zoneIndex] = [
                        ...updated[zoneIndex].slice(0, -1),
                        [...currentLine.current]
                    ];
                    return updated;
                });
            },
            onPanResponderRelease: () => {
                // Rectifier la ligne avant de terminer
                if (currentLine.current.length > 0 && lastZoneDrawnRef.current !== null) {
                    const straightened = straightenLine(currentLine.current);

                    setLines(prev => {
                        const updated = [...prev];
                        updated[lastZoneDrawnRef.current!] = [
                            ...updated[lastZoneDrawnRef.current!].slice(0, -1),
                            straightened
                        ];
                        return updated;
                    });
                }

                setIsDrawing(false);
                setTimeout(() => {
                    setScrollEnabled(true);
                    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });
                }, 100);
                currentLine.current = [];
            },

            onPanResponderTerminate: () => {
                setIsDrawing(false);
                if (scrollViewRef.current) {
                    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });
                }
                currentLine.current = [];
            },
        })
    ).current;

    const undo = () => {
        const zoneIndex = lastZoneDrawnRef.current;
        if (zoneIndex === null) return;
        setLines(prev => {
            const updated = [...prev];
            if (updated[zoneIndex].length > 0) {
                const last = updated[zoneIndex].pop()!;
                setUndoneLines(und => {
                    const undUpdated = [...und];
                    undUpdated[zoneIndex] = [...undUpdated[zoneIndex], last];
                    return undUpdated;
                });
            }
            return updated;
        });
    };

    const redo = () => {
        const zoneIndex = lastZoneDrawnRef.current;
        if (zoneIndex === null) return;
        setUndoneLines(prev => {
            const updated = [...prev];
            if (updated[zoneIndex].length > 0) {
                const last = updated[zoneIndex].pop()!;
                setLines(linesPrev => {
                    const newLines = [...linesPrev];
                    newLines[zoneIndex] = [...newLines[zoneIndex], last];
                    return newLines;
                });
            }
            return updated;
        });
    };

    const generateSvg = (): string => {
        const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
        const svgFooter = '</svg>';
        const background = `<rect width="${width}" height="${height}" fill="white"/>`;

        const polylines = lines[0].map((line) => {
            const pointsStr = line.map(p => `${p.x},${p.y}`).join(' ');
            return `<polyline points="${pointsStr}" fill="none" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
        }).join('');

        return svgHeader + background + polylines + svgFooter;
    };

    const analyzeDrawing = async () => {
        if (!largeur || !hauteur) {
            Alert.alert('Erreur', 'Veuillez entrer les dimensions avant l\'analyse');
            return;
        }

        if (typeStructure === 'porte') {
            if (!typeCadre || !typeBati || !typeTole || !typeVolet) {
                Alert.alert('Erreur', 'Veuillez sélectionner le type de bâti, cadre et tôle pour une porte');
                return;
            }
        } else if (typeStructure === 'grille') {
            if (!typeCadre) {
                Alert.alert('Erreur', 'Veuillez sélectionner le type de cadre pour une grille');
                return;
            }
        }

        const hasDrawing = lines.some(zoneLines => zoneLines.length > 0);
        if (!hasDrawing) {
            Alert.alert('Erreur', 'Veuillez dessiner quelque chose avant d\'analyser');
            return;
        }

        const totalPoints = lines[0].reduce((sum, line) => sum + line.length, 0)
        if (totalPoints < 50) {
            Alert.alert('Erreur', 'Dessin insuffisant: veuillez dessiner une structure plus complète!');
            return;
        }

        setLoading(true);

        try {
            const svgString = generateSvg();
            const response = await fetch(`${SERVER_URL}/analyze-drawing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    svg: svgString,
                    hauteur: parseFloat(hauteur),
                    longueur: parseFloat(largeur),
                    type_structure: typeStructure,
                    type_bati: typeBati,
                    type_cadre: typeCadre,
                    type_deco: typeDeco,
                    type_tole: typeTole,
                    type_volet: typeVolet
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            if (result.error) {
                Alert.alert('Erreur', result.error);
                return;
            }

            setAnalysisResult(result);
            setAnalysisVisible(true);
            try {
                const surface = parseFloat(largeur) * parseFloat(hauteur);
                const devisData = {
                    title: `Devis ${result.type?.toUpperCase() || 'DESSIN'} - ${new Date().toLocaleDateString('fr-FR')}`,
                    date: new Date().toISOString().split('T')[0],
                    type: result.type || 'dessin',
                    prix_total: result.prix_total || 0,
                    user_email: userEmail,
                    dimensions: {
                        hauteur: hauteur,
                        largeur: largeur,
                        surface: surface,
                    },
                    details: result.details || {},
                    types_choisis: {
                        cadre: typeCadre,
                        bati: typeBati,
                        decoration: typeDeco,
                        tole: typeTole,
                        volet: typeVolet
                    },
                    svgContent: svgString,
                    analysisResult: result,
                    method: 'dessin' as const,
                };

                await addDevis({
                    ...devisData,
                    user_email: userEmail || 'anonyme'
                });
            } catch (contextError) {
                console.warn('Failed to save to context:', contextError);
            }

            if (result.image_preview) {
                setCleanImage(`data:image/png;base64,${result.image_preview}`);
                setActiveTab('2');
            }


            result.type === 'grille' ? 'grille' : 'inconnu';



        } catch (error) {
            console.error('Erreur analyse:', error);
            Alert.alert('Erreur', 'Impossible d\'analyser le dessin. Vérifiez que le serveur Flask est démarré.');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!largeur || !hauteur) {
            Alert.alert('Erreur', 'Veuillez entrer les dimensions');
            return;
        }
        const hasDrawing = lines.some(zoneLines => zoneLines.length > 0);
        if (!hasDrawing) {
            Alert.alert('Erreur', 'Veuillez dessiner quelque chose');
            return;
        }
        setModalVisible(true);
    };

    const createSVGWebViewContent = (svg: string) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    html,body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #fff;
                    }
                    svg {
                        max-width: 100%;
                        max-height: 100%;
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        preserveAspectRatio: xMidYMid meet;
                    }
                </style>
            </head>
            <body>
                ${svg}
            </body>
            </html>
        `;
    };

    const handleDownloadPDF = async () => {
        try {
            const surface = largeur && hauteur ? (parseFloat(largeur) * parseFloat(hauteur)).toFixed(2) : '0';

            if (!largeur || !hauteur) {
                Alert.alert('Erreur', 'Dimensions manquantes');
                return;
            }

            let detailsHTML = '';

            if (analysisResult?.details) {
                // BÂTI
                if (analysisResult?.details.bati) {
                    detailsHTML += `
                            <div class="detail-card">
                                <h3>Bâti (${analysisResult?.details.bati.type_bati || 0} )</h3>
                                <div class="detail-row">
                                    <span>Nombre de barre(s):</span>
                                    <span>${analysisResult?.details.bati.longueur_totale_cm || 0} </span>
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
                                <h3>Cadre${analysisResult?.details.cadre.type_cadre || 0} </h3>
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
                                <h3>Tôle (${analysisResult?.details.tole.type_tole || 0} )</h3>
                                <div class="detail-row">
                                    <span>Longueur totale:</span>
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
                                <h3>Décoration (${analysisResult?.details.decoration.type_decoration || 0} )</h3>
                                <div class="detail-row">
                                    <span>Nombre de barre(s):</span>
                                    <span>${analysisResult?.details.decoration.longueur_totale_cm || 0} </span>
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
                                <h3>Main d'œuvre de la peinture</h3>
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
                       
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        
                    }
                    .header h1 { 
                        color: #333; 
                        font-size: 22px; 
                        
                    }
                    .company { 
                        color: #666; 
                        font-size: 14px; 
                    }
                    .info { 
                        background: #f8f9fa; 
                        padding: 15px; 
                        border-radius: 8px; 
                       
                    }
                    .info p {
                        margin: 5px 0;
                    }
                    .price { 
                        border: 3px solid black; 
                        color: black; 
                         
                        border-radius: 8px; 
                        text-align: center; 
                        
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
                    <p><strong>Dimensions:</strong> ${largeur} m × ${hauteur} m</p>
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
                    Résultat - {type?.toUpperCase() || 'Structure'}
                </Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Prix total estimé</Text>
                    <Text style={styles.priceValue}>{prix_total?.toLocaleString() || 'N/A'} Ar</Text>
                </View>

                {details?.bati && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailTitle}>Bâti {details.bati.type_bati ? `(${details.bati.type_bati})` : ''}</Text>
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
                        <Text>• Nombre de barre(s): {details.decoration.longueur_totale_cm} </Text>
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
            label: 'Dessin',
            content: (
                <View style={[styles.drawingZone, isDrawing && { borderColor: 'blue', borderWidth: 2 }]}>
                    <View style={styles.zoneHeader}>
                        <Text style={styles.zoneTitle}>Zone de dessin {isDrawing && '(dessin en cours..)'}</Text>
                    </View>

                    <View
                        style={styles.drawingCanvas}
                        onStartShouldSetResponder={(evt) => {
                            // Ne pas intercepter les touches sur les boutons
                            return true;
                        }}
                        onResponderGrant={(e) => {
                            setIsDrawing(true);
                            if (scrollViewRef.current) {
                                scrollViewRef.current?.setNativeProps?.({ scrollEnabled: false });
                            }

                            const y0 = e.nativeEvent.locationY + 32;
                            lastZoneDrawnRef.current = 0;
                            const newPoint = { x: e.nativeEvent.locationX + 16, y: y0 };
                            const newLine: Line = [newPoint];
                            currentLine.current = newLine;

                            setLines(prev => {
                                const updated = [...prev];
                                updated[0] = [...updated[0], newLine];
                                return updated;
                            });
                            setUndoneLines(prev => {
                                const updated = [...prev];
                                updated[0] = [];
                                return updated;
                            });
                        }}
                        onResponderMove={(e) => {
                            if (lastZoneDrawnRef.current !== 0) return;

                            const point = {
                                x: e.nativeEvent.locationX + 16,
                                y: e.nativeEvent.locationY + 32,
                            };
                            currentLine.current.push(point);
                            setLines(prev => {
                                const updated = [...prev];
                                updated[0] = [
                                    ...updated[0].slice(0, -1),
                                    [...currentLine.current],
                                ];
                                return updated;
                            });
                        }}
                        onResponderRelease={() => {
                            if (currentLine.current.length > 0) {
                                const straightened = straightenLine(currentLine.current);

                                setLines(prev => {
                                    const updated = [...prev];
                                    updated[0] = [
                                        ...updated[0].slice(0, -1),
                                        straightened
                                    ];
                                    return updated;
                                });
                            }

                            setIsDrawing(false);
                            setTimeout(() => {
                                setScrollEnabled(true);
                                if (scrollViewRef.current) {
                                    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });
                                }
                            }, 150);
                        }}
                    >
                        <Svg
                            height={zoneHeight - 32}
                            width={width - 32}
                            style={StyleSheet.absoluteFill}
                        >
                            {lines[0].map((line, i) => (
                                <Polyline
                                    key={`0-${i}`}
                                    points={line
                                        .map(p => `${p.x - 16},${p.y - 32}`)
                                        .join(" ")}
                                    fill="none"
                                    stroke="black"
                                    strokeWidth={3}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                            ))}
                        </Svg>

                        <View style={styles.floatingButtons} pointerEvents="box-none">
                            <TouchableOpacity
                                style={styles.undoRedoButton}
                                onPress={() => {
                                    lastZoneDrawnRef.current = 0;
                                    undo();
                                }}
                                activeOpacity={0.7}
                            >
                                <View pointerEvents="none">
                                    <Ionicons name="arrow-undo-sharp" size={37} color="#333" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.undoRedoButton}
                                onPress={() => {
                                    lastZoneDrawnRef.current = 0;
                                    redo();
                                }}
                                activeOpacity={0.7}
                            >
                                <View pointerEvents="none">
                                    <Ionicons name="arrow-redo-sharp" size={37} color="#333" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ),
        },
        {
            key: '2',
            label: 'Image vectorisé',
            content: cleanImage ? (
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
                        Analyse visuelle:
                    </Text>
                    <Image
                        source={{ uri: cleanImage }}
                        style={{ width: 380, height: 380, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                </View>
            ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>
                        Analyser le dessin pour voir l'image vectorisé
                    </Text>
                </View>
            )
        }
    ];

    const hasDrawing = lines.some(zoneLines => zoneLines.length > 0);

    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <ScrollView ref={scrollViewRef} scrollEnabled={!isDrawing} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
                    Veuillez choisir le type de structure et insérer les dimensions de la structure à dessiner.
                </Text>

                {/* Sélection du type de structure */}
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

                {/* Champs de saisie des dimensions */}
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
                            value={largeur}
                            onChangeText={setLargeur}
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

                {/* Affichage des onglets */}
                <View style={{ marginTop: 24 }}>
                    <CustomTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        tabs={tabsData}
                    />
                </View>

                {hasDrawing && !loading && (
                    <TouchableOpacity
                        style={[styles.analysisButton, { backgroundColor: '#333', alignSelf: 'center' }]}
                        onPress={analyzeDrawing}
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

                {hasDrawing && (
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
    drawingPrompt: {
        width: '100%',
        height: 200,
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
    },
    analysisTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
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
        fontSize: 16,
        height: 55,
        color: '#2c3e50',
        borderRadius: 10,
        borderColor: '#ccc',
        backgroundColor: '#fff',
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
        elevation: 2,
        shadowColor: '#000',
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
    overlayButton: {
        width: '100%',
        backgroundColor: "#333",
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
    drawingZone: {
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#fff",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    zoneHeader: {
        backgroundColor: "#f2f2f2",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    zoneTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    drawingCanvas: {
        height: 300,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderStyle: "dashed",
        borderRadius: 8,
        overflow: "hidden",
    },
    floatingButtons: {
        top: 10,
        left: 10,
        position: 'absolute',
        flexDirection: 'row',
        zIndex: 999,
        elevation: 10,
    },
    undoRedoButton: {
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginHorizontal: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});


export default DrawScreen;
