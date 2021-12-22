const mongoose = require('mongoose');

const ArticleSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 0,
        maxLength: 50
    },
    author: {
        type: String,
        minLength: 0,
        maxLength: 50
    },
    abstract: {
        type: [String], //At most 2 abstract together, Enable the nested String restriction?
        required: false,
    },
    htmlContent: {
        type: String,
        required: true,
    },
    cover: {
        type: String,
        required: true
    },
    originLink: {
        type: String,
    },
    originDeclaration: {
        type: String,
    },
    tag: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Number,
        default: 0 //0: Draft, 1: published
    }
});

module.exports = mongoose.model('Article', ArticleSchema);