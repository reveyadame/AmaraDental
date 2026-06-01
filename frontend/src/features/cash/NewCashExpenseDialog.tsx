import { useEffect, useState } from 'react'
import { Banknote, CreditCard as CardIcon, Landmark, Loader2, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCashExpense } from './hooks'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/shared/types/cash'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Egresos NO usan `credit` (saldo a favor del paciente) — solo medios de
// pago reales.
const METHODS: { value: 'cash' | 'card' | 'card_credit' | 'transfer'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Débito', icon: CardIcon },
  { value: 'card_credit', label: 'Crédito', icon: CardIcon },
  { value: 'transfer', label: 'Transferencia', icon: Landmark },
]

export function NewCashExpenseDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateCashExpense()

  const [category, setCategory] = useState<ExpenseCategory>('supplies')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setCategory('supplies')
    setDescription('')
    setMethod('cash')
    setAmount('')
    setReference('')
    setNotes('')
  }, [open])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!description.trim()) {
      toast.error('Captura la descripción del egreso')
      return
    }
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Captura un monto válido')
      return
    }
    mutation.mutate(
      {
        category,
        description: description.trim(),
        method,
        amount: value,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Egreso registrado')
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data
              : undefined
          toast.error(errs?.message ?? 'No fue posible registrar el egreso')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="size-5 text-destructive" /> Registrar egreso
          </DialogTitle>
          <DialogDescription>
            Salida de caja durante tu turno (pago a lab, insumos, devolución, etc.).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pago a Lab ABC por corona…"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors',
                      method === m.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Icon className="size-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto (MXN)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Folio, ticket…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle adicional…"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Registrar egreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
