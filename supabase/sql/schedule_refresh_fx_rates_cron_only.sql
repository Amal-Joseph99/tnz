SELECT cron.schedule(
  'refresh-fx-rates-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
      LIMIT 1
    ) || '/functions/v1/refresh-fx-rates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      ),
      'apikey', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      )
    ),
    body := '{"source":"pg_cron"}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);
