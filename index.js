require("dotenv").config();
console.log(process.env.CLIENT_TOKEN)
const { Client, Events, GatewayIntentBits, REST, Routes, Partials } = require('discord.js')
const token = process.env.CLIENT_TOKEN
// const commands = require("./commands")
const reactionOnEmoji = require("./tools")

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], 
  partials: [Partials .Message, Partials.Channel, Partials.Reaction],
})

// const rest = new REST({ version: '10' }).setToken(token);
// (async () => {
//   try {
//     console.log('Started refreshing application (/) commands.');
//     await rest.put(Routes.applicationCommands("1069689657299832902"), { body: commands });
//     console.log('Successfully reloaded application (/) commands.');
//   } catch (error) {
//     console.error(error);
//   }
// })();

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`)
})

// client.on(Events.InteractionCreate, async (interaction) => {
//     if (!interaction.isChatInputCommand()) return
// })

let timeoutId = null
let timeoutReactUsers = []
let timeoutBot = null

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if(reaction.message?.author?.id === 1069689657299832902) return
    if(timeoutBot) return
    if(timeoutReactUsers.includes(user.id)) {
        console.log("cooldown")
        return
    }

    timeoutReactUsers = [
        ...timeoutReactUsers,
        user.id
    ]

    timeoutId = setTimeout(() => {
        timeoutReactUsers = [...timeoutReactUsers.filter(item => item !== user.id)]
        timeoutId = null
    }, 5000)

    
    const image = await reactionOnEmoji(reaction)
    const channel_id = client.channels.cache.find((channel) => {
        return channel.id === reaction.message.channelId;
    });

    if(!image) return
    timeoutBot = setTimeout(() => {
      channel_id.send({ files: [image] });
      timeoutBot = null
    }, 1000);
})

client.login(token)
