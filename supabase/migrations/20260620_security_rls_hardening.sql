-- =============================================================================
-- Security RLS Hardening Migration
-- Fixes CRIT-1 (73 tables without RLS) and CRIT-2 (public.users readable by anon)
--
-- Strategy:
--   - The Next.js app accesses Postgres through Prisma + Supabase service_role.
--     service_role bypasses RLS, so enabling RLS does NOT break the app.
--   - We enable RLS everywhere and add owner-scoped policies only on tables
--     that may legitimately be read by anon/authenticated keys.
--   - Sensitive tables (admin_*, payments, oauth, jarvis_*, whatsapp_*, etc.)
--     get RLS ON with NO policies => only service_role can access.
--   - Catalog tables that need public read keep a scoped public SELECT.
--   - NextAuth tables (accounts, sessions): RLS ON, no anon policy. NextAuth
--     server adapter uses Prisma + service_role; auth.uid() is null for our
--     stack so a policy keyed on auth.uid()::text would always fail.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CRIT-2: Replace public.users "USING (true)" policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read users" ON public.users;

-- Owner-only SELECT (works if a Supabase-auth JWT is ever attached)
CREATE POLICY "users_select_self"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

-- -----------------------------------------------------------------------------
-- Catalog tables: public read is legitimate, narrow it to active rows.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "products_public_read_active"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- categories already has "Allow public read categories" USING(true).
-- Categories are a non-sensitive lookup table; we leave the existing policy
-- in place rather than re-issue another USING(true) here.

-- -----------------------------------------------------------------------------
-- Enable RLS on every currently-unprotected table.
-- -----------------------------------------------------------------------------
ALTER TABLE public.accounts                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_history               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madslider_levels                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs                             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_collaborator_invites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_collaborators             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_zipnova_oauth             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_oauth_used_nonces             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_ad_campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_ad_events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_visits                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_drivers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_shipments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_authorized_recipients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_delivery_attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_attempt_photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_delivery_proofs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_audit_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_rate_config                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_driver_earnings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_support_tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_driver_blocks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_collaborator_accesses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_shipping_options           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_zones                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_driver_settlements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_bot_configs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bot_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_human_handoffs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sync_jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_closer_decisions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_winning_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_message_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_reports                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_findings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_agent_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_health_checks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_voice_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvis_ai_logs                   ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Owner-scoped policies for tables that may be queried with a Supabase-auth
-- JWT (auth.uid() present). All comparisons cast to text because user ids in
-- this schema are stored as text (NextAuth + cuid).
-- -----------------------------------------------------------------------------

-- NextAuth: user can read/refresh own session and account links
CREATE POLICY "accounts_self" ON public.accounts
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "sessions_self" ON public.sessions
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Notifications
CREATE POLICY "notifications_self" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Subscriptions
CREATE POLICY "subscriptions_self" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Carts / favorites
CREATE POLICY "carts_self" ON public.carts
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "favorites_self" ON public.favorites
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Support tickets
CREATE POLICY "support_tickets_self" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Reputation history (user owns own)
CREATE POLICY "reputation_history_self" ON public.reputation_history
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Claims: buyer or seller party
CREATE POLICY "claims_party" ON public.claims
  FOR SELECT TO authenticated
  USING (auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);

-- Questions: buyer who asked
CREATE POLICY "questions_buyer" ON public.questions
  FOR SELECT TO authenticated
  USING (auth.uid()::text = buyer_id);

-- Campaigns / coupons: owning seller
CREATE POLICY "campaigns_owner" ON public.campaigns
  FOR ALL TO authenticated
  USING (auth.uid()::text = seller_id)
  WITH CHECK (auth.uid()::text = seller_id);

CREATE POLICY "coupons_owner" ON public.coupons
  FOR ALL TO authenticated
  USING (auth.uid()::text = seller_id)
  WITH CHECK (auth.uid()::text = seller_id);

-- WhatsApp data (per seller)
CREATE POLICY "whatsapp_sessions_owner" ON public.whatsapp_sessions
  FOR SELECT TO authenticated
  USING (auth.uid()::text = seller_id);

CREATE POLICY "whatsapp_leads_owner" ON public.whatsapp_leads
  FOR SELECT TO authenticated
  USING (auth.uid()::text = seller_id);

CREATE POLICY "whatsapp_conversations_owner" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (auth.uid()::text = seller_id);

-- Flash drivers: own row
CREATE POLICY "flash_drivers_self" ON public.flash_drivers
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "flash_shipments_driver" ON public.flash_shipments
  FOR SELECT TO authenticated
  USING (auth.uid()::text = driver_id);

-- OAuth: own row
CREATE POLICY "seller_zipnova_oauth_self" ON public.seller_zipnova_oauth
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- -----------------------------------------------------------------------------
-- Intentionally NO policies (service_role-only access):
--   admin_users, admin_roles, admin_sessions, payments, order_items, orders' children,
--   shipments, shipment_events, claim_messages, order_messages, support_messages,
--   product_images, product_attributes, product_variations (writes),
--   campaign_products, madslider_levels, _prisma_migrations,
--   site_config, faqs, seller_collaborator_invites, seller_collaborators,
--   mp_oauth_used_nonces, internal_ad_campaigns, internal_ad_events,
--   web_visits, all flash_* internal tables, all whatsapp_* internal tables
--   (messages/events/handoffs/automations/campaigns/sync/closer/winning),
--   ai_message_logs, all jarvis_*, seller_bot_configs.
-- These are reachable only through Next.js API routes that use service_role.
-- =============================================================================
