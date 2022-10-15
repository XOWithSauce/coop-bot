import { SlashCommandBuilder } from "@discordjs/builders";
import { ActionRowBuilder, SelectMenuBuilder } from "discord.js";

export const name = 'selectaction';

export const description = 'Test the selectaction action row';
    
export const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);

export const execute = async (interaction) => {
	const row = new ActionRowBuilder()
        .addComponents(new SelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('Nothing selected')
            .addOptions([
                {
                    label: 'Select me',
                    description: 'This is a description',
                    value: 'first_option',
                },
                {
                    label: 'You can select me too',
                    description: 'This is also a description',
                    value: 'second_option',
                },
            ]),
        );

		await interaction.reply({ content: 'Select action!', components: [row] });
};