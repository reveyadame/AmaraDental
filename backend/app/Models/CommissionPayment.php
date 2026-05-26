<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class CommissionPayment extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\CommissionPaymentFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    /** @return array<int, string> */
    public static function methods(): array
    {
        return ['cash', 'card', 'transfer'];
    }

    protected $fillable = [
        'tenant_id',
        'specialist_id',
        'paid_at',
        'amount',
        'method',
        'reference',
        'notes',
        'cash_session_id',
        'cash_expense_id',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => AppTimezoneDateTime::class,
            'amount' => 'decimal:2',
        ];
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(Specialist::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function cashExpense(): BelongsTo
    {
        return $this->belongsTo(CashExpense::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ChargeItem::class, 'commission_payment_id');
    }
}
