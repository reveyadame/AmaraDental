<?php

declare(strict_types=1);

namespace App\Casts;

use Carbon\Carbon;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast para columnas datetime que reciben fechas del frontend en formato ISO
 * con cualquier offset (típicamente UTC con `Z`). Convierte siempre a la TZ
 * de la aplicación antes de guardar en MySQL (cuyas columnas DATETIME no
 * llevan zona horaria), y al leer retorna un Carbon en la TZ del app.
 *
 * Sin este cast, un ISO `2026-05-25T23:00:00Z` (= 17:00 MX) se guardaría
 * literal como `23:00:00`, y al leerse Eloquent lo interpretaría como
 * `23:00 MX`, desplazando 6 horas todas las fechas.
 */
class AppTimezoneDateTime implements CastsAttributes
{
    /** @param array<string, mixed> $attributes */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Carbon
    {
        if ($value === null) {
            return null;
        }
        // MySQL devuelve string `Y-m-d H:i:s`. Lo interpretamos en TZ del app.
        return Carbon::parse($value, config('app.timezone'));
    }

    /** @param array<string, mixed> $attributes */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)
                ->setTimezone(config('app.timezone'))
                ->format('Y-m-d H:i:s');
        }
        // String — puede venir con offset o sin él. Carbon::parse detecta
        // el offset y nosotros lo forzamos a la TZ del app.
        return Carbon::parse($value)
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');
    }
}
