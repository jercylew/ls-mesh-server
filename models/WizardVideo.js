const mongoose = require('mongoose');

const WizardVideoSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
        minLength: 0,
        maxLength: 50
    },
    url: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('WizardVideo', WizardVideoSchema);