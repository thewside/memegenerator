require("dotenv").config();
console.log(process.env.CLIENT_TOKEN)
const { Client, Events, GatewayIntentBits, REST, Routes, Partials } = require('discord.js')
const token = process.env.CLIENT_TOKEN
const reactionOnEmoji = require("./tools")

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], 
  partials: [Partials .Message, Partials.Channel, Partials.Reaction],
})

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`)
})

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
