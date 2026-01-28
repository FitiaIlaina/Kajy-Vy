// Fonction pour vérifier l'authentification sur les pages admin
function checkAdminAuth() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        // Si on n'est pas sur la page de connexion ou d'inscription, rediriger
        if (!window.location.pathname.includes('Admin-connexion') && 
            !window.location.pathname.includes('Admin-inscription')) {
            window.location.href = '/Admin-connexion';
        }
        return false;
    }
    
    return true;
}

// Fonction pour faire des requêtes authentifiées
async function authenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = '/Admin-connexion';
        return;
    }
    
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(url, options);
    
    // Si token expiré (401), essayer de rafraîchir
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Réessayer la requête avec le nouveau token
            options.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
            return await fetch(url, options);
        } else {
            // Si échec du refresh, déconnecter
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('admin_user');
            window.location.href = '/Admin-connexion';
            return null;
        }
    }
    
    return response;
}

// Fonction pour rafraîchir le token
async function refreshToken() {
    const refresh_token = localStorage.getItem('refresh_token');
    
    if (!refresh_token) return false;
    
    try {
        const response = await fetch('/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refresh_token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            return true;
        }
    } catch (error) {
        console.error('Erreur refresh token:', error);
    }
    
    return false;
}

// Fonction de déconnexion
async function adminLogout() {
    const token = localStorage.getItem('access_token');
    
    if (token) {
        try {
            await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Erreur logout:', error);
        }
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/Admin-connexion';
}