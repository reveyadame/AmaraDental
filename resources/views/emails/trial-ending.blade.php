<x-mail::message>
# Tu prueba está por terminar ⏳

Hola **{{ $tenant->name }}**,

Tu periodo de prueba gratis de Amara Dental termina el **{{ \Illuminate\Support\Carbon::parse($trialEndsAt)->format('d/m/Y') }}**.

Para no perder el acceso, agrega tu método de pago desde **Configuración → Plan**. El cobro es automático y puedes cambiar o cancelar cuando quieras.

<x-mail::button :url="$loginUrl">
Agregar método de pago
</x-mail::button>

Gracias,<br>
El equipo de **Amara Dental**
</x-mail::message>
