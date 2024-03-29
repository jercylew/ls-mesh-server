// const getTypeFromName = (name) => {
//   let outType = ''
//   if (name.endsWith('_leakcurrent')) {
//     outType = 'modbus_leakcurrent';
//   }
//   if (name.endsWith('_current')) {
//     outType = 'modbus_current';
//   }
//   if (name.endsWith('_temp')) {
//     outType = 'modbus_temp';
//   }
//   if (name.endsWith('_relay')) {
//     outType = 'modbus_relay';
//   }
//   if (name.endsWith('_error')) {
//     outType = 'modbus_error';
//   }
//   if (name.endsWith('_digtemp')) {
//     outType = 'modbus_digtemp';
//   }
//   if (name.endsWith('_dighum')) {
//     outType = 'modbus_dighum';
//   }
//   return outType;
// };

const getChIndexFromName = (name) => {
  const pos = name.lastIndexOf('_');
  if (pos < 0) {
    return -1;
  }
  const ch = name.substring(pos + 1);
  return ch;
};


// const getDataInfo = (dev) => {
//   if (!dev) {
//     return '';
//   }

//   if (dev.uv_off_remain_time) {
//     return `${dev.name.toUpperCase()}: ${dev.value}, uv_off_remain_time: ${dev.uv_off_remain_time}`;
//   }

//   return `${dev.name.toUpperCase()}: ${dev.value}`;
// };

// const getDevId = (portName, dev) => {
//   if (!dev) {
//     return '';
//   }

//   const type = getTypeFromName(dev.name);
//   let stripedPortName = portName;
//   if (stripedPortName.includes("/")) {
//     stripedPortName = stripedPortName.substring(5);
//   }

//   return `${type}_${portName}_${dev.slave_id}_${dev.address}`;
// };

const getSingleDataName = dataInfoStr => {
  if (dataInfoStr.indexOf(':') < 0) {
    return '';
  }
  const arDataInfo = dataInfoStr.split(':');
  if (arDataInfo.length !== 2) {
    return '';
  }
  return arDataInfo[0];
};

const getSingleDataValueString = dataInfoStr => {
  if (dataInfoStr.indexOf(':') < 0) {
    return dataInfoStr;
  }
  const arDataInfo = dataInfoStr.split(':');
  if (arDataInfo.length !== 2) {
    return "";
  }
  return arDataInfo[1];
};

const getSingleDataValueInt = dataInfoStr => {
  if (dataInfoStr.indexOf(':') < 0) {
    return parseInt(dataInfoStr);
  }
  const arDataInfo = dataInfoStr.split(':');
  if (arDataInfo.length !== 2) {
    return 0;
  }
  return parseInt(arDataInfo[1]);
};

const getSingleDataValueFloat = dataInfoStr => {
  if (dataInfoStr.indexOf(':') < 0) {
    return parseFloat(dataInfoStr).toFixed(2);
  }
  const arDataInfo = dataInfoStr.split(':');
  if (arDataInfo.length !== 2) {
    return 0;
  }
  return parseFloat(arDataInfo[1]);
};

const getMultDataValueString = dataInfoStr => {
  let outDataVals = [];

  if (dataInfoStr.indexOf(',') < 0) {
    return getSingleDataValueString(dataInfoStr);
  }

  let arDataEntries = dataInfoStr.split(',');
  outDataVals = arDataEntries.map((entry, index) => {
    return {
      name: getSingleDataName(entry),
      value: getSingleDataValueString(entry)
    };
  });
  return outDataVals;
}

const getMultDataValueFloat = dataInfoStr => {
  let outDataVals = [];

  if (dataInfoStr.indexOf(',') < 0) {
    return getSingleDataValueFloat(dataInfoStr);
  }

  let arDataEntries = dataInfoStr.split(',');
  outDataVals = arDataEntries.map((entry, index) => {
    return {
      name: getSingleDataName(entry),
      value: getSingleDataValueFloat(entry)
    };
  });
  return outDataVals;
}

const getMultDataValueInt = dataInfoStr => {
  let outDataVals = [];

  if (dataInfoStr.indexOf(',') < 0) {
    return getSingleDataValueFloat(dataInfoStr);
  }

  let arDataEntries = dataInfoStr.split(',');
  outDataVals = arDataEntries.map((entry, index) => {
    return {
      name: getSingleDataName(entry),
      value: getSingleDataValueInt(entry)
    };
  });
  return outDataVals;
}

const getChIndex = text => {
  let n = parseInt(text);

  if (!isNaN(n)) {
    return (n - 1);
  }

  text = text.toLowerCase();
  if (text === 'a') {
    n = 0;
  }
  if (text === 'b') {
    n = 1;
  }
  if (text === 'c') {
    n = 2;
  }
  if (text === 'd') {
    n = 3;
  }
  if (text === 'e') {
    n = 4;
  }
  return n;
};


module.exports = {
  getSingleDataName, getSingleDataValueString, getSingleDataValueInt, getSingleDataValueFloat,
  getMultDataValueString, getMultDataValueFloat, getMultDataValueInt, getChIndex
};