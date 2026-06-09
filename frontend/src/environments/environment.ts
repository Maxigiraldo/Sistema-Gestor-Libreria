export const environment = {
  production: true,
  apiUrl: (import.meta as any).env?.NG_APP_API_URL ?? 'sistema-gestor-libreria-production.up.railway.app',
  googleBooksApiKey: (import.meta as any).env?.NG_APP_GOOGLE_BOOKS_KEY ?? '',
};
