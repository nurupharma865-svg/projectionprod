const STORAGE_KEY = 'projetexte-remote-code';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const REMOTE_CODE_PATTERN = /^[A-Z2-9]{6}$/;

export function getRemoteCode(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && REMOTE_CODE_PATTERN.test(stored)) return stored;

  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
  localStorage.setItem(STORAGE_KEY, code);
  return code;
}

export function buildRemoteUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}?remote=${code}`;
}
