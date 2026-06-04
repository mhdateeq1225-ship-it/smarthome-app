-- Add automation rules table

CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  action TEXT NOT NULL,
  time TEXT NOT NULL,
  days TEXT NOT NULL
);
