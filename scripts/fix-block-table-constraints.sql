-- Blok tablolari: _parent_id -> ust tablo (CASCADE) + index'ler
DO $$
DECLARE r record; parent_tbl text; idx_path boolean;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
      AND (c.relname LIKE 'pages_blocks_%' OR c.relname LIKE '\_pages\_v\_blocks\_%')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid=c.oid AND k.contype='f' AND k.conname=c.relname||'_parent_id_fk')
  LOOP
    -- iç içe dizi tablosu mu (ust tablo bir blok tablosu mu)?
    SELECT CASE
      WHEN r.tbl ~ '^pages_blocks_[a-z_]+_(steps|features|people|cards|logos|slides|videos|rows)$'
        THEN regexp_replace(r.tbl,'_(steps|features|people|cards|logos|slides|videos|rows)$','')
      WHEN r.tbl ~ '^_pages_v_blocks_[a-z_]+_(steps|features|people|cards|logos|slides|videos|rows)$'
        THEN regexp_replace(r.tbl,'_(steps|features|people|cards|logos|slides|videos|rows)$','')
      WHEN r.tbl LIKE '\_pages\_v\_blocks\_%' THEN '_pages_v'
      ELSE 'pages' END INTO parent_tbl;

    IF to_regclass('public.'||parent_tbl) IS NULL THEN CONTINUE; END IF;

    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (_parent_id) REFERENCES %I(id) ON DELETE CASCADE',
                   r.tbl, r.tbl||'_parent_id_fk', parent_tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (_order)', r.tbl||'_order_idx', r.tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (_parent_id)', r.tbl||'_parent_id_idx', r.tbl);
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name=r.tbl AND column_name='_path') INTO idx_path;
    IF idx_path THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (_path)', r.tbl||'_path_idx', r.tbl);
    END IF;
    RAISE NOTICE 'FK eklendi: % -> %', r.tbl, parent_tbl;
  END LOOP;
END $$;

-- Medya kolonlari: *_id -> media(id) SET NULL + index
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    WHERE n.nspname='public' AND c.relkind='r'
      AND (c.relname LIKE 'pages_blocks_%' OR c.relname LIKE '\_pages\_v\_blocks\_%')
      AND a.attname IN ('image_id','icon_id','photo_id','media_id','background_image_id','logo_id')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid=c.oid AND k.contype='f'
                      AND k.conname = c.relname||'_'||a.attname||'_media_id_fk')
  LOOP
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES media(id) ON DELETE SET NULL',
                   r.tbl, r.tbl||'_'||r.col||'_media_id_fk', r.col);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%I)',
                   r.tbl||'_'||replace(r.col,'_id','')||'_idx', r.tbl, r.col);
    RAISE NOTICE 'medya FK: %.%', r.tbl, r.col;
  END LOOP;
END $$;
