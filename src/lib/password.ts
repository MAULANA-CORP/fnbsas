export const MIN_PASSWORD = 8;

export function validasiPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) {
    return `Password minimal ${MIN_PASSWORD} karakter`;
  }
  return null;
}
