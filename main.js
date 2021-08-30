const { Client } = require('discord.js');
const config = require('./config.json');

const dangerPerms = [
  'ADMINISTRATOR',
  'KICK_MEMBERS',
  'MANAGE_GUILD',
  'BAN_MEMBERS',
  'MANAGE_ROLES',
  'MANAGE_WEBHOOKS',
  'MANAGE_NICKNAMES',
  'MANAGE_CHANNELS',
];
const client = new Client();

client.on('ready', () => {
  console.log(`BOT: ${client.user.tag} is online.`);
  client.user.setPresence({ activity: { name: "50 Cent ❤️ Λrda", type: 'WATCHING' }, status: 'online' });
  config.SAFE_PERSONS.push(client.user.id);
});

client.on('guildMemberAdd', async (member) => {
  if (!member.user.bot) return;

  const entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'BOT_ADD' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  member.guild.members.ban(member.id).catch(() => false);
  member.guild.members.ban(entry.executor.id).catch(() => false);
  if (member.guild.publicUpdatesChannel) member.guild.publicUpdatesChannel.send(`[\`BOT-EKLEME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildMemberRemove', async (member) => {
  const entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_PRUNE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  member.guild.members.ban(entry.executor.id).catch(() => false);
  if (member.guild.publicUpdatesChannel)
    member.guild.publicUpdatesChannel.send(`[\`UYELERI-CIKAR\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildMemberRemove', async (member) => {
  const entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  member.guild.members.ban(entry.executor.id).catch(() => false);
  if (member.guild.publicUpdatesChannel) member.guild.publicUpdatesChannel.send(`[\`UYE-ATMA\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (
    oldMember.roles.cache.size === newMember.roles.cache.size ||
    newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id) && dangerPerms.some((perm) => role.permissions.has(perm))).size === 0
  )
    return;

  const entry = await newMember.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  await newMember.roles.set(oldMember.roles.cache).catch(() => false);
  newMember.guild.members.ban(entry.executor.id).catch(() => false);
  if (newMember.guild.publicUpdatesChannel)
    newMember.guild.publicUpdatesChannel.send(`[\`UYE-GUNCELLEME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildBanAdd', async (guild) => {
  const entry = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  guild.members.ban(entry.executor.id).catch(() => false);
  if (guild.publicUpdatesChannel) guild.publicUpdatesChannel.send(`[\`UYE-BANLAMA\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('channelUpdate', async (_, newChannel) => {
  const entry = await newChannel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_UPDATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp <= 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  newChannel.guild.members.ban(entry.executor.id).catch(() => false);
  if (newChannel.guild.publicUpdatesChannel)
    newChannel.guild.publicUpdatesChannel.send(`[\`KANAL-GUNCELLEME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('channelDelete', async (channel) => {
  const entry = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  channel.guild.members.ban(entry.executor.id).catch(() => false);
  if (channel.guild.publicUpdatesChannel)
    channel.guild.publicUpdatesChannel.send(`[\`KANAL-SILME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('channelCreate', async (channel) => {
  const entry = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_CREATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  channel.delete().catch(() => false);
  channel.guild.members.ban(entry.executor.id).catch(() => false);
  if (channel.guild.publicUpdatesChannel)
    channel.guild.publicUpdatesChannel.send(`[\`KANAL-OLUSTURMA\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('roleUpdate', async (oldRole, newRole) => {
  const entry = await newRole.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_UPDATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  if (dangerPerms.some((perm) => !oldRole.permissions.has(perm) && newRole.permissions.has(perm))) await newRole.setPermissions(0);

  newRole.guild.members.ban(entry.executor.id).catch(() => false);
  if (newRole.guild.publicUpdatesChannel)
    newRole.guild.publicUpdatesChannel.send(`[\`ROL-GUNCELLEME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('roleDelete', async (role) => {
  const entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_DELETE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  role.guild.members.ban(entry.executor.id).catch(() => false);
  if (role.guild.publicUpdatesChannel) role.guild.publicUpdatesChannel.send(`[\`ROL-SILME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('roleCreate', async (role) => {
  const entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_CREATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  role.delete().catch(() => false);
  role.guild.members.ban(entry.executor.id).catch(() => false);
  if (role.guild.publicUpdatesChannel) role.guild.publicUpdatesChannel.send(`[\`ROL-OLUSTURMA\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('webhookUpdate', async (channel) => {
  const entry = await channel.guild.fetchAuditLogs({ limit: 1, type: 'WEBHOOK_CREATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  channel.guild.members.ban(entry.executor.id).catch(() => false);
  entry.target.delete().catch(() => false);
  if (channel.guild.publicUpdatesChannel)
    channel.guild.publicUpdatesChannel.send(`[\`WEBHOOK-OLUSTURMA\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
  const entry = await newGuild.fetchAuditLogs({ limit: 1, type: 'GUILD_UPDATE' }).then((audit) => audit.entries.first());
  if (Date.now() - entry.createdTimestamp > 5000 || config.SAFE_PERSONS.includes(entry.executor.id)) return;

  newGuild.members.ban(entry.executor.id).catch(() => false);
  await newGuild.edit({
    name: oldGuild.name,
    icon: oldGuild.iconURL({ dynamic: true }),
    banner: oldGuild.bannerURL(),
  });
  if (newGuild.publicUpdatesChannel) newGuild.publicUpdatesChannel.send(`[\`SUNUCU-GUNCELLEME\`] ${entry.executor.tag} (**${entry.executor.id}**)`);
});

client.on('guildUnavailable', async (guild) =>
  guild.roles.cache
    .filter((role) => dangerPerms.some((perm) => role.permissions.has(perm)) && guild.me.roles.highest.rawPosition > role.rawPosition)
    .forEach((role) => role.setPermissions(0))
);

client.login("ODc5ODI5NTc2MTQwODU3MzU0.YSVbJQ.Ka4-Kf7npAbstirbvwfJ1VWE3pk");
