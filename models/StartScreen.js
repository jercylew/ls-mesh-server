const mongoose = require('mongoose');

const StartScreenSchema = mongoose.Schema({
    startVideo: {
        type: String,
        required: true,
    },
    defaultBackground: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('StartScreen', StartScreenSchema);