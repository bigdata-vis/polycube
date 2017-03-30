/**
 * Created by simba on 27/03/2017.
 */
(function () {
    var pCube = {};
    var renderer, scene, camera, controls;
    var cube = new THREE.Object3D();
    var mesh = new THREE.Object3D();
    var lineList = [];

    //WebGl Stuff
    var WGLScene,
        WGLRenderer;


    // params
    var r = Math.PI / 2;
    var d = 250;
    var pos = [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]];
    var rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];

    //data
    var defaultData = [];

    pCube.drawElements = function (datasets) {

        defaultData = datasets;

        // scene
        WGLScene = new THREE.Scene();
        scene = new THREE.Scene();

        // webGLRender();
        spriteRender();

        // CSS renderer
        renderer = new THREE.CSS3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = 0;
        document.body.appendChild(renderer.domElement);

        // camera
        // camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
        // camera.position.set(200, 100, 250);
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(600, 400, 800);

        // controls
        // Orbit Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.autoRotateSpeed = 0.3;
        // controls.noZoom = true;
        controls.noRotate = false;
        controls.addEventListener('change', render);


        //Add objects
        scene.add(cube);
        scene.add(mesh);


        // sides
        for (var i = 0; i < 6; i++) {

            var element = document.createElement('div');
            element.style.width = '500px';
            element.style.height = '500px';
            element.style.background = new THREE.Color("#ececec").getStyle();
            element.style.opacity = '0.1';
            element.style.border = "0.5px dotted #FFF";
            element.className = "side";

            var object = new THREE.CSS3DObject(element);
            object.position.fromArray(pos[i]);
            object.rotation.fromArray(rot[i]);
            object.name = "side";
            cube.add(object);
        }

        // segments
        var segments = datasets.length;
        //D3
        var width = 500,
            height = 500;

        var projection = d3.geoAlbers()
            .center([0, 45.5])
            .rotate([-13.5, -2])
            .parallels([10, 50])
            .scale(1200)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection)
            .pointRadius(2);

        // main Element Div
        var elements = d3.select("body").selectAll('.element')
            .data(datasets)
            .enter()
            .append('div')
            .attr('class', 'elements');

        //Div SVG
        var svg = elements.append("svg")
            .attr("class", "elements_child")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.2)
            .attr("fill", new THREE.Color("#ececec").getStyle());

        d3.json("/data/austria.json", function (error, aut) {
            if (error) {
                console.error(error)
            }

            var counter = 0; //counter to monitor the amount of data rounds
            svg.selectAll(".subunit")
                .data(topojson.feature(aut, aut.objects.subunits).features)
                .enter().append("path")
                .attr("class", function (d, i) {
                    //return "subunit " + d.id;
                    return "subunit "; //remove id
                })
                .classed("hide", function (d, i) {

                    counter += 1;
                    if (counter !== 1) { //only display map path for first map
                        return true
                    }
                })
                .attr("d", path);

            svg.append("circle") //todo: change xyz position of info based on space-time
                .datum(topojson.feature(aut, aut.objects.places).features[0])
                .attr("class", "screen_dots")
                .attr("r", function (d, i) { //generated data to highlight circle radius
                    var x = 5.4;
                    //console.log(i);
                    return x + i
                })
                .attr("cx", function (d) {
                    return d.geometry.coordinates[0] += 10;
                    //return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])
                })
                .attr("cy", function (d) {
                    var cy = d.geometry.coordinates[1] + 10;
                    var cx = d.geometry.coordinates[0] += 10;

                    lineList.push([cx, cy]);
                    //console.log(lineList)
                    return cy;
                })
                .attr("fill", "red")
                .attr("fill-opacity", function (d) { //todo: replace with tootip information about compoenets
                    //return d.uncert
                });

            var place = topojson.feature(aut, aut.objects.places);
            //console.log(place);
        });

        elements.each(objectify);
        //hide all subunits paths

        // drawLabels({ //Todo: fix label with proper svg
        //     labelCount: 10, starting: {
        //         x: 70,//offset border
        //         y: -50,
        //         z: 50
        //     }
        // });

        function objectify(d, i) {
            var interval = 100 / segments; //height/segments

            var objSeg = new THREE.CSS3DObject(this);

            //position
            objSeg.position.x = 0;
            objSeg.position.y = (i * interval) - 50;
            objSeg.position.z = 0;

            //rotation
            objSeg.rotation.fromArray(rot[2]);
            objSeg.name = "seg";

            cube.add(objSeg);
        }

        function drawLabels(parameters) {
            if (parameters === undefined) parameters = {};

            var labelCount = parameters["labelCount"] || 8; //use label count or specified parameters
            var startDate = parameters["startDate"] || "1980-01";
            var endDate = parameters["endDate"] || "2000-01";
            var dateArray = d3.scaleTime()
                .domain([new Date(startDate), new Date(endDate)])
                .ticks(labelCount);

            // var separator = height / dateArray.length;
            var separator = height / segments;

            var p = parameters["starting"] || {
                    x: -80,//offset border
                    y: -10,
                    z: 100
                };

            for (var i = 0; i < segments; i++) {
                // var label = makeTextSprite(dateArray[i], {fontsize: 10});
                var label = makeTextSprite(i + " yr(s)", {fontsize: 8});
                label.position.set(p.x, p.y, p.z);
                // dobj.add(label);//add labels to labels 3d object holder
                p.y += separator;
            }

            function makeTextSprite(message, parameters) {
                if (parameters === undefined) parameters = {};
                var fontsize = parameters["fontsize"] || 70;

                var element = document.createElement('p');
                element.className = "textTitle";
                element.style.color = 'grey';
                element.style.fontSize = fontsize + "px";
                // element.style.fontFaceName = parameters["fontface"] || "Helvetica";
                var elMessage = document.createTextNode(message);
                element.appendChild(elMessage);

                var object = new THREE.CSS3DObject(element);
                // object.position.fromArray(pos[i]);
                // object.rotation.fromArray(rot[i]);
                object.name = "titles";
                mesh.add(object);

                return object;
            }
        }

        //
        window.addEventListener('resize', onWindowResize, false);
        render()
    };

    pCube.transform = function (side) {
        var duration = 2500;
        TWEEN.removeAll();

        // conntrols
        controls.noZoom = false;
        controls.noRotate = true;

        //display all the maps for the segments
        d3.selectAll("svg").select(".subunit")
            .classed("hide", false);

        //hide canvas temporarily //todo: remove webgl shape (Web GL proper Integration)
        d3.select("canvas")
            .classed("hide", true);

        var segCounter = 0; //keep list of the segment counters
        var reduceLeft = function (seg) { // todo: fixleftspace
            if (seg == 5) {
                // console.log((( seg % 5 ) * 150) - 300 -150);
                console.log(( -( Math.floor(seg / 5) % 5 ) * 150  ));
                return (( seg % 5 ) * 150) - 300 - 150
            }
            return (( seg % 5 ) * 150) - 300 - 150
        };

        scene.children[0].children.forEach(function (object, i) {

            //remove box shapes
            if (object.name == "side") {
                object.element.hidden = true;
            }

            //show only segments
            if (object.name == "seg") {
                segCounter++;

                // console.log(object);
                // console.log(segCounter);
                var posTween = new TWEEN.Tween(object.position)
                    .to({
                        x: (( segCounter % 5 ) * 150) - 300,
                        y: ( -( Math.floor(segCounter / 5) % 5 ) * 150  ),
                        z: 0
                    }, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();


                var rotate = new TWEEN.Tween(object.rotation)
                    .to({x: 0, y: 0, z: 0}, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                var tweenOpacity = new TWEEN.Tween((object.element.firstChild.style))
                    .to({
                        opacity: 0.8,
                        backgroundColor: "black"

                    }, duration).easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start()
            }

        });

        //camera movement
        var tween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        })
            .to({
                x: 100,
                y: 50,
                z: 1050
            }, 1600)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function () {
                camera.position.set(this.x, this.y, this.z);
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .onComplete(function () {
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .start();

        //modify controls
        // controls.enableZoom = false;
        // controls.enableRotate = false;
        // controls.enablePan = false;
    };

    pCube.default = function (side) {

        //display canvas
        d3.select("canvas")
            .classed("hide", false);

        var segments = defaultData.length;
        var interval = 100 / segments; //height/segments

        var duration = 2500;
        TWEEN.removeAll();

        //display all the maps for the segments
        d3.selectAll("svg").select(".subunit")
        // .classed("hide", true);
            .classed("hide", function (d, i) {
                // console.log(i);
                if (i !== 0) {
                    return true
                }
            });

        d3.selectAll("svg") //remove opacity for
            .style("opacity", 0.2);

        var segCounter = 0; //keep list of the segment counters

        scene.children[0].children.forEach(function (object, i) {

            //remove box shapes
            if (object.name == "side") {
                object.element.hidden = false;
            }

            //show only segments
            if (object.name == "seg") {
                segCounter++;
                var posTween = new TWEEN.Tween(object.position)
                    .to({
                        x: 0,
                        y: (segCounter * interval) - 60,
                        z: 0
                    }, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                var rotate = new TWEEN.Tween(object.rotation)
                    .to({x: rot[2][0], y: rot[2][1], z: rot[2][2]}, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                var tweenOpacity = new TWEEN.Tween((object.element.firstChild.style))
                    .to({
                        opacity: 0.2,
                        backgroundColor: "#2f2f2f"

                    }, duration).easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start()
            }

        });


        //camera movement

        var tween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        }).to({
            x: 200,
            y: 100,
            z: 250
        }, 1600)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function () {
                camera.position.set(this.x, this.y, this.z);
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .onComplete(function () {
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .start();

        //modify controls
        controls.noZoom = true;
        controls.noRotate = false;
    };

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        // WGLRenderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }

    pCube.animate = function () {
        requestAnimationFrame(pCube.animate);
        TWEEN.update();
        controls.update();
        render();
    };

    pCube.superImpose = function () {

        //hide canvas temporarily //todo: remove webgl shape (Web GL proper Integration)
        d3.select("canvas")
            .classed("hide", true);

        var duration = 1000;
        //merge all x axis to remive dept
        scene.children[0].children.forEach(function (object, i) {

            //remove box shapes
            if (object.name == "side") {
                object.element.hidden = true;
            }

            //show only segments
            if (object.name == "seg") {

                var posTween = new TWEEN.Tween(object.position)
                    .to({
                        y: 0
                    }, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

            }

        });


        //change camera view
        //camera super imposition
        var tween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        })
            .to({
                x: 0, //todo: fix rotation of camera axis
                y: 200,
                z: -6
            }, duration)
            //.easing(TWEEN.Easing.Linear.None)
            .easing(TWEEN.Easing.Sinusoidal.Out)
            .onUpdate(function () {
                camera.position.set(this.x, this.y, this.z);
                camera.lookAt(new THREE.Vector3(0, 0, 0));
                //camera.fov = 8; todo: add a new fov to change perspective
            })
            .onComplete(function () {
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .start();
    };

    function geoVis() {

    }

    function setVis() {
    }

    pCube.morphing = function (parameters) {
        if (parameters === undefined) parameters = {};

        var segCounter = 0; //keep list of the segment counters
        var duration = 5500;
        var yMorph = parameters["axis"] || 50; // todo: create

        scene.children[0].children.forEach(function (object, i) {

            //show only segments
            if (object.name == "seg") {

                segCounter++;
                // console.log(segCounter);
                if (segCounter == 1) {

                    object.element.firstChild.lastChild.style.display = "none"; //remove red circle

                    object.position.y = yMorph; //todo:for the control
                    object.position.x = 0; //todo:for the control
                    object.position.z = 0; //todo:for the control

                    // var posTween = new TWEEN.Tween(object.position) //todo: for the tween
                    //     .to({
                    //         x: 0,
                    //         y: yMorph,
                    //         z: 0
                    //     }, duration)
                    //     .easing(TWEEN.Easing.Sinusoidal.InOut)
                    //     .start();

                    //todo: animate the data spots on the map as it moves along time
                }
            }

        });

    };

    pCube.drawGraphs = function () {

        console.log(lineList);
        lineList.forEach(function (d) {
            var x = d[0];
            var y = d[1];
        });
        function cylinderMesh(pointX, pointY, material) {
            var direction = new THREE.Vector3().subVectors(pointY, pointX);
            var orientation = new THREE.Matrix4();
            orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
            orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
                0, 0, 1, 0,
                0, -1, 0, 0,
                0, 0, 0, 1));
            var edgeGeometry = new THREE.CylinderGeometry(2, 2, direction.length(), 8, 1);
            var edge = new THREE.Mesh(edgeGeometry, material);
            edge.applyMatrix(orientation);
            // position based on midpoints - there may be a better solution than this
            edge.position.x = (pointY.x + pointX.x) / 2;
            edge.position.y = (pointY.y + pointX.y) / 2;
            edge.position.z = (pointY.z + pointX.z) / 2;
            return edge;
        }
    };

    function webGLRender() {
        //WebGL Render
        WGLRenderer = new THREE.WebGLRenderer();
        // WGLRenderer.setClearColor( 0xf0f0f0 );
        WGLRenderer.setPixelRatio(window.devicePixelRatio);
        WGLRenderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(WGLRenderer.domElement);

        var texture = new THREE.TextureLoader().load('/texture/crate.gif');
        // var geometry2 = new THREE.BoxBufferGeometry(10, 10, 10);
        var geometry2 = new THREE.SphereBufferGeometry(10, 10, 10);
        var material2 = new THREE.MeshBasicMaterial({map: texture});

        //
        // var material   = new THREE.MeshBasicMaterial();
        // material.color.set('green');
        // material.opacity   = 0;
        // material.blending  = THREE.NoBlending;

        var box = new THREE.Mesh(geometry2, material2);
        box.position.z = 0;
        box.position.y = 0;
        box.position.x = 0;
        box.name = "box";
        WGLScene.add(box);

        //Drawline function

        console.log(lineList);

        makeLine({start: [0, 0, 0], end: [40, 60, 0]});

        function makeLine(parameters) {
            if (parameters === undefined) parameters = {};
            var start = parameters["start"] || [-10, 0, 0];
            var end = parameters["end"] || [10, 0, 0];

            var material = new THREE.LineBasicMaterial({color: 0x0000ff});
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3().fromArray(start),
                new THREE.Vector3().fromArray(end)
            );
            var line = new THREE.Line(geometry, material);
            WGLScene.add(line);

            return line;
        }
    }

    function spriteRender() {
        var image = document.createElement('img');
        image.style.width = "20px";
        image.style.height = "20px";

        image.addEventListener('load', function (event) {
            for (var i = 0; i < 4; i++) {

                var object = new THREE.CSS3DSprite(image.cloneNode());
                object.position.x = Math.random() * 100 - 100;
                object.position.y = Math.random() * 100 - 100;
                object.position.z = Math.random() * 100 - 100;

                scene.add(object);
                // objects.push(object);
            }
        }, false);
        // image.src = '/texture/sprite.png';
        image.src = '/texture/ball.png';

    }

    function render() {
        // remember to call both renderers!
        // WGLRenderer.render(WGLScene, camera);
        renderer.render(scene, camera);
    }

    window.polyCube = pCube;
}());