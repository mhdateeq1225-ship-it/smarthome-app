-- Add preferences table

CREATE TABLE preferences (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL
);
