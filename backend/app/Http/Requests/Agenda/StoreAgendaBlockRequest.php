<?php

declare(strict_types=1);

namespace App\Http\Requests\Agenda;

use App\Models\AgendaBlock;
use Illuminate\Foundation\Http\FormRequest;

class StoreAgendaBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', AgendaBlock::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'all_day' => ['sometimes', 'boolean'],
            'title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
