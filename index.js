import { createServer, createClient } from "minecraft-protocol";

const proxy = createServer({
    'online-mode': false,
    host: '0.0.0.0',
    port: 25566,
    version: '1.20.1'
});

proxy.on('login', client => {
    console.log(`[PROXY] Игрок зашел: ${client.username}`);

    const server = createClient({
        host: "testpacket.aternos.me",
        port: 30343,  // твой локальный LAN мир
        username: client.username,
        version: '1.20.1',
        auth: 'offline'
    });

    client.on('packet', (data, meta) => {
        console.log("C->S", meta.name, data);
        server.write(meta.name, data);
    });

    server.on('packet', (data, meta) => {
        console.log("S->C", meta.name, data);
        client.write(meta.name, data);
    });

    // keep_alive пробрасываем явно
    /*server.on('keep_alive', (packet) => {
        console.log("S->C keep_alive", packet);
        client.write('keep_alive', { keepAliveId: packet.keepAliveId });
    });

    client.on('keep_alive', (packet) => {
        console.log("C->S keep_alive", packet);
        server.write('keep_alive', { keepAliveId: packet.keepAliveId });
    });*/

    server.on('end', () => console.log("[PROXY] Сервер закрыл соединение"));
    server.on('error', err => console.log("[PROXY] Ошибка сервера:", err));
});

proxy.on('error', err => console.log("[PROXY] Ошибка прокси:", err));
