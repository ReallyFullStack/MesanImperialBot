import 'dotenv/config'

import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js'
import { readdirSync } from 'fs'
import type ApplicationCommand from './templates/ApplicationCommand.js'
import type Event from './templates/Event.js'
import type MessageCommand from './templates/MessageCommand.js'
import deployGlobalCommands from './deployGlobalCommands.js'
const { TOKEN } = process.env

await deployGlobalCommands()

// Discord client object
global.client = Object.assign(
	new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.MessageContent,
		],
		partials: [Partials.Channel],
	}),
	{
		commands: new Collection<string, ApplicationCommand>(),
		msgCommands: new Collection<string, MessageCommand>(),
	},
)

// Set each command in the commands folder as a command in the client.commands collection
const commandFiles: string[] = readdirSync('./commands').filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)
for (const file of commandFiles) {
	/* eslint-disable @typescript-eslint/no-unsafe-member-access */
	const imp: unknown = (await import(`./commands/${file}`)).default

	if (!(imp instanceof ApplicationCommand)) {
		throw new TypeError(
			`Expected ${ApplicationCommand.name}, got ${imp.constructor.name} instead.`,
		)
	}
	/* eslint-enable @typescript-eslint/no-unsafe-member-access */

	const command: ApplicationCommand = imp
	client.commands.set(command.data.name, command)
}

const msgCommandFiles: string[] = readdirSync('./messageCommands').filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)
for (const file of msgCommandFiles) {
	/* eslint-disable @typescript-eslint/no-unsafe-member-access */
	const imp: unknown = (await import(`./messageCommands/${file}`)).default

	if (!(imp instanceof MessageCommand)) {
		throw new TypeError(`Expected ${MessageCommand.name}, got ${imp.constructor.name} instead.`)
	}
	/* eslint-enable @typescript-eslint/no-unsafe-member-access */

	const command: MessageCommand = imp
	client.msgCommands.set(command.name, command)
}

// Event handling
const eventFiles: string[] = readdirSync('./events').filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)

for (const file of eventFiles) {
	/* eslint-disable @typescript-eslint/no-unsafe-member-access */
	const imp: unknown = (await import(`./events/${file}`)).default

	if (!(imp instanceof Event)) {
		throw new TypeError(`Expected ${Event.name}, got ${imp.constructor.name} instead.`)
	}
	/* eslint-enable @typescript-eslint/no-unsafe-member-access */

	const event: Event = imp
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args))
	} else {
		client.on(event.name, (...args) => event.execute(...args))
	}
}

await client.login(TOKEN)
