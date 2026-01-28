import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://localhost:5000';

class AuthService {

    //pour l'inscri
    async signup(name, surname, email, password) {
        const response = await fetch(`${SERVER_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                surname,
                email,
                password
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'inscription');
        }
        return data;
    }

    //pour la connexion
    async login(email, password) {
        const response = await fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Erreur lors de la connexion');
        }
        if (data.access_token && data.refresh_token) {

            await AsyncStorage.setItem('access_token', data.access_token);
            await AsyncStorage.setItem('refresh_token', data.refresh_token);
            await AsyncStorage.setItem('user_email', email);
        } else {
            throw new Error('Tokens non reçus du serveur');
        }
        return data;
    }

    async getAccessToken() {
        return await AsyncStorage.getItem('access_token');
    }

    async getRefreshToken() {
        return await AsyncStorage.getItem('refresh_token');
    }

    async refreshToken() {
        const refreshtoken = await this.getRefreshToken();

        if (!refreshtoken) {
            throw new Error('aucun refresh token disponible');
        }

        const response = await fetch(`${SERVER_URL}/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshtoken}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors du rafraichissement du token');
        }

        await AsyncStorage.setItem('access_token', data.access_token);

        return data.access_token;
    }

    async authenticatedRequest(url, options = {}) {
        let accesstoken = await this.getAccessToken();

        if (!accesstoken) {
            throw new Error('Aucun token d\'accès disponible');
        }

        let response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accesstoken}`,

            },

        });

        if (response.status === 401) {
            accesstoken = await this.refreshToken();
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accesstoken}`,
                },
            });
        }
        return response;
    }


    async logout() {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_email']);
        const accesstoken = await AsyncStorage.getItem('access_token');
        if (accesstoken) {
            try {
                const response = await fetch(`${SERVER_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accesstoken}`,
                    },
                });
            } catch (error) {
            }
        }

    }

    async isAuthenticated() {
        try {
            const token = await this.getAccessToken();
            console.log(' Token found:', token ? 'YES' : 'NO');

            if (token) {
                console.log(' Token preview:', token.substring(0, 20) + '...');
            }

            const isAuth = !!token;
            console.log(' Authentication result:', isAuth);
            return isAuth;
        } catch (error) {
            console.error(' Error checking authentication:', error);
            return false;
        }
    }

    async getUserEmail() {
        return await AsyncStorage.getItem('user_email');
    }

}

export default new AuthService();