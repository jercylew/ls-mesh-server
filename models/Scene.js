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
    }
});

module.exports = mongoose.model('Scene', SceneSchema);