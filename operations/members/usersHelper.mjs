import _ from 'lodash';

import { SERVER, STATE, CHANNELS, USERS, MESSAGES, ROLES, TIME } from "../../coop.mjs";
import { ROLES as ROLES_CONFIG, CHANNELS as CHANNELS_CONFIG } from "coop-shared/config.mjs";

import Database from "coop-shared/setup/database.mjs";
import DatabaseHelper from "coop-shared/helper/databaseHelper.mjs";

// import RedemptionHelper from "./redemption/redemptionHelper.mjs";
import UserRoles from "coop-shared/services/userRoles.mjs";
import AccessCodes from 'coop-shared/services/access-codes.mjs';

export default class UsersHelper {

    static avatar(user) {
        let avatarURL = null;

        if (user.avatar)
            avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;

        return avatarURL;
    };

    static _cache() {
        return SERVER._coop().members.cache;
    };

    // Coherentism versus foundationalism
    static _all = () => SERVER._coop().members.list({ limit: 1000 });

    static _get = id => this._cache().get(id);

    static _fetch = async id => {
        let member = null;
        try {
            member = await SERVER._coop().members.fetch(id);
        } catch(e) {
            console.log('Error fetching member ID: ' + id);
        }
        return member;
    };

    static async loadTopHundredUsers() {
        const query = {
            name: "get-top100-users",
            text: "SELECT * FROM users ORDER BY historical_points DESC LIMIT 100"
        };
        const result = await Database.query(query);        
        return DatabaseHelper.many(result);
    };

    static getMemberByID = (guild, id) => guild.members.cache.get(id);

    static fetchMemberByID = (guild, id) => guild.members.fetch(id);

    static hasRoleID = (member, id) => {
        return member.roles.cache.get(id);
    };

    static hasRoleIDs = (guild, member, roleIDs) => 
        guild.roles.cache
            .filter(role => roleIDs.includes(role.id))
            .some(role => member.roles.cache.has(role.id));

    static hasRoleNames = (guild, member, roleNames) => 
        guild.roles.cache
            .filter(role => roleNames.includes(role.name))
            .some(role => member.roles.cache.has(role.id));

    static count(guild, includeCooper = false) {
        return guild.memberCount - (includeCooper ? 0 : 1);
    };

    static directMSG = (guild, userID, msg) => {
        const member = USERS.getMemberByID(guild, userID);
        if (member) 
            // Buried the error because there's no nice way to do it... besides logging as a statistic.
            return member.send(msg).catch(() => {/** Bury error */ });
    };

    static _dm(userID, msg) {
        const guild = SERVER._coop();
        return this.directMSG(guild, userID, msg);
    };

    static async _dmAll(msg) {
        return new Promise(async resolve => {
            const users = await this.load();
            users.map((user, index) => {
                setTimeout(() => {
                    this._dm(user.discord_id, msg);
                    if (users.length - 1 === index) resolve(true);
                }, 1500 * index);
            });
        });
    };

    static getOnlineMembers = (guild) => guild.members.cache.filter(member => member.presence.status === 'online');
    
    static filterMembers = (guild, filter) => guild.members.cache.filter(filter);

    static _filter = filter => SERVER._coop().members.cache.filter(filter);

    static getOnlineMembersByRoles(guild, roleNames) {
        const notificiationRoles = guild.roles.cache.filter(role => roleNames.includes(role.name));
        
        return this.filterMembers(guild, member => {
            const matchingRoles = notificiationRoles.some(role => member.roles.cache.has(role.id));
            const isOnline = member.presence.status === 'online';
            return matchingRoles && isOnline;
        });
    };

    static getMembersByRoleID(guild, roleID) {
        return guild.members.cache.filter(member => member.roles.cache.has(roleID));
    };

    static async removeFromDatabase(member) {
        console.log('Member removed', member.user.username, member.user.id);
        const query = {
            name: "remove-user",
            text: "DELETE FROM users WHERE discord_id = $1",
            values: [member.user.id]
        };
        return await Database.query(query);
    };

    static async addToDatabase(userID, username, joindate, intro_time = null, intro_link = null, intro_content = null) {
        const query = {
            name: "add-user",
            text: "INSERT INTO users(discord_id, username, join_date, intro_time, intro_link, intro_content) VALUES ($1, $2, $3, $4, $5, $6)",
            values: [userID, username, joindate, intro_time, intro_link, intro_content]
        };
        return await Database.query(query);
    };

    static async setIntro(userID, introContent, link, time) {
        const query = {
            name: "set-user-intro",
            text: 'UPDATE users SET intro_time = $1, intro_link = $2, intro_content = $3 WHERE discord_id = $4 RETURNING intro_link, intro_time',
            values: [time, link, introContent, userID],
        };
        return await Database.query(query);
    };

    static async load() {
        const query = {
            name: "get-users",
            text: "SELECT * FROM users"
        };
        const result = await Database.query(query);        
        return DatabaseHelper.many(result);
    };

    static async loadSortedHistoricalPoints(offset = 0, limit = 15) {
        const query = {
            name: 'get-users-sorted-historical-points',
            text: `
                SELECT * FROM users 
                ORDER BY historical_points DESC
                OFFSET $1
                LIMIT $2
            `.trim(),
            values: [offset, limit]
        };

        const result = await Database.query(query);
        const rows = DatabaseHelper.many(result);

        return rows;
    };

    static async updateField(id, field, value) {
        const query = {
            text: `UPDATE users SET ${field} = $1 WHERE discord_id = $2`,
            values: [value, id]
        };
        return await Database.query(query);
    };

    static async getField(id, field) {
        try {
            const query = {
                text: `SELECT ${field} FROM users WHERE discord_id = $1`,
                values: [id]
            };
    
            // Try to safely access the proposed field.
            let value = null;
            const result = DatabaseHelper.single(await Database.query(query));
            if (result && typeof result[field] !== 'undefined') value = result[field];
    
            return value;

        } catch(e) {
            console.log('getField error ' + field);
            console.error(e);
        }
    };

    static _id2username(id) {
        return this._get(id).user.username;
    };
    
    static async loadSingle(id) {
        const query = {
            name: "get-user",
            text: "SELECT * FROM users WHERE discord_id = $1",
            values: [id]
        };

        const result = await Database.query(query);
        return DatabaseHelper.single(result);
    };
    
    static async isRegistered(discordID) {
        return !!(await this.loadSingle(discordID));
    };

    static async random() {
        const membersManager = SERVER._coop().members;
        const randomUser = await this._random();
        const member = await membersManager.fetch(randomUser.discord_id);
        return member;
    };

    static async _random() {
        const query = {
            name: "get-random-user",
            text: "SELECT * FROM users LIMIT 1 OFFSET floor(random() * (SELECT count(*) from users))"
        };
        const result = DatabaseHelper.single(await Database.query(query));
        return result;
    };

    static isCooper(id) {
        return STATE.CLIENT.user.id === id;
    };

    static isCooperMsg(msg) {
        return this.isCooper(msg.author.id);
    };

    static async getIntro(member) {
        const query = {
            name: "get-user-intro",
            text: "SELECT intro_link, intro_time FROM users WHERE discord_id = $1",
            values: [member.user.id]
        };
        
        const result = await Database.query(query);
        return DatabaseHelper.single(result);
    };
    
    static async getLastUser() {
        const query = {
            name: "get-last-user",
            text: "SELECT * FROM users WHERE id = (select max(id) from users)"
        };
        const result = await Database.query(query);
        return DatabaseHelper.single(result);
    };

    static getHierarchy() {
        const guild = SERVER._coop();
        return {
            commander: this.getMembersByRoleID(guild, ROLES_CONFIG.COMMANDER.id).first(),
            leaders: this.getMembersByRoleID(guild, ROLES_CONFIG.LEADER.id),
            memberCount: guild.memberCount
        };
    };

    static async cleanupUsers() {
        const allUsers = await this.load();
        const allRoles = await UserRoles.all();
        const userRoles = {};

        allUsers.map(async (user, index) => {
            const delay = 666 * index;

            // Replace this with fresh fetch
            const member = await this._fetch(user.discord_id);

            // If the member has left, clean up.
            if (!member) 
                return setTimeout(
                    () => this.removeFromDatabase({
                        user: { id: user.discord_id }
                    }
                ), delay);

            // If the username has changed, update it.
            if (user.username !== member.user.username) {
                setTimeout(() => 
                    this.updateField(user.discord_id, 'username', member.user.username),
                    delay
                );
            }

            // Check if avatar has been updated.
            const latestImage = this.avatar(member.user);
            if (latestImage !== user.image)
                setTimeout(() => 
                    this.updateField(user.discord_id, 'image', latestImage),
                    delay
                );
        });

        allRoles.map(({ discord_id, role_id, role_code }) => {
            if (typeof userRoles[discord_id] === 'undefined') 
                userRoles[discord_id] = [];

            userRoles[discord_id].push({ role_code, role_id });
        });

        const trackedRoles = Object.keys(ROLES_CONFIG).map(roleKey => ROLES_CONFIG[roleKey].id);

        (await this._all()).map((member) => {
            const savedRoles = userRoles[member.user.id] || [];

            // Check if user is in our database, if not ignore roles.
            const stillPersisted = !!(_.find(allUsers, u => u.discord_id === member.user.id));

            // Update the user's persisted roles.
            if (stillPersisted) {
                member.roles.cache.map(role => {
                    // Skip everything not mentioned in ROLES
                    if (!trackedRoles.includes(role.id)) return false;

                    // Check if user's role is recognised by server yet.
                    const isRolePersisted = savedRoles.find(memberRole => memberRole.role_id === role.id);
                    if (!isRolePersisted)
                        UserRoles.add(member.user.id, ROLES._getCoopRoleCodeByID(role.id), role.id);
                });

                // Check if user lost a role on the server.    
                savedRoles.map(savedRole => {
                    if (!ROLES._has(member, savedRole.role_code))
                        UserRoles.remove(member.user.id, savedRole.role_id);
                });
            }

            // Check if member was not processed in time and thus unwelcome.
            // if (!member.user.bot)
                // RedemptionHelper.handleNewbOutstayedWelcome(member);
        });
    };

    static async syncRoles(discordID) {
        const tracked = Object.keys(ROLES_CONFIG).map(roleKey => ROLES_CONFIG[roleKey].id);

        const member = this._get(discordID);
        const roles = await UserRoles.get(discordID);

        member.roles.cache.map(serverRole => {
            // Skip everything not mentioned in ROLES
            if (!tracked.includes(serverRole.id)) return;

            // If role attached to user but not saved in database remove.
            const isSaved = roles.some(memberRole => memberRole.role_id === serverRole.id);
            if (!isSaved)
                ROLES._remove(discordID, ROLES._getCoopRoleCodeByID(serverRole.id));
        });

        // Check if user lost a role on the server.    
        roles.map(savedRole => {
            const code = ROLES._getCoopRoleCodeByID(savedRole.role_id);
            if (!ROLES._has(member, code))
                ROLES._add(discordID, code);
        });
    };

    static async register(id, username, joinedTimestamp) {
        // Insert and respond to successful/failed insertion.
        const dbRes = await this.addToDatabase(id, username, joinedTimestamp);
        if (dbRes.rowCount === 1)
            CHANNELS._send('ACTIONS',`${username} is officially recognised by The Coop ${MESSAGES.emojiCodeText('COOP')}!`);
        else
            CHANNELS._send('TALK',`<@${id}> failed to be recognised by The Coop ${MESSAGES.emojiCodeText('COOP')}...?`);
    };

    static async populateUsers() {
        // Load all recognised users.
        const dbUsers = await this.load();

        // Pluck the list of their IDs for comparison with latest data.
        const includedIDs = _.map(dbUsers, "discord_id");
        
        // Find the missing/unrecognised users (MEMBER role only).
        const allServerUsers = await USERS._all();
        const allMemberUsers = allServerUsers.filter(m => ROLES._has(m, 'MEMBER'));
        
        // Find the missing/unrecognised users (MEMBER role only).
        const unrecognisedMembers = allMemberUsers.filter(m => !includedIDs.includes(m.user.id));

        // Attempt to recognise each unrecognised user.
        Array.from(unrecognisedMembers).map(async (memberSet, index) => {
            const member = memberSet[1];
            
            try {
                await this.register(member.id, member.user.username, member.joinedTimestamp);

            } catch(e) {
                console.log('Error adding unrecognised user to database.');
                console.error(e);
            }
        });
    };

    static async updateSavedIntros() {
        const savedUsers = await this.load();
        const savedUsersWithIntroLink = savedUsers.filter(sUser => sUser.intro_link);
        const result = await Promise.all(savedUsersWithIntroLink.map(async (sUser, index) => {
            try {
                // Don't bombard Discord API, pl0x.
                await new Promise(resolve => setTimeout(resolve, 5000 * index));

                const introMsg = await MESSAGES.getByLink(sUser.intro_link);
                // Sanitise.
                if (introMsg && introMsg.content && introMsg.content !== sUser.intro_content) {
                    await this.setIntro(sUser.discord_id, introMsg.content, sUser.intro_link, TIME._secs());
                    return { id: sUser.discord_id, status: 'DIFFERENT - UPDATED' };
                }


            } catch(e) {
                console.log('Error updating an intro.');
                console.error(e);   
                return { id: sUser.discord_id, status: 'FAILED' };
            }
            return { id: sUser.discord_id, status: 'INTRO_MESSAGE_NOT_FOUND' };
        }));

        return result;
    };

    static async getUserLastClaim(userID) {
        const query = {
            name: "get-user-last-claim",
            text: "SELECT last_claim FROM users WHERE discord_id = $1",
            values: [userID]
        };
        
        const result = await Database.query(query);

        return DatabaseHelper.single(result);
    };

    static async setUserLastClaim(userID) {
        const latest = new Date();
        const query = {
            name: "set-user-last-claim",
            text: "UPDATE users SET last_claim = $2 WHERE discord_id = $1",
            values: [userID, latest]
        };
        
        const result = await Database.query(query);

        return DatabaseHelper.single(result);
    };

};