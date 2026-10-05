import { createHash } from 'crypto'
import {
	EmbedBuilder,
	GuildMemberRoleManager,
	MessageFlags,
	SlashCommandBuilder,
	roleMention,
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { VoteRecord, db } from '../database.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Cast a vote in an ongoing voting session')
		.addIntegerOption((option) =>
			option
				.setName('session')
				.setDescription('For which session to vote')
				.setAutocomplete(true)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('ballot')
				.setDescription('Value on the ballot')
				.setAutocomplete(true)
				.setRequired(true),
		),
	async execute(interaction): Promise<void> {
		const session = interaction.options.getInteger('session', true)
		const ballot = interaction.options.getString('ballot', true)
		const data = db
			.prepare(
				`SELECT
					voters_role, date_start,
					date_end, law_id, vote_type,
					matter, results, has_voted
				FROM votes WHERE id = ?`,
			)
			.get(session) as Pick<
			VoteRecord,
			| 'voters_role'
			| 'date_start'
			| 'date_end'
			| 'law_id'
			| 'vote_type'
			| 'matter'
			| 'results'
			| 'has_voted'
		>
		const currentTime = Math.floor(Date.now() / 1000)
		const parsedResults = JSON.parse(data.results) as { [k: string]: number }
		const parsedHasVoted = JSON.parse(data.has_voted) as string[]
		const userIdHash = createHash('sha256').update(interaction.user.id).digest('hex')

		if (!(interaction.member!.roles as GuildMemberRoleManager).cache.has(data.voters_role)) {
			throw new Error(
				`You cannot vote on this vote because it is restricted to ${roleMention(
					data.voters_role,
				)}.`,
			)
		}

		if (
			data.date_start > currentTime ||
			(data.date_end != null && currentTime > data.date_end)
		) {
			throw new Error('Vote already finished or not started yet.')
		}

		if (parsedHasVoted.includes(userIdHash)) {
			throw new Error('You have already voted.')
		}

		if (!Object.keys(parsedResults).includes(ballot)) {
			throw new Error('Invalid ballot. Please retry.')
		}

		parsedHasVoted.push(userIdHash)
		parsedResults[ballot]++
		db.prepare('UPDATE votes SET has_voted = ? WHERE id = ?').run(
			JSON.stringify(parsedHasVoted),
			session,
		)
		db.prepare('UPDATE votes SET results = ? WHERE id = ?').run(
			JSON.stringify(parsedResults),
			session,
		)

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`Vote on ${data.law_id ?? data.vote_type ?? data.matter}`)
					.setDescription(`You just voted "${ballot}"!`)
					.setColor(ballot == 'against' ? 'Red' : ballot == 'for' ? 'Green' : 'Grey'),
			],
			flags: MessageFlags.Ephemeral,
		})
	},
	async autocomplete(interaction): Promise<void> {
		const val = interaction.options.getFocused(true)

		switch (val.name) {
			case 'session': {
				const sessions = db
					.prepare(
						`SELECT id, law_id, vote_type, matter FROM votes WHERE
							(law_id LIKE @matter
							OR vote_type LIKE @matter
							OR matter LIKE @matter)
							AND (date_end IS NULL OR date_end > unixepoch('now'))
						LIMIT 25`,
					)
					.all({ matter: `%${val.value}%` }) as Pick<
					VoteRecord,
					'id' | 'law_id' | 'vote_type' | 'matter'
				>[]

				await interaction.respond(
					sessions.map((s) => ({
						name: s.law_id ?? (s.vote_type as string) ?? s.matter,
						value: s.id,
					})),
				)
				break
			}
			case 'ballot': {
				const session = interaction.options.getInteger('session', true)

				const record = db
					.prepare('SELECT results FROM votes WHERE id = ?')
					.get(session) as Pick<VoteRecord, 'results'>

				await interaction.respond(
					Object.keys(JSON.parse(record.results))
						.map((o) => ({ name: o, value: o }))
						.slice(0, 25),
				)
				break
			}
		}
	},
})
