<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Catálogo central de permisos. Cada permiso representa una acción concreta
 * sobre un módulo. Los roles agrupan permisos por módulo (Agenda, Pacientes,
 * Caja, etc); el rol Administrador trae además las acciones "de superior"
 * (cancelar, eliminar movimientos, recetas, etc) y la gestión del sistema
 * (usuarios, bitácora, configuración).
 *
 * REGLAS:
 *   - Si el usuario no tiene roles, no tiene permisos → no puede hacer nada.
 *   - Acciones destructivas / reversiones quedan solo en Administrador.
 *
 * Nomenclatura: `<modulo>.<accion>`.
 */
final class Permissions
{
    // ─── Agenda ──────────────────────────────────────────────────────────
    public const APPOINTMENTS_MANAGE = 'appointments.manage';
    public const AGENDA_BLOCKS_MANAGE = 'agenda_blocks.manage';

    // ─── Pacientes / Expediente clínico ─────────────────────────────────
    public const PATIENTS_READ_BASIC = 'patients.read_basic'; // identif + contacto + saldo (roles operativos)
    public const PATIENTS_MANAGE = 'patients.manage';
    public const PATIENTS_DELETE = 'patients.delete';            // superior
    public const CLINICAL_VIEW = 'clinical.view';
    public const CLINICAL_MANAGE = 'clinical.manage';
    public const PRESCRIPTIONS_CREATE = 'prescriptions.create';
    public const PRESCRIPTIONS_DELETE = 'prescriptions.delete';  // superior

    // ─── Catálogos (tratamientos, especialistas, descuentos, labs, plantillas, planes membresía) ─
    public const CATALOGS_MANAGE = 'catalogs.manage';

    // ─── Caja / cobros ──────────────────────────────────────────────────
    public const CASH_OPERATE = 'cash.operate';                  // abrir, cerrar, registrar pagos y egresos
    public const CASH_DELETE_MOVEMENTS = 'cash.delete_movements';// superior — eliminar por error
    public const CHARGES_CREATE = 'charges.create';              // crear cobros, abonar pagos
    public const CHARGES_CANCEL = 'charges.cancel';              // superior — cancelar cobros y pagos

    // ─── Comisiones ─────────────────────────────────────────────────────
    public const COMMISSIONS_MANAGE = 'commissions.manage';

    // ─── Membresías de pacientes ────────────────────────────────────────
    public const MEMBERSHIPS_MANAGE = 'memberships.manage';

    // ─── Órdenes a laboratorio ──────────────────────────────────────────
    public const LABS_MANAGE = 'labs.manage';

    // ─── Recalls preventivos ────────────────────────────────────────────
    public const RECALLS_MANAGE = 'recalls.manage';

    // ─── Reportes ───────────────────────────────────────────────────────
    public const REPORTS_VIEW = 'reports.view';

    // ─── Administración del sistema ─────────────────────────────────────
    public const AUDIT_VIEW = 'audit.view';
    public const USERS_MANAGE = 'users.manage';
    public const BRANDING_MANAGE = 'branding.manage';

    /**
     * @return array<int, string>
     */
    public static function all(): array
    {
        return [
            self::APPOINTMENTS_MANAGE,
            self::AGENDA_BLOCKS_MANAGE,
            self::PATIENTS_READ_BASIC,
            self::PATIENTS_MANAGE,
            self::PATIENTS_DELETE,
            self::CLINICAL_VIEW,
            self::CLINICAL_MANAGE,
            self::PRESCRIPTIONS_CREATE,
            self::PRESCRIPTIONS_DELETE,
            self::CATALOGS_MANAGE,
            self::CASH_OPERATE,
            self::CASH_DELETE_MOVEMENTS,
            self::CHARGES_CREATE,
            self::CHARGES_CANCEL,
            self::COMMISSIONS_MANAGE,
            self::MEMBERSHIPS_MANAGE,
            self::LABS_MANAGE,
            self::RECALLS_MANAGE,
            self::REPORTS_VIEW,
            self::AUDIT_VIEW,
            self::USERS_MANAGE,
            self::BRANDING_MANAGE,
        ];
    }

    /**
     * Permisos preasignados a cada rol base.
     *
     * - Administrador: TODO (acciones de superior + administración del sistema).
     * - Roles funcionales: solo el subset de su módulo, sin acciones destructivas.
     *
     * @return array<string, array<int, string>>
     */
    public static function roleMatrix(): array
    {
        return [
            'admin' => self::all(),

            'agenda' => [
                self::APPOINTMENTS_MANAGE,
                self::AGENDA_BLOCKS_MANAGE,
                self::PATIENTS_READ_BASIC,
            ],

            'pacientes' => [
                self::PATIENTS_MANAGE,
                self::CLINICAL_VIEW,
                self::CLINICAL_MANAGE,
                self::PRESCRIPTIONS_CREATE,
            ],

            'catalogos' => [
                self::CATALOGS_MANAGE,
            ],

            'caja' => [
                self::CASH_OPERATE,
                self::CHARGES_CREATE,
                self::PATIENTS_READ_BASIC,
            ],

            'pago_comisiones' => [
                self::COMMISSIONS_MANAGE,
            ],

            'membresias' => [
                self::MEMBERSHIPS_MANAGE,
                self::PATIENTS_READ_BASIC,
            ],

            'laboratorios' => [
                self::LABS_MANAGE,
                self::PATIENTS_READ_BASIC,
            ],

            'recalls' => [
                self::RECALLS_MANAGE,
                self::PATIENTS_READ_BASIC,
            ],

            'reportes' => [
                self::REPORTS_VIEW,
            ],
        ];
    }
}
