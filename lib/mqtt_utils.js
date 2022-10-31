const mqtt = require('mqtt');

const MQTT_HEARTBEAT_TOPIC = '/host/heartbeat';
const MQTT_CMD_TOPIC_PREFIX = '/host/cmd';

//Global instance of mqtt client
let gMqttClient = null;

const connectMqtt = () => {
    if (gMqttClient) {
        console.log('Mqtt client created, no need to re-create a new one');
        return;
    }

    gMqttClient = mqtt.connect("mqtt://gateway.iot.elemenx.com",
        { clientId: "mqttjs01", username: "iot_5eff1332b887d", password: "1234567812345678", clean: true });

    //handle incoming messages
    gMqttClient.on('message', function (topic, message, packet) {
        console.log("message is " + message);
        console.log("topic is " + topic);
    });

    gMqttClient.on("connect", function () {
        console.log("connected  " + gMqttClient.connected);
        gMqttClient.subscribe(MQTT_HEARTBEAT_TOPIC);
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
    publish(`${MQTT_CMD_TOPIC_PREFIX}/${id}`, cmdPayload, {
        retain: true,
        qos: 1
    });
};


setInterval(() => {
    if (!gMqttClient) {
        return;
    }

    if (gMqttClient.connected) {
        console.log('Mqtt still connected, no need to re-connect');
        return;
    }

    console.log('Mqtt client disconected from server, trying to reconnect now');
    gMqttClient.reconnect();
}, 5000);


module.exports = { connectMqtt, sendHostCmd };