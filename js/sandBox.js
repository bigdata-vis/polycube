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

    /**d3 variables and declarations
     *
     * @type {number}
     */
    var width = 500,
        height = 500,
        widthHalf = width / 2,
        heightHalf = height / 2;
    var svg;

    var formatTime = d3.timeFormat("%Y");

    var projectionScale = 5000;

    /**
     * Point of entry function to draw scene elements and inject data from map (), point cloud () and segements ()
     * @param datasets
     * @param datasets2
     */

    var dataSlices = 4;
    var interval = 500 / dataSlices; //height/segments

    var timeLinearG;

    var segmentedData;


    pCube.drawElements = function (datasets) {

        /**
         * Parse and Format Time
         */
        var parse2 = d3.timeParse("%Y-%m-%d");
        var parse3 = d3.timeParse("%b. %d, %Y"); //data format for cushman data
        var parse4 = d3.timeParse("%Y-%m-%dT00:00:00Z");

        var format2 = d3.timeFormat("%Y");


        /**
         * Cleaning Function for Datasets
         */

        /**
         * Clean func for Datasets1
         *Datasets to draw the segments
         */

        datasets.forEach(function (d, i) {
            var coord = d.Geocoordinates.split(",");
            d.long = +coord[0];
            d.lat = +coord[1];
            // d.long = d
            /**
             * Data to draw segements from
             * @type {T}
             */
            defaultData[i] = d;

            // console.log(+format2(parse4(d.Date)));

            d.time = parse4(d.Date);
            d.time = +format2(d.time);


            //data segmentation
            /**
             * Group dataSets by intervals and sum of the intervals date range,
             * add a field to each data object representing the value of the range in y axis e.g jp:1, jp:2, jp:3
             * use d3.nest() to group all elements in dataSet by jp suing example from the link below
             * https://proquestionasker.github.io/blog/d3Nest/
             * pass grouped data to elements d3 function and draw them on maps individually
             */

            var jp1 = 1942, jp2 = 1946, jp3 = 1950, jp4 = 1977;

            if (d.time < jp1) {
                d.ts = "jp1";
            }

            if (d.time > jp1 && d.time <= jp2) {
                d.ts = "jp2";
            }

            if (d.time > jp2 && d.time <= jp3) {
                d.ts = "jp3";
            }

            if (d.time > jp3 && d.time <= jp4) {
                d.ts = "jp4";
            }

        });

        /**
         * Clean func for Data sets 2
         *Data sets to draw point clouds
         */

        /**
         * Time linear function to calculate the y axis on the cube by passing the value of year from the datasets
         *
         */
        var dateTestEx = d3.extent(datasets, function (d) {
            return d.time;
        });


        var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);

        timeLinearG = timeLinear;

        /**d3 data scale
         * to be implemented with datasets with time and location
         * todo: data scale for x, y, z
         */
        var xExent = d3.extent(datasets, function (d) {//to determine the range of x in the data
                return d.Archive_Date;
            }),
            yExent = d3.extent(datasets, function (d) { // to determine the range of y in the data
                // console.log(d["Archive Date"]);
                return d.Archive_Date;
            }),
            zExent = d3.extent(datasets, function (d) {
                return d;
            });


        /**
         * calculate the largest and smallest value for Xscale and Y scale
         */
        var xScale = d3.scaleLinear()
                .domain(xExent)
                .range([-widthHalf, width]),
            yScale = d3.scaleLinear()
                .domain(yExent)
                .range([0, height]);

        /**
         * scenes
         * Introduction CSS3D and WebGL scenes
         */
        WGLScene = new THREE.Scene();
        scene = new THREE.Scene();

        /**
         * Render point cloud from the automated data and points;
         * TrackballControls makes object disspear when zooming out ?
         */
        pCube.showPointCloud = function () {
            // pCube.spriteRender(xScale, yScale);
        };

        pCube.showNodes = function () {
            pCube.drawLines()
        };


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


        /**
         * Time axis inverted
         * @type {number}
         */

        // pointCloud.rotation.z = 3.15;
        // cube.rotation.z = 3.15;
        // glbox.rotation.z = 3.15;
        // cube.position.y = cube.position.y - interval;
        // pointCloud.position.z = -90;
        // pointCloud.position.y += 5;
        // pointCloud.position.x += 4;

        // console.log(pointCloud);
        glbox.position.copy(pointCloud.position);


        /**camera
         * Threejs camera implementation
         * @type {any}
         * Prob: Object disappear from screen when zooming out
         * Ans: camera's far plane is at 3000 which means everything that is 3000 units away will be clipped and not drawn
         * https://stackoverflow.com/questions/29185783/three-js-things-disappear-when-zooming-out
         * try a combined camera
         */

        // camera = new THREE.CombinedCamera( window.innerWidth, window.innerHeight, 55, 1, 1000, - 200, 100 );
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
        WGLScene.add(glbox);


        /**
         * WEBGL PLAYGROUND
         * Callibrating css cubebox and glcube box positions
         *
         */


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
         * D3.nest to segment each data by ts property
         * sort data by jp1
         */

        var dataBySeg = d3.nest()
            .key(function (d) {
                return d.ts;
            })
            .entries(datasets).sort(function (a, b) {
                return a.key > b.key;
            });

        /**
         * push segmented data to global variable
         * @type {any}
         */
        segmentedData = dataBySeg;

        /**
         *Create Div holders for the segments
         * main Element Div (Create new segments holders from here)
         *Currently using todo: datasets1 should be changed to datasets2
         */
        var elements = d3.select("body").selectAll('.element')
        //todo: add function to .data to slice dataSets into dataSlides amount of individual segments
        //     .data(datasets.slice(0, dataSlices)).enter() //todo: limit datasets to sepcific time for y axis
            .data(dataBySeg)
            .enter()
            .append('div')
            .attr('class', 'elements')
            .style("width", width + "px")
            .style("height", height + "px")
            .attr('id', 'mapbox');


        //Div SVG
        svg = elements.append("svg")
            .attr("class", "circle_elements")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            // .attr("x", function (d) {
            //     return 250
            // })
            // .attr("y", function (d) {
            //     return 250;
            // });

        svg.append("circle")
            .attr("r", function (d, i) { //generated data to highlight circle radius
                var x = d.values.length / 2;
                return x;
            })
            .attr("cx", function (d) {
                // return d.geometry.coordinates[0] += 40;
                return 250
            })
            .attr("cy", function (d) {
                // var cy = d.geometry.coordinates[1] + 220;
                return 250;
            })
            .attr("fill", "#690")
            .attr("opacity", 1);

        svg.append("circle")
            .attr("fill", "#072e99")
            .attr("opacity", 1)
            .attr("r", function (d, i) { //generated data to highlight circle radius
                var x = d.values.length / 3;
                return x;
            })
            .attr("cx", function (d) {
                // return d.geometry.coordinates[0] += 40;
                return 250
            })
            .attr("cy", function (d) {
                // var cy = d.geometry.coordinates[1] + 220;
                return 250;
            });

        /**
         * Objectify and draw segments elements
         */
        elements.each(addtoScene);

        /**
         * Test biographical data
         */

        var newList = [];


        var PCElem = d3.selectAll('.pointCloud')
            .data(dataBySeg).enter()
            .each(function (data, i) {
                data.values.forEach(function (d) {

                    var image = document.createElement('img');
                    var interval = height / dataSlices; //height/segments
                    var min = -50,
                        max = data.values.length / 2;

                    image.style.width = 10 + "px";
                    image.style.height = 10 + "px";
                    image.className = "pointCloud";

                    // console.log(d.time);

                    image.addEventListener('load', function (event) {
                        var object = new THREE.CSS3DSprite(image.cloneNode());

                        // object.position.y = timeLinear(d.time); //for unix date
                        object.position.y = (interval * i) - interval - interval; //todo: height + scale + time to determine y axis
                        object.position.z = Math.random() * (data.values.length / 3 - (-90)) + (-90);
                        object.position.x = Math.random() * (data.values.length / 3 - (min)) + (min);

                        /**
                         * add each proerties of the pointcloud to new data
                         */
                        object["newData"] = d;


                        object.name = "pointCloud"; //todo: remove later
                        object.element.onmouseover = function () {
                            d3.select("#textTitle")
                                .html("<strong<p>" + d.Description_from_Notebook + "</p>" +
                                    "<span class='date'>Date : " + d.time + " </span> <br>" +
                                    "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                                );

                            d3.select("#dataImage")
                                .attr("src", d.Image_URL)
                        };


                        /**
                         * populate line list to be used for drawing line and hull convex
                         */

                        lineList.push(object.position);

                        /**
                         * Add point clouds to pointCloud object created not scene so we can modify and display its rotation and position
                         */
                        // pointCloud.add(object);
                        // }
                    }, false);
                    image.src = 'texture/ball.png';
                })
            });

        /**
         * Draw Timeline and Labels
         * todo: Redo timeLine
         *
         */

        drawLabels({ //Todo: fix label with proper svg
            labelPosition: {
                x: widthHalf,//offset border
                y: -(height / 2),
                z: widthHalf
            }
        });

        function drawLabels(parameters) {

            // console.log(dateTestEx[0]);
            // console.log(new Date(dateTestEx[1]));

            // console.log(d3.scaleTime().domain([new Date(dateTestEx[0])]))


            if (parameters === undefined) parameters = {};
            var labelCount = parameters["labelCount"] || dataSlices; //use label count or specified parameters

            // var startDate = parameters["startDate"] || new Date(window.dateTestEx[0].toString(), 1-1, 1 );
            // var endDate = parameters["endDate"] || new Date(window.dateTestEx[1].toString(), 1, 1);

            var startDate = parameters["startDate"] || dateTestEx[0].toString();
            var endDate = parameters["endDate"] || dateTestEx[1].toString();

            // console.log(startDate);
            // console.log(endDate);

            var dateArray = d3.scaleTime()
                .domain([new Date(endDate), new Date(startDate)])
                .ticks(dataSlices);

            // var dateARR = d3.scaleTime().domain([new Date(startDate), new Date(endDate)]);
            // console.log(dateARR);

            // var separator = height / dateArray.length;
            var separator = height / dataSlices;
            var p = parameters["labelPosition"] || {
                x: -80,//offset border
                y: 0,
                z: 100
            };

            // for (var i = 0; i < (dataSlices); i++) {
            //     // console.log(dateArray[i]);
            //
            //     var label = makeTextSprite(formatTime(dateArray[i]), {fontsize: 10});
            //     label.position.set(p.x, p.y, p.z);
            //     label.rotation.y = 20;
            //     p.y += separator; //increment y position of individual label to increase over time
            // }

            dateArray.forEach(function (d) {
                // console.log(d);
                let label = makeTextSprite(formatTime(d), {fontsize: 10});
                label.position.set(p.x, p.y, p.z);
                label.rotation.y = 20;
                p.y += separator; //increment y position of individual label to increase over time
                // p.y += separator; //increment y position of individual label to increase over time
            });


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

        /**
         * BioVis Styling
         */
        d3.selectAll(".elements_child")
            .style("background-color", "transparent");

        d3.selectAll(".elements")
            .style("border", "1px solid #585858");

        pCube.render();
    };

    function addtoScene(d, i) {
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

        // console.log(objSeg.rotation);
        // objSeg.rotation.x = 1;

        // console.log(rot[2])
    }

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


    pCube.drawLines = function () {

        // console.log(lineList);

        /** Threejs Material decl to be used later for lines implementation
         *
         * @type {any}
         */
        var material = new THREE.LineBasicMaterial({
            color: "#FF4500",
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

        /**
         * Draw lines from the coordinates inside lineList
         * interates through linelist
         * select position one, draw from 1 to 2, 2 to 3, 3 to 4
         */


        for (var i = 0; i < lineList.length; i++) {
            if (lineList[i].x !== undefined) {
                // console.log("A " + lineList[i].x);
                geometry.vertices.push(new THREE.Vector3(lineList[i].x, lineList[i].y, lineList[i].z));
            }

            for (var z = 0; z < lineList.length - 1; z++) {
                if (lineList[i + 1] !== undefined) {
                    // console.log("B " + lineList[i + 1].x)
                    geometry.vertices.push(new THREE.Vector3(lineList[i + 1].x, lineList[i + 1].y, lineList[i + 1].z));

                }

            }
        }

        var line = new THREE.Line(geometry, material);
        glbox.add(line);

        // WGLScene.add(line);

    };

    pCube.render = function () {
        // remember to call both renderers!
        WGLRenderer.render(WGLScene, camera);
        renderer.render(scene, camera);
        // pointCloud.rotation.y -= 0.05;

    };

    pCube.setsDraw = function () {
        var duration = 2500;
        //rearrange point clouds
        //hide maps
        //draw a

        // console.log(interval * dataSlices);

        var nestedPointCloud = d3.nest()
            .key(function (d) {
                return d.newData.ts;
            }).entries(scene.getObjectByName("pointCloud").children)
            .sort(function (a, b) {
                return a.key > b.key;
            });

        // console.log(nestedPointCloud);


        nestedPointCloud.forEach(function (data, i) {
            var segs = data.values;
            // console.log(interval);

            segs.forEach(function (d) {
                // d.position.y = interval + interval;
                // d.position.y = interval * i - 125;

                var rotate = new TWEEN.Tween(d.position)
                    .to({
                            y: interval * i - 125
                        }
                        , duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();
            })
        });

        // scene.getObjectByName("pointCloud").children.forEach(function (d) {
        //
        //     // console.log(d);
        // });


        // d3.selectAll(".elements")
    };

    /**
     * 3D Scene Renderer
     *
     */
    var renderer, scene, camera, controls;
    var cube = new THREE.Object3D();
    var mesh = new THREE.Object3D();
    var glbox = new THREE.Object3D();
    glbox.name = "glbox";

    var pointCloud = new THREE.Object3D();
    pointCloud.name = "pointCloud";

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
