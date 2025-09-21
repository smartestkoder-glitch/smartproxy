const mc = require('minecraft-protocol')

const srv = mc.createServer({
    'online-mode': false,
    port: 25566,
    version: "1.16.5"
})

let mainClient = null         // главный клиент (тот кто реально идёт на целевой сервер)
let targetClient = null       // соединение к целевому серверу
const observers = []          // список наблюдателей

srv.on('login', (client) => {
    if (!mainClient) {
        // === Первый подключившийся — главный ===
        mainClient = client
        console.log('Main client connected:', client.username)

        targetClient = mc.createClient({
            host: "mc.funtime.su",
            port: 25565,
            username: client.username,
            version: "1.16.5"
        })

        // Пересылка пакетов от главного к серверу
        client.on('packet', (data, meta) => {
            if (targetClient.state === mc.states.PLAY && meta.state === mc.states.PLAY) {
                targetClient.write(meta.name, data)
            }
        })

        // Сервер → главный + наблюдатели
        targetClient.on('packet', (data, meta) => {
            if (meta.state === mc.states.PLAY) {
                // отправляем главному
                if (mainClient.state === mc.states.PLAY) mainClient.write(meta.name, data)
                // отправляем наблюдателям
                observers.forEach(obs => {
                    if (obs.state === mc.states.PLAY) obs.write(meta.name, data)
                })
            }
        })

    } else {
        // === Все последующие — наблюдатели ===
        observers.push(client)
        console.log('Observer joined:', client.username)

        // блокируем их исходящие пакеты
        client.on('packet', (data, meta) => {
            // ничего не делаем!
        })
    }
})
