export const validation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  isValidPassword(password: string): boolean {
    return password.length >= 6;
  },

  doPasswordsMatch(p1: string, p2: string): boolean {
    return p1 === p2;
  },
};
