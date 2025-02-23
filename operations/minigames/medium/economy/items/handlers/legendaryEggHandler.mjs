import { EMOJIS } from "coop-shared/config.mjs";
import Items from "coop-shared/services/items.mjs";
import Useable from "coop-shared/services/useable.mjs";

import COOP, { STATE, REACTIONS, MESSAGES, CHANNELS, USERS } from '../../../../../../coop.mjs';
import { EGG_DATA } from "../../../../small/egghunt.mjs";


export default class LegendaryEggHandler {

    static async onReaction(reaction, user) {
        if (reaction.emoji.name === 'legendary_egg') {
            try {
                const didUse = await Useable.use(user.id, 'LEGENDARY_EGG', 1);
                if (!didUse) {
                    const failureText = `${user.username} tried to use a legendary egg, but has none l-`;
                    MESSAGES.selfDestruct(reaction.message, failureText, 0, 5000);
                    MESSAGES.delayReactionRemoveUser(reaction, user.id, 333);

                } else {
                    const backFired = STATE.CHANCE.bool({ likelihood: 25 });
                    const author = reaction.message.author;
                    const targetID = backFired ? user.id : author.id;

                    // Toxic bomb damage definition.
                    const damage = EGG_DATA['LEGENDARY_EGG'].points;

                    // Apply the damage to the target's points.
                    const updatedPoints = await Items.add(targetID, 'COOP_POINT', damage, 'Legendary egg effect');

                    // Remove egg reaction based on popularity
                    const popularity = REACTIONS.countType(reaction.message, '💜');
                    if (popularity < 3 && !USERS.isCooper(user.id)) 
                        MESSAGES.delayReactionRemove(reaction, 333);
                    
                    // Add visuals animation
                    MESSAGES.delayReact(reaction.message, '💜', 666);

                    // Build the output message.
                    const damageInfoText = ` ${damage} points (${updatedPoints})`;
                    let actionInfoText = `${user.username} used a legendary egg on ${author.username}`;
                    if (backFired) actionInfoText = `**${user.username} tried to use a legendary egg on ${author.username}, but it backfired.**`;

                    const feedbackMsgText = `${actionInfoText}: ${damageInfoText}.`;
                    CHANNELS.codeShoutReact(reaction.message, feedbackMsgText, 'ACTIONS', '💜', false);

                    // Also notify feed channel due to the rarity of the egg.
                    CHANNELS._send('TALK', feedbackMsgText, 666);
                }
            } catch(e) {
                console.error(e);
            }
        }

        // On 3 legendary hearts, allow average egg suggestion.
        if (reaction.emoji.name === '💜' && reaction.count === 3) { 
            // Add legendary_egg emoji reaction.
            MESSAGES.delayReact(reaction.message, EMOJIS.LEGENDARY_EGG, 333);

            // TODO: Add animation due to rarity.
            MESSAGES.delayReact(reaction.message, '✨', 666);
        }
    };
   
};