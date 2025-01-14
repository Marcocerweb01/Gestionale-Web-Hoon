/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true, // Abilita la modalità Strict di React
    swcMinify: true, // Usa SWC per minimizzare i file
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL, // Variabili d'ambiente
    },
  };
  
  module.exports = nextConfig;
  