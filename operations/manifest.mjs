import { Chance } from "chance";

import SacrificeHelper from "./members/redemption/sacrificeHelper.mjs";
import SuggestionsHelper from "./activity/suggestions/suggestionsHelper.mjs";
import EventsHelper from "./eventsHelper.mjs";
import EconomyNotifications from "./activity/information/economyNotifications.mjs";
import MessageNotifications from "./activity/information/messageNotifications.mjs";

import CrateDrop from "./minigames/small/cratedrop.mjs";
import EggHunt from "./minigames/small/egghunt.mjs";
import Mining from "./minigames/small/mining.mjs";
import Woodcutting from "./minigames/small/woodcutting.mjs";
import InstantFurnace from "./minigames/small/instantfurnace.mjs";


import ChestPop from "./minigames/small/chestpop.mjs";

// import NewsHelper from "./social/newsHelper.mjs";

import BuffsHelper from "./minigames/medium/conquest/buffsHelper.mjs";
import CooperMorality from "./minigames/small/cooperMorality.mjs";
import TradingHelper from "./minigames/medium/economy/items/tradingHelper.mjs";
import EconomyHelper from "./minigames/medium/economy/economyHelper.mjs";
import ElectionHelper from "./members/hierarchy/election/electionHelper.mjs";

import COOP, { SERVER, USERS } from "../coop.mjs";

import ProspectHelper from "./members/redemption/prospectHelper.mjs";
import serverTick from "./serverTick.mjs";
import TemporaryMessages from "./activity/maintenance/temporaryMessages.mjs";
import AccessCodes from "coop-shared/services/access-codes.mjs";

import CompetitionHelper from "./social/competitionHelper.mjs";
import ActivityHelper from "./activity/activityHelper.mjs";
import DonationHelper from "./social/donationHelper.mjs";
import SpotlightHelper from "./members/spotlightHelper.mjs";
import RedemptionHelper from "./members/redemption/redemptionHelper.mjs";
import StockHelper from "./stock/stockHelper.mjs";
import EasterEggHandler from "./minigames/medium/economy/items/handlers/easterEggHandler.mjs";
import ChristmasEggHandler from "./minigames/medium/economy/items/handlers/christmasEggHandler.mjs";
import FoxHuntMinigame from "./minigames/small/foxhunt.mjs";

export const baseTickDur = 60 * 25 * 1000;

// Seperate chance instance to avoid circular STATE dependency.
const manifestChance = new Chance;

// Interval basis for checking events that depend on community velocity value.
export const VELOCITY_EVENTS = {
  CHESTPOP: { 
    since: 0, 
    handler: () => ChestPop.run(), 
    interval: (baseTickDur * 2) * 9 
  },
  INSTANT_FURNACE: { 
    since: 0, 
    handler: () => InstantFurnace.run(), 
    interval: baseTickDur * 12
  },
  MINING: {
    since: 0, 
    handler: () => Mining.run(), 
    interval: baseTickDur * manifestChance.floating({ min: 2, max: 7 })
  },
  WOODCUTTING: { 
    since: 0, 
    handler: () => Woodcutting.run(), 
    interval: baseTickDur * manifestChance.floating({ min: 1, max: 5 })
  },
  EGGHUNT: { 
    since: 0, 
    handler: () => EggHunt.run(), 
    interval: baseTickDur
  },
  CRATEDROP: { 
    since: 0, 
    handler: () => CrateDrop.run(), 
    interval: baseTickDur * manifestChance.floating({ min: 4, max: 7 })
  },
  FOXHUNT: { 
    since: 0, 
    handler: () => FoxHuntMinigame.run(), 
    interval: baseTickDur * manifestChance.floating({ min: 3, max: 9 })
  },
};

export const onNewMonth = () => {
  // Coin auction
};

export const onNewWeek = () => {
  
};

export const onNewDay = () => {

};

// Events manifest should load baseTickDuration from COOP.STATE (which loads from database of community set values)
export default function eventsManifest() {

  // Process/thank people for donations
  EventsHelper.runInterval(() => DonationHelper.process(), baseTickDur / 3);
  
  // New day events/calendar events.
  EventsHelper.runInterval(() => COOP.CHICKEN.checkIfNewDay(), baseTickDur / 2);

  // Try to determine peak hours by sampling around 3 times an hour.
  EventsHelper.runInterval(() => ActivityHelper.track(), baseTickDur / 1.75);

  // Track the competitions, start/end if necessary.
  EventsHelper.runInterval(() => CompetitionHelper.track(), baseTickDur * 8);

  // Track spotlight event until required.
  EventsHelper.runInterval(() => SpotlightHelper.track(), baseTickDur * 20);

  // Core tick handler for more granularity over timing.
  EventsHelper.runInterval(() => serverTick(), 30000);

  // Check member of the week historical_points, see if needed... like election style
  EventsHelper.runInterval(() => COOP.POINTS.updateMOTW(), baseTickDur * 5);
  EventsHelper.runInterval(() => MessageNotifications.process(), baseTickDur * 5);
  EventsHelper.runInterval(() => EconomyNotifications.post(), baseTickDur * 4);

  // Cleanup temporary messages.
  EventsHelper.runInterval(() => TemporaryMessages.flush(), baseTickDur);

  // Cleanup temporary codes.
  EventsHelper.runInterval(() => AccessCodes.flush(), baseTickDur / 2);

  // Clean up user data, may have missed detection on a leave/kick/ban.
  EventsHelper.runInterval(() => COOP.USERS.cleanupUsers(), baseTickDur * 2);

  // Ensure all users registered in memory for functionality.
  EventsHelper.runInterval(() => COOP.USERS.populateUsers(), baseTickDur);

  // Update person with richest role.
  EventsHelper.runInterval(() => USERS.updateSavedIntros(), baseTickDur * 10);

  // Election related
  ElectionHelper.setupIntervals();
  
  // Above is unfinished
  EventsHelper.runInterval(() => SuggestionsHelper.check(), baseTickDur * 3);

  // Sacrifice, moderation related.
  EventsHelper.chanceRunInterval(() => SacrificeHelper.random(), 25, baseTickDur * 20);

  // Announce pending intros and sacifices, 2-3 tiems a day.
  EventsHelper.runInterval(() => RedemptionHelper.announce(), baseTickDur * 13);  
  EventsHelper.runInterval(() => SacrificeHelper.announce(), baseTickDur * 15);

  EventsHelper.chanceRunInterval(() => ProspectHelper.randomReady(), 20, baseTickDur * 14);

  EventsHelper.chanceRunInterval(() => EconomyHelper.circulation(), 15, baseTickDur * 8.5);

  EventsHelper.runInterval(() => CooperMorality.evaluate(), baseTickDur * 4.5);

  // Update person with most points role.
  EventsHelper.runInterval(() => COOP.POINTS.updateCurrentWinner(), baseTickDur * 3);

  // Update person with richest role.
  EventsHelper.runInterval(() => COOP.ITEMS.updateRichest(), baseTickDur * 5);

  // Update person in the community economy with MOST_ITEMS and give role/reward.
  EventsHelper.runInterval(() => COOP.ITEMS.updateMostItems(), baseTickDur * 3);
  
  // Holiday related!
  EventsHelper.chanceRunInterval(() => EasterEggHandler.run(), 33, baseTickDur);
  EventsHelper.chanceRunInterval(() => ChristmasEggHandler.run(), 33, baseTickDur);

  // Update trades channel message
  EventsHelper.runInterval(() => TradingHelper.announce(), baseTickDur * 2);

  // Clean up CONQUEST buffs/item effects.
  EventsHelper.runInterval(() => BuffsHelper.cleanupExpired(), baseTickDur / 3);

  // Check stocks functionality pretty often.
  EventsHelper.runInterval(() => StockHelper.update(), 30000);
}
