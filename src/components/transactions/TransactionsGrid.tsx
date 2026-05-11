'use client'

import { useMemo, useState } from 'react'
import type { Category, Transaction, Wallet } from '@/interfaces'
import { format, parseISO } from 'date-fns'
import { TransactionList } from './TransactionList'
import { TransactionDetailsModal } from './TransactionDetailsModal'
import { useRouter } from 'next/navigation'
import { deleteTransactionById } from '@/actions'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { getTransactionTypeLabel } from '@/utils'
import { DeleteTransactionDialog } from './DeleteTransactionDialog'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { isSavingsBoxInternalTransfer } from '@/lib/savings-box'

interface TransactionsGridProps {
    transactions: Transaction[] | null
    categories: Category[] | null
    wallets: Wallet[] | null
    contextWalletId?: string
}

type DateFilter = 'ALL' | 'TODAY' | '7D' | 'MONTH' | 'CUSTOM'

export const TransactionsGrid = ({ transactions, categories, wallets, contextWalletId }: TransactionsGridProps) => {
    const router = useRouter()
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [walletFilter, setWalletFilter] = useState(contextWalletId ?? 'ALL')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [tagFilter, setTagFilter] = useState('ALL')
    const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')
    const [customDate, setCustomDate] = useState('')

    const safeTransactions = transactions ?? []
    const safeCategories = categories ?? []
    const safeWallets = wallets ?? []
    const visibleTransactions = safeTransactions.filter((transaction) => (
        transaction.isVisible
        && (contextWalletId || !isSavingsBoxInternalTransfer(transaction, safeWallets))
    ))

    const availableTags = useMemo(() => {
        const map = new Map<string, { id: string; name: string; color?: string | null }>()
        visibleTransactions.forEach((transaction) => {
            transaction.tags?.forEach((tag) => map.set(tag.id, tag))
        })
        return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name))
    }, [visibleTransactions])

    const transactionTypes = useMemo(() => (
        Array.from(new Set(visibleTransactions.map((transaction) => transaction.type)))
    ), [visibleTransactions])

    const matchesDate = (transaction: Transaction) => {
        if (dateFilter === 'ALL') return true

        const date = parseISO(transaction.occurredAt || transaction.date)
        const today = new Date()

        if (dateFilter === 'TODAY') {
            return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        }

        if (dateFilter === '7D') {
            const start = new Date(today)
            start.setDate(today.getDate() - 7)
            start.setHours(0, 0, 0, 0)
            return date >= start
        }

        if (dateFilter === 'MONTH') {
            return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
        }

        return customDate ? format(date, 'yyyy-MM-dd') === customDate : true
    }

    const filteredTransactions = visibleTransactions.filter((transaction) => {
        const query = search.trim().toLowerCase()
        const walletNames = [
            safeWallets.find((wallet) => wallet.id === transaction.walletId)?.name,
            safeWallets.find((wallet) => wallet.id === transaction.fromWalletId)?.name,
            safeWallets.find((wallet) => wallet.id === transaction.toWalletId)?.name,
        ].filter(Boolean).join(' ')
        const categoryName = safeCategories.find((category) => category.id === transaction.categoryId)?.name ?? ''
        const tagNames = transaction.tags?.map((tag) => tag.name).join(' ') ?? ''
        const searchableText = `${transaction.title} ${transaction.description} ${walletNames} ${categoryName} ${tagNames}`.toLowerCase()

        return (
            (!query || searchableText.includes(query))
            && (typeFilter === 'ALL' || transaction.type === typeFilter)
            && (walletFilter === 'ALL' || transaction.walletId === walletFilter || transaction.fromWalletId === walletFilter || transaction.toWalletId === walletFilter)
            && (categoryFilter === 'ALL' || transaction.categoryId === categoryFilter)
            && (tagFilter === 'ALL' || transaction.tagIds?.includes(tagFilter) || transaction.tags?.some((tag) => tag.id === tagFilter))
            && matchesDate(transaction)
        )
    })

    const hasActiveFilters = Boolean(search.trim())
        || typeFilter !== 'ALL'
        || walletFilter !== (contextWalletId ?? 'ALL')
        || categoryFilter !== 'ALL'
        || tagFilter !== 'ALL'
        || dateFilter !== 'ALL'

    const clearFilters = () => {
        setSearch('')
        setTypeFilter('ALL')
        setWalletFilter(contextWalletId ?? 'ALL')
        setCategoryFilter('ALL')
        setTagFilter('ALL')
        setDateFilter('ALL')
        setCustomDate('')
    }

    if ( !transactions || !categories || !wallets ) {
        return <></>
    }

    const handleEdit = (transaction: Transaction) => {
        const suffix = contextWalletId ? `?walletId=${contextWalletId}` : ''
        router.push(`/movimientos/editar/${transaction.id}${suffix}`)
    }

    const requestDelete = (transaction: Transaction) => {
        setDeleteError(null)
        setTransactionToDelete(transaction)
    }

    const handleDelete = async (transaction: Transaction) => {
        setDeleteError(null)
        setIsDeleting(true)
        const response = await deleteTransactionById(transaction.id)
        setIsDeleting(false)

        if (response.ok) {
            setTransactionToDelete(null)
            setSelectedTransaction(null)
            router.refresh()
            return response
        }

        setDeleteError(response.message)
        return response
    }

    const emptyTitle = visibleTransactions.length === 0
        ? 'Todavía no hay movimientos'
        : 'No hay resultados con esos filtros'

    const emptyCopy = visibleTransactions.length === 0
        ? 'Cuando registres ingresos, gastos, compras o pagos, aparecerán aquí.'
        : 'Prueba quitando algún filtro o revisando otra fecha.'

    return (
        <>
            <section className='glass-panel rounded-[1.75rem] p-4'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                        <p className='inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-500'>
                            <SlidersHorizontal className='h-3.5 w-3.5' />
                            Filtros
                        </p>
                        <p className='mt-1 text-sm text-slate-400'>{filteredTransactions.length} de {visibleTransactions.length} movimientos</p>
                    </div>
                    {hasActiveFilters && (
                        <Button variant='outline' size='sm' onClick={clearFilters}>
                            <X className='h-4 w-4' />
                            Limpiar
                        </Button>
                    )}
                </div>

                <div className='mt-4 grid gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]'>
                    <div className='relative'>
                        <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500' />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Buscar título, cuenta, categoría o tag' className='pl-10' />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger><SelectValue placeholder='Tipo' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ALL'>Todos los tipos</SelectItem>
                            {transactionTypes.map((type) => <SelectItem key={type} value={type}>{getTransactionTypeLabel(type)}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={walletFilter} onValueChange={setWalletFilter}>
                        <SelectTrigger><SelectValue placeholder='Cuenta' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ALL'>Todas las cuentas</SelectItem>
                            {safeWallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger><SelectValue placeholder='Categoría' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ALL'>Todas las categorías</SelectItem>
                            {safeCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={tagFilter} onValueChange={setTagFilter}>
                        <SelectTrigger><SelectValue placeholder='Tag' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ALL'>Todos los tags</SelectItem>
                            {availableTags.map((tag) => <SelectItem key={tag.id} value={tag.id}>#{tag.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-1'>
                        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                            <SelectTrigger><SelectValue placeholder='Fecha' /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value='ALL'>Todas las fechas</SelectItem>
                                <SelectItem value='TODAY'>Hoy</SelectItem>
                                <SelectItem value='7D'>Últimos 7 días</SelectItem>
                                <SelectItem value='MONTH'>Este mes</SelectItem>
                                <SelectItem value='CUSTOM'>Día específico</SelectItem>
                            </SelectContent>
                        </Select>
                        {dateFilter === 'CUSTOM' && (
                            <Input type='date' value={customDate} onChange={(event) => setCustomDate(event.target.value)} />
                        )}
                    </div>
                </div>
            </section>

            {filteredTransactions.length === 0 ? (
                <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
                    <h2 className='text-lg font-semibold text-white'>{emptyTitle}</h2>
                    <p className='mx-auto mt-2 max-w-md text-sm text-slate-400'>{emptyCopy}</p>
                    {visibleTransactions.length === 0 ? (
                        <Button asChild className='mt-5'>
                            <a href='/movimientos/nueva'>Crear movimiento</a>
                        </Button>
                    ) : (
                        <Button variant='outline' className='mt-5' onClick={clearFilters}>Quitar filtros</Button>
                    )}
                </div>
            ) : (
                <TransactionList
                    transactions={ filteredTransactions }
                    categories={ safeCategories }
                    wallets={ safeWallets }
                    contextWalletId={ contextWalletId }
                    onSelect={ setSelectedTransaction }
                />
            )}

            <TransactionDetailsModal
                isOpen={ !!selectedTransaction }
                onClose={() => setSelectedTransaction(null)}
                transaction={ selectedTransaction }
                categories={ safeCategories }
                wallets={ safeWallets }
                onEdit={ handleEdit }
                onDelete={ requestDelete }
            />

            <DeleteTransactionDialog
                open={Boolean(transactionToDelete)}
                transaction={transactionToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteError(null)
                        setTransactionToDelete(null)
                    }
                }}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                error={deleteError}
            />
        </>
    )
}
