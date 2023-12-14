const net = require('net');

const getLuminaireCommandData = req => {
    const cmd = req.body.cmd;
    const meshId = req.params.mesh_id;
    const devId = parseInt(req.params.dev_id);

    let commandData = {
        mesh_uuid: meshId ? meshId : '00000000000000000000000000000000',
        bluetooth_address: devId,
    };

    if (cmd === 'on' || cmd === 'off') {
        commandData.cmd = cmd
    }
    else if (cmd === 'dim') {
        commandData.cmd = 'dimming';
        let brightness = req.body.param;
        if (brightness > 100) {
            brightness = 100;
        }
        if (brightness < 5) {
            brightness = 5;
        }
        commandData.data = brightness;
    }
    else {
        console.log('Failed get the command for luminaire, unknown cmd, current supported: on|off|dim');
    }

    return commandData.cmd ? {
        topic: 'request',
        command: 'luminaire_control',
        data: commandData
    } : null;
};

const get5ChRelayCommandData = req => {
    const cmd = req.body.cmd;
    const meshId = req.params.mesh_id;
    const devId = parseInt(req.params.dev_id);

    let commandData = {
        mesh_uuid: meshId ? meshId : '00000000000000000000000000000000',
        bluetooth_address: devId,
    };

    if (cmd === 'on') {
        const channels = req.body.param;
        const duration = req.body.duration;
        commandData.cmd = cmd;  
        commandData.channels = channels;
        commandData.duration = duration;
    }
    if (cmd === 'off') {
        const channels = req.body.param;
        commandData.cmd = cmd;
        commandData.channels = channels;
    }
    else if (cmd === 'all_on' || cmd === 'all_off') {
        commandData.cmd = cmd; 
    }
    else {
        console.log('Failed get the command for 5-channel relay, unknown cmd, current supported: on|off|all_on|all_off');
    }

    return commandData.cmd ? {
        topic: 'request',
        command: '5ch_relay_control',
        data: commandData
    } : null;
};

const sendCommand = (host_id, meshDevCommand) => {
    let client = new net.Socket();

    client.setEncoding('utf8');
    client.on('connect', function () {
        console.log('Client: connection established with server');
        const address = client.address();
        const port = address.port;
        const family = address.family;
        const ipaddr = address.address;
        console.log('Client is listening at port' + port);
        console.log('Client ip :' + ipaddr);
        console.log('Client is IP4/IP6 : ' + family);

        let connectHostCommand = {
            command: 'connect',
            data: {
                host_id: host_id
            }
        };

        client.write(JSON.stringify(connectHostCommand) + '\n');
    });
    
    client.on('data', function (data) {
        console.log('Data from server:' + data);
        if (data.includes('CONNECT_SUCCESS!')) {
            console.log('Now send command: ', JSON.stringify(meshDevCommand) + '\n');
            client.write(JSON.stringify(meshDevCommand) + '\n');
        }
        else if (data.indexOf('"result":"success"') > 0) {
            console.log('Send command succeed, now close the connection');
            client.end();
        }
    });

    client.on('close', function () {
        console.log('Connection closed');
    });

    client.connect({
        // host: 'www.lengshuotech.com',
        port: 7200
    });
};

const getModbusCommandData = req => {
    let port = req.params.port;
    const slaveId = parseInt(req.params.slave_id);
    const address = parseInt(req.params.address);
    const regValue = parseInt(req.body.reg_value);

    if (port.includes("tty") && port.indexOf('/dev/') < 0) {
        port = ('/dev/' + port);
    }

    let commandData = {
        port: port,
        slave: slaveId,
        address: address,
        reg_value: regValue,
    };

    return commandData;
};

module.exports = { getLuminaireCommandData, get5ChRelayCommandData, getModbusCommandData, sendCommand};