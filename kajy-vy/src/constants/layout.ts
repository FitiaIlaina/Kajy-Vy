import { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { colors } from "./tokens"

export const StackScreenWithSearchBar: NativeStackNavigationOptions = {
    headerLargeTitle: true,
    headerLargeStyle: {
        backgroundColor: '#fff',
        
    },
    headerLargeTitleStyle: {
        color : colors.text
    },
    

    headerStyle:{
        backgroundColor: '#fff',
        
    },

   
    headerTintColor: colors.text,
    headerTransparent: false,
 
    headerShadowVisible: true,
}