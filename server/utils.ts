// Check if password contains a number, a special character, a lowercase,
// an uppercase, and has 8+ characters
export function validatePassword(password: string): boolean {
	return /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password)
}
