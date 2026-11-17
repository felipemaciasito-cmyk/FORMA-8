import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ root: __dirname, base: "./", publicDir: false, plugins: [react()], build: { outDir: process.env.LABO_OUT, emptyOutDir: true } });
