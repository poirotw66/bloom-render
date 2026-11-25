import React, { createContext, useContext, useMemo, useState } from 'react';

export interface ToolCommand {
  id: string;
  label: string;
  onSelect: () => void;
}

interface ToolCommandsContextValue {
  commands: ToolCommand[];
  setCommands: React.Dispatch<React.SetStateAction<ToolCommand[]>>;
}

const ToolCommandsContext = createContext<ToolCommandsContextValue | undefined>(undefined);

export function ToolCommandsProvider({ children }: { children: React.ReactNode }) {
  const [commands, setCommands] = useState<ToolCommand[]>([]);
  const value = useMemo(() => ({ commands, setCommands }), [commands]);
  return <ToolCommandsContext.Provider value={value}>{children}</ToolCommandsContext.Provider>;
}

export function useToolCommands(): ToolCommandsContextValue {
  const context = useContext(ToolCommandsContext);
  if (!context) throw new Error('useToolCommands must be used within a ToolCommandsProvider');
  return context;
}
