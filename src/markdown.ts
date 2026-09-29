import { docs_v1 } from '@googleapis/docs'
import type { Doc } from './docs.js'
import { NumberToAlphabet } from 'number-to-alphabet'
import { convertNumberToRoman } from 'cr-numeral'

function parseStructuralElement(
	e: docs_v1.Schema$StructuralElement,
	lists: { [k: string]: docs_v1.Schema$List } | null | undefined = undefined,
	listIndices: { [k: string]: number } = {},
): string {
	if (e.paragraph != undefined) {
		let bullet: string = ''
		if (e.paragraph.bullet != undefined) {
			if (lists == undefined || lists == null) {
				throw new Error('Missing global list declarations.')
			}

			const listId = e.paragraph.bullet.listId!
			const nestingLevel = e.paragraph.bullet.nestingLevel || 0
			const levelInfo = lists[listId].listProperties!.nestingLevels![nestingLevel]
			const idx: number = (listIndices[`${listId},${nestingLevel}`] || 0) + 1
			listIndices[`${listId},${nestingLevel}`] = idx

			let n = nestingLevel + 1
			while (listIndices[`${listId},${n}`] != undefined) {
				listIndices[`${listId},${n++}`] = 0
			}

			bullet =
				'\u2800\u2800'.repeat(nestingLevel) + // Braille Blank character, to force visible spacing
				parseParagraphElement({
					textRun: {
						content: levelInfo.glyphFormat!.replace(/%\d/, () =>
							levelInfo.glyphType
								? indexToString(idx, levelInfo.glyphType as GlyphType)
								: '-',
						),
						textStyle: levelInfo.textStyle,
					},
				}) +
				' '
		}
		const heading: string | undefined = {
			TITLE: '#',
			SUBTITLE: '##',
			HEADING_1: '#',
			HEADING_2: '##',
			HEADING_3: '###',
			HEADING_4: '####',
			HEADING_5: '#####',
			HEADING_6: '######',
			NORMAL_TEXT: '',
		}[e.paragraph.paragraphStyle!.namedStyleType!]

		const parsedRuns: string[] = e.paragraph.elements!.map((r) => parseParagraphElement(r))
		console.log((heading ? heading + ' ' : '') + bullet + parsedRuns.join(''))
		return (heading ? heading + ' ' : '') + bullet + parsedRuns.join('')
	} else if (e.sectionBreak != undefined) {
		return ''
	} else if (e.tableOfContents != undefined) {
		return ''
	} else if (e.table != undefined) {
		let parsed: string = ''
		if (e.table.columns != 1) {
			throw new Error("Law document can't include tables.")
		}

		e.table.tableRows?.forEach((r) => {
			if (r.tableCells!.length > 1) {
				throw new Error("Law document can't include tables.")
			}

			if (r.tableCells!.length == 0) {
				return
			}

			const parsedCells: (string | undefined)[] = []
			r.tableCells![0].content!.forEach((c) => {
				parsedCells.push(parseStructuralElement(c))
			})
			parsed += `${parsedCells.filter((c) => c).join('')}  \n`
		})

		return parsed
	}

	return ''
}

function parseParagraphElement(e: docs_v1.Schema$ParagraphElement): string {
	if (e.textRun != undefined) {
		let content: string = e.textRun.content!.trim()
		const style: docs_v1.Schema$TextStyle = e.textRun.textStyle!

		const start: number = e.textRun.content!.indexOf(content)
		const affixes: [string, string] = [
			e.textRun.content!.slice(0, start),
			e.textRun.content!.slice(start + content.length),
		]

		if (style.italic == true) {
			content = `*${content}*`
		}
		if (style.bold == true) {
			content = `**${content}**`
		}
		if (style.underline == true) {
			content = `__${content}__`
		}
		if (style.strikethrough == true) {
			content = `~~${content}~~`
		}
		if (style.smallCaps == true) {
			const smallCaps: { [l: string]: string } = {
				a: 'ᴀ',
				b: 'ʙ',
				c: 'ᴄ',
				d: 'ᴅ',
				e: 'ᴇ',
				f: 'ꜰ',
				g: 'ɢ',
				h: 'ʜ',
				i: 'ɪ',
				j: 'ᴊ',
				k: 'ᴋ',
				l: 'ʟ',
				m: 'ᴍ',
				n: 'ɴ',
				o: 'ᴏ',
				p: 'ᴘ',
				q: 'ǫ',
				r: 'ʀ',
				s: 's',
				t: 'ᴛ',
				u: 'ᴜ',
				v: 'ᴠ',
				w: 'ᴡ',
				x: 'x',
				y: 'ʏ',
				z: 'ᴢ',
			}
			content = content.replace(/[a-z]/g, (c) => smallCaps[c] || c)
		}
		if (style.link != null && style.link.url != null) {
			content = `[${content}](${style.link.url})`
		}
		return affixes[0] + content + affixes[1]
	}
	return ''
}

enum GlyphType {
	GLYPH_TYPE_UNSPECIFIED = 'GLYPH_TYPE_UNSPECIFIED',
	NONE = 'NONE',
	DECIMAL = 'DECIMAL',
	ZERO_DECIMAL = 'ZERO_DECIMAL',
	UPPER_ALPHA = 'UPPER_ALPHA',
	ALPHA = 'ALPHA',
	UPPER_ROMAN = 'UPPER_ROMAN',
	ROMAN = 'ROMAN',
}

function indexToString(index: number, format: GlyphType): string {
	const alpha = new NumberToAlphabet().numberToString(index)
	const roman = convertNumberToRoman(index)

	switch (format) {
		case GlyphType.DECIMAL:
			return index.toString()
		case GlyphType.ZERO_DECIMAL:
			return index.toString().padStart(2, '0')
		case GlyphType.ALPHA:
			return alpha.toLowerCase()
		case GlyphType.UPPER_ALPHA:
			return alpha.toUpperCase()
		case GlyphType.ROMAN:
			return roman.toLowerCase()
		case GlyphType.UPPER_ROMAN:
			return roman.toUpperCase()
		case GlyphType.GLYPH_TYPE_UNSPECIFIED:
		case GlyphType.NONE:
		default:
			return ''
	}
}

export function generateMarkdown(doc: Doc): string {
	const body = doc.body!
	let markdown: string = ''
	const indices: { [k: string]: number } = {}
	body.content!.forEach((e) => (markdown += parseStructuralElement(e, doc.lists, indices)))
	return markdown
}
