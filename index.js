require("dotenv").config();
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js')
const token = process.env.CLIENT_TOKEN
const { random } = require("./utils/random.js")
const { JSDOM } = require('jsdom')
const D3Node = require('d3-node')
const { convert } = require('convert-svg-to-png')
const querystring = require("querystring")

const params = {
  requiredEmoji: "🔄",
  requiredURL: "https://jsearch.pw/",
  pathname: "searx/search",
  searchOptions: "&categories=images&language=en-EN&format=json",
  width: 1024,
  height: 768
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})


const sliceTextToParts = (text) => {
  console.log(text, "slicetextparts")
  let textContainer = []
  let letters = ""
  for (let i = 0; i < text.length; i++) {
    letters += text[i]
    if (letters.length > 30 && text[i] === " " || letters.length > 40) {
      textContainer.push(letters.slice(0, 40).trim())
      letters = ""
    } else if (i === text.length - 1) {
      textContainer.push(letters.trim())
    }
  }
  return textContainer
}

const createUrlFromMessage = (messageContent) => {
  const parseURL = new URL(params.requiredURL)
  parseURL.pathname = params.pathname
  parseURL.search = querystring.stringify({ q: `=${messageContent}` }) + params.searchOptions
  return parseURL.href
}

const createUrlImage = (container) => container[random(0, container.length)]?.img_src
const getUrlImage = async (url) => {
  let newUrl = null
  let count = 0
  let maxCount = 5
  try {
    const response = await fetch(url)
    const result = await response.json()
    newUrl = createUrlImage(result.results)
    console.log(newUrl, "url created")

    if (!newUrl) {
      console.log(newUrl, "bad url")
      count++
      console.log(count, " retries")
      newUrl = createUrlImage()
    }

    if (count >= maxCount) {
      console.log(count, " retries and ...stop ")
      return null
    }
    console.log("check")
    return newUrl

  } catch (error) {
    console.log(error)
    console.log("fetch error")
    return null
  }
}

const validateImage = async (newUrl) => {
  let status = null
  try {
    const imageResult = await fetch(newUrl)
    console.log(imageResult.headers.get("content-type"))
    if (imageResult.headers.get("content-type").includes("image")) {
      status = newUrl
    }
  } catch (error) {
    console.log("error validation image")
  }
  return status
}

const createSvg = async (body, url, message) => {
  const content = sliceTextToParts(message)
  const svg = body.append('svg')
    .attr('width', params.width)
    .attr('height', params.height)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .style("fill", "black")

  svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", params.width)
    .attr("height", params.height)
    .style("fill", "black")

  svg.append("rect")
    .attr("x", 50)
    .attr("y", 50)
    .attr("width", params.width - 100)
    .attr("height", params.height - 200)
    .style("fill", "white")

  svg.append("rect")
    .attr("x", 52)
    .attr("y", 52)
    .attr("width", params.width - 104)
    .attr("height", params.height - 204)
    .style("fill", "black")

  svg.append("image")
    .attr("x", "52")
    .attr("y", "52")
    .attr('xlink:href', url)
    .attr('width', "89.8%")
    .attr('height', "73.4%")

  let heightText = 670
  let fontSize = 300
  let wordInterval = 0

  let intervalDefault = 40
  let interval = intervalDefault

  const newBreak = (svg, text, height, fontSize, wordInterval) => {
    svg.append("text")
        .attr("x", "50%")
        .style("fill", "white")
        .attr("text-anchor", "middle")
        .attr("lengthAdjust", "spacingAndGlyphs")
        .attr("y", height)
        .attr("font-size", `${fontSize}%`)
        .attr("textLength", wordInterval)
        .attr("font-family", "Times New Roman") //Times New Roman
        .text(text)
  }

  for (let i = 0; i < content.length; i++) {
    if (i === 3) break
    const containerLength = content[i].length
    for (let i = 0; i < containerLength; i++) {
      wordInterval += interval
      interval--
    }
    newBreak(svg, content[i], heightText, fontSize, wordInterval)
    wordInterval = 0
    interval = intervalDefault
    heightText += 35
  }
}

const convertSvg =  (body) => {
  let pngImage = null
  try {
    pngImage = convert(body.html())
  } catch {
    console.log("convert svg error")
  }
  return pngImage 
}

const createImage = async (url, message) => {
  const d3n = new D3Node()   
  const d3 = d3n.d3
  const dom = new JSDOM(`<!DOCTYPE html><body></body>`)
  const body = d3.select(dom.window.document.querySelector("body"))
  await createSvg(body, url, message)
  const image = convertSvg(body)
  if(!image) console.log(image, "fail convert")
  return image
}

const reactionOnEmoji = async (reactMessage) => {
  if (reactMessage.emoji.reaction?._emoji.name !== params.requiredEmoji) return
  const message = await reactMessage.message.fetch(true)
  if (!message.content) return
  if (message.content === "") return

  const searcherUrl = createUrlFromMessage(message.content)
  console.log("search url")
  const imageUrl = await getUrlImage(searcherUrl)
  if(!imageUrl) return
  console.log("image url created")
  if(!await validateImage(imageUrl)) return
  console.log("image validated")

  const image = await createImage(imageUrl, message.content)
  console.log(image !== null, "image created")
  return image  
}

let timeoutReactUsers = []

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.message?.author?.id === 1069689657299832902) return
  if (timeoutReactUsers.includes(user.id)) {
    console.log("cooldown")
    return
  }

  timeoutReactUsers = [
    ...timeoutReactUsers,
    user.id
  ]

  setTimeout(() => {
    timeoutReactUsers = [...timeoutReactUsers.filter(item => item !== user.id)]
  }, 2000)

  const image = await reactionOnEmoji(reaction)
  const channel_id = client.channels.cache.find(channel => channel.id === (process.env.ID_CHANNEL_POST).toString())
  if (!image) return
  console.log("image ready for send")
  channel_id.send({ files: [image] });
  // dom.window.document.querySelector("body").innerHTML = ""
})

client.login(token)
