'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Category, Tag } from '@/interfaces'
import { CategoryForm } from './CategoryForm'
import { TagForm } from './TagForm'
import { deleteCategory, deleteTag, updateCategory, updateTag } from '@/actions'
import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'

type ActionResponse = { ok: boolean; message: string }

const NONE_VALUE = 'none'

const ActionError = ({ message }: { message: string | null }) => (
    message ? <Alert variant='destructive'><AlertDescription>{message}</AlertDescription></Alert> : null
)

const CategoryEditDialog = ({ category, categories }: { category: Category; categories: Category[] }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(category.name)
    const [color, setColor] = useState(category.color)
    const [parentId, setParentId] = useState(category.parentId ?? NONE_VALUE)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const submit = async () => {
        setError(null)
        setIsPending(true)
        try {
            const response = await updateCategory({
                id: category.id,
                name,
                color,
                parentId: parentId === NONE_VALUE ? null : parentId,
            })

            if (!response.ok) {
                setError(response.message)
                return
            }

            setOpen(false)
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant='outline' size='sm' disabled={category.isSystem} onClick={() => setOpen(true)}>
                <Pencil className='h-4 w-4' />
                Editar
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar categoría</DialogTitle>
                    <DialogDescription>Actualiza nombre, color o jerarquía sin tocar movimientos históricos.</DialogDescription>
                </DialogHeader>
                <div className='grid gap-4'>
                    <div className='grid gap-2'>
                        <Label>Nombre</Label>
                        <Input value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div className='grid gap-2'>
                        <Label>Categoría padre</Label>
                        <Select value={parentId} onValueChange={setParentId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>Sin padre</SelectItem>
                                {categories
                                    .filter((option) => option.id !== category.id && !option.parentId)
                                    .map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='grid gap-2'>
                        <Label>Color</Label>
                        <Input type='color' value={color} onChange={(event) => setColor(event.target.value)} className='h-12 w-20 p-1' />
                    </div>
                    <ActionError message={error} />
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={submit} disabled={!name.trim() || isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TagEditDialog = ({ tag }: { tag: Tag }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(tag.name)
    const [color, setColor] = useState(tag.color ?? '#10b981')
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const submit = async () => {
        setError(null)
        setIsPending(true)
        try {
            const response = await updateTag({ id: tag.id, name, color })

            if (!response.ok) {
                setError(response.message)
                return
            }

            setOpen(false)
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
                <Pencil className='h-4 w-4' />
                Editar
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar tag</DialogTitle>
                    <DialogDescription>Los cambios se reflejan en los movimientos que usen este tag.</DialogDescription>
                </DialogHeader>
                <div className='grid gap-4'>
                    <div className='grid gap-2'>
                        <Label>Nombre</Label>
                        <Input value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div className='grid gap-2'>
                        <Label>Color</Label>
                        <Input type='color' value={color} onChange={(event) => setColor(event.target.value)} className='h-12 w-20 p-1' />
                    </div>
                    <ActionError message={error} />
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={submit} disabled={!name.trim() || isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const DeleteButton = ({
    label,
    action,
    disabled,
}: {
    label: string
    action: () => Promise<ActionResponse>
    disabled?: boolean
}) => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const submit = async () => {
        setError(null)
        setIsPending(true)
        try {
            const response = await action()
            if (!response.ok) {
                setError(response.message)
                return
            }
            router.refresh()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className='grid gap-2'>
            <Button variant='destructive' size='sm' disabled={disabled || isPending} onClick={submit}>
                <Trash2 className='h-4 w-4' />
                {isPending ? 'Eliminando...' : label}
            </Button>
            <ActionError message={error} />
        </div>
    )
}

export const CategoryManager = ({ categories }: { categories: Category[] }) => {
    const customCategories = categories.filter((category) => !category.isSystem)

    return (
        <section className='glass-panel rounded-[1.75rem] p-5'>
                <div className='mb-5'>
                    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Clasificación</p>
                    <h2 className='mt-2 text-lg font-semibold text-white'>Categorías</h2>
                </div>
                <CategoryForm categories={customCategories.filter((category) => !category.parentId)} />
                <div className='mt-6 grid gap-3'>
                    {categories.length === 0 ? (
                        <p className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400'>Sin categorías.</p>
                    ) : categories.map((category) => (
                        <div key={category.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <span className='h-3.5 w-3.5 rounded-full' style={{ backgroundColor: category.color }} />
                                        <p className='truncate font-medium text-white'>{category.name}</p>
                                    </div>
                                    <p className='mt-1 text-xs text-slate-500'>
                                        {category.parentId ? 'Subcategoría' : category.isSystem ? 'Sistema' : 'Personal'}
                                    </p>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    <CategoryEditDialog category={category} categories={categories} />
                                    <DeleteButton label='Eliminar' disabled={category.isSystem} action={() => deleteCategory(category.id)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
        </section>
    )
}

export const TagManager = ({ tags }: { tags: Tag[] }) => (
    <section className='glass-panel rounded-[1.75rem] p-5'>
                <div className='mb-5'>
                    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Etiquetas</p>
                    <h2 className='mt-2 text-lg font-semibold text-white'>Tags</h2>
                </div>
                <TagForm />
                <div className='mt-6 grid gap-3'>
                    {tags.length === 0 ? (
                        <p className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400'>Sin tags.</p>
                    ) : tags.map((tag) => (
                        <div key={tag.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-3'>
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                <span
                                    className='w-fit rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                                    style={{ backgroundColor: tag.color || '#334155' }}
                                >
                                    #{tag.name}
                                </span>
                                <div className='flex flex-wrap gap-2'>
                                    <TagEditDialog tag={tag} />
                                    <DeleteButton label='Eliminar' action={() => deleteTag(tag.id)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
    </section>
)

export const TaxonomyManager = ({ categories, tags }: { categories: Category[]; tags: Tag[] }) => {
    return (
        <div className='grid gap-4 xl:grid-cols-2'>
            <CategoryManager categories={categories} />
            <TagManager tags={tags} />
        </div>
    )
}
