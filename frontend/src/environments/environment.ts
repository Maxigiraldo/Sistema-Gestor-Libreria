export const environment = {
  production: true,
  apiUrl: (import.meta as any).env?.NG_APP_API_URL ?? 'http://localhost:3000',
  googleBooksApiKey: (import.meta as any).env?.NG_APP_GOOGLE_BOOKS_KEY ?? '',
};
