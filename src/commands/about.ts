import { ColorResolvable, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import viewLaw from './view-law.js'

export default new ApplicationCommand({
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about Imperial Bot'),
	async execute(interaction): Promise<void> {
		const {
			GITHUB: github,
			BOT_NAME: botname,
			AUTHOR: author,
			VERSION: version,
			THEME_COLOR: color,
			CITIZEN_ROLE_ID: citizenRoleID,
		} = process.env
		const citizenRole = (await interaction.guild!.roles.fetch(citizenRoleID!))!
		const viewLawId = (await interaction.guild!.commands.fetch()).find(
			(c) => c.name === viewLaw.data.name,
		)?.id
		if (citizenRole == undefined) {
			throw new Error('Incorrect citizen role ID: ' + citizenRoleID)
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`About ${botname}`)
					.setDescription(
						`${botname} ${version} by ${author}. Source code available at ${github}.\n\n`,
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
					.setColor(color as ColorResolvable)
					.setThumbnail(
						new URL('./blob/main/data/images/coa_full.png?raw=1', github).href,
					),
			],
		})
	},
})
