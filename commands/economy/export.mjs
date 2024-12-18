import _ from 'lodash';
import { SlashCommandBuilder } from "@discordjs/builders";



export const name = 'export';

export const description = 'Export items to blockchain';

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
	.addStringOption(option => 
		option
			.setName('item_code')
			.setDescription('ITEM_CODE to export?')
			.setRequired(true)
	)
	.addIntegerOption(option => 
		option
			.setName('quantity')
			.setDescription('Quantity of item to export?')
	);

export const execute = async (interaction) => {
	const itemCodeInput = interaction.options.get('item_code').value;
	const quantityInput = interaction.options.get('quantity');
};



// import COOP from '../../coop.mjs';
// import { 
// 	validItemQtyArgFloatGuard, usableItemCodeGuard, 
// 	validUserArgGuard, useManyGuard
// } from '../../operations/minigames/medium/economy/itemCmdGuards.mjs';
// import ElectionHelper from '../../operations/members/hierarchy/election/electionHelper.mjs';


	// Default qty to 1.
	// const qty = _.get(quantityInput, 'value', 1);

	// TODO: Allow them to run this even if arguments aren't in the right order!
	// try {
	// 	// Interpret, parse, and format item code.
	// 	const itemCode = COOP.ITEMS.interpretItemCodeArg(itemCodeInput);

	// 	// Guard against bad qty input/haxxors. lol.
	// 	if (!validItemQtyArgFloatGuard(interaction.channel, interaction.user, qty))
	// 		return null;

	// 	// Configure item manifest for this item command.
	// 	const itemManifest = {
	// 		EMPTY_GIFTBOX: 1,
	// 		[itemCode]: qty
	// 	};

	// 	// Check if this item code can be given.		
	// 	const isUsableCode = usableItemCodeGuard(interaction.channel, itemCode, interaction.user.username);
	// 	if (!isUsableCode) return null;

	// 	// Attempt to load target just to check it can be given.
	// 	const isValidUser = validUserArgGuard(interaction.channel, recipientInput, interaction.user.username);
	// 	if (!isValidUser) return null;

	// 	// Check the user has required gift items and giftbox.
	// 	// Attempt to use item and only grant once returned successful, avoid double gift glitching.
	// 	const itemsWereUsed = await useManyGuard(interaction.user, interaction.channel, itemManifest);
	// 	if (!itemsWereUsed) return null;

	// 	// REVIEWS: Maybe a guard/check with an error is needed for item add too? :D
	// 	// TODO: State how many both have now after gift.

	// 	// Add the item to the gift recepient.
	// 	await Items.add(recipientInput.id, itemCode, qty, `Gifted by ${interaction.user.username}`);

	// 	// Intercept the giving of election items.
	// 	if (itemCode === 'LEADERS_SWORD' || itemCode === 'ELECTION_CROWN')
	// 		ElectionHelper.ensureItemSeriousness();
			
	// 	// Send feedback message.
	// 	const itemEmoji = COOP.MESSAGES.emojiCodeText(itemCode);
	// 	const qtyText = COOP.ITEMS.displayQty(qty);
	// 	const addText = `<@${interaction.user.id}> gave <@${recipientInput.id}> ${itemEmoji} ${itemCode}x${qtyText}.`;
	// 	interaction.channel.send(addText);
	// 	COOP.CHANNELS._send('TALK', addText);

	// 	// Acknowledge completion.
	// 	return await interaction.reply({ content: 'Item(s) successfully given.', ephemeral: true });

	// } catch(e) {
	// 	console.log('Failed to give item.');
	// 	console.error(e);
	// 	return await interaction.reply({ content: 'Item(s) failed to be given.', ephemeral: true });
	// }