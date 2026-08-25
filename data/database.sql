CREATE TABLE laws (
	id TEXT PRIMARY KEY,
	name TEXT UNIQUE,
	ggdocs_id TEXT UNIQUE CHECK (ggdocs_id NOT GLOB '*[^A-Za-z0-9_-]*'),
	last_cached INT
);

CREATE TABLE companies (
	id INT PRIMARY KEY,
	name TEXT,
	type TEXT
);