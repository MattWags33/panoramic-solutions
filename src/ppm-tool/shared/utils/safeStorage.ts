/**
 * Safe Storage Utilities
 * Provides fallback mechanisms for localStorage/sessionStorage access
 * Handles corporate policies, private browsing, and SSR scenarios
 */

interface SafeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => boolean;
  clear: () => boolean;
  isAvailable: () => boolean;
}

class MemoryStorageFallback implements SafeStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): boolean {
    try {
      this.data.set(key, value);
      return true;
    } catch {
      return false;
    }
  }

  removeItem(key: string): boolean {
    try {
      this.data.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      this.data.clear();
      return true;
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    return true; // Memory storage is always available
  }
}

class SafeStorageAdapter implements SafeStorage {
  private storage: Storage | null = null;
  private fallback = new MemoryStorageFallback();
  private available = false;

  constructor(storageType: 'localStorage' | 'sessionStorage') {
    this.initializeStorage(storageType);
  }

  private initializeStorage(storageType: 'localStorage' | 'sessionStorage') {
    if (typeof window === 'undefined') {
      this.available = false;
      return;
    }

    try {
      const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
      
      // Test storage functionality
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      const result = storage.getItem(testKey) === 'test';
      storage.removeItem(testKey);
      
      if (result) {
        this.storage = storage;
        this.available = true;
      }
    } catch (error) {
      console.warn(`${storageType} not available, using memory fallback:`, error);
      this.available = false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.available && this.storage) {
        return this.storage.getItem(key);
      }
      return this.fallback.getItem(key);
    } catch {
      return this.fallback.getItem(key);
    }
  }

  setItem(key: string, value: string): boolean {
    try {
      if (this.available && this.storage) {
        this.storage.setItem(key, value);
        return true;
      }
      return this.fallback.setItem(key, value);
    } catch {
      return this.fallback.setItem(key, value);
    }
  }

  removeItem(key: string): boolean {
    try {
      if (this.available && this.storage) {
        this.storage.removeItem(key);
        return true;
      }
      return this.fallback.removeItem(key);
    } catch {
      return this.fallback.removeItem(key);
    }
  }

  clear(): boolean {
    try {
      if (this.available && this.storage) {
        this.storage.clear();
        return true;
      }
      return this.fallback.clear();
    } catch {
      return this.fallback.clear();
    }
  }

  isAvailable(): boolean {
    return this.available;
  }
}

// Singleton instances
export const safeLocalStorage = new SafeStorageAdapter('localStorage');
export const safeSessionStorage = new SafeStorageAdapter('sessionStorage');

// Convenience functions for JSON data
export const safeLocalStorageJSON = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = safeLocalStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  setItem: <T>(key: string, value: T): boolean => {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    return safeLocalStorage.removeItem(key);
  }
};

export const safeSessionStorageJSON = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = safeSessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  setItem: <T>(key: string, value: T): boolean => {
    try {
      return safeSessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    return safeSessionStorage.removeItem(key);
  }
};

// Debug information
export const getStorageDebugInfo = () => {
  return {
    localStorage: {
      available: safeLocalStorage.isAvailable(),
      type: safeLocalStorage.isAvailable() ? 'native' : 'memory'
    },
    sessionStorage: {
      available: safeSessionStorage.isAvailable(),
      type: safeSessionStorage.isAvailable() ? 'native' : 'memory'
    },
    environment: {
      isSSR: typeof window === 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
    }
  };
};
