import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	Role,
	RoleColors,
	SlashCommandBuilder,
	roleMention,
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { db, LawRecord, VoteRecord, VoteType } from '../database.js'
import { makeLawEmbed } from './view-law.js'
import vote from './vote.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('start-vote')
		.setDescription('Start a voting session')
		.addStringOption((option) =>
			option
				.setName('matter')
				.setDescription('Matter of the vote')
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addRoleOption((o) =>
			o.setName('voters').setDescription('Which role can vote. Defaults to citizens.'),
		)
		.addStringOption((option) =>
			option
				.setName('options')
				.setDescription(
					'Comma-separated list of options voters can chose. Defaults to "for, against, blank".',
				),
		)
		.addNumberOption((o) => o.setName('duration').setDescription('Number of hours')),
	async execute(interaction): Promise<void> {
		const role =
			interaction.options.getRole('voters', false) ||
			interaction.guild!.roles.cache.get(process.env.MP_ROLE_ID!)!
		const duration = interaction.options.getNumber('duration', false)
		const optionsStr = interaction.options.getString('options', false) || 'for,against,blank'
		const options = Object.fromEntries(
			optionsStr
				.split(',')
				.map((e) => e.trim())
				.filter(Boolean)
				.map((e) => [e, 0]),
		)
		options.blank = 0 // Make sure "blank" exists.

		let lawId: string | undefined, voteType: VoteType | undefined, matter: string | undefined
		const providedMatter = interaction.options.getString('matter', true)
		const allLaws = db.prepare('SELECT id, name FROM laws').all() as Pick<
			LawRecord,
			'id' | 'name'
		>[]

		if (Object.keys(VoteType).includes(providedMatter)) {
			voteType = VoteType[providedMatter as keyof typeof VoteType]
		} else if (allLaws.map((l) => l.id).includes(providedMatter)) {
			lawId = providedMatter
		} else {
			matter = providedMatter
		}

		const { lastInsertRowid: rowId } = db
			.prepare(
				`INSERT INTO votes (
				voters_role,
				date_end,
				law_id,
				vote_type,
				matter,
				results
			) VALUES (
				?,
				CASE WHEN @hours IS NULL THEN NULL
				ELSE unixepoch('now', '+' || @hours || ' hours') END,
				?, ?, ?, ?
			)`,
			)
			.run(role.id, lawId, voteType, matter, JSON.stringify(options), {
				hours: duration,
			})

		const endDate = (
			db.prepare('SELECT date_end FROM votes WHERE id = ?').get(rowId) as Pick<
				VoteRecord,
				'date_end'
			>
		).date_end

		let message: string = `Vote on ${matter}.`
		let buttons: ButtonBuilder[] = []
		if (lawId) {
			message = `Vote on law "${lawId}: ${allLaws.find((l) => l.id === lawId)?.name}".`
			buttons = [
				new ButtonBuilder()
					.setCustomId('view-law')
					.setLabel('View law')
					//.setEmoji('📃️')
					.setStyle(ButtonStyle.Primary),
			]
		} else if (voteType) {
			message = `${voteType}.`
		}

		if (endDate) {
			message += ` Vote ends <t:${endDate}:R>.`
		}

		message += `\n\nVote using the </${vote.data.name}:${(
			await interaction.guild!.commands.fetch()
		).find((c) => c.name === vote.data.name)
			?.id}> command with "${providedMatter}" for the \`session\` option.\n\nVoting options:${Object.keys(
			options,
		)
			.map((e) => `\n- ${e}`)
			.join('')}`

		const resp = await interaction.reply({
			content: roleMention(role.id),
			allowedMentions: { roles: [role.id] },
			embeds: [
				new EmbedBuilder()
					.setColor((role.colors as RoleColors).primaryColor)
					.setTitle('New vote created')
					.setAuthor({
						name: role.name,
						iconURL:
							(role as Role).iconURL() ||
							`https://www.singlecolorimage.com/get/${(
								role.colors as RoleColors
							).primaryColor.toString(16)}/512x512.png`,
					})
					.setDescription(message),
			],
			components:
				buttons.length > 0
					? [new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)]
					: undefined,
			withResponse: true,
		})

		const collector = resp.resource!.message!.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: (duration || 1) * 3_600_000, // 1 hour or {duration} hours
		})

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		collector.on('collect', async (i) => {
			if (i.customId == 'view-law') {
				await makeLawEmbed(i, lawId!)
			}
		})
	},
	async autocomplete(interaction): Promise<void> {
		const focusedValue = interaction.options.getFocused()
		const laws = db
			.prepare('SELECT id, name FROM laws WHERE name LIKE ? LIMIT 25')
			.all(`%${focusedValue}%`) as Pick<LawRecord, 'id' | 'name'>[]
		const choices = Object.entries(VoteType)
			.filter((t) => t[1].startsWith(focusedValue))
			.map((t) => ({ name: t[1] as string, value: t[0] }))
			.concat(
				laws.map((choice) => ({
					name: `${choice.id}: ${choice.name}`,
					value: choice.id,
				})),
			)
		await interaction.respond(choices.slice(0, 25))
	},
})
