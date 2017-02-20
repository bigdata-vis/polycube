/**
 * Created by simba on 20/02/2017.
 */

var cube = {};
cube.vis = function module(selection) {

    var camera;
    var scene;
    var renderer;
    var controls;
    var cWidth = 200;
    var cHeight = 200;

    var cubeBox = new THREE.Object3D();

    var element;

    //create different materials
    var floorMat = new THREE.MeshPhongMaterial({map: THREE.ImageUtils.loadTexture('textures/map.png')});
    var wallMat = new THREE.MeshPhongMaterial({map: THREE.ImageUtils.loadTexture('textures/map.png')});
    var purpleMat = new THREE.MeshPhongMaterial({color: 0x6F6CC5, specular: 0x555555, shininess: 30});
    var mGlass = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.4,
        transparent: true
    });
    var redMat = new THREE.MeshPhongMaterial({color: 0x1DFF50, specular: 0x555555, shininess: 30});

    init();
    animate();

    exports.element = function (_x) {
        if (!arguments.length)
            return element;
        element = _x;
        return this;
    };

    exports.dataCSV = function (url) {
        //D3 Data Injection
        function v(x, y, z) {
            return new THREE.Vector3(x, y, z);
        }

        var unfiltered = [],
            lowPass = [],
            highPass = [];

        var format = d3.format("+.3f");

        d3.queue()
            .defer(d3.csv, url)
            .await(entryPoint);

        function entryPoint(error, d) {
            if (error) {
                console.error(error)
            }

            d.forEach(function (d, i) {
                unfiltered[i] = {
                    x: +d.x,
                    y: +d.y,//convert date to y axis
                    z: +d.z
                };
            });

            var xExent = d3.extent(unfiltered, function (d) {
                    return d.x;
                }),
                yExent = d3.extent(unfiltered, function (d) {
                    return d.y;
                }),
                zExent = d3.extent(unfiltered, function (d) {
                    return d.z;
                });

            //var colour = d3.schemeCategory20c();

            var xScale = d3.scaleLinear()
                .domain(xExent)
                .range([-100, 100]);

            var yScale = d3.scaleLinear()
                .domain(yExent)
                .range([5, 200]);
            var zScale = d3.scaleLinear()
                .domain(zExent)
                .range([-50, 50]);

            var pointCount = unfiltered.length;

            // Sphere
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(5, 70, 20), redMat);
            sphere.position.set(-15, 130, -20);
            cubeBox.add(sphere);

            for (var i = 0; i < pointCount; i++) {
                var pointGeo = new THREE.Mesh(new THREE.SphereGeometry(3, 30, 20), redMat);

                var x = xScale(unfiltered[i].x);
                var y = yScale(unfiltered[i].y);
                var z = zScale(unfiltered[i].z);

                pointGeo.position.set(x, y, z);
                cubeBox.add(pointGeo);

                //console.log(pointGeo.position.y)
            }

            renderer.render(scene, camera);

        }
    };

    exports.dataGsheet = function (data) {
        var unfiltered = [];
        entryPoint(data);
        function entryPoint(d) {

            d.forEach(function (d, i) {
                unfiltered[i] = {
                    x: +d.x,
                    y: +d.y,//convert date to y axis
                    z: +d.z
                };
            });

            var xExent = d3.extent(unfiltered, function (d) {
                    return d.x;
                }),
                yExent = d3.extent(unfiltered, function (d) {
                    return d.y;
                }),
                zExent = d3.extent(unfiltered, function (d) {
                    return d.z;
                });

            //var colour = d3.schemeCategory20c();

            var xScale = d3.scaleLinear()
                .domain(xExent)
                .range([-100, 100]);

            var yScale = d3.scaleLinear()
                .domain(yExent)
                .range([5, 200]);
            var zScale = d3.scaleLinear()
                .domain(zExent)
                .range([-50, 50]);

            var pointCount = unfiltered.length;

            // Sphere
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(5, 70, 20), redMat);
            sphere.position.set(-15, 130, -20);
            cubeBox.add(sphere);

            for (var i = 0; i < pointCount; i++) {
                var pointGeo = new THREE.Mesh(new THREE.SphereGeometry(3, 30, 20), redMat);

                var x = xScale(unfiltered[i].x);
                var y = yScale(unfiltered[i].y);
                var z = zScale(unfiltered[i].z);

                pointGeo.position.set(x, y, z);
                cubeBox.add(pointGeo);

                //console.log(pointGeo.position.y)
            }

            renderer.render(scene, camera);
        };
    };

    function exports(_selection) {
        return _selection
    }

    function init() {

        //Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color("#66685D");

        //add all cubeBoxes
        scene.add(cubeBox);

        //Add camera
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 100, 350);

        //Add scene elements
        addSceneElements();

        //Add lights
        addLights();

        //Create webGl renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        //Create SVG Render
        //renderer = new THREE.SVGRenderer();
        //renderer.setClearColor(0xf0f0f0);
        //renderer.setSize(window.innerWidth, window.innerHeight);
        //renderer.setQuality('low');

        //Append the Renderer to body
        //document.body.appendChild( renderer.domElement );

        //document.body.appendChild(renderer.domElement);
        document.getElementById(selection).appendChild(renderer.domElement);

        //Add Resize event listener
        window.addEventListener('resize', onWindowResize, false);

        // add orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 100, 0);
    }

    function addLights() {
        //var dirLight = new THREE.DirectionalLight(0xffffff, 1);
        //dirLight.position.set(100, 100, 150);
        //scene.add(dirLight);
        //
        //var ambLight = new THREE.AmbientLight(0x404040);
        //scene.add(ambLight);

        //Point light for specific position light
        //var bluePoint = new THREE.PointLight(0x0033ff, 3, 150);
        var bluePoint = new THREE.PointLight(0xffffff, 3, 150);
        bluePoint.position.set(70, 5, 0);
        scene.add(bluePoint);

        //var greenPoint = new THREE.PointLight(0x33ff00, 1, 150);
        var greenPoint = new THREE.PointLight(0xffffff, 3, 150);
        greenPoint.position.set(-70, 5, 0);
        scene.add(greenPoint);

        //spotlight for object target
        var spotLight = new THREE.SpotLight(0xffffff, 1, 200, 20, 10);
        spotLight.position.set(0, 150, 0);

        var spotTarget = new THREE.Object3D();
        spotTarget.position.set(0, 0, 0);
        spotLight.target = spotTarget;

        scene.add(spotLight);
        scene.add(new THREE.PointLightHelper(spotLight, 1));

        //Hemisphere light
        var hemLight = new THREE.HemisphereLight(0xffe5bb, 0xFFBF00, .1);
        scene.add(hemLight);

        var newLight = new THREE.PointLight( 0xffffff, 0.4 );
        camera.add( newLight );
        scene.add( camera );

    }

    function addSceneElements() {

        // cube container for all information
        var cube = new THREE.CubeGeometry(200, 1, 200);

        //Add Label to Cube
        //console.log(cube.vertices);

        // Floor
        var floor = new THREE.Mesh(cube, floorMat);
        //scene.add(floor);
        cubeBox.add(floor);


        //Top
        var roof = new THREE.Mesh(cube, mGlass);
        roof.position.set(0, 200, 0);
        //scene.add(roof);
        cubeBox.add(roof);

        // Back wall
        var backWall = new THREE.Mesh(cube, mGlass);
        backWall.rotation.x = Math.PI / 180 * 90;
        backWall.position.set(0, 100, -100);
        //scene.add(backWall);
        cubeBox.add(backWall);

        //Left wall
        var leftWall = new THREE.Mesh(cube, mGlass);
        leftWall.rotation.x = Math.PI / 180 * 90;
        leftWall.rotation.z = Math.PI / 180 * 90;
        leftWall.position.set(-100, 100, 0);
        leftWall.renderDepth = -1.1;
        //scene.add(leftWall);
        cubeBox.add(leftWall);

        // Right wall
        var rightWall = new THREE.Mesh(cube, mGlass);
        rightWall.rotation.x = Math.PI / 180 * 90;
        rightWall.rotation.z = Math.PI / 180 * 90;
        rightWall.position.set(100, 100, 0);
        //scene.add(rightWall);
        cubeBox.add(rightWall);


        // Sphere
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(5, 70, 20), redMat);
        sphere.position.set(-15, 130, -20);
        //scene.add(sphere);
        cubeBox.add(sphere);

        var sphere2 = new THREE.Mesh(new THREE.SphereGeometry(5, 70, 20), redMat);
        sphere2.position.set(15, 100, 20);
        //scene.add(sphere2);
        cubeBox.add(sphere2);
        //Add Label
        //var Label = THREE.
    }

    function animate() {
        render();
        //renderer.render(scene, camera);
        requestAnimationFrame(animate);
        controls.update();

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {

        //rotate cubeBox across x axis
        cubeBox.rotation.y += 0.0015;
        //cubeBox.rotation.z += 0.0175;

        renderer.render(scene, camera);
    }

    return exports;

};
