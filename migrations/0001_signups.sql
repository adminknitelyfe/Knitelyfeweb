-- Knite Lyfe form submissions.
--
-- One table for both forms. They share most fields, the volume is small, and
-- a single table means one export and one place to look. `form` says which
-- form a row came from.

CREATE TABLE IF NOT EXISTS signups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,

  form        TEXT NOT NULL,          -- 'waitlist' | 'campus'
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,

  topic       TEXT,                   -- waitlist: what they are reaching out about
  institution TEXT,                   -- campus
  title       TEXT,                   -- campus
  role        TEXT,                   -- campus
  message     TEXT,

  page        TEXT,                   -- which page the form was submitted from
  country     TEXT,                   -- from Cloudflare, country only

  -- Salted SHA-256, never the address. Enough to rate-limit with, without
  -- the table becoming a record of who visited the site.
  ip_hash     TEXT
);

-- Someone signing up twice is a person being keen, not two leads. The
-- insert upserts on this, so a repeat submission updates their row.
CREATE UNIQUE INDEX IF NOT EXISTS signups_form_email ON signups (form, email);

CREATE INDEX IF NOT EXISTS signups_created ON signups (created_at);
CREATE INDEX IF NOT EXISTS signups_ip_hash ON signups (ip_hash, created_at);
