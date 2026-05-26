<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\AgendaBlock;
use App\Models\Appointment;
use Carbon\Carbon;

/**
 * Verifica que un rango de cita no choque con:
 * - Bloqueos de agenda (globales o del mismo especialista).
 * - Otras citas activas del mismo especialista (no canceladas).
 */
class AppointmentAvailability
{
    public static function findConflict(
        int $specialistId,
        string|Carbon $startsAt,
        string|Carbon $endsAt,
        ?int $ignoreAppointmentId = null,
    ): ?string {
        $start = $startsAt instanceof Carbon
            ? $startsAt
            : Carbon::parse($startsAt)->setTimezone(config('app.timezone'));
        $end = $endsAt instanceof Carbon
            ? $endsAt
            : Carbon::parse($endsAt)->setTimezone(config('app.timezone'));

        // 1) Bloqueos: globales (specialist_id IS NULL) o del mismo especialista.
        $block = AgendaBlock::query()
            ->where(function ($q) use ($specialistId): void {
                $q->whereNull('specialist_id')
                  ->orWhere('specialist_id', $specialistId);
            })
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->first();

        if ($block) {
            $scope = $block->specialist_id ? 'este especialista' : 'la clínica';
            return "La agenda está cerrada para {$scope} en ese horario: «{$block->title}».";
        }

        // 2) Citas activas del mismo especialista.
        $clash = Appointment::query()
            ->where('specialist_id', $specialistId)
            ->whereNotIn('status', ['cancelled'])
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->when($ignoreAppointmentId, fn ($q) => $q->where('id', '!=', $ignoreAppointmentId))
            ->with('patient')
            ->first();

        if ($clash) {
            $when = $clash->starts_at->format('H:i').'–'.$clash->ends_at->format('H:i');
            $patient = $clash->patient?->full_name ?? 'otro paciente';
            return "El especialista ya tiene una cita ({$when}) con {$patient}.";
        }

        return null;
    }
}
