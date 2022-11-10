const mqtt = require('mqtt');
const uuidUtils = require('../lib/uuid');
const Scene = require('../models/Scene');


const MQTT_TOPIC_CMD_PREFIX = '/host/cmd';
const MQTT_TOPIC_DEVICE_REPORT = 'device_report';
const MQTT_TOPIC_HOST_HEARTBEAT = '/host/heartbeat';
const MQTT_TOPIC_DEVICE_HEARTBEAT = 'heartbeat';
const SCENE_HEARTBEAT_TIMEOUT_MS = 60000;//30 * 60000;

//Global instance of mqtt client
let gMqttClient = null;
let gMapSceneHeartbeatTimer = new Map();


const connectMqtt = () => {
    if (gMqttClient) {
        console.log('Mqtt client created, no need to re-create a new one');
        return;
    }

    const clientId = 'ls_mesh_server_' + uuidUtils.uuidv4();
    console.log('Now trying to connect to mqtt broker, clientId: ', clientId);
    gMqttClient = mqtt.connect("mqtt://gateway.iot.elemenx.com",
        { clientId: clientId, username: "iot_5eff1332b887d", password: "1234567812345678", clean: true });

    gMqttClient.on('message', function (topic, message, packet) {
        if (topic === MQTT_TOPIC_HOST_HEARTBEAT) {
            const sceneInfo = JSON.parse(message);
            console.log("Processing host HEARTBEAT packet:", sceneInfo, ', Timer map: ', gMapSceneHeartbeatTimer);
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
                    console.log('Update scene with heartbeat packet succeed: ', writeOpResult);
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

            console.log('Received device heartbeat:', devicesInfo);

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
                        status: 0,
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
                    // console.log('To update to scens, devices:', newDevices, 'logFiles: ', logFiles);
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
                        console.log('Update scene with heartbeat packet succeed: ', writeOpResult);
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

    gMqttClient.on("connect", function () {
        console.log("connected  " + gMqttClient.connected);
        gMqttClient.subscribe(MQTT_TOPIC_HOST_HEARTBEAT);
        gMqttClient.subscribe(MQTT_TOPIC_DEVICE_HEARTBEAT);
        // gMqttClient.subscribe(MQTT_TOPIC_DEVICE_REPORT); //TODO, use this one for device status update instead
    })

    //handle errors
    gMqttClient.on("error", function (error) {
        console.log("Can't connect" + error);
    });
};

const publish = (topic, msg, options) => {
    console.log("publishing", msg);

    if (gMqttClient.connected) {
        gMqttClient.publish(topic, msg, options);
    }
};

const sendHostCmd = (id, cmdPayload) => {
    publish(`${MQTT_TOPIC_CMD_PREFIX}/${id}`, cmdPayload, {
        retain: true,
        qos: 1
    });
};


setInterval(() => {
    if (!gMqttClient) {
        console.log('Mqtt not created, wait for a while!');
        return;
    }

    if (gMqttClient.connected) {
        console.log('Mqtt still connected, no need to re-connect');
        return;
    }

    console.log('Mqtt client disconected from server, trying to reconnect now');
    gMqttClient.reconnect();
}, 10000);


module.exports = { connectMqtt, sendHostCmd };
