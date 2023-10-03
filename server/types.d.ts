export interface IUser {
	id: number
	email: string
	password_hash: string
}

declare global {
	namespace Express {
		interface User extends IUser {}
	}
}
