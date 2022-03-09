// Restful api for Lengshuo Product
// This implementaton is based on the specification 
var express = require('express');
const axios = require('axios');
const Article = require('../models/Article');
const CoverVideo = require('../models/CoverVideo');
const InstallVideo = require('../models/InstallVideo');
const Slide = require('../models/Slide');
const WizardVideo = require('../models/WizardVideo');
const StartScreen = require('../models/StartScreen');

var router = express.Router();

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
        const projection = {
            htmlContent: 0,
        };
        const articles = await Article.find(null, projection);
        console.log(articles);
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
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/articles/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        console.log(article);
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
            data: {}
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
            data: {}
        };
        res.json(respData);
    }
});

// Cover Videos
router.post('/v1/test/bebebus/cover-videos', async (req, res) => {
    const coverVideo = new CoverVideo({
        title: req.body.title,
        subtitle: req.body.subtitle,
        color: req.body.color,
        shortVideo: req.body.shortVideo,
        fullVideo: req.body.fullVideo,
        icons: req.body.icons
    })

    try {
        const savedCoverVideo = await coverVideo.save();
        let respData = {
            state: 0,
            message: 'Cover video saved succeed!',
            data: savedCoverVideo
        };
        console.log('Cover video saved Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save cover video: ' + err,
            data: {}
        };
        console.log('Cover video save Failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/test/bebebus/cover-videos', async (req, res) => {
    try {
        const coverVideos = await CoverVideo.find();
        console.log(coverVideos);
        let respData = {
            state: 0,
            message: 'Cover video retrived succeed!',
            data: coverVideos
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get cover videos: ' + err,
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/cover-videos/:id', async (req, res) => {
    try {
        const coverVideo = await CoverVideo.findById(req.params.id);

        console.log(coverVideo);
        let respData = {
            state: 0,
            message: 'Cover video retrived succeed!',
            data: coverVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get cover video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.patch('/v1/test/bebebus/cover-videos/:id', async (req, res) => {
    try {
        const updatedCoverVideo = await CoverVideo.updateOne({ _id: req.params.id }, {
            $set: {
                title: req.body.title,
                subtitle: req.body.subtitle,
                shortVideo: req.body.shortVideo,
                fullVideo: req.body.fullVideo,
                icons: req.body.icons
            }
        });
        let respData = {
            state: 0,
            message: 'Cover video update succeed',
            data: updatedCoverVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update cover video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.delete('/v1/test/bebebus/cover-videos/:id', async (req, res) => {
    try {
        const removedCoverVideo = await CoverVideo.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Cover vieo deleted',
            data: removedCoverVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete cover video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

// Install Videos
router.post('/v1/test/bebebus/install-videos', async (req, res) => {
    const installVideo = new InstallVideo({
        title: req.body.title,
        url: req.body.url,
        poster: req.body.poster
    });

    try {
        const savedInstallVideo = await installVideo.save();
        let respData = {
            state: 0,
            message: 'Install video saved succeed!',
            data: savedInstallVideo
        };
        console.log('Install vieo save Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save install video: ' + err,
            data: {}
        };
        console.log('Install video save Failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/test/bebebus/install-videos', async (req, res) => {
    try {
        const installVideos = await InstallVideo.find();
        console.log(installVideos);
        let respData = {
            state: 0,
            message: 'Install video retrived succeed!',
            data: installVideos
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get install video: ' + err,
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/install-videos/:id', async (req, res) => {
    try {
        const installVideo = await InstallVideo.findById(req.params.id);

        console.log(installVideo);
        let respData = {
            state: 0,
            message: 'Install video retrived succeed!',
            data: installVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get install video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.patch('/v1/test/bebebus/install-videos/:id', async (req, res) => {
    try {
        const updatedInstallVideo = await InstallVideo.updateOne({ _id: req.params.id }, {
            $set: {
                title: req.body.title,
                url: req.body.url,
                poster: req.body.poster
            }
        });
        let respData = {
            state: 0,
            message: 'Install video update succeed',
            data: updatedInstallVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update install video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.delete('/v1/test/bebebus/install-videos/:id', async (req, res) => {
    try {
        const removedInstallVideo = await InstallVideo.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Install video deleted',
            data: removedInstallVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete article: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

//Slide
router.post('/v1/test/bebebus/slides', async (req, res) => {
    const slide = new Slide({
        title: req.body.title,
        url: req.body.url
    })

    try {
        const savedSlide = await slide.save();
        let respData = {
            state: 0,
            message: 'Slide saved succeed!',
            data: savedSlide
        };
        console.log('Slide saved Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save slide: ' + err,
            data: {}
        };
        console.log('Slide save Failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/test/bebebus/slides', async (req, res) => {
    try {
        const slides = await Slide.find();
        console.log(slides);
        let respData = {
            state: 0,
            message: 'Slide retrived succeed!',
            data: slides
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get slide: ' + err,
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/slides/:id', async (req, res) => {
    try {
        const slide = await Slide.findById(req.params.id);

        console.log(slide);
        let respData = {
            state: 0,
            message: 'Slide retrived succeed!',
            data: slide
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get slide: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.patch('/v1/test/bebebus/slides/:id', async (req, res) => {
    try {
        const updatedSlide = await Slide.updateOne({ _id: req.params.id }, {
            $set: {
                title: req.body.title,
                url: req.body.url
            }
        });
        let respData = {
            state: 0,
            message: 'Slide update succeed',
            data: updatedSlide
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update slide: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.delete('/v1/test/bebebus/slides/:id', async (req, res) => {
    try {
        const removedSlide = await Slide.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Slide deleted',
            data: removedSlide
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete slide: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

//Wizard Video
router.post('/v1/test/bebebus/wizard-videos', async (req, res) => {
    const wizardVideo = new WizardVideo({
        type: req.body.type,
        url: req.body.url
    })

    try {
        const savedWizardVideo = await wizardVideo.save();
        let respData = {
            state: 0,
            message: 'Wizard video saved succeed!',
            data: savedWizardVideo
        };
        console.log('Wizard video save Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save wizard video: ' + err,
            data: {}
        };
        console.log('Wizard video save failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/test/bebebus/wizard-videos', async (req, res) => {
    try {
        const wizardVideos = await WizardVideo.find();
        console.log(wizardVideos);
        let respData = {
            state: 0,
            message: 'Wizard video retrived succeed!',
            data: wizardVideos
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get wizard video: ' + err,
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/wizard-videos/:id', async (req, res) => {
    try {
        const wizardVideo = await WizardVideo.findById(req.params.id);

        console.log(wizardVideo);
        let respData = {
            state: 0,
            message: 'Wizard video retrived succeed!',
            data: wizardVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get wizard video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.patch('/v1/test/bebebus/wizard-videos/:id', async (req, res) => {
    try {
        const updatedWizardVideo = await WizardVideo.updateOne({ _id: req.params.id }, {
            $set: {
                type: req.body.type,
                url: req.body.url
            }
        });
        let respData = {
            state: 0,
            message: 'Wizard video update succeed',
            data: updatedWizardVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update wizard video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.delete('/v1/test/bebebus/wizard-videos/:id', async (req, res) => {
    try {
        const removedWizardVideo = await WizardVideo.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Wizard video deleted',
            data: removedWizardVideo
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete wizard video: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

// Start Screen
router.post('/v1/test/bebebus/start-screen', async (req, res) => {
    const startScreen = new StartScreen({
        startVideo: req.body.startVideo,
        defaultBackground: req.body.defaultBackground
    })

    try {
        const savedStartScreen = await startScreen.save();
        let respData = {
            state: 0,
            message: 'Start screen saved succeed!',
            data: savedStartScreen
        };
        console.log('Start screen save Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save start screen: ' + err,
            data: {}
        };
        console.log('Start screen save failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/test/bebebus/start-screen', async (req, res) => {
    try {
        const startScreens = await StartScreen.find();
        console.log(startScreens);
        let respData = {
            state: 0,
            message: 'Start screen retrived succeed!',
            data: startScreens
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get start screen: ' + err,
            data: []
        };
        res.json(respData);
    }
});

router.get('/v1/test/bebebus/start-screen/:id', async (req, res) => {
    try {
        const startScreen = await StartScreen.findById(req.params.id);

        console.log(startScreen);
        let respData = {
            state: 0,
            message: 'Start screen retrived succeed!',
            data: startScreen
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get start screen: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.patch('/v1/test/bebebus/start-screen/:id', async (req, res) => {
    try {
        const updatedStartScreen = await StartScreen.updateOne({ _id: req.params.id }, {
            $set: {
                startVideo: req.body.startVideo,
                defaultBackground: req.body.defaultBackground
            }
        });
        let respData = {
            state: 0,
            message: 'Start screen update succeed',
            data: updatedStartScreen
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to update start screen: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

router.delete('/v1/test/bebebus/start-screen/:id', async (req, res) => {
    try {
        const removedStartScreen = await StartScreen.remove({ _id: req.params.id });
        let respData = {
            state: 0,
            message: 'Start screen deleted',
            data: removedStartScreen
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to delete start screen: ' + err,
            data: {}
        };
        res.json(respData);
    }
});


// Current Data Analysis
router.post('/v1/test/current/seg-data', async (req, res) => {
    console.log('Get request for current seg-data: ' + JSON.stringify(req.body));
    try {
        axios.post('http://127.0.0.1:3001/api/v1/current-seg-fig', {
            id: req.body.id,
            date: req.body.date,
        })
            .then(function (response) {
                let respData = {
                    state: 0,
                    message: 'Get current segment data succeed!',
                    data: response.data
                };
                res.json(respData);
            })
            .catch(function (error) {
                console.log(error);

                let respData = {
                    state: 1,
                    message: 'Error occurred while communicating to data server: ' + error,
                    data: {}
                };
                res.json(respData)
            });
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Error occurred while communicating to data server: ' + err,
            data: {}
        };
        console.log('Error occurred while communicating to data server: ' + JSON.stringify(err))
        res.json(respData)
    }
});

module.exports = router;
