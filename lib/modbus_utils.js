const getTypeFromName = (name) => {
    let outType = ''
    if (name === 'leak_current') {
        outType = 'modbus_leak_current';
    }
    if (name.indexOf('relay_') >= 0) {
        outType = 'modbus_relay';
    }
    if (name.indexOf('error_ch_') >= 0) {
        outType = 'modbus_error_ch';
    }
    if (name.indexOf('temp_') >= 0) {
        outType = 'modbus_temp';
    }
    if (name.indexOf('dig_temp') >= 0) {
        outType = 'modbus_dig_temp';
    }
    if (name.indexOf('dig_hum') >= 0) {
        outType = 'modbus_dig_hum';
    }
    if (name.indexOf('current_ch_') >= 0) {
        outType = 'modbus_current';
    }
    return outType;
};

const getChIndexFromName = (name) => {
    const pos = name.lastIndexOf('_');
    if (pos < 0) {
        return -1;
    }
    const ch = name.substring(pos + 1);
    return ch;
};

const getDataInfo = (dev) => {
    if (!dev) {
        return '';
    }
    return `${dev.name.toUpperCase()}: ${dev.value}`;
};

const getDevId = (portName, dev) => {
    if (!dev) {
        return '';
    }
    const type = getTypeFromName(dev.name);
    return `${type}_${portName}_${dev.slave_id}_${dev.address}`;
};

module.exports = { getTypeFromName, getDataInfo, getDevId };