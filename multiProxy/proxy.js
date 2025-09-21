const mc = require('minecraft-protocol')
const bufferEqual = require("buffer-equal");
const fs = require("fs");
const path = require("path");

const states = mc.states


function encodeAngle(deg) {
    let d = ((deg % 360) + 540) % 360 - 180;
    // масштабируем в -128..127
    return Math.floor(d * 256 / 360);
}



const srv = mc.createServer({
    'online-mode': false,
    port: 25566,
    keepAlive: false,
    version: "1.16.5"
})

const projectPath = process.cwd()
const filePath = path.join(projectPath, "logs.txt")

let clientList = []

let entityid = 0

let firstConnect = true

const firstId = 0
srv.on('login', function (client) {

    clientList.push(client)

    const addr = client.socket.remoteAddress
    console.log('Incoming connection', '(' + addr + ')')
    if (firstConnect) {
        let endedClient = false
        firstConnect = false
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
            //if (meta.name === "keep_alive") return console.log("ping")
            //if (meta.name === "keep-alive") return console.log("ping")


            if (targetClient.state === states.PLAY && meta.state === states.PLAY) {

                if (meta.name === 'position' || meta.name === 'look'  || meta.name === 'position_look') {
//                        for (const obs of clientList) {
                    if (clientList.length > 1) {
                        if (meta.name === "position") {
                            clientList[1].write('entity_teleport', {
                                entityId: entityid,
                                x: data.x,
                                y: data.y,
                                z: data.z,

                                onGround: data.onGround
                            })
                        }
                        if (meta.name === "position_look") {
                            clientList[1].write('entity_teleport', {
                                entityId: entityid,
                                x: data.x,
                                y: data.y,
                                z: data.z,

                                onGround: data.onGround
                            })
                        }

                    }

                }



                if (!endedTargetClient) {

                    targetClient.write(meta.name, data)
                }
                if (meta.name !== "") return
                return

                const log = 'client->server:' + targetClient.state + '.' + meta.name + ' :' + JSON.stringify(data)
                console.log(log)
                let wr = fs.readFileSync(filePath, {encoding: 'utf8', flag: 'r'});
                wr += log + "\n"
                fs.writeFileSync(filePath, wr)


            }
        })


        targetClient.on('packet', function (data, meta) {
            for (const clnt of clientList) {
                if (meta.state === states.PLAY && client.state === states.PLAY) {
                    //if (meta.name === "keep_alive") return console.log("ping")
                    //if (meta.name === "keep-alive") return console.log("ping")
                    if (meta.name === "login") entityid = data.entityId

                    //   }
                    if (!endedClient) {

                        clnt.write(meta.name, data)
                        if (meta.name === 'set_compression') {
                            client.compressionThreshold = data.threshold
                        } // Set compression
                    }
                    continue
                    const log = 'client<-server:' + targetClient.state + '.' + meta.name + ' :' + JSON.stringify(data)
                    console.log(log)
                    let wr = fs.readFileSync(filePath, {encoding: 'utf8', flag: 'r'});
                    wr += log + "\n"
                    fs.writeFileSync(filePath, wr)


                }
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
    }
    else {
        /*const targetClient = mc.createClient({
            host: "localhost",
            port: 25566,
            username: client.username,
            keepAlive: false,
            version: "1.16.5"
        })*/
        //targetClient.write("look", {"yaw":-86.55000305175781,"pitch":-2.250000238418579,"onGround":true})
    }
})

