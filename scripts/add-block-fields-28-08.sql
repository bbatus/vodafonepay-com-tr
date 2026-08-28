-- iconCards.description
ALTER TABLE pages_blocks_icon_cards ADD COLUMN IF NOT EXISTS description character varying;
ALTER TABLE _pages_v_blocks_icon_cards ADD COLUMN IF NOT EXISTS description character varying;

-- imageTextSlides.intro + sideImage
ALTER TABLE pages_blocks_image_text_slides ADD COLUMN IF NOT EXISTS intro character varying;
ALTER TABLE pages_blocks_image_text_slides ADD COLUMN IF NOT EXISTS side_image_id integer;
ALTER TABLE _pages_v_blocks_image_text_slides ADD COLUMN IF NOT EXISTS intro character varying;
ALTER TABLE _pages_v_blocks_image_text_slides ADD COLUMN IF NOT EXISTS side_image_id integer;

-- videoList.subheading + darkBackgroundImage
ALTER TABLE pages_blocks_video_list ADD COLUMN IF NOT EXISTS subheading character varying;
ALTER TABLE pages_blocks_video_list ADD COLUMN IF NOT EXISTS dark_background_image_id integer;
ALTER TABLE _pages_v_blocks_video_list ADD COLUMN IF NOT EXISTS subheading character varying;
ALTER TABLE _pages_v_blocks_video_list ADD COLUMN IF NOT EXISTS dark_background_image_id integer;

-- media FK+index for the two new upload columns (not in fix-block-table-constraints.sql's known-column list)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pages_blocks_image_text_slides_side_image_id_media_id_fk') THEN
    ALTER TABLE pages_blocks_image_text_slides ADD CONSTRAINT pages_blocks_image_text_slides_side_image_id_media_id_fk FOREIGN KEY (side_image_id) REFERENCES media(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='_pages_v_blocks_image_text_slides_side_image_id_media_id_fk') THEN
    ALTER TABLE _pages_v_blocks_image_text_slides ADD CONSTRAINT _pages_v_blocks_image_text_slides_side_image_id_media_id_fk FOREIGN KEY (side_image_id) REFERENCES media(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pages_blocks_video_list_dark_background_image_id_media_fk') THEN
    ALTER TABLE pages_blocks_video_list ADD CONSTRAINT pages_blocks_video_list_dark_background_image_id_media_fk FOREIGN KEY (dark_background_image_id) REFERENCES media(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='_pages_v_blocks_video_list_dark_bg_image_id_media_fk') THEN
    ALTER TABLE _pages_v_blocks_video_list ADD CONSTRAINT _pages_v_blocks_video_list_dark_bg_image_id_media_fk FOREIGN KEY (dark_background_image_id) REFERENCES media(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS pages_blocks_image_text_slides_side_image_idx ON pages_blocks_image_text_slides(side_image_id);
CREATE INDEX IF NOT EXISTS _pages_v_blocks_image_text_slides_side_image_idx ON _pages_v_blocks_image_text_slides(side_image_id);
CREATE INDEX IF NOT EXISTS pages_blocks_video_list_dark_bg_image_idx ON pages_blocks_video_list(dark_background_image_id);
CREATE INDEX IF NOT EXISTS _pages_v_blocks_video_list_dark_bg_image_idx ON _pages_v_blocks_video_list(dark_background_image_id);

-- Two new marker blocks: bare tables, fields:[] in Payload — fix-block-table-constraints.sql
-- (re-run after this) backfills their _parent_id FK + _order/_parent_id/_path indexes.
CREATE TABLE IF NOT EXISTS pages_blocks_videos_with_tabs_marker (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  _path text NOT NULL,
  id character varying PRIMARY KEY,
  block_name character varying
);
CREATE TABLE IF NOT EXISTS _pages_v_blocks_videos_with_tabs_marker (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  _path text NOT NULL,
  id character varying PRIMARY KEY,
  block_name character varying
);
CREATE TABLE IF NOT EXISTS pages_blocks_lead_form_cta (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  _path text NOT NULL,
  id character varying PRIMARY KEY,
  block_name character varying
);
CREATE TABLE IF NOT EXISTS _pages_v_blocks_lead_form_cta (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  _path text NOT NULL,
  id character varying PRIMARY KEY,
  block_name character varying
);
