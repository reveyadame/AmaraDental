<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Esquema consolidado de la base de datos.
 *
 * Reemplaza al histórico de 48 migraciones individuales que existían antes
 * del primer deploy. Crea todas las tablas en el orden correcto de
 * dependencia (referenciadas antes que referenciantes) y refleja el
 * estado FINAL del esquema, incluyendo:
 *
 *   - users SIN campos clínicos (specialty, cedula_profesional, bio,
 *     default_commission_percent, signature_image) — esos viven en
 *     `specialists`.
 *   - cash_sessions global por tenant con closed_by_user_id y cierres
 *     multi-método.
 *   - tenants con branding completo (chrome colors, accent), ticket
 *     settings, prescription layout y font_family.
 *   - charge_items, appointments, agenda_blocks, commission_payments y
 *     prescriptions usan `specialist_id` apuntando a `specialists`
 *     (NO `specialist_user_id`).
 *   - treatment_specialist_commissions usa `specialist_id` (NO `user_id`).
 *   - lab_orders incluye `lab_id` FK al catálogo de labs.
 *   - charge_items incluye `commission_payment_id`.
 */
return new class extends Migration
{
    public function up(): void
    {
        //
        // 1. Tenants — raíz, sin dependencias.
        //
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // White-label / branding
            $table->string('brand_name')->nullable();
            $table->mediumText('logo_url')->nullable();
            $table->string('color_primary')->default('oklch(0.546 0.215 262.881)');
            $table->string('color_primary_foreground')->default('oklch(0.985 0 0)');
            $table->string('color_secondary')->default('oklch(0.97 0 0)');
            $table->string('color_sidebar', 64)->nullable();
            $table->string('color_header', 64)->nullable();
            $table->string('color_accent', 64)->nullable();

            // Datos fiscales / contacto (NOM-004)
            $table->string('razon_social')->nullable();
            $table->string('rfc', 13)->nullable();
            $table->text('address')->nullable();
            $table->json('phones')->nullable();
            $table->json('cedulas_clinica')->nullable();

            $table->string('timezone', 64)->default('America/Mexico_City');

            // Preferencias de ticket de pago
            $table->string('ticket_width', 8)->default('80mm');
            $table->boolean('ticket_show_logo')->default(true);
            $table->boolean('ticket_show_address')->default(true);
            $table->boolean('ticket_show_cedulas')->default(false);
            $table->text('ticket_footer_message')->nullable();
            $table->boolean('ticket_auto_print')->default(false);

            // Preferencias de impresión de recetas
            $table->string('prescription_paper_size', 24)->default('letter');
            $table->string('prescription_mode', 16)->default('design');
            $table->mediumText('prescription_background_url')->nullable();
            $table->unsignedSmallInteger('prescription_margin_top_mm')->default(15);
            $table->string('prescription_layout', 16)->default('standard');

            // Tipografía global
            $table->string('font_family', 40)->nullable();

            $table->timestamps();
        });

        //
        // 2. Users — depende de tenants. SIN campos clínicos (removidos
        //    en 2026_06_15_000200).
        //
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 32)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('active')->default(true);
            $table->string('ics_feed_token', 64)->nullable()->unique();
            $table->timestamp('ics_feed_token_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->unique(['tenant_id', 'email']);
            $table->index(['tenant_id', 'created_at']);
        });

        //
        // 3. Laravel scaffolding tables.
        //
        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('cache', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        //
        // 4. Sanctum personal_access_tokens.
        //
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        //
        // 5. Spatie permissions.
        //
        $teams = config('permission.teams');
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');
        $pivotRole = $columnNames['role_pivot_key'] ?? 'role_id';
        $pivotPermission = $columnNames['permission_pivot_key'] ?? 'permission_id';

        throw_if(empty($tableNames), Exception::class, 'Error: config/permission.php not loaded. Run [php artisan config:clear] and try again.');
        throw_if($teams && empty($columnNames['team_foreign_key'] ?? null), Exception::class, 'Error: team_foreign_key on config/permission.php not loaded. Run [php artisan config:clear] and try again.');

        Schema::create($tableNames['permissions'], static function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });

        Schema::create($tableNames['roles'], static function (Blueprint $table) use ($teams, $columnNames): void {
            $table->bigIncrements('id');
            if ($teams || config('permission.testing')) {
                $table->unsignedBigInteger($columnNames['team_foreign_key'])->nullable();
                $table->index($columnNames['team_foreign_key'], 'roles_team_foreign_key_index');
            }
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
            if ($teams || config('permission.testing')) {
                $table->unique([$columnNames['team_foreign_key'], 'name', 'guard_name']);
            } else {
                $table->unique(['name', 'guard_name']);
            }
        });

        Schema::create($tableNames['model_has_permissions'], static function (Blueprint $table) use ($tableNames, $columnNames, $pivotPermission, $teams): void {
            $table->unsignedBigInteger($pivotPermission);

            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key']);
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_permissions_model_id_model_type_index');

            $table->foreign($pivotPermission)
                ->references('id')
                ->on($tableNames['permissions'])
                ->onDelete('cascade');
            if ($teams) {
                $table->unsignedBigInteger($columnNames['team_foreign_key']);
                $table->index($columnNames['team_foreign_key'], 'model_has_permissions_team_foreign_key_index');

                $table->primary(
                    [$columnNames['team_foreign_key'], $pivotPermission, $columnNames['model_morph_key'], 'model_type'],
                    'model_has_permissions_permission_model_type_primary',
                );
            } else {
                $table->primary(
                    [$pivotPermission, $columnNames['model_morph_key'], 'model_type'],
                    'model_has_permissions_permission_model_type_primary',
                );
            }
        });

        Schema::create($tableNames['model_has_roles'], static function (Blueprint $table) use ($tableNames, $columnNames, $pivotRole, $teams): void {
            $table->unsignedBigInteger($pivotRole);

            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key']);
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_roles_model_id_model_type_index');

            $table->foreign($pivotRole)
                ->references('id')
                ->on($tableNames['roles'])
                ->onDelete('cascade');
            if ($teams) {
                $table->unsignedBigInteger($columnNames['team_foreign_key']);
                $table->index($columnNames['team_foreign_key'], 'model_has_roles_team_foreign_key_index');

                $table->primary(
                    [$columnNames['team_foreign_key'], $pivotRole, $columnNames['model_morph_key'], 'model_type'],
                    'model_has_roles_role_model_type_primary',
                );
            } else {
                $table->primary(
                    [$pivotRole, $columnNames['model_morph_key'], 'model_type'],
                    'model_has_roles_role_model_type_primary',
                );
            }
        });

        Schema::create($tableNames['role_has_permissions'], static function (Blueprint $table) use ($tableNames, $pivotRole, $pivotPermission): void {
            $table->unsignedBigInteger($pivotPermission);
            $table->unsignedBigInteger($pivotRole);

            $table->foreign($pivotPermission)
                ->references('id')
                ->on($tableNames['permissions'])
                ->onDelete('cascade');

            $table->foreign($pivotRole)
                ->references('id')
                ->on($tableNames['roles'])
                ->onDelete('cascade');

            $table->primary([$pivotPermission, $pivotRole], 'role_has_permissions_permission_id_role_id_primary');
        });

        app('cache')
            ->store(config('permission.cache.store') != 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));

        //
        // 6. Audits (owen-it/laravel-auditing).
        //
        $morphPrefix = config('audit.user.morph_prefix', 'user');
        $auditsTable = config('audit.drivers.database.table', 'audits');

        Schema::create($auditsTable, function (Blueprint $table) use ($morphPrefix): void {
            $table->bigIncrements('id');
            $table->string($morphPrefix.'_type')->nullable();
            $table->unsignedBigInteger($morphPrefix.'_id')->nullable();
            $table->string('event');
            $table->morphs('auditable');
            $table->text('old_values')->nullable();
            $table->text('new_values')->nullable();
            $table->text('url')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 1023)->nullable();
            $table->string('tags')->nullable();
            $table->timestamps();

            $table->index([$morphPrefix.'_id', $morphPrefix.'_type']);
        });

        //
        // 7. Patients.
        //
        Schema::create('patients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('first_name');
            $table->string('last_name');
            $table->date('date_of_birth');
            $table->enum('gender', ['M', 'F', 'Otro']);
            $table->string('curp', 18)->nullable();
            $table->string('rfc', 13)->nullable();

            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('mobile_phone', 32)->nullable();

            $table->text('address')->nullable();
            $table->string('city', 120)->nullable();
            $table->string('state', 120)->nullable();
            $table->string('postal_code', 10)->nullable();

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 32)->nullable();

            $table->string('occupation', 120)->nullable();
            $table->string('referred_by', 160)->nullable();
            $table->text('notes')->nullable();

            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'last_name', 'first_name']);
            $table->index(['tenant_id', 'created_at']);
            $table->unique(['tenant_id', 'curp']);
        });

        //
        // 8. Medical histories.
        //
        Schema::create('medical_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

            $table->json('chronic_conditions')->nullable();
            $table->json('allergies')->nullable();
            $table->json('current_medications')->nullable();
            $table->text('previous_surgeries')->nullable();
            $table->text('family_history')->nullable();
            $table->text('dental_history')->nullable();

            $table->date('last_dental_visit')->nullable();

            $table->enum('pregnancy_status', ['no', 'si', 'posible', 'na'])->nullable();
            $table->boolean('smoker')->nullable();
            $table->boolean('alcohol_consumer')->nullable();

            $table->string('blood_pressure', 15)->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->decimal('temperature', 4, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 2)->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique('patient_id');
            $table->index(['tenant_id', 'patient_id']);
        });

        //
        // 9. Consent templates + consents.
        //
        Schema::create('consent_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('body');
            $table->string('treatment_type', 120)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'active']);
        });

        Schema::create('consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consent_template_id')->nullable()
                ->constrained('consent_templates')->nullOnDelete();

            $table->string('title');
            $table->longText('body');

            $table->longText('signature_image')->nullable();
            $table->string('signed_by_name', 160);
            $table->timestamp('signed_at');

            $table->foreignId('captured_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id', 'signed_at']);
        });

        //
        // 10. Treatments + discounts.
        //
        Schema::create('treatments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('code', 32)->nullable();
            $table->string('name');
            $table->string('category', 60)->nullable();
            $table->text('description')->nullable();

            $table->decimal('base_price', 12, 2);
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->decimal('commission_percent', 5, 2)->nullable();

            $table->unsignedSmallInteger('periodicity_days')->nullable();
            $table->string('recall_label', 120)->nullable();

            $table->foreignId('requires_consent_template_id')->nullable()
                ->constrained('consent_templates')->nullOnDelete();

            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
            $table->index(['tenant_id', 'category']);
            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('discounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->enum('type', ['percent', 'amount']);
            $table->decimal('value', 12, 2);
            $table->enum('scope', ['global', 'treatment'])->default('global');

            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();

            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
        });

        //
        // 11. Specialists (catálogo independiente de users).
        //
        Schema::create('specialists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('specialty', 120)->nullable();
            $table->string('cedula_profesional', 32)->nullable();
            $table->decimal('default_commission_percent', 5, 2)->nullable();
            $table->text('bio')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'active']);
            $table->index(['tenant_id', 'name']);
        });

        //
        // 12. Override de comisión por especialista para un tratamiento.
        //     FINAL: usa specialist_id, NO user_id.
        //
        Schema::create('treatment_specialist_commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('specialists')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained()->cascadeOnDelete();
            $table->decimal('commission_percent', 5, 2);
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'specialist_id', 'treatment_id'],
                'tsc_tenant_specialist_treatment_unique',
            );
            $table->index(['tenant_id', 'specialist_id'], 'tsc_tenant_specialist_idx');
        });

        //
        // 13. Cash sessions — global por tenant, multi-método, con closed_by_user_id.
        //
        Schema::create('cash_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('closed_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();

            // Efectivo
            $table->decimal('opening_amount', 12, 2)->default(0);
            $table->decimal('closing_amount', 12, 2)->nullable();
            $table->decimal('expected_cash', 12, 2)->nullable();
            $table->decimal('difference', 12, 2)->nullable();

            // Tarjeta
            $table->decimal('card_counted', 12, 2)->nullable();
            $table->decimal('card_expected', 12, 2)->nullable();
            $table->decimal('card_difference', 12, 2)->nullable();

            // Transferencia
            $table->decimal('transfer_counted', 12, 2)->nullable();
            $table->decimal('transfer_expected', 12, 2)->nullable();
            $table->decimal('transfer_difference', 12, 2)->nullable();

            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('notes')->nullable();
            $table->text('close_notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'user_id', 'opened_at']);
            $table->index(['tenant_id', 'closed_by_user_id']);
        });

        //
        // 14. Tooth states (odontograma).
        //
        Schema::create('tooth_states', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

            $table->unsignedSmallInteger('tooth_number');
            $table->enum('dentition_type', ['permanent', 'deciduous'])->default('permanent');

            $table->string('whole_state', 32)->nullable();
            $table->json('faces')->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('updated_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['tenant_id', 'patient_id', 'tooth_number'], 'ts_tenant_patient_tooth_uq');
            $table->index(['tenant_id', 'patient_id'], 'ts_tenant_patient_idx');
        });

        //
        // 15. Appointments — usa specialist_id apuntando a specialists.
        //
        Schema::create('appointments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('specialists')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->text('notes')->nullable();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->string('room', 60)->nullable();
            $table->enum('status', [
                'scheduled',
                'confirmed',
                'arrived',
                'in_room',
                'completed',
                'no_show',
                'cancelled',
            ])->default('scheduled');

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'specialist_id'], 'appointments_tenant_specialist_idx');
        });

        //
        // 16. Prescriptions — usa specialist_id.
        //
        Schema::create('prescriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('specialists')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('code', 32)->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('issued_at');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id', 'issued_at'], 'rx_tenant_patient_idx');
            $table->index(['tenant_id', 'specialist_id'], 'prescriptions_tenant_specialist_idx');
        });

        Schema::create('prescription_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();

            $table->string('medication');
            $table->string('presentation')->nullable();
            $table->string('dosage');
            $table->string('route', 60)->nullable();
            $table->string('frequency');
            $table->string('duration');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'prescription_id'], 'rxi_tenant_rx_idx');
        });

        Schema::create('prescription_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('category', 120)->nullable();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active'], 'rxt_tenant_active_idx');
            $table->index(['tenant_id', 'name'], 'rxt_tenant_name_idx');
        });

        Schema::create('prescription_template_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_template_id')->constrained()->cascadeOnDelete();

            $table->string('medication');
            $table->string('presentation')->nullable();
            $table->string('dosage');
            $table->string('route', 60)->nullable();
            $table->string('frequency');
            $table->string('duration');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'prescription_template_id'], 'rxti_tenant_rxt_idx');
        });

        //
        // 17. Membership plans + treatments pivot.
        //
        Schema::create('membership_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('annual_price', 12, 2);
            $table->unsignedSmallInteger('valid_months')->default(12);

            $table->decimal('default_discount_percent', 5, 2)->default(0);

            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
        });

        Schema::create('membership_plan_treatments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('membership_plan_id')->constrained('membership_plans')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();

            $table->decimal('discount_percent', 5, 2)->nullable();
            $table->unsignedSmallInteger('annual_quota')->nullable();

            $table->timestamps();

            $table->unique(['membership_plan_id', 'treatment_id'], 'mpt_plan_treatment_unique');
            $table->index(['tenant_id', 'treatment_id']);
        });

        //
        // 18. Labs + lab_orders. lab_orders incluye lab_id FK.
        //
        Schema::create('labs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('lab_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->foreignId('lab_id')->nullable()
                ->constrained('labs')->nullOnDelete();
            $table->foreignId('dentist_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('lab_name');
            $table->string('work_type', 120)->nullable();
            $table->text('specifications')->nullable();

            $table->date('sent_on')->nullable();
            $table->date('due_on')->nullable();
            $table->date('received_on')->nullable();
            $table->date('delivered_to_patient_on')->nullable();

            $table->decimal('cost', 12, 2)->default(0);

            $table->string('status', 16)->default('pending');

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'due_on']);
        });

        //
        // 19. Cash expenses.
        //
        Schema::create('cash_expenses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->constrained('cash_sessions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();

            $table->string('category', 24);
            $table->string('description');

            $table->string('method', 16)->default('cash');
            $table->decimal('amount', 12, 2);

            $table->string('reference', 120)->nullable();
            $table->foreignId('related_lab_order_id')->nullable()
                ->constrained('lab_orders')->nullOnDelete();

            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'cash_session_id']);
            $table->index(['tenant_id', 'paid_at']);
        });

        //
        // 20. Commission payments — usa specialist_id.
        //
        Schema::create('commission_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('specialists')->restrictOnDelete();

            $table->dateTime('paid_at');
            $table->decimal('amount', 12, 2);
            $table->string('method', 16); // cash | card | transfer
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('cash_session_id')->nullable()
                ->constrained('cash_sessions')->nullOnDelete();
            $table->foreignId('cash_expense_id')->nullable()
                ->constrained('cash_expenses')->nullOnDelete();

            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'specialist_id'], 'commission_payments_tenant_specialist_idx');
        });

        //
        // 21. Charges + charge_items (usa specialist_id + commission_payment_id) + charge_payments.
        //
        Schema::create('charges', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('code', 32)->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('paid_total', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);

            $table->enum('status', ['pending', 'partial', 'paid', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('charge_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->nullable()
                ->constrained('specialists')->nullOnDelete();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();

            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->string('treatment_name');
            $table->string('treatment_code', 32)->nullable();

            $table->string('specialist_name')->nullable();

            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);

            $table->foreignId('discount_id')->nullable()
                ->constrained('discounts')->nullOnDelete();
            $table->decimal('discount_amount', 12, 2)->default(0);

            $table->decimal('line_total', 12, 2);

            $table->decimal('commission_percent', 5, 2)->nullable();
            $table->decimal('commission_amount', 12, 2)->default(0);

            $table->foreignId('commission_payment_id')->nullable()
                ->constrained('commission_payments')->nullOnDelete();

            $table->timestamps();

            $table->index(['tenant_id', 'charge_id']);
            $table->index(['tenant_id', 'specialist_id'], 'charge_items_tenant_specialist_idx');
            $table->index(
                ['tenant_id', 'specialist_id', 'commission_payment_id'],
                'charge_items_commission_idx',
            );
        });

        Schema::create('charge_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->enum('method', ['cash', 'card', 'transfer']);
            $table->decimal('amount', 12, 2);
            $table->timestamp('paid_at');
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'cash_session_id']);
            $table->index(['tenant_id', 'charge_id']);
            $table->index(['tenant_id', 'paid_at']);
        });

        //
        // 22. Memberships (FK a charges).
        //
        Schema::create('memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained('membership_plans')->restrictOnDelete();

            $table->date('starts_on');
            $table->date('ends_on');

            $table->string('status', 16)->default('active');

            $table->decimal('price_paid', 12, 2);
            $table->foreignId('charge_id')->nullable()->constrained('charges')->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id', 'status']);
            $table->index(['tenant_id', 'ends_on']);
        });

        //
        // 23. Recalls (FK a charges + appointments).
        //
        Schema::create('recalls', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();

            $table->date('due_on');

            $table->string('status', 16)->default('pending');

            $table->foreignId('source_charge_id')->nullable()
                ->constrained('charges')->nullOnDelete();

            $table->foreignId('scheduled_appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status', 'due_on']);
            $table->index(['tenant_id', 'patient_id']);
        });

        //
        // 24. Agenda blocks — usa specialist_id.
        //
        Schema::create('agenda_blocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_id')->nullable()
                ->constrained('specialists')->cascadeOnDelete();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->boolean('all_day')->default(false);

            $table->string('title');
            $table->text('notes')->nullable();

            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'specialist_id'], 'agenda_blocks_tenant_specialist_idx');
        });
    }

    public function down(): void
    {
        // Orden inverso de dependencias.
        Schema::dropIfExists('agenda_blocks');
        Schema::dropIfExists('recalls');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('charge_payments');
        Schema::dropIfExists('charge_items');
        Schema::dropIfExists('charges');
        Schema::dropIfExists('commission_payments');
        Schema::dropIfExists('cash_expenses');
        Schema::dropIfExists('lab_orders');
        Schema::dropIfExists('labs');
        Schema::dropIfExists('membership_plan_treatments');
        Schema::dropIfExists('membership_plans');
        Schema::dropIfExists('prescription_template_items');
        Schema::dropIfExists('prescription_templates');
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('tooth_states');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('treatment_specialist_commissions');
        Schema::dropIfExists('specialists');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('treatments');
        Schema::dropIfExists('consents');
        Schema::dropIfExists('consent_templates');
        Schema::dropIfExists('medical_histories');
        Schema::dropIfExists('patients');

        $auditsTable = config('audit.drivers.database.table', 'audits');
        Schema::dropIfExists($auditsTable);

        $tableNames = config('permission.table_names');
        if (! empty($tableNames)) {
            Schema::dropIfExists($tableNames['role_has_permissions']);
            Schema::dropIfExists($tableNames['model_has_roles']);
            Schema::dropIfExists($tableNames['model_has_permissions']);
            Schema::dropIfExists($tableNames['roles']);
            Schema::dropIfExists($tableNames['permissions']);
        }

        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('tenants');
    }
};
