CREATE TABLE laws (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	ggdocs_id TEXT NOT NULL UNIQUE CHECK (ggdocs_id NOT GLOB '*[^A-Za-z0-9_-]*'),
	status TEXT NOT NULL DEFAULT 'Drafting' CHECK (
		status IN (
			'Drafting',
			'Debating',
			'Voting',
			'Passed',
			'Rejected'
		)
	),
	last_cached INT
);

CREATE TABLE companies (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	type TEXT NOT NULL
);

CREATE TABLE votes (
	id INTEGER PRIMARY KEY,
	voters_role TEXT NOT NULL,
	date_start INT NOT NULL DEFAULT (unixepoch('now')),
	date_end INT CHECK (
		date_end IS NULL
		OR date_end >= date_start
	),
	vote_type TEXT CHECK (
		vote_type IN (
			'Law',
			'Legislative election',
			'Prime Minister election',
			'Motion of censure',
			'Motion of impeachment'
		)
	),
	law_id TEXT REFERENCES laws (id),
	matter TEXT,
	results TEXT NOT NULL DEFAULT '{}' CHECK (
		json_valid(results)
		AND json_type(results) = 'object'
	),
	has_voted TEXT NOT NULL DEFAULT '[]' CHECK (
		json_valid(has_voted)
		AND json_type(has_voted) = 'array'
	),
	CHECK (
		((law_id IS NOT NULL) + (matter IS NOT NULL) = 1)
		AND (law_id IS NOT NULL) = (vote_type = 'Law')
	)
);
