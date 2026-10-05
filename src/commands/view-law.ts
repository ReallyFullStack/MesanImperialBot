import {
	ActionRowBuilder,
	BaseMessageOptions,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ComponentType,
	EmbedBuilder,
	RepliableInteraction,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { db, LawRecord } from '../database.js'
import { getDocMarkdown } from '../docs.js'

export const makeLawEmbed = async (
	interaction: RepliableInteraction,
	lawId: string,
): Promise<void> => {
	const lawRecord = db
		.prepare('SELECT name, ggdocs_id, status FROM laws WHERE id = ?')
		.get(lawId) as Pick<LawRecord, 'name' | 'ggdocs_id' | 'status'>

	if (lawRecord == undefined) {
		throw new Error(`No such law: ${lawId}.`)
	}

	const markdown = await getDocMarkdown(lawRecord.ggdocs_id)

	const data: BaseMessageOptions = {
		embeds: [
			new EmbedBuilder()
				.setTitle(`${lawRecord.name} (${lawRecord.status})`)
				.setDescription(markdown.slice(0, 4096))
				.setColor(Colors.Green),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel('Open Google Docs')
					.setStyle(ButtonStyle.Link)
					.setURL(`https://docs.google.com/document/d/${lawRecord.ggdocs_id}`),
			),
		],
	}

	if (interaction.replied) {
		await interaction.editReply(data)
		return
	}
	await interaction.reply(data)
}

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('view-law')
		.setDescription('Display a law for reading.')
		.addStringOption((option) =>
			option
				.setName('law')
				.setDescription('Choose the law you want to see.')
				.setAutocomplete(true),
		),
	async execute(interaction): Promise<void> {
		const lawId = interaction.options.getString('law', false)

		if (lawId) {
			await makeLawEmbed(interaction, lawId)
			return
		}

		const laws = db.prepare('SELECT id, name, status FROM laws').all() as Pick<
			LawRecord,
			'id' | 'name' | 'status'
		>[]
		const dropdownOptions = laws.map((l) =>
			new StringSelectMenuOptionBuilder()
				.setLabel(`${l.id}: ${l.name}`)
				.setDescription(`Status: ${l.status}`)
				.setValue(l.id),
		)
		const response = await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Registry of Laws of the Mesan Empire')
					.setDescription('Select any law from the dropdown to consult its text.'),
			],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('law_dropdown')
						.setPlaceholder('Select law...')
						.addOptions(...dropdownOptions),
				),
			],
			withResponse: true,
		})

		const collector = response.resource!.message!.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 3_600_000, // 1 hour
		})

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		collector.on('collect', async (i) => {
			await i.deferUpdate()
			await makeLawEmbed(interaction, i.values[0])
		})
	},
	async autocomplete(interaction): Promise<void> {
		const focusedValue = interaction.options.getFocused()
		const choices = db
			.prepare('SELECT id, name FROM laws WHERE name LIKE ? LIMIT 25')
			.all(`%${focusedValue}%`) as Pick<LawRecord, 'id' | 'name'>[]
		await interaction.respond(
			choices.map((choice) => ({ name: `${choice.id}: ${choice.name}`, value: choice.id })),
		)
	},
})
