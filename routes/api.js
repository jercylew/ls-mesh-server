// Restful api for Lengshuo Product
// This implementaton is based on the specification 
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const fs = require('fs');

const Article = require('../models/Article');
const CoverVideo = require('../models/CoverVideo');
const InstallVideo = require('../models/InstallVideo');
const Slide = require('../models/Slide');
const WizardVideo = require('../models/WizardVideo');
const StartScreen = require('../models/StartScreen');
const Scene = require('../models/Scene');

const meshUtils = require('../lib/mesh_utils');
const datetimeUtils = require('../lib/datetime_utils');
const rtspConf = require('../device-rtsp.json');
const mqttUtils = require('../lib/mqtt_utils');

const ffmpegPath = '/opt/ffmpeg-git-20200909-amd64-static/ffmpeg';
const ffmpegKillCmd = '/usr/bin/pkill ffmpeg';
const currentDataFilePath = '/usr/local/ls-apps/ls-data-server/ls_data_app/static/data/current';
const currentVideoSlicePath = '/usr/local/ls-apps/ls-mesh-server/public/res/';

const regexTime = /:/ig;

const router = express.Router();
router.all('*', cors());

/**********************************Ble devices/**********************************/

// Scenes
router.post('/v1/scenes', async (req, res) => {
    const scenes = await Scene.find({ frpPort: req.body.frp_port, gatewayId: req.body.gateway_id });
    if (scenes.length > 0) {
        const respData = {
            state: 1,
            message: 'Scene already existed!',
            data: {}
        };
        console.log('Scene already existed!');
        res.json(respData)
        return;
    }

    const scene = new Scene({
        name: req.body.name,
        frpPort: req.body.frp_port,
        gatewayId: req.body.gateway_id,
        address: req.body.address,
    })

    try {
        const savedScene = await scene.save();
        const id = req.params.id;
        let cmdJson = {
            gateway_id: req.body.gateway_id,
            user_id: req.body.user_id,
            cmd: 'set',
            category: 'init',  //Initialize the host: scene name, frp port
            params: {
                scene_name: req.body.name,
                frp_port: req.body.frp_port,
                address: req.body.address
            },
        };
        mqttUtils.sendHostCmd(req.body.gateway_id, JSON.stringify(cmdJson));

        let respData = {
            state: 0,
            message: 'Scene saved succeed!',
            data: savedScene
        };
        console.log('Scene saved Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to save scene: ' + err,
            data: {}
        };
        console.log('Scene save failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});

router.get('/v1/scenes', async function (req, res, next) {
    try {
        const scenes = await Scene.find(null, { devices: 0, logFiles: 0 });
        console.log(scenes);
        let respData = {
            state: 0,
            message: 'Scenes retrived succeed!',
            data: scenes
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get scenes: ' + err,
            data: []
        };
        res.json(respData);
    }
});

// Get a scene
router.get('/v1/scenes/:id', async function (req, res, next) {
    try {
        const scene = await Scene.findById(req.params.id);

        console.log(scene);
        let respData = {
            state: 0,
            message: 'Scene retrived succeed!',
            data: scene
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to get the scene: ' + err,
            data: {}
        };
        res.json(respData);
    }
});

//Configure a specified scene
router.post('/v1/scenes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const cmdJson = req.body;
        console.log('Applying configurations, id: ', id, ', Settings: ', cmdJson);
        mqttUtils.sendHostCmd(cmdJson.gateway_id, JSON.stringify(cmdJson));

        let respData = {
            state: 0,
            message: 'Scene configured succeed!',
            data: {}
        };
        console.log('Scene configured Ok!')
        res.json(respData)
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Failed to configured scene: ' + err,
            data: {}
        };
        console.log('Scene configured failed: ' + JSON.stringify(err))
        res.json(respData)
    }
});


// List meshes
router.get('/v1/scenes/:scene_id/meshes', function (req, res, next) {
    res.send('Implementing ...');
});

// Get a mesh
router.get('/v1/scenes/:scene_id/meshes/:mesh_id', function (req, res, next) {
    res.send('Implementing ...');
});

// List devices
router.get('/v1/scenes/:scene_id/meshes/:mesh_id/devices', function (req, res, next) {
    res.send('Implementing ...');
});

// Get a device
router.get('/v1/scenes/:scene_id/meshes/:mesh_id/devices/:dev_id', function (req, res, next) {
    res.send('Implementing ...');
});


// Control a device
router.post('/v1/scenes/:scene_id/meshes/:mesh_id/devices/:dev_id', (req, res, next) => {
    console.log('Got body:', req.body);
    let respData = {
        state: 0,
        message: '',
        data: {}
    };

    try {
        const lsToken = req.headers['ls-token'];

        //TODO: check user identity
        console.log('Control device, ls-token: ', lsToken);

        const type = req.body.type;
        let meshDevCommand = null
        if (type === 'luminaire_control') {
            meshDevCommand = meshUtils.getLuminaireCommandData(req);
        }
        else if (type === '5ch_relay_control') {
            meshDevCommand = meshUtils.get5ChRelayCommandData(req);
        }
        else {
            console.error('Unsupported device type');
        }

        if (meshDevCommand) {
            const sceneId = req.params.scene_id;
            const host_id = sceneId.substring(0, 10);
            meshUtils.sendMeshCommand(host_id, meshDevCommand);
            respData = {
                state: 0,
                message: 'Ok',
                data: {}
            };
        }
        else {
            respData = {
                state: 1,
                message: 'Failed to send command, command not supported by the server!',
                data: {}
            };
        }

        res.json(respData);
    } catch (err) {
        respData = {
            state: 1,
            message: 'Failed to send command, error occurred while sending command: ' + err,
            data: {}
        };
        console.log(respData.message);
        res.json(respData);
    }
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
                color: req.body.color,
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
        const devType = req.body.type;
        const devIdSpecified = req.body.id;
        if (devType === null || devType === undefined || devType === '') {
            let respData = {
                state: 1,
                message: 'Dev type must be provided!',
                data: {}
            };
            res.json(respData);
            return;
        }
        const devTypeInfo = rtspConf.devType[devType];
        console.log('Device type: ', devTypeInfo);
        // For Lengshuo and Jiulong both, in Lengshuo, user wants to specify the device ID themselves,
        // In jiulong, however, they want to use device type only to map a particular device(i.e., device type & device ID),
        // Here, if the user procided ID, we will not use the maped one
        const devId = devIdSpecified ? devIdSpecified : devTypeInfo.id;

        if (devId === null || devId === undefined || devId === '') {
            let respData = {
                state: 1,
                message: 'Cannot find a associated device ID for such type!',
                data: {}
            };
            res.json(respData);
            return;
        }

        axios.post('http://127.0.0.1:3001/api/v1/current-seg-fig', {
            id: devId,
            date: req.body.date,
            scene_id: req.body.scene_id,
            type: devType,
            cluster: req.body.cluster,
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

// Current video replay, for local deployment only (Jiulong)
// Prequsities: 1) ffmpeg installed, 2) rtmp server (Nginx) setup
router.post('/v1/test/current/start-video', async (req, res) => {
    console.log('Start video stream for recorded in current sensor scene: ' + JSON.stringify(req.body));
    try {
        const sceneId = req.body.scene_id;
        const devId = req.body.dev_id;
        const startTime = req.body.start_time;
        const endTime = req.body.end_time;
        const rtsp = `${rtspConf.rtsps[devId]}?starttime=${startTime}&endtime=${endTime}`;

        const rtmp = 'rtmp://localhost:1935/tkt_test/jiulongdczb_ch0';
        const ffmpegOptions = [
            '-i', rtsp,
            '-filter:v',
            'fps=fps=12',
            '-vcodec',
            'libx264',
            '-an',
            '-s',
            '1024x768',
            '-f',
            'flv',
            '-s',
            '1024x768',
            '-b:v',
            '125k',
            '-bufsize',
            '125k',
            '-f',
            'flv',
            rtmp
        ];
        //const ffmpegOptions = [
	//	'-i', rtsp,
	//	'-vcodec', 'copy',
	//	'-an', '-f', 'flv',
	//	rtmp
	//];

        try {
            execSync(ffmpegKillCmd);
        }
        catch (err) {
            console.log('No ffmpege started');
        }

        console.log('Trying to start ffmpeg:', rtsp);

        let ffmpeg_process = spawn(ffmpegPath, ffmpegOptions);

        ffmpeg_process.on('error', (err) => {
            console.error('Failed to start ffmpeg:', err);
        });

        ffmpeg_process.stdout.on('data', (data) => {
            console.log(`ffmpeg stdout: ${data}`);
        });

        ffmpeg_process.stderr.on('data', (data) => {
            console.error(`ffmpeg stderr: ${data}`);
        });

        ffmpeg_process.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
        });

        let respData = {
            state: 0,
            message: 'Successfully start the video ffmpeg push service',
            data: {}
        };
        console.log('Successfully start the video ffmpeg push service')
        res.json(respData)
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

// Current available list of device types in the specified scene
router.get('/v1/test/current/dev-types/:scene_id/:date?', async (req, res) => {
    try {
        const allFiles = fs.readdirSync(`/usr/local/ls-apps/ls-data-server/ls_data_app/static/data/current/${req.params.scene_id}`);
        let outDevTypes = [];

        let todayStr = req.params.date;
        if (todayStr === null || todayStr === undefined || todayStr === '') {
            todayStr = datetimeUtils.todayDate();
        }

        for (const file of allFiles) {
            if (file.includes(todayStr)) {
                const words = file.split('_');
                const devID = words[2].substring(4);
                for (const t in rtspConf.devType) {
                    if (rtspConf.devType[t].id === devID) {
                        outDevTypes.push({
                            type: t,
                            name: rtspConf.devType[t].name,
                            id: devID
                        })
                    }
                }
            }
        }

        let respData = {
            state: 0,
            message: 'Get list of available devices succeed!',
            data: outDevTypes
        };
        res.json(respData);
    } catch (err) {
        let respData = {
            state: 1,
            message: 'Error occurred while fetching the list of devices: ' + err,
            data: {}
        };
        console.log('Error occurred while fetching the list of devices: ' + JSON.stringify(err))
        res.json(respData)
    }
});

module.exports = router;
