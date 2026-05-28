<?php

declare(strict_types=1);

namespace App\Http\Requests\Patients;

use App\Models\ToothState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEndodonticRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La autorización fina (updateClinical) la resuelve el controlador.
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $testResponses = ['not_done', 'normal', 'no_response', 'lingering', 'exaggerated'];
        $pp = ['not_done', 'negative', 'positive'];

        return [
            'tooth_number' => ['required', 'integer', Rule::in(ToothState::PERMANENT_TEETH)],
            'performed_on' => ['nullable', 'date'],
            'chief_complaint' => ['nullable', 'string', 'max:2000'],

            'pulpal_diagnosis' => ['nullable', Rule::in([
                'normal',
                'reversible_pulpitis',
                'symptomatic_irreversible_pulpitis',
                'asymptomatic_irreversible_pulpitis',
                'pulp_necrosis',
                'previously_treated',
                'previously_initiated',
            ])],
            'periapical_diagnosis' => ['nullable', Rule::in([
                'normal',
                'symptomatic_apical_periodontitis',
                'asymptomatic_apical_periodontitis',
                'acute_apical_abscess',
                'chronic_apical_abscess',
                'condensing_osteitis',
            ])],

            'cold_test' => ['nullable', Rule::in($testResponses)],
            'heat_test' => ['nullable', Rule::in($testResponses)],
            'electric_test' => ['nullable', Rule::in($testResponses)],
            'percussion' => ['nullable', Rule::in($pp)],
            'palpation' => ['nullable', Rule::in($pp)],
            'mobility' => ['nullable', Rule::in(['0', '1', '2', '3'])],
            'radiographic_findings' => ['nullable', 'string', 'max:2000'],

            'canals_count' => ['nullable', 'integer', 'min:0', 'max:8'],
            'working_length' => ['nullable', 'string', 'max:255'],
            'irrigation' => ['nullable', 'string', 'max:255'],
            'intracanal_medication' => ['nullable', 'string', 'max:255'],
            'obturation_technique' => ['nullable', 'string', 'max:120'],
            'sealer' => ['nullable', 'string', 'max:120'],
            'sessions' => ['nullable', 'integer', 'min:0', 'max:20'],
            'prognosis' => ['nullable', Rule::in(['favorable', 'questionable', 'unfavorable'])],

            'treatment_plan' => ['nullable', 'string', 'max:2000'],
            'treatment_log' => ['nullable', 'array'],
            'treatment_log.*.date' => ['required', 'date'],
            'treatment_log.*.description' => ['required', 'string', 'max:500'],
            'specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
        ];
    }
}
