import Database, { Database as DatabaseType } from 'better-sqlite3'

let dbInstance: DatabaseType | null = null
export const db = (() => {
	if (!dbInstance) {
		dbInstance = new Database('../data/database.db')
		dbInstance.pragma('journal_mode = WAL')
		dbInstance.pragma('foreign_keys = ON')
	}
	return dbInstance
})()

export enum LawStatus {
	Drafting = 'Drafting',
	Debating = 'Debating',
	Voting = 'Voting',
	Passed = 'Passed',
	Rejected = 'Rejected',
}

export interface LawRecord {
	id: string
	name: string
	ggdocs_id: string
	status: LawStatus
	last_cached: number
}

export enum VoteType {
	Legistlative = 'Legislative election',
	PM = 'Prime Minister election',
	Censure = 'Motion of censure',
	Impeachment = 'Motion of impeachment',
}

export interface VoteRecord {
	id: number
	voters_role: string
	date_start: number
	date_end: number | null
	law_id: string | null
	vote_type: VoteType | null
	matter: string | null
	results: string
	has_voted: string
}
