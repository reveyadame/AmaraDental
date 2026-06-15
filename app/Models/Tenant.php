<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tenant extends Model
{
    /** @use HasFactory<\Database\Factories\TenantFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';

    protected $fillable = [
        'name',
        'slug',
        'status',
        'plan_id',
        'brand_name',
        'logo_url',
        'color_primary',
        'color_primary_foreground',
        'color_secondary',
        'color_sidebar',
        'sidebar_item_bg',
        'sidebar_item_color',
        'sidebar_hover_bg',
        'sidebar_active_bg',
        'sidebar_active_color',
        'color_header',
        'color_accent',
        'razon_social',
        'rfc',
        'address',
        'phones',
        'cedulas_clinica',
        'timezone',
        'ticket_width',
        'ticket_show_logo',
        'ticket_show_address',
        'ticket_show_cedulas',
        'ticket_footer_message',
        'ticket_auto_print',
        'prescription_paper_size',
        'prescription_mode',
        'prescription_background_url',
        'prescription_margin_top_mm',
        'prescription_layout',
        'font_family',
    ];

    protected function casts(): array
    {
        return [
            'phones' => 'array',
            'cedulas_clinica' => 'array',
            'ticket_show_logo' => 'boolean',
            'ticket_show_address' => 'boolean',
            'ticket_show_cedulas' => 'boolean',
            'ticket_auto_print' => 'boolean',
        ];
    }

    public function isActive(): bool
    {
        // status puede ser null en tenants creados antes de la columna.
        return ($this->status ?? self::STATUS_ACTIVE) !== self::STATUS_SUSPENDED;
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Límite de pacientes del plan. null = ilimitado (incluye clínicas sin
     * plan asignado, que quedan grandfathered sin restricción).
     */
    public function maxPatients(): ?int
    {
        return $this->plan?->max_patients;
    }

    /** ¿El plan incluye la app de pacientes? Sin plan → sí (grandfathered). */
    public function includesApp(): bool
    {
        return $this->plan ? (bool) $this->plan->includes_app : true;
    }

    /**
     * Branding lo expone el frontend para inyectar el tema.
     */
    protected function branding(): Attribute
    {
        return Attribute::get(fn (): array => [
            'brand_name' => $this->brand_name ?? $this->name,
            'logo_url' => $this->logo_url,
            'color_primary' => $this->color_primary,
            'color_primary_foreground' => $this->color_primary_foreground,
            'color_secondary' => $this->color_secondary,
        ]);
    }
}
