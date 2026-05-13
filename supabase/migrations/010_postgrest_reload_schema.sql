-- Tras ALTER en tablas expuestas por PostgREST, disparar recarga del schema cache.
-- Útil si la API devuelve PGRST204 ("column ... not found in the schema cache") pese a que la columna exista en Postgres.
NOTIFY pgrst, 'reload schema';
