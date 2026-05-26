import { useMe } from '@/features/auth/hooks'
import type { Permission, Role } from '@/shared/types/api'

/**
 * Catálogo de permisos. Debe coincidir con `App\Support\Permissions` en backend.
 * Para gating fino en el front, NO uses `me.roles.includes(...)` — usa `can(perm)`.
 */
export const PERMISSION_LABEL: Record<Permission, string> = {
  'appointments.manage': 'Gestionar agenda (crear, mover, cambiar estados)',
  'agenda_blocks.manage': 'Cerrar horarios / bloqueos de agenda',
  'patients.read_basic':
    'Buscar y ver datos básicos del paciente (identificación + contacto + saldo)',
  'patients.manage': 'Crear y editar pacientes',
  'patients.delete': 'Eliminar pacientes',
  'clinical.view': 'Ver expediente clínico',
  'clinical.manage': 'Editar expediente clínico (historia, odontograma)',
  'prescriptions.create': 'Emitir recetas',
  'prescriptions.delete': 'Eliminar recetas',
  'catalogs.manage':
    'Gestionar catálogos (tratamientos, especialistas, descuentos, laboratorios, plantillas, planes)',
  'cash.operate': 'Operar caja (abrir, cerrar, cobrar, egresos)',
  'cash.delete_movements': 'Eliminar movimientos de caja por error',
  'charges.create': 'Crear cobros y registrar pagos',
  'charges.cancel': 'Cancelar cobros y pagos',
  'commissions.manage': 'Pagar comisiones a especialistas',
  'memberships.manage': 'Vender y cancelar membresías',
  'labs.manage': 'Órdenes a laboratorio (crear, cambiar estado)',
  'recalls.manage': 'Gestionar recalls preventivos',
  'reports.view': 'Ver reportes financieros',
  'audit.view': 'Ver bitácora del sistema (NOM-024)',
  'users.manage': 'Gestión de usuarios y permisos',
  'branding.manage': 'Configuración y branding de la clínica',
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  agenda: 'Agenda',
  pacientes: 'Pacientes',
  catalogos: 'Catálogos',
  caja: 'Caja',
  pago_comisiones: 'Pago de comisiones',
  membresias: 'Membresías',
  laboratorios: 'Laboratorios',
  recalls: 'Recalls',
  reportes: 'Reportes',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin:
    'Acceso completo. Gestiona usuarios, bitácora, configuración. Único que puede cancelar cobros, eliminar movimientos en caja, recetas o pacientes.',
  agenda: 'Crear y gestionar citas y bloqueos de horario.',
  pacientes:
    'Alta, edición y expediente clínico de pacientes (historia, odontograma, recetas).',
  catalogos:
    'Mantenimiento de catálogos: tratamientos, especialistas, descuentos, laboratorios, plantillas y planes de membresía.',
  caja: 'Abrir y cerrar caja, registrar cobros, pagos y egresos del turno.',
  pago_comisiones: 'Liquidar comisiones a especialistas.',
  membresias: 'Vender y cancelar membresías anuales.',
  laboratorios: 'Crear y dar seguimiento a órdenes a laboratorios dentales.',
  recalls: 'Gestionar recalls preventivos: agendar, descartar.',
  reportes: 'Acceso de solo lectura a reportes financieros.',
}

/** Lista plana de permisos para iterar en UI. */
export const ALL_PERMISSIONS: readonly Permission[] = [
  'appointments.manage',
  'agenda_blocks.manage',
  'patients.read_basic',
  'patients.manage',
  'patients.delete',
  'clinical.view',
  'clinical.manage',
  'prescriptions.create',
  'prescriptions.delete',
  'catalogs.manage',
  'cash.operate',
  'cash.delete_movements',
  'charges.create',
  'charges.cancel',
  'commissions.manage',
  'memberships.manage',
  'labs.manage',
  'recalls.manage',
  'reports.view',
  'audit.view',
  'users.manage',
  'branding.manage',
] as const

export const ALL_ROLES: readonly Role[] = [
  'admin',
  'agenda',
  'pacientes',
  'catalogos',
  'caja',
  'pago_comisiones',
  'membresias',
  'laboratorios',
  'recalls',
  'reportes',
] as const

/**
 * Hook que expone permisos del usuario actual. `can()` regresa true solo si
 * el permiso está en la lista del backend — admin tiene todos los permisos
 * sembrados explícitamente, así que no se necesita bypass aquí.
 *
 * Sin roles → sin permisos → can(...) regresa false para todo.
 */
export function useAuth() {
  const { data: me } = useMe()
  const roles = me?.roles ?? []
  const permissions = me?.permissions ?? []
  const isAdmin = roles.includes('admin')

  const can = (perm: Permission): boolean => permissions.includes(perm)

  const canAny = (...perms: Permission[]): boolean =>
    perms.some((p) => permissions.includes(p))

  const hasRole = (role: Role): boolean => roles.includes(role)

  return { me, roles, permissions, isAdmin, can, canAny, hasRole }
}
