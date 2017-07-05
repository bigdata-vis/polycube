/**
 * Created by simba on 27/03/2017.
 */
(function () {
    var pCube = {};

    //data
    var defaultData = [];

    //d3
    var width = 500,
        height = 500,
        widthHalf = width / 2,
        heightHalf = height / 2;
    var svg;

    var formatTime = d3.timeFormat("%Y");

    var start = "1920-01",
        end = "2000-01";

    pCube.drawElements = function (datasets, datasets2) {
        //Data
        //d3 data scale //todo: data scale for x, y, z
        var xExent = d3.extent(datasets, function (d) {//to determine the range of x in the data
                return d;
            }),
            yExent = d3.extent(datasets, function (d) { // to determine the range of y in the data
                // console.log(d["Archive Date"]);
                return d["Archive Date"];
            }),
            zExent = d3.extent(datasets, function (d) {
                return d;
            });


        // console.log(yExent);

        var xScale = d3.scaleLinear()
                .domain(xExent)
                .range([-widthHalf, width]),
            yScale = d3.scaleLinear()
                .domain(yExent)
                .range([0, height]);

        //todo:Data Cleaning function
        var parse2 = d3.timeParse("%Y-%m-%d");
        var format2 = d3.timeFormat("%Y");

        datasets.forEach(function (d, i) {

            var coord = d.Geocoordinates.split(",");

            d.long = +coord[0];
            d.lat = +coord[1];

            // d.long = d
            // defaultData[i] = d;
            // console.log(yScale(d));
            // unfiltered[i] = {
            //     x: +d.x,
            //     y: +d.y,//convert date to y axis
            //     z: +d.z
            // };
        });
        datasets2.forEach(function (d, i) {
            d.start_date = parse2(d.start_date); //parse date first and then format
            d.start_date = +format2(d.start_date)
        });

        // console.log(datasets2);

        //test scaling
        var dateTestEx = d3.extent(datasets2, function (d) {
            return d.start_date;
        });
        var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);



        // scene
        WGLScene = new THREE.Scene();
        scene = new THREE.Scene();

        //Sprite Render;
        pCube.showPointCloud = function () {
            // pCube.spriteRender(xScale, yScale);
        };

        // CSS renderer
        renderer = new THREE.CSS3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = 0;
        document.body.appendChild(renderer.domElement);

        // camera
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(600, 400, 800);

        // controls
        // Orbit Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.autoRotateSpeed = 0.3;
        controls.noRotate = false;
        controls.addEventListener('change', pCube.render);

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

        var segments = datasets.length; //todo: specify config value for the segments numbers
        // var segments = (datasets.length < 20 ? datasets.length : 20);

        //D3
        var projection = d3.geoAlbers()
            .center([0, 45.5])
            .rotate([-13.5, -2])
            // .parallels([10, 50])
            .scale(-500)
            // .scale(5000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection)
            .pointRadius(2);

        // main Element Div (Create new segments holders from here)
        var elements = d3.select("body").selectAll('.element')
            .data(datasets).enter() //todo: limit datasets to sepcific time for y axis
            .append('div')
            .attr('class', 'elements');

        //Div SVG
        svg = elements.append("svg")
            .attr("class", "elements_child")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.2)
            .attr("fill", new THREE.Color("#ececec").getStyle());

        d3.json("data/austria.json", function (error, aut) {
            if (error) {
                console.error(error)
            }

            var counter = 0; //counter to monitor the amount of data rounds
            console.log(aut);

            //map paths
            svg.selectAll(".subunit")
                .data(topojson.feature(aut, aut.objects.subunits).features)
                // .data(aut.features)
                .enter().append("path")
                .attr("class", function (d, i) {
                    return "subunit"; //remove id
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
                    var x = 20.4,
                        x2 = x * (datasets.length / 2) + x;

                    if (i < (datasets.length / 2)) {
                        return x + (i * x )
                    } else {
                        return x2 - (i * (x / 2));
                    }
                })
                .attr("cx", function (d) {
                    // return d.geometry.coordinates[0] += 40;
                    return d.geometry.coordinates[0] + 250;
                })
                .attr("cy", function (d) {
                    var cy = d.geometry.coordinates[1] + 220;
                    // var cx = d.geometry.coordinates[0] += 10;
                    // lineList.push([cx, cy]);
                    //console.log(lineList)
                    return cy;
                })
                .attr("fill", "orange")
                .attr("fill-opacity", function (d) { //todo: replace with tootip information about compoenets
                    //return d.uncert
                });
        });

        //Objectify and draw segments
        // elements.each(setViewData);
        elements.each(addtoScene);

        //Test Elements
        // var testData = [{elem: "A", title: "a"}, {elem: "B", title: "b"},{elem: "C", title: "c"},{elem: "D", title: "d"},{elem: "E", title: "e"}];
        var testElem = d3.selectAll('.map-div')
            // .data(datasets).enter()
            .data(datasets2).enter()
            .append("div")
                .attr("class", "map-div")
                .each(function (d, i) {
                    // projection(code);

                    // d3.select(this).append("div")
                    // .attr("class", "map-title")
                    // .html(function (d) {
                    //     var text = " - 2010";
                    //     return d.elem + text;
                    // });
                    var image = document.createElement('img');
                    var interval = 500 / segments; //height/segments

                    image.style.width = 10 + "px";
                    image.style.height = 10 + "px";
                    image.className = "pointCloud";

                    // console.log(this.style);

                    image.addEventListener('load', function (event) {
                        for (var z = 0; z < 1; z++) {
                            var object = new THREE.CSS3DSprite(image.cloneNode());
                            var min = -200,
                                max = 200;

                            // object.position.y = Math.random() * (max - min) + min;
                            // object.position.y = ((i * interval) - height / 2);
                            // object.position.z = Math.random() * ((50) - (-60)) + (-60);
                            // object.position.x = Math.random() * ((30) - (-50)) + (-50); // using xScale to determine the positions
                            object.position.y = timeLinear(d.start_date); //todo: height + scale + time to determine y axis

                            // console.log(d);
                            // console.log(projection([d.lng,d.lat]));

                            // object.position.z = projection([13.649262, 47.562233])[0] - (widthHalf);
                            // object.position.x = projection([13.649262, 47.562233])[1] - (heightHalf);

                            object.position.z = projection([d.latitude, d.longitude])[0] ;
                            object.position.x = projection([d.latitude, d.longitude])[1] ;

                            object.name = "pointCloud"; //todo: remove later

                            object.element.onmouseover = function () {
                                console.log(d);
                                d3.select("#textTitle")
                                    // .html("Simba")
                                    .html("<span>First Name:</span>" + d.first_name + "<br>" +
                                        "<span>Date:</span>" + d.start_date + "<br>" +
                                        "<span>Place Name:</span>" + d.place_name + "<br>"
                                    )
                            };

                            // console.log(object)

                            scene.add(object);
                        }
                    }, false);
                    image.src = 'texture/ball.png';

                });

        testElem.each(setViewData);
        testElem.each(addtoScene2);

        // console.log(testData);
        function setViewData(d, i) {
            var vector, phi, theta;
            var stc, jp, si;

            stc = new THREE.Object3D();
            stc.position.x = Math.random() * 4000 - 2000;
            stc.position.y = Math.random() * 4000 - 2000;
            stc.position.z = Math.random() * 4000 - 2000;
            d['STC'] = stc;

            jp = new THREE.Object3D();
            jp.position.x = (( i % 5 ) * (width + 50)) - (width * 2);
            jp.position.y = ( -( Math.floor(i / 5) % 5 ) * (width + 50) ) + 400;
            jp.position.z = 0;
            jp.time = ["1920", "1930"];
            d['JP'] = jp;

            si = new THREE.Object3D();
            si.position.x = (( i % 5 ) * 1050) - 2000;
            si.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
            si.position.z = 0;
            d['SI'] = si;
        }
        function addtoScene(d, i) {
            var interval = 500 / segments; //height/segments
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

        function addtoScene2(d, i) {
            var interval = 500 / segments; //height/segments
            var objSeg = new THREE.CSS3DObject(this);
            //position
            objSeg.position.x = 0;
            objSeg.position.y = (i * interval) - height / 2;
            objSeg.position.z = 0;
            //rotation
            objSeg.rotation.fromArray(rot[2]);
            objSeg.name = "seg2";

            cube.add(objSeg);
            //add new object test
        }

        //todo: Redo timeLine
        drawLabels({ //Todo: fix label with proper svg
            labelPosition: {
                x: widthHalf,//offset border
                y: -(height / 2),
                z: widthHalf
            }
        });

        function drawLabels(parameters) {
            if (parameters === undefined) parameters = {};
            var labelCount = parameters["labelCount"] || segments; //use label count or specified parameters
            var startDate = parameters["startDate"] || "1800-01";
            var endDate = parameters["endDate"] || "1870-01";
            var dateArray = d3.scaleTime()
                .domain([new Date(startDate), new Date(endDate)])
                .ticks(labelCount);
            // var separator = height / dateArray.length;
            var separator = height / segments;
            var p = parameters["labelPosition"] || {
                    x: -80,//offset border
                    y: -10,
                    z: 100
                };

            // console.log(separator);

            for (var i = 0; i < (segments); i++) {
                var label = makeTextSprite(formatTime(dateArray[i]), {fontsize: 10});
                // var label = makeTextSprite(i + " yr(s)", {fontsize: 8});
                label.position.set(p.x, p.y, p.z);
                label.rotation.y = 20;

                p.y += separator; //increment y position of individual label to increase over time
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

        pCube.render()
    };

    pCube.default = function (side) {

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

    pCube.juxstaPose = function (side) {
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

                console.log(object)
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

    pCube.superImpose = function () {

        //controls
        // controls.noZoom = false;
        controls.noRotate = true;

        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

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
                        opacity: 0.1
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

    pCube.timeStart = function (_x) {
        if (!arguments.length)  return start;
        start = _x;
        console.log(_x);
        return this;
    };

    pCube.timeStop = function (_x) {
        if (!arguments.length) return end;
        end = _x;
        return this;
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
        // WGLRenderer.render(WGLScene, camera);
        renderer.render(scene, camera);
    };

    //3D Scene Render
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

    //camera test
    pCube.test = function () {
        console.log(camera)

    };

    window.polyCube = pCube;
}());