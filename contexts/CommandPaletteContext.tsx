import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CommandPalette = lazy(() => import('../components/CommandPalette'));
const CommandPaletteContext = createContext<{ openPalette: () => void } | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const openPalette = useCallback(() => {
    if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
    setOpen(true);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.shiftKey ||
        event.isComposing ||
        event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== 'k'
      )
        return;
      if (isOpen) {
        event.preventDefault();
        closePalette();
      } else if (!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) {
        event.preventDefault();
        openPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, openPalette, closePalette]);
  const value = useMemo(() => ({ openPalette }), [openPalette]);
  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={closePalette} />
        </Suspense>
      )}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
