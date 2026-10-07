import { EmbedBuilder, GuildMemberRoleManager, SlashCommandBuilder } from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { VoteRecord, db } from '../database.js'
import config from '../config.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('end-vote')
		.setDescription('End a voting session.')
		.addIntegerOption((option) =>
			option
				.setName('session')
				.setAutocomplete(true)
				.setRequired(true)
				.setDescription('For which session to end the vote'),
		),
	async execute(interaction): Promise<void> {
		if (
			!(interaction.member!.roles as GuildMemberRoleManager).cache.hasAny(
				...config.roleScopes.moderator,
			)
		) {
			throw new Error('You do not have the required permissions to execute this action.')
		}

		const session = interaction.options.getInteger('session', true)
		const data = db
			.prepare(
				'SELECT date_start, date_end, vote_type, law_id, matter, results, has_voted FROM votes WHERE id = ?',
			)
			.get(session) as Pick<
			VoteRecord,
			'date_start' | 'date_end' | 'vote_type' | 'law_id' | 'matter' | 'results' | 'has_voted'
		>
		const currentTime = Math.floor(Date.now() / 1000)
		const parsedResults = JSON.parse(data.results) as { [k: string]: number }
		const parsedHasVoted = JSON.parse(data.has_voted) as string[]
		const matter = data.law_id ?? data.matter

		if (
			data.date_start > currentTime ||
			(data.date_end != null && currentTime > data.date_end)
		) {
			throw new Error('Vote already finished or not started yet.')
		}

		db.prepare('UPDATE votes SET date_end = ? WHERE id = ?').run(currentTime, session)

		if (Object.values(parsedResults).reduce((p, a) => p + a, 0) != parsedHasVoted.length) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Electoral fraud detected!')
						.setColor('Red')
						.setDescription(
							`The number of votes cast doesn't match the number of logged voters for vote on ${matter}.`,
						),
				],
			})
			return
		}

		const { blank: blanks, ...filteredResults } = parsedResults
		const total = Object.values(filteredResults).reduce((p, a) => p + a, 0)
		const winner = Object.keys(filteredResults).reduce((a, b) =>
			filteredResults[a] > filteredResults[b] ? a : b,
		)

		const barLength = 25

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`${matter} Vote Results`)
					.setThumbnail(
						new URL(
							'./blob/main/data/images/coa_reduced_gray.png?raw=1',
							config.about.github,
						).href,
					)
					.setColor(winner == 'against' ? 'Red' : winner == 'for' ? 'Green' : 'Grey')
					.setDescription(
						Object.keys(filteredResults).length == 2 &&
							Object.hasOwn(filteredResults, 'for') &&
							Object.hasOwn(filteredResults, 'against')
							? `${matter} has ${winner == 'for' ? 'passed' : 'been rejected'}.`
							: `${winner} won the vote on ${matter}.`,
					)
					.addFields(
						Object.entries(filteredResults).map((o) => {
							const frac = o[1] / total
							const bar = Math.round(frac * barLength)

							return {
								name: o[0],
								value: `${(frac * 100).toFixed(2)} % (${o[1]})\n${'█'.repeat(
									bar,
								)}${'▁'.repeat(barLength - bar)}`,
							}
						}),
					)
					.addFields(
						(() => {
							const frac = blanks / parsedHasVoted.length
							const bar = Math.round(frac * barLength)

							return {
								name: 'Blanks',
								value: `${blanks} (${(frac * 100).toFixed(
									2,
								)} % of all ballots)\n${'█'.repeat(bar)}${'▁'.repeat(
									barLength - bar,
								)}`,
							}
						})(),
					),
			],
		})
	},
	async autocomplete(interaction): Promise<void> {
		const val = interaction.options.getFocused()
		const sessions = db
			.prepare(
				`SELECT id, law_id, matter FROM votes WHERE
					(law_id LIKE @matter
					OR matter LIKE @matter)
					AND (date_end IS NULL OR date_end > unixepoch('now'))
				LIMIT 25`,
			)
			.all({ matter: `%${val}%` }) as Pick<VoteRecord, 'id' | 'law_id' | 'matter'>[]

		await interaction.respond(
			sessions.map((s) => ({
				name: (s.law_id ?? s.matter)!,
				value: s.id,
			})),
		)
	},
})
