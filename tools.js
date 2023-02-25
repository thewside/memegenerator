
const { random } = require("./utils/random.js")
const { JSDOM } = require('jsdom')
const D3Node = require('d3-node')
const d3n = new D3Node()   
const d3 = d3n.d3
const dom = new JSDOM(`<!DOCTYPE html><body></body>`)
const { convert } = require('convert-svg-to-png')

const params = {
  requiredEmoji: "😁",
  requiredURL: "https://jsearch.pw/",
  pathname: "searx/search",
  searchOptions: "&categories=images&language=en-EN&format=json",
  width: 1024,
  height: 768
}

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

const reactionOnEmoji = async (reaction) => {
  if(reaction.emoji.name !== params.requiredEmoji) return
  const message = await reaction.message.fetch(true)
  if(!message.content) return
  if(message.content === "") return

  const createURL = (messageContent) => {
    const parseURL = new URL(params.requiredURL)
    parseURL.pathname = params.pathname
    parseURL.search = "q=" + messageContent + params.searchOptions
    return parseURL.href
  }

  const fetchImage = async (url) => {
    const response = await fetch(url)
    if(!response.ok) return null
    const result = await response.json()
    const imageUrl = result.results[random(0, result.results.length)].img_src
    const getImage = await fetch(imageUrl)
    if(!getImage.ok) return null
    const resultImage = await getImage
    if (resultImage.status === 200) {
      return imageUrl
    } else {
      return null
    }
  }

  const createSvg = async (url) => {
  
    const sliceTextToParts = () => {
      const text = message.content
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
    const content = sliceTextToParts()
  
    const body = d3.select(dom.window.document.querySelector("body"))
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
    
    const result = await convert(body.html())

    setTimeout(() => {
      dom.window.document.querySelector("body").innerHTML = ""
    }, 1000)

    return result
  }

  const startProcess = async () => {
      const urlForFetch = createURL(message.content)
      const imageUrl = await fetchImage(urlForFetch)
      if(!imageUrl) {
        console.log("error")
        return
      }
      return await createSvg(imageUrl)
  }
  return await startProcess()
}

module.exports = reactionOnEmoji

{/* 
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" style="fill: black;">
  <rect x="0" y="0" width="1024" height="768" style="fill: black;"/>
  <rect x="50" y="50" width="924" height="528" style="fill: white;"/>
  <rect x="52" y="52" width="920" height="524" style="fill: black;"/>
  <image x="52" y="52" href="https://i.imgur.com/EYAbIyf.png" width="89.8%" height="68%" "/>
  <text x="50%" y="680" fill="white" font-size="350%" text-anchor="middle" textLength="127" lengthAdjust="spacingAndGlyphs"> 
  sample text
  </text>                                                                                                                     
</svg>
*/}
