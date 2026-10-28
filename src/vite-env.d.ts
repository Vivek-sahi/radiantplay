/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

/** Code fingerprints of prototypes with a spec.tsx (scripts/spec/prototype-hash.mjs) */
declare module 'virtual:prototype-hashes' {
  const hashes: Record<string, string | null>;
  export default hashes;
}

