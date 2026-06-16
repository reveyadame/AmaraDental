<?php

declare(strict_types=1);

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    /*
     * Para que el navegador acepte enviar la cookie de sesión a un origen
     * cruzado (SPA en :5173 → API en :8000) necesitamos explicitar el origen
     * (no se vale '*' cuando supports_credentials=true).
     */
    'allowed_origins' => array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
    ),

    /*
     * En producción, cada clínica vive en un subdominio de amaradental.mx, así
     * que no se pueden listar todos: se usa un patrón regex configurable, ej.
     * CORS_ALLOWED_ORIGIN_PATTERNS=#^https://([a-z0-9-]+\.)?amaradental\.mx$#
     */
    'allowed_origins_patterns' => array_filter(
        explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))
    ),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
