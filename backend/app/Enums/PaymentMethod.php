<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    // `card` se mantiene como código histórico — su significado pasó a ser
    // tarjeta de DÉBITO. Para tarjeta de crédito se agregó `card_credit`.
    case Card = 'card';
    case CardCredit = 'card_credit';
    case Transfer = 'transfer';
    // `credit` = uso del saldo a favor del paciente. No suma a la caja real.
    case Credit = 'credit';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Card => 'Tarjeta de débito',
            self::CardCredit => 'Tarjeta de crédito',
            self::Transfer => 'Transferencia',
            self::Credit => 'Saldo a favor',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $m) => $m->value, self::cases());
    }
}
