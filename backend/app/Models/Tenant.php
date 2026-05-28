<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    /** @use HasFactory<\Database\Factories\TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
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
