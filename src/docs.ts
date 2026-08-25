import docs from '@googleapis/docs'

const auth = new docs.auth.GoogleAuth({
	scopes: ['https://www.googleapis.com/auth/documents.readonly'],
})
const client = docs.docs({
	version: 'v1',
	auth: auth,
})

export const getDocument = async (documentId: string) => {
	return await client.documents.get({ documentId })
}
