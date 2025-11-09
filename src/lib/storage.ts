// Local Storage utilities for CTC Configuration

export interface CTCConfiguration {
  version: number;
  timestamp: number;
  assessmentYear: string;
  pfType: 'percentage' | 'fixed';
  previousSalary: number;
  pfValue: number; // Either percentage or fixed amount
  expectedSalaries: number[]; // Max 5 variations
}

const STORAGE_KEY = 'ctc-configurations';
const MAX_SALARIES = 5;

export const CTCStorage = {
  // Get all configurations
  getAll: (): CTCConfiguration[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  // Get the latest version
  getLatest: (): CTCConfiguration | null => {
    const configs = CTCStorage.getAll();
    if (configs.length === 0) return null;
    
    // Sort by version descending and return the first one
    return configs.sort((a, b) => b.version - a.version)[0];
  },

  // Get a specific version
  getVersion: (version: number): CTCConfiguration | null => {
    const configs = CTCStorage.getAll();
    return configs.find(config => config.version === version) || null;
  },

  // Save a new configuration
  save: (config: Omit<CTCConfiguration, 'version' | 'timestamp'>): CTCConfiguration => {
    const configs = CTCStorage.getAll();
    const nextVersion = configs.length > 0 
      ? Math.max(...configs.map(c => c.version)) + 1 
      : 1;

    // Ensure expected salaries is limited to max 5
    const limitedSalaries = config.expectedSalaries.slice(0, MAX_SALARIES);

    const newConfig: CTCConfiguration = {
      ...config,
      expectedSalaries: limitedSalaries,
      version: nextVersion,
      timestamp: Date.now(),
    };

    const updatedConfigs = [...configs, newConfig];
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      return newConfig;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  },

  // Delete a specific version
  deleteVersion: (version: number): void => {
    const configs = CTCStorage.getAll();
    const filtered = configs.filter(config => config.version !== version);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      throw error;
    }
  },

  // Clear all configurations
  clearAll: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  },

  // Get all versions (just version numbers and timestamps)
  getVersionList: (): { version: number; timestamp: number }[] => {
    const configs = CTCStorage.getAll();
    return configs
      .map(config => ({ version: config.version, timestamp: config.timestamp }))
      .sort((a, b) => b.version - a.version);
  },
};
