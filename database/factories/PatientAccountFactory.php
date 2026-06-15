<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PatientAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientAccount>
 */
class PatientAccountFactory extends Factory
{
    protected $model = PatientAccount::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // tenant_id lo autorrellena BelongsToTenant; patient_id se pasa al crear.
        return [
            'identifier' => fake()->unique()->safeEmail(),
            'channel' => 'email',
            'status' => PatientAccount::STATUS_ACTIVE,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => PatientAccount::STATUS_PENDING]);
    }
}
