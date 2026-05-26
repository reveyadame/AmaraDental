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

class AgendaBlock extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\AgendaBlockFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'specialist_id',
        'starts_at',
        'ends_at',
        'all_day',
        'title',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => AppTimezoneDateTime::class,
            'ends_at' => AppTimezoneDateTime::class,
            'all_day' => 'boolean',
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
}
