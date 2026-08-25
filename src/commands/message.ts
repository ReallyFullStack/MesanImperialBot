import {
	SlashCommandBuilder,
	EmbedBuilder,
	ColorResolvable,
	User,
	Role,
	GuildMember,
	Colors,
	TextChannel,
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('message')
		.addStringOption((option) =>
			option.setName('title').setDescription('The title of the message').setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('The content of the message')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('color')
				.setDescription('The color of the message in hexadecimal format'),
		)
		.addBooleanOption((option) =>
			option
				.setName('anonymous')
				.setDescription('Send the message anonymously (without showing the author)'),
		)
		.addMentionableOption((option) =>
			option
				.setName('author')
				.setDescription('The author of the message (can be a user or a role)'),
		)
		.setDescription('Send styled message'),
	async execute(interaction): Promise<void> {
		const title = interaction.options.getString('title', true)
		const message = interaction.options.getString('message', true)
		const color = interaction.options.getString('color') || '#e25809'
		const anonymous = interaction.options.getBoolean('anonymous') || false
		const author = interaction.options.getMentionable('author')

		const embed = new EmbedBuilder()
			.setColor(color as ColorResolvable)
			.setTitle(title)
			.setDescription(
				message.replace(/\\(.)/g, (match, ch: string) => {
					switch (ch) {
						case 'n':
							return '\n'
						case 't':
							return '\t'
						case 'r':
							return '\r'
						case '\\':
							return '\\'
						default:
							return ch
					}
				}),
			)

		if (author) {
			let name: string | undefined = undefined
			let iconURL: string | undefined = undefined

			if (author instanceof User || author instanceof GuildMember) {
				name = author.displayName
				iconURL = author.displayAvatarURL()
			} else if (author instanceof Role) {
				name = author.name
				iconURL =
					author.iconURL() ||
					`https://www.singlecolorimage.com/get/${author.color.toString(16)}/512x512.png`
			}

			if (name && iconURL) {
				embed.setAuthor({ name: name, iconURL: iconURL })
			}
		}

		if (anonymous) {
			if (interaction.channel && interaction.channel.isTextBased()) {
				await (interaction.channel as TextChannel).send({ embeds: [embed] })
				await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Green)
							.setTitle('Anonymous Message')
							.setDescription('Your anonymous message has been sent successfully.'),
					],
					ephemeral: true,
				})
			}
			return
		}

		await interaction.reply({ embeds: [embed] })
	},
})
