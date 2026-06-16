<?php

declare(strict_types=1);

use App\Http\Controllers\AgendaBlocksController;
use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\AuditsController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BrandingController;
use App\Http\Controllers\CashExpensesController;
use App\Http\Controllers\CashMovementsController;
use App\Http\Controllers\CashSessionsController;
use App\Http\Controllers\ChargePaymentsController;
use App\Http\Controllers\ChargesController;
use App\Http\Controllers\CommissionPaymentsController;
use App\Http\Controllers\IcsFeedController;
use App\Http\Controllers\ConsentTemplatesController;
use App\Http\Controllers\ConsentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscountsController;
use App\Http\Controllers\LabOrdersController;
use App\Http\Controllers\LabsController;
use App\Http\Controllers\MedicalHistoryController;
use App\Http\Controllers\MembershipPlansController;
use App\Http\Controllers\MembershipsController;
use App\Http\Controllers\DentalTreatmentLogController;
use App\Http\Controllers\EndodonticRecordsController;
use App\Http\Controllers\OdontogramController;
use App\Http\Controllers\Patient\AccountController as PatientAccountController;
use App\Http\Controllers\Platform\AdminsController as PlatformAdminsController;
use App\Http\Controllers\Platform\AuthController as PlatformAuthController;
use App\Http\Controllers\Platform\PlansController as PlatformPlansController;
use App\Http\Controllers\Platform\StatsController as PlatformStatsController;
use App\Http\Controllers\Platform\TenantsController as PlatformTenantsController;
use App\Http\Controllers\Patient\AppointmentsController as PatientAppointmentsController;
use App\Http\Controllers\Patient\AuthController as PatientAuthController;
use App\Http\Controllers\Patient\PrescriptionsController as PatientPrescriptionsController;
use App\Http\Controllers\Patient\RecallsController as PatientRecallsController;
use App\Http\Controllers\PatientPortalController;
use App\Http\Controllers\PatientsController;
use App\Http\Controllers\PrescriptionsController;
use App\Http\Controllers\PrescriptionTemplatesController;
use App\Http\Controllers\QuotesController;
use App\Http\Controllers\RecallsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SpecialistCommissionsController;
use App\Http\Controllers\SpecialistsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TreatmentsController;
use App\Http\Controllers\UsersController;
use App\Http\Middleware\EnsureAppModule;
use App\Http\Middleware\EnsureBillingActive;
use App\Http\Middleware\EnsurePatientAccount;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureTenantMatchesUser;
use Illuminate\Support\Facades\Route;

/*
 * Público (post middleware ResolveTenant, así devuelve datos del tenant activo).
 */
Route::get('/branding', [BrandingController::class, 'show']);

Route::post('/auth/login', [AuthController::class, 'login']);

/*
 * Feed ICS (autenticado por token en la URL — sin sesión).
 */
Route::get('agenda/feed/{token}.ics', [IcsFeedController::class, 'feed'])
    ->where('token', '[A-Za-z0-9]+');

/*
 * Autenticado.
 */
Route::middleware([
    'auth:sanctum',
    EnsureTenantMatchesUser::class,
    EnsureBillingActive::class,
])->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Suscripción de la clínica (plan + uso de pacientes + módulos).
    Route::get('/subscription', [SubscriptionController::class, 'show']);

    // Billing (pago de la suscripción a Amara Dental vía Stripe).
    Route::get('/billing', [BillingController::class, 'show']);
    Route::get('/billing/details', [BillingController::class, 'details']);
    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::get('/billing/portal', [BillingController::class, 'portal']);

    Route::put('/branding', [BrandingController::class, 'update']);

    Route::apiResource('users', UsersController::class);

    Route::apiResource('patients', PatientsController::class);

    // Pre-check de eliminación: indica si un paciente se puede borrar y, si no,
    // qué registros lo bloquean. Solo accesible para admin (policy).
    Route::get('patients/{patient}/delete-preview', [PatientsController::class, 'deletePreview']);

    // Portal de pacientes (app móvil) — gestión del acceso desde el staff.
    // Gateado por el módulo "app" del plan de la clínica.
    Route::middleware(EnsureAppModule::class)->group(function (): void {
        Route::get('patients/{patient}/portal', [PatientPortalController::class, 'show']);
        Route::post('patients/{patient}/portal/invite', [PatientPortalController::class, 'invite']);
        Route::delete('patients/{patient}/portal', [PatientPortalController::class, 'revoke']);
    });

    // Historia clínica anidada (upsert vía PUT).
    Route::get('patients/{patient}/medical-history', [MedicalHistoryController::class, 'show']);
    Route::put('patients/{patient}/medical-history', [MedicalHistoryController::class, 'update']);

    // Odontograma del paciente.
    Route::get('patients/{patient}/odontogram', [OdontogramController::class, 'index']);
    Route::put('patients/{patient}/odontogram-diagnosis', [OdontogramController::class, 'updateDiagnosis']);
    Route::put('patients/{patient}/odontogram/{tooth}', [OdontogramController::class, 'update'])
        ->whereNumber('tooth');

    // Bitácora de tratamientos del odontograma.
    Route::get('patients/{patient}/treatment-log', [DentalTreatmentLogController::class, 'index']);
    Route::post('patients/{patient}/treatment-log', [DentalTreatmentLogController::class, 'store']);
    Route::delete('patients/{patient}/treatment-log/{logEntry}', [DentalTreatmentLogController::class, 'destroy']);

    // Historia clínica de endodoncia.
    Route::get('patients/{patient}/endodontic-records', [EndodonticRecordsController::class, 'index']);
    Route::post('patients/{patient}/endodontic-records', [EndodonticRecordsController::class, 'store']);
    Route::put('patients/{patient}/endodontic-records/{record}', [EndodonticRecordsController::class, 'update']);
    Route::delete('patients/{patient}/endodontic-records/{record}', [EndodonticRecordsController::class, 'destroy']);

    // Consentimientos por paciente.
    Route::get('patients/{patient}/consents', [ConsentsController::class, 'index']);
    Route::post('patients/{patient}/consents', [ConsentsController::class, 'store']);
    Route::get('patients/{patient}/consents/{consent}', [ConsentsController::class, 'show'])
        ->name('consents.show');
    Route::delete('patients/{patient}/consents/{consent}', [ConsentsController::class, 'destroy']);

    // Catálogo de plantillas de consentimiento.
    Route::apiResource('consent-templates', ConsentTemplatesController::class)
        ->parameters(['consent-templates' => 'template']);

    // Catálogo de tratamientos y descuentos.
    Route::apiResource('treatments', TreatmentsController::class);
    Route::apiResource('discounts', DiscountsController::class)->except(['show']);

    // Catálogo de especialistas (no son usuarios del sistema).
    Route::apiResource('specialists', SpecialistsController::class);

    // Comisiones por tratamiento del especialista.
    Route::get('specialists/{specialist}/commissions', [SpecialistCommissionsController::class, 'index']);
    Route::put('specialists/{specialist}/commissions', [SpecialistCommissionsController::class, 'sync']);

    // Pagos de comisiones (bitácora).
    Route::get('commission-payments/pending', [CommissionPaymentsController::class, 'pending']);
    Route::get('commission-payments', [CommissionPaymentsController::class, 'index']);
    Route::get('commission-payments/{payment}', [CommissionPaymentsController::class, 'show']);
    Route::post('commission-payments', [CommissionPaymentsController::class, 'store']);
    Route::delete('commission-payments/{payment}', [CommissionPaymentsController::class, 'destroy']);

    // Caja.
    Route::get('cash-sessions/current', [CashSessionsController::class, 'current']);
    Route::get('cash-sessions', [CashSessionsController::class, 'index']);
    Route::get('cash-sessions/{cashSession}', [CashSessionsController::class, 'show']);
    Route::get('cash-sessions/{cashSession}/movements', [CashSessionsController::class, 'movements']);
    Route::post('cash-sessions', [CashSessionsController::class, 'open']);
    Route::post('cash-sessions/{cashSession}/close', [CashSessionsController::class, 'close']);

    // Egresos de caja.
    Route::get('cash-expenses', [CashExpensesController::class, 'index']);
    Route::post('cash-expenses', [CashExpensesController::class, 'store']);

    // Vista consolidada de movimientos (admin) — entradas + salidas con filtros.
    Route::get('cash-movements', [CashMovementsController::class, 'index']);
    Route::delete('cash-expenses/{expense}', [CashExpensesController::class, 'destroy']);

    Route::get('charges', [ChargesController::class, 'index']);
    Route::get('charges/{charge}', [ChargesController::class, 'show']);
    Route::post('charges', [ChargesController::class, 'store']);
    Route::post('charges/{charge}/payments', [ChargesController::class, 'addPayment']);
    Route::delete('charge-payments/{payment}', [ChargePaymentsController::class, 'destroy']);
    Route::get('patients/{patient}/account', [ChargesController::class, 'patientAccount']);
    Route::post('charges/{charge}/cancel', [ChargesController::class, 'cancel']);

    // Cotizaciones (presupuestos a pacientes).
    Route::get('quotes', [QuotesController::class, 'index']);
    Route::post('quotes', [QuotesController::class, 'store']);
    Route::get('quotes/{quote}', [QuotesController::class, 'show']);
    Route::put('quotes/{quote}', [QuotesController::class, 'update']);
    Route::delete('quotes/{quote}', [QuotesController::class, 'destroy']);
    Route::post('quotes/{quote}/sent', [QuotesController::class, 'markSent']);
    Route::post('quotes/{quote}/accepted', [QuotesController::class, 'markAccepted']);
    Route::post('quotes/{quote}/rejected', [QuotesController::class, 'markRejected']);
    Route::post('quotes/{quote}/reopen', [QuotesController::class, 'reopen']);
    Route::post('quotes/{quote}/convert', [QuotesController::class, 'convertToCharge']);

    // Agenda.
    Route::apiResource('appointments', AppointmentsController::class);
    Route::post('appointments/{appointment}/status', [AppointmentsController::class, 'changeStatus']);
    // Marca la cita como no_show y descarta al paciente (solo si es "primera vez").
    Route::post('appointments/{appointment}/no-show-discard', [AppointmentsController::class, 'markNoShowAndDiscardPatient']);

    // Bloqueos de agenda (horarios cerrados).
    Route::apiResource('agenda-blocks', AgendaBlocksController::class)
        ->parameters(['agenda-blocks' => 'block']);

    // Feed ICS — gestión del token del usuario actual.
    Route::get('agenda/feed-token', [IcsFeedController::class, 'show']);
    Route::post('agenda/feed-token', [IcsFeedController::class, 'regenerate']);

    // Recetas.
    Route::get('patients/{patient}/prescriptions', [PrescriptionsController::class, 'index']);
    Route::post('patients/{patient}/prescriptions', [PrescriptionsController::class, 'store']);
    Route::get('prescriptions/{prescription}', [PrescriptionsController::class, 'show']);
    Route::delete('prescriptions/{prescription}', [PrescriptionsController::class, 'destroy']);

    // Plantillas de recetas.
    Route::apiResource('prescription-templates', PrescriptionTemplatesController::class)
        ->parameters(['prescription-templates' => 'template']);

    // Bitácora / auditoría (solo admin; check dentro del controller).
    Route::get('audits', [AuditsController::class, 'index']);
    Route::get('audits/meta', [AuditsController::class, 'meta']);

    // Reportes (solo admin — la policy se aplica dentro del controller).
    Route::get('reports/sales', [ReportsController::class, 'sales']);
    Route::get('reports/payments', [ReportsController::class, 'payments']);
    Route::get('reports/commissions', [ReportsController::class, 'commissions']);

    // Laboratorios.
    Route::apiResource('labs', LabsController::class);
    Route::apiResource('lab-orders', LabOrdersController::class)
        ->parameters(['lab-orders' => 'order']);
    Route::post('lab-orders/{order}/status', [LabOrdersController::class, 'changeStatus']);

    // Recalls preventivos.
    Route::get('recalls', [RecallsController::class, 'index']);
    Route::get('recalls/{recall}', [RecallsController::class, 'show']);
    Route::patch('recalls/{recall}', [RecallsController::class, 'update']);
    Route::delete('recalls/{recall}', [RecallsController::class, 'destroy']);

    // Membresías.
    Route::apiResource('membership-plans', MembershipPlansController::class)
        ->parameters(['membership-plans' => 'plan']);
    Route::get('memberships', [MembershipsController::class, 'index']);
    Route::get('memberships/{membership}', [MembershipsController::class, 'show']);
    Route::post('memberships', [MembershipsController::class, 'store']);
    Route::post('memberships/{membership}/cancel', [MembershipsController::class, 'cancel']);
    Route::get('patients/{patient}/membership', [MembershipsController::class, 'currentForPatient']);
});

/*
 * Portal de pacientes (app móvil). Auth por token Sanctum (Bearer), NO cookies.
 * Tenant por header X-Tenant (ResolveTenant). Separado del API de staff.
 */
Route::prefix('patient')->middleware(EnsureAppModule::class)->group(function (): void {
    // Públicos (login passwordless por email).
    Route::post('auth/request-code', [PatientAuthController::class, 'requestCode']);
    Route::post('auth/verify', [PatientAuthController::class, 'verify']);

    // Autenticados como paciente (token + cuenta del tenant resuelto).
    Route::middleware(['auth:sanctum', EnsurePatientAccount::class])->group(function (): void {
        Route::post('auth/logout', [PatientAuthController::class, 'logout']);
        Route::get('me', [PatientAuthController::class, 'me']);
        Route::get('appointments', [PatientAppointmentsController::class, 'index']);
        Route::get('account', [PatientAccountController::class, 'index']);
        Route::get('prescriptions', [PatientPrescriptionsController::class, 'index']);
        Route::get('recalls', [PatientRecallsController::class, 'index']);
    });
});

/*
 * Panel de plataforma (super-admin del SaaS). Identidad aislada (PlatformAdmin),
 * auth por token Sanctum. Opera por encima de todos los tenants.
 */
Route::prefix('platform')->group(function (): void {
    Route::post('auth/login', [PlatformAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', EnsurePlatformAdmin::class])->group(function (): void {
        Route::get('me', [PlatformAuthController::class, 'me']);
        Route::post('auth/logout', [PlatformAuthController::class, 'logout']);

        // Dashboard: métricas agregadas cross-tenant.
        Route::get('stats', [PlatformStatsController::class, 'index']);

        // Configuración de planes.
        Route::get('plans', [PlatformPlansController::class, 'index']);
        Route::patch('plans/{plan}', [PlatformPlansController::class, 'update']);

        // Gestión de clínicas.
        Route::get('tenants', [PlatformTenantsController::class, 'index']);
        Route::post('tenants', [PlatformTenantsController::class, 'store']);
        Route::get('tenants/{tenant}', [PlatformTenantsController::class, 'show']);
        Route::patch('tenants/{tenant}', [PlatformTenantsController::class, 'update']);
        Route::delete('tenants/{tenant}', [PlatformTenantsController::class, 'destroy']);

        // Gestión de super-admins.
        Route::get('admins', [PlatformAdminsController::class, 'index']);
        Route::post('admins', [PlatformAdminsController::class, 'store']);
        Route::patch('admins/{admin}', [PlatformAdminsController::class, 'update']);
        Route::delete('admins/{admin}', [PlatformAdminsController::class, 'destroy']);
    });
});
