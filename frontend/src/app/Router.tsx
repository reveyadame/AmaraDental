import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PatientsListPage } from '@/features/patients/PatientsListPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { PrintOdontogramPage } from '@/features/patients/PrintOdontogramPage'
import { PrintEndodonticsPage } from '@/features/patients/PrintEndodonticsPage'
import { PrintConsentPage } from '@/features/patients/PrintConsentPage'
import { TreatmentsPage } from '@/pages/TreatmentsPage'
import { SpecialistsPage } from '@/pages/SpecialistsPage'
import { CashPage } from '@/pages/CashPage'
import { AddPaymentPage } from '@/features/cash/AddPaymentPage'
import { NewChargePage } from '@/features/cash/NewChargePage'
import { PrintAccountStatementPage } from '@/features/cash/PrintAccountStatementPage'
import { PendingBalancesPage } from '@/pages/PendingBalancesPage'
import { AllChargesPage } from '@/pages/AllChargesPage'
import { CashSessionsHistoryPage } from '@/pages/CashSessionsHistoryPage'
import { CashMovementsPage } from '@/pages/CashMovementsPage'
import { PrintCashSessionPage } from '@/features/cash/PrintCashSessionPage'
import { PrintChargeTicketPage } from '@/features/cash/PrintChargeTicketPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { NewPrescriptionPage } from '@/features/prescriptions/NewPrescriptionPage'
import { PrintPrescriptionPage } from '@/features/prescriptions/PrintPrescriptionPage'
import { PrescriptionTemplatesPage } from '@/pages/PrescriptionTemplatesPage'
import { ConsentTemplatesPage } from '@/pages/ConsentTemplatesPage'
import { ConfigurationPage } from '@/pages/ConfigurationPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { MembershipsPage } from '@/pages/MembershipsPage'
import { LabOrdersPage } from '@/pages/LabOrdersPage'
import { RecallsPage } from '@/pages/RecallsPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { UsersPage } from '@/pages/UsersPage'
import { CommissionsPage } from '@/pages/CommissionsPage'
import { PrintCommissionPaymentPage } from '@/features/commissions/PrintCommissionPaymentPage'
import { PrintCommissionTicketPage } from '@/features/commissions/PrintCommissionTicketPage'
import { QuotesPage } from '@/pages/QuotesPage'
import { QuoteFormPage } from '@/features/quotes/QuoteFormPage'
import { QuoteDetailPage } from '@/features/quotes/QuoteDetailPage'
import { PrintQuotePage } from '@/features/quotes/PrintQuotePage'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from './AppShell'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Shell><DashboardPage /></Shell>} />
      <Route path="/pacientes" element={<Shell><PatientsListPage /></Shell>} />
      <Route path="/pacientes/:id" element={<Shell><PatientDetailPage /></Shell>} />
      <Route path="/pacientes/:id/recetas/nueva" element={<Shell><NewPrescriptionPage /></Shell>} />
      <Route
        path="/pacientes/:id/odontograma/imprimir"
        element={
          <ProtectedRoute>
            <PrintOdontogramPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id/endodoncia/imprimir"
        element={
          <ProtectedRoute>
            <PrintEndodonticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recetas/:id/imprimir"
        element={
          <ProtectedRoute>
            <PrintPrescriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id/consentimientos/:consentId/imprimir"
        element={
          <ProtectedRoute>
            <PrintConsentPage />
          </ProtectedRoute>
        }
      />
      <Route path="/tratamientos" element={<Shell><TreatmentsPage /></Shell>} />
      <Route path="/especialistas" element={<Shell><SpecialistsPage /></Shell>} />
      <Route path="/agenda" element={<Shell><AgendaPage /></Shell>} />
      <Route path="/recetas/plantillas" element={<Shell><PrescriptionTemplatesPage /></Shell>} />
      <Route path="/consentimientos/plantillas" element={<Shell><ConsentTemplatesPage /></Shell>} />
      <Route path="/configuracion" element={<Shell><ConfigurationPage /></Shell>} />
      <Route path="/reportes" element={<Shell><ReportsPage /></Shell>} />
      <Route path="/membresias" element={<Shell><MembershipsPage /></Shell>} />
      <Route path="/laboratorios" element={<Shell><LabOrdersPage /></Shell>} />
      <Route path="/recalls" element={<Shell><RecallsPage /></Shell>} />
      <Route path="/bitacora" element={<Shell><AuditLogPage /></Shell>} />
      <Route path="/usuarios" element={<Shell><UsersPage /></Shell>} />
      <Route path="/comisiones" element={<Shell><CommissionsPage /></Shell>} />
      <Route
        path="/comisiones/pagos/:id/imprimir"
        element={
          <ProtectedRoute>
            <PrintCommissionPaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comisiones/pagos/:id/ticket"
        element={
          <ProtectedRoute>
            <PrintCommissionTicketPage />
          </ProtectedRoute>
        }
      />
      <Route path="/caja" element={<Shell><CashPage /></Shell>} />
      <Route path="/caja/nuevo" element={<Shell><NewChargePage /></Shell>} />
      <Route path="/caja/cobros" element={<Shell><AllChargesPage /></Shell>} />
      <Route path="/caja/saldos" element={<Shell><PendingBalancesPage /></Shell>} />
      <Route path="/caja/cortes" element={<Shell><CashSessionsHistoryPage /></Shell>} />
      <Route path="/caja/movimientos" element={<Shell><CashMovementsPage /></Shell>} />
      <Route
        path="/caja/cortes/:id/imprimir"
        element={
          <ProtectedRoute>
            <PrintCashSessionPage />
          </ProtectedRoute>
        }
      />
      <Route path="/caja/cobros/:id/pagar" element={<Shell><AddPaymentPage /></Shell>} />

      <Route path="/cotizaciones" element={<Shell><QuotesPage /></Shell>} />
      <Route
        path="/cotizaciones/nueva"
        element={<Shell><QuoteFormPage mode="create" /></Shell>}
      />
      <Route
        path="/cotizaciones/:id"
        element={<Shell><QuoteDetailPage /></Shell>}
      />
      <Route
        path="/cotizaciones/:id/editar"
        element={<Shell><QuoteFormPage mode="edit" /></Shell>}
      />
      <Route
        path="/cotizaciones/:id/imprimir"
        element={
          <ProtectedRoute>
            <PrintQuotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caja/cobros/:id/ticket"
        element={
          <ProtectedRoute>
            <PrintChargeTicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id/cuenta/imprimir"
        element={
          <ProtectedRoute>
            <PrintAccountStatementPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
