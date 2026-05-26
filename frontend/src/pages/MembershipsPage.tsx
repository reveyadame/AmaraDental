import { Sparkles } from 'lucide-react'
import { MembershipPlansPanel } from '@/features/memberships/MembershipPlansPanel'
import { MembershipsListPanel } from '@/features/memberships/MembershipsListPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { accent } from '@/shared/lib/module-accents'

export function MembershipsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('memberships').badge}`}>
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Membresías anuales
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura los planes de membresía y administra las inscripciones de tus
            pacientes.
          </p>
        </div>
      </header>

      <Tabs defaultValue="memberships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memberships">Membresías vendidas</TabsTrigger>
          <TabsTrigger value="plans">Catálogo de planes</TabsTrigger>
        </TabsList>
        <TabsContent value="memberships">
          <MembershipsListPanel />
        </TabsContent>
        <TabsContent value="plans">
          <MembershipPlansPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
