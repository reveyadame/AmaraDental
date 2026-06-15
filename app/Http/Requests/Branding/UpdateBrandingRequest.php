<?php

declare(strict_types=1);

namespace App\Http\Requests\Branding;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Se gatea por el permiso (no por el rol admin directo) para respetar
        // la matriz rol→permisos. Hoy `branding.manage` es admin-only, pero si
        // mañana se concede a otro rol, esto lo respeta sin tocar el request.
        return $this->user()?->can(Permissions::BRANDING_MANAGE) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'brand_name' => ['sometimes', 'required', 'string', 'max:120'],

            // URL externa o data URI base64 subido desde el navegador.
            // Margen amplio (12 MB) por si llegan imágenes sin redimensionar.
            'logo_url' => ['sometimes', 'nullable', 'string', 'max:12000000'],

            'color_primary' => ['sometimes', 'required', 'string', 'max:64'],
            'color_primary_foreground' => ['sometimes', 'required', 'string', 'max:64'],
            'color_secondary' => ['sometimes', 'required', 'string', 'max:64'],
            'color_sidebar' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sidebar_item_bg' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sidebar_item_color' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sidebar_hover_bg' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sidebar_active_bg' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sidebar_active_color' => ['sometimes', 'nullable', 'string', 'max:64'],
            'color_header' => ['sometimes', 'nullable', 'string', 'max:64'],
            'color_accent' => ['sometimes', 'nullable', 'string', 'max:64'],

            'razon_social' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rfc' => ['sometimes', 'nullable', 'string', 'max:13'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phones' => ['sometimes', 'array'],
            'phones.*' => ['string', 'max:32'],
            'cedulas_clinica' => ['sometimes', 'array'],
            'cedulas_clinica.*' => ['string', 'max:32'],
            'timezone' => ['sometimes', 'required', 'string', 'max:64'],

            'ticket_width' => ['sometimes', 'nullable', 'in:58mm,80mm'],
            'ticket_show_logo' => ['sometimes', 'boolean'],
            'ticket_show_address' => ['sometimes', 'boolean'],
            'ticket_show_cedulas' => ['sometimes', 'boolean'],
            'ticket_footer_message' => ['sometimes', 'nullable', 'string', 'max:500'],
            'ticket_auto_print' => ['sometimes', 'boolean'],

            'prescription_paper_size' => [
                'sometimes', 'nullable',
                'in:letter,letter_landscape,half_letter,half_letter_landscape',
            ],
            'prescription_mode' => ['sometimes', 'nullable', 'in:design,preprinted'],
            'prescription_background_url' => ['sometimes', 'nullable', 'string', 'max:12000000'],
            'prescription_margin_top_mm' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:120'],
            'prescription_layout' => ['sometimes', 'nullable', 'in:standard,compact'],

            'font_family' => [
                'sometimes', 'nullable',
                'in:inter,roboto,open_sans,lato,poppins,montserrat,nunito,'
                    .'source_sans_3,work_sans,plus_jakarta_sans,dm_sans,'
                    .'merriweather,lora,system',
            ],
        ];
    }
}
