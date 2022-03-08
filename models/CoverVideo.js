const mongoose = require('mongoose');

const CoverVideoSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 0,
        maxLength: 16
    },
    subtitle: {
        type: String,
        minLength: 0,
        maxLength: 20
    },
    shortVideo: {
        type: String,
        required: true,
    },
    fullVideo: {
        type: String,
        required: true,
    },
    icons: {
        type: [String],
        required: true,
    }
});

module.exports = mongoose.model('CoverVideo', CoverVideoSchema);