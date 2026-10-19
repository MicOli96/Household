// Webbläsaren har redan localStorage, så här behövs ingenting.
// Om expo-sqlite importerades på webben skulle den kräva en .wasm-fil som Metro inte kan läsa (#57).
// Telefonens version finns i localStorage.native.ts.
export {};
