/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e65fa',
          secondary: '#f3ff43',
          black: '#0f0f0f',
          blue: '#2d62ff',
          'blue-dark': '#080331',
        },
        neutral: {
          white: '#fff',
          black: '#0f0f0f',
          lightest: '#eee',
          lighter: '#ccc',
          light: '#aaa',
          gray: '#666',
          dark: '#444',
          darker: '#222',
          darkest: '#111',
        },
        system: {
          green: '#26a69a',
          red: '#ef5350',
        },
      },
      borderRadius: {
        card: '0.75rem',
        sm: '0.5rem',
      },
    },
  },
  plugins: [],
}
