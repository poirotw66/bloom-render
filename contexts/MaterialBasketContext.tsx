import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addMaterialToBasket,
  createMaterialBasketTransfer,
  MATERIAL_BASKET_STORAGE_KEY,
  parseMaterialBasketTransfer,
  type MaterialBasketMessage,
} from '../utils/materialBasket';

function loadBasket(): { materialIds: string[]; message: MaterialBasketMessage } {
  try {
    const stored = localStorage.getItem(MATERIAL_BASKET_STORAGE_KEY);
    if (!stored) return { materialIds: [], message: null };
    const materialIds = parseMaterialBasketTransfer(JSON.parse(stored));
    return materialIds
      ? { materialIds, message: null }
      : { materialIds: [], message: 'invalid-saved-basket' };
  } catch {
    return { materialIds: [], message: 'invalid-saved-basket' };
  }
}

type BasketState = ReturnType<typeof loadBasket>;
interface MaterialBasketValue extends BasketState {
  isOpen: boolean;
  addMaterial: (id: string) => void;
  removeMaterial: (id: string) => void;
  clear: () => void;
  openBasket: () => void;
  closeBasket: () => void;
}
const MaterialBasketContext = createContext<MaterialBasketValue | undefined>(undefined);

export function MaterialBasketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(loadBasket);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(
        MATERIAL_BASKET_STORAGE_KEY,
        JSON.stringify(createMaterialBasketTransfer(state.materialIds)),
      );
    } catch {
      setState((current) => ({ ...current, message: 'storage-unavailable' }));
    }
  }, [state.materialIds]);
  const addMaterial = useCallback((id: string) => {
    setState((current) => addMaterialToBasket(current.materialIds, id));
  }, []);
  const removeMaterial = useCallback((id: string) => {
    setState((current) => ({
      materialIds: current.materialIds.filter((selected) => selected !== id),
      message: 'removed',
    }));
  }, []);
  const clear = useCallback(() => setState({ materialIds: [], message: 'cleared' }), []);
  const openBasket = useCallback(() => setOpen(true), []);
  const closeBasket = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ ...state, isOpen, addMaterial, removeMaterial, clear, openBasket, closeBasket }),
    [state, isOpen, addMaterial, removeMaterial, clear, openBasket, closeBasket],
  );
  return <MaterialBasketContext.Provider value={value}>{children}</MaterialBasketContext.Provider>;
}

export function useMaterialBasket(): MaterialBasketValue {
  const context = useContext(MaterialBasketContext);
  if (!context) throw new Error('useMaterialBasket must be used within MaterialBasketProvider');
  return context;
}
