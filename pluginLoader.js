const plugins = require('./plugins/exports.js')

const helpMessages = ['/proxyhelp - This message here']

function loadPlugins(server, player, bot, setPlayerControl) {
  const helpCommand = () => {
    helpMessages.forEach(msg => {
      player.write('chat', {
        message: `{"text":"${msg}"}`,
        position: 1,
        sender: '00000000-0000-0000-0000-000000000000'
      })
    })
  }
  const commands = [{
    flags: {
      unused: 0,
      has_custom_suggestions: 0,
      has_redirect_node: 0,
      has_command: 0,
      command_node_type: 1
    },
    children: [],
    redirectNode: undefined,
    extraNodeData: 'proxyhelp'
  }]
  const commandExec = { command: ['proxyhelp'], exec: [helpCommand] }
  plugins.forEach(plugin => {
    plugin.init(server, player, bot, setPlayerControl)
    plugin.commands.forEach(command => {
      helpMessages.push(`/${command.name} - ${command.helpMessage}`)
      commands.push({
        flags: {
          unused: 0,
          has_custom_suggestions: 0,
          has_redirect_node: 0,
          has_command: 0,
          command_node_type: 1
        },
        children: [],
        redirectNode: undefined,
        extraNodeData: command.name
      })
      commandExec.command.push(command.name)
      commandExec.exec.push(command.exec)
    });
  })
  return { commands, commandExec }
}

module.exports = loadPlugins
