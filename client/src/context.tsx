import React, { useState } from 'react'

interface ContextType {
	alert: Alert | null
	setAlert: (alert: Alert | null) => void
}

export const Context = React.createContext({} as ContextType)

export function ContextProvider({ children }: { children: React.ReactNode }) {
	const [alert, setAlert] = useState<Alert | null>(null)

	return <Context.Provider value={{ alert, setAlert }}>{children}</Context.Provider>
}
