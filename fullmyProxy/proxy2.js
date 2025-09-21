const mc = require('minecraft-protocol')
const bufferEqual = require("buffer-equal");
const fs = require("fs");
const path = require("path");

const states = mc.states

const srv = mc.createServer({
    'online-mode': false,
    port: 25566,
    keepAlive: false,
    version: "1.16.5"
})

const projectPath = process.cwd()
const filePath = path.join(projectPath, "logs.txt")

const banPacket = "login declare_recipes update_light map_chunk tags declare_commands title chat teams boss_bar update_time keep_alive player_info" +
    " sound_effect playerlist_header transaction"

const seeSCPacket = false
const seeCSPacket = true

const entityID = 0

let firstConnect = true

fs.writeFileSync(filePath, "Старт\n")

srv.on('login', function (client) {
    const addr = client.socket.remoteAddress
    console.log('Incoming connection', '(' + addr + ')')
    let endedClient = false
    let endedTargetClient = false
    client.on('end', function () {
        endedClient = true
        console.log('Connection closed by client', '(' + addr + ')')
        if (!endedTargetClient) {
            targetClient.end('End')
        }
    })
    client.on('error', function (err) {
        endedClient = true
        console.log('Connection error by client', '(' + addr + ')')
        console.log(err.stack)
        if (!endedTargetClient) {
            targetClient.end('Error')
        }
    })
    const targetClient = mc.createClient({
        host: "mc.funtime.su",
        port: 25565,
        username: client.username,
        keepAlive: false,
        version: "1.16.5"
    })
    client.on('packet', function (data, meta) {//Твой ip


        if (targetClient.state === states.PLAY && meta.state === states.PLAY) {

            if (!endedTargetClient) {
                targetClient.write(meta.name, data)
            }

            if (banPacket.includes(meta.name) || !seeCSPacket) return
            const log = 'client->server:' + targetClient.state + '.' + meta.name + ' :' + JSON.stringify(data)
            console.log(log)
            let wr = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
            wr += log + "\n"
            //fs.writeFileSync(filePath, wr)


        }
    })


    targetClient.on('packet', function (data, meta) {
        if (meta.state === states.PLAY && client.state === states.PLAY) {

            if (!endedClient) {
                client.write(meta.name, data)
                if (meta.name === 'set_compression') {
                    client.compressionThreshold = data.threshold
                } // Set compression
            }
            if (meta.name === "login") {
                console.log(data.entityId)
            }

            if (banPacket.includes(meta.name) || !seeSCPacket) return
            const log = 'client<-server:' + targetClient.state + '.' + meta.name + ' :' + JSON.stringify(data)
            console.log(log)
            let wr = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
            wr += log + "\n"
            //fs.writeFileSync(filePath, wr)


        }
    })


    targetClient.on('end', function () {
        endedTargetClient = true
        console.log('Connection closed by server', '(' + addr + ')')
        if (!endedClient) {
            client.end('End')
        }
    })
    targetClient.on('error', function (err) {
        endedTargetClient = true
        console.log('Connection error by server', '(' + addr + ') ', err)
        console.log(err.stack)
        if (!endedClient) {
            client.end('Error')
        }
    })
})

