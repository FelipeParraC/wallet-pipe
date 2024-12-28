"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Transaction, BaseTransaction, TransportTransaction, TransferTransaction } from "@/types/transaction"
import { wallets, categories, currentUser } from "@/seed/data"

const standardFormSchema = z.object({
    type: z.enum(["ingreso", "gasto"]),
    title: z.string().min(1, "El título es requerido"),
    amount: z.string().min(1, "El monto es requerido"),
    wallet: z.string().min(1, "La billetera es requerida"),
    category: z.string().min(1, "La categoría es requerida"),
    description: z.string().max(100, "La descripción no debe exceder 100 caracteres"),
    date: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
})

const transportFormSchema = z.object({
    type: z.literal("transporte"),
    title: z.string().min(1, "El título es requerido"),
    numberOfTrips: z.string().min(1, "El número de viajes es requerido"),
    wallet: z.string().min(1, "La billetera es requerida"),
    description: z.string().max(100, "La descripción no debe exceder 100 caracteres"),
    date: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
})

const transferFormSchema = z.object({
    type: z.literal("transferencia"),
    title: z.string().min(1, "El título es requerido"),
    amount: z.string().min(1, "El monto es requerido"),
    fromWallet: z.string().min(1, "La billetera de origen es requerida"),
    toWallet: z.string().min(1, "La billetera de destino es requerida"),
    description: z.string().max(100, "La descripción no debe exceder 100 caracteres"),
    date: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
})

const formSchema = z.discriminatedUnion("type", [
    standardFormSchema,
    transportFormSchema,
    transferFormSchema,
])

type FormData = z.infer<typeof formSchema>

interface TransactionFormProps {
    defaultWallet?: string
    transaction?: Transaction
    onSubmit: (data: Transaction) => void
}

export function TransactionForm({ defaultWallet, transaction, onSubmit }: TransactionFormProps) {
    const [selectedWalletType, setSelectedWalletType] = useState<string>("")

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: transaction
                ? 'fareValue' in transaction
                    ? "transporte"
                    : 'fromWallet' in transaction && 'toWallet' in transaction
                        ? "transferencia"
                        : transaction.amount > 0 ? "ingreso" : "gasto"
                : "gasto",
            title: transaction?.title || "",
            amount: transaction ? Math.abs(transaction.amount).toString() : "",
            numberOfTrips: transaction && 'numberOfTrips' in transaction ? transaction.numberOfTrips.toString() : "1",
            wallet: transaction?.wallet || defaultWallet || "",
            fromWallet: transaction && 'fromWallet' in transaction ? transaction.fromWallet : "",
            toWallet: transaction && 'toWallet' in transaction ? transaction.toWallet : "",
            category: transaction?.category || "Otros",
            description: transaction?.description || "",
            date: transaction ? parseISO(transaction.date) : new Date(),
            time: transaction ? format(parseISO(transaction.date), "HH:mm") : format(new Date(), "HH:mm"),
        },
    })

    const watchWallet = form.watch("wallet")
    const watchType = form.watch("type")

    useEffect(() => {
        const selectedWallet = wallets.find(w => w.id === watchWallet)
        setSelectedWalletType(selectedWallet?.type || "")
    }, [watchWallet])

    useEffect(() => {
        if (selectedWalletType === "Transporte" && watchType !== "transferencia") {
            form.setValue("type", "transporte")
        } else if (watchType === "transporte" && selectedWalletType !== "Transporte") {
            form.setValue("type", "gasto")
        }
    }, [selectedWalletType, watchType, form])

    function handleSubmit(values: FormData) {
        const combinedDateTime = new Date(values.date)
        const [hours, minutes] = values.time.split(':')
        combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10))

        if (values.type === "transporte") {
            const selectedWallet = wallets.find(w => w.id === values.wallet)
            const fareValue = selectedWallet?.fareValue || 0
            const submissionData: TransportTransaction = {
                id: transaction?.id || Date.now(),
                userId: currentUser.id, // Agregamos el userId
                title: values.title,
                description: values.description,
                date: combinedDateTime.toISOString(),
                fareValue: fareValue,
                numberOfTrips: parseInt(values.numberOfTrips),
                category: 'Transporte',
                wallet: values.wallet,
                amount: -(fareValue * parseInt(values.numberOfTrips)),
                isVisible: true,
            }
            onSubmit(submissionData)
        } else if (values.type === "transferencia") {
            const submissionData: TransferTransaction = {
                id: transaction?.id || Date.now(),
                userId: currentUser.id, // Agregamos el userId
                title: values.title,
                description: values.description,
                date: combinedDateTime.toISOString(),
                amount: -parseFloat(values.amount),
                category: 'Transferencia',
                fromWallet: values.fromWallet,
                toWallet: values.toWallet,
                wallet: values.fromWallet,
                isVisible: true,
            }
            onSubmit(submissionData)
        } else {
            const submissionData: BaseTransaction = {
                id: transaction?.id || Date.now(),
                userId: currentUser.id, // Agregamos el userId
                title: values.title,
                description: values.description,
                date: combinedDateTime.toISOString(),
                amount: parseFloat(values.amount) * (values.type === 'gasto' ? -1 : 1),
                category: values.category,
                wallet: values.wallet,
                isVisible: true,
            }
            onSubmit(submissionData)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de Transacción</FormLabel>
                            <FormControl>
                                <div className="flex flex-wrap gap-4">
                                    {(selectedWalletType === "Transporte" ? ['transporte'] : ['gasto', 'ingreso', 'transferencia']).map((type) => (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant={field.value === type ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => field.onChange(type)}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Button>
                                    ))}

                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType !== "transferencia" && (
                    <FormField
                        control={form.control}
                        name="wallet"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billetera</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14">
                                            <SelectValue placeholder="Selecciona una billetera" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {wallets.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                {wallet.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Título de la transacción" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchType === "transporte" ? (
                    <FormField
                        control={form.control}
                        name="numberOfTrips"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Viajes</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="1"
                                        {...field}
                                        className="text-3xl h-16 text-center font-bold"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0.00"
                                        {...field}
                                        className="text-3xl h-16 text-center font-bold"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {watchType === "transferencia" && (
                    <>
                        <FormField
                            control={form.control}
                            name="fromWallet"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Origen</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14">
                                                <SelectValue placeholder="Selecciona una billetera" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.map((wallet) => (
                                                <SelectItem key={wallet.id} value={wallet.id}>
                                                    {wallet.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="toWallet"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billetera de Destino</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14">
                                                <SelectValue placeholder="Selecciona una billetera" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.filter(w => w.id !== form.watch("fromWallet")).map((wallet) => (
                                                <SelectItem key={wallet.id} value={wallet.id}>
                                                    {wallet.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                {watchType !== "transferencia" && watchType !== "transporte" && (
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Breve descripción de la transacción"
                                    className="resize-none h-24"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Máximo 100 caracteres.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex space-x-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={`w-full h-14 pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Selecciona una fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Hora</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            {...field}
                                            className="h-14 pl-10"
                                        />
                                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full h-14 text-lg">
                    {transaction ? "Actualizar Transacción" : "Guardar Transacción"}
                </Button>
            </form>
        </Form>
    )
}

