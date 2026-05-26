<?php

namespace App\Providers;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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
    }
}
