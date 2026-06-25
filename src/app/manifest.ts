import { MetadataRoute } from 'next'

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gym Satisfaction Survey',
    short_name: 'Gym Survey',
    description: 'Avalie sua experiência na nossa academia.',
    start_url: '/',
    display: 'fullscreen',
    background_color: '#09090b',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
