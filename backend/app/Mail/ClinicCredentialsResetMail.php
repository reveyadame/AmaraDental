<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Reenvío de credenciales al admin de una clínica cuando un super-admin
 * regenera su contraseña desde el panel de plataforma.
 */
class ClinicCredentialsResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tenant $tenant,
        public string $adminEmail,
        public string $password,
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu nueva contraseña — Amara Dental');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.clinic-credentials-reset');
    }
}
