<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Genera un feed iCalendar (RFC 5545) con las citas de un especialista.
 *
 * Diseñado para que el dentista lo suscriba desde Google Calendar / Apple
 * Calendar / cualquier cliente compatible. Google refresca el feed cada
 * algunas horas, así que aunque CIO Dent esté caído, el dentista puede ver
 * sus citas desde Gmail.
 */
final class IcsFeedBuilder
{
    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    public static function build(
        User $specialist,
        Tenant $tenant,
        Collection $appointments,
    ): string {
        $calName = sprintf('Agenda · %s · %s', $specialist->name, $tenant->name);

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CIO Dent//Agenda//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:'.self::escape($calName),
            'X-WR-TIMEZONE:'.($tenant->timezone ?? 'America/Mexico_City'),
            'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
            'X-PUBLISHED-TTL:PT30M',
        ];

        $now = self::utc(now()->toDateTimeString());

        foreach ($appointments as $a) {
            /** @var Appointment $a */
            $statusEnum = AppointmentStatus::tryFrom($a->status) ?? AppointmentStatus::Scheduled;

            $patientName = $a->patient?->full_name ?? 'Paciente';
            $treatmentName = $a->treatment?->name ?? ($a->title ?? 'Cita dental');
            $summary = sprintf('%s · %s', $patientName, $treatmentName);

            $description = [];
            $description[] = 'Paciente: '.$patientName;
            if ($a->treatment) $description[] = 'Tratamiento: '.$a->treatment->name;
            $description[] = 'Estado: '.$statusEnum->label();
            if ($a->room) $description[] = 'Consultorio: '.$a->room;
            if ($a->notes) $description[] = 'Notas: '.$a->notes;

            $location = $tenant->address ?? ($tenant->name ?? '');
            $uid = sprintf('appointment-%d-t%d@ciodent', $a->id, $tenant->id);

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:'.$uid;
            $lines[] = 'DTSTAMP:'.$now;
            $lines[] = 'SEQUENCE:'.(int) ($a->updated_at?->getTimestamp() ?? 0);
            $lines[] = 'DTSTART:'.self::utc($a->starts_at->toDateTimeString());
            $lines[] = 'DTEND:'.self::utc($a->ends_at->toDateTimeString());
            $lines[] = 'SUMMARY:'.self::escape($summary);
            $lines[] = 'DESCRIPTION:'.self::escape(implode("\\n", $description));
            if ($location) {
                $lines[] = 'LOCATION:'.self::escape($location);
            }
            $lines[] = 'STATUS:'.$statusEnum->ics();
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        // CRLF line endings per RFC 5545.
        return implode("\r\n", $lines)."\r\n";
    }

    private static function utc(string $datetime): string
    {
        return \Carbon\Carbon::parse($datetime)->setTimezone('UTC')->format('Ymd\THis\Z');
    }

    private static function escape(string $value): string
    {
        $value = str_replace(['\\', "\r\n", "\n", ',', ';'],
            ['\\\\', '\\n', '\\n', '\\,', '\\;'], $value);

        // RFC 5545 line folding @ 75 octets — opcional; la mayoría de clientes lo manejan sin folding.
        return $value;
    }
}
