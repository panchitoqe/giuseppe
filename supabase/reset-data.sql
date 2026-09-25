-- Ejecutar una sola vez para iniciar el proyecto sin pedidos existentes.
truncate table public.orders restart identity;
