import { constants } from "./constants.js";

export default class EventManager {
    #allUsers = new Map();

    constructor({ componentEmitter, socketClient }) {
        this.componentEmitter = componentEmitter;
        this.socketClient = socketClient;
    }

    joinRoomAndWaitForMessages (data) {
        this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data);

        this.componentEmitter
            .on(constants.events.app.MESSAGE_SEND, (message) => {
                console.log(message)
                this.socketClient.sendMessage(constants.events.socket.MESSAGE, message);
            });
    }

    updateUsers (users) {
        const connectedUsers = users;
        this.#allUsers = new Map();
        connectedUsers.forEach(({ id, userName }) => this.#allUsers.set(id, userName));
        this.#updateUsersComponent();
    }

    newUserConnected(message) {
        const user = message
        this.#allUsers.set(user.id, user.userName)
        this.#updateUsersComponent();
        this.#updateActivityLogComponent(`${user.userName} joined!`)
    }
  
    #emitComponentUpdate(event, message) {
        this.componentEmitter.emit(
            event,
           message
        )
    }

    #updateActivityLogComponent(message) {
        this.#emitComponentUpdate(
            constants.events.app.ACTIVITY_LOG_UPDATED,
            message
        )
    }


    #updateUsersComponent () {
        this.#emitComponentUpdate(
            constants.events.app.STATUS_UPDATED,
            Array.from(this.#allUsers.values())
        )
    }

    getEvents () {
        const functions = Reflect.ownKeys(EventManager.prototype)
            .filter(fn => fn !== 'constructor')
            .map(name => [name, this[name].bind(this)])

        return new Map(functions);

    }
}
