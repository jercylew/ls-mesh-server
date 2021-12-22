// Restful api for Lengshuo Product
// This implementaton is based on the specification 
var express = require('express');
var router = express.Router();

const Article = require('../models/Article');

/**********************************Ble devices/**********************************/

// List scenes
router.get('/v1/scenes', function (req, res, next) {
    res.send('Implementing ...');
});

// Get a scene
router.get('/v1/scenes/:id', function (req, res, next) {
    res.send('Implementing ...');
});

// Command
router.post('/v1/scenes/:id/devices/:dev_id', (req, res, next) => {
    console.log('Got body:', req.body);
    res.send('Implementing ...');
});

/**********************************Smart Meter**********************************/

/**********************************Production**********************************/

/**********************************Test / Demo**********************************/
// Create a article
router.post('/v1/test/bebebus/articles', async (req, res) => {
    // console.log('POST /v1/test/bebebus/articles, received: ' + JSON.stringify(req.body));
    const article = new Article({
        title: req.body.title,
        author: req.body.author,
        abstract: req.body.abstract,
        cover: req.body.cover,
        htmlContent: req.body.htmlContent,
        tag: req.body.tag,
        originLink: req.body.origin_link,
        originDeclaration: req.body.origin_declaration,
        status: req.body.status,
    })

    try {
        const savedArticle = await article.save();
        let respData = {
            state: 0,
            message: 'Article saved succeed!',
            data: savedArticle
        };
        console.log('#####################Save Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save article: ' + err,
            data: {}
        };
        console.log('$$$$$$$$$$$$$$$$$$$$$$Save Failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

// Get all articles
router.get('/v1/test/bebebus/articles', async (req, res) => {
    try {
        const articles = await Article.find();
        console.log(articles)
        let respData = {
            state: 0,
            message: 'Article retrived succeed!',
            data: articles
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get articles: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/articles/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        console.log(article)
        let respData = {
            state: 0,
            message: 'Article retrived succeed!',
            data: article
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get articles: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

// Update Specific Post of a user - Update
router.patch('/v1/test/bebebus/articles/:id', async (req, res) => {
    try {
        const updatedArticle = await Article.updateOne({ _id: req.params.id }, {
            $set: {
                title: req.body.title,
                author: req.body.author,
                abstract: req.body.abstract,
                cover: req.body.cover,
                htmlContent: req.body.htmlContent,
                tag: req.body.tag,
                originLink: req.body.origin_link,
                originDeclaration: req.body.origin_declaration,
                status: req.body.status,
            }
        });
        let respData = {
            state: 0,
            message: 'Article update succeed',
            data: updatedArticle
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update article: ' + err,
            data: updatedArticle
        };
        res.json(respData);
    }
});

// Delete Specific Post of a user - Delete
router.delete('/v1/test/bebebus/articles/:id', async (req, res) => {
    try {
        const removedArticle = await Article.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Article deleted',
            data: removedArticle
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete article: ' + err,
            data: updatedArticle
        };
        res.json(respData);
    }
});


module.exports = router;
