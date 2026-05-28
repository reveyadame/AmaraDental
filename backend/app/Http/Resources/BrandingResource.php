<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Tenant
 */
class BrandingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'brand_name' => $this->brand_name ?? $this->name,
            'logo_url' => $this->logo_url,
            'color_primary' => $this->color_primary,
            'color_primary_foreground' => $this->color_primary_foreground,
            'color_secondary' => $this->color_secondary,
            'color_sidebar' => $this->color_sidebar,
            'sidebar_item_bg' => $this->sidebar_item_bg,
            'sidebar_item_color' => $this->sidebar_item_color,
            'sidebar_hover_bg' => $this->sidebar_hover_bg,
            'sidebar_active_bg' => $this->sidebar_active_bg,
            'sidebar_active_color' => $this->sidebar_active_color,
            'color_header' => $this->color_header,
            'color_accent' => $this->color_accent,
            'razon_social' => $this->razon_social,
            'rfc' => $this->rfc,
            'address' => $this->address,
            'phones' => $this->phones ?? [],
            'cedulas_clinica' => $this->cedulas_clinica ?? [],
            'timezone' => $this->timezone,
            'ticket_width' => $this->ticket_width ?? '80mm',
            'ticket_show_logo' => (bool) ($this->ticket_show_logo ?? true),
            'ticket_show_address' => (bool) ($this->ticket_show_address ?? true),
            'ticket_show_cedulas' => (bool) ($this->ticket_show_cedulas ?? false),
            'ticket_footer_message' => $this->ticket_footer_message,
            'ticket_auto_print' => (bool) ($this->ticket_auto_print ?? false),
            'prescription_paper_size' => $this->prescription_paper_size ?? 'letter',
            'prescription_mode' => $this->prescription_mode ?? 'design',
            'prescription_background_url' => $this->prescription_background_url,
            'prescription_margin_top_mm' => (int) ($this->prescription_margin_top_mm ?? 15),
            'prescription_layout' => $this->prescription_layout ?? 'standard',
            'font_family' => $this->font_family ?? 'inter',
        ];
    }
}
