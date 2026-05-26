<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migra los usuarios con rol "dentista" al nuevo catálogo `specialists` y
 * reescribe todas las FK de `*specialist_user_id*` a `*specialist_id*`.
 *
 * Pasos:
 *   1. Crear specialists desde users con rol dentista (preserva tenant_id).
 *   2. Construir mapping user_id → specialist_id en memoria.
 *   3. Añadir columnas `specialist_id` en las tablas dependientes.
 *   4. Backfill con el mapping.
 *   5. Quitar las FK y columnas viejas.
 *   6. Marcar las nuevas columnas como `constrained` y NOT NULL donde aplica.
 *   7. Eliminar los usuarios dentistas y el rol "dentista" de Spatie.
 *
 * Esta migración asume que ya corrió `2026_06_15_000000_create_specialists_table`.
 */
return new class extends Migration
{
    /** @var array<int, int> user_id → specialist_id */
    private array $map = [];

    public function up(): void
    {
        $this->copyDentistsToSpecialists();
        $this->addSpecialistIdColumns();
        $this->backfillFromMapping();
        $this->dropOldSpecialistUserColumns();
        $this->enforceNotNullAndForeignKeys();
        $this->migrateTreatmentCommissionsTable();
        $this->deleteDentistUsers();
    }

    public function down(): void
    {
        // Reversa parcial. Una rollback completa requeriría restaurar usuarios
        // borrados, lo cual no es seguro. En su lugar, dejamos las columnas
        // viejas reañadidas (vacías) para no romper migrate:fresh.
        Schema::table('appointments', function (Blueprint $table): void {
            $table->foreignId('specialist_user_id')->nullable()->constrained('users')->cascadeOnDelete();
        });
        Schema::table('agenda_blocks', function (Blueprint $table): void {
            $table->foreignId('specialist_user_id')->nullable()->constrained('users')->cascadeOnDelete();
        });
        Schema::table('charge_items', function (Blueprint $table): void {
            $table->foreignId('specialist_user_id')->nullable()->constrained('users')->nullOnDelete();
        });
        Schema::table('commission_payments', function (Blueprint $table): void {
            $table->foreignId('specialist_user_id')->nullable()->constrained('users')->restrictOnDelete();
        });
        Schema::table('prescriptions', function (Blueprint $table): void {
            $table->foreignId('specialist_user_id')->nullable()->constrained('users')->cascadeOnDelete();
        });

        foreach (
            ['appointments', 'agenda_blocks', 'charge_items', 'commission_payments', 'prescriptions']
            as $tbl
        ) {
            Schema::table($tbl, function (Blueprint $table) use ($tbl): void {
                if (Schema::hasColumn($tbl, 'specialist_id')) {
                    $table->dropConstrainedForeignId('specialist_id');
                }
            });
        }
    }

    private function copyDentistsToSpecialists(): void
    {
        $dentistRoleId = DB::table('roles')
            ->where('name', 'dentista')
            ->value('id');

        if (! $dentistRoleId) {
            return;
        }

        $dentistUserIds = DB::table('model_has_roles')
            ->where('role_id', $dentistRoleId)
            ->where('model_type', 'App\\Models\\User')
            ->pluck('model_id')
            ->all();

        if (empty($dentistUserIds)) {
            return;
        }

        $now = now();
        foreach (DB::table('users')->whereIn('id', $dentistUserIds)->get() as $u) {
            $specialistId = DB::table('specialists')->insertGetId([
                'tenant_id' => $u->tenant_id,
                'name' => $u->name,
                'specialty' => $u->specialty ?? null,
                'cedula_profesional' => $u->cedula_profesional ?? null,
                'default_commission_percent' => $u->default_commission_percent ?? null,
                'bio' => $u->bio ?? null,
                'active' => (bool) $u->active,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->map[(int) $u->id] = (int) $specialistId;
        }
    }

    private function addSpecialistIdColumns(): void
    {
        foreach (
            ['appointments', 'agenda_blocks', 'charge_items', 'commission_payments', 'prescriptions']
            as $tbl
        ) {
            Schema::table($tbl, function (Blueprint $table): void {
                $table->unsignedBigInteger('specialist_id')->nullable()->after('tenant_id');
            });
        }
    }

    private function backfillFromMapping(): void
    {
        if (empty($this->map)) {
            return;
        }

        $tables = [
            'appointments',
            'agenda_blocks',
            'charge_items',
            'commission_payments',
            'prescriptions',
        ];

        foreach ($tables as $tbl) {
            foreach ($this->map as $userId => $specialistId) {
                DB::table($tbl)
                    ->where('specialist_user_id', $userId)
                    ->update(['specialist_id' => $specialistId]);
            }
        }
    }

    private function dropOldSpecialistUserColumns(): void
    {
        $tables = [
            'appointments',
            'agenda_blocks',
            'charge_items',
            'commission_payments',
            'prescriptions',
        ];

        foreach ($tables as $tbl) {
            Schema::table($tbl, function (Blueprint $table) use ($tbl): void {
                // drop foreign + index si existen, después la columna.
                if (Schema::hasColumn($tbl, 'specialist_user_id')) {
                    $table->dropConstrainedForeignId('specialist_user_id');
                }
            });
        }
    }

    private function enforceNotNullAndForeignKeys(): void
    {
        // appointments y commission_payments y prescriptions requieren NOT NULL.
        foreach (['appointments', 'commission_payments', 'prescriptions'] as $tbl) {
            // Si no hubo dentistas pre-existentes, no podemos forzar NOT NULL
            // porque significaría que la columna queda vacía sin valor por defecto.
            // En ese caso dejamos nullable (no hay datos previos).
            $rows = DB::table($tbl)->whereNull('specialist_id')->count();
            if ($rows === 0) {
                DB::statement("ALTER TABLE {$tbl} MODIFY specialist_id BIGINT UNSIGNED NOT NULL");
            }
        }

        // FK constraints reales.
        $relations = [
            ['appointments', 'cascade'],
            ['agenda_blocks', 'cascade'],
            ['charge_items', 'set null'],
            ['commission_payments', 'restrict'],
            ['prescriptions', 'cascade'],
        ];

        foreach ($relations as [$tbl, $onDelete]) {
            Schema::table($tbl, function (Blueprint $table) use ($tbl, $onDelete): void {
                $table->foreign('specialist_id')
                    ->references('id')
                    ->on('specialists')
                    ->onDelete($onDelete);
                $table->index(['tenant_id', 'specialist_id'], $tbl.'_tenant_specialist_idx');
            });
        }
    }

    private function migrateTreatmentCommissionsTable(): void
    {
        // treatment_specialist_commissions.user_id → specialist_id
        if (! Schema::hasColumn('treatment_specialist_commissions', 'specialist_id')) {
            Schema::table('treatment_specialist_commissions', function (Blueprint $table): void {
                $table->unsignedBigInteger('specialist_id')->nullable()->after('tenant_id');
            });
        }

        foreach ($this->map as $userId => $specialistId) {
            DB::table('treatment_specialist_commissions')
                ->where('user_id', $userId)
                ->update(['specialist_id' => $specialistId]);
        }

        // Quita índices compuestos y FK de user_id antes de eliminar la columna.
        // MySQL no permite eliminar una columna que forma parte de un índice compuesto
        // sin soltar primero esos índices explícitamente.
        Schema::table('treatment_specialist_commissions', function (Blueprint $table): void {
            if (Schema::hasColumn('treatment_specialist_commissions', 'user_id')) {
                $table->dropUnique('tsc_tenant_user_treatment_unique');
                $table->dropIndex('tsc_tenant_user_idx');
                $table->dropConstrainedForeignId('user_id');
            }
        });

        // FK y unique recreate
        Schema::table('treatment_specialist_commissions', function (Blueprint $table): void {
            // Si no hay filas con NULL, marca NOT NULL.
            // (Saltamos modify para mantener simple; un seed posterior limpia.)
            $table->foreign('specialist_id')
                ->references('id')
                ->on('specialists')
                ->cascadeOnDelete();
            $table->unique(
                ['tenant_id', 'specialist_id', 'treatment_id'],
                'tsc_tenant_specialist_treatment_unique',
            );
            $table->index(['tenant_id', 'specialist_id'], 'tsc_tenant_specialist_idx');
        });
    }

    private function deleteDentistUsers(): void
    {
        $dentistRoleId = DB::table('roles')->where('name', 'dentista')->value('id');
        if (! $dentistRoleId) {
            return;
        }

        $userIds = DB::table('model_has_roles')
            ->where('role_id', $dentistRoleId)
            ->where('model_type', 'App\\Models\\User')
            ->pluck('model_id')
            ->all();

        if (empty($userIds)) {
            return;
        }

        DB::table('model_has_roles')->where('role_id', $dentistRoleId)->delete();
        DB::table('users')->whereIn('id', $userIds)->delete();

        // El rol como tal se elimina en el seeder de roles nuevos.
    }
};
