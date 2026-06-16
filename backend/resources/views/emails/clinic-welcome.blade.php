<x-mail::message>
# ¡Bienvenido a Amara Dental! 🦷

Tu clínica **{{ $tenant->name }}** ya está lista.

**Cómo entrar:**

- Acceso: [{{ $loginUrl }}]({{ $loginUrl }})
- Usuario: **{{ $adminEmail }}**
@if($password)
- Contraseña temporal: **{{ $password }}** — te recomendamos cambiarla al entrar.
@endif

@if($planName)
Tu plan es **{{ $planName }}**@if($trialEndsAt), con un periodo de prueba gratis hasta el **{{ \Illuminate\Support\Carbon::parse($trialEndsAt)->format('d/m/Y') }}**@endif. Antes de que termine, agrega tu método de pago desde **Configuración → Plan**.
@endif

<x-mail::button :url="$loginUrl">
Entrar a mi clínica
</x-mail::button>

Si tienes dudas, responde a este correo.

Gracias,<br>
El equipo de **Amara Dental**
</x-mail::message>
