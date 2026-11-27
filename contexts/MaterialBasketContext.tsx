import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addMaterialToBasket,
  addMaterialsToBasket,
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

type BasketState = ReturnType<typeof loadBasket> & { undoIds: string[] | null };
interface MaterialBasketValue extends BasketState {
  isOpen: boolean;
  canUndoClear: boolean;
  undoClear: () => void;
  addMaterials: (ids: string[]) => { ok: boolean; message: MaterialBasketMessage };
  addMaterial: (id: string) => void;
  removeMaterial: (id: string) => void;
  clear: () => void;
  openBasket: () => void;
  closeBasket: () => void;
}
const MaterialBasketContext = createContext<MaterialBasketValue | undefined>(undefined);

export function MaterialBasketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BasketState>(() => ({ ...loadBasket(), undoIds: null }));
  const stateRef = useRef(state);
  const commit = useCallback((next: BasketState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(
        MATERIAL_BASKET_STORAGE_KEY,
        JSON.stringify(createMaterialBasketTransfer(state.materialIds)),
      );
    } catch {
      commit({ ...stateRef.current, message: 'storage-unavailable' });
    }
  }, [state.materialIds, commit]);
  const addMaterial = useCallback(
    (id: string) => {
      const current = stateRef.current;
      const next = addMaterialToBasket(current.materialIds, id);
      commit({
        ...next,
        undoIds: next.materialIds === current.materialIds ? current.undoIds : null,
      });
    },
    [commit],
  );
  const addMaterials = useCallback(
    (ids: string[]) => {
      const current = stateRef.current;
      const next = addMaterialsToBasket(current.materialIds, ids);
      commit({
        materialIds: next.materialIds,
        message: next.message,
        undoIds: next.materialIds === current.materialIds ? current.undoIds : null,
      });
      return { ok: next.ok, message: next.message };
    },
    [commit],
  );
  const removeMaterial = useCallback(
    (id: string) => {
      const current = stateRef.current;
      if (!current.materialIds.includes(id)) return;
      commit({
        materialIds: current.materialIds.filter((selected) => selected !== id),
        message: 'removed',
        undoIds: null,
      });
    },
    [commit],
  );
  const clear = useCallback(() => {
    const current = stateRef.current;
    if (!current.materialIds.length) return;
    commit({ materialIds: [], message: 'cleared', undoIds: [...current.materialIds] });
  }, [commit]);
  const undoClear = useCallback(() => {
    const current = stateRef.current;
    if (!current.undoIds) return;
    commit({ materialIds: [...current.undoIds], message: 'restored', undoIds: null });
  }, [commit]);
  const openBasket = useCallback(() => setOpen(true), []);
  const closeBasket = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({
      ...state,
      isOpen,
      canUndoClear: state.undoIds !== null,
      undoClear,
      addMaterials,
      addMaterial,
      removeMaterial,
      clear,
      openBasket,
      closeBasket,
    }),
    [
      state,
      isOpen,
      undoClear,
      addMaterials,
      addMaterial,
      removeMaterial,
      clear,
      openBasket,
      closeBasket,
    ],
  );
  return <MaterialBasketContext.Provider value={value}>{children}</MaterialBasketContext.Provider>;
}

export function useMaterialBasket(): MaterialBasketValue {
  const context = useContext(MaterialBasketContext);
  if (!context) throw new Error('useMaterialBasket must be used within MaterialBasketProvider');
  return context;
}
