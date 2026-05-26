<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class ToothState extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\ToothStateFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    public const PERMANENT_TEETH = [
        11, 12, 13, 14, 15, 16, 17, 18,
        21, 22, 23, 24, 25, 26, 27, 28,
        31, 32, 33, 34, 35, 36, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48,
    ];

    public const FACE_KEYS = ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'];

    public const FACE_STATES = ['healthy', 'caries', 'restored', 'sealant', 'defective'];

    public const WHOLE_STATES = [
        'absent',
        'crown',
        'endodontics',
        'implant',
        'fracture',
        'extraction_indicated',
        'prosthesis',
    ];

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'tooth_number',
        'dentition_type',
        'whole_state',
        'faces',
        'notes',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'faces' => 'array',
            'tooth_number' => 'integer',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    /** @return array<string, string> */
    public static function defaultFaces(): array
    {
        $out = [];
        foreach (self::FACE_KEYS as $k) {
            $out[$k] = 'healthy';
        }

        return $out;
    }
}
