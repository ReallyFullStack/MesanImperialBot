/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import config from './config.js'
import type ApplicationCommand from './templates/ApplicationCommand.js'

const { token: TOKEN, clientId: CLIENT_ID, defaultGuildId: DEFAULT_GUILD_ID } = config.discord
const rest = new REST().setToken(TOKEN)

export default async function deployGlobalCommands() {
	const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
	const commandFiles: string[] = readdirSync('./commands').filter(
		(file) => file.endsWith('.js') || file.endsWith('.ts'),
	)

	for (const file of commandFiles) {
		const command: ApplicationCommand = (await import(`./commands/${file}`))
			.default as ApplicationCommand
		const commandData = command.data.toJSON()
		commands.push(commandData)
	}

	try {
		console.log('Started refreshing application (/) commands.')

		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, DEFAULT_GUILD_ID), {
			body: commands,
		})
		// await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
}
