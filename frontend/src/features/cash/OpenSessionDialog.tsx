import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Wallet } from 'lucide-react'
import { useOpenCashSession } from './hooks'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OpenSessionDialog({ open, onOpenChange }: Props) {
  const mutation = useOpenCashSession()
  const [amount, setAmount] = useState('0')
  const [notes, setNotes] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (Number.isNaN(value) || value < 0) {
      toast.error('Monto inválido')
      return
    }
    mutation.mutate(
      { opening_amount: value, notes: notes || undefined },
      {
        onSuccess: () => {
          toast.success('Caja abierta')
          onOpenChange(false)
          setAmount('0')
          setNotes('')
        },
        onError: () => toast.error('No fue posible abrir la caja'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" /> Abrir caja
          </DialogTitle>
          <DialogDescription>
            Captura el efectivo de fondo con el que abres la sesión. Se usará al cierre para
            calcular la diferencia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="opening_amount">Monto de apertura (MXN)</Label>
            <Input
              id="opening_amount"
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Turno matutino, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Abrir caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
