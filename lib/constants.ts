// Constantes fáciles de encontrar. Los números tienen que coincidir
// con supabase/migrations/20260928140000_seguridad_beta.sql

// TODO: reemplazar por el correo real de contacto antes de la beta pública.
export const CONTACT_EMAIL = "CAMBIAR_ESTE_CORREO@ejemplo.com";

export const LIMITS = {
  title: 120,
  eventDescription: 8000,
  submissionDescription: 2000,
  comment: 2000,
  repoUrl: 200,
  demoUrl: 500,
} as const;

export const MAX_EVENTS_PER_DAY = 5;
