/// <reference types="vite/client" />

// Typed environment variables exposed at build time via import.meta.env.
interface ImportMetaEnv {
  /** Zapier "Catch Hook" URL — POST target for new bookings. */
  readonly VITE_ZAPIER_WEBHOOK_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow plain CSS side-effect imports.
declare module '*.css';
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.mp4' {
  const src: string;
  export default src;
}
