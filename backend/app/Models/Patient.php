<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Patient extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\PatientFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'marital_status',
        'curp',
        'rfc',
        'email',
        'phone',
        'mobile_phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_phone',
        'occupation',
        'referred_by',
        'notes',
        'odontogram_diagnosis',
        'active',
        'is_first_visit',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'active' => 'boolean',
            'is_first_visit' => 'boolean',
        ];
    }

    /**
     * True cuando los campos mínimos del expediente NOM-004 están llenos
     * (fecha de nacimiento + género). Se usa para limpiar `is_first_visit`
     * automáticamente al editar.
     */
    public function hasMinimumClinicalRecord(): bool
    {
        return ! empty($this->date_of_birth) && ! empty($this->gender);
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim($this->first_name.' '.$this->last_name));
    }

    public function medicalHistory(): HasOne
    {
        return $this->hasOne(MedicalHistory::class);
    }

    /** Acceso del paciente a la app móvil (existe solo si fue invitado). */
    public function account(): HasOne
    {
        return $this->hasOne(PatientAccount::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    public function credits(): HasMany
    {
        return $this->hasMany(PatientCredit::class);
    }

    /**
     * Saldo a favor disponible. Suma todos los movimientos de crédito —
     * positivos (entradas) menos negativos (consumos).
     */
    public function creditBalance(): float
    {
        return round((float) $this->credits()->sum('amount'), 2);
    }
}
