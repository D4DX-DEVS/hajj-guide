-- One document table for every collection (content, settings, users, user data, admins, audit).
-- `data` holds the JSON body; the columns mirror the fields the API filters/sorts on most.
CREATE TABLE docs (
  collection   TEXT NOT NULL,
  id           TEXT NOT NULL,
  data         TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  deleted_at   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);

CREATE INDEX idx_docs_updated ON docs (collection, updated_at);
-- Expression text must match src/db.js `col()` exactly for SQLite to use these.
CREATE INDEX idx_docs_user_id ON docs (collection, json_extract(data,'$.userId'));
CREATE INDEX idx_docs_firebase_uid ON docs (collection, json_extract(data,'$.firebaseUid'));
CREATE INDEX idx_docs_email ON docs (collection, json_extract(data,'$.email'));
