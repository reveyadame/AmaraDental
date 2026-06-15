<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

/**
 * Acceso de un paciente a la app móvil. Separado del registro clínico
 * `Patient` para no mezclar auth con el expediente. Emite tokens Sanctum
 * (Bearer) — es el "tokenable" del lado paciente, análogo a User del staff.
 */
class PatientAccount extends Model
{
    /** @use HasFactory<\Database\Factories\PatientAccountFactory> */
    use BelongsToTenant, HasApiTokens, HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_BLOCKED = 'blocked';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'identifier',
        'channel',
        'status',
        'last_login_at',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function loginCodes(): HasMany
    {
        return $this->hasMany(PatientLoginCode::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isBlocked(): bool
    {
        return $this->status === self::STATUS_BLOCKED;
    }
}
