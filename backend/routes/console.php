<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Avisos de fin de prueba (requiere cron `schedule:run` en el servidor).
Schedule::command('billing:trial-reminders')->dailyAt('09:00');
