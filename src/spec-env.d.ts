// Kept apart from vite-env.d.ts, which designers' forks often add their own declarations to,
// so syncing never conflicts there.

/** Code fingerprints of prototypes with a spec.tsx (scripts/spec/prototype-hash.mjs) */
declare module 'virtual:prototype-hashes' {
  const hashes: Record<string, string | null>;
  export default hashes;
}
