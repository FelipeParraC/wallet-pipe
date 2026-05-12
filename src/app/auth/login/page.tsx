import { LoginForm } from '@/components'

interface LoginPageProps {
    searchParams?: {
        error?: string
    }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <div className="w-full">
            <LoginForm authError={searchParams?.error} />
        </div>
    )
}

