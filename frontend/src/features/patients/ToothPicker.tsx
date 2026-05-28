import { PERMANENT_TEETH } from '@/shared/types/odontogram'
import { cn } from '@/shared/lib/utils'

/**
 * Selector visual de diente: muestra las arcadas (superior/inferior) con la
 * numeración FDI y permite elegir un diente con un clic. Más rápido y claro
 * que un desplegable para un odontólogo.
 */
export function ToothPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (tooth: number | null) => void
}) {
  const upper = PERMANENT_TEETH.slice(0, 16)
  const lower = PERMANENT_TEETH.slice(16)

  const row = (teeth: number[]) => (
    <div className="flex justify-center gap-0.5">
      {teeth.map((n, i) => {
        const selected = value === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(selected ? null : n)}
            aria-pressed={selected}
            title={`Diente ${n}`}
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-md border text-[11px] font-medium tabular-nums transition-colors',
              // Separación en la línea media (entre cuadrantes derecho e izquierdo).
              i === 8 && 'ml-2',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-foreground hover:bg-accent',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3">
      <div className="mx-auto min-w-max space-y-1.5">
        <p className="text-center text-[9px] uppercase tracking-wide text-muted-foreground">
          Maxilar superior
        </p>
        {row(upper)}
        <div className="mx-auto my-1 max-w-xs border-b border-dashed border-border" />
        {row(lower)}
        <p className="text-center text-[9px] uppercase tracking-wide text-muted-foreground">
          Maxilar inferior
        </p>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {value ? (
          <>
            Diente seleccionado: <span className="font-semibold text-foreground">{value}</span>
          </>
        ) : (
          'Toca un diente para seleccionarlo'
        )}
      </p>
    </div>
  )
}
