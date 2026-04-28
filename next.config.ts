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

  /* Se o seu app estiver em uma subpasta, você configuraria o baseContext aqui, 
     mas para a raiz do domínio não precisa de mais nada. */
};

export default nextConfig;