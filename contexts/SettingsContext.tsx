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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_API_KEY = 'pixshop_api_key';
const STORAGE_KEY_MODEL = 'pixshop_model';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [model, setModelState] = useState<ModelType>('gemini-2.5-flash-image');

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);

    if (storedKey) setApiKeyState(storedKey);
    if (storedModel && (storedModel === 'gemini-2.5-flash-image' || storedModel === 'gemini-3-pro-image-preview')) {
        setModelState(storedModel as ModelType);
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

  return (
    <SettingsContext.Provider value={{ apiKey, setApiKey, model, setModel }}>
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
