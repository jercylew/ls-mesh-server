const mongoose = require('mongoose');

const SceneSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 0,
        maxLength: 50
    },
    frpPort: {
        type: String,
        minLength: 0,
        maxLength: 5
    },
    gatewayId: {
        type: String,
        minLength: 0,
        maxLength: 17
    },
    address: {
        type: String,
        minLength: 0,
        maxLength: 255
    },
    devices: [{
        devId: String,
        devType: String,
        dataInfo: String,
        devKind: String,
        status: Number,
        lastUpdated: Date
    }],
    logFiles: [{
        name: String,
        size: Number,
        lastUpdated: Date
    }],
    relayLogs: [ {
        relayId: String,
        startTime: Date,
        elapsed: Number,
        ended: Boolean
    }],
    errorLogs: [ {
        // 漏电流(over_leak_current)，线路过流(ch_over_current)，线路过热(ch_over_heat)，
        // 网关断线(gateway_offline)，系统内存不足(sys_mem_full)，系统磁盘空间不足(sys_disk_full)，
        // 设备掉线(dev_offline), CO浓度过高(dev_co_over_threshold)
        type: String,
        level: Number, //0: Info(提示), 1: Warning（警告）, 2: Error（错误）
        message: String, // Detailed info, eg, "线路温度超过65，且已经持续60秒"
        startTime: Date,
        // Devices involved with this warning: eg, "CO.135", "modbus_ttyS0_2_1", If more one: "CO.135,FLM.254,FOR.35"
        causedBy: String
    } ],
    online: Boolean
});

module.exports = mongoose.model('Scene', SceneSchema);
