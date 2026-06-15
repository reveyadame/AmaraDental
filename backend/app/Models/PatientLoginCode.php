<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Código OTP de un solo uso para el login passwordless del paciente.
 * El código se guarda hasheado; nunca en claro.
 */
class PatientLoginCode extends Model
{
    use BelongsToTenant;

    /** Intentos de verificación permitidos antes de invalidar el código. */
    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'tenant_id',
        'patient_account_id',
        'identifier',
        'code_hash',
        'channel',
        'expires_at',
        'consumed_at',
        'attempts',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'attempts' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(PatientAccount::class, 'patient_account_id');
    }

    /** Vigente: no consumido, no expirado y con intentos disponibles. */
    public function isRedeemable(): bool
    {
        return $this->consumed_at === null
            && $this->attempts < self::MAX_ATTEMPTS
            && $this->expires_at->isFuture();
    }

    public function expiresInMinutes(): int
    {
        return (int) ceil(Carbon::now()->diffInMinutes($this->expires_at, false));
    }
}
