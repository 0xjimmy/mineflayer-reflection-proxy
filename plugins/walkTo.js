const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalXZ } = require('mineflayer-pathfinder').goals

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
    name: 'walkTo',
    helpMessage: 'Walk To location, /walkTo <X> <Z>',
    exec: (args) => {
      if (args.length < 2) return player.write('chat', { message: `{"text":"Error: No location specified"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      setPlayerControl(false)
      const defaultMove = new Movements(bot, mcData)
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalXZ(args[0], args[1]))
      player.write('chat', { message: `{"text":"Heading to ${args[0]},${args[1]}"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
      bot.once('goal_reached', () => {
        player.write('chat', { message: `{"text":"Arrvied At ${args[0]},${args[1]}"}`, position: 1, sender: '00000000-0000-0000-0000-000000000000' })
        setPlayerControl(true)
      })
    }
  } 
]


module.exports = { commands, init }
