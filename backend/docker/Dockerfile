FROM php:8.3-cli-alpine

# Dependencias del sistema y de extensiones PHP
RUN apk add --no-cache \
        git \
        bash \
        icu-dev \
        oniguruma-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        zlib-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        bcmath \
        intl \
        zip \
        gd \
        exif \
        opcache \
    && apk del $PHPIZE_DEPS \
    && rm -rf /var/cache/apk/*

# Composer desde imagen oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Overrides PHP — payloads más grandes (logo, firmas, etc.)
COPY php.ini /usr/local/etc/php/conf.d/zz-overrides.ini

WORKDIR /var/www/html

# La app se monta como volumen en compose, no se copia aquí (dev workflow).
EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
