/**
node index.js \
    --username user \
    --room room01 \
    --hostUri localhost
 */

import Events from "events";

import CliConfig from "./src/cliConfig.js";
import EventManager from "./src/eventManager.js";
import SocketClient from "./src/socket.js";
import TerminalController from "./src/terminalController.js";

const [, , ...commands] = process.argv;

const config = CliConfig.parseArguments(commands);

const componentEmitter = new Events();
const socketClient = new SocketClient(config);
await socketClient.initialize();
const eventMessage = new EventManager({ componentEmitter, socketClient })
const events = eventMessage.getEvents();
socketClient.attachEvents(events);

const data = {
    roomId: config.room,
    userName: config.username,
}

eventMessage.joinRoomAndWaitForMessages(data);

const controller = new TerminalController();
await controller.initializeTable(componentEmitter);



