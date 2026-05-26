<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Roles del sistema. Un rol por módulo + Administrador.
 *
 * - Si el usuario no tiene ningún rol → no puede hacer nada (deny-by-default).
 * - Un usuario puede tener varios roles (ej. Caja + Reportes).
 * - El Administrador agrega: usuarios, bitácora, configuración, y todas las
 *   acciones "de superior" (cancelar cobros/pagos, eliminar movimientos de
 *   caja, eliminar recetas, eliminar pacientes).
 */
enum Role: string
{
    case Admin = 'admin';
    case Agenda = 'agenda';
    case Patients = 'pacientes';
    case Catalogs = 'catalogos';
    case Cash = 'caja';
    case CommissionPayments = 'pago_comisiones';
    case Memberships = 'membresias';
    case Labs = 'laboratorios';
    case Recalls = 'recalls';
    case Reports = 'reportes';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Agenda => 'Agenda',
            self::Patients => 'Pacientes',
            self::Catalogs => 'Catálogos',
            self::Cash => 'Caja',
            self::CommissionPayments => 'Pago de comisiones',
            self::Memberships => 'Membresías',
            self::Labs => 'Laboratorios',
            self::Recalls => 'Recalls',
            self::Reports => 'Reportes',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $r) => $r->value, self::cases());
    }
}
