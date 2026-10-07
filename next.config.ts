import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Habilita a exportação estática para o plano Spark (gratuito) do Firebase */
  output: 'export',

  /* Importante: Como o plano gratuito não tem um servidor rodando o tempo todo, 
     precisamos desativar a otimização automática de imagens do Next.js.
  */
  images: {
    unoptimized: true,
  },

  /* Garante que bibliotecas com sintaxe moderna sejam transpiladas conforme o browserslist */
  transpilePackages: [
    "firebase",
    "@firebase/app",
    "@firebase/firestore",
    "@firebase/auth",
    "@firebase/storage",
    "@firebase/util",
    "@firebase/component",
    "@firebase/logger",
    "@firebase/webchannel-wrapper",
    "@google/generative-ai",
    "lucide-react",
    "recharts",
    "d3-array",
    "d3-color",
    "d3-format",
    "d3-interpolate",
    "d3-path",
    "d3-scale",
    "d3-shape",
    "d3-time",
    "d3-time-format",
    "d3-timer",
    "internmap",
  ],
};

export default nextConfig;