// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
    
//     "./app/**/*.{js,jsx,ts,tsx}",
//     "./app/components/**/*.{js,jsx,ts,tsx}", 
//     "./app/components/admin-panel/**/*.{js,jsx,ts,tsx}",
//         "./app/user_utils/**/*.{js,jsx,ts,tsx}",

//   ],
//   presets: [require("nativewind/preset")],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./components/admin_panel/**/*.{js,jsx,ts,tsx}",
    "./user_utils/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
