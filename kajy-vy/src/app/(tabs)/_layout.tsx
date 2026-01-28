import { colors, fontSize } from "@/constants/tokens";
import { Entypo, FontAwesome, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { DevisProvider } from "@/contexts/DevisContext";
import { MenuProvider } from "react-native-popup-menu";

const TabsNavigation = () => {
    return (
        <>
            <DevisProvider>
                    <Tabs screenOptions={{
                        tabBarActiveTintColor: colors.primary,
                        tabBarLabelStyle: {
                            fontSize: fontSize.xs,
                            fontWeight: '500',

                        },
                        tabBarLabelPosition: 'below-icon',

                        headerShown: false,

                        tabBarStyle: {
                            position: 'absolute',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,

                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 20,
                            height: 55,
                            borderTopWidth: 0,
                            // paddingBottom: 0,
                            paddingTop: 0,
                            // marginBottom: 5,
                            // marginTop: 0,
                        },

                        tabBarBackground: () => <BlurView intensity={95}
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                overflow: 'hidden',
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,

                                borderBottomLeftRadius: 20,
                                borderBottomRightRadius: 20,

                                paddingTop: 50,
                            }} />,

                    }}>
                        <Tabs.Screen name="(accueil)" options={{
                            title: "Image",
                            tabBarIcon: ({ color }) => <MaterialIcons name='image' size={24} color={color} />,
                        }} />

                        <Tabs.Screen name="dessin" options={{
                            title: "Dessin",
                            tabBarIcon: ({ color }) => <MaterialIcons name='draw' size={24} color={color} />,

                        }} />

                        <Tabs.Screen name="historiques" options={{
                            title: "Historiques",
                            tabBarIcon: ({ color }) => <FontAwesome name='history' size={20} color={color} />,
                        }} />

                        <Tabs.Screen name="apropos" options={{
                            title: "A propos",
                            tabBarIcon: ({ color }) => <Entypo name='info-with-circle' size={20} color={color} />,
                        }} />



                    </Tabs>

            </DevisProvider>



        </>

    )
}

export default TabsNavigation