import { toSnakeCase } from '../helpers';

export default class LocalStorageManager {
  
  constructor(appConfig) {
    
    if (!appConfig) {
      throw new Error('[LocalStorageManager] appConfig is required');
    }
    
    if (!appConfig.appName) {
      throw new Error('[LocalStorageManager] appConfig.appName is required');
    }
    
    if (appConfig.dataVersion === undefined) {
      throw new Error('[LocalStorageManager] appConfig.dataVersion is required');
    }
    
    this.appConfig       = appConfig;
    this.appName         = appConfig.appName;
    this.appNameInternal = toSnakeCase(appConfig.appName);
    this.dataVersion     = appConfig.dataVersion;
    this.keyPrefix       = `mrph_app_${this.appNameInternal}_${this.dataVersion}_`;
  }
  
  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  getFullKey(key) {
    return `${this.keyPrefix}${key}`;
  }
  
  ensureSupported() {
    if (typeof localStorage === 'undefined') {
      throw new Error('[LocalStorageManager] localStorage is not supported');
    }
  }
  
  /* Core Operations (Layer 1)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  
  getItem(key) {
    this.ensureSupported();
    
    const fullKey = this.getFullKey(key);
    const value   = localStorage.getItem(fullKey);
    
    if (value === null) {
      return null;
    }
    
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  
  setItem(key, value) {
    this.ensureSupported();
    
    const fullKey = this.getFullKey(key);
    const existing = localStorage.getItem(fullKey);
    
    if (existing !== null) {
      throw new Error(`[LocalStorageManager] Item "${key}" already exists`);
    }
    
    localStorage.setItem(fullKey, JSON.stringify(value));
    console.log(`[LocalStorageManager] Set item: ${key}`);
    return value;
  }
  
  updateItem(key, value) {
    this.ensureSupported();
    
    const fullKey  = this.getFullKey(key);
    const existing = localStorage.getItem(fullKey);
    
    if (existing === null) {
      throw new Error(`[LocalStorageManager] Item "${key}" not found`);
    }
    
    let updated;
    try {
      const parsed = JSON.parse(existing);
      if (typeof parsed === 'object' && parsed !== null && typeof value === 'object' && value !== null) {
        updated = { ...parsed, ...value };
      } else {
        updated = value;
      }
    } catch (e) {
      updated = value;
    }
    
    localStorage.setItem(fullKey, JSON.stringify(updated));
    console.log(`[LocalStorageManager] Updated item: ${key}`);
    return updated;
  }
  
  upsertItem(key, value) {
    this.ensureSupported();
    
    const fullKey = this.getFullKey(key);
    localStorage.setItem(fullKey, JSON.stringify(value));
    console.log(`[LocalStorageManager] Upserted item: ${key}`);
    return value;
  }
  
  deleteItem(key) {
    this.ensureSupported();
    
    const fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
    console.log(`[LocalStorageManager] Deleted item: ${key}`);
    return true;
  }
  
  getAllItems() {
    this.ensureSupported();
    
    const result = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      
      if (fullKey.startsWith(this.keyPrefix)) {
        const key   = fullKey.slice(this.keyPrefix.length);
        const value = localStorage.getItem(fullKey);
        
        try {
          result[key] = JSON.parse(value);
        } catch (e) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }
  
  getAllKeys() {
    this.ensureSupported();
    
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      
      if (fullKey.startsWith(this.keyPrefix)) {
        keys.push(fullKey.slice(this.keyPrefix.length));
      }
    }
    
    return keys;
  }
  
  clear() {
    this.ensureSupported();
    
    const keys = this.getAllKeys();
    
    for (const key of keys) {
      localStorage.removeItem(this.getFullKey(key));
    }
    
    console.log(`[LocalStorageManager] Cleared ${keys.length} items`);
    return keys.length;
  }
  
}