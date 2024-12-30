import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
    href: string
    texto: string
}


export const BackButton = ({ href, texto }: BackButtonProps) => {
    return (
        <Link href={ href } className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a { texto }
        </Link>
    )
}
