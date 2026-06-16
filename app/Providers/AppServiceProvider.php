<?php

namespace App\Providers;

use App\Enums\Role;
use App\Listeners\SendPaymentFailedNotification;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Admin pasa cualquier autorización. Esto cubre Policies (`authorize`),
        // `can()` y `@can` en Blade. Otros roles deben tener permisos explícitos.
        Gate::before(function (User $user, string $ability) {
            return $user->hasRole(Role::Admin->value) ? true : null;
        });

        // El billable de Cashier es la clínica (Tenant), no User: la clínica le
        // paga la suscripción a Amara Dental.
        Cashier::useCustomerModel(Tenant::class);

        // Aviso de pago fallido al admin de la clínica.
        Event::listen(WebhookReceived::class, SendPaymentFailedNotification::class);
    }
}
