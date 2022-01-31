const dotenv = require('dotenv')
const mc = require('minecraft-protocol')
const mineflayer = require('mineflayer')
const mineflayerViewer = require('prismarine-viewer').mineflayer
dotenv.config()

const pluginLoader = require('./src/pluginLoader.js')

let host = process.env.HOST
let port = process.env.PORT
let version = process.env.VERSION
let username = process.env.USERNAME
let email = process.env.EMAIL
let password = process.env.PASSWORD

// Server user connects to
const playerServer = mc.createServer({
  'online-mode': false,
  port: 25565,
  version,
  maxPlayers: 1
})

console.log("Proxy running at 127.0.0.1:25565")

playerServer.on('login', (playerClient) => {
  console.log(`${playerClient.username} connected to the proxy`)
  let connectedPlayer = true

  const setPlayerControl = (state) => connectedPlayer = state

  let bot;

  // Server mineflayer connects to
  const botServer = mc.createServer({
    'online-mode': false,
    port: 25566,
    version,
    maxPlayers: 1
  })


  botServer.once('login', (botClient) => {
    console.log('Mineflayer connected to proxy')
    // Target Server
    console.log('connecting to server')
    const server = mc.createClient({
      host,
      port,
      username: email ? email : username,
      password,
      session: { selectedProfile: { name: "BigMinerJimmy", id: "a47f779cd115421785a4b974efa5f4e7" } },
      profilesFolder: '/home/jimmy/Work/minecraft/mineflayer-reflection-proxy',
      auth: 'mojang',
      keepAlive: true
    })
    playerClient.once('end', () => {
      server.end()
      botServer.close()
    });
    console.log(`Proxy connected ${host}:${port}`)

    const { commands, commandExec } = pluginLoader(server, playerClient, bot, setPlayerControl)

    const lastLook = { pitch: 0, yaw: 0 }

    botClient.on('packet', (data, meta) => {
      if (!connectedPlayer && meta.name !== 'keep_alive') {
        server.write(meta.name, data)
        if ('position_look' === meta.name) {
          meta.name = 'position'
          lastLook.pitch = data.pitch
          lastLook.yaw = data.yaw
          data = { ...data, flags: 0, teleportId: 1 }
        }
        if ('look' === meta.name) {
          meta.name = 'position'
          data = { ...data, ...bot.entity.position, flags: 0, teleportId: 1 }
          lastLook.pitch = data.pitch
          lastLook.yaw = data.yaw
        }
        if ('position' === meta.name) {
          data = { x: data.x, y: data.y, z: data.z, yaw: lastLook.yaw, pitch: lastLook.pitch, flags: 0, teleportId: 1 }
          if (data.pitch === -0) data.pitch = 0
          playerClient.write(meta.name, data)
        }
      }
    })

    playerClient.on('packet', (data, meta) => {
      if (meta.name === 'tab_complete') console.log(meta.name, data)
      if (meta.name === 'chat' && data.message.startsWith('/') && commandExec.command.includes(data.message.substr(1).split(' ')[0])) {
        const command = data.message.substr(1).split(' ')[0]
        const args = data.message.substr(1).split(' ')
        args.splice(0, 1)
        commandExec.exec[commandExec.command.indexOf(command)](args)
      } else if (connectedPlayer && meta.name !== 'keep_alive' && meta.name !== 'tab_complete') {
        server.write(meta.name, data)
        if ('position_look' === meta.name) {
          meta.name = 'position'
          lastLook.pitch = data.pitch
          lastLook.yaw = data.yaw
        }
        if ('look' === meta.name) {
          meta.name = 'position'
          data.x = bot.entity.position.x
          data.y = bot.entity.position.y
          data.z = bot.entity.position.z
          lastLook.pitch = data.pitch
          lastLook.yaw = data.yaw
        }
        if ('position' === meta.name) {
          data = { x: data.x, y: data.y, z: data.z, yaw: lastLook.yaw, pitch: lastLook.pitch }
        }
        botClient.write(meta.name, data)
      }
    })

    server.on('packet', (data, meta) => {
      if (meta.state === 'play') {
        if (meta.name === 'declare_commands') {
          const initalCommands = data.nodes.length
          commands.forEach((command, index) => {
            data.nodes[0].children.push(initalCommands + index)
            data.nodes.push(command)
          })
        }
        playerClient.write(meta.name, data)
        botClient.write(meta.name, data)
        if (meta.name === 'set_compression') {
          console.log('SET COMPRESSION')
          botClient.compressionThreshold = data.threshold
          playerClient.compressionThreshold = data.threshold
        }
      }
    })

  })

  bot = mineflayer.createBot({
    host: '127.0.0.1',
    port: 25566,
    username,
    version
  })

  console.log('Created Mineflayer instance')
  bot.once('spawn', () => {
    console.log('Spawned')
    //   process.exit()
    // mineflayerViewer(bot, { port: 3000, firstPerson: true })
    //  console.log("prismarine viewer on 127.0.0.1:3000")
  })


})

