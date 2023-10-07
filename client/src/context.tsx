import React, { useMemo, useState } from 'react';

interface ContextType {
  alert: Alert | null
  setAlert: (alert: Alert | null) => void
}

export const Context = React.createContext({} as ContextType);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<Alert | null>(null);

  const value = useMemo(() => ({ alert, setAlert }), [alert, setAlert]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
