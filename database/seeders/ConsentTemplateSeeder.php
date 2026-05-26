<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ConsentTemplate;
use Illuminate\Database\Seeder;

class ConsentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'title' => 'Consentimiento informado general (NOM-004)',
                'treatment_type' => 'general',
                'body' => <<<'BODY'
Yo, {{paciente}}, declaro que el odontólogo me ha explicado en términos comprensibles la naturaleza del tratamiento propuesto, sus alternativas, beneficios y posibles riesgos. He tenido la oportunidad de hacer preguntas y recibí respuestas satisfactorias.

Autorizo al equipo clínico de {{clinica}} a realizar los procedimientos indicados, así como las maniobras adicionales que resulten necesarias durante el mismo a juicio del profesional.

Entiendo que en odontología no existen garantías absolutas de resultados y que el éxito del tratamiento depende también de mis hábitos y seguimiento.

Firmo de manera libre y voluntaria.
BODY,
            ],
            [
                'title' => 'Consentimiento de endodoncia',
                'treatment_type' => 'endodoncia',
                'body' => <<<'BODY'
Yo, {{paciente}}, doy mi consentimiento para que se me realice tratamiento de endodoncia (tratamiento de conductos) en el órgano dentario indicado por mi dentista.

Se me explicó que el procedimiento consiste en eliminar la pulpa dental afectada, limpiar y sellar los conductos. Conozco los posibles riesgos: dolor postoperatorio temporal, fractura del instrumento, perforación radicular, necesidad de retratamiento o eventual extracción.

Acepto los términos y costos del tratamiento.
BODY,
            ],
            [
                'title' => 'Consentimiento de cirugía / extracción dental',
                'treatment_type' => 'cirugia',
                'body' => <<<'BODY'
Yo, {{paciente}}, autorizo la realización de la extracción dental indicada por el odontólogo.

Se me informó sobre los riesgos asociados: inflamación, dolor, hemorragia, infección, alveolitis, daño a estructuras vecinas (nervios, dientes adyacentes, seno maxilar) y reacciones a anestésicos.

Me comprometo a seguir las indicaciones postoperatorias y a acudir a revisión.
BODY,
            ],
        ];

        foreach ($templates as $t) {
            ConsentTemplate::query()->updateOrCreate(
                ['tenant_id' => 1, 'title' => $t['title']],
                $t + ['tenant_id' => 1, 'active' => true],
            );
        }
    }
}
