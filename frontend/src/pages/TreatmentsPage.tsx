import { Stethoscope } from 'lucide-react'
import { TreatmentsListPanel } from '@/features/treatments/TreatmentsListPanel'
import { DiscountsListPanel } from '@/features/discounts/DiscountsListPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { accent } from '@/shared/lib/module-accents'

export function TreatmentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('treatments').badge}`}>
          <Stethoscope className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Catálogo clínico
          </h1>
          <p className="text-sm text-muted-foreground">
            Tratamientos, costos, comisiones, periodicidad y descuentos disponibles para
            cobrar.
          </p>
        </div>
      </header>

      <Tabs defaultValue="treatments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="discounts">Descuentos</TabsTrigger>
        </TabsList>
        <TabsContent value="treatments">
          <TreatmentsListPanel />
        </TabsContent>
        <TabsContent value="discounts">
          <DiscountsListPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
