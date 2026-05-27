#!/bin/bash
set -e

# El toolkit ejecuta este script desde la raíz del monorepo.
# El backend de Laravel está en el subdirectorio backend/.
cd "$(dirname "$0")"

composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
