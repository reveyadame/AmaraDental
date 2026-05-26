<?php

declare(strict_types=1);

namespace App\Http\Requests\Agenda;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgendaBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('block')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'specialist_id' => ['sometimes', 'nullable', 'integer', 'exists:specialists,id'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'required', 'date', 'after:starts_at'],
            'all_day' => ['sometimes', 'boolean'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
