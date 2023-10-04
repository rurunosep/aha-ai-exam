export interface IUser {
	id: number
	email: string
	passwordHash?: string
	googleId?: string
	displayName: string
}

declare global {
	namespace Express {
		interface User extends IUser {}
	}
}
