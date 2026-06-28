const APP_MODE = import.meta.env.VITE_APP_MODE || 'public';

export const esPersonal = APP_MODE === 'personal';
export const esPublica = APP_MODE === 'public';
