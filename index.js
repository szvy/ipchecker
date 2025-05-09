// bot by szvy
// discord.gg/szvy
// please dont skid
// luv yall <3

const { Client, GatewayIntentBits } = require("discord.js");
const dns = require("dns");

// everything that you have to edit is below

const token = "goonbot.123"; // your bot token
const channel = "linksid123"; // channel that people send links in
const byodcname = "cname.goon"; // cname domain (if you have one)
const ownerid = "id"; // your discord id
const byodip = "ip"; // add your byod ip

// everything that you have to edit is above

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.author.id === ownerid || message.channel.id !== channel) return;

  const urlPattern = /(https?:\/\/)?([a-zA-Z0-9.-]+)/;
  const match = message.content.match(urlPattern);

  const checkDNSRecords = (domain) => {
    return new Promise((resolve) => {
      dns.resolve4(domain, (err, addresses) => {
        resolve({ hasTargetIP: !err && addresses.includes(byodip) });
      });
    });
  };

  const checkCNAME = async (domain) => {
    try {
      const results = await Promise.all(
        byodcname.map(
          (cnameDomain) =>
            new Promise((resolve) => {
              dns.resolveCname(cnameDomain, (err, cnameRecords) => {
                resolve(!err && cnameRecords.includes(domain));
              });
            })
        )
      );
      return { isValidCname: results.includes(true) };
    } catch {
      return { isValidCname: false };
    }
  };

  let shouldDelete = false;
  let reason = "";

  try {
    if (match) {
      const domain = match[2];
      const { hasTargetIP } = await checkDNSRecords(domain);
      
      if (hasTargetIP) {
        return;
      }
      
      const { isValidCname } = await checkCNAME(domain);
      if (!isValidCname) {
        shouldDelete = true;
        reason = "not the right cname";
      }
    } else {
      shouldDelete = true;
      reason = "no link detected";
    }

    if (shouldDelete) {
      try {
        await message.delete();
        console.log(`deleted message from ${message.author.tag} due to ${reason}`);
      } catch (deleteError) {
        console.error(`failed to delete message: ${deleteError.message}`);
      }
    }
  } catch (error) {
    console.error(`error: ${error.message}`);
  }
});

client.login(token);
