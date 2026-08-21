/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
	Colors,
	EmbedBuilder,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type ContextMenuCommandBuilder,
	type SlashCommandBuilder,
	type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'
import type SubCommand from './SubCommand.js'

/**
 * Represents an Application Command
 */
export default class ApplicationCommand {
	data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder
	hasSubCommands: boolean
	execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
	_execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
	autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void

	/**
	 * @param {{
	 *      data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder
	 *      hasSubCommands?: boolean
	 *      execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
	 *      autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void
	 *  }} options - The options for the slash command
	 */
	constructor(options: {
		data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder
		hasSubCommands?: boolean
		execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
		autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void
	}) {
		if (options.hasSubCommands) {
			this._execute = async (interaction: ChatInputCommandInteraction) => {
				const subCommandGroup = interaction.options.getSubcommandGroup()
				const commandName = interaction.options.getSubcommand()

				if (!commandName) {
					await interaction.reply({
						content: "I couldn't understand that command!",
						ephemeral: true,
					})
				} else {
					try {
						const command = (
							await import(
								`../subCommands/${this.data.name}/${
									subCommandGroup ? `${subCommandGroup}/` : ''
								}${commandName}.js`
							)
						).default as SubCommand
						await command.execute(interaction)
					} catch (error) {
						console.error(error)
						await interaction.reply({
							content: 'An error occured when attempting to execute that command!',
							ephemeral: true,
						})
					}
				}
			}

			this.autocomplete = async (interaction: AutocompleteInteraction) => {
				const subCommandGroup = interaction.options.getSubcommandGroup()
				const subCommandName = interaction.options.getSubcommand()

				if (subCommandGroup || subCommandName) {
					try {
						const subCommand = (
							await import(
								`../subCommands/${this.data.name}/${
									subCommandGroup ? `${subCommandGroup}/` : ''
								}${subCommandName}.js`
							)
						).default as SubCommand
						if (subCommand.autocomplete) {
							await subCommand.autocomplete(interaction)
						}
					} catch (error) {
						console.error(error)
						await interaction.respond([
							{
								name: 'Failed to autocomplete',
								value: 'error',
							},
						])
					}
				}
			}
		} else if (options.execute) {
			this._execute = options.execute
		} else if (options.autocomplete) {
			this.autocomplete = options.autocomplete
		} else {
			throw new Error('No execute function provided')
		}

		this.data = options.data
		if (!options.hasSubCommands) {
			this.autocomplete = options.autocomplete
		}
		this.hasSubCommands = options.hasSubCommands ?? false

		this.execute = async (interaction: ChatInputCommandInteraction) => {
			try {
				if (this._execute == null) {
					throw new Error('No execute function provided')
				}
				await this._execute(interaction)
			} catch (error) {
				console.error(error)
				await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Red)
							.setTitle('Error')
							.setDescription(
								error instanceof Error
									? error.message
									: 'An unknown error occurred',
							),
					],
					ephemeral: true,
				})
			}
		}
	}
}
