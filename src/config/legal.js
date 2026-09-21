/** Configurable legal targets for Login (FR-4). Override via Vite env in each environment. */
export const TERMS_AND_PRIVACY_URL =
  import.meta.env.VITE_TERMS_AND_PRIVACY_URL ?? 'https://www.acldigital.com/'
