/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { DEFAULT_MODEL, type ModelType, resolveStoredModel } from '../constants/models';
import {
  DEFAULT_OPENROUTER_MODEL,
  isImageProviderId,
  resolveStoredOpenRouterModel,
  type ImageProviderId,
  type OpenRouterModel,
} from '../services/imageProviders';
import type { ServiceSettings } from '../services/gemini/shared';
import { migrateAllApiKeysFromLocalStorage, writeApiKey } from '../utils/credentialStorage';

export type { ModelType } from '../constants/models';
export type { ImageProviderId, OpenRouterModel };

interface SettingsContextType {
  imageProvider: ImageProviderId;
  setImageProvider: (provider: ImageProviderId) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: ModelType;
  setModel: (model: ModelType) => void;
  openRouterApiKey: string;
  setOpenRouterApiKey: (key: string) => void;
  openRouterModel: OpenRouterModel;
  setOpenRouterModel: (model: OpenRouterModel) => void;
  /** Key for the currently selected provider. */
  effectiveApiKey: string;
  /** Model id for the currently selected provider. */
  effectiveModel: string;
  enableImageCompression: boolean;
  setEnableImageCompression: (enabled: boolean) => void;
  compressionThresholdMB: number;
  setCompressionThresholdMB: (threshold: number) => void;
  enableBackgroundMotion: boolean;
  setEnableBackgroundMotion: (enabled: boolean) => void;
  /** Build ServiceSettings for geminiService / ImageProvider calls. */
  toServiceSettings: (abortSignal?: AbortSignal) => ServiceSettings;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_MODEL = 'pixshop_model';
const STORAGE_KEY_PROVIDER = 'pixshop_image_provider';
const STORAGE_KEY_OPENROUTER_MODEL = 'pixshop_openrouter_model';
const STORAGE_KEY_COMPRESSION_ENABLED = 'pixshop_compression_enabled';
const STORAGE_KEY_COMPRESSION_THRESHOLD = 'pixshop_compression_threshold';
const STORAGE_KEY_BACKGROUND_MOTION = 'pixshop_background_motion';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageProvider, setImageProviderState] = useState<ImageProviderId>('gemini');
  const [apiKey, setApiKeyState] = useState<string>('');
  const [model, setModelState] = useState<ModelType>(DEFAULT_MODEL);
  const [openRouterApiKey, setOpenRouterApiKeyState] = useState<string>('');
  const [openRouterModel, setOpenRouterModelState] =
    useState<OpenRouterModel>(DEFAULT_OPENROUTER_MODEL);
  const [enableImageCompression, setEnableImageCompressionState] = useState<boolean>(true);
  const [compressionThresholdMB, setCompressionThresholdMBState] = useState<number>(5);
  const [enableBackgroundMotion, setEnableBackgroundMotionState] = useState<boolean>(false);

  useEffect(() => {
    // Secrets: sessionStorage (+ one-time localStorage → sessionStorage migration).
    const migrated = migrateAllApiKeysFromLocalStorage();
    if (migrated.gemini) setApiKeyState(migrated.gemini);
    if (migrated.openrouter) setOpenRouterApiKeyState(migrated.openrouter);

    // Non-secret prefs stay in localStorage.
    const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    const storedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
    const storedOpenRouterModel = localStorage.getItem(STORAGE_KEY_OPENROUTER_MODEL);
    const storedCompressionEnabled = localStorage.getItem(STORAGE_KEY_COMPRESSION_ENABLED);
    const storedCompressionThreshold = localStorage.getItem(STORAGE_KEY_COMPRESSION_THRESHOLD);
    const storedBackgroundMotion = localStorage.getItem(STORAGE_KEY_BACKGROUND_MOTION);

    if (storedProvider && isImageProviderId(storedProvider)) {
      setImageProviderState(storedProvider);
    }

    const resolvedModel = resolveStoredModel(storedModel);
    setModelState(resolvedModel);
    if (storedModel !== resolvedModel) {
      localStorage.setItem(STORAGE_KEY_MODEL, resolvedModel);
    }

    const resolvedOpenRouterModel = resolveStoredOpenRouterModel(storedOpenRouterModel);
    setOpenRouterModelState(resolvedOpenRouterModel);
    if (storedOpenRouterModel !== resolvedOpenRouterModel) {
      localStorage.setItem(STORAGE_KEY_OPENROUTER_MODEL, resolvedOpenRouterModel);
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
    if (storedBackgroundMotion === 'true') {
      setEnableBackgroundMotionState(true);
    }
  }, []);

  const setImageProvider = (provider: ImageProviderId) => {
    setImageProviderState(provider);
    localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    writeApiKey('gemini', key);
  };

  const setModel = (m: ModelType) => {
    setModelState(m);
    localStorage.setItem(STORAGE_KEY_MODEL, m);
  };

  const setOpenRouterApiKey = (key: string) => {
    setOpenRouterApiKeyState(key);
    writeApiKey('openrouter', key);
  };

  const setOpenRouterModel = (m: OpenRouterModel) => {
    setOpenRouterModelState(m);
    localStorage.setItem(STORAGE_KEY_OPENROUTER_MODEL, m);
  };

  const setEnableImageCompression = (enabled: boolean) => {
    setEnableImageCompressionState(enabled);
    localStorage.setItem(STORAGE_KEY_COMPRESSION_ENABLED, String(enabled));
  };

  const setCompressionThresholdMB = (threshold: number) => {
    setCompressionThresholdMBState(threshold);
    localStorage.setItem(STORAGE_KEY_COMPRESSION_THRESHOLD, String(threshold));
  };

  const setEnableBackgroundMotion = (enabled: boolean) => {
    setEnableBackgroundMotionState(enabled);
    localStorage.setItem(STORAGE_KEY_BACKGROUND_MOTION, String(enabled));
  };

  const effectiveApiKey = imageProvider === 'openrouter' ? openRouterApiKey : apiKey;
  const effectiveModel = imageProvider === 'openrouter' ? openRouterModel : model;

  const toServiceSettings = useCallback(
    (abortSignal?: AbortSignal): ServiceSettings => ({
      provider: imageProvider,
      apiKey: effectiveApiKey,
      model: effectiveModel,
      abortSignal,
    }),
    [imageProvider, effectiveApiKey, effectiveModel],
  );

  const value = useMemo(
    () => ({
      imageProvider,
      setImageProvider,
      apiKey,
      setApiKey,
      model,
      setModel,
      openRouterApiKey,
      setOpenRouterApiKey,
      openRouterModel,
      setOpenRouterModel,
      effectiveApiKey,
      effectiveModel,
      enableImageCompression,
      setEnableImageCompression,
      compressionThresholdMB,
      setCompressionThresholdMB,
      enableBackgroundMotion,
      setEnableBackgroundMotion,
      toServiceSettings,
    }),
    [
      imageProvider,
      apiKey,
      model,
      openRouterApiKey,
      openRouterModel,
      effectiveApiKey,
      effectiveModel,
      enableImageCompression,
      compressionThresholdMB,
      enableBackgroundMotion,
      toServiceSettings,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
