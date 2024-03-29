const mqtt = require('mqtt');
const uuidUtils = require('../lib/uuid');
const Scene = require('../models/Scene');
const fs = require('fs');
const datetimeUtils = require('../lib/datetime_utils');
const modbusUtils = require('../lib/modbus_utils');
const commandUtils = require('../lib/command_utils');
const logUtils = require('../lib/log_utils');

const SCENE_HEARTBEAT_TIMEOUT_MS = 300000;

// Jiulong Devices
const MQTT_TOPIC_JL_CMD_PREFIX = '/host/cmd';
const MQTT_TOPIC_DEVICE_REPORT = 'device_report';
const MQTT_TOPIC_HOST_HEARTBEAT = '/host/heartbeat';
const MQTT_TOPIC_DEVICE_HEARTBEAT = 'heartbeat';

// Lengshuo Devices
// Refrigetr, sale table
const MQTT_TOPIC_SALE_TABLE_STATUS = '$thing/up/status/sale_table';
const MQTT_TOPIC_SALE_TABLE_PROPERTY = '$thing/up/property/sale_table';
const MQTT_TOPIC_REFRG_STATUS = '$thing/up/status/refrigerator';
const MQTT_TOPIC_REFRG_PROPERTY = '$thing/up/property/refrigerator';
const MQTT_TOPIC_REFRG_DIRECT_COOL_STATUS = '$thing/up/status/DirectCooling';
const MQTT_TOPIC_REFRG_DIRECT_COOL_PROPERTY = '$thing/up/property/DirectCooling';
const MQTT_TOPIC_SALE_TABLE_TIME = '$thing/down/control/TimeSyn/';
const MQTT_TOPIC_LS_DEVICE_STATUS = 'device/report/status';
const MQTT_TOPIC_LS_DEVICE_NOTIFY = 'device/report/notify';
const MQTT_TOPIC_LS_CMD_PREFIX = '/host/cmd';
const MQTT_TOPIC_LS_HOST_HEARTBEAT = '/host/heartbeat';
const MQTT_TOPIC_LS_DEVICE_HEARTBEAT = 'heartbeat';

//Global instance of mqtt client
let gMqttClientJiulong = null;
let gMapSceneHeartbeatTimer = new Map();
let gMqttClientLengshuo = null;

// For debug
function logMapElements(value, key, map) {
    console.log(`map[${key}] = ${value}`);
}

const connectToJiulongBroker = () => {
    if (gMqttClientJiulong) {
        console.log('Mqtt client for Jiulong created, no need to re-create a new one');
        return;
    }

    const clientId = 'ls_mesh_server_' + uuidUtils.uuidv4();
    console.log('Now trying to connect to mqtt Jiulong broker, clientId: ', clientId);
    gMqttClientJiulong = mqtt.connect("mqtt://gateway.iot.jiulong-aiot.com",
        { clientId: clientId, username: "iot_5eff1332b889d", password: "1234123412341234", clean: true });

    gMqttClientJiulong.on('message', function (topic, message, packet) {
        if (topic === MQTT_TOPIC_HOST_HEARTBEAT) {
            const sceneInfo = JSON.parse(message);
            const prevTimerIds = gMapSceneHeartbeatTimer.get(sceneInfo.id);
            if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
                prevTimerIds.forEach((id, index) => {
                    clearTimeout(id);
                });
                gMapSceneHeartbeatTimer.delete(sceneInfo.id);
            }

            try {
                Scene.updateOne({ gatewayId: sceneInfo.id }, {
                    $set: {
                        name: sceneInfo.name,
                        address: sceneInfo.address,
                        frpPort: sceneInfo.frp_port,
                        online: true,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene with host heartbeat packet: ', error);
                        return;
                    }
                    console.log(`Update scene with host heartbeat packet succeed: ${sceneInfo.id}, ${sceneInfo.name}`);
                    const timerId = setTimeout(() => {
                        console.log('Timeout for keeping scene online status, resetting it to be offline: ', sceneInfo.name);
                        gMapSceneHeartbeatTimer.forEach(logMapElements);
                        Scene.updateOne({ gatewayId: sceneInfo.id }, {
                            $set: {
                                online: false,
                            }
                        }, null, (error, writeOpResult) => {
                            if (error) {
                                console.error('Failed to update scene online status:', error);
                            }
                        }
                        );

                        const existingTimerIds = gMapSceneHeartbeatTimer.get(sceneInfo.id);
                        if (existingTimerIds) {
                            existingTimerIds.forEach((id, index) => {
                                clearTimeout(id);
                            });
                        }
                        gMapSceneHeartbeatTimer.delete(sceneInfo.id);
                    }, SCENE_HEARTBEAT_TIMEOUT_MS);

                    if (gMapSceneHeartbeatTimer.has(sceneInfo.id)) {
                        gMapSceneHeartbeatTimer.get(sceneInfo.id).push(timerId);
                    }
                    else {
                        gMapSceneHeartbeatTimer.set(sceneInfo.id, [timerId]);
                    }
                }
                );
            }
            catch (error) {
                console.log('Scene info failed to updated: ', error);
            }
        }
        else if (topic === MQTT_TOPIC_DEVICE_HEARTBEAT) {
            const devicesInfo = JSON.parse(message);
            const action = devicesInfo.action;
            const newDevices = devicesInfo.devices ? devicesInfo.devices.map(device => {
                if (device.type === 'camera') {
                    return {
                        devId: device.device_identifier,
                        devType: device.type,
                        dataInfo: `ON=${device.ffmpeg_on},RTSP=${device.camera_rtsp_source}`,
                        devKind: 'camera',
                        lastUpdated: new Date(parseInt(device.ffmpeg_last_start_time))
                    };
                }
                else {
                    return {
                        devId: device.device_identifier,
                        devType: device.type,
                        dataInfo: device.data_text,
                        devKind: device.node_kind,
                        status: device.status,
                        lastUpdated: new Date()
                    };
                }
            }) : [];
            const logFiles = devicesInfo.log_files ? devicesInfo.log_files.map(file => {
                return {
                    name: file.name,
                    size: file.size,
                    lastUpdated: new Date(Date.parse(file.last_updated)),
                };
            }) : [];
            const prevTimerIds = gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier);
            if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
                prevTimerIds.forEach((id, index) => {
                    clearTimeout(id);
                });
                gMapSceneHeartbeatTimer.delete(devicesInfo.gateway_identifier);
            }

            try {
                if (action === 'check') {
                    Scene.find({ gatewayId: devicesInfo.gateway_identifier }, (err, scenes) => {
                        if (err || scenes.length <= 0) {
                            return;
                        }

                        Scene.updateOne({ gatewayId: devicesInfo.gateway_identifier }, {
                            $set: {
                                logFiles: logFiles,
                                devices: newDevices,
                                online: true,
                            }
                        }, null, (error, writeOpResult) => {
                            if (error) {
                                console.error('Failed to update scene with host heartbeat packet: ', error);
                                return;
                            }
                            console.log(`Update scene with device heartbeat packet succeed: ${devicesInfo.gateway_identifier}, ${devicesInfo.scene_name}`);
                            const timerId = setTimeout(() => {
                                console.log('Timeout for keeping scene online status, resetting it to be offline: ', devicesInfo.scene_name);
                                gMapSceneHeartbeatTimer.forEach(logMapElements);
                                Scene.updateOne({ gatewayId: devicesInfo.gateway_identifier }, {
                                    $set: {
                                        online: false,
                                    }
                                }, null, (error, writeOpResult) => {
                                    if (error) {
                                        console.error('Failed to update scene online status:', error);
                                    }
                                }
                                );

                                const existingTimerIds = gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier);
                                if (existingTimerIds) {
                                    existingTimerIds.forEach((id, index) => {
                                        clearTimeout(id);
                                    });
                                }
                                gMapSceneHeartbeatTimer.delete(devicesInfo.gateway_identifier);
                            }, SCENE_HEARTBEAT_TIMEOUT_MS);

                            if (gMapSceneHeartbeatTimer.has(devicesInfo.gateway_identifier)) {
                                gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier).push(timerId);
                            }
                            else {
                                gMapSceneHeartbeatTimer.set(devicesInfo.gateway_identifier, [timerId]);
                            }
                        }
                        );
                    });
                }
            }
            catch (error) {
                console.log('Scene info failed to updated: ', error);
            }
        }
        else if (topic === MQTT_TOPIC_DEVICE_REPORT) {
            console.log("Processing device REPORT packet:" + message);
        }
        else {
            console.log('Unknown mqtt message');
        }
    });

    gMqttClientJiulong.on("connect", function () {
        console.log("connected  " + gMqttClientJiulong.connected);
        gMqttClientJiulong.subscribe(MQTT_TOPIC_HOST_HEARTBEAT);
        gMqttClientJiulong.subscribe(MQTT_TOPIC_DEVICE_HEARTBEAT);
        // gMqttClientJiulong.subscribe(MQTT_TOPIC_DEVICE_REPORT); //TODO, use this one for device status update instead
    })

    //handle errors
    gMqttClientJiulong.on("error", function (error) {
        console.log("Can't connect" + error);
    });
};

const updateDevInfo = (sceneId, inDevices) => {
    Scene.find({ gatewayId: sceneId }, (err, scenes) => { //There should be only one found ^_^
        if (err || scenes.length <= 0) {
            return;
        }

        if (scenes.length !== 1) {
            console.error(`Multiple scenes found with this id: ${sceneId}`);
            return;
        }

        const prevTimerIds = gMapSceneHeartbeatTimer.get(sceneId);
        if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
            prevTimerIds.forEach((id, index) => {
                clearTimeout(id);
            });
            gMapSceneHeartbeatTimer.delete(sceneId);
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
                    updatedRelayLogs[foundIndex].elapsed = (new Date() - updatedRelayLogs[foundIndex].startTime)/60000;
                    updatedRelayLogs[foundIndex].ended = false;
                }
            }
            else { // The relay now switched off, stop timing
                const foundIndex = updatedRelayLogs.findIndex(logItem =>
                    (logItem.relayId === dev.devId && !logItem.ended));
                if (foundIndex >= 0) {
                    updatedRelayLogs[foundIndex].elapsed = (new Date() - updatedRelayLogs[foundIndex].startTime)/60000;
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
                gMapSceneHeartbeatTimer.forEach(logMapElements);
                Scene.updateOne({ gatewayId: sceneId }, {
                    $set: {
                        online: false,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene online status:', error);
                    }
                }
                );

                const existingTimerIds = gMapSceneHeartbeatTimer.get(sceneId);
                if (existingTimerIds) {
                    existingTimerIds.forEach((id, index) => {
                        clearTimeout(id);
                    });
                }
                gMapSceneHeartbeatTimer.delete(sceneId);
            }, SCENE_HEARTBEAT_TIMEOUT_MS);

            if (gMapSceneHeartbeatTimer.has(sceneId)) {
                gMapSceneHeartbeatTimer.get(sceneId).push(timerId);
            }
            else {
                gMapSceneHeartbeatTimer.set(sceneId, [timerId]);
            }
        }
        );
    });
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

        const prevTimerIds = gMapSceneHeartbeatTimer.get(sceneId);
        if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
            prevTimerIds.forEach((id, index) => {
                clearTimeout(id);
            });
            gMapSceneHeartbeatTimer.delete(sceneId);
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
                gMapSceneHeartbeatTimer.forEach(logMapElements);
                Scene.updateOne({ gatewayId: sceneId }, {
                    $set: {
                        online: false,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene online status:', error);
                    }
                }
                );

                const existingTimerIds = gMapSceneHeartbeatTimer.get(sceneId);
                if (existingTimerIds) {
                    existingTimerIds.forEach((id, index) => {
                        clearTimeout(id);
                    });
                }
                gMapSceneHeartbeatTimer.delete(sceneId);
            }, SCENE_HEARTBEAT_TIMEOUT_MS);

            if (gMapSceneHeartbeatTimer.has(sceneId)) {
                gMapSceneHeartbeatTimer.get(sceneId).push(timerId);
            }
            else {
                gMapSceneHeartbeatTimer.set(sceneId, [timerId]);
            }
        }
        );
    });
};

const connectToLengshuoBroker = () => {
    if (gMqttClientLengshuo) {
        console.log('Mqtt client for Lengshuo created, no need to re-create a new one');
        return;
    }

    if (!fs.existsSync(logUtils.LOG_FILE_DIRECTORY)) {
        fs.mkdirSync(logUtils.LOG_FILE_DIRECTORY);
    }

    const clientId = 'ls_mesh_server_' + uuidUtils.uuidv4();
    console.log('Now trying to connect to Lengshuo mqtt broker, clientId: ', clientId);
    gMqttClientLengshuo = mqtt.connect("mqtt://127.0.0.1",
        { clientId: clientId, username: "tkt_iot_user", password: "tkt1qazm,./", clean: true });

    gMqttClientLengshuo.on('message', function (topic, message, packet) {
        // const nowTimeText = (new Date()).toLocaleTimeString('zh-CN');
        // const messageForLog = `${nowTimeText}     ${message}\n`;
        // if (topic === MQTT_TOPIC_SALE_TABLE_STATUS) {
        //     logMessageToFile(messageForLog, `out_sale_table_status_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     console.log(`Saletable redirect ${message}`);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        // else if (topic === MQTT_TOPIC_SALE_TABLE_PROPERTY) {
        //     logMessageToFile(messageForLog, `out_sale_table_property_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        // else if (topic === MQTT_TOPIC_REFRG_STATUS) {
        //     logMessageToFile(messageForLog, `out_refrgtr_status_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     console.log(`Refrigetor status redirect ${message}`);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        // else if (topic === MQTT_TOPIC_REFRG_PROPERTY) {
        //     logMessageToFile(messageForLog, `out_refrgtr_property_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        // else if (topic === MQTT_TOPIC_REFRG_DIRECT_COOL_STATUS) {
        //     logMessageToFile(messageForLog, `out_refrgtr_dc_status_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        // else if (topic === MQTT_TOPIC_REFRG_DIRECT_COOL_PROPERTY) {
        //     logMessageToFile(messageForLog, `out_refrgtr_dc_property_${datetimeUtils.todayDate()}.log`);
        //     const devInfo = JSON.parse(message);
        //     gMqttClientJiulong.publish(`device_tx/daguan/${devInfo.device_id}`, message, {
        //         retain: false,
        //         qos: 1
        //     });
        // }
        if (topic === MQTT_TOPIC_LS_HOST_HEARTBEAT) {
            const sceneInfo = JSON.parse(message);
            const prevTimerIds = gMapSceneHeartbeatTimer.get(sceneInfo.id);
            if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
                prevTimerIds.forEach((id, index) => {
                    clearTimeout(id);
                });
                gMapSceneHeartbeatTimer.delete(sceneInfo.id);
            }

            try {
                Scene.updateOne({ gatewayId: sceneInfo.id }, {
                    $set: {
                        name: sceneInfo.name,
                        address: sceneInfo.address,
                        frpPort: sceneInfo.frp_port,
                        online: true,
                    }
                }, null, (error, writeOpResult) => {
                    if (error) {
                        console.error('Failed to update scene with host heartbeat packet: ', error);
                        return;
                    }
                    console.log(`Update scene with host heartbeat packet succeed: ${sceneInfo.id}, ${sceneInfo.name}`);
                    const timerId = setTimeout(() => {
                        console.log('Timeout for keeping scene online status, resetting it to be offline: ', sceneInfo.name);
                        gMapSceneHeartbeatTimer.forEach(logMapElements);
                        Scene.updateOne({ gatewayId: sceneInfo.id }, {
                            $set: {
                                online: false,
                            }
                        }, null, (error, writeOpResult) => {
                            if (error) {
                                console.error('Failed to update scene online status:', error);
                            }
                        }
                        );

                        const existingTimerIds = gMapSceneHeartbeatTimer.get(sceneInfo.id);
                        if (existingTimerIds) {
                            existingTimerIds.forEach((id, index) => {
                                clearTimeout(id);
                            });
                        }
                        gMapSceneHeartbeatTimer.delete(sceneInfo.id);
                    }, SCENE_HEARTBEAT_TIMEOUT_MS);

                    if (gMapSceneHeartbeatTimer.has(sceneInfo.id)) {
                        gMapSceneHeartbeatTimer.get(sceneInfo.id).push(timerId);
                    }
                    else {
                        gMapSceneHeartbeatTimer.set(sceneInfo.id, [timerId]);
                    }
                }
                );
            }
            catch (error) {
                console.log('Scene info failed to updated: ', error);
            }
        }
        else if (topic === MQTT_TOPIC_LS_DEVICE_HEARTBEAT) {
            const devicesInfo = JSON.parse(message);
            const action = devicesInfo.action;
            const newDevices = devicesInfo.devices ? devicesInfo.devices.map(device => {
                if (device.type === 'camera') {
                    return {
                        devId: device.device_identifier,
                        devType: device.type,
                        dataInfo: `ON=${device.ffmpeg_on},RTSP=${device.camera_rtsp_source}`,
                        devKind: 'camera',
                        lastUpdated: new Date(parseInt(device.ffmpeg_last_start_time))
                    };
                }
                else {
                    return {
                        devId: device.device_identifier,
                        devType: device.type,
                        dataInfo: device.data_text,
                        devKind: device.node_kind,
                        status: device.status,
                        lastUpdated: new Date()
                    };
                }
            }) : [];
            const logFiles = devicesInfo.log_files ? devicesInfo.log_files.map(file => {
                return {
                    name: file.name,
                    size: file.size,
                    lastUpdated: new Date(Date.parse(file.last_updated)),
                };
            }) : [];
            const prevTimerIds = gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier);
            if (prevTimerIds) { // If new message arrived before timeout, clear the timer of setting offline
                prevTimerIds.forEach((id, index) => {
                    clearTimeout(id);
                });
                gMapSceneHeartbeatTimer.delete(devicesInfo.gateway_identifier);
            }

            try {
                if (action === 'check') {
                    Scene.find({ gatewayId: devicesInfo.gateway_identifier }, (err, scenes) => {
                        if (err || scenes.length <= 0) {
                            return;
                        }

                        Scene.updateOne({ gatewayId: devicesInfo.gateway_identifier }, {
                            $set: {
                                logFiles: logFiles,
                                devices: newDevices,
                                online: true,
                            }
                        }, null, (error, writeOpResult) => {
                            if (error) {
                                console.error('Failed to update scene with host heartbeat packet: ', error);
                                return;
                            }
                            console.log(`Update scene with device heartbeat packet succeed: ${devicesInfo.gateway_identifier}, ${devicesInfo.scene_name}`);
                            const timerId = setTimeout(() => {
                                console.log('Timeout for keeping scene online status, resetting it to be offline: ', devicesInfo.scene_name);
                                gMapSceneHeartbeatTimer.forEach(logMapElements);
                                Scene.updateOne({ gatewayId: devicesInfo.gateway_identifier }, {
                                    $set: {
                                        online: false,
                                    }
                                }, null, (error, writeOpResult) => {
                                    if (error) {
                                        console.error('Failed to update scene online status:', error);
                                    }
                                }
                                );

                                const existingTimerIds = gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier);
                                if (existingTimerIds) {
                                    existingTimerIds.forEach((id, index) => {
                                        clearTimeout(id);
                                    });
                                }
                                gMapSceneHeartbeatTimer.delete(devicesInfo.gateway_identifier);
                            }, SCENE_HEARTBEAT_TIMEOUT_MS);

                            if (gMapSceneHeartbeatTimer.has(devicesInfo.gateway_identifier)) {
                                gMapSceneHeartbeatTimer.get(devicesInfo.gateway_identifier).push(timerId);
                            }
                            else {
                                gMapSceneHeartbeatTimer.set(devicesInfo.gateway_identifier, [timerId]);
                            }
                        }
                        );
                    });
                }
            }
            catch (error) {
                console.log('Scene info failed to updated: ', error);
            }
        }
        else if (topic === MQTT_TOPIC_LS_DEVICE_NOTIFY) {
            const deviceInfo = JSON.parse(message);
            const devSaveDataBase = {
                devId: deviceInfo.device_identifier,
                devType: deviceInfo.type,
                devKind: deviceInfo.node_kind,
                lastUpdated: new Date()
            };

            if (deviceInfo.type === 'modbus') {
                const subDevs = deviceInfo.channels;
                const newModbusDevs = subDevs.map((sd, index) => {
                    const subDevType = sd.devType//modbusUtils.getTypeFromName(sd.name);
                    const dataInfo = sd.dataInfo//modbusUtils.getDataInfo(sd);
                    const devId = sd.devId//modbusUtils.getDevId(deviceInfo.port_name, sd);

                    let devSaveData = {...devSaveDataBase}
                    devSaveData.devId = devId;
                    devSaveData.dataInfo = dataInfo;
                    devSaveData.status = 0;
                    devSaveData.devType = subDevType;
                    return devSaveData;
                });
                updateDevInfo(deviceInfo.gateway_identifier, newModbusDevs);
            }
            if (deviceInfo.type === 'refrg_temp_hum_sensor') {
                const dataInfo = `TEMP1: ${deviceInfo.temperature1}, TEMP2: ${deviceInfo.temperature2}, HUMI1: ${deviceInfo.humidity1}, HUMI2: ${deviceInfo.humidity2}, Vol: ${deviceInfo.voltage}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'pm_sensor') {
                // console.log('PM Sensor: ', deviceInfo);
                const dataInfo = `PM2.5: ${deviceInfo.pm25}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'co1_sensor') {
                const dataInfo = `CO1: ${deviceInfo.co1}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'formaldehyde_sensor') {
                const dataInfo = `FORMALDEHYDE: ${deviceInfo.formaldehyde}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'temp_hum_sensor') {
                const dataInfo = `TEMP: ${deviceInfo.temperature},HUMI: ${deviceInfo.humidity}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'real_motion_sensor') {
                // console.log('Real motion sensor: ', deviceInfo);
                const dataInfo = `TRIGGERED: ${deviceInfo.triggered}`;
                let deviceSaveData = {...devSaveDataBase};
                deviceSaveData.dataInfo = dataInfo;
                deviceSaveData.status = deviceInfo.online ? 0 : 1;
                updateDevInfo(deviceInfo.gateway_identifier, [deviceSaveData]);
            }
            if (deviceInfo.type === 'event') {
                const errEventItem = deviceInfo.data;
                let errorLogItem = {
                    level: errEventItem.level,
                    message: errEventItem.message,
                    eventType: errEventItem.type,
                    causedBy: errEventItem.caused_by
                };

                errorLogItem.startTime = new Date();
                updateEventLogs(deviceInfo.gateway_identifier, errorLogItem);

                // Open this when leak current precison issue fixed
                // if (errorLogItem.level > 0) {
                //     // Now turn on alarming light
                //     const devId = 88; //TODO: get it from config json file
                //     const sceneId = '22b9b51b2a-97a44c';
                //     const host_id = sceneId.substring(0, 10);

                //     let commandData = {
                //         mesh_uuid: '00000000000000000000000000000000',
                //         bluetooth_address: devId,
                //         cmd: 'on',
                //         duration: 10000,
                //     };

                //     const alarmOnCmd = {
                //         topic: 'request',
                //         command: 'luminaire_control',
                //         data: commandData
                //     };

                //     commandUtils.sendCommand(host_id, alarmOnCmd);
                // }
            }
        }
        else if (topic === MQTT_TOPIC_LS_DEVICE_STATUS) {
            const deviceInfo = JSON.parse(message);
            // console.log('Received LS device status message: ', deviceInfo);
            logUtils.lsDebugMessage('MQTT Device Notify', deviceInfo);
        }
        else if (topic === MQTT_TOPIC_SALE_TABLE_TIME) {
            const timeControlInfo = JSON.parse(message);
            console.log('Received LS time sync command: ', timeControlInfo);

            const devId = timeControlInfo.device_id;
            const method = timeControlInfo.method;
            /**
             {"device_id":"LS_1000FC","method":"Get time"}
             */
            if (method === 'Get time') {
                const timeMessage = {
                    device_id: devId,
                    method: 'set_time',
                    params: {
                        Now_Time: datetimeUtils.dateToDateTimeString(new Date())
                    }
                };
                console.log('Request time sync command from device: ', devId, ', now send time: ', timeMessage);
                gMqttClientLengshuo.publish(MQTT_TOPIC_SALE_TABLE_TIME, JSON.stringify(timeMessage), {
                    retain: false,
                    qos: 1
                });
            }
        }
        else {
            console.log('Unknown mqtt message');
        }
    });

    gMqttClientLengshuo.on("connect", function () {
        console.log("connected  " + gMqttClientLengshuo.connected);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_SALE_TABLE_STATUS);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_SALE_TABLE_PROPERTY);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_STATUS);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_PROPERTY);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_DIRECT_COOL_STATUS);
        // gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_DIRECT_COOL_PROPERTY);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_LS_DEVICE_STATUS);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_LS_DEVICE_NOTIFY);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_SALE_TABLE_TIME);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_LS_HOST_HEARTBEAT);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_LS_DEVICE_HEARTBEAT);

        //Publish time to sale tables
        const timeMessage = {
            device_id: 'LS_FFFFFF',
            method: 'set_time',
            params: {
                Now_Time: datetimeUtils.dateToDateTimeString(new Date())
            }
        };

        console.log('To publish time: ', timeMessage);

        gMqttClientLengshuo.publish(MQTT_TOPIC_SALE_TABLE_TIME, JSON.stringify(timeMessage), {
            retain: false,
            qos: 1
        });
    })

    gMqttClientLengshuo.on("error", function (error) {
        console.log("Can't connect" + error);
    });
};

const connectMqtt = () => {
    // connectToJiulongBroker();
    connectToLengshuoBroker();

    // At Start/Restart moment: reinit the online status
    Scene.updateMany(null, {
        $set: {
            online: false,
        }
    }, null, (error, writeOpResult) => {
        if (error) {
            console.error('Failed to init scene online status: ', error);
        }
    });
};

const publish = (topic, msg, client, options) => {
    console.log("publishing", msg);

    if (client.connected) {
        client.publish(topic, msg, options);
    }
};

const sendHostCmd = (id, cmdPayload) => {
    // Note: There are currently two MQTT brokers, one is Jiulong, the other one is Lengshuo,
    // Some hosts (mostly for Jiulong scenes) connected to Jiulong broker, others connected to Lengshuo,
    // to make sure the hosts we want to control receive the command, send to both brokers (We do not maintain
    // a list of host mqtt_broker association record )
    // publish(`${MQTT_TOPIC_JL_CMD_PREFIX}/${id}`, cmdPayload, gMqttClientJiulong, {
    //     retain: false,
    //     qos: 1
    // });
    publish(`${MQTT_TOPIC_LS_CMD_PREFIX}/${id}`, cmdPayload, gMqttClientLengshuo, {
        retain: false,
        qos: 1
    });
};

// setInterval(() => {
//     if (!gMqttClientJiulong) {
//         console.log('Mqtt client for Jiulong not created, wait for a while!');
//         return;
//     }

//     if (gMqttClientJiulong.connected) {
//         console.log('Mqtt client for Jiulong  still connected, no need to re-connect');
//         return;
//     }

//     console.log('Mqtt  client for Jiulong disconected from server, trying to reconnect now');
//     gMqttClientJiulong.reconnect();
// }, 10000);

setInterval(() => {
    if (!gMqttClientLengshuo) {
        console.log('Mqtt client for Lengshuo not created, wait for a while!');
        return;
    }

    if (gMqttClientLengshuo.connected) {
        console.log('Mqtt client for Lengshuo still connected, no need to re-connect');
        return;
    }

    console.log('Mqtt client for Lengshuo disconected from server, trying to reconnect now');
    gMqttClientLengshuo.reconnect();
}, 10000);

module.exports = { connectMqtt, sendHostCmd };
