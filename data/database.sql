CREATE TABLE laws (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	ggdocs_id TEXT NOT NULL UNIQUE CHECK (ggdocs_id NOT GLOB '*[^A-Za-z0-9_-]*'),
	status TEXT NOT NULL DEFAULT 'Drafting' CHECK (status IN ('Drafting', 'Debating', 'Voting', 'Passed', 'Rejected')),
	last_cached INT
);

CREATE TABLE companies (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	type TEXT NOT NULL
);