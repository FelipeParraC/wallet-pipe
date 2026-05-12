type AppEnvironment = 'development' | 'preview' | 'production'

export const getAppEnvironment = (): AppEnvironment => {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'preview' || process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        return process.env.NEXT_PUBLIC_APP_ENV
    }

    if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
        return process.env.VERCEL_ENV
    }

    return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

export const getAppDisplayName = () => {
    const environment = getAppEnvironment()

    if (environment === 'production') return 'Wallet Pipe'
    if (environment === 'preview') return 'Wallet Pipe Preview'

    return 'Wallet Pipe Dev'
}
