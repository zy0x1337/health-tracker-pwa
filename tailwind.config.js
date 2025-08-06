/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',  
        accent: '#8B5CF6',
        'base-100': '#ffffff',
        'base-200': '#f8fafc',
        'base-300': '#e2e8f0'
      }
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          neutral: '#64748B',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          info: '#0EA5E9',
          success: '#10B981', 
          warning: '#F59E0B',
          error: '#EF4444'
        }
      },
      'dark'
    ],
    darkTheme: 'dark'
  }
}
