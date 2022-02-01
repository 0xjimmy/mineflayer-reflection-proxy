import getPort, { portNumbers } from 'get-port'
import mc from 'minecraft-protocol'
import mineflayer from 'mineflayer'
import pluginLoader from './pluginLoader.js'

export class Connection {
  constructor(host, port = 25565) {
    this.host = host
    this.port = port
    this.lastLook = { pitch: 0, yaw: 0 }
    this.connectedPlayer = false
    this.setPlayerControl = (state) => this.connectedPlayer = state
    this.created = new Promise(async (resolve, reject) => {
      try {
        const botServerPort = await getPort({ port: portNumbers(25566, 25600) })
        this.botServer = mc.createServer({
          'online-mode': false,
          version: process.env.VERSION,
          port: botServerPort,
          maxPlayers: 1
        })
        this.botServer.once('login', (botClient) => {
          this.botClient = botClient
          this.server = mc.createClient({
            host: process.env.HOST,
            port: process.env.PORT,
            username: process.env.EMAIL ? process.env.EMAIL : process.env.USERNAME,
            password: process.env.PASSWORD,
            auth: 'mojang',
            keepAlive: true
          })
          resolve()
        })
        this.bot = mineflayer.createBot({
          host: '127.0.0.1',
          port: botServerPort,
          username: process.env.USERNAME,
          version: process.env.VERSION
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  connectClient(playerClient) {
    this.active = true
    this.setPlayerControl(true)
    this.playerClient = playerClient
    const { commands, commandExec } = pluginLoader(this.server, this.playerClient, this.bot, this.setPlayerControl)
    this.commands = commands
    this.commandExec = commandExec
    this.botPacketMethod = (data, meta) => {
      if (!this.connectedPlayer && meta.name !== 'keep_alive' && this.active) {
        this.server.write(meta.name, data)
        if ('position_look' === meta.name) {
          meta.name = 'position'
          this.lastLook.pitch = data.pitch
          this.lastLook.yaw = data.yaw
          data = { ...data, flags: 0, teleportId: 1 }
        }
        if ('look' === meta.name) {
          meta.name = 'position'
          data = { ...data, ...this.bot.entity.position, flags: 0, teleportId: 1 }
          this.lastLook.pitch = data.pitch
          this.lastLook.yaw = data.yaw
        }
        if ('position' === meta.name) {
          data = { x: data.x, y: data.y, z: data.z, yaw: this.lastLook.yaw, pitch: this.lastLook.pitch, flags: 0, teleportId: 1 }
          if (data.pitch === -0) data.pitch = 0
        }
        this.playerClient.write(meta.name, data)
      }
    }

    this.playerPacketMethod = (data, meta) => {
      if (meta.name === 'tab_complete') console.log(meta.name, data)
      if (meta.name === 'chat' && data.message.startsWith('/') && this.commandExec.command.includes(data.message.substr(1).split(' ')[0])) {
        const command = data.message.substr(1).split(' ')[0]
        const args = data.message.substr(1).split(' ')
        args.splice(0, 1)
        this.commandExec.exec[this.commandExec.command.indexOf(command)](args)
      } else if (this.connectedPlayer && meta.name !== 'keep_alive' && meta.name !== 'tab_complete') {
        this.server.write(meta.name, data)
        if ('position_look' === meta.name) {
          meta.name = 'position'
          this.lastLook.pitch = data.pitch
          this.lastLook.yaw = data.yaw
        }
        if ('look' === meta.name) {
          meta.name = 'position'
          data.x = this.bot.entity.position.x
          data.y = this.bot.entity.position.y
          data.z = this.bot.entity.position.z
          this.lastLook.pitch = data.pitch
          this.lastLook.yaw = data.yaw
        }
        if ('position' === meta.name) {
          data = { x: data.x, y: data.y, z: data.z, yaw: this.lastLook.yaw, pitch: this.lastLook.pitch }
        }
        this.botClient.write(meta.name, data)
      }
    }

    this.serverPacketMethod = (data, meta) => {
      if (meta.state === 'play') {
        if (meta.name === 'declare_commands') {
          const initalCommands = data.nodes.length
          commands.forEach((command, index) => {
            data.nodes[0].children.push(initalCommands + index)
            data.nodes.push(command)
          })
        }
        if (this.active) this.playerClient.write(meta.name, data)
        this.botClient.write(meta.name, data)
        if (meta.name === 'set_compression') {
          console.log('SET COMPRESSION')
          this.botClient.compressionThreshold = data.threshold
          this.compressionThreshold = data.threshold
        }
      }
    }

    this.botClient.off('packet', this.botPacketMethod)
    this.server.off('packet', this.serverPacketMethod)

    this.botClient.on('packet', this.botPacketMethod)
    this.playerClient.on('packet', this.playerPacketMethod)
    this.server.on('packet', this.serverPacketMethod)

  }

  disconnectClient() {
    this.active = false
    this.setPlayerControl(false)
    this.playerClient.off('packet', this.playerPacketMethod)
  }

  closeConnection() {
    this.active = false
    this.setPlayerControl(false)
    this.botClient.off('packet', this.botPacketMethod)
    this.playerClient.off('packet', this.playerPacketMethod)
    this.server.off('packet', this.serverPacketMethod)
    this.server.end();
    this.botServer.close();
  }

}
