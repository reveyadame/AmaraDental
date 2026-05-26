<?php

declare(strict_types=1);

namespace App\Http\Requests\Patients;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Patient|null $patient */
        $patient = $this->route('patient');

        return $patient && ($this->user()?->can('update', $patient) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'consent_template_id' => ['nullable', 'integer', 'exists:consent_templates,id'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:50000'],
            'signature_image' => [
                'required', 'string',
                'regex:#^data:image/(png|svg\+xml);base64,#',
                'max:2000000',
            ],
            'signed_by_name' => ['required', 'string', 'max:160'],
        ];
    }
}
