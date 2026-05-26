<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Enums\Role;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User|null $target */
        $target = $this->route('user');

        return $target && ($this->user()?->can('update', $target) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users', 'email')
                    ->where('tenant_id', TenantContext::tenantId())
                    ->ignore($target->id),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'max:255'],
            'active' => ['sometimes', 'boolean'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::in(Role::values())],
        ];
    }
}
