"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Wallet } from "@/types/wallet"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Coins, CreditCard, WalletIcon, Bus } from 'lucide-react'
import { currentUser } from "@/seed/data"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    balance: z.string().min(1, "La cantidad es requerida").refine((val) => !isNaN(Number(val)), {
        message: "Debe ser un número válido",
    }),
    type: z.string().min(1, "El tipo es requerido"),
    color: z.string().min(1, "El color es requerido"),
    includeInTotal: z.boolean().default(true),
    fareValue: z.string().optional().refine((val) => !val || !isNaN(Number(val)), {
        message: "Debe ser un número válido",
    }),
})

type FormData = z.infer<typeof formSchema>

interface WalletFormProps {
    wallet?: Wallet
    onSubmit: (data: Partial<Wallet>) => void
}

const walletTypes = [
    { value: "Efectivo", label: "Efectivo", icon: Coins },
    { value: "Cuenta Bancaria", label: "Cuenta Bancaria", icon: CreditCard },
    { value: "Ahorros", label: "Ahorros", icon: WalletIcon },
    { value: "Transporte", label: "Transporte", icon: Bus },
]

const suggestedColors = [
    "#3b82f6", // Azul (por defecto)
    "#22c55e", // Verde
    "#ef4444", // Rojo
    "#f97316", // Naranja
    "#a855f7", // Púrpura
    "#4b5563", // Gris oscuro
]

export function WalletForm({ wallet, onSubmit }: WalletFormProps) {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: wallet?.name || "",
            balance: wallet ? wallet.balance.toString() : "",
            type: wallet?.type || "",
            color: wallet?.color || "#3b82f6",
            includeInTotal: wallet?.includeInTotal ?? true,
            fareValue: wallet?.fareValue?.toString() || "",
        },
    })

    const watchType = form.watch("type")

    function handleSubmit(values: FormData) {
        const selectedType = walletTypes.find(t => t.value === values.type);
        onSubmit({
            ...values,
            userId: currentUser.id, // Agregamos el userId
            balance: parseFloat(values.balance),
            icon: selectedType?.icon || Coins,
            fareValue: values.fareValue ? parseFloat(values.fareValue) : undefined,
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Billetera</FormLabel>
                            <FormControl>
                                <Input placeholder="Mi Billetera" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                { !wallet && 
                    (<FormField
                        control={form.control}
                        name="balance"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cantidad Inicial</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Billetera</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {walletTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center">
                                                <type.icon className="mr-2 h-4 w-4" />
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType === "Transporte" && (
                    <FormField
                        control={form.control}
                        name="fareValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor del Pasaje</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Ingrese el valor de un pasaje para esta tarjeta de transporte
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <div className="flex items-center space-x-2">
                                    <Input type="color" {...field} className="w-12 h-12 p-1 rounded-md" />
                                    <Input {...field} placeholder="#3b82f6" className="flex-grow" />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Selecciona un color para identificar tu billetera
                            </FormDescription>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {suggestedColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className="w-8 h-8 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color }}
                                        onClick={() => form.setValue('color', color)}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="includeInTotal"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Incluir en el balance total
                                </FormLabel>
                                <FormDescription>
                                    Si está marcado, esta billetera se incluirá en el cálculo del balance total.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full text-white">
                    {wallet ? "Actualizar Billetera" : "Crear Billetera"}
                </Button>
            </form>
        </Form>
    )
}

