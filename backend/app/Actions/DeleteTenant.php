<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\PatientAccount;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Elimina una clínica (tenant) y TODOS sus datos, de forma irreversible.
 *
 * Es una operación de infraestructura cross-tenant: borra por `tenant_id` en
 * cada tabla del negocio (con las FK desactivadas para no depender del orden),
 * limpia tokens/roles/suscripciones asociados, y al final la fila del tenant.
 * Todo dentro de una transacción: si algo falla, no se borra nada.
 */
class DeleteTenant
{
    /**
     * Modelos tenant-scoped (todos usan BelongsToTenant). Se borran por
     * tenant_id. Incluye users y patient_accounts.
     *
     * @var list<class-string<\Illuminate\Database\Eloquent\Model>>
     */
    private const TENANT_MODELS = [
        \App\Models\AgendaBlock::class,
        \App\Models\Appointment::class,
        \App\Models\CashExpense::class,
        \App\Models\CashSession::class,
        \App\Models\Charge::class,
        \App\Models\ChargeItem::class,
        \App\Models\ChargePayment::class,
        \App\Models\CommissionPayment::class,
        \App\Models\Consent::class,
        \App\Models\ConsentTemplate::class,
        \App\Models\DentalTreatmentLog::class,
        \App\Models\Discount::class,
        \App\Models\EndodonticRecord::class,
        \App\Models\Lab::class,
        \App\Models\LabOrder::class,
        \App\Models\MedicalHistory::class,
        \App\Models\Membership::class,
        \App\Models\MembershipPlan::class,
        \App\Models\PatientCredit::class,
        \App\Models\PatientLoginCode::class,
        \App\Models\Prescription::class,
        \App\Models\PrescriptionItem::class,
        \App\Models\PrescriptionTemplate::class,
        \App\Models\PrescriptionTemplateItem::class,
        \App\Models\Quote::class,
        \App\Models\QuoteItem::class,
        \App\Models\Recall::class,
        \App\Models\Specialist::class,
        \App\Models\ToothState::class,
        \App\Models\Treatment::class,
        \App\Models\TreatmentSpecialistCommission::class,
        \App\Models\Patient::class,
        \App\Models\PatientAccount::class,
        \App\Models\User::class,
    ];

    public function handle(Tenant $tenant): void
    {
        // 1. Best-effort: detiene el cobro en Stripe (no bloquea el borrado).
        $this->cancelBilling($tenant);

        $tenantId = $tenant->id;
        $userIds = DB::table('users')->where('tenant_id', $tenantId)->pluck('id')->all();
        $patientAccountIds = DB::table('patient_accounts')->where('tenant_id', $tenantId)->pluck('id')->all();
        $subscriptionIds = DB::table('subscriptions')->where('tenant_id', $tenantId)->pluck('id')->all();

        DB::transaction(function () use ($tenantId, $userIds, $patientAccountIds, $subscriptionIds): void {
            Schema::withoutForeignKeyConstraints(function () use ($tenantId, $userIds, $patientAccountIds, $subscriptionIds): void {
                // Tokens Sanctum de los usuarios y cuentas de paciente.
                $this->deleteTokens(User::class, $userIds);
                $this->deleteTokens(PatientAccount::class, $patientAccountIds);

                // Roles/permisos (spatie) de los usuarios.
                if ($userIds !== []) {
                    DB::table('model_has_roles')->where('model_type', User::class)->whereIn('model_id', $userIds)->delete();
                    DB::table('model_has_permissions')->where('model_type', User::class)->whereIn('model_id', $userIds)->delete();
                }

                // Cashier: items y suscripciones de la clínica.
                if ($subscriptionIds !== []) {
                    DB::table('subscription_items')->whereIn('subscription_id', $subscriptionIds)->delete();
                }
                DB::table('subscriptions')->where('tenant_id', $tenantId)->delete();

                // Todas las tablas del negocio, por tenant_id.
                foreach (self::TENANT_MODELS as $model) {
                    DB::table((new $model)->getTable())->where('tenant_id', $tenantId)->delete();
                }

                // Finalmente, la clínica.
                DB::table('tenants')->where('id', $tenantId)->delete();
            });
        });
    }

    /** @param list<int> $ids */
    private function deleteTokens(string $type, array $ids): void
    {
        if ($ids === []) {
            return;
        }

        DB::table('personal_access_tokens')
            ->where('tokenable_type', $type)
            ->whereIn('tokenable_id', $ids)
            ->delete();
    }

    private function cancelBilling(Tenant $tenant): void
    {
        if ($tenant->stripe_id === null) {
            return;
        }

        try {
            $tenant->subscriptions()->get()->each(function ($subscription): void {
                if ($subscription->valid()) {
                    $subscription->cancelNow();
                }
            });
        } catch (Throwable $e) {
            // El cobro se puede limpiar manualmente en Stripe; no frenamos el borrado.
            Log::warning('No se pudo cancelar la suscripción al eliminar la clínica.', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
