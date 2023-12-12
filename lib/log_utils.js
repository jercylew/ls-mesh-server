const fs = require('fs');
const LOG_FILE_DIRECTORY = '/var/log/ls-mesh-server';
const LS_DEBUG_ON = false

const logMessageToFile = (message, fileName) => {
    const filePath = `${LOG_FILE_DIRECTORY}/${fileName}`;
    fs.appendFile(filePath, message, err => {
        if (err) {
            console.error('Failed to save message to log file: ', err);
        }
        // done!
    });
};

const lsDebugMessage = (tag, message) => {
    if (LS_DEBUG_ON) {
        console.log(tag, message);
    }
};

const lsWarningMessage = (tag, message) => {
    if (LS_DEBUG_ON) {
        console.warn(tag, message);
    }
}

const lsErrorMessage = (tag, message) => {
    console.error(tag, message);
}

module.exports = {
    logMessageToFile, LOG_FILE_DIRECTORY, lsDebugMessage, lsWarningMessage, lsErrorMessage
  };