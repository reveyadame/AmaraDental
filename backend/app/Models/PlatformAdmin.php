<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Administrador de la plataforma (SaaS Amara Dental). Identidad AISLADA: no
 * tiene relación con `users` (staff de clínica) ni con los tenants — opera por
 * encima de todas las clínicas. NO usa BelongsToTenant. Emite tokens Sanctum.
 */
class PlatformAdmin extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\PlatformAdminFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
