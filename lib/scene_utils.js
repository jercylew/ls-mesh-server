const uuidUtils = require('../lib/uuid');
const Scene = require('../models/Scene');
const fs = require('fs');
const datetimeUtils = require('../lib/datetime_utils');
const modbusUtils = require('../lib/modbus_utils');

const SCENE_HEARTBEAT_TIMEOUT_MS = 300000;

let gMapHeartbeatTimer = new Map();

// For debug
function logMapElements(value, key, map) {
    console.log(`map[${key}] = ${value}`);
}

const updateDevInfo = (sceneId, inDevices) => {
    Scene.find({ gatewayId: sceneId }, (err, scenes) => { //There should be only one found ^_^
        if (err || scenes.length <= 0) {
            return;
        }

        if (scenes.length !== 1) {
            console.error(`Multiple scenes found with this id: ${sceneId}`);
            return;
        }

        const prevTimerIds = gMapHeartbeatTimer.get(sceneId);
        if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
            prevTimerIds.forEach((id, index) => {
                clearTimeout(id);
            });
            gMapHeartbeatTimer.delete(sceneId);
        }

        const devIds = inDevices.map((dev) => dev.devId);
        let updatedDevices = scenes[0].devices;
        updatedDevices = updatedDevices.filter((dev) => !devIds.includes(dev.devId));
        updatedDevices = updatedDevices.concat(inDevices);

        //Relay of/off logs
        let updatedRelayLogs = scenes[0].relayLogs ? scenes[0].relayLogs : [];
        inDevices.forEach((dev, index) => {
            if (dev.devType !== 'modbus_relay') {
                return;
            }

            const relayState = modbusUtils.getSingleDataValueInt(dev.dataInfo);
            if (relayState === 1) { // Relay switches on, start timing
                const foundIndex = updatedRelayLogs.findIndex(logItem =>
                    (logItem.relayId === dev.devId && !logItem.ended));
                if (foundIndex < 0) {
                    updatedRelayLogs.push({
                        relayId: dev.devId,
                        startTime: new Date(),
                        elapsed: 0,
                        ended: false
                    });
                }
                else {
                    updatedRelayLogs[foundIndex].elapsed = (new Date() - updatedRelayLogs[foundIndex].startTime) / 60000;
                    updatedRelayLogs[foundIndex].ended = false;
                }
            }
            else { // The relay now switched off, stop timing
                const foundIndex = updatedRelayLogs.findIndex(logItem =>
                    (logItem.relayId === dev.devId && !logItem.ended));
                if (foundIndex >= 0) {
                    updatedRelayLogs[foundIndex].elapsed = (new Date() - updatedRelayLogs[foundIndex].startTime) / 60000;
                    updatedRelayLogs[foundIndex].ended = true;
                }
            }
        });

        Scene.updateOne({ gatewayId: sceneId }, {
            $set: {
                devices: updatedDevices,
                online: true,
                relayLogs: updatedRelayLogs
            }
        }, null, (error, writeOpResult) => {
            if (error) {
                console.error('Failed to update scene with new devices: ', error);
                return;
            }
            console.log(`Update scene with device notify packet succeed: ${sceneId}, ${scenes[0].name}`);
            const timerId = setTimeout(() => {
                console.log('Timeout for keeping scene online status, resetting it to be offline: ', scenes[0].name);
                gMapHeartbeatTimer.forEach(logMapElements);
                Scene.updateOne({ gatewayId: sceneId }, {
                    $set: {
                        online: false,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene online status:', error);
                    }
                }
                ).then(null, null).catch(null);

                const existingTimerIds = gMapHeartbeatTimer.get(sceneId);
                if (existingTimerIds) {
                    existingTimerIds.forEach((id, index) => {
                        clearTimeout(id);
                    });
                }
                gMapHeartbeatTimer.delete(sceneId);
            }, SCENE_HEARTBEAT_TIMEOUT_MS);

            if (gMapHeartbeatTimer.has(sceneId)) {
                gMapHeartbeatTimer.get(sceneId).push(timerId);
            }
            else {
                gMapHeartbeatTimer.set(sceneId, [timerId]);
            }
        }
        );
            // .then((result) => {
            //     console.log(result);
            // },
            //     (error) => {
            //         console.log(error);
            //     })
            // .catch(error => console.log(error));
    });
        // .then((result) => {
        //     console.log(result);
        // },
        //     (error) => {
        //         console.log(error);
        //     })
        // .catch(error => console.log(error));
}

const updateEventLogs = (sceneId, logItem) => {
    Scene.find({ gatewayId: sceneId }, (err, scenes) => { //There should be only one found ^_^
        if (err || scenes.length <= 0) {
            return;
        }

        if (scenes.length !== 1) {
            console.error(`Multiple scenes found with this id: ${sceneId}`);
            return;
        }

        const prevTimerIds = gMapHeartbeatTimer.get(sceneId);
        if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
            prevTimerIds.forEach((id, index) => {
                clearTimeout(id);
            });
            gMapHeartbeatTimer.delete(sceneId);
        }

        let updatedLogs = scenes[0].eventLogs ? scenes[0].eventLogs : [];
        logItem.eventId = updatedLogs.length;
        updatedLogs.push(logItem);

        console.log('To update event logs: ', updatedLogs)
        Scene.updateOne({ gatewayId: sceneId }, {
            $set: {
                eventLogs: updatedLogs,
                online: true,
            }
        }, null, (error, writeOpResult) => {
            if (error) {
                console.error('Failed to update scene with new devices: ', error);
                return;
            }
            console.log(`Update scene with device notify packet succeed: ${sceneId}, ${scenes[0].name}`);
            const timerId = setTimeout(() => {
                console.log('Timeout for keeping scene online status, resetting it to be offline: ', scenes[0].name);
                gMapHeartbeatTimer.forEach(logMapElements);
                Scene.updateOne({ gatewayId: sceneId }, {
                    $set: {
                        online: false,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene online status:', error);
                    }
                }
                ).then(null, null).catch(null);

                const existingTimerIds = gMapHeartbeatTimer.get(sceneId);
                if (existingTimerIds) {
                    existingTimerIds.forEach((id, index) => {
                        clearTimeout(id);
                    });
                }
                gMapHeartbeatTimer.delete(sceneId);
            }, SCENE_HEARTBEAT_TIMEOUT_MS);

            if (gMapHeartbeatTimer.has(sceneId)) {
                gMapHeartbeatTimer.get(sceneId).push(timerId);
            }
            else {
                gMapHeartbeatTimer.set(sceneId, [timerId]);
            }
        }
        ).then(null, null).catch(null);
    })
        .then((result) => {
            console.log(result);
        },
            (error) => {
                console.log(error);
            })
        .catch(error => console.log(error));
};

module.exports = { updateDevInfo, updateEventLogs };
