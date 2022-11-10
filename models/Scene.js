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
    online: Boolean
});

module.exports = mongoose.model('Scene', SceneSchema);
