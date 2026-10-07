import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import viewLaw from './view-law.js'
import config from '../config.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about Imperial Bot'),
	async execute(interaction): Promise<void> {
		const { author, github, version } = config.about
		const { botName, brandColor } = config.infos
		const { citizen: citizenRoleID } = config.roles

		const citizenRole = (await interaction.guild!.roles.fetch(citizenRoleID))!
		const viewLawId = (await interaction.guild!.commands.fetch()).find(
			(c) => c.name === viewLaw.data.name,
		)?.id
		if (citizenRole == undefined) {
			throw new Error('Incorrect citizen role ID: ' + citizenRoleID)
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`About ${botName}`)
					.setDescription(
						`${botName} ${version} by ${author}. Source code available at ${github}.\n\n`,
					)
					.addFields(
						{
							name: 'Constitution',
							value: `</${viewLaw.data.name}:${viewLawId}> \`law:MEC\``,
							inline: true,
						},
						{
							name: 'Citizens',
							value: citizenRole.members.size.toString(),
							inline: true,
						},
					)
					.setColor(brandColor)
					.setThumbnail(
						new URL('./blob/main/data/images/coa_full.png?raw=1', github).href,
					),
			],
		})
	},
})
