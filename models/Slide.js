const mongoose = require('mongoose');

const SlideSchema = mongoose.Schema({
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
});

module.exports = mongoose.model('Slide', SlideSchema);