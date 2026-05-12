import type { MetadataRoute } from 'next'
import { getAppDisplayName, getAppEnvironment } from '@/lib/app-environment'

export default function manifest(): MetadataRoute.Manifest {
    const appName = getAppDisplayName()
    const environment = getAppEnvironment()
    const startUrl = environment === 'production' ? '/' : `/?app_env=${environment}`
    const id = environment === 'production' ? '/' : `/wallet-pipe-${environment}`

    return {
        short_name: appName,
        name: appName,
        id,
        icons: [
            {
                src: '/logo.png',
                type: 'image/png',
                sizes: '128x128',
                purpose: 'any',
            },
            {
                src: '/apple-touch-icon.png',
                type: 'image/png',
                sizes: '180x180',
                purpose: 'any',
            },
            {
                src: '/logo192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'maskable',
            },
            {
                src: '/logo512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'maskable',
            },
            {
                src: '/logo1024.png',
                type: 'image/png',
                sizes: '1024x1024',
                purpose: 'maskable',
            },
        ],
        start_url: startUrl,
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f2740',
        background_color: '#020817',
    }
}
