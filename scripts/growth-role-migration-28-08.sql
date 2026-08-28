-- Growth Maker/Checker expansion (28.08.2026): adds `createdBy` to every
-- "standard shape" collection that didn't already have it, and enables
-- versions.drafts on Categories/Representatives/Documents (previously flat,
-- no draft concept). All pre-existing rows in the 3 newly-drafted
-- collections are backfilled to _status='published' so nothing already live
-- silently disappears from the site (their read access is now
-- publishedOrAuthenticated instead of unconditional true).

-- ============================================================
-- PART 1: created_by_id on the 10 collections that already had drafts
-- ============================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['announcements','faq_items','legal_pages','fee_rows','limit_tables','content_blocks','blog_posts','cookie_rows','nav_links','page_meta'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by_id integer', tbl);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = tbl || '_created_by_id_users_id_fk') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL', tbl, tbl || '_created_by_id_users_id_fk');
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (created_by_id)', tbl || '_created_by_idx', tbl);

    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS version_created_by_id integer', '_' || tbl || '_v');
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_' || tbl || '_v_version_created_by_id_users_id_fk') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (version_created_by_id) REFERENCES users(id) ON DELETE SET NULL', '_' || tbl || '_v', '_' || tbl || '_v_version_created_by_id_users_id_fk');
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (version_created_by_id)', '_' || tbl || '_v_version_version_created_by_idx', '_' || tbl || '_v');

    RAISE NOTICE 'created_by eklendi: %', tbl;
  END LOOP;
END $$;

-- ============================================================
-- PART 2: Categories — enable drafts + createdBy
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_categories_status') THEN
    CREATE TYPE enum_categories_status AS ENUM ('draft', 'published');
  END IF;
END $$;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS _status enum_categories_status DEFAULT 'draft'::enum_categories_status;
UPDATE categories SET _status = 'published' WHERE _status IS DISTINCT FROM 'published';
CREATE INDEX IF NOT EXISTS categories__status_idx ON categories(_status);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by_id integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_created_by_id_users_id_fk') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS categories_created_by_idx ON categories(created_by_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__categories_v_version_scope') THEN
    CREATE TYPE enum__categories_v_version_scope AS ENUM ('campaign', 'blog', 'faq');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__categories_v_version_status') THEN
    CREATE TYPE enum__categories_v_version_status AS ENUM ('draft', 'published');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS _categories_v (
  id serial PRIMARY KEY,
  parent_id integer,
  version_scope enum__categories_v_version_scope,
  version_label character varying,
  version_slug character varying,
  version_order numeric,
  version_created_by_id integer,
  version_updated_at timestamp(3) with time zone,
  version_created_at timestamp(3) with time zone,
  version__status enum__categories_v_version_status DEFAULT 'draft'::enum__categories_v_version_status,
  created_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  latest boolean
);

-- ============================================================
-- PART 3: Representatives — enable drafts + createdBy
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_representatives_status') THEN
    CREATE TYPE enum_representatives_status AS ENUM ('draft', 'published');
  END IF;
END $$;
ALTER TABLE representatives ADD COLUMN IF NOT EXISTS _status enum_representatives_status DEFAULT 'draft'::enum_representatives_status;
UPDATE representatives SET _status = 'published' WHERE _status IS DISTINCT FROM 'published';
CREATE INDEX IF NOT EXISTS representatives__status_idx ON representatives(_status);

ALTER TABLE representatives ADD COLUMN IF NOT EXISTS created_by_id integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'representatives_created_by_id_users_id_fk') THEN
    ALTER TABLE representatives ADD CONSTRAINT representatives_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS representatives_created_by_idx ON representatives(created_by_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__representatives_v_version_status') THEN
    CREATE TYPE enum__representatives_v_version_status AS ENUM ('draft', 'published');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS _representatives_v (
  id serial PRIMARY KEY,
  parent_id integer,
  version_business_name character varying,
  version_rep_code character varying,
  version_activity_description character varying,
  version_phone character varying,
  version_mersis_no character varying,
  version_address character varying,
  version_province character varying,
  version_district character varying,
  version_authorized_person character varying,
  version_qr_code_id integer,
  version_created_by_id integer,
  version_updated_at timestamp(3) with time zone,
  version_created_at timestamp(3) with time zone,
  version__status enum__representatives_v_version_status DEFAULT 'draft'::enum__representatives_v_version_status,
  created_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  latest boolean
);

-- ============================================================
-- PART 4: Documents — enable drafts + createdBy
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_documents_status') THEN
    CREATE TYPE enum_documents_status AS ENUM ('draft', 'published');
  END IF;
END $$;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS _status enum_documents_status DEFAULT 'draft'::enum_documents_status;
UPDATE documents SET _status = 'published' WHERE _status IS DISTINCT FROM 'published';
CREATE INDEX IF NOT EXISTS documents__status_idx ON documents(_status);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by_id integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_created_by_id_users_id_fk') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS documents_created_by_idx ON documents(created_by_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__documents_v_version_status') THEN
    CREATE TYPE enum__documents_v_version_status AS ENUM ('draft', 'published');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS _documents_v (
  id serial PRIMARY KEY,
  parent_id integer,
  version_url character varying,
  version_thumbnail_u_r_l character varying,
  version_filename character varying,
  version_mime_type character varying,
  version_filesize numeric,
  version_width numeric,
  version_height numeric,
  version_focal_x numeric,
  version_focal_y numeric,
  version_created_by_id integer,
  version_updated_at timestamp(3) with time zone,
  version_created_at timestamp(3) with time zone,
  version__status enum__documents_v_version_status DEFAULT 'draft'::enum__documents_v_version_status,
  created_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  latest boolean
);

-- ============================================================
-- PART 5: FK + indexes for the 3 new _v tables (reuses the established
-- generic backfill script's exact pattern)
-- ============================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['categories','representatives','documents'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_' || tbl || '_v_parent_id_' || tbl || '_id_fk') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (parent_id) REFERENCES %I(id) ON DELETE SET NULL', '_' || tbl || '_v', '_' || tbl || '_v_parent_id_' || tbl || '_id_fk', tbl);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_' || tbl || '_v_version_created_by_id_users_id_fk') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (version_created_by_id) REFERENCES users(id) ON DELETE SET NULL', '_' || tbl || '_v', '_' || tbl || '_v_version_created_by_id_users_id_fk');
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (parent_id)', '_' || tbl || '_v_parent_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (created_at)', '_' || tbl || '_v_created_at_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (updated_at)', '_' || tbl || '_v_updated_at_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (latest)', '_' || tbl || '_v_latest_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (version__status)', '_' || tbl || '_v_version_version_status_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (version_created_at)', '_' || tbl || '_v_version_version_created_at_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (version_updated_at)', '_' || tbl || '_v_version_version_updated_at_idx', '_' || tbl || '_v');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (version_created_by_id)', '_' || tbl || '_v_version_version_created_by_idx', '_' || tbl || '_v');
    RAISE NOTICE 'drafts şeması tamamlandı: %', tbl;
  END LOOP;
END $$;

-- Categories-specific extra indexes for its select field + qr_code (representatives)
CREATE INDEX IF NOT EXISTS _categories_v_version_version_scope_idx ON _categories_v(version_scope);
CREATE INDEX IF NOT EXISTS _representatives_v_version_qr_code_idx ON _representatives_v(version_qr_code_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_representatives_v_version_qr_code_id_media_id_fk') THEN
    ALTER TABLE _representatives_v ADD CONSTRAINT _representatives_v_version_qr_code_id_media_id_fk FOREIGN KEY (version_qr_code_id) REFERENCES media(id) ON DELETE SET NULL;
  END IF;
END $$;
