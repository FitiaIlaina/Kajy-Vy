import { Platform } from 'react-native';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { useAuth } from '@/components/AuthProvider';

let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

export interface Devis { 
    id: string;
    title: string;
    date: string;
    type: 'porte' | 'grille' | 'dessin';
    prix_total: number;
    user_email?: string;
    dimensions: { hauteur: string; largeur: string; surface: number };
    details: any;
    imageUri?: string;
    svgContent?: string;
    analysisResult?: any;
    method: 'photo' | 'dessin';
    timestamp: string;
}

interface EtatDevis { 
    devis: Devis[]; 
    isLoading: boolean;
}

type ActionDevis = 
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'LOAD_DEVIS', payload: Devis[] }
  | { type: 'ADD_DEVIS', payload: Devis }
  | { type: 'DELETE_DEVIS', payload: string }
  | { type: 'UPDATE_DEVIS', payload: { id: string, updates: Partial<Devis> } }
  | { type: 'CLEAR_DEVIS' };

const etatinitial: EtatDevis = { 
    devis: [], 
    isLoading: true 
};

function devisReducer(state: EtatDevis, action: ActionDevis): EtatDevis {
  switch(action.type){
    case 'SET_LOADING': 
      return { ...state, isLoading: action.payload };
    case 'LOAD_DEVIS': 
      return { ...state, devis: action.payload, isLoading: false };
    case 'ADD_DEVIS': 
      return { ...state, devis: [...state.devis, action.payload] };
    case 'DELETE_DEVIS': 
      return { ...state, devis: state.devis.filter(d => d.id !== action.payload) };
    case 'UPDATE_DEVIS': 
      return {
        ...state,
        devis: state.devis.map(d => 
          d.id === action.payload.id ? {...d, ...action.payload.updates} : d
        )
      };
    case 'CLEAR_DEVIS': 
      return { 
        devis:[],
        isLoading: false
       };
    default: 
      return state;
  }
}

interface DevisContextProps {
  state: EtatDevis;
  addDevis: (devis: Omit<Devis,'id'|'timestamp'>) => Promise<void>;
  deleteDevis: (id: string) => Promise<void>;
  updateDevis: (id: string, updates: Partial<Devis>) => Promise<void>;
  clearDevis: () => Promise<void>;
  refreshDevis: () => void;
}

const Deviscontext = createContext<DevisContextProps | undefined>(undefined);

interface DevisProviderProps { 
    children: ReactNode;
}

// fonctions helper
const safeJsonParse = (jsonString: string | null | undefined, fallback: any = {}) => {
  try {
    if (!jsonString) return fallback;
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString);
    return fallback;
  }
};

const safeJsonStringify = (obj: any) => {
  try {
    return JSON.stringify(obj || {});
  } catch (error) {
    console.warn('Failed to stringify object:', obj);
    return '{}';
  }
};

// sqlite pour web pour le test

class WebSQLiteSimulator {
  private dbName = 'kajy_vy_web';
  private version = 1;
  private storeName = 'devis';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        let store: IDBObjectStore;
        if (!db.objectStoreNames.contains(this.storeName)) {
          store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        }else{
         const transaction = (event.target as IDBOpenDBRequest).transaction!;
         store = transaction.objectStore(this.storeName);
        }

        if (!store.indexNames.contains('user_email')) {

          store.createIndex('user_email', 'user_email', { unique: false })
        }
      };
    });
  }

  async execAsync(sql: string): Promise<void> {
    
    console.log(`Web SQLite Simulator: ${sql}`);
  }

  async getAllAsync(sql: string, params:any): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
       if (params.length > 0 && params[0]) {
        if (store.indexNames.contains('user_email')) {
        const index = store.index('user_email');
        const request = index.getAll(params[0]);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const results = request.result.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(results);
        };
      }
      else {
        const request = store.getAll();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const allResults = request.result;
            const filteredResults = allResults
              .filter(item => item.user_email === params[0])
              .sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            resolve(filteredResults);
        };
      }
    }else {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const results = request.result.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(results);
        };
      }
    });
  }

  async runAsync(sql: string, params: any[]): Promise<void> {
    const db = await this.openDB();
    
    if (sql.includes('INSERT OR REPLACE')) {
      return this.insertOrReplace(db, params);
    } else if (sql.includes('DELETE')) {
      return this.delete(db, params[0]);
    }
  }

  private async insertOrReplace(db: IDBDatabase, params: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const devisData = {
        id: params[0],
        title: params[1],
        date: params[2],
        type: params[3],
        prix_total: params[4],
        user_email: params[5],
        dimensions: params[6],
        details: params[7],
        imageUri: params[8],
        svgContent: params[9],
        analysisResult: params[10],
        method: params[11],
        timestamp: params[12]
      };

      const request = store.put(devisData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(db: IDBDatabase, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Alternative: Add a standalone delete method that handles DB opening
  async deleteById(id: string): Promise<void> {
    const db = await this.openDB();
    return this.delete(db, id);
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await callback();
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// BASE DE DONNÉES

let db: any = null;
const isWeb = Platform.OS === 'web';

const initializeDB = async () => {
  try {
    if (db) return db;
    
    if (isWeb) {
      db = new WebSQLiteSimulator();
      await db.execAsync(`CREATE TABLE IF NOT EXISTS devis (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT,
        date TEXT,
        type TEXT,
        prix_total REAL,
        user_email TEXT NOT NULL,
        dimensions TEXT,
        details TEXT,
        imageUri TEXT,
        svgContent TEXT,
        analysisResult TEXT,
        method TEXT,
        timestamp TEXT
      );`);
    } else {
      db = await SQLite.openDatabaseAsync('kajy_vy.db');
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS devis (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT,
          date TEXT,
          type TEXT,
          prix_total REAL,
          user_email TEXT NOT NULL,
          dimensions TEXT,
          details TEXT,
          imageUri TEXT,
          svgContent TEXT,
          analysisResult TEXT,
          method TEXT,
          timestamp TEXT
        );`
      );
    }
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const DevisProvider = ({ children }: DevisProviderProps) => {
  const [state, dispatch] = useReducer(devisReducer, etatinitial);
  const { userEmail } = useAuth();
  useEffect(() => { 
    const initAndLoad = async () => {
      try {
        await initializeDB();
        await loadDevisFromDB(userEmail);
      } catch (error) {
        console.error('Failed to initialize and load data:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initAndLoad();
  }, [userEmail]);

  const loadDevisFromDB = async (currentUser?: string) => {
    dispatch({ type:'SET_LOADING', payload: true });
   
    try {
      const database = await initializeDB();

      await database.withTransactionAsync(async () => {

        let query = 'SELECT * FROM devis ORDER BY timestamp DESC;';
        let params: any[] = [];

        if (currentUser){
          query = 'SELECT * FROM devis WHERE user_email = ? ORDER BY timestamp DESC;';
          params = [currentUser];
        }
        const rows = await database.getAllAsync(query, params) as any[];
        
        const devisList: Devis[] = rows.map((d: any) => ({
          ...d,
          dimensions: safeJsonParse(d.dimensions, {}),
          details: safeJsonParse(d.details, {}),
          analysisResult: safeJsonParse(d.analysisResult, {})
        }));
        
        dispatch({ type: 'LOAD_DEVIS', payload: devisList });
      });
    } catch (error) {
      console.error('Error loading devis:', error);
      dispatch({ type: 'LOAD_DEVIS', payload: [] });
    }
  };

  const saveDevis = async (devis: Devis) => {
    try {
      const database = await initializeDB();

      await database.runAsync(
        `INSERT OR REPLACE INTO devis 
        (id,title,date,type,prix_total,user_email,dimensions,details,imageUri,svgContent,analysisResult,method,timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
          devis.id || '', 
          devis.title || '', 
          devis.date || '', 
          devis.type || '', 
          devis.prix_total || 0,
          devis.user_email || '',
          safeJsonStringify(devis.dimensions),
          safeJsonStringify(devis.details),
          devis.imageUri || '',
          devis.svgContent || '',
          safeJsonStringify(devis.analysisResult),
          devis.method || '', 
          devis.timestamp || ''
        ]
      );
    } catch (error) {
      console.error('Error saving devis:', error);
      throw error;
    }
  };

  const generateId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}_${random}`;
  };

  const addDevis = async (data: Omit<Devis,'id'|'timestamp'>) => {
    try {
      const newDevis: Devis = { 
        ...data, 
        id: generateId(), 
        timestamp: new Date().toISOString(),
        user_email: data.user_email || userEmail || 'anonyme' 
      };
      
      await saveDevis(newDevis);
      dispatch({ type:'ADD_DEVIS', payload: newDevis });
    } catch (error) {
      console.error('Error adding devis:', error);
      throw error;
    }
  };

 const deleteDevis = async (id: string) => {
  try {
    console.log("Suppression devis id:", id);
    const database = await initializeDB();
    
    if (isWeb) {
     
      await (database as WebSQLiteSimulator).deleteById(id);
    } else {
    
      await database.withTransactionAsync(async () => {
        await database.runAsync('DELETE FROM devis WHERE id = ?;', [id]);
      });
    }
    
    console.log("Suppression effectuée en DB");

    dispatch({ type: 'DELETE_DEVIS', payload: id });
    console.log("Dispatch DELETE_DEVIS terminé");
  } catch (error) {
    console.error('Error deleting devis:', error);
    throw error;
  }
};

  const updateDevis = async (id: string, updates: Partial<Devis>) => {
    try {
      const existing = state.devis.find(d => d.id === id);
      if (!existing) {
        console.warn(`Devis with id ${id} not found`);
        return;
      }

      const updated = { ...existing, ...updates };
      await saveDevis(updated);
      dispatch({ type:'UPDATE_DEVIS', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating devis:', error);
      throw error;
    }
  };

  const clearDevis = async () => {
    try {
      const database = await initializeDB();
      
      if (isWeb) {
        await (database as WebSQLiteSimulator).clear();
      } else {
        await database.runAsync('DELETE FROM devis;');
      }
      
      dispatch({ type:'CLEAR_DEVIS' });
    } catch (error) {
      console.error('Error clearing devis:', error);
      throw error;
    }
  };

  const refreshDevis = () => { 
    loadDevisFromDB(userEmail); 
  };

  const contextValue: DevisContextProps = {
    state,
    addDevis,
    deleteDevis,
    updateDevis,
    clearDevis,
    refreshDevis
  };

  return (
    <Deviscontext.Provider value={contextValue}>
      {children}
    </Deviscontext.Provider>
  );
};

export const useDevis = (): DevisContextProps => {
  const context = useContext(Deviscontext);
  if (!context) {
    throw new Error('useDevis must be used within a DevisProvider');
  }
  return context;

};
