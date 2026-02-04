/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type ModelType = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

interface SettingsContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: ModelType;
  setModel: (model: ModelType) => void;
  enableImageCompression: boolean;
  setEnableImageCompression: (enabled: boolean) => void;
  compressionThresholdMB: number;
  setCompressionThresholdMB: (threshold: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_API_KEY = 'pixshop_api_key';
const STORAGE_KEY_MODEL = 'pixshop_model';
const STORAGE_KEY_COMPRESSION_ENABLED = 'pixshop_compression_enabled';
const STORAGE_KEY_COMPRESSION_THRESHOLD = 'pixshop_compression_threshold';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [model, setModelState] = useState<ModelType>('gemini-2.5-flash-image');
  const [enableImageCompression, setEnableImageCompressionState] = useState<boolean>(true);
  const [compressionThresholdMB, setCompressionThresholdMBState] = useState<number>(5);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    const storedCompressionEnabled = localStorage.getItem(STORAGE_KEY_COMPRESSION_ENABLED);
    const storedCompressionThreshold = localStorage.getItem(STORAGE_KEY_COMPRESSION_THRESHOLD);

    if (storedKey) setApiKeyState(storedKey);
    if (storedModel && (storedModel === 'gemini-2.5-flash-image' || storedModel === 'gemini-3-pro-image-preview')) {
        setModelState(storedModel as ModelType);
    }
    if (storedCompressionEnabled !== null) {
      setEnableImageCompressionState(storedCompressionEnabled === 'true');
    }
    if (storedCompressionThreshold !== null) {
      const threshold = parseFloat(storedCompressionThreshold);
      if (!isNaN(threshold) && threshold > 0) {
        setCompressionThresholdMBState(threshold);
      }
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
  };

  const setModel = (m: ModelType) => {
    setModelState(m);
    localStorage.setItem(STORAGE_KEY_MODEL, m);
  };

  const setEnableImageCompression = (enabled: boolean) => {
    setEnableImageCompressionState(enabled);
    localStorage.setItem(STORAGE_KEY_COMPRESSION_ENABLED, String(enabled));
  };

  const setCompressionThresholdMB = (threshold: number) => {
    setCompressionThresholdMBState(threshold);
    localStorage.setItem(STORAGE_KEY_COMPRESSION_THRESHOLD, String(threshold));
  };

  return (
    <SettingsContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      model, 
      setModel,
      enableImageCompression,
      setEnableImageCompression,
      compressionThresholdMB,
      setCompressionThresholdMB,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
