<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class CashSession extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\CashSessionFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'closed_by_user_id',
        'opened_at',
        'closed_at',
        'opening_amount',
        'closing_amount',
        'expected_cash',
        'difference',
        'card_counted',
        'card_expected',
        'card_difference',
        'transfer_counted',
        'transfer_expected',
        'transfer_difference',
        'status',
        'notes',
        'close_notes',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => AppTimezoneDateTime::class,
            'closed_at' => AppTimezoneDateTime::class,
            'opening_amount' => 'decimal:2',
            'closing_amount' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'difference' => 'decimal:2',
            'card_counted' => 'decimal:2',
            'card_expected' => 'decimal:2',
            'card_difference' => 'decimal:2',
            'transfer_counted' => 'decimal:2',
            'transfer_expected' => 'decimal:2',
            'transfer_difference' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Quien cerró la caja (puede ser distinto de quien la abrió). */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ChargePayment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(CashExpense::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
