import React, { useState } from 'react'

import { Stack, Link } from 'expo-router'
import { AuthProvider } from '../components/AuthProvider'


const RootNavigation = () => {
	return (
		<AuthProvider>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="signup" />
				<Stack.Screen name="(tabs)" />
			</Stack>

		</AuthProvider>





	)
}

export default RootNavigation;