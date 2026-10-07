export const ordinalSuffixes = {
	one: 'st',
	two: 'nd',
	few: 'rd',
	other: 'th',
	zero: 'th',
	many: 'th',
} as const satisfies Record<Intl.LDMLPluralRule, string>

export function toOrdinal(
	n: number,
): `${number}${(typeof ordinalSuffixes)[keyof typeof ordinalSuffixes]}` {
	const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n)
	return `${n}${ordinalSuffixes[rule]}`
}
