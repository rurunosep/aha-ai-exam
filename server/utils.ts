// Check if password contains a number, a special character, a lowercase,
// an uppercase, and has 8+ characters
// eslint-disable-next-line import/prefer-default-export
export function validatePassword(password: string): boolean {
  return /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);
}
