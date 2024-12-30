import { Card, CardContent, CardHeader, CardTitle } from "../ui"


interface TripsAvailableProps {
    balance: number
    fareValue: number
}


export const TripsAvailable = ({ balance, fareValue }: TripsAvailableProps) => {

    const pasajesDisponibles = (Math.floor(balance / (fareValue)))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pasajes Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='text-4xl font-bold text-center'>
                    { pasajesDisponibles }
                </div>
                <p className='text-center text-sm text-muted-foreground mt-2'>
                    Pasajes disponibles basados en el saldo actual
                </p>
            </CardContent>
        </Card>
    )
}
