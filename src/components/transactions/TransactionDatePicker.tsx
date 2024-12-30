'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '../ui'

interface TransactionDatePickerProps {
    onDateSelect: (date: Date | undefined) => void
}

export const TransactionDatePicker = ({ onDateSelect }: TransactionDatePickerProps) => {
    const [date, setDate] = useState<Date>()

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate)
        onDateSelect(newDate)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal py-6">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

