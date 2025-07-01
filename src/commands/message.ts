import { SlashCommandBuilder } from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('message')
		.setDescription('Send formatted message')
		.addStringOption((option) =>
			option.setName('message').setDescription('The message to send').setRequired(true),
		),
	async execute(interaction): Promise<void> {
		await interaction.reply(interaction.options.getString('message'))
	},
})
