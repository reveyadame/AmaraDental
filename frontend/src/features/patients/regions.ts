import type { CountryCode } from '@/shared/types/patient'

export const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: 'MX', label: 'México' },
  { code: 'US', label: 'Estados Unidos' },
]

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  MX: 'México',
  US: 'Estados Unidos',
}

/** Estados/entidades por país. El valor guardado es el nombre del estado. */
export const STATES_BY_COUNTRY: Record<CountryCode, string[]> = {
  MX: [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila',
    'Colima',
    'Durango',
    'Estado de México',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas',
  ],
  US: [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'District of Columbia',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ],
}

/** Detecta el país a partir del nombre de un estado guardado (datos legacy). */
export function inferCountryFromState(
  state: string | null | undefined,
): CountryCode | null {
  if (!state) return null
  for (const code of Object.keys(STATES_BY_COUNTRY) as CountryCode[]) {
    if (STATES_BY_COUNTRY[code].includes(state)) return code
  }
  return null
}
