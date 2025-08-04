module.exports = {
  content: [
  "./**/*.html",
  "./src/**/*.{js,ts,jsx,tsx}",

  // Plugins
  "./node_modules/flowbite/**/*.js",
  "./node_modules/daisyui/dist/**/*.js"
  ],
  plugins: [
    require('flowbite/plugin'),
    require('daisyui')
  ],
  // DaisyUI Theme-Konfiguration (optional)
  daisyui: {
    themes: ["light", "dark", "cupcake", "corporate"] // etc.
  }
}
