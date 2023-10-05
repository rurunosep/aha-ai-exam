export interface IUser {
	id: number
	email: string
	displayName: string
	verified: boolean
	passwordHash?: string
	googleId?: string
}

declare global {
	namespace Express {
		interface User extends IUser {}
	}
}
