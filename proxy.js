const dotenv = require('dotenv')
const mc = require('minecraft-protocol')
const mineflayer = require('mineflayer')
const mineflayerViewer = require('prismarine-viewer').mineflayer
dotenv.config()

const pluginLoader = require('./pluginLoader.js')

const states = mc.states
let host = process.env.HOST
let port = process.env.PORT | 25565
let version = process.env.VERSION 
let username = process.env.USERNAME
let password = process.env.PASSWORD

// Server Mineflayer connects to
const playerServer = mc.createServer({
  'online-mode': false,
  port: 25566,
  keepAlive: false,
  version: version,
  maxPlayers: 1
})

playerServer.on('login', (playerClient) => {
  let connectedPlayer = true

  const setPlayerControl = (state) => connectedPlayer = state

  // Server mineflayer connects to
  const botServer = mc.createServer({
    'online-mode': false,
    port: 25567,
    keepAlive: false,
    version: version,
    maxPlayers: 1
  })

  let bot

  botServer.on('login', (botClient) => {
    // Target Server
    const server = mc.createClient({
      host: host,
      port: port,
      username,
      password,
      keepAlive: false,
      version: version
    })
  
    const { commands, commandExec } = pluginLoader(server, playerClient, bot, setPlayerControl)

    const lastLook = { pitch: 0, yaw: 0 }

    botClient.on('packet', (data, meta) => {
      if (server.state === states.PLAY && meta.state === states.PLAY) {
        if (meta.name === 'keep_alive') server.write(meta.name, data)
        else if (!connectedPlayer) {
          server.write(meta.name, data)
          if ('position_look' === meta.name) {
            meta.name = 'position'
            lastLook.pitch = data.pitch
            lastLook.yaw = data.yaw
            data = { ...data, flags: 0, teleportId: 1 }
          }
          if ('look' === meta.name) {
            meta.name = 'position'
            data = { ...data, ...bot.entity.position, flags: 0, teleportId: 1}
            lastLook.pitch = data.pitch
            lastLook.yaw = data.yaw
          }
          if ('position' === meta.name) {
            data = { x: data.x, y: data.y, z: data.z, yaw: lastLook.yaw, pitch: lastLook.pitch, flags: 0, teleportId: 1 }
            if (data.pitch === -0) data.pitch = 0
            playerClient.write(meta.name, data)
          }
        }
      }
    })
    
    playerClient.on('end', () => {
      botClient.end()
      botServer.close()
      server.end()
    })

    playerClient.on('packet', (data, meta) => {
      if (server.state === states.PLAY && meta.state === states.PLAY && meta.name !== 'keep_alive') {
        if (meta.name === 'chat' && data.message.startsWith('/') && commandExec.command.includes(data.message.substr(1).split(' ')[0])) {
          const command = data.message.substr(1).split(' ')[0]
          const args = data.message.substr(1).split(' ')
          args.splice(0, 1)
          commandExec.exec[commandExec.command.indexOf(command)](args)
        } else if (connectedPlayer) {
          server.write(meta.name, data)

          if ('position' === meta.name) {
            data = { x: data.x, y: data.y, z: data.z, yaw: lastLook.yaw, pitch: lastLook.pitch }
          }
          if ('position_look' === meta.name) {
            meta.name = 'position'
            lastLook.pitch = data.pitch
            lastLook.yaw = data.yaw
          }
          if ('look' === meta.name) {
            meta.name = 'position'
            data = { ...data, ...bot.entity.position }
            lastLook.pitch = data.pitch
            lastLook.yaw = data.yaw
          }
          botClient.write(meta.name, data)
        }
      }
    })

    server.on('packet', (data, meta) => {
      if (meta.state === states.PLAY && botClient.state === states.PLAY) {
        if (meta.name === 'keep_alive') {
          botClient.write(meta.name, data)
          playerClient.write(meta.name, data)
        } else {
          if (meta.name === 'declare_commands') {
            const initalCommands = data.nodes.length
            commands.forEach((command, index) => {
              data.nodes[0].children.push(initalCommands + index)
              data.nodes.push(command)
            })
          }
          playerClient.write(meta.name, data)
          botClient.write(meta.name, data)
        }
        if (meta.name === 'set_compression') {
          botClient.compressionThreshold = data.threshold
          playerClient.compressionThreshold = data.threshold
        }
      }
    })

  })

  bot = mineflayer.createBot({
    host: 'localhost',
    username,
    port: 25567,
    version
  })
})

