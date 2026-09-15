/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvasHome: '#F0F2E9',
        primaryDark: '#153018',
        forestDeep: '#112513',
        forestPrimary: '#183119',
        accentOlive: '#476C19',
        accentOliveRich: '#3D6414',
        accentMint: '#86BB71',
        cardBorder: '#ECEFE4',
        headingDark: '#152A17',
        subtitleTracked: '#798C76',
        textMutedLight: '#A3BEA1',
        textTerms: '#5F7E5C',
        navBg: '#152E18',
        navActiveCircle: '#476C19',
        navInactiveIcon: '#789474',
        badgeGpaBg: '#274423',
        badgeGpaText: '#A7F3D0',
        tagBg: '#EDF3E8',
        tagText: '#2C4C16',
      },
      fontFamily: {
        regular: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
        bolditalic: ['PlusJakartaSans_700Bold_Italic'],
        semibolditalic: ['PlusJakartaSans_600SemiBold_Italic'],
      },
    },
  },
  plugins: [],
};