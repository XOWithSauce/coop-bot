import * as dotenv from 'dotenv';
dotenv.config();

import _ from 'lodash';
import { GatewayIntentBits, Client } from 'discord.js';
import Database from 'coop-shared/setup/database.mjs';
import { SERVER, STATE } from '../coop.mjs';


// Commonly useful.
// const listenReactions = (fn) => COOP.STATE.CLIENT.on('messageReactionAdd', fn);
// const listenChannelUpdates = (fn) => COOP.STATE.CLIENT.on('channelUpdate', fn);
// const listenMessages = (fn) => COOP.STATE.CLIENT.on('messageCreate', fn);
// const listenVoiceState = (fn) => COOP.STATE.CLIENT.on('voiceStateUpdate', fn);

const shallowBot = async () => {
    console.log('Starting shallow bot');

    // Instantiate a CommandoJS "client".
    STATE.CLIENT = new Client({ 
        owner: '786671654721683517',
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates
        ]
    });

    // Connect to Postgres database.
    await Database.connect();

    // Login, then wait for the bot to be fully online before testing.
    await STATE.CLIENT.login(process.env.DISCORD_TOKEN);

    // Common checks:
    // COOP.STATE.CLIENT.on('ready', () => SERVER.checkMissingChannels());
    // COOP.STATE.CLIENT.on('ready', () => SERVER.checkMissingRoles());

    // setupCommands(COOP.STATE.CLIENT);
    
    // COOP.STATE.CLIENT.on("voiceStateUpdate", (prev, curr) => {
    //     const channel = curr?.channel || null;
    //     console.log(channel.members);
    // });

    STATE.CLIENT.on('ready', async () => {
        console.log('Shallow bot is ready');

        SERVER._coop().channels.cache.map(c => console.log(c.parent?.id));
    });
};

shallowBot();
