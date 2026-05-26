<?php

declare(strict_types=1);

namespace App\Enums;

enum AppointmentStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case Arrived = 'arrived';
    case InRoom = 'in_room';
    case Completed = 'completed';
    case NoShow = 'no_show';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Programada',
            self::Confirmed => 'Confirmada',
            self::Arrived => 'Paciente llegó',
            self::InRoom => 'En consulta',
            self::Completed => 'Completada',
            self::NoShow => 'No asistió',
            self::Cancelled => 'Cancelada',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $s) => $s->value, self::cases());
    }

    /** ICS STATUS mapping */
    public function ics(): string
    {
        return match ($this) {
            self::Cancelled => 'CANCELLED',
            self::Completed, self::Confirmed, self::Arrived, self::InRoom => 'CONFIRMED',
            default => 'TENTATIVE',
        };
    }
}
