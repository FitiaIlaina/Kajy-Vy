"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var expo_router_1 = require("expo-router");
var expo_status_bar_1 = require("expo-status-bar");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var App = function () {
    return (<react_native_safe_area_context_1.SafeAreaProvider>
		<RootNavigation />
		<expo_status_bar_1.StatusBar style='auto'/>
		{/* <Text>Ceci est un texte</Text> */}
	</react_native_safe_area_context_1.SafeAreaProvider>);
};
var RootNavigation = function () {
    return (<expo_router_1.Stack>
		<expo_router_1.Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
	</expo_router_1.Stack>);
};
exports.default = App;
