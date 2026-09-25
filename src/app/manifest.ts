import { MetadataRoute } from 'next'
 
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Skyfit Pesquisa de Satisfação',
    short_name: 'Skyfit Pesquisa',
    description: 'Totem de pesquisa de satisfação para academia SkyFit.',
    start_url: '/admin/login',
    display: 'standalone',
    orientation: 'any',
    background_color: '#09090b',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
