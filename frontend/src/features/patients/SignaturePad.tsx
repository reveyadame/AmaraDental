import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Eraser } from 'lucide-react'

interface Props {
  height?: number
  onChange?: (dataUrl: string | null) => void
}

/**
 * Canvas táctil/ratón para captura de firma. Devuelve un PNG base64.
 *
 * El ancho se adapta al contenedor (ResizeObserver) — así nunca desborda en
 * móvil y se ve bien dentro de modales angostos.
 */
export function SignaturePad({ height = 200, onChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)

  // Resize observer: ajusta canvas al ancho del contenedor (con DPR).
  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const apply = (width: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, Math.floor(width))
      canvas.width = w * dpr
      canvas.height = height * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#111827'
      }
      setHasInk(false)
      onChange?.(null)
    }

    apply(wrapper.clientWidth)

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) apply(entry.contentRect.width)
    })
    ro.observe(wrapper)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  const getPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = getPoint(e)
    lastPointRef.current = p
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = getPoint(e)
    const last = lastPointRef.current
    if (last) {
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 }
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y)
      ctx.stroke()
    }
    lastPointRef.current = p
    if (!hasInk) setHasInk(true)
  }

  const finish = () => {
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (canvas && onChange) {
      onChange(hasInk ? canvas.toDataURL('image/png') : null)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange?.(null)
  }

  return (
    <div className="space-y-2">
      <div ref={wrapperRef} className="rounded-md border bg-card overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          onPointerLeave={(e) => {
            if (drawingRef.current) finish()
            else e.preventDefault()
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Firma con el dedo o con el mouse.</p>
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasInk}>
          <Eraser className="size-4" /> Borrar
        </Button>
      </div>
    </div>
  )
}
