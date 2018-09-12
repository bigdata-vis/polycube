// IIFE initializing net vis module 
(() => {
    // PolyCube mobule
    // WebGL detector -> error message if not supported
    if(!Detector.webgl) { 
        Detector.addGetWebGLMessage({ parent: document.getElementsByClassName('application-wrapper')[0] }); 
        return;
    } else { 
        console.log(`WebGL support: ${Detector.webgl}`);
    }
    
    let pCube = {};
    /**
     * PolyCube Data array
     * General:         id, data_type, title, description, media_url, external_url, comments
     * Temporal:        date_time (point in time), date_time_uncert(1-10)
     * Geographical:    location_name, latitude, longitude, location_granularity (city,region,country), location_uncert (1-10)]
     * Categorical:     category_1, category_2, category_3, category_4, category_5
     * Relational:      target_nodes[], directed[], label[], date_range[(start-end)]
     */
    let pCubeData = [];
    let pCubeSegmentedData = new Map();
    // D3 settings
    let svg;
    const width = 800;  // px
    const height = 800; // px

    // pcube config (could be external e.g., G-sheets config)
    let slices = 0; 

    // start / end dates
    const startDate = new Date('1920');
    const endDate = new Date('2000');

    // WebGL (ThreeJS) config
    let scene, renderer, camera, controls;
    let cube, mesh, box;
    let nodes, links;

     /**
     * Draw elements function attached to pCube module.
     */
    pCube.drawElements = () => {

    };

    /**
     * Switch to STC view
     */
    pCube.spaceTimeCube = () => {};

    /**
     * Switch to JP view
     */
    pCube.juxtapositionCube = () => {};

    /**
     * Switch to SI view
     */
    pCube.superImpositionCube = () => {};

    /**
     * Switch to ANI view
     */
    pCube.animationCube = () => {};

    /**
     * Start animation loop
     */
    pCube.animate = () => {
        requestAnimationFrame(pCube.animate);
        controls.update();
        pCube.render();
    };

    /**
     * Call this function to start rendering loop
     */
    pCube.render = () => {
        renderer.render(scene, camera);
    };

    /**
     * Initialize netvis module with data 
     * @param data - array of data (default: cushman_relationships.json)
     * TODO: Allow user selection of different datasets
     */
    init = (data) => {
        // Set data
        pCubeData = data;
        // TODO: Segment data based on time intervals
        let [minDate, maxDate] = d3.extent(pCubeData.map(d => new Date(d.date_time)));
        // Define intervals (e.g. years per slice) 
        // Calculate how many slices fit in our extent
        // Segment data based on that using d3.nest? 

        // Setup WebGL renderer 
        renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0.5);
        document.getElementsByClassName('application-wrapper')[0].appendChild(renderer.domElement);

        // Setup camera
        camera = new THREE.PerspectiveCamera(40, width/height, 1, 10000);
        camera.position.set(0,0,5); // default camera position
        
        // Setup controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.enableDampening = true;
        controls.enableZoom = true;

        // Setup scene
        scene = new THREE.Scene();

        // Setup cube
        cube = new THREE.Object3D();
  
        let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        let material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        cube = new THREE.Mesh( geometry, material );
        cube.name = 'PolyCube';
        scene.add(cube);


        // Add things to Scene
        scene.add(cube);

        pCube.animate();
    }

     /**
     * Transform incoming JSON/CSV data into format required for
     * NetVis module to work
     */
    getData = () => {
        let xhr = new XMLHttpRequest();
        xhr.overrideMimeType('application/json');
        xhr.open('GET', './data/cushman_relationships.json');
        xhr.send();
        xhr.onreadystatechange = function() {    
            if(this.readyState == 4 && this.status == '200') {
                init(JSON.parse(xhr.responseText));
            } 
        }
    }

    /**
     * Event listener for window resizing
     */
    onResize = () => {
        // update camera and renderer
        camera.aspect = width/wheight;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };

    /**
     * Event listener for document scrolling
     */
    onZoom = ($event) => {
        $event.preventDefault();
        $event.stopPropagation();
        let fovMAX = 160;
        let fovMIN = 1;
        camera.fov -= event.wheelDeltaY * 0.01;
        camera.fov = Math.max( Math.min( camera.fov, fovMAX ), fovMIN );
        camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, width / height, camera.near, camera.far);
    }


    /**
     * Clear scene function attatched to pCube module.
     */
    pCube.clear = () => {

    };

    /**
     * NOTE: Script execution starts here
     */
    if(window) {
        // fixes camera and perspective on resize events
        window.addEventListener('resize', onResize);
    }
    if(document) {
        // mousewheel || wheel event used to zoom instead of scroll the document
        document.addEventListener( 'mousewheel', onZoom, false );
    }
    // Get data to trigger parsing and initializing pcube
    getData();
    
    // export pCube to window
    window.polyCube = pCube;
})();