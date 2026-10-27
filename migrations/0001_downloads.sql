-- Nothing identifying: no IP, no user agent.
CREATE TABLE downloads (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  file TEXT,
  country TEXT
);
