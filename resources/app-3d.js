//
// Plumbob model from "https://sketchfab.com/models/ddcfc38215764692823b2e1e31924071" by Anthony Z. Davis on Sketchfab
//
// Crystal stone model from GenEugene "https://sketchfab.com/geneugene" on Sketchfab
// "https://sketchfab.com/models/1ad829e2f464446fa4945562ab611255"
//
// Sci-fi Crate model from Darren Mcnerney "https://sketchfab.com/DarrenMcnerneyPortfolio" on SketchFab
// "https://sketchfab.com/models/0e60a62a8f1e4048b638a32eb0661015"
//
// Birch Tree - Smashy Craft Series - Free,  Pine Tree - Smashy Craft Series - Free, Grassland Tree - Smashy Craft Series - Free
// models from BitGem "https://sketchfab.com/bitgem" on Sketchfab
// <a href="https://sketchfab.com/models/f0203eb84beb4d638d148e2116f5dbf7"
// <a href="https://sketchfab.com/models/08014e92a59244c992884091218230b8"
// <a href="https://sketchfab.com/models/1539bad802904a619f4fe1f1694229b0"
        
var sharedState = {
    setWorldMap: null,
    savedWorldMap: null,
    clearPlaced: false,
    anchorUpdate: null,
    addAnchor: null,
    arCollab: false,
    doProcessing: true,
    showBoomBox: false,
    doCV: false,
    getMap: 0,
    prevGetMap: 0,
    xrSlide: false,
    showArScene: false,
    showVrScene: false
}

window.sharedState = sharedState;

class PageApp extends XRExampleBase {
    constructor(domElement){
        super(domElement, false, true, true, true)

        this.textBox = document.createElement('span')
        this.textBox.setAttribute('class', 'ar-text-box')
        this.textBox.innerText = ''
        this.textBox.visibility = false;

        domElement.parentNode.insertBefore(this.textBox, domElement)

        let secret = Reveal.getConfig().multiplex.secret;
        this.isMaster = !(typeof secret == 'undefined' || secret == null || secret === '') ;

        window.addEventListener('resize', () => {
            this.triggerResize = true;
        })
    }

    // Called during construction to allow the app to populate this.scene
    initializeScene() {

        this.trackingState = "unknown";
        this.clock = new THREE.Clock()
		this._tapEventData = null // Will be filled in on touch start and used in updateScene
        this.meshes = []
        this.clonemeshes = []
        this.geometries = []
        this.femaleGeometry = null
        this.maleGeometry = null
        
        this.firstMarker = true;
        this.markers = [];
        this.camPose = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        this.markerAnchors = []
        this.markerBoxes = []
        this.rotation = -1;
        this.tempMat = new THREE.Matrix4();
        this.tempMat2 = new THREE.Matrix4();
        this.tempQuat = new THREE.Quaternion();
        this.tempVec = new THREE.Vector3();

        this.tempScale = new THREE.Vector3();
        this.tempPos = new THREE.Vector3();
        this.tempQuaternion = new THREE.Quaternion();

        // for basic map stuff
        this.myAnchor = null;

        // has openCV loaded?
        this.doCV = true;
        this.openCVready = false;
        this.cvStatusTxt = "";

        this.spinCount = 1;

        this.triggerResize = true;

        this.anchorBlastCounter = 0;

        this.colors = [
            0xff4422,
            0xff9955,
            0xff77dd,
            0xff7744,
            0xff5522,
            0xff9922,
            0xff99ff
        ]

        // const loader = new THREE.BinaryLoader()
        // loader.load('./resources/webxr/examples/models/female02/Female02_bin.js', geometry => {
        //     this.femaleGeometry = geometry.vertices
        //     this.geometries.push(this.femaleGeometry)
        //     //this.floorGroup.add(this.createSceneGraphNode())
        // })
        // loader.load('./resources/webxr/examples/models/male02/Male02_bin.js', geometry => {
        //     this.maleGeometry = geometry.vertices
        //     this.geometries.push(this.maleGeometry)
        // })

        var renderModel = new THREE.RenderPass( this.scene, this.camera );
        
        var effectBloom = new THREE.BloomPass( 0.75 );
        var effectFilm = new THREE.FilmPass( 0.5, 0.5, 1448, false );

        var effectFocus = new THREE.ShaderPass( THREE.FocusShader );

        effectFocus.uniforms[ "screenWidth" ].value = window.innerWidth;
        effectFocus.uniforms[ "screenHeight" ].value = window.innerHeight;

        this.composer = new THREE.EffectComposer( this.renderer );

        this.composer.addPass( renderModel );
        //renderModel.renderToScreen = true;
        this.composer.addPass( effectBloom );
        // effectBloom.renderToScreen = true;
        this.composer.addPass( effectFilm );
        effectFilm.renderToScreen = true;
        // this.composer.addPass( effectFocus );
        // effectFocus.renderToScreen = true;

        
        // Add a box at the scene origin
        let box = new THREE.Mesh(
            new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
            new THREE.MeshPhongMaterial({ color: '#DDFFDD' })
        )
        this.floorBox = box;
        box.position.set(0, 0, 0)
        this.floorGroup.add(box)

        // Add a few lights
        this.scene.add(new THREE.AmbientLight('#FFF', 0.2))
        let directionalLight = new THREE.DirectionalLight('#FFF', 0.6)
        directionalLight.position.set(0, 10, 0)
        this.scene.add(directionalLight)

        this.scene.background = null;
        
        // something for the shared anchor
        this.sharedAnchorNode = new THREE.Group()
        let box2 = new THREE.Mesh(
            new THREE.BoxBufferGeometry(0.06, 0.06, 0.06),
            new THREE.MeshPhongMaterial({ color: '#FF00DD' })
        )
        box2.position.set(0, 0, 0)
        //this.sharedAnchorNode.add(box2)

        // something else for the shared anchor
        this.dynamicSharedAnchorNode = new THREE.Group()
        var geometry = new THREE.SphereGeometry( 0.05, 10, 7 );
        var material = new THREE.MeshPhongMaterial( {color: 0xffff00} );
        //this.dynamicSharedAnchorNode.add( new THREE.Mesh( geometry, material ) );

        this.sharedAnchorNode.add(this.dynamicSharedAnchorNode)
        this.dynamicSharedAnchorNode.matrixAutoUpdate = false;

        // Create the environment map
        const path = './resources/webxr/examples/textures/Park2/'
        const format = '.jpg'
        this.envMap = new THREE.CubeTextureLoader().load([
            path + 'posx' + format, path + 'negx' + format,
            path + 'posy' + format, path + 'negy' + format,
            path + 'posz' + format, path + 'negz' + format
        ])
        this.envMap.format = THREE.RGBFormat
        //this.scene.background = this.envMap

        // Add the boom box
        this.spinCount++;
        loadGLTF('./resources/webxr/examples/models/BoomBox/glTF-pbrSpecularGlossiness/BoomBox.gltf').then(gltf => {
            this.decrementSpin();
            gltf.scene.scale.set(15, 15, 15)
            gltf.scene.position.set(0, 1, -1)
            gltf.scene.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)

            gltf.scene.traverse(node => {
                if (node.material && (node.material.isMeshStandardMaterial || (node.material.isShaderMaterial && node.material.envMap !== undefined))){
                    node.material.envMap = this.envMap
                        node.material.needsUpdate = true
                }
            })
            this.boomBox = gltf.scene;
            this.floorGroup.add(gltf.scene)
        }).catch((...params) =>{
            console.error('could not load gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        loadGLTF('./resources/models/DuckyMesh.glb').then(gltf => {
            this.ducky = gltf.scene;
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load ducky gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        this.stone = new THREE.Group();
        this.dynamicSharedAnchorNode.add(this.stone)
        loadGLTF('./resources/models/crystal_stone/scene.gltf').then(gltf => {
            this.stone.add(gltf.scene);
            gltf.scene.scale.set(0.025,0.025, 0.025)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load stone gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        this.crate = new THREE.Group();
        this.sharedAnchorNode.add(this.crate)
        loadGLTF('./resources/models/sci-fi_crate/scene.gltf').then(gltf => {
            this.crate.add(gltf.scene);
            gltf.scene.scale.set(0.05,0.05, 0.05)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load crate gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;

        // set up an array of things we can click on
        this.treesIndex = 0;
        this.trees = [];
        this.trees[0] = new THREE.Group();
        loadGLTF('./resources/models/birch_tree_-_smashy_craft_series_-_free/scene.gltf').then(gltf => {
            this.trees[0].add(gltf.scene);
            gltf.scene.scale.set(0.001,0.001, 0.001)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load birch gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        this.trees[1] = new THREE.Group();
        loadGLTF('./resources/models/grassland_tree_-_smashy_craft_series_-_free/scene.gltf').then(gltf => {
            this.trees[1].add(gltf.scene);
            gltf.scene.scale.set(0.001,0.001, 0.001)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load grassland tree gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        this.trees[2] = new THREE.Group();
        loadGLTF('./resources/models/pine_tree_-_smashy_craft_series_-_free/scene.gltf').then(gltf => {
            this.trees[2].add(gltf.scene);
            gltf.scene.scale.set(0.001,0.001, 0.001)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load pine tree gltf', ...params)
            this.decrementSpin();
        })

        this.spinCount++;
        this.trees[3] = new THREE.Group();
        loadGLTF('./resources/models/police_officer_-_smashy_craft_series_-_free/scene.gltf').then(gltf => {
            this.trees[3].add(gltf.scene);
            gltf.scene.scale.set(0.003,0.003, 0.003)
            this.decrementSpin();
        }).catch((...params) =>{
            console.error('could not load police officer gltf', ...params)
            this.decrementSpin();
        })
        // loadGLTF('./resources/models/the_sims_-_plumbob/scene.gltf').then(gltf => {
        //     this.plumbbob = gltf.scene;
        //     gltf.scene.scale.set(0.001,0.001, 0.001)

        //     this.dynamicSharedAnchorNode.add(this.plumbbob)
        // }).catch((...params) =>{
        //     console.error('could not load plumbob gltf', ...params)
        // })
    }

    newSession() {					
        this.worker = new Worker ("resources/webxr/examples/opencv-aruco/worker.js")

        // start with video frames paused till opencv loaded
        this.session.stopVideoFrames();

        this.worker.onmessage = (ev) => {
            switch (ev.data.type) {
                case "cvFrame":
                    var videoFrame = XRVideoFrame.createFromMessage(ev)

                    this.markers = ev.data.markers;
                    this.session.getVideoFramePose(videoFrame, this.camPose);

                    var rotation = videoFrame.camera.cameraOrientation;
                    var buffer = videoFrame.buffer(0)

                    var width = buffer.size.width
                    var height = buffer.size.height
                    if (this.triggerResize || this.rotation != rotation) {
                        this.triggerResize = false;
                        this.rotation = rotation;
                    }
                    videoFrame.release();

                    break;

                case "cvStart":
                    // request the next one when the old one finishes
                    this.requestVideoFrame();
                    break
                    
                case "cvAfterMat":
                    break;

                case "cvAfterDetect":
                    break;

                case "cvReady":
                    this.decrementSpin();
                    console.log('OpenCV.js is ready');
                    //this.session.startVideoFrames();
                    this.openCVready = true				
                    break;

                case "cvStatus":
                    this.cvStatusTxt = ev.data.msg;
                    break;
            }
        }

        this.worker.addEventListener('error', (e) => { 
            console.log("worker error:" + e) 
        })

        this.setVideoWorker(this.worker);

        this.session.addEventListener(XRSession.NEW_WORLD_ANCHOR, this._handleNewWorldAnchor.bind(this))
        this.session.addEventListener(XRSession.REMOVE_WORLD_ANCHOR, this._handleRemoveWorldAnchor.bind(this))
        this.session.addEventListener(XRSession.TRACKING_CHANGED, this._handleTrackingChanged.bind(this))
    }

    decrementSpin() {
        this.spinCount--;
        if (this.spinCount === 0) {
            spinner.stop()
        }
    }

    setDoCV (doit) {
        this.doCV = doit;
        if (doit) {
            this.session.startVideoFrames();
        } else {
            this.session.stopVideoFrames();        
        }
    }

	doRender(){
        if (!sharedState.xrSlide) { return; }

        if (sharedState.doProcessing) {
            this.renderer.clear();
            this.composer.render( 0.01 );    
        } else {
            this.renderer.render(this.scene, this.camera)
        }
	}

    _handleTrackingChanged(event) {
        this.trackingState = event.detail
    }

    _handleRemoveWorldAnchor(event) {
        let anchor = event.detail
        //console.log("removed anchor ", anchor.uid)

        if (anchor.uid == "my-first-anchor") {
            this.myAnchor = null
            console.log("got rid of my anchor!")
        } 
    }

    _handleNewWorldAnchor(event) {
        let anchor = event.detail
        console.log("added anchor ", anchor.uid)

        // we will take this appearing as a sign a new map has been loaded, and we will rebuild whatever we need to!
        if (anchor.uid == "my-first-anchor") {
            this.setupSharedAnchor(anchor)
            console.log("get my anchor!")
        } 
    }

    setupSharedAnchor(anchor) {
        var anchorOffset = new XRAnchorOffset(anchor.uid)
        this.myAnchor = anchorOffset            
        this.addAnchoredNode(anchorOffset, this.sharedAnchorNode)
    }

    // Called once per frame, before render, to give the app a chance to update this.scene
	updateScene(frame){
        if (this.anchorBlastCounter-- < 0) {
            this.anchorBlastCounter = sharedState.arCollab ? 60 : 240;

            if (this.myAnchor) {
                this.tempMat.fromArray(frame.views[0].viewMatrix)
                this.tempMat2.getInverse(this.sharedAnchorNode.matrix)

                this.tempMat.premultiply(this.tempMat2)
                RevealMultiARClient.updateAnchor(this.tempMat.elements)

                //const anchor = frame.getAnchor(this.myAnchor.anchorUID)
                //if (anchor != null){
                //    console.log("my anchor pose: ", this.myAnchor.getOffsetTransform(anchor.coordinateSystem))
                //}                
            }
        }

        var SPEED = 0.01;

        this.stone.rotation.x -= SPEED * 2;
        this.stone.rotation.y -= SPEED;
        this.stone.rotation.z -= SPEED * 3;
        
        
        // #define WEB_AR_TRACKING_STATE_NORMAL               @"ar_tracking_normal"
        // #define WEB_AR_TRACKING_STATE_LIMITED              @"ar_tracking_limited"
        // #define WEB_AR_TRACKING_STATE_LIMITED_INITIALIZING @"ar_tracking_limited_initializing"
        // #define WEB_AR_TRACKING_STATE_LIMITED_MOTION       @"ar_tracking_limited_excessive_motion"
        // #define WEB_AR_TRACKING_STATE_LIMITED_FEATURES     @"ar_tracking_limited_insufficient_features"
        // #define WEB_AR_TRACKING_STATE_NOT_AVAILABLE        @"ar_tracking_not_available"
        // #define WEB_AR_TRACKING_STATE_RELOCALIZING         @"ar_tracking_relocalizing"
        var msgText = (this.spinCount > 0) ? "Downloading " + this.spinCount.toString() + " items<br>" : "";
        switch (this.trackingState) {
            case "unknown": // the initial value
            case "ar_tracking_normal":
            break;

            case "ar_tracking_limited":
                msgText += "Spatial Tracking <em>Functionality is Limited<em>"
            break;
    
            case "ar_tracking_limited_initializing":
                msgText += "Spatial Tracking <em>Initializing</em>"
            break;
        
            case "ar_tracking_limited_excessive_motion":
                msgText += "Spatial Tracking <em>Too Much Motion</em>"
            break;
            
            case "ar_tracking_limited_insufficient_features":
                msgText += "Spatial Tracking <em>Too Much Motion</em>"
            break;
            
            case "ar_tracking_not_available":
                msgText += "Spatial Tracking <b>Unavailable</b>"        
            break;

            case "ar_tracking_relocalizing":
                msgText += "Spatial Tracking <b>Relocalizing</b><br>If relocalization does not succeed,<br>reset tracking system from menu"        
            break;
        }
        //console.log ("tracking state: " + msgText)

        // update from shared state
        if (sharedState.doCV != this.doCV) {
            this.setDoCV(sharedState.doCV)
        }
        if (this.boomBox) {
            this.boomBox.visible = sharedState.showBoomBox;
        }

        if (this.floorBox) {
            this.floorBox.visible = sharedState.showArScene
        }
        if (this.sharedAnchorNode) {
            this.sharedAnchorNode.visible  = sharedState.showArScene
        }

        if (this.dynamicSharedAnchorNode) {
            this.dynamicSharedAnchorNode.visible  = sharedState.showArScene
        }

        if (sharedState.showVrScene) {
            this.scene.background = this.envMap                
        } else {
            this.scene.background = null;
        }

        if (sharedState.setWorldMap) {
            frame.removeAnchor('my-first-anchor')

            this.session.setWorldMap(sharedState.setWorldMap).then(val => {
                console.log("set worldMap ok")
            }).catch(err => {
                console.error('Could not set world Map', err)
            })
            sharedState.savedWorldMap = sharedState.setWorldMap;
            sharedState.setWorldMap = null
        }

        if (sharedState.anchorUpdate > 0) {
            this.dynamicSharedAnchorNode.matrixWorldNeedsUpdate = true
            this.dynamicSharedAnchorNode.matrix.fromArray(sharedState.anchorUpdate.anchor); 
            sharedState.anchorUpdate = null;
        }

        // only do this in the master!  
        if (this.isMaster) {
            var moreText = (msgText === "" ? "" : msgText + "<br>")
            switch (sharedState.getMap) {
                // case 1 happens in both client and master
                case 1:
                    if (this.myAnchor) {
                        // we shall start by removing my anchor
                        frame.removeAnchor("my-first-anchor")
                        this.myAnchor = null;
                    }
                    break;

                case 2:
                    if (!this.myAnchor) {
                        // just to be sure
                        frame.removeAnchor("my-first-anchor")
                        var anchor = frame.getAnchor('my-first-anchor')
                        if (!anchor) {
                            console.log('could not find the base anchor')
                            const headCoordinateSystem = frame.getCoordinateSystem(XRCoordinateSystem.EYE_LEVEL)
                            const anchorUID = frame.addAnchor(headCoordinateSystem, [0,-1,0], [0,0,0,1], "my-first-anchor")
                            anchor = frame.getAnchor(anchorUID)
                        }
                        this.setupSharedAnchor(anchor)
                    }

                    // possible values:
                    // #define WEB_AR_WORLDMAPPING_NOT_AVAILABLE   @"ar_worldmapping_not_available"
                    // #define WEB_AR_WORLDMAPPING_LIMITED         @"ar_worldmapping_limited"
                    // #define WEB_AR_WORLDMAPPING_EXTENDING       @"ar_worldmapping_extending"
                    // #define WEB_AR_WORLDMAPPING_MAPPED          @"ar_worldmapping_mapped"
                    var moreText = (msgText === "" ? "" : msgText + "<br>")
                    switch (this.session.getWorldMappingStatus()) {
                        case "ar_worldmapping_not_available":
                        moreText += "<b>World Map Not Ready</b>, look around the room"
                        break;

                        case "ar_worldmapping_limited":
                        moreText += "<em>World Map of Limited Quality</em>, look around the room"
                        break;

                        case "ar_worldmapping_extending":
                        moreText += "<em>World Map Ready</em>, extending..."
                        break;

                        case "ar_worldmapping_mapped":
                        moreText += "<em>World Map Ready</em>"
                        break;
                    }
                    msgText = moreText;
                    //console.log ("tracking state: " + msgText)
                    break;

                case 3:
                    // reset it, only want to act on transition
                    sharedState.getMap = -3;
                    
                    // only if we are coming from slide 2
                    if (sharedState.prevGetMap === 2) {
                        this.session.getWorldMap().then(worldMap => {
                            console.log("got worldMap, size = ", worldMap.worldMap.length)

                            // save it so we can load it later
                            sharedState.savedWorldMap = worldMap

                            for (var i=0; i < worldMap.anchors.length; i++) {
                                console.log("anchor: ", worldMap.anchors[i].name, "  pose: ", worldMap.anchors[i].transform )
                            }
                            RevealMultiARMaster.postMap(worldMap);
                        }).catch(err => {
                            console.error('Could not get world Map', err)
                        });
                    }
                    
            }
        }

        if (msgText.length > 0 && sharedState.xrSlide) {
            this.textBox.innerHTML = msgText
            this.textBox.style.visibility = "visible";
        } else {
            this.textBox.style.visibility = "hidden";
        }

        // image tracking
        if (this.markers.length > 0) {
            var m = this.markers[0].pose;
            var c = this.camPose

            for (var i = 0; i < this.markers.length; i++ ) {
                var markerId = this.markers[i].id
                var pose = this.markers[i].pose;

                if (!(markerId in this.markerAnchors)) {
                    var markerbox = new THREE.Object3D();
                    if (this.firstMarker) {
                        this.firstMarker = false;
                        this.ducky.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2)
                        this.ducky.scale.set(0.5, 0.5, 0.5)

                        // this.ducky.rotation.set(90,0,0)
                        // this.ducky.position.set(0,0,0.0)
                        markerbox.add(this.ducky)
                    } else {
                        // Add a box 
                        var markerboxGeom = new THREE.Mesh(
                            new THREE.BoxBufferGeometry(0.053, 0.053, 0.053),
                            new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff}) //'#2D5FFD' })
                        )
                        markerboxGeom.position.set(0, 0, 0.053/2);
                        markerbox.add(markerboxGeom)
                    }
                    this.markerBoxes[markerId] = markerbox

                    const coordinates = frame.getCoordinateSystem(XRCoordinateSystem.TRACKER)

                    markerbox.matrix.fromArray(this.camPose)
                    this.tempMat.fromArray(pose)
                    markerbox.matrix.multiply(this.tempMat)
                    markerbox.matrixWorldNeedsUpdate = true

                    this.tempQuat.setFromRotationMatrix(markerbox.matrix)

                    const anchorUID = frame.addAnchor(coordinates, 
                                [markerbox.matrix.elements[12], markerbox.matrix.elements[13], markerbox.matrix.elements[14]],
                                [this.tempQuat.x, this.tempQuat.y, this.tempQuat.z, this.tempQuat.w])
                    var anchorOffset = new XRAnchorOffset(anchorUID)
                    this.markerAnchors[markerId] = anchorOffset;

                    this.addAnchoredNode(anchorOffset, markerbox)
                } else {
                    this.tempMat2.fromArray(this.camPose)
                    this.tempMat.fromArray(pose)
                    this.tempMat2.multiply(this.tempMat)

                    var markerBox = this.markerBoxes[markerId]
                    var anchorOffset = this.markerAnchors[markerId]  

                    anchorOffset.setIdentityOffset()			
                    var anchor = frame.getAnchor(anchorOffset.anchorUID)					
                    this.tempMat.fromArray(anchorOffset.getOffsetTransform(anchor.coordinateSystem))
                    this.tempMat.getInverse(this.tempMat)
                    this.tempMat.premultiply(this.tempMat2)

                    anchorOffset.poseMatrix = this.tempMat.elements
                }
            }
        } 

        let delta = 10 * this.clock.getDelta()
        delta = delta < 2 ? delta : 2
        /*

        for(let j = 0, jl = this.clonemeshes.length; j < jl; j++){
            this.clonemeshes[j].mesh.rotation.y += -0.1 * delta * this.clonemeshes[j].speed
        }
        */

        let data = null
        let vertices = null
        let vertices_tmp = null
        let vl = null
        let d = null
        let vt = null
        let mesh = null
        let p = null
        for(let j = 0, jl = this.meshes.length; j < jl; j ++){
            data = this.meshes[j]
            mesh = data.mesh
            vertices = data.vertices
            vertices_tmp = data.vertices_tmp
            vl = data.vl
            if (! data.dynamic) continue
            if (data.start > 0){
                data.start -= 1
            } else {
                if (!data.started){
                    data.direction = -1
                    data.started = true
                }
            }
            for (let i = 0; i < vl; i ++){
                p = vertices[i]
                vt = vertices_tmp[i]
                // falling down
                if (data.direction < 0){
                    // let d = Math.abs(p.x - vertices_tmp[i][0]) + Math.abs(p.y - vertices_tmp[i][1]) + Math.abs(p.z - vertices_tmp[i][2])
                    // if (d < 200){
                    if (p.y > 0){
                        // p.y += data.direction * data.speed * delta
                        p.x += 1.5 * (0.50 - Math.random()) * data.speed * delta
                        p.y += 3.0 * (0.25 - Math.random()) * data.speed * delta
                        p.z += 1.5 * (0.50 - Math.random()) * data.speed * delta
                    } else {
                        if (! vt[3]){
                            vt[3] = 1
                            data.down += 1
                        }
                    }
                }
                // rising up
                if (data.direction > 0){
                    //if (p.y < vertices_tmp[i][1]){
                    //	p.y += data.direction * data.speed * delta
                    d = Math.abs(p.x - vt[0]) + Math.abs(p.y - vt[1]) + Math.abs(p.z - vt[2])
                    if (d > 1){
                        p.x += - (p.x - vt[0]) / d * data.speed * delta * (0.85 - Math.random())
                        p.y += - (p.y - vt[1]) / d * data.speed * delta * (1 + Math.random())
                        p.z += - (p.z - vt[2]) / d * data.speed * delta * (0.85 - Math.random())
                    } else {
                        if (! vt[4]){
                            vt[4] = 1
                            data.up += 1
                        }
                    }
                }
            }
            // all down
            if (data.down === vl){
                if (data.delay === 0){
                    data.direction = 1
                    data.speed = 10
                    data.down = 0
                    data.delay = 320
                    for(let i = 0; i < vl; i ++){
                        vertices_tmp[i][3] = 0
                    }
                } else {
                    data.delay -= 1
                }
            }
            // all up
            if (data.up === vl){
                if (data.delay === 0){
                    data.direction = -1
                    data.speed = 35
                    data.up = 0
                    data.delay = 120
                    for(let i = 0; i < vl; i ++){
                        vertices_tmp[i][4] = 0
                    }
                } else {
                    data.delay -= 1
                }
            }
            mesh.geometry.verticesNeedUpdate = true
        }

		// If we have tap data, attempt a hit test for a surface
		if(this._tapEventData !== null){
			const x = this._tapEventData[0]
			const y = this._tapEventData[1]
			this._tapEventData = null
			// Attempt a hit test using the normalized screen coordinates
			frame.findAnchor(x, y).then(anchorOffset => {
				if(anchorOffset === null){
					console.log('miss')
					return
				}
                console.log('hit', anchorOffset)
                
                var anchor = frame.getAnchor(anchorOffset.anchorUID)					
                this.tempMat.fromArray(anchorOffset.getOffsetTransform(anchor.coordinateSystem))
                this.tempMat.decompose(this.tempPos,this.tempQuaternion, this.tempScale); 
               
                this.createSceneGraphNode(frame, this.tempPos, this.tempQuaternion, this.treesIndex);
                RevealMultiARClient.addNewAnchor(this.tempPos, this.tempQuaternion, this.treesIndex)

                this.treesIndex++;
                if (this.treesIndex >= this.trees.length) {
                    this.treesIndex = 0;
                }                
            }).catch(err => {
				console.error('Error in hit test', err)
			})
        }
        
        if (sharedState.addAnchor) {
            this.createSceneGraphNode(frame, sharedState.addAnchor.pos, sharedState.addAnchor.quat, sharedState.addAnchor.index);
            sharedState.addAnchor = null;
        }

        // leave the anchors, how many are we really going to create during a presentation?
        // (can fix that later)
        if (sharedState.clearPlaced) {
            sharedState.clearPlaced = false
            for (var i = 0; i < this.trees.length; i++) {
                if (this.trees[i].parent) {
                    this.trees[i].parent.remove(this.trees[i]);
                }
            }
        }   

    }



    createSceneGraphNode(frame, pos, quat, index){
        const worldCoordinates = frame.getCoordinateSystem(XRCoordinateSystem.TRACKER)
        const anchorUID = frame.addAnchor(worldCoordinates, [pos.x, pos.y, pos.z], [quat._x, quat._y, quat._z, quat._w])

        const group = new THREE.Group()
        var model = this.trees[index];
        group.add(model);

        this.addAnchoredNode(new XRAnchorOffset(anchorUID), group)
    }

    // createSceneGraphNode(){
    //     const group = new THREE.Group()
    //     group.add(this.createMesh(
    //         this.geometries[Math.floor(this.geometries.length * Math.random())], 
    //         0.003,
    //         0,0,0, 
    //         0.005, 
    //         this.colors[Math.floor(this.colors.length * Math.random())],
    //         true
    //     ))
    //     return group
    // }
    // createMesh(originalGeometry, scale, x, y, z, pointSize, color, dynamic){
    //     let i, c, mesh, p
    //     let vertices = originalGeometry
    //     let vl = vertices.length
    //     let geometry = new THREE.Geometry()
    //     let vertices_tmp = []
    //     for (i = 0; i < vl; i ++){
    //         p = vertices[i]
    //         geometry.vertices[i] = p.clone()
    //         vertices_tmp[i] = [p.x, p.y, p.z, 0, 0]
    //     }
    //     if (dynamic){
    //         c = color
    //         mesh = new THREE.Points(geometry, new THREE.PointsMaterial({ size: pointSize, color: c }))
    //         this.clonemeshes.push({ mesh: mesh, speed: 0.5 + Math.random() })
    //     } else {
    //         mesh = new THREE.Points(geometry, new THREE.PointsMaterial({ size: pointSize, color: color }))
    //     }
    //     mesh.scale.x = mesh.scale.y = mesh.scale.z = scale
    //     mesh.position.x = x
    //     mesh.position.y = y
    //     mesh.position.z = z
    //     mesh.quaternion.setFromEuler(new THREE.Euler(0, (Math.PI * 2) * Math.random(), 0))
    //     this.meshes.push({
    //         mesh: mesh,
    //         vertices: geometry.vertices,
    //         vertices_tmp: vertices_tmp,
    //         vl: vl,
    //         down: 0,
    //         up: 0,
    //         direction: 0,
    //         speed: 35,
    //         delay: Math.floor(10 * Math.random()),
    //         started: false,
    //         start: Math.floor(100 * Math.random()),
    //         dynamic: dynamic
    //     })
    //     mesh.name = 'prettyperson: ' + Math.random() 
    //     return mesh
    // }

    // Save screen taps as normalized coordinates for use in this.updateStageGroup
    _onTap(x,y){
        console.log('tap!', x, y)
        //save screen coordinates normalized to -1..1 (0,0 is at center and 1,1 is at top right)
        this._tapEventData = [
            x / window.innerWidth,
            y / window.innerHeight
        ]
    }
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            window.pageApp = new PageApp(document.getElementById('target'))
            window.touchTapHandler = window.pageApp._onTap.bind(window.pageApp);
        } catch(e) {
            console.error('page error', e)
        }
    }, 1000)
})

Reveal.addEventListener('ready', () => {
    RevealMultiARClient.setWorldMap = function (worldMap) {
        sharedState.setWorldMap = worldMap;
    }

    RevealMultiARClient.addAnchor = function (playerId, index, pos, quat) {
        sharedState.addAnchor = { playerId: playerId, index: index, pos: pos, quat: quat };
    }
    RevealMultiARClient.anchorUpdate = 	function (playerId, anchor) {
        //console.log("received Anchor Update: ", playerId, ", ", anchor)
        sharedState.anchorUpdate = {  playerId: playerId, anchor: anchor };
        // window.pageApp.dynamicSharedAnchorNode.matrix.fromArray(anchor); 
        // window.pageApp.dynamicSharedAnchorNode.matrixWorldNeedsUpdate = true
	}
})

///
/// presentation
var updateSharedState = function (states) {
    var xrSession = document.querySelector('.webxr-sessions');
    var xrReality = document.querySelector('.webxr-realities');

    if (states.indexOf("xrReloadMap") >= 0) {
        if (sharedState.savedWorldMap) {
            sharedState.setWorldMap = sharedState.savedWorldMap 
        }
    }

    if (states.indexOf("xrCollab") >= 0) {
        sharedState.arCollab = true
    }

    if (states.indexOf("xrClearPlaced") >= 0) {
        sharedState.clearPlaced = true
    }

    if (states.indexOf("xrslide") < 0) {
        sharedState.xrSlide = false;
        sharedState.doCV = false;

        document.body.style.backgroundColor = "black";
        if (xrSession) {
            xrSession.style.visibility = "hidden";
        }
        if (xrReality) {
            xrReality.style.visibility = "hidden";
        }
    } else {
        sharedState.xrSlide = true;

        document.body.style.backgroundColor = "transparent";
        if (xrSession) {
            xrSession.style.visibility = "visible";
        }
        if (xrReality) {
            xrReality.style.visibility = "visible";
        }

        if (states.indexOf("xrmap1") >= 0) {
            sharedState.getMap = 1;
        } else  if (states.indexOf("xrmap2") >= 0) {
            sharedState.getMap = 2;
        } else if (states.indexOf("xrmap3") >= 0) {
            sharedState.getMap = 3;
        } else {
            sharedState.getMap = 0;
        }

        sharedState.doCV = states.indexOf("computerVision") >= 0
        sharedState.doProcessing = (states.indexOf("3deffects") >= 0)
        sharedState.showBoomBox = (states.indexOf("boombox") >= 0)     

        sharedState.showArScene = states.indexOf("arslide") >= 0
        sharedState.showVrScene = states.indexOf("vrslide") >= 0
    }
}

// Reveal is loaded and ready
Reveal.addEventListener( 'ready', function( event ) {
    // event.currentSlide, event.indexh, event.indexv
    var slideState = event.currentSlide.getAttribute( 'data-state' );
    var states = [];
    if( slideState ) {
        states = slideState.split( ' ' );
    }
    updateSharedState(states)
    sharedState.prevGetMap = 0;
} );


// new slide
Reveal.addEventListener( 'slidechanged', function( event ) {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    var states = [];
    var prevStates = [];

    var slideState = event.currentSlide.getAttribute( 'data-state' );
    if( slideState ) {
        states = slideState.split( ' ' );
    }
    if (event.previousSlide) {
        var prevSlideState = event.previousSlide.getAttribute( 'data-state' );
        if( prevSlideState ) {
            prevStates = prevSlideState.split( ' ' );
        }
    }

    updateSharedState(states)

    if (prevStates.indexOf("xrmap1") >= 0) {
        sharedState.prevGetMap = 1;
    } else  if (prevStates.indexOf("xrmap2") >= 0) {
        sharedState.prevGetMap = 2;
    } else if (prevStates.indexOf("xrmap3") >= 0) {
        sharedState.prevGetMap = 3;
    } else {
        sharedState.prevGetMap = 0;
    }
            
});

// If you set ``data-state="somestate"`` on a slide ``<section>``, "somestate" will 
// be applied as a class on the document element when that slide is opened.
// Furthermore you can also listen to these changes in state via JavaScript:

Reveal.addEventListener( 'xrscan', function (event) {
    console.log('grab map, send to server');
});

Reveal.addEventListener( 'xrslide', function( event ) {
	// // event.active
    // var xrSession = document.querySelector('.webxr-sessions');
    // var xrReality = document.querySelector('.webxr-realities');

    // if (event.active) {
    //     document.body.style.backgroundColor = "transparent";
    //     xrSession.style.visibility = "visible";
    //     xrReality.style.visibility = "visible";
    // } else {
    //     document.body.style.backgroundColor = "black";
    //     xrSession.style.visibility = "hidden";
    //     xrReality.style.visibility = "hidden";
    // }
} );

Reveal.addEventListener( 'arstuff', function( event ) {
} );

//var spinbox = document.querySelector('#spinbox');
Reveal.addEventListener( 'spinbox', function( event ) {
	// event.active
  //  spinbox.setAttribute('visible', event.active);
} );

//var geoAR = document.querySelector('#geo');
Reveal.addEventListener( 'geomarkers', function( event ) {
	// event.active
  //  geoAR.setAttribute('visible', event.active);
} );

//var vuforia = document.querySelector('#frame');
Reveal.addEventListener( 'vuforia', function( event ) {
	// event.active
  //  vuforia.setAttribute('trackvisibility', event.active);
} );

//
// fragments.  Perhaps I can add/remove 3D content when I step through some fragmets in a slide
//

Reveal.addEventListener( 'fragmentshown', function( event ) {
	// event.fragment = the fragment DOM element
} );
Reveal.addEventListener( 'fragmenthidden', function( event ) {
	// event.fragment = the fragment DOM element
} );

