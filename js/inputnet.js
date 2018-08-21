/**
 * Created by simba on 27/03/2017.
 */
(function () {
    var pCube = {};

    /**default data
     *
     * @type {Array}
     */
    var defaultData = [];

    /**
     * Container to hold line geometry coordinates
     * @type {Array}
     */
    var lineList = [];

    let tempArr = [];

    /**d3 variables and declarations
     *
     * @type {number}
     */
    var width = 500,
        height = 500,
        widthHalf = width / 2,
        heightHalf = height / 2,
        dataSlices = 6;
    var svg;

    var formatTime = d3.timeFormat("%Y");

    var start = "1920-01",
        end = "2000-01";

    var projectionScale = 5000;

    /**
     * Point of entry function to draw scene elements and inject data from map (), point cloud () and segements ()
     * @param datasets
     * @param datasets2
     */

    /**
     * Render point cloud from the automated data and points;
     * TrackballControls makes object disspear when zooming out ?
     */
    pCube.showPointCloud = function (value) {


        pointCloud.traverse( function ( object ) { object.visible = value; } );


        // console.log(pointCloud);
        // pointCloud.visible = false;
        // mesh.visible = false;
        // nodeCloud.visible = false;
    };

    pCube.showLinks = function (value) {
        linksCloud.traverse( function ( object ) { object.visible = value; } );
    };

    pCube.drawElements = function (datasets2) {

        /**
         * Parse and Format Time
         */
        var parse2 = d3.timeParse("%Y-%m-%d");
        var format2 = d3.timeFormat("%Y");

        /**
         * Clean func for Data sets 2
         *Data sets to draw point clouds
         */
        datasets2.forEach(function (d, i) {
            d.time = parse2(d.time); //parse date first and then format
            d.time = +format2(d.time);
            defaultData[i] = d;
        });

        /**
         * Time linear function to calculate the y axis on the cube by passing the value of year from the datasets
         *
         */
        var dateTestEx = d3.extent(datasets2, function (d) {
            return d.time;
        });
        var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);


        /**
         * scenes
         * Introduction CSS3D and WebGL scenes
         */
        WGLScene = new THREE.Scene();
        scene = new THREE.Scene();



        /**WebGL renderer implementation
         *
         * @type {THREE.WebGLRenderer}
         * https://stackoverflow.com/questions/24681170/three-js-properly-blending-css3d-and-webgl/24688807#24688807
         * http://learningthreejs.com/blog/2013/04/30/closing-the-gap-between-html-and-webgl/
         * setting both wgl dom and css dom styles to thesame absolute position to align xyz positions
         */
        WGLRenderer = new THREE.WebGLRenderer({alpha: true});
        WGLRenderer.setSize(window.innerWidth, window.innerHeight);
        WGLRenderer.setClearColor(0x00ff00, 0.0);
        WGLRenderer.domElement.style.position = 'absolute';
        // WGLRenderer.domElement.style.zIndex = 1;
        WGLRenderer.domElement.style.top = 0;
        document.body.appendChild(WGLRenderer.domElement);

        /**CSS renderer
         *
         * @type {THREE.CSS3DRenderer}
         */
        renderer = new THREE.CSS3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        // renderer.domElement.style.zIndex = 5;
        renderer.domElement.style.top = 0;
        document.body.appendChild(renderer.domElement);

        /**
         * Callibrating css cubebox and glcube box positions
         * https://stackoverflow.com/questions/24681170/three-js-properly-blending-css3d-and-webgl/24688807#24688807
         * Copy position of the cube box and attach it to glbox to callibrate both objects
         */
        glbox.position.copy(cube.position);
        glbox.rotation.copy(cube.rotation);

        /**camera
         * Threejs camera implementation
         * @type {any}
         * Prob: Object disappear from screen when zooming out
         * Ans: camera's far plane is at 3000 which means everything that is 3000 units away will be clipped and not drawn
         * https://stackoverflow.com/questions/29185783/three-js-things-disappear-when-zooming-out
         */

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(600, 400, 800);

        /** Mouse Controls for zooming, panning etc
         *
         * @type {THREE.OrbitControls}
         *
         */
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.autoRotateSpeed = 0.3;
        controls.noRotate = false;
        controls.addEventListener('change', pCube.render);

        /**
         * Add Object Group to Scene (Cube and Mesh?)
         *Mesh is for the timeline title
         */
        scene.add(cube);
        scene.add(mesh);
        scene.add(pointCloud);

        WGLScene.add(linksCloud);
        WGLScene.add(glbox);

        /**CSS3D Scene
         * Cube Sides
         *6 sided cube creation with CSS3D, div and then added to cube group object
         */
        for (var i = 0; i < 6; i++) {
            var element = document.createElement('div');

            /**
             * Cube Width and height
             * @type {string}
             */
            element.style.width = width + 'px';
            element.style.height = height + 'px';

            /**
             *
             * @type {string}
             */
            element.style.opacity = '0.1';
            element.style.border = "0.5px dotted #FFF";
            element.className = "side";

            /**
             * Create new CSS3D object side and add it to the cube group
             * get position from array of predefined cube rotation and position css3d matrix
             * @type {THREE.CSS3DObject}
             */
            var object = new THREE.CSS3DObject(element);
            object.position.fromArray(pos[i]);
            object.rotation.fromArray(rot[i]);
            object.name = "side";
            cube.add(object);
        }

        /**
         * Segments
         * var segments = datasets.length; //todo: specify config value for the segments numbers
         * dynamic segementation :: var segments = (datasets2.length < 20 ? datasets.length : 10)
         * segements from the length of defaultData or datasets1
         */
        var segments = defaultData.length;


        /**D3
         *Map Projection
         *Mercator or geoAlbers
         *Dynamic Scale with editing and update function
         */
        var projection = d3.geoAlbers()
        // var projection = d3.geoMercator()
            .translate([width / 2, height / 2])
            .center([0, 45.5])
            // .rotate([-13.5, -2])
            .rotate([-13.5, -2])
            .scale(width * 9);

        var path = d3.geoPath()
            .projection(projection)
            .pointRadius(2);

        /**
         *Create Div holders for the segments
         * main Element Div (Create new segments holders from here)
         *Currently using todo: datasets1 should be changed to datasets2
         */
        var elements = d3.select("body").selectAll('.element')
            .data(datasets2.chunk(dataSlices)[0]).enter() //todo: limit datasets to sepcific time for y axis
            .append('div')
            .attr('class', 'elements')
            .attr('id', 'mapbox');

        // console.log(datasets2.chunk(6)[0]);

        /**
         * Div SVG
         */
        svg = elements.append("svg")
            .attr("class", "elements_child")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.2)
            .attr("fill", new THREE.Color("#ececec").getStyle());

        /**
         * Objectify and draw segments elements
         */
        // elements.each(setViewData);
        elements.each(addtoScene);

        /**
         * Test biographical data
         */

        var newList = [];

        var testElem = d3.selectAll('.map-div')
            .data(datasets2).enter()
            .append("div")
            .attr("class", "map-div")
            .each(function (d, i) {
                var image = document.createElement('img');
                var interval = 500 / segments; //height/segments

                image.style.width = 10 + "px";
                image.style.height = 10 + "px";
                image.className = "pointCloud";

                image.addEventListener('load', function (event) {
                    // for (var z = 0; z < 1; z++) {
                    var object = new THREE.CSS3DSprite(image.cloneNode()),
                        long = d.y,
                        lat = d.x,
                        coord = translate(projection([long, lat]));

                    object.position.y = timeLinear(d.time); //todo: height + scale + time to determine y axis

                    // object.position.z = coord[0];
                    // object.position.x = coord[1];

                    object.position.z = d.x;
                    object.position.x = d.y;
                    object.name = "pointCloud"; //todo: remove later
                    object.element.onmouseover = function () {
                        console.log(d);
                        d3.select("#textTitle")
                        // .html("Simba")
                            .html("<span>First Name:</span>" + d.first_name + "<br>" +
                                "<span>Date:</span>" + d.time + "<br>" +
                                "<span>Place Name:</span>" + d.place_name + "<br>"
                            )
                    };
                    object.userData = d;


                    //add label

                    let nodelabel = makeTextSprite(d.label, {fontsize: 10});
                    nodelabel.position.set(object.position.x, object.position.y - 12, object.position.z);

                    /**
                     * populate line list
                     * split the target links
                     */
                    lineList.push(object);

                    pointCloud.add(object);
                    // }
                }, false);
                image.src = 'texture/ball.png';

            });

        function addtoScene(d, i) {

            var interval = height / dataSlices; //height/segments
            var objSeg = new THREE.CSS3DObject(this);
            //position
            objSeg.position.x = 0;
            objSeg.position.y = (i * interval) - height / 2;
            objSeg.position.z = 0;
            //rotation
            objSeg.rotation.fromArray(rot[2]);
            objSeg.name = "seg";

            cube.add(objSeg);
            //add new object test
        }

        /**
         * Draw Timeline and Labels
         * todo: Redo timeLine
         *
         */
        drawLabels({ //Todo: fix label with proper svg
            labelPosition: {
                x: widthHalf,//offset border
                y: -(height / 2) + (-10),
                z: widthHalf
            }
        });

        function drawLabels(parameters) {

            if (parameters === undefined) parameters = {};
            var labelCount = parameters["labelCount"] || segments; //use label count or specified parameters

            var startDate = parameters["startDate"] || dateTestEx[1].toString();
            var endDate = parameters["endDate"] || dateTestEx[0].toString();

            var dateArray = d3.scaleTime()
                .domain([new Date(endDate), new Date(startDate)])
                .ticks(dataSlices);


            var separator = height / dataSlices;
            var p = parameters["labelPosition"] || {
                x: -80,//offset border
                y: 0,
                z: 100
            };

            dateArray.forEach(function (d) {
                let label = makeTextSprite(formatTime(d), {fontsize: 10});
                label.position.set(p.x, p.y + separator , p.z);
                label.rotation.y = 20;
                p.y += separator; //increment y position of individual label to increase over time
            });
        }

        /**
         * BioVis Styling
         */
        d3.selectAll(".elements_child")
            .style("background-color", "transparent");

        d3.selectAll(".elements")
            .style("border", "1px solid #585858");

        pCube.render();
    };

    /**
     * Default STC Layout Fallback function
     *
     */
    pCube.default = function () {

        // console.log(defaultData.length);

        var segments = defaultData.length;

        var interval = height / segments; //height/segments

        var duration = 2500;
        TWEEN.removeAll();

        //show all time panels
        d3.selectAll(".textTitle")
            .classed("hide", false);

        //show all point clouds
        d3.selectAll(".pointCloud")
            .classed("hide", false);

        //display all the maps for the segments
        d3.selectAll("svg").select(".subunit")
        // .classed("hide", true);
            .classed("hide", function (d, i) {
                // console.log(i);
                if (i !== 0) {
                    return true
                }
            });


        d3.selectAll(".elements_child") //remove opacity for all elements_child
            .style("opacity", 0.2);

        var segCounter = 0; //keep list of the segment counters


        scene.children[0].children.forEach(function (object, i) {

            //show box shapes
            if (object.name == "side") {
                object.element.hidden = false;
            }


            //show segments
            if (object.name == "seg") {

                segCounter++;

                console.log(interval);

                var posTween = new TWEEN.Tween(object.position)
                    .to({
                        x: 0,
                        y: (segCounter * interval) - (height / 2 + interval),
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
            x: 600,
            y: 400,
            z: 800
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
        controls.noZoom = false;
        controls.noRotate = false;
    };

    /**
     * Juxtaposition function
     *
     */
    pCube.juxstaPose = function () {
        var duration = 2500;
        TWEEN.removeAll();

        // conntrols
        controls.noZoom = false;
        controls.noRotate = true;

        //display all the maps for the segments
        d3.selectAll("svg").select(".subunit")
            .classed("hide", false);

        //hide canvas temporarily //todo: remove all pointClouds
        d3.selectAll(".pointCloud")
            .classed("hide", true);

        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

        var segCounter = 0; //keep list of the segment counters

        scene.children[0].children.forEach(function (object, i) { //todo: fixleftspace

            var reduceLeft = {
                x: (( segCounter % 5 ) * (width + 50)) - (width * 2),
                y: ( -( Math.floor(segCounter / 5) % 5 ) * (width + 50) ) + 400, //just another way of getting 550
                z: 0
            };
            //remove box shapes
            if (object.name == "side") {
                object.element.hidden = true;
            }

            //tween the segments to grid shape
            if (object.name == "seg") {
                segCounter++;

                // console.log(object);
                // if(object.element.__data__.elem){
                //     // console.log(object.element.__data__["JP"]);
                //     console.log(object.element.__data__["JP"]);
                // }

                var posTween = new TWEEN.Tween(object.position)
                    .to(reduceLeft, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                var rotate = new TWEEN.Tween(object.rotation)
                    .to({x: 0, y: 0, z: 0}, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                //
                var tweenOpacity = new TWEEN.Tween((object.element.firstChild.style))
                    .to({
                        opacity: 0.8,
                        backgroundColor: "black"

                    }, duration).easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();

                // console.log(object)
            }
        });

        //camera movement
        var tween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        })
            .to({
                x: 0,
                y: 0,
                z: 2050
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
    };

    pCube.onWindowResize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        pCube.render()
    };

    pCube.animate = function () {
        requestAnimationFrame(pCube.animate);
        TWEEN.update();
        controls.update();
        pCube.render()
    };

    /**
     * Super imposition function
     * todo: fix rotation of the cube with map
     */
    pCube.superImpose = function () {

        //controls
        // controls.noZoom = false;
        controls.noRotate = true;

        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

        // console.log(d3.selectAll(".elements_child")._groups[0][0].style.opacity);

        d3.selectAll(".elements_child")
            .style("background-color", "transparent");
        // .style("stroke", "white")
        // .style("stroke-width", "5px")
        // .style("stroke-dasharray", "2,2")
        // .style("stroke-linejoin", "round");

        d3.selectAll(".elements")
            .style("border", "1px solid #585858");

        var duration = 700;
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

                var tweenOpacity = new TWEEN.Tween((object.element.firstChild.style))
                    .to({
                        opacity: 0.9
                    }, duration).easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start()
            }

        });

        //change camera view
        //camera position
        var tween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        }).to({
            x: 0, //todo: fix rotation of camera axis
            y: 1077.0329614263626,
            z: 0
        }, duration)
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

        //camera rotation
        var rotate = new TWEEN.Tween({
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z
        }).to({
            x: -1.5707953161924646,
            y: -5.53118884027981,
            z: -0.005531219681680428
        }, duration)
            .easing(TWEEN.Easing.Elastic.InOut)
            .onUpdate(function () {
                camera.rotation.set(this.x, this.y, this.z);
                // camera.lookAt(new THREE.Vector3(0, 0, 0));
                //camera.fov = 8; todo: add a new fov to change perspective
            })
            .onComplete(function () {
                // camera.lookAt(new THREE.Vector3(0, 0, 0));
            })
            .start();
    };

    /**
     * Morphing controls accross data layers
     * @param parameters
     */
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

    /**
     * Map zooming function to clean
     * @param _x
     * @returns {*}
     */
    pCube.mapZoom = function (_x) {
        if (!arguments.length) return projectionScale;
        projectionScale = _x;
        // console.log(projectionScale);
        // pCube.render();
        return this;
    };

    /**
     * Line function implementation
     * create line using only CSS3D
     */

    pCube.drawLines = function () {
        // console.log(lineList);

        tempArr = [];

        lineList.forEach(function (data) {
            if(data.userData.target){
                let targets = data.userData.target.split(',');
                let source = data.userData.id;
                // console.log(targets)
                targets.forEach(function (d) {
                    tempArr.push({source:{position: data.position, id:source}, target:{position: getTargetPos(d,lineList), id: d}})
                });
            }
           function getTargetPos(target,list){
               let position;
               list.forEach(function (d) {
                   if(d.userData.id === target.toString()){
                       position = d.position;
                   }
               });
               return position;
           }
        });

        tempArr.forEach(function (d) {
            // console.log(d);
            addLineToScene(d)

        });
        function addLineToScene(data) {

            /** Threejs Material decl to be used later for lines implementation
             *
             * @type {any}
             */
            var material = new THREE.LineBasicMaterial({
                color: "#d0d0d0",
                linewidth: 2,
                linecap: 'round', //ignored by WebGLRenderer
                linejoin: 'round' //ignored by WebGLRenderer
            });
            material.blending = THREE.NoBlending;

            /**
             * WebGl Scene
             * Temporary Web Gl Scene implementation for line testing
             * @type {any}
             */
            var geometry = new THREE.Geometry();

            // console.log(data);

            if(data.source.position && data.target.position){
                //source
                geometry.vertices.push(new THREE.Vector3(data.source.position.x, data.source.position.y, data.source.position.z));

                //target
                geometry.vertices.push(new THREE.Vector3(data.target.position.x, data.target.position.y, data.target.position.z));
            }

            var line = new THREE.Line(geometry, material);
            // glbox.add(line);
            linksCloud.add(line);
        }

    };

    /**
     * CSS3D sprite for point cloud implementation
     * @param xScale
     * @param yScale
     * @param params
     */
    pCube.spriteRender = function (xScale, yScale, params) {
        if (params === undefined) params = {};
        var size = params["size"] || 10;
        var image = document.createElement('img');

        //count of point clouds
        var countPC = params["countPC"] || 100;

        image.style.width = size + "px";
        image.style.height = size + "px";
        image.className = "pointCloud";

        image.addEventListener('load', function (event) {
            for (var i = 0; i < countPC; i++) {
                var object = new THREE.CSS3DSprite(image.cloneNode());
                var min = -200,
                    max = 200;

                // object.position.x = xScale(Math.random() * 250); // using xScale to determine the positions
                // object.position.y = yScale(Math.random() * 200 - 100);
                // object.position.z = Math.random() * 200 - 200;

                object.position.y = Math.random() * (max - min) + min;
                object.position.z = Math.random() * ((50) - (-60)) + (-60);
                object.position.x = Math.random() * ((30) - (-50)) + (-50); // using xScale to determine the positions

                object.name = "pointCloud"; //todo: remove later

                object.element.onmouseover = function (d) {
                    this.y = 0;
                };

                scene.add(object);
            }
        }, false);
        image.src = 'texture/ball.png';

    };

    pCube.render = function () {
        // remember to call both renderers!
        WGLRenderer.render(WGLScene, camera);
        renderer.render(scene, camera);
    };

    /**
     * Translate function for the long and lat coordinates
     * @param point
     * @returns {*[]}
     * http://blog.mastermaps.com/2013/11/showing-gps-tracks-in-3d-with-threejs.html
     */
    function translate(point) {
        return [point[0] - (width / 2), (height / 2) - point[1]];
    }

    function makeTextSprite(message, parameters) {
        if (parameters === undefined) parameters = {};
        var fontsize = parameters["fontsize"] || 40;

        var element = document.createElement('p');
        element.className = "textTitle";
        element.style.color = 'grey';
        element.style.fontSize = fontsize + "px";
        var elMessage = document.createTextNode(message);
        element.appendChild(elMessage);

        var object = new THREE.CSS3DSprite(element);
        object.name = "titles";
        mesh.add(object);
        return object;
    }

    /**
     * 3D Scene Renderer
     *
     */
    var renderer, scene, camera, controls;
    var cube = new THREE.Object3D();
    var mesh = new THREE.Object3D();
    var glbox = new THREE.Object3D();

    let pointCloud = new THREE.Object3D();
    pointCloud.name = "pointCloud";

    let nodeCloud = new THREE.Object3D();
    nodeCloud.name = "nodeCloud";

    let linksCloud = new THREE.Object3D();
    linksCloud.name = "linksCloud";

    /**
     * WebGl Scene and renderer
     * Example od a perfect webglcube https://threejs.org/examples/webgl_lines_dashed.html
     */
    var WGLScene,
        WGLRenderer;

    /**
     * Array cube rotation and position css3d matrix
     * @type {*[]}
     */
    var r = Math.PI / 2;
    var d = 250;
    var pos = [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]];
    var rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];

    window.polyCube = pCube;
}());