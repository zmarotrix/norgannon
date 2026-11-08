/* Hand-written explanations for the docs site: a glossary of types and flags, and short guides.
   These are explanations, not probe results. Where a guide states what the game did, it links to the evidence. */
window.GLOSSARY = {
  "number": ["a number", ""],
  "bool": ["true or false", ""],
  "string": ["text", ""],
  "cstring": ["text", "Blizzard's name for a plain string."],
  "stringView": ["text", "Blizzard's name for a read-only string."],
  "table": ["a Lua table", ""],
  "luaIndex": ["a position, counting from 1", "Lua lists start at 1, so the first item is index 1."],
  "WOWGUID": ["a unique ID string", "For example Player-6933-0015C614 or Creature-0-...; stable for a player, per spawn for creatures."],
  "UnitToken": ["a unit, such as \"player\" or \"target\"", "Unit tokens name whoever is in that slot right now: player, target, focus, mouseover, pet, party1-4, raid1-40, nameplate1-40, boss1-5, arena1-5, and \"target\" chains like targettarget."],
  "uiUnit": ["a size or position in UI units (a number)", "Not a unit token: widths, heights, offsets and cursor positions use it."],
  "UnitTokenVariant": ["a unit, such as \"player\" or \"target\"", "A unit token; some APIs also accept variants like \"party1pet\"."],
  "UnitTokenType": ["a unit, such as \"player\" or \"target\"", ""],
  "UnitTokenRestrictedForAddOns": ["a unit, such as \"player\"", "A unit token that may be refused to add-on code in restricted situations (combat, encounters)."],
  "UnitTokenPvPRestrictedForAddOns": ["a unit, such as \"player\"", "A unit token that may be refused to add-on code in PvP matches."],
  "SpellIdentifier": ["a spell ID or spell name", "Spell IDs are the numbers in a spell link; names work for spells you know."],
  "ItemInfo": ["an item ID, item link or item name", ""],
  "ItemLocation": ["where an item sits (bag and slot, or equipment slot)", "An ItemLocationMixin object: make one with ItemLocation:CreateFromBagAndSlot(bag, slot) or ItemLocation:CreateFromEquipmentSlot(slot)."],
  "PlayerLocation": ["a way to point at a player", "A PlayerLocationMixin object: from a GUID, a unit token, a chat line or a community member."],
  "TooltipData": ["a table describing a tooltip's lines", "What C_TooltipInfo returns: type, id and a list of lines."],
  "AuraData": ["a table describing one aura", "name, icon, spellId, duration, expirationTime, applications, sourceUnit and more. Fields may be secret in combat."],
  "AuraFilters": ["an aura filter string", "For example \"HELPFUL\", \"HARMFUL\", \"HELPFUL|PLAYER\", \"HARMFUL|RAID\". Join filters with |."],
  "fileID": ["a game file's number", "Textures, sounds and models have numeric IDs; widgets accept them where a file path would go."],
  "textureAtlas": ["the name of a texture atlas entry", "Use with Texture:SetAtlas."],
  "textureKit": ["a texture kit name", "A prefix Blizzard UI uses to pick a family of atlas entries."],
  "time_t": ["a time, in seconds since 1970 (Unix time)", "Compare with GetServerTime()."],
  "Seconds": ["a number of seconds", ""],
  "WOWMONEY": ["an amount of money in copper", "10000 copper is 1 gold, 100 copper is 1 silver."],
  "BigUInteger": ["a large whole number", ""],
  "colorRGB": ["a color", "A ColorMixin object with r, g, b from 0 to 1."],
  "colorRGBA": ["a color with opacity", "A ColorMixin object with r, g, b, a from 0 to 1."],
  "vector2": ["an x, y pair", "A Vector2DMixin object."],
  "LuaValueVariant": ["any Lua value", ""],
  "LuaValueReference": ["a reference to a Lua value", ""],
  "LuaDurationObject": ["a duration object", "Holds a start and length that cooldown and timer widgets can draw; its numbers may be secret."],
  "uiAddon": ["an add-on, by name or index", ""],
  "SimpleTexture": ["a Texture object", ""],
  "SimpleFrame": ["a Frame object", ""],
  "ClubId": ["a community or guild ID", "Communities and guilds are both clubs in this API."],
  "ClubStreamId": ["a community chat channel ID", ""],
  "ClubMemberOpaqueId": ["a community member ID", ""],
  "VoiceChatID": ["a voice chat ID", ""],
  "UnitCastBarID": ["a cast bar ID", ""],
  "EncounterTimelineEventID": ["an encounter timeline event ID", ""]
};

window.FLAGS = {
  "IsProtectedFunction": "Protected: only Blizzard's own code may call it. An add-on calling it gets an \"Interface action failed\" block.",
  "HasRestrictions": "Restricted in some situations (often combat or instances); the call may be refused then.",
  "SecretArguments": "Whether secret values may be passed in. AllowedWhenUntainted: only Blizzard's own code may pass secrets, so add-ons can't. AllowedWhenTainted: add-ons may pass secrets too. NotAllowed: nobody may.",
  "SecretReturns": "Always returns secret values.",
  "SecretWhenInCombat": "Returns secret values in combat.",
  "SecretWhenUnitAuraRestricted": "Returns secret values while aura information is restricted (combat, encounters, Mythic+, PvP).",
  "SecretWhenUnitStatsRestricted": "Returns secret values while unit stats are restricted.",
  "SecretWhenUnitIdentityRestricted": "Returns secret values while unit identity is restricted.",
  "SecretWhenUnitSpellCastRestricted": "Returns secret values while spellcasts are restricted.",
  "SecretWhenUnitPowerRestricted": "Returns secret values while power (mana, rage...) is restricted.",
  "SecretWhenCooldownsRestricted": "Returns secret values while cooldowns are restricted.",
  "SecretInChatMessagingLockdown": "Secret while chat is in lockdown (during encounters).",
  "ConditionalSecret": "Secret in some conditions Blizzard doesn't spell out.",
  "ReturnsNeverSecret": "Never returns secret values.",
  "NeverSecret": "This value is never secret.",
  "RequiresUnitAuraAccess": "Needs access to the unit's auras; may be refused when auras are restricted.",
  "MayReturnNothing": "Can return nothing at all.",
  "SynchronousEvent": "Handlers run straight away when the client fires it.",
  "UniqueEvent": "Fires at most once per frame, however many times it's triggered."
};

window.GUIDES = [
  { id: "reading", title: "Reading this site", html:
    "<p>Every item has a status:</p><ul>" +
    "<li><b>verified</b>: the ApiProbe add-on found it in the game.</li>" +
    "<li><b>game only</b>: the game has it, Blizzard's docs don't. Either Forever added it, or it's an old API Blizzard never documented.</li>" +
    "<li><b>not in game</b>: Blizzard's docs list it, this client doesn't have it. Don't use it.</li>" +
    "<li><b>unverified</b>: not checked yet.</li></ul>" +
    "<p>Signatures, descriptions and flags come from Blizzard's own docs, which ship inside the client. They are a good guide but they describe Blizzard's build, not Forever's, so the site treats them as leads.</p>" +
    "<p>The <b>In practice</b> line on each function is written from what the game actually did when the probe called it: once out of combat and once in combat, on your character. If it says the probe didn't call it, nobody has tested that function's behaviour yet.</p>" +
    "<p>Text marked <i>explanation</i> (this guide, the glossary, type hints) was written to help you read the rest. It isn't a probe result.</p>" },
  { id: "secrets", title: "Secret values", html:
    "<p>Forever runs on Blizzard's newer client, which hides some combat information from add-ons. Instead of a number or a string, a getter hands back a <b>secret value</b>.</p>" +
    "<p>Your code can hold a secret and pass it on, but not look inside it. Comparing it, doing arithmetic on it, turning it into text or joining it to a string raises an error. <code>issecretvalue(v)</code> tells you whether a value is secret, and is the only safe test.</p>" +
    "<p>Some widget methods accept secrets and draw them for you, so a health bar can still show health. <a href=\"#/secrets\">Secrets in widgets</a> lists which ones this client accepts, as tested by the API widgets add-on.</p>" +
    "<p>What API widgets saw on Forever (add-on code, out of combat):</p><ul>" +
    "<li><b>Allowed on a secret:</b> <code>issecretvalue</code>, <code>type</code> (says \"number\"), <code>select</code>, storing it in a table as a value, " +
    "<code>tostring</code>, <code>tonumber</code>, <code>..</code> and <code>string.format</code>: those give back another secret.</li>" +
    "<li><b>Refused:</b> arithmetic, comparing (even <code>s == s</code>), <code>math.floor</code> / <code>math.max</code>, <code>not</code>, <code>if b then</code>, " +
    "and using it as a table key. The error names the add-on whose code tainted the call.</li>" +
    "<li><b>Widgets that draw a secret for you:</b> <code>FontString:SetText</code> and <code>SetFormattedText</code>, <code>GameTooltip:AddLine</code> / <code>SetText</code>, " +
    "<code>SetAlpha</code>, <code>SetAlphaFromBoolean</code>, <code>SetVertexColor</code>, <code>SetColorTexture</code>, <code>SetTexCoord</code>, <code>SetRotation</code>, " +
    "<code>SetDesaturation</code>, <code>SetRadialProgressBarPercent</code>, <code>StatusBar:SetStatusBarColor</code>, cooldown colours. See <a href=\"#/secrets\">the full list</a>.</li>" +
    "<li><b>Widgets that refuse one</b> (\"only allowed during untainted execution\"): sizes and scale (<code>SetWidth</code>, <code>SetHeight</code>, <code>SetScale</code>), " +
    "<code>EditBox:SetText</code>, <code>Cooldown:SetCooldown</code>, <code>Slider:SetValue</code>, animation timings.</li></ul>" +
    "<p>What the probe saw on Forever:</p><ul>" +
    "<li><a href=\"#/restrictions\">Always secret</a>, even out of combat: <a href=\"#/fn/UnitHealth\">UnitHealth</a>, UnitHealthMissing, UnitHealthPercent, UnitGetIncomingHeals, UnitGetTotalAbsorbs, UnitInRange and others.</li>" +
    "<li>Secret only in combat: character stats such as <a href=\"#/fn/GetCritChance\">GetCritChance</a>, GetHaste, GetMastery, UnitArmor, UnitAttackPower, UnitDamage, GetUnitSpeed.</li>" +
    "<li>Plain at all times: <a href=\"#/fn/UnitName\">UnitName</a>, <a href=\"#/fn/C_ChatInfo.AreOutgoingAddonChatMessagesRestricted\">C_ChatInfo.AreOutgoingAddonChatMessagesRestricted</a>, GetBuildInfo.</li></ul>" +
    "<p>Reported by testers, being checked by the API checks add-on (answers on <a href=\"#/checks\">Reported quirks</a>):</p><ul>" +
    "<li><a href=\"#/event/UNIT_SPELLCAST_SENT\">UNIT_SPELLCAST_SENT</a>'s <code>target</code> is secret on a self-cast. Blizzard marks it <code>ConditionalSecret</code>; " +
    "the probe's event counter saw it secret in most casts. API checks records which kind of cast (no target, yourself, friend, enemy) gives a secret.</li>" +
    "<li><a href=\"#/fn/UnitIsUnit\">UnitIsUnit</a> against an enemy unit returns a secret answer. Blizzard flags it <code>SecretWhenUnitComparisonRestricted</code>. " +
    "That breaks the usual \"is this nameplate my target?\" check; API checks tests target, player and enemy nameplates.</li>" +
    "<li><code>UnitHealth(\"pet\")</code> is secret. UnitHealth was secret for every unit the probe tried; API checks adds the pet, in and out of combat.</li></ul>" },
  { id: "combat", title: "Combat on Forever", html:
    "<p>What changed when the probe ran its getters during a fight in the open world (a boss fight, Mythic+ or PvP may restrict more; not tested yet):</p><ul>" +
    "<li>About 55 stat getters went secret. See <a href=\"#/restrictions\">Restrictions</a>.</li>" +
    "<li>Reading the guild message of the day and guild info is blocked in combat: <a href=\"#/fn/C_GuildInfo.GetMOTD\">C_GuildInfo.GetMOTD</a>, GetGuildRosterMOTD, GetGuildInfoText. Read them out of combat.</li>" +
    "<li><a href=\"#/fn/C_UnitAuras.GetAuraSlots\">C_UnitAuras.GetAuraSlots</a> errors in combat for add-on code.</li>" +
    "<li>Add-ons can't register <a href=\"#/event/COMBAT_LOG_EVENT_UNFILTERED\">COMBAT_LOG_EVENT_UNFILTERED</a> at all, in or out of combat. Combat-log add-ons need another source.</li>" +
    "<li><code>C_RestrictedActions.IsAddOnRestrictionActive(Enum.AddOnRestrictionType.Combat)</code> read false during that fight, so it isn't a reliable \"am I in combat\" test. Use <code>InCombatLockdown()</code>.</li></ul>" },
  { id: "units", title: "Units", html:
    "<p>Most unit functions take a <b>unit token</b>: a short name for whoever fills a slot right now.</p><ul>" +
    "<li><code>player</code>, <code>pet</code>, <code>target</code>, <code>focus</code>, <code>mouseover</code></li>" +
    "<li><code>party1</code> to <code>party4</code>, <code>raid1</code> to <code>raid40</code>, add <code>pet</code> for their pets (<code>party1pet</code>)</li>" +
    "<li><code>nameplate1</code> to <code>nameplate40</code>, <code>boss1</code> to <code>boss5</code>, <code>arena1</code> to <code>arena5</code></li>" +
    "<li>Add <code>target</code> to follow targets: <code>targettarget</code>, <code>party1target</code></li></ul>" +
    "<p>Forever characters have a first and a last name; <a href=\"#/fn/UnitName\">UnitName</a> gives only the first name, so whispering a first name alone can fail.</p>" +
    "<p>The probe only called unit functions with <code>\"player\"</code>. Other units may be restricted differently; not tested yet.</p>" }
];
