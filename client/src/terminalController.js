import ComponentsBuilder from "./components.js"
import { constants } from "./constants.js";

export default class TerminalController {

    #usersColors = new Map();

    constructor() {

    }

    #pickColor () {
        return "#" + ((1 << 24) * Math.random() | 0).toString(16) + "-fg"
    }

    #getUserColor (userName) {
        if (this.#usersColors.has(userName))
            return this.#usersColors.get(userName)

        const color = this.#pickColor();
        this.#usersColors.set(userName, color);

        return color;

    }

    #onInputReceived (eventEmitter) {
        return function () {
            const message = this.getValue()
            eventEmitter.emit(constants.events.app.MESSAGE_SEND, message)
            this.clearValue()
        }
    }

    #onMessageReceived ({ screen, chat }) {
        return event => {
            const { userName, message } = event;
            const color = this.#getUserColor(userName);
            chat.addItem(`{${color}}{bold}${userName}{/}: ${message}`);
            screen.render()
        }
    }

    #onLogChanged ({ screen, activityLog }) {
        return event => {
            // user join
            // user left
            const [userName] = event.split(/\s/)
            const color = this.#getUserColor(userName);
            activityLog.addItem(`{${color}}{bold}${event.toString()}{/}`);
            screen.render()
        }
    }

    #onStatusUpdated ({ screen, status }) {
        return users => {
            
            const { content } = status.items.shift();
            status.clearItems();
            status.addItem(content);

            users.forEach(userName => {
                const color = this.#getUserColor(userName);
                status.addItem(`{${color}}{bold}${userName}{/}`);
            })
            screen.render()
        }
    }

    #registerEvents (eventEmitter, components) {
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components))
        eventEmitter.on(constants.events.app.ACTIVITY_LOG_UPDATED, this.#onLogChanged(components))
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusUpdated(components))
    }

    async initializeTable (eventEmitter) {
        const components = new ComponentsBuilder()
            .setScreen({ title: "HackerChat - Week JS Expert" })
            .setLayoutComponent()
            .setInputComponent(this.#onInputReceived(eventEmitter))
            .setChatComponent()
            .setActivityLogComponent()
            .setStatusComponent()
            .build()

        this.#registerEvents(eventEmitter, components);

        components.input.focus();
        components.screen.render();
        

    }


}