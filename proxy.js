import dotenv from 'dotenv'
import mc from 'minecraft-protocol'
dotenv.config()

import { Connection } from './src/worldManager.js'

let host = process.env.HOST
let port = process.env.PORT
let version = process.env.VERSION

// Server user connects to
const playerServer = mc.createServer({
  'online-mode': false,
  port: 25565,
  version,
  maxPlayers: 1
})

console.log("Proxy running at 127.0.0.1:25565")

let connection;

playerServer.on('login', async (playerClient) => {
  console.log(`${playerClient.username} connected to the proxy`)

  if (!connection) {
    connection = new Connection(host, port)
    await connection.created
    console.log("Created connection")
  }
  connection.connectClient(playerClient)

  playerClient.once('end', () => {
    connection.closeConnection()
    connection = null
  });

})
