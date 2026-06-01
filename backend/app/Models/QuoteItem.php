<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class QuoteItem extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\QuoteItemFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'quote_id',
        'treatment_id',
        'treatment_name',
        'treatment_code',
        'specialist_id',
        'specialist_name',
        'quantity',
        'unit_price',
        'discount_id',
        'discount_amount',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(Specialist::class);
    }
}
