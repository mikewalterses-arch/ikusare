import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',     // rojo vasco
        secondary: '#1D3557',   // azul profundo
        background: '#F1FAEE',  // blanco cálido
      },
      fontFamily: {
        // fuente por defecto de la app (Inter)
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // para títulos vistosos
        poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        // para branding / headers
        montserrat: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        // ← NUEVA: Barriecito para textos decorativos y el eslogan grande
        barriecito: ['var(--font-barriecito)', 'cursive', 'system-ui'],
      },
    },
  },
  plugins: [],
};

export default config;