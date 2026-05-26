<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class CashExpense extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\CashExpenseFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    /** @return array<int, string> */
    public static function categories(): array
    {
        return ['lab', 'supplies', 'payroll', 'utilities', 'commission', 'refund', 'other'];
    }

    /** @return array<int, string> */
    public static function methods(): array
    {
        return ['cash', 'card', 'transfer'];
    }

    protected $fillable = [
        'tenant_id',
        'cash_session_id',
        'user_id',
        'category',
        'description',
        'method',
        'amount',
        'reference',
        'related_lab_order_id',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => AppTimezoneDateTime::class,
        ];
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function labOrder(): BelongsTo
    {
        return $this->belongsTo(LabOrder::class, 'related_lab_order_id');
    }
}
