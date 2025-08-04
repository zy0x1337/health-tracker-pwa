module.exports = {
  content: [
    "./**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./js/**/*.js",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/daisyui/dist/**/*.js"
  ],
  plugins: [
    require('flowbite/plugin'),
    require('daisyui')
  ],
  // DaisyUI Theme-Konfiguration erweitert
  daisyui: {
    themes: [
      "light",      // Standard Hell
      "dark",       // Standard Dunkel  
      "cupcake",    // Rosa/Pink Theme
      "corporate"   // Business/Professional Theme
    ],
    darkTheme: "dark", // Welches Theme bei Prefers Dark Mode
    base: true,        // CSS-Basis-Styles anwenden
    styled: true,      // Styled Components
    utils: true        // Utility-Classes
  }
}
