<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Resolución de tenant
    |--------------------------------------------------------------------------
    |
    | El middleware ResolveTenant resuelve el tenant activo por request en este
    | orden: header explícito → subdominio → tenant por defecto.
    |
    | IMPORTANTE (fase single-tenant): mientras `central_domains` esté vacío y
    | no se mande el header, SIEMPRE se resuelve `default_tenant_id`. Esto deja
    | el comportamiento actual de producción intacto. La resolución por
    | subdominio solo se activa al configurar `central_domains` para el SaaS.
    |
    */

    // Header que la app móvil / API usan para indicar la clínica (por slug).
    'header' => env('TENANCY_HEADER', 'X-Tenant'),

    // Tenant que se usa cuando no hay header ni subdominio de tenant. En la
    // fase actual (un solo cliente) es la clínica piloto, id = 1.
    'default_tenant_id' => (int) env('TENANCY_DEFAULT_TENANT_ID', 1),

    // Dominios "centrales" del SaaS (ej. "ciodent.mx"). Un host como
    // "clinica-x.ciodent.mx" resuelve el tenant por el subdominio "clinica-x".
    // Vacío = resolución por subdominio DESACTIVADA (comportamiento actual).
    'central_domains' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('TENANCY_CENTRAL_DOMAINS', '')),
    ))),

    // Subdominios que NO son tenants (infra/marketing). Caen al default.
    'reserved_subdomains' => ['www', 'app', 'api', 'admin', 'mail', 'static', 'assets', 'cdn'],
];
