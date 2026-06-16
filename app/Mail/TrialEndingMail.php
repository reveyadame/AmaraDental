<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Aviso de que el periodo de prueba está por terminar. */
class TrialEndingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tenant $tenant,
        public string $loginUrl,
        public string $trialEndsAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu prueba de Amara Dental termina pronto');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.trial-ending');
    }
}
