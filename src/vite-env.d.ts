interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {}

declare module '*.png' {
  const source: string;
  export default source;
}

declare module '*.jpg' {
  const source: string;
  export default source;
}