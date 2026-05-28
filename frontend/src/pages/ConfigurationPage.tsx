import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ImageIcon,
  LayoutPanelLeft,
  Loader2,
  Palette,
  Printer,
  Save,
  Settings2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { FONT_OPTIONS, getFont } from '@/shared/theme/fonts'
import type { FontFamilyKey } from '@/shared/types/api'
import { useUpdateBranding } from '@/features/branding/hooks'
import { useBranding as useBrandingQuery } from '@/features/auth/hooks'
import { useMe } from '@/features/auth/hooks'
import { TagListInput } from '@/features/patients/TagListInput'
import { fileToResizedDataUrl, inferForeground as inferFg } from '@/shared/lib/image'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { accent } from '@/shared/lib/module-accents'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'CDMX (Centro)' },
  { value: 'America/Monterrey', label: 'Monterrey (Centro)' },
  { value: 'America/Merida', label: 'Mérida (Centro)' },
  { value: 'America/Matamoros', label: 'Matamoros (Centro)' },
  { value: 'America/Mazatlan', label: 'Mazatlán (Pacífico)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (Pacífico)' },
  { value: 'America/Bahia_Banderas', label: 'Bahía de Banderas (Pacífico)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (Pacífico)' },
  { value: 'America/Tijuana', label: 'Tijuana (Pacífico)' },
  { value: 'America/Cancun', label: 'Cancún (Este)' },
]

const inferForeground = inferFg

// Defaults que coinciden con la migración. Los colores primario/secundario son
// obligatorios en el backend, así que si el campo quedó vacío caemos a estos en
// lugar de mandar '' (que dispara validation.required y bloquea el guardado).
const DEFAULT_PRIMARY = 'oklch(0.546 0.215 262.881)'
const DEFAULT_PRIMARY_FG = 'oklch(0.985 0 0)'
const DEFAULT_SECONDARY = 'oklch(0.97 0 0)'

function isProbablyHex(v: string): boolean {
  return /^#?[a-f0-9]{6}$/i.test(v.trim())
}

function normalizeHex(v: string): string {
  const m = v.trim().match(/^#?([a-f0-9]{6})$/i)
  return m && m[1] ? `#${m[1].toLowerCase()}` : '#000000'
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  helper?: string
}

function ColorField({ label, value, onChange, helper }: ColorFieldProps) {
  const hex = isProbablyHex(value) ? normalizeHex(value) : '#3b82f6'
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border bg-card cursor-pointer"
          aria-label={`Selector de color para ${label}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
          placeholder="#3b82f6 o oklch(...)"
        />
      </div>
      {helper ? <p className="text-[10px] text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export function ConfigurationPage() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const branding = useBrandingQuery()
  const update = useUpdateBranding()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // --- Form state -----------------------------------------------------
  const [brandName, setBrandName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [colorPrimary, setColorPrimary] = useState('')
  const [colorPrimaryFg, setColorPrimaryFg] = useState('')
  const [colorSecondary, setColorSecondary] = useState('')
  const [colorSidebar, setColorSidebar] = useState('')
  const [sidebarItemBg, setSidebarItemBg] = useState('')
  const [sidebarItemColor, setSidebarItemColor] = useState('')
  const [sidebarHoverBg, setSidebarHoverBg] = useState('')
  const [sidebarActiveBg, setSidebarActiveBg] = useState('')
  const [sidebarActiveColor, setSidebarActiveColor] = useState('')
  const [colorAccent, setColorAccent] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [rfc, setRfc] = useState('')
  const [address, setAddress] = useState('')
  const [phones, setPhones] = useState<string[]>([])
  const [cedulas, setCedulas] = useState<string[]>([])
  const [timezone, setTimezone] = useState('America/Mexico_City')
  const [ticketWidth, setTicketWidth] = useState<'58mm' | '80mm'>('80mm')
  const [ticketShowLogo, setTicketShowLogo] = useState(true)
  const [ticketShowAddress, setTicketShowAddress] = useState(true)
  const [ticketShowCedulas, setTicketShowCedulas] = useState(false)
  const [ticketFooterMessage, setTicketFooterMessage] = useState('')
  const [ticketAutoPrint, setTicketAutoPrint] = useState(false)
  const [rxPaperSize, setRxPaperSize] = useState<
    'letter' | 'letter_landscape' | 'half_letter' | 'half_letter_landscape'
  >('letter')
  const [rxMode, setRxMode] = useState<'design' | 'preprinted'>('design')
  const [rxBackground, setRxBackground] = useState<string | null>(null)
  const [rxMarginTop, setRxMarginTop] = useState<number>(15)
  const [rxLayout, setRxLayout] = useState<'standard' | 'compact'>('standard')
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>('inter')

  // Hidrata cuando llega la data del backend.
  useEffect(() => {
    if (!branding.data) return
    const b = branding.data
    setBrandName(b.brand_name ?? '')
    setLogoUrl(b.logo_url ?? null)
    setColorPrimary(b.color_primary ?? '')
    setColorPrimaryFg(b.color_primary_foreground ?? '')
    setColorSecondary(b.color_secondary ?? '')
    setColorSidebar(b.color_sidebar ?? '')
    setSidebarItemBg(b.sidebar_item_bg ?? '')
    setSidebarItemColor(b.sidebar_item_color ?? '')
    setSidebarHoverBg(b.sidebar_hover_bg ?? '')
    setSidebarActiveBg(b.sidebar_active_bg ?? '')
    setSidebarActiveColor(b.sidebar_active_color ?? '')
    setColorAccent(b.color_accent ?? '')
    setRazonSocial(b.razon_social ?? '')
    setRfc(b.rfc ?? '')
    setAddress(b.address ?? '')
    setPhones(b.phones ?? [])
    setCedulas(b.cedulas_clinica ?? [])
    setTimezone(b.timezone ?? 'America/Mexico_City')
    setTicketWidth(b.ticket_width ?? '80mm')
    setTicketShowLogo(b.ticket_show_logo ?? true)
    setTicketShowAddress(b.ticket_show_address ?? true)
    setTicketShowCedulas(b.ticket_show_cedulas ?? false)
    setTicketFooterMessage(b.ticket_footer_message ?? '')
    setTicketAutoPrint(b.ticket_auto_print ?? false)
    setRxPaperSize(b.prescription_paper_size ?? 'letter')
    setRxMode(b.prescription_mode ?? 'design')
    setRxBackground(b.prescription_background_url ?? null)
    setRxMarginTop(b.prescription_margin_top_mm ?? 15)
    setRxLayout(b.prescription_layout ?? 'standard')
    setFontFamily(b.font_family ?? 'inter')
  }, [branding.data])

  if (!isAdmin) return <Navigate to="/" replace />

  const onUploadLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen (PNG, JPG, SVG)')
      return
    }
    // Acepta hasta 15 MB de origen — lo redimensionamos antes de mandar.
    if (file.size > 15_000_000) {
      toast.error('La imagen es demasiado grande (máximo 15 MB)')
      return
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file, {
        maxWidth: 800,
        maxHeight: 400,
        quality: 0.92,
      })
      setLogoUrl(dataUrl)
    } catch {
      toast.error('No fue posible procesar la imagen')
    }
  }

  const onColorPrimaryChange = (v: string) => {
    setColorPrimary(v)
    // Si quedó vacío el foreground o solía coincidir con un default, sugiere uno.
    if (!colorPrimaryFg || colorPrimaryFg === '#ffffff' || colorPrimaryFg === '#0f172a') {
      setColorPrimaryFg(inferForeground(v))
    }
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) {
      toast.error('El nombre comercial es obligatorio')
      return
    }
    update.mutate(
      {
        brand_name: brandName.trim(),
        logo_url: logoUrl,
        color_primary: colorPrimary.trim() || DEFAULT_PRIMARY,
        color_primary_foreground: colorPrimaryFg.trim() || DEFAULT_PRIMARY_FG,
        color_secondary: colorSecondary.trim() || DEFAULT_SECONDARY,
        color_sidebar: colorSidebar.trim() || null,
        sidebar_item_bg: sidebarItemBg.trim() || null,
        sidebar_item_color: sidebarItemColor.trim() || null,
        sidebar_hover_bg: sidebarHoverBg.trim() || null,
        sidebar_active_bg: sidebarActiveBg.trim() || null,
        sidebar_active_color: sidebarActiveColor.trim() || null,
        color_header: null,
        color_accent: colorAccent.trim() || null,
        razon_social: razonSocial.trim() || null,
        rfc: rfc.trim() || null,
        address: address.trim() || null,
        phones,
        cedulas_clinica: cedulas,
        timezone,
        ticket_width: ticketWidth,
        ticket_show_logo: ticketShowLogo,
        ticket_show_address: ticketShowAddress,
        ticket_show_cedulas: ticketShowCedulas,
        ticket_footer_message: ticketFooterMessage.trim() || null,
        ticket_auto_print: ticketAutoPrint,
        prescription_paper_size: rxPaperSize,
        prescription_mode: rxMode,
        prescription_background_url: rxBackground,
        prescription_margin_top_mm: rxMarginTop,
        prescription_layout: rxLayout,
        font_family: fontFamily,
      },
      {
        onSuccess: () => toast.success('Configuración guardada — aplicada en vivo'),
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as {
                  response?: { data?: { errors?: Record<string, string[]>; message?: string } }
                }).response?.data
              : undefined
          const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
          toast.error(first ?? 'No fue posible guardar')
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('configuration').badge}`}>
          <Settings2 className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground">
            Personaliza la identidad de tu clínica. Los cambios se aplican en vivo a toda la
            aplicación y a los documentos impresos.
          </p>
        </div>
      </header>

      {branding.isPending ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSave} className="space-y-6">
          {/* Vista previa en vivo */}
          <Card className="border-primary/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-12 w-auto max-w-[120px] object-contain"
                  />
                ) : (
                  <div
                    className="grid size-12 place-items-center rounded-md text-sm font-bold"
                    style={{
                      background: colorPrimary || '#3b82f6',
                      color: colorPrimaryFg || '#fff',
                    }}
                  >
                    {brandName.slice(0, 2).toUpperCase() || 'CD'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">
                    {brandName || 'Nombre de la clínica'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Vista previa — así se ve tu marca en la app
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition"
                style={{
                  background: colorPrimary || '#3b82f6',
                  color: colorPrimaryFg || '#fff',
                }}
              >
                Botón
              </button>
            </CardContent>
          </Card>

          <Tabs defaultValue="branding" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="branding">Personalización</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="tickets">Impresión</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-6">
          {/* Identidad visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4" /> Identidad visual
              </CardTitle>
              <CardDescription>
                Logo, nombre y colores que aparecen en headers, emails, recetas y
                consentimientos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Logo de la clínica</Label>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="grid size-20 place-items-center rounded-md border bg-muted/30 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onUploadLogo(f)
                        e.target.value = ''
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="size-4" /> Subir imagen
                      </Button>
                      {logoUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setLogoUrl(null)}
                        >
                          <X className="size-4" /> Quitar
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      PNG transparente o JPG. La imagen se redimensiona automáticamente al
                      subirla (máx. 800×400 px). Máximo 15 MB de origen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand_name">Nombre comercial</Label>
                <Input
                  id="brand_name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Clínica Dental Sonríe"
                  maxLength={120}
                />
                <p className="text-[10px] text-muted-foreground">
                  Aparece en login, encabezados, recetas, consentimientos y odontogramas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Color primario"
                  value={colorPrimary}
                  onChange={onColorPrimaryChange}
                  helper="Botones, enlaces activos, énfasis."
                />
                <ColorField
                  label="Texto sobre primario"
                  value={colorPrimaryFg}
                  onChange={setColorPrimaryFg}
                  helper="Color del texto cuando va encima del color primario."
                />
                <ColorField
                  label="Color secundario"
                  value={colorSecondary}
                  onChange={setColorSecondary}
                  helper="Fondos suaves, badges secundarios."
                />
                <ColorField
                  label="Color de acento"
                  value={colorAccent}
                  onChange={setColorAccent}
                  helper="Detalles decorativos del dashboard, hovers y gráficas. Si lo dejas vacío usa el del tema."
                />
              </div>
            </CardContent>
          </Card>

          {/* Sidebar y header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutPanelLeft className="size-4" /> Cromo de la app
              </CardTitle>
              <CardDescription>
                Personaliza el fondo del menú lateral y el color de fondo, texto, hover y
                estado activo de cada elemento del menú.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ColorField
                label="Fondo del menú lateral (sidebar)"
                value={colorSidebar}
                onChange={setColorSidebar}
                helper="Si lo dejas vacío, se usa el fondo claro por defecto."
              />

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-medium text-foreground">
                  Elementos del menú
                </p>
                <p className="text-[10px] text-muted-foreground -mt-2">
                  Personaliza cada ítem del menú. Cualquier campo vacío usa el valor
                  derivado del tema.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField
                    label="Fondo del elemento"
                    value={sidebarItemBg}
                    onChange={setSidebarItemBg}
                    helper="Fondo de cada ítem en reposo. Vacío = transparente."
                  />
                  <ColorField
                    label="Texto del elemento"
                    value={sidebarItemColor}
                    onChange={setSidebarItemColor}
                    helper="Color del texto de los ítems del menú."
                  />
                  <ColorField
                    label="Fondo al pasar el cursor (hover)"
                    value={sidebarHoverBg}
                    onChange={setSidebarHoverBg}
                    helper="Resalte al pasar el mouse sobre un ítem."
                  />
                  <div />
                  <ColorField
                    label="Fondo del elemento activo"
                    value={sidebarActiveBg}
                    onChange={setSidebarActiveBg}
                    helper="Fondo del ítem de la página actual."
                  />
                  <ColorField
                    label="Texto del elemento activo"
                    value={sidebarActiveColor}
                    onChange={setSidebarActiveColor}
                    helper="Color del texto y la barra del ítem activo."
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setColorSidebar('')
                    setSidebarItemBg('')
                    setSidebarItemColor('')
                    setSidebarHoverBg('')
                    setSidebarActiveBg('')
                    setSidebarActiveColor('')
                  }}
                >
                  Restablecer a por defecto
                </Button>
              </div>

              {/* Mini preview del cromo */}
              <div className="rounded-lg border overflow-hidden">
                <div className="h-12 px-4 flex items-center text-sm border-b bg-white text-slate-900">
                  Encabezado
                </div>
                <div className="grid grid-cols-[180px_1fr]">
                  <div
                    className="p-3 space-y-1 text-xs min-h-36"
                    style={{
                      background: colorSidebar || '#ffffff',
                      color: colorSidebar ? inferForeground(colorSidebar) : '#0f172a',
                    }}
                  >
                    <div className="opacity-70 uppercase text-[9px] tracking-wide mb-1">
                      Clínica
                    </div>
                    {/* Ítem activo */}
                    <div
                      className="rounded-md px-2 py-1.5 font-medium"
                      style={{
                        background:
                          sidebarActiveBg ||
                          `color-mix(in srgb, ${colorPrimary || '#3b82f6'} 15%, transparent)`,
                        color: sidebarActiveColor || colorPrimary || '#3b82f6',
                      }}
                    >
                      Inicio
                    </div>
                    {/* Ítems en reposo */}
                    <div
                      className="rounded-md px-2 py-1.5"
                      style={{
                        background: sidebarItemBg || 'transparent',
                        color:
                          sidebarItemColor ||
                          (colorSidebar ? inferForeground(colorSidebar) : '#475569'),
                      }}
                    >
                      Pacientes
                    </div>
                    {/* Ítem con hover simulado */}
                    <div
                      className="rounded-md px-2 py-1.5"
                      style={{
                        background:
                          sidebarHoverBg ||
                          `color-mix(in srgb, ${
                            colorSidebar ? inferForeground(colorSidebar) : '#0f172a'
                          } 8%, transparent)`,
                        color:
                          sidebarItemColor ||
                          (colorSidebar ? inferForeground(colorSidebar) : '#475569'),
                      }}
                    >
                      Tratamientos{' '}
                      <span className="opacity-60 text-[9px]">(hover)</span>
                    </div>
                  </div>
                  <div className="p-4 text-xs text-muted-foreground bg-muted/30">
                    Contenido principal
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipografía */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="size-4" /> Tipografía
              </CardTitle>
              <CardDescription>
                La fuente seleccionada se aplica a toda la app. Las fuentes
                marcadas como Google Fonts se descargan al cargar — la primera
                vez puede tardar uno o dos segundos. Si no quieres descargas
                externas, elige «Sistema».
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="font_family">Familia tipográfica</Label>
                <Select
                  value={fontFamily}
                  onValueChange={(v) => setFontFamily(v as FontFamilyKey)}
                >
                  <SelectTrigger id="font_family">
                    <SelectValue placeholder="Selecciona una fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        <span style={{ fontFamily: f.css }}>{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  La fuente impacta tanto la interfaz como los documentos
                  impresos (recetas, recibos, tickets).
                </p>
              </div>

              {/* Vista previa */}
              <div
                className="rounded-lg border p-4 space-y-2"
                style={{ fontFamily: getFont(fontFamily).css }}
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Vista previa
                </p>
                <p className="text-2xl font-semibold">
                  {brandName || 'CIO Dent'}
                </p>
                <p className="text-sm">
                  Receta para María González — Amoxicilina 500 mg. Tomar 1
                  cápsula cada 8 horas durante 7 días.
                </p>
                <p className="text-xs text-muted-foreground">
                  abcdefghijklmnñopqrstuvwxyz · ABCDEFGHIJ · 0123456789 · $1,250.00
                </p>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
          {/* Datos fiscales y legales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="size-4 rotate-180" /> Datos fiscales y de contacto
              </CardTitle>
              <CardDescription>
                Aparecen en recetas y consentimientos (requisito NOM-004) y en el encabezado de
                documentos impresos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="razon_social">Razón social</Label>
                  <Input
                    id="razon_social"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    maxLength={13}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Domicilio</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Av. Reforma 123, Col. Centro, CDMX, CP 06600"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Teléfonos</Label>
                <TagListInput
                  value={phones}
                  onChange={setPhones}
                  placeholder="55 1234 5678"
                />
                <p className="text-[10px] text-muted-foreground">
                  Aparecen en recetas, consentimientos y encabezados.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Cédulas profesionales de la clínica</Label>
                <TagListInput
                  value={cedulas}
                  onChange={setCedulas}
                  placeholder="12345678"
                />
                <p className="text-[10px] text-muted-foreground">
                  Listado general de cédulas. Cada especialista mantiene además la suya en su
                  perfil para que aparezca en sus recetas.
                </p>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
          {/* Tickets de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Printer className="size-4" /> Tickets de pago
              </CardTitle>
              <CardDescription>
                Preferencias para impresión de tickets en impresora térmica. La
                impresora se elige al imprimir desde el diálogo del navegador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Ancho del papel</Label>
                  <Select
                    value={ticketWidth}
                    onValueChange={(v) => setTicketWidth(v as '58mm' | '80mm')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58 mm (chico)</SelectItem>
                      <SelectItem value="80mm">80 mm (estándar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    El más común en clínicas es 80 mm.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Al registrar un pago</Label>
                  <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketAutoPrint}
                      onChange={(e) => setTicketAutoPrint(e.target.checked)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm leading-tight">
                      Abrir el ticket automáticamente
                      <span className="block text-xs text-muted-foreground">
                        Si está apagado, aparece un botón "Imprimir ticket".
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido del ticket</Label>
                <div className="space-y-2 rounded-md border p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketShowLogo}
                      onChange={(e) => setTicketShowLogo(e.target.checked)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm">Incluir logo de la clínica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketShowAddress}
                      onChange={(e) => setTicketShowAddress(e.target.checked)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm">Incluir dirección y teléfono</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketShowCedulas}
                      onChange={(e) => setTicketShowCedulas(e.target.checked)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm">Incluir cédulas profesionales</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket_footer">Mensaje al pie del ticket</Label>
                <Textarea
                  id="ticket_footer"
                  rows={3}
                  value={ticketFooterMessage}
                  onChange={(e) => setTicketFooterMessage(e.target.value)}
                  placeholder="¡Gracias por su preferencia!&#10;Política de garantía: 30 días."
                />
                <p className="text-[10px] text-muted-foreground">
                  Usa saltos de línea para varias líneas. Aparece debajo del total.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recetas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Printer className="size-4" /> Recetas médicas
              </CardTitle>
              <CardDescription>
                Tamaño de papel, plantilla y opcional imagen de fondo o uso
                sobre recetas membretadas impresas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tamaño de papel</Label>
                  <Select
                    value={rxPaperSize}
                    onValueChange={(v) =>
                      setRxPaperSize(v as typeof rxPaperSize)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">
                        Carta vertical (8.5 × 11 in)
                      </SelectItem>
                      <SelectItem value="letter_landscape">
                        Carta horizontal (11 × 8.5 in)
                      </SelectItem>
                      <SelectItem value="half_letter">
                        Media carta vertical (5.5 × 8.5 in)
                      </SelectItem>
                      <SelectItem value="half_letter_landscape">
                        Media carta horizontal (8.5 × 5.5 in)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Modo de impresión</Label>
                  <Select
                    value={rxMode}
                    onValueChange={(v) => setRxMode(v as typeof rxMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">
                        Diseño completo (la app dibuja el encabezado)
                      </SelectItem>
                      <SelectItem value="preprinted">
                        Solo contenido (sobre papel membretado físico)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Si ya tienes recetas pre-impresas con tu logo, elige "solo
                    contenido" para no duplicar el membrete.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Acomodo del contenido</Label>
                  <Select
                    value={rxLayout}
                    onValueChange={(v) => setRxLayout(v as typeof rxLayout)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Estándar (espaciado amplio)
                      </SelectItem>
                      <SelectItem value="compact">
                        Compacto (ideal para media carta)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rx_margin_top">
                    Margen superior (mm)
                  </Label>
                  <Input
                    id="rx_margin_top"
                    type="number"
                    min={0}
                    max={120}
                    value={rxMarginTop}
                    onChange={(e) =>
                      setRxMarginTop(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Espacio reservado arriba del contenido. Útil cuando el
                    membrete físico ya ocupa la parte superior.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagen de fondo (opcional)</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="grid size-24 place-items-center rounded-md border bg-muted/30 overflow-hidden shrink-0">
                    {rxBackground ? (
                      <img
                        src={rxBackground}
                        alt="Fondo de receta"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const file = await new Promise<File | null>((resolve) => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = () => resolve(input.files?.[0] ?? null)
                          input.click()
                        })
                        if (!file) return
                        if (!file.type.startsWith('image/')) {
                          toast.error('Selecciona una imagen')
                          return
                        }
                        try {
                          const dataUrl = await fileToResizedDataUrl(file, {
                            maxWidth: 1700,
                            maxHeight: 2200,
                            quality: 0.85,
                          })
                          setRxBackground(dataUrl)
                        } catch {
                          toast.error('No fue posible procesar la imagen')
                        }
                      }}
                    >
                      <Upload className="size-4" /> Subir imagen
                    </Button>
                    {rxBackground ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setRxBackground(null)}
                      >
                        <X className="size-4" /> Quitar fondo
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Si usas modo "Diseño completo", esta imagen se imprime detrás
                  del contenido. En modo "Solo contenido" no se imprime — útil
                  como referencia visual en pantalla.
                </p>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="size-4" /> Sistema
                  </CardTitle>
                  <CardDescription>
                    Zona horaria y otras preferencias técnicas. La zona horaria afecta
                    cómo se muestran las fechas en reportes y documentos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Zona horaria</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una zona horaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Si el valor actual no está en la lista, lo añadimos
                            como primera opción para que se vea seleccionado. */}
                        {timezone &&
                        !TIMEZONES.some((t) => t.value === timezone) ? (
                          <SelectItem value={timezone}>{timezone}</SelectItem>
                        ) : null}
                        {TIMEZONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Hora actual en esta zona:{' '}
                      <span className="font-mono text-foreground">
                        {new Date().toLocaleString('es-MX', {
                          timeZone: timezone,
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button type="submit" disabled={update.isPending} className="sm:min-w-48">
              {update.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar configuración
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
