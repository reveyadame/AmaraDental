import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FileBarChart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Card, CardContent } from '@/shared/ui/card'
import { useMe } from '@/features/auth/hooks'
import {
  DateRangePicker,
  presetThisMonth,
  type DateRange,
} from '@/features/reports/DateRangePicker'
import { SalesReportPanel } from '@/features/reports/SalesReportPanel'
import { PaymentsReportPanel } from '@/features/reports/PaymentsReportPanel'
import { CommissionsReportPanel } from '@/features/reports/CommissionsReportPanel'
import { accent } from '@/shared/lib/module-accents'

export function ReportsPage() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const [range, setRange] = useState<DateRange>(() => presetThisMonth())

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('reports').badge}`}>
          <FileBarChart className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Ventas, cobros y comisiones del periodo seleccionado.
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="p-4">
          <DateRangePicker value={range} onChange={setRange} />
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="payments">Cobros</TabsTrigger>
          <TabsTrigger value="commissions">Comisiones</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportPanel range={range} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsReportPanel range={range} />
        </TabsContent>
        <TabsContent value="commissions">
          <CommissionsReportPanel range={range} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
