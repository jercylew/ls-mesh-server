const mqtt = require('mqtt');
const uuidUtils = require('../lib/uuid');
const Scene = require('../models/Scene');
const fs = require('fs');
const datetimeUtils = require('../lib/datetime_utils');

const MQTT_TOPIC_CMD_PREFIX = '/host/cmd';
const MQTT_TOPIC_DEVICE_REPORT = 'device_report';
const MQTT_TOPIC_HOST_HEARTBEAT = '/host/heartbeat';
const MQTT_TOPIC_DEVICE_HEARTBEAT = 'heartbeat';
const SCENE_HEARTBEAT_TIMEOUT_MS = 60000;//30 * 60000;

//Refrigetr, sale table
const MQTT_TOPIC_SALE_TABLE_STATUS = '$thing/up/status/sale_table';
const MQTT_TOPIC_SALE_TABLE_PROPERTY = '$thing/up/property/sale_table';
const MQTT_TOPIC_REFRG_STATUS = '$thing/up/status/refrigerator';
const MQTT_TOPIC_REFRG_PROPERTY = '$thing/up/property/refrigerator';
const MQTT_TOPIC_SALE_TABLE_TIME = '$thing/down/ota/sale_table/';
const LOG_FILE_DIRECTORY = '/var/log/ls-mesh-server';

//Global instance of mqtt client
let gMqttClientJiulong = null;
let gMapSceneHeartbeatTimer = new Map();
let gMqttClientLengshuo = null;

const connectToJiulongBroker = () => {
    if (gMqttClientJiulong) {
        console.log('Mqtt client for Jiulong created, no need to re-create a new one');
        return;
    }

    const clientId = 'ls_mesh_server_' + uuidUtils.uuidv4();
    console.log('Now trying to connect to mqtt Jiulong broker, clientId: ', clientId);
    gMqttClientJiulong = mqtt.connect("mqtt://gateway.iot.elemenx.com",
        { clientId: clientId, username: "iot_5eff1332b887d", password: "1234567812345678", clean: true });

    gMqttClientJiulong.on('message', function (topic, message, packet) {
        if (topic === MQTT_TOPIC_HOST_HEARTBEAT) {
            const sceneInfo = JSON.parse(message);
            const prevTimerId = gMapSceneHeartbeatTimer.get(sceneInfo.id);
            if (prevTimerId) {
                clearTimeout(prevTimerId);
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
                        console.log('Timeout for keeping scene online status, resetting it to be offline');
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
                        gMapSceneHeartbeatTimer.delete(sceneInfo.id)
                    }, SCENE_HEARTBEAT_TIMEOUT_MS);
                    gMapSceneHeartbeatTimer.set(sceneInfo.id, timerId);
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

            try {
                if (action === 'check') {
                    Scene.find({ gatewayId: devicesInfo.gateway_identifier }, (err, scenes) => {
                        if (err) {
                            return;
                        }
                        if (scenes.length <= 0) {
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
                                console.log('Timeout for keeping scene online status, resetting it to be offline');
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
                            }, SCENE_HEARTBEAT_TIMEOUT_MS);
                            gMapSceneHeartbeatTimer.set(devicesInfo.gateway_identifier, timerId);
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

const logMessageToFile = (message, fileName) => {
    const filePath = `${LOG_FILE_DIRECTORY}/${fileName}`;
    fs.appendFile(filePath, message, err => {
        if (err) {
            console.error('Failed to save message to log file: ', err);
        }
        // done!
    });
};

const connectToLengshuoBroker = () => {
    if (gMqttClientLengshuo) {
        console.log('Mqtt client for Lengshuo created, no need to re-create a new one');
        return;
    }

    if (!fs.existsSync(LOG_FILE_DIRECTORY)) {
        fs.mkdirSync(LOG_FILE_DIRECTORY);
    }

    const clientId = 'ls_mesh_server_' + uuidUtils.uuidv4();
    console.log('Now trying to connect to Lengshuo mqtt broker, clientId: ', clientId);
    gMqttClientLengshuo = mqtt.connect("mqtt://www.lengshuotech.com",
        { clientId: clientId, username: "tkt_iot_user", password: "tkt1qazm,./", clean: true });

    gMqttClientLengshuo.on('message', function (topic, message, packet) {
        const nowTimeText = (new Date()).toLocaleTimeString('zh-CN');
        const messageForLog = `${nowTimeText}     ${message}\n`;
        if (topic === MQTT_TOPIC_SALE_TABLE_STATUS) {
            // const saleTableStatusInfo = JSON.parse(message);
            logMessageToFile(messageForLog, `out_sale_table_status_${datetimeUtils.todayDate()}.log`);
        }
        else if (topic === MQTT_TOPIC_SALE_TABLE_PROPERTY) {
            // console.log("Processing sale property packet: " + message);
            logMessageToFile(messageForLog, `out_sale_table_property_${datetimeUtils.todayDate()}.log`);
        }
        else if (topic === MQTT_TOPIC_REFRG_STATUS) {
            logMessageToFile(messageForLog, `out_refrgtr_status_${datetimeUtils.todayDate()}.log`);
        }
        else if (topic === MQTT_TOPIC_REFRG_PROPERTY) {
            logMessageToFile(messageForLog, `out_refrgtr_property_${datetimeUtils.todayDate()}.log`);
        }
        else {
            console.log('Unknown mqtt message');
        }
    });

    gMqttClientLengshuo.on("connect", function () {
        console.log("connected  " + gMqttClientLengshuo.connected);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_SALE_TABLE_STATUS);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_SALE_TABLE_PROPERTY);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_STATUS);
        gMqttClientLengshuo.subscribe(MQTT_TOPIC_REFRG_PROPERTY);

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
    connectToJiulongBroker();
    connectToLengshuoBroker();
};

const publish = (topic, msg, options) => {
    console.log("publishing", msg);

    if (gMqttClientJiulong.connected) {
        gMqttClientJiulong.publish(topic, msg, options);
    }
};

const sendHostCmd = (id, cmdPayload) => {
    publish(`${MQTT_TOPIC_CMD_PREFIX}/${id}`, cmdPayload, {
        retain: false,
        qos: 1
    });
};

setInterval(() => {
    if (!gMqttClientJiulong) {
        console.log('Mqtt client for Jiulong not created, wait for a while!');
        return;
    }

    if (gMqttClientJiulong.connected) {
        console.log('Mqtt client for Jiulong  still connected, no need to re-connect');
        return;
    }

    console.log('Mqtt  client for Jiulong disconected from server, trying to reconnect now');
    gMqttClientJiulong.reconnect();
}, 10000);

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

// setInterval(() => {
//     if (!gMqttClientLengshuo) {
//         console.log('Mqtt client for Lengshuo not created, wait for a while!');
//         return;
//     }

//     if (!gMqttClientLengshuo.connected) {
//         console.log('Mqtt client for Lengshuo still not connected, wait until connected');
//         return;
//     }

//     const timeMessage = {
//         device_id: 'LS_FFFFFF',
//         method: 'set_time',
//         params: {
//             Now_Time: datetimeUtils.dateToDateTimeString(new Date())
//         }
//     };

//     console.log('To publish time: ', timeMessage);

//     //Publish time to sale tables
//     gMqttClientLengshuo.publish(MQTT_TOPIC_SALE_TABLE_TIME, JSON.stringify(timeMessage), {
//         retain: false,
//         qos: 1
//     });

// }, 23*60*60*1000);

module.exports = { connectMqtt, sendHostCmd };
