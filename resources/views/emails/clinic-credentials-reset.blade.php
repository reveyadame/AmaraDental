<x-mail::message>
# Tu contraseña fue restablecida 🔐

Hola, se generó una **nueva contraseña** para tu acceso a **{{ $tenant->name }}** en Amara Dental.

**Tus datos de acceso:**

- Acceso: [{{ $loginUrl }}]({{ $loginUrl }})
- Usuario: **{{ $adminEmail }}**
- Nueva contraseña: **{{ $password }}**

Por seguridad, te recomendamos cambiarla al entrar.

<x-mail::button :url="$loginUrl">
Entrar a mi clínica
</x-mail::button>

Si no solicitaste este cambio, responde a este correo de inmediato.

Gracias,<br>
El equipo de **Amara Dental**
</x-mail::message>
