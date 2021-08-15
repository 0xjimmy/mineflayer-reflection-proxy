const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalFollow } = require('mineflayer-pathfinder').goals

let server, player, bot, setPlayerControl, mcData
function init(A, B, C, D) {
  server = A
  player = B
  bot = C
  setPlayerControl = D
  mcData = require('minecraft-data')(bot.version)
  bot.loadPlugin(pathfinder)
}

const commands = [
  {
    name: 'follow',
    helpMessage: 'Walk To location, /follow <Player>',
    exec: (args) => {
      if (args.length < 1) return player.write('chat', { message: `{"text":"Error: No player specified"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      if (!Object.keys(bot.players).includes(args[0])) return player.write('chat', { message: `{"text":"Error: Player not found"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      if (!bot.players[args[0]].entity) return player.write('chat', { message: `{"text":"Error: Player too far away"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      setPlayerControl(false)
      const defaultMove = new Movements(bot, mcData)
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalFollow(bot.players[args[0]].entity, 0))
      player.write('chat', { message: `{"text":"Following ${args[0]}"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      bot.once('goal_reached', () => {
        player.write('chat', { message: `{"text":"Arrvied At ${args[0]}"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
        setPlayerControl(true)
      })

    }
  } 
]


module.exports = { commands, init }
