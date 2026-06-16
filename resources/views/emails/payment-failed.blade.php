<x-mail::message>
# No pudimos procesar tu pago ⚠️

Hola **{{ $tenant->name }}**,

Tu último pago de la suscripción de Amara Dental **no se pudo procesar**. Esto suele pasar por fondos insuficientes o una tarjeta vencida.

Para evitar que se suspenda el acceso, actualiza tu método de pago desde **Configuración → Plan**.

<x-mail::button :url="$loginUrl">
Actualizar método de pago
</x-mail::button>

Si crees que es un error, responde a este correo.

Gracias,<br>
El equipo de **Amara Dental**
</x-mail::message>
