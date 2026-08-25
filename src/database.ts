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

export interface LawRecord {
	id: string
	name: string
	ggdocs_id: string
	last_cached: number
}
