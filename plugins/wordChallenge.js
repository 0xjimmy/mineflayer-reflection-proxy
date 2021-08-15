const fetch = require('node-fetch')

let toggleAutoBean = true

let server, player, bot, setPlayerControl, mcData
function init(A, B, C, D) {
  server = A
  player = B
  bot = C
  setPlayerControl = D
  server.on('packet', (data, meta) => {
    if (meta.name === 'chat' && toggleAutoBean) {
      // player.write('chat', { message: JSON.stringify({"text":"", extra: [{ text: "\[AutoBean\] ", bold: true, color: "gold"}, { text: "Testing!" }]}), position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      const parsed = JSON.parse(data.message).extra
      if (parsed && parsed.length >= 4 && parsed[3].text === 'The first person to say ') {
        const word = parsed[4].text.replace(' ', '')
        const wait = 3000 + ((Math.random() * 100000000) % 7000);
        player.write('chat', { message: JSON.stringify({"text":"", extra: [{ text: "\[AutoBean\] ", bold: true, color: "gold"}, { text: `Saying ${word} in ${Number(wait/1000).toFixed(2)} seconds` }]}), position: 1, sender: '00000000-0000-0000-0000-000000000000' })
        setTimeout(() => {
          server.write('chat', { message: word });
        }, wait);
      }
      if (parsed && parsed.length >= 4 && parsed[3].text === 'The first person to decrypt ') {
        const anagram = parsed[4].text.replace(' ', '')
        fetch(`https://unscramblex.com/anagram/${anagram}/?dictionary=nwl`).then(r => r.text()).then(text => {
          text = text.split('<script type="application/ld+json">')[1].split('</script>')[0];
          const result = JSON.parse(text).itemListElement.map(item => item.name).filter(item => item.length === anagram.length);
          const wait = 15000 + ((Math.random() * 100000000) % 15000);
          player.write('chat', { message: JSON.stringify({"text":"", extra: [{ text: "\[AutoBean\] ", bold: true, color: "gold"}, { text: `Trying ${result.join(', ')} in ${Number(wait/1000).toFixed(2)} seconds` }]}), position: 1, sender: '00000000-0000-0000-0000-000000000000' })
          setTimeout(() => {
            for (data of result) {
              server.write('chat', { message: data });
            }
          }, wait);
        })
      }
    }
  })
}

const commands = [
  {
    name: 'toggleautobean',
    helpMessage: 'Enable/Disable AutoBean chat bot, /toggleautobean',
    exec: () => {
      toggleAutoBean = !toggleAutoBean;
      player.write('chat', { message: JSON.stringify({"text":"", extra: [{ text: "\[AutoBean\] ", bold: true, color: "gold"}, { text: `${toggleAutoBean ? 'Enabled' : 'Disabled'}` }]}), position: 1, sender: '00000000-0000-0000-0000-000000000000' })
    }
  } 
]
module.exports = { commands, init }

// 
// 
// const message = '{"text":"","extra":[{"text":"[","color":"dark_gray"},{"text":"ChatGame","color":"gold"},{"text":"] ","color":"dark_gray"},{"text":"The first person to decrypt ","color":"gray"},{"text":"rairteawns ","color":"gold"},{"text":"wins!","color":"gray"}],"hoverEvent":{"action":"show_text","value":[{"text":"rairteawns","color":"gray"}]}}'
// {
//   message: '{"extra":[{"bold":false,"italic":false,"underlined":false,"strikethrough":false,"obfuscated":false,"color":"dark_gray","text":"["},{"italic":false,"color":"gold","text":"ChatGame"},{"italic":false,"color":"dark_gray","text":"] "},{"italic":false,"color":"gold","text":"BigMinerJimmy "},{"italic":false,"color":"gray","text":"has guessed the word "},{"italic":false,"color":"gold","text":"(observation) "},{"italic":false,"color":"gray","text":"in "},{"italic":false,"color":"gold","text":"10.03s!"}],"text":""}',
//   position: 1,
//   sender: '00000000-0000-0000-0000-000000000000'
// }
