import { constants } from "./constants.js";
export default class Controller {

    #users = new Map();
    #rooms = new Map();

    constructor({ socketServer }) {
        this.socketServer = socketServer;
    }

    onNewConnection (socket) {
        const { id } = socket;
        console.log('connection stablished with', id)

        const userData = { id, socket };
        this.#updateGlobalUserData(id, userData);

        socket.on('data', this.#onSocketData(id))
        socket.on('error', this.#onSocketClosed(id))
        socket.on('end', this.#onSocketClosed(id))

    }

    async joinRoom (socketId, userData) {
        console.log(`${userData.userName} joined!`, socketId)

        const { roomId } = userData;


        const user = this.#updateGlobalUserData(socketId, userData);
        const users = this.#joinUserOnRoom(roomId, user);


        const currentUsers = Array.from(users.values())
            .map(({ id, userName }) => ({ id, userName }))

        // atualiza o usuário que conectou 
        // quais usuários ja estão conectados na mesma sala
        this.socketServer.sendMessage(user.socket, constants.event.UPDATE_USERS, currentUsers)

        // avisa a rede que um novo usuário conectou

        this.broadcast({
            roomId,
            socketId,
            message: { id: socketId, userName: userData.userName },
            event: constants.event.NEW_USER_CONNECTED
        })


    }

    broadcast ({ roomId, socketId, event, message, includeCurrentSocket = false }) {

        const usersOnRoom = this.#rooms.get(roomId);

        for (const [key, user] of usersOnRoom) {
            if (!includeCurrentSocket && key === socketId) continue;

            this.socketServer.sendMessage(user.socket, event, message)
        }
    }

    #joinUserOnRoom (roomId, user) {
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
        usersOnRoom.set(user.id, user);
        this.#rooms.set(roomId, usersOnRoom);

        return usersOnRoom;
    }

    #onSocketData (id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data);
                this[event](id, message);
            } catch (error) {
                console.error(`wrong event format!!`, error, data.toString())
            }
        }
    }

    #onSocketClosed (id) {
        return data => {
            console.log('onSocketClosed', id)
        }
    }

    #updateGlobalUserData (socketId, userData) {
        const users = this.#users;
        const user = users.get(socketId) ?? {}

        const updatedUserData = {
            ...user,
            ...userData
        }

        users.set(socketId, updatedUserData)

        return users.get(socketId)
    }
}