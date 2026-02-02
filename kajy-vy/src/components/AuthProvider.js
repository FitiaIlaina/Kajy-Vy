import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/AuthService';
import { router } from 'expo-router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        if (!hasCheckedAuth) {
            checkauth();
        }
    }, [hasCheckedAuth]);

    const checkauth = async () => {
        console.log(' Starting auth check...');
        try {
            const authenticated = await AuthService.isAuthenticated();
            console.log(' Auth check result:', authenticated);
            
            if (authenticated) {
                const email = await AuthService.getUserEmail();
             
                setUserEmail(email);
                setIsAuthenticated(true);
            } else {
               
                setUserEmail(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setUserEmail(null);
            setIsAuthenticated(false);
        } finally {
            console.log(' Auth check completed, setting loading to false');
            setIsLoading(false);
            setHasCheckedAuth(true);
        }
    };

    const login = async (email, password) => {
        try {
            const result = await AuthService.login(email, password);
            setUserEmail(email);
            setIsAuthenticated(true);
            router.replace('/(tabs)/(accueil)');
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
    try {
        
        await AuthService.logout();
        
        setIsAuthenticated(false);
        setUserEmail(null);
        setIsLoading(false);
        
        setTimeout(() => {
            
            if (typeof window !== 'undefined' && window.location) {
               
                window.location.href = '/';
            } else {
               
                router.replace('/');
            }
        }, 100);
        
    } catch (error) {

        setIsAuthenticated(false);
        setUserEmail(null);
        setIsLoading(false);
  
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location) {
                window.location.href = '/';
            } else {
                router.replace('/');
            }
        }, 100);
    }
};

    const signup = async (name, surname, email, password) => {
        try {
            const result = await AuthService.signup(name, surname, email, password);

            await AuthService.login(email, password);
            setUserEmail(email);
            setIsAuthenticated(true);
            router.replace('/(tabs)/(accueil)');
            
            return result;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const value = {
        isAuthenticated,
        userEmail,
        isLoading,
        login,
        logout,
        signup,
        refreshAuth: checkauth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
    }
    return context;

};
