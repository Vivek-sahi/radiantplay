// Vite imports static assets as URL strings. Declare the modules so TypeScript
// resolves `import x from './foo.svg'` (used for the Radiance top-wash gradient).
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
