import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    // Compatibilità con il codice storico: queste regole introdotte/irrigidite
    // dall'upgrade ESLint 9 non devono bloccare build non correlate.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'graphify-out/**', 'tmp/**'],
  },
];

export default config;
