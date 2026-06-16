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
 * Correo de bienvenida al admin de una clínica recién creada: cómo entrar,
 * credenciales y datos del plan/prueba.
 */
class ClinicWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tenant $tenant,
        public string $adminEmail,
        public ?string $password,
        public string $loginUrl,
        public ?string $planName,
        public ?string $trialEndsAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Bienvenido a Amara Dental — '.$this->tenant->name);
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.clinic-welcome');
    }
}
