-- DropIndex: allow duplicate category names across parent/child categories
-- (e.g. "Herramientas" exists as both a parent category and a child of "Construcción")
DROP INDEX IF EXISTS "categories_name_key";
