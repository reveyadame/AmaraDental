<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Tests de arquitectura — barrera estática contra fugas cross-tenant.
 *
 * Todo el aislamiento entre tenants depende del Global Scope de `BelongsToTenant`.
 * Dos patrones lo brincan y filtrarían datos entre clínicas:
 *   - `DB::table(...)`        → query builder crudo, sin el scope de Eloquent.
 *   - `withoutGlobalScope(s)` → desactiva explícitamente el filtro de tenant.
 *
 * Este test recorre `app/` y falla si aparecen fuera de la allowlist. No toca
 * la base de datos: solo lee el código fuente. Si necesitas un caso legítimo
 * (infra cross-tenant), agrégalo a la allowlist con su justificación.
 */
final class ArchitectureTest extends TestCase
{
    /** Archivos (basename) autorizados a usar withoutGlobalScope. */
    private const ALLOWED_WITHOUT_SCOPE = [
        // Feed ICS público: resuelve el usuario por token secreto global y
        // re-filtra por $user->tenant_id antes de devolver datos. Ver el
        // controlador para el detalle del re-scope manual.
        'IcsFeedController.php',
        // El trait que DEFINE la tenancy; solo menciona withoutGlobalScope en su
        // docblock para documentar el escape hatch. Es la infra de tenancy misma.
        'BelongsToTenant.php',
        // Dashboard de plataforma: cuenta pacientes/usuarios de TODAS las clínicas
        // a propósito (métrica agregada cross-tenant del super-admin). Solo conteos.
        'StatsController.php',
    ];

    /** Archivos (basename) autorizados a usar DB::table(). */
    private const ALLOWED_DB_TABLE = [
        // Borrado completo de una clínica: purga por tenant_id en cada tabla con
        // las FK desactivadas. Es infraestructura cross-tenant del super-admin;
        // Eloquent (con Global Scope) no puede borrar datos de otro tenant.
        'DeleteTenant.php',
    ];

    public function test_no_raw_db_table_calls_in_app(): void
    {
        $offenders = [];

        foreach ($this->appPhpFiles() as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            if (preg_match('/DB::table\s*\(/', $contents)
                && ! in_array($file->getFilename(), self::ALLOWED_DB_TABLE, true)) {
                $offenders[] = $this->relativePath($file);
            }
        }

        $this->assertSame([], $offenders, sprintf(
            "DB::table() brinca el Global Scope de tenant. Usa un modelo Eloquent.\n".
            "Archivos infractores:\n  - %s",
            implode("\n  - ", $offenders),
        ));
    }

    public function test_no_without_global_scope_in_app(): void
    {
        $offenders = [];

        foreach ($this->appPhpFiles() as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            if (preg_match('/withoutGlobalScope/', $contents)
                && ! in_array($file->getFilename(), self::ALLOWED_WITHOUT_SCOPE, true)) {
                $offenders[] = $this->relativePath($file);
            }
        }

        $this->assertSame([], $offenders, sprintf(
            "withoutGlobalScope desactiva el filtro de tenant. Si es legítimo,\n".
            "agrega el archivo a ALLOWED_WITHOUT_SCOPE con su justificación.\n".
            "Archivos infractores:\n  - %s",
            implode("\n  - ", $offenders),
        ));
    }

    /**
     * @return iterable<SplFileInfo>
     */
    private function appPhpFiles(): iterable
    {
        $appPath = dirname(__DIR__, 2).'/app';
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($appPath, RecursiveDirectoryIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            if ($file->isFile() && $file->getExtension() === 'php') {
                yield $file;
            }
        }
    }

    private function relativePath(SplFileInfo $file): string
    {
        $base = dirname(__DIR__, 2).'/';

        return str_replace($base, '', $file->getPathname());
    }
}
