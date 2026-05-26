/**
 * Redimensiona y comprime una imagen del lado del cliente antes de subirla
 * como data URI. Pensado para logos de marca: la mayoría no necesitan más
 * de ~800px de ancho y queda dentro de unos cuantos KB.
 *
 * Conserva transparencia si la imagen original es PNG; si es JPEG, usa JPEG
 * con la calidad indicada para bajar peso.
 */
export interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export async function fileToResizedDataUrl(
  file: File,
  { maxWidth = 800, maxHeight = 400, quality = 0.92 }: ResizeOptions = {},
): Promise<string> {
  const original = await readAsDataUrl(file)

  // SVG: no se redimensiona, va tal cual.
  if (file.type === 'image/svg+xml') return original

  const img = await loadImage(original)

  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height)
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo obtener el canvas para redimensionar')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetW, targetH)

  // Conserva PNG si la imagen original era PNG (transparencia importante en logos).
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  return canvas.toDataURL(mime, mime === 'image/png' ? undefined : quality)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/**
 * Calcula un foreground legible (negro o blanco) según la luminancia
 * percibida del color. Soporta `#rrggbb` y `oklch(...)` aproximado.
 */
export function inferForeground(color: string | null | undefined): string {
  if (!color) return '#0f172a'
  const trimmed = color.trim()

  // Hex (#rrggbb o rrggbb).
  const hex = trimmed.match(/^#?([a-f0-9]{6})$/i)
  if (hex && hex[1]) {
    const r = parseInt(hex[1].slice(0, 2), 16)
    const g = parseInt(hex[1].slice(2, 4), 16)
    const b = parseInt(hex[1].slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.55 ? '#0f172a' : '#ffffff'
  }

  // oklch(L C H ...) — usamos solo L (primer número).
  const oklch = trimmed.match(/oklch\(\s*([0-9.]+)/i)
  if (oklch && oklch[1]) {
    const l = parseFloat(oklch[1])
    if (!Number.isNaN(l)) return l > 0.55 ? '#0f172a' : '#ffffff'
  }

  // Sin info → asume claro.
  return '#0f172a'
}
