const { Discord, Client, MessageEmbed } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const ayarlar = require('./ayarlar.json');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:talha123@bot.rmmwb.mongodb.net/shinoa', {useNewUrlParser: true, useUnifiedTopology: true});// Mongo connect bağlantısı.
const Database = require("./models/role.js");
const Bots = global.Bots = [];


client.on("ready", async () => {
  client.user.setPresence({ activity: { name: "50 Cent ❤️ Λrda" }, status: "online" });
  let botVoiceChannel = client.channels.cache.get(ayarlar.botVoiceChannelID);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
  setRoleBackup();
  setInterval(() => {
    setRoleBackup();
  }, 1000*60);
});

const Tokens = ["ODc5ODMwMjgzMDA2OTI2ODQ4.YSVbzQ.KL032mpOecyRyr6vhik0x3nzSDI"]


Tokens.forEach(token => {
  let bot = new Client();
  let guild = client.guilds.cache.first();

  bot.on("ready", () => {
    bot.user.setPresence({ activity: { name: "50 Cent ❤️ Λrda" }, status: "online" });
      console.log(`${bot.user.tag} - Adlı Bot Destekçi olarak aktif`);
      bot.Busy = false;
      bot.Uj = 0;
      
      Bots.push(bot);
  })

  bot.login(token).then(e => {
  }).catch(e => {
      console.error(`${token.substring(Math.floor(token.length / 2))} giriş yapamadı.`);
  });
});


client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(ayarlar.botPrefix)) return;
  if (message.author.id !== ayarlar.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(ayarlar.botPrefix.length);
  let embed = new MessageEmbed().setColor("#00ffdd").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Arda"} was here!`).setTimestamp();
  
  if (command === "eval" && message.author.id === ayarlar.botOwner) {
    if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
      message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };



  
  if(command === "kur" || command === "kurulum" || command === "backup" || command === "setup") {
    if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));

    Database.findOne({guildID: ayarlar.guildID, roleID: args[0]}, async (err, data) => {
      if (!data) return console.log("slm")
      closeAllPerms()

      message.react("✅");
      let NewRole = await message.guild.roles.create({
        data: {
          name: data.name,
          color: data.color,
          hoist: data.hoist,
          permissions: data.permissions,
          position: data.position,
          mentionable: data.mentionable
        },
        reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
      });

      setTimeout(() => {
        let _bot = giveBot(1)[0];
        let kanalPermVeri = data.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(NewRole, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);
      
      
      let length = data.members.length;
      if(length <= 0) return console.log(`(${NewRole.name}) [${NewRole.id}] Olayında Mongoda Veri olmadığı için iptal Edildi`);
      let availableBots = Bots.filter(e => !e.Busy);
      if(availableBots.length <= 0) availableBots = Bots.sort((x,y) => y.Uj - x.Uj).slice(0, Math.round(length / Bots.length));
      let perAnyBotMembers = Math.floor(length / availableBots.length);
      if(perAnyBotMembers < 1) perAnyBotMembers = 1;
      for (let index = 0; index < availableBots.length; index++) {
          const bot = availableBots[index];
          if(NewRole.deleted){
              console.log(`[${NewRole.id}] Olayından sonra ${bot.user.username} - rol tekrar silindi, döngü kırılıyor.`);
              break;
          }
          processBot(bot, true, perAnyBotMembers);
          let ids = data.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
          if(ids.length <= 0) {processBot(bot, false, -perAnyBotMembers); break;}
          let guild = bot.guilds.cache.first();
          ids.every(async id => {
              if(NewRole.deleted){
                  processBot(bot, false, -perAnyBotMembers);
                  console.log(`[${NewRole.id}] Olayından sonra ${bot.user.username} - rol tekrar silindi, döngü kırılıyor. #2`);
                  return false;
              }
              let member = guild.member(id);
              if(!member){
                  console.log(`[${NewRole.id}] Olayından sonra ${bot.user.username} - ${id}'yi bulamadım.`);
                  return true;
              }

data.members.forEach((member, index ) => {
  let uye = message.guild.members.cache.get(member);
  if (!uye || uye.roles.cache.has(NewRole.id)) return;

  setTimeout(() => {
     uye.roles.add(NewRole.id).then(e => {console.log(`(${NewRole.name})[${NewRole.id}] Olayından sonra ${bot.user.username} - ${id} ${NewRole.name} rolünü aldı.`);}).catch(e => {console.log(`[${role.id}] Olayından sonra ${bot.Bot.user.username} - ${id}'ye rol veremedim.`);});

  }, index*1850);

})

          });
          processBot(bot, false, -perAnyBotMembers);
      }
      console.log(`(${NewRole.name})[${NewRole.id}] Rolü Başarıyla **${length}** Kadar Kişiye Verilmiştir`)


    })
  }
});

// Güvenli kişi fonksiyonu
function guvenli(kisiID) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  let guvenliler = ayarlar.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === ayarlar.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

// Cezalandırma fonksiyonu
const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function punish(kisiID, tur) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "ban") return uye.ban({ reason: "Arda Koruma" }).catch();
};

client.on("roleDelete", async role => {
  let entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id)) return;
punish(entry.executor.id,"ban")
closeAllPerms()
  let NewRole = await role.guild.roles.create({
    data:{
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        name: role.name,
        permissions: role.permissions,
        position: role.rawPosition
    }
}).catch();

let data = await Database.findOneAndUpdate({roleID: role.id}, {$set: {roleID: NewRole.id}}).exec();
if(!data) return console.log(`(${role.name}) [${role.id}] Olayında Mongoda Veri olmadığı için iptal Edildi `);

setTimeout(() => {
  let _bot = giveBot(1)[0];
  let kanalPermVeri = data.channelOverwrites;
  if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
    let kanal = role.guild.channels.cache.get(perm.id);
    if (!kanal) return;
    setTimeout(() => {
      let yeniKanalPermVeri = {};
      perm.allow.forEach(p => {
        yeniKanalPermVeri[p] = true;
      });
      perm.deny.forEach(p => {
        yeniKanalPermVeri[p] = false;
      });
      kanal.createOverwrite(NewRole, yeniKanalPermVeri).catch(console.error);
    }, index*5000);
  });
}, 5000);


let length = data.members.length;
if(length <= 0) return console.log(`(${role.name}) [${role.id}] Olayında Mongoda Veri olmadığı için iptal Edildi`);
let availableBots = Bots.filter(e => !e.Busy);
if(availableBots.length <= 0) availableBots = Bots.sort((x,y) => y.Uj - x.Uj).slice(0, Math.round(length / Bots.length));
let perAnyBotMembers = Math.floor(length / availableBots.length);
if(perAnyBotMembers < 1) perAnyBotMembers = 1;
for (let index = 0; index < availableBots.length; index++) {
    const bot = availableBots[index];
    if(NewRole.deleted){
        console.log(`[${role.id}] Olayından sonra ${bot.user.username} - rol tekrar silindi, döngü kırılıyor.`);
        break;
    }
    processBot(bot, true, perAnyBotMembers);
    let ids = data.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
    if(ids.length <= 0) {processBot(bot, false, -perAnyBotMembers); break;}
    let guild = bot.guilds.cache.first();
    ids.every(async id => {
        if(NewRole.deleted){
            processBot(bot, false, -perAnyBotMembers);
            console.log(`[${role.id}] Olayından sonra ${bot.user.username} - rol tekrar silindi, döngü kırılıyor. #2`);
            return false;
        }
        let member = guild.member(id);
        if(!member){
            console.log(`[${role.id}] Olayından sonra ${bot.user.username} - ${id}'yi bulamadım.`);
            return true;
        }


        data.members.forEach((member, index ) => {
          let uye = role.guild.members.cache.get(member);
          if (!uye || uye.roles.cache.has(NewRole.id)) return;
        
          setTimeout(() => {
             uye.roles.add(NewRole.id).then(e => {console.log(`(${NewRole.name})[${NewRole.id}] Olayından sonra ${bot.user.username} - ${id} ${NewRole.name} rolünü aldı.`);}).catch(e => {console.log(`[${role.id}] Olayından sonra ${bot.Bot.user.username} - ${id}'ye rol veremedim.`);});
        
          }, index*1850);
        })

    });
    processBot(bot, false, -perAnyBotMembers);
}
console.log(`(${NewRole.name})[${NewRole.id}] Rolü Başarıyla **${length}** Kadar Kişiye Verilmiştir`)


});





// Backup alma fonksiyonu
function setRoleBackup() {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      Database.findOne({guildID: ayarlar.guildID, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new Database({
            _id: new mongoose.Types.ObjectId(),
            guildID: ayarlar.guildID,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });

    Database.find({guildID: ayarlar.guildID}).sort().exec((err, roles) => {
      roles.filter(r => !guild.roles.cache.has(r.roleID) && Date.now()-r.time > 1000*60).forEach(r => {//1 saatte bir alır. Süreyi değiştirebilirsiinz.
        Database.findOneAndDelete({roleID: r.roleID});
      });
    });
    console.log(`Rol veri tabanı düzenlendi!`);
  };
};
// Yt kapat fonksiyonu
function giveBot(length){
  if(length > Bots.length) length = Bots.length;
  let availableBots = Bots.filter(e => !e.Busy);
  if(availableBots.length <= 0) availableBots = Bots.sort((x,y) => x.Uj - y.Uj).slice(0, length);

  return availableBots;
}

function processBot(bot, busy, job, equal = false){
  bot.Busy = busy;
  if(equal) bot.Uj = job;
  else bot.Uj += job;

  let index = Bots.findIndex(e => e.user.id == bot.user.id);
  Bots[index] = bot;
}

function closeAllPerms(){
  let guild = client.guilds.cache.get(ayarlar.guildID);
  let roles = guild.roles.cache.filter(role => role.managed && role.position < guild.me.roles.highest.position && role.permissions.has("MANAGE_GUILD") || role.permissions.has("BAN_MEMBERS") || role.permissions.has("MANAGE_ROLES") || role.permissions.has("MANAGE_WEBHOOKS") || role.permissions.has("MANAGE_NICKNAMES") || role.permissions.has("MANAGE_CHANNELS"));

  roles.forEach(role => {
      if(role.permissions.has("ADMINISTRATOR")){
          role.members.filter(e => e.manageable).forEach(member => {
              if(safe(member.id)) return;
              if(member.roles.highest.position < guild.me.roles.highest.position) member.roles.remove(role).catch();
          });
      }
      else role.setPermissions(0).catch();
  });
}

client.login(ayarlar.botToken).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));
