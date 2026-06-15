<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\PatientAccount;
use App\Models\PatientLoginCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Códigos OTP del portal de pacientes: emisión (con envío por email) y
 * verificación. El código se guarda hasheado y es de un solo uso.
 */
final class PatientOtp
{
    public const CODE_TTL_MINUTES = 10;

    /**
     * Genera un código nuevo para la cuenta, invalida los previos y lo envía
     * por el canal del paciente (hoy email).
     */
    public static function issue(PatientAccount $account): void
    {
        // Invalida cualquier código vigente anterior.
        PatientLoginCode::query()
            ->where('patient_account_id', $account->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PatientLoginCode::query()->create([
            'tenant_id' => $account->tenant_id,
            'patient_account_id' => $account->id,
            'identifier' => $account->identifier,
            'code_hash' => Hash::make($code),
            'channel' => $account->channel,
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
        ]);

        self::send($account, $code);
    }

    /**
     * Verifica el código contra el último vigente de la cuenta. Consume el
     * código si es correcto. Devuelve true solo en éxito.
     */
    public static function verify(PatientAccount $account, string $code): bool
    {
        /** @var PatientLoginCode|null $record */
        $record = PatientLoginCode::query()
            ->where('patient_account_id', $account->id)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if ($record === null || ! $record->isRedeemable()) {
            return false;
        }

        // Cuenta el intento ANTES de comparar (limita fuerza bruta).
        $record->increment('attempts');

        if (! Hash::check($code, $record->code_hash)) {
            return false;
        }

        $record->update(['consumed_at' => now()]);

        return true;
    }

    private static function send(PatientAccount $account, string $code): void
    {
        $tenant = TenantContext::tenant();
        $brand = $tenant->brand_name ?: $tenant->name;
        $ttl = self::CODE_TTL_MINUTES;

        $html = "<p>Tu código de acceso a <strong>{$brand}</strong> es:</p>"
            ."<p style=\"font-size:28px;font-weight:bold;letter-spacing:4px\">{$code}</p>"
            ."<p>Vence en {$ttl} minutos. Si no solicitaste este acceso, ignora este correo.</p>";

        Mail::html($html, function ($message) use ($account, $brand): void {
            $message->to($account->identifier)->subject("Tu código de acceso — {$brand}");
        });
    }
}
