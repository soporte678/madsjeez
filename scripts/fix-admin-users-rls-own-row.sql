-- Permite que un usuario autenticado lea SU fila en admin_users (login / cliente Supabase).
-- Sin esto, la política "Admins can view admin_users" es circular: para ver la tabla
-- ya tenías que ser admin visibile en la misma tabla.
-- Ejecutar una vez en SQL Editor de Supabase (proyecto del marketplace).

DROP POLICY IF EXISTS "Admin users read own row for auth" ON public.admin_users;

CREATE POLICY "Admin users read own row for auth"
  ON public.admin_users
  FOR SELECT
  USING (user_id = auth.uid() AND is_active = true);
