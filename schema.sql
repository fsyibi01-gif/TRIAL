-- PostgreSQL schema for Little Life Online.
-- Apply this when adding persistent accounts and game progress.

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  username VARCHAR(18) NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name VARCHAR(18) NOT NULL,
  gender_presentation VARCHAR(24),
  age_years SMALLINT NOT NULL DEFAULT 18 CHECK (age_years BETWEEN 18 AND 120),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
  money BIGINT NOT NULL DEFAULT 250 CHECK (money >= 0),
  energy SMALLINT NOT NULL DEFAULT 100 CHECK (energy BETWEEN 0 AND 100),
  happiness SMALLINT NOT NULL DEFAULT 75 CHECK (happiness BETWEEN 0 AND 100),
  x NUMERIC(7,2) NOT NULL DEFAULT 0,
  y NUMERIC(7,2) NOT NULL DEFAULT 0,
  current_world_id TEXT NOT NULL DEFAULT 'maple-town',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_a UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_b UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'friend'
    CHECK (status IN ('friend','dating','engaged','married','blocked')),
  affection SMALLINT NOT NULL DEFAULT 0 CHECK (affection BETWEEN 0 AND 100),
  initiated_by UUID REFERENCES characters(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (character_a <> character_b),
  UNIQUE (character_a, character_b)
);

CREATE TABLE relationship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_character UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  request_type VARCHAR(24) NOT NULL CHECK (request_type IN ('friend','date','relationship','marriage')),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  owner_character UUID NOT NULL REFERENCES characters(id),
  property_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, character_id)
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id TEXT NOT NULL REFERENCES worlds(id),
  property_type VARCHAR(24) NOT NULL CHECK (property_type IN ('room','apartment','house','business')),
  name VARCHAR(80) NOT NULL,
  x NUMERIC(7,2) NOT NULL,
  y NUMERIC(7,2) NOT NULL,
  price BIGINT NOT NULL CHECK (price >= 0),
  owner_household UUID REFERENCES households(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE households
  ADD CONSTRAINT households_property_fk
  FOREIGN KEY (property_id) REFERENCES properties(id);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  title VARCHAR(60) NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 1,
  base_daily_pay BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE character_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  rank INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (character_id, item_code)
);

CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  world_id TEXT NOT NULL REFERENCES worlds(id),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  channel VARCHAR(16) NOT NULL DEFAULT 'global' CHECK (channel IN ('global','local','private')),
  message VARCHAR(180) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_characters_world ON characters(current_world_id);
CREATE INDEX idx_relationships_a ON relationships(character_a);
CREATE INDEX idx_relationships_b ON relationships(character_b);
CREATE INDEX idx_chat_world_time ON chat_messages(world_id, created_at DESC);
CREATE INDEX idx_inventory_character ON inventory_items(character_id);

INSERT INTO worlds (id, name, capacity)
VALUES ('maple-town', 'Maple Town', 100)
ON CONFLICT (id) DO NOTHING;
