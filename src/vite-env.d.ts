/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  readonly VITE_GOOGLE_STREET_VIEW_API_KEY?: string;
  readonly VITE_IS_PREVIEW: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
