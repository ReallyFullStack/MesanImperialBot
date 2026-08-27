import docs from '@googleapis/docs'
import drive from '@googleapis/drive'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { db, LawRecord } from './database.js'
import { generateMarkdown } from './markdown.js'

const auth = new docs.auth.GoogleAuth({
	scopes: [
		'https://www.googleapis.com/auth/documents.readonly',
		'https://www.googleapis.com/auth/drive.readonly',
	],
})
const docsClient = docs.docs({
	version: 'v1',
	auth,
})
const driveClient = drive.drive({
	version: 'v3',
	auth,
})

export type Doc = docs.docs_v1.Schema$Document

export async function getDocMarkdown(documentId: string): Promise<string> {
	const { last_cached: lastCached } = db
		.prepare('SELECT last_cached FROM laws WHERE ggdocs_id = ?')
		.get(documentId) as Pick<LawRecord, 'last_cached'>
	const { data: metadata } = await driveClient.files.get({
		fileId: documentId,
		fields: 'modifiedTime',
	})
	const lastModifiedTimestamp = Math.floor(Date.parse(metadata.modifiedTime as string) / 1000)

	const cachePath = `../data/cache/${documentId}.md`

	if (lastModifiedTimestamp < lastCached && existsSync(cachePath)) {
		return await readFile(cachePath, 'utf-8')
	}

	const currentTimestamp = Math.floor(Date.now() / 1000)
	const { data } = await docsClient.documents.get({ documentId })
	const markdown = generateMarkdown(data)

	await writeFile(cachePath, markdown, 'utf-8')
	db.prepare('UPDATE laws SET last_cached = ? WHERE ggdocs_id = ?').run(
		currentTimestamp,
		documentId,
	)

	return markdown
}
