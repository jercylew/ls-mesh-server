const mongoose = require('mongoose');

const InstallVideoSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 0,
        maxLength: 50
    },
    url: {
        type: String,
        required: true,
    },
    poster: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('InstallVideo', InstallVideoSchema);