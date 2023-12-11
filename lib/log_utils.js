const LOG_FILE_DIRECTORY = '/var/log/ls-mesh-server';

const logMessageToFile = (message, fileName) => {
    const filePath = `${LOG_FILE_DIRECTORY}/${fileName}`;
    fs.appendFile(filePath, message, err => {
        if (err) {
            console.error('Failed to save message to log file: ', err);
        }
        // done!
    });
};

module.exports = {
    logMessageToFile, LOG_FILE_DIRECTORY
  };