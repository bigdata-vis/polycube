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

    var start = "1920-01",
        end = "2000-01";

    var projectionScale = 5000;

    /**
     * Point of entry function to draw scene elements and inject data from map (), point cloud () and segements ()
     * @param datasets
     * @param datasets2
     */

    var dataSlices = 8;

    var timeLinearG;

    var interval = 500 / dataSlices; //height/segments

    /**
     * Flip mirro and horizontal
     * https://threejs.org/docs/#manual/introduction/Matrix-transformations
     * https://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
     */

    var mS = (new THREE.Matrix4()).identity();
    // var mS = (new THREE.Matrix4()).getInverse();
    //set -1 to the corresponding axis
    // mS.elements[0] = -1;
    //mS.elements[5] = -1;
    // mS.elements[10] = -1;

    pCube.drawElements = function (datasets, datasets2) {

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

            var jp = [1940, 1942, 1944, 1946, 1948, 1950, 1952, 1956];

            if (d.time <= jp[0]) {
                d.ts = "jp1";
            }

            if (d.time > jp[0] && d.time <= jp[1]) {
                d.ts = "jp2";
            }

            if (d.time > jp[1] && d.time <= jp[2]) {
                d.ts = "jp3";
            }

            if (d.time > jp[2] && d.time <= jp[3]) {
                d.ts = "jp4";
            }

            if (d.time > jp[3] && d.time <= jp[4]) {
                d.ts = "jp5";
            }

            if (d.time > jp[4] && d.time <= jp[5]) {
                d.ts = "jp6";
            }

            if (d.time > jp[5] && d.time <= jp[6]) {
                d.ts = "jp7";
            }

            if (d.time > jp[6] && d.time <= jp[7]) {
                d.ts = "jp8";
            }

        });

        /**
         * Clean func for Data sets 2
         *Data sets to draw point clouds
         */
        datasets2.forEach(function (d, i) {
            d.start_date = parse2(d.start_date); //parse date first and then format
            d.start_date = +format2(d.start_date)
        });


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
        WGLScene.add(glbox);

        /**
         * Time axis inverted
         * @type {number}
         */

        pointCloud.rotation.z = 3.15;
        pointCloud.position.z = -90;
        pointCloud.position.y += 5;
        // pointCloud.position.x += 4;


        // console.log(pointCloud);

        // glbox.rotation.y = 10;
        // glbox.position.z = -60;

        //rotate cube
        // pointCloud.position.copy(cube.position);
        // pointCloud.rotation.copy(cube.rotation);


        //flip pointcloud
        // cube.applyMatrix(mS);
        // pointCloud.applyMatrix(mS);


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
         * Segments
         * var segments = datasets.length; //todo: specify config value for the segments numbers
         * dynamic segementation :: var segments = (datasets2.length < 20 ? datasets.length : 10)
         * segements from the length of defaultData or datasets1
         */
        // var segments = defaultData.length;
        // var segments = (datasets2.length < 20 ? datasets.length : 10);
        // var segments = 10;

        /**D3
         *Map Projection
         *Mercator or geoAlbers
         *Dynamic Scale with editing and update function
         */
        var projection = d3.geoAlbers()
            .translate([width / 2, height / 2])
            .center([0, 45.5])
            .rotate([-13.5, -2])
            .scale(100);

        var path = d3.geoPath()
            .projection(projection)
            .pointRadius(2);

        /**
         * D3.nest to segment each data by ts property
         * sort data by jp1
         */

        var dataBySeg = d3.nest()
            .key(function (d) {
                return d.ts;
            })
            .entries(datasets).sort(function (a, b) {
                return a.key < b.key;
            });

        // console.log(dataBySeg);

        /**
         *Create Div holders for the segments
         * main Element Div (Create new segments holders from here)
         *Currently using todo: datasets1 should be changed to datasets2
         */


        var elements = d3.select("body").selectAll('.element')
        //todo: add function to .data to slice dataSets into dataSlides amount of individual segments
        //     .data(datasets.slice(0, dataSlices)).enter() //todo: limit datasets to sepcific time for y axis
            .data(dataBySeg).enter()
            .append('div')
            .attr('class', 'elements')
            .style("width", width + "px")
            .style("height", height + "px")
            .attr('id', 'mapbox')
            .each(function (d, i) {
                // console.log(d);
                var div = d3.select(this).append("div")
                    .attr("class", "elements_child")
                    .style("width", width + "px")
                    .style("height", height + "px")
                    .attr("id", function (d) {
                        // return d.IU_Archives_Number; //todo: show different data on map layers
                        return d.key;
                        // return "55117";
                    })
                    .filter(function () {  //todo: point of hiding other map items
                        return i !== 0;
                    })
                    .classed("hide", true)
                    .classed("dataPane", true);

                /**
                 * MAP entry point
                 * world mao implementation with leaflet
                 * @param d.IU is the elem ID of each mao
                 * Implement MabBox component
                 * http://www.delimited.io/blog/2014/5/10/maps-with-d3js-threejs-and-mapbox
                 *
                 */
                // pCube.drawMap(d.IU_Archives_Number, datasets); //todo: show map on each layer
                pCube.drawMap(d.key, d.values);
            });

        // pCube.drawMap("55117", datasets);

        pCube.drawMap_old = function (aut) {
            var counter = 0; //counter to monitor the amount of data rounds

            // map paths
            // svg.selectAll(".subunit")
            //     .data(topojson.feature(aut, aut.objects.subunits).features)
            //     // .data(aut.features)
            //     .enter()
            //     .append('g')
            //     .attr('transform', 'translate(460,0)rotate(80)')
            //     .append("path")
            //     .attr("class", function (d, i) {
            //         return "subunit"; //remove id
            //     })
            //     .classed("hide", function (d, i) {
            //         counter += 1;
            //         if (counter !== 1) { //only display map path for first map
            //             return true
            //         }
            //     })
            //     .attr("d", path);

            /**
             * google maps implementation
             **/

            var map = new google.maps.Map(d3.select("#mapbox").node(), {
                zoom: 8,
                center: new google.maps.LatLng(37.76487, -122.41948),
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            var overlay = new google.maps.OverlayView();

            overlay.onAdd = function () {
                var layer = d3.select(this.getPanes().overlayLayer).append("div")
                    .attr("class", "stations");
                // Draw each marker as a separate SVG element.
                // We could use a single SVG, but what size would it have?
                overlay.draw = function () {
                    var projection = this.getProjection(),
                        padding = 10;

                    var marker = layer.selectAll("svg")
                        .data(d3.entries(datasets))
                        .each(transform) // update existing markers
                        .enter().append("svg:svg")
                        .each(transform)
                        .attr("class", "marker");

                    // Add a circle.
                    marker.append("svg:circle")
                        .attr("r", 4.5)
                        .attr("cx", padding)
                        .attr("cy", padding);

                    // Add a label.
                    marker.append("svg:text")
                        .attr("x", padding + 7)
                        .attr("y", padding)
                        .attr("dy", ".31em")
                        .text(function (d) {
                            return d.key;
                        });

                    function transform(d) {

                        // console.log(d)

                        d = new google.maps.LatLng(d.value[1], d.value[0]);
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this)
                            .style("left", (d.x - padding) + "px")
                            .style("top", (d.y - padding) + "px");
                    }
                };
            };

            // console.log(d3.select(".elements_child").node());

        };

        /**
         * Objectify and draw segments elements
         */
        // elements.each(setViewData);
        elements.each(addtoScene);


        // var newDiv = d3.select("body").append('div')
        //     .attr("class", "newElement")
        //     .style("width",200 + "px")
        //     .style("height",200 + "px");
        //
        // newDiv.each(addtoScene);


        /**
         * Test biographical data
         */

        var newList = [];

        var testElem = d3.selectAll('.pointCloud')
            .data(datasets).enter()
            .each(function (d, i) {
                var image = document.createElement('img');
                var interval = 500 / dataSlices; //height/segments

                image.style.width = 10 + "px";
                image.style.height = 10 + "px";
                image.className = "pointCloud";

                image.addEventListener('load', function (event) {
                    var object = new THREE.CSS3DSprite(image.cloneNode()),
                        long = pCube.projection(d.long, d.lat).x,
                        lat = pCube.projection(d.long, d.lat).y;

                    var coord = translate([lat, long]);

                    // console.log(coord);


                    object.position.y = timeLinear(d.time); //todo: height + scale + time to determine y axis
                    object.position.z = coord[0] - 500;
                    object.position.x = coord[1] + 250;

                    /**
                     * add each proerties of the pointcloud to new data
                     * add STC as an object to use letter for reference
                     */
                    object["newData"] = d;

                    var stc = new THREE.Object3D();
                    stc.position.x = object.position.x;
                    stc.position.y = object.position.y;
                    stc.position.z = object.position.z;
                    object['STC'] = stc;


                    object.name = "pointCloud"; //todo: remove later
                    object.element.onmouseover = function () {
                        // console.log(d);
                        d3.select("#textTitle")
                            .html("<strong<p>" + d.Description_from_Notebook + "</p>" +
                                "<span class='date'>Date : " + d.Archive_Date + " </span> <br>" +
                                "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                            );

                        d3.select("#dataImage")
                            .attr("src", d.Image_URL)
                    };


                    /**
                     * populate line list
                     */

                    // newList.push(object.position);

                    lineList.push(object.position);

                    /**
                     * Add point clouds to pointCloud object created not scene so we can modify and display its rotation and position
                     */

                    pointCloud.add(object);
                    // }
                }, false);
                image.src = 'texture/ball.png';

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

            for (var i = 0; i < (dataSlices); i++) {

                // console.log(dateArray[i]);

                var label = makeTextSprite(formatTime(dateArray[i]), {fontsize: 10});
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
        si.position.y = ( -( Math.floor(i / 5) % 5 ) * 650 ) + 800;
        si.position.z = 0;
        d['SI'] = si;
    }


    /**
     * Default STC Layout Fallback function
     *
     */
    pCube.default = function () {


        // var segments = defaultData.length;
        var segments = dataSlices;

        var interval = height / segments; //height/segments

        var duration = 2500;
        TWEEN.removeAll();

        /**
         * Hide leaflet markers
         */
        d3.selectAll(".leaflet-marker-icon")
            .classed("hide", true);


        //show all time panels
        d3.selectAll(".textTitle")
            .classed("hide", false);

        //show all point clouds
        d3.selectAll(".pointCloud")
            .classed("hide", false);

        //display all the maps for the segments
        // d3.selectAll(".elements_child")
        //     .classed("hide", function (d, i) {
        //         // console.log(i);
        //         if (i !== 0) {
        //             return true
        //         }
        //     });

        var segCounter = 0; //keep list of the segment counters


        /**
         * Point Cloud reverse flattening
         */

        scene.getObjectByName("pointCloud").children. forEach(function (d) {

            var unFlattenPoints = new TWEEN.Tween(d.position)
                .to({
                    y: d.STC.position.y
                }, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();
        });


        /**
         * reverse array before animating
         */
        scene.children[0].children.reverse();

        // console.log(scene.children[0].children);

        scene.children[0].children.forEach(function (object, i) {

            //show box shapes
            if (object.name == "side") {
                object.element.hidden = false;
            }


            //show segments
            if (object.name == "seg") {

                segCounter++;

                // console.log(interval);

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
                        // opacity: 0.2,
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

        /**
         * Remove transparency on first layer only and hide the rest
         */
        d3.selectAll(".elements_child")
            .filter(function (d, i) {  //todo: point of hiding other map items
                return i !== 0;
            })
            .classed("hide", true)
            .classed("dataPane", false)

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

        /**
         * show leaflet markers
         */
        d3.selectAll(".leaflet-marker-icon")
            .classed("hide", false);


        //display all the maps for the segments
        d3.selectAll(".elements_child")
            .classed("hide", false);

        //hide canvas temporarily //todo: remove all pointClouds
        d3.selectAll(".pointCloud")
            .classed("hide", true);

        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

        var segCounter = 0; //keep list of the segment counters

        /**
         * reverse array before animating
         */
        scene.children[0].children.reverse();

        // console.log(scene.children[0].children);

        // scene.getObjectByName("seg").children

        // console.log(scene.getObjectByName("seg")) //todo: fix layout to select only segments to balance layout in JP


        scene.children[0].children.forEach(function (object, i) { //todo: fixleftspace

            // console.log(object)

            var reduceLeft = {
                x: (( segCounter % 5 ) * (width + 50)) - (width),
                y: ( -( Math.floor(segCounter / 5) % 5 ) * (width + 50) ) + 100, //just another way of getting 550
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
                        // opacity: 0.8,
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

        /**
         * Reverse array to show last segment first
         */

        scene.children[0].children.reverse();
        // console.log(scene.children[0].children);


        /**
         * Point Cloud Flattening
         * Flatten object perspectives to 0
         */

        scene.getObjectByName("pointCloud").children. forEach(function (d) {
            d.position.y = 0;

        });



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
     * Line function implementation
     * create line using only CSS3D
     */

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

        // geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
        // geometry.vertices.push(new THREE.Vector3(0, 40, 0));
        // geometry.vertices.push(new THREE.Vector3(10, 0, 0));

        var line = new THREE.Line(geometry, material);
        glbox.add(line);

        // WGLScene.add(line);

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
        // pointCloud.rotation.y -= 0.05;

    };

    /**
     * MAP entry point
     * Austrian Map Implementation with topojson
     * @param aut
     * Implement MabBox component
     * http://www.delimited.io/blog/2014/5/10/maps-with-d3js-threejs-and-mapbox
     * https://hackernoon.com/d3-js-and-google-maps-api-in-10-easy-steps-4f258323525b
     * https://developers.google.com/maps/documentation/javascript/examples/circle-simple
     * http://blockbuilder.org/jaegerka/e53294b2f5087e03525ff8d508767a2d
     *
     */

    pCube.drawMap = function (elemID, data) {

        var accesToken = 'pk.eyJ1Ijoib3NhZXoiLCJhIjoiOExKN0RWQSJ9.Hgewe_0r7gXoLCJHuupRfg';

        var street = L.tileLayer('http://a.tiles.mapbox.com/v3/tmcw.map-rep59d6x/{z}/{x}/{y}.png'),
            street2 = L.tileLayer('http://{s}.sm.mapstack.stamen.com/(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/{z}/{x}/{y}.png?access_token={accessToken}', {
                attributionControl: false,
                maxZoom: 18,
                id: 'mapbox.streets',
                accessToken: accesToken,
                zoomControl: false
            }),
            street3 = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attributionControl: false,
                maxZoom: 18,
                id: 'mapbox.streets',
                accessToken: accesToken,
                zoomControl: false
            });

        var mymap = L.map(elemID, {
            layers: [street2],
            attributionControl: false,
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: accesToken,
            zoomControl: false
        }).setView([30.4507462, -91.154552], 3);

        mymap.touchZoom.disable();
        mymap.doubleClickZoom.enable();
        // mymap.doubleClickZoom.disable();
        mymap.scrollWheelZoom.disable();
        mymap.boxZoom.disable();
        mymap.keyboard.disable();
        mymap.dragging.disable();

        var getPxBounds = mymap.getPixelBounds;

        mymap.getPixelBounds = function () {
            var bounds = getPxBounds.call(this);
            // ... extend the bounds
            bounds.min.x = bounds.min.x - 1000;
            bounds.min.y = bounds.min.y - 1000;
            bounds.max.x = bounds.max.x + 1000;
            bounds.max.y = bounds.max.y + 1000;
            return bounds;
        };

        var color = '#1C75BC';
        var circle_options = {
            color: '#ff9600',
            fillColor: '#ff9600'
        };

        var crs = mymap.options.crs;
        var pixelOrigin = mymap.getPixelOrigin();
        var mapZoom = mymap.getZoom();

        pCube.projection = function projectPoint(x, y) {
            // return mymap.latLngToLayerPoint(new L.LatLng(y, x));
            var latlong = new L.LatLng(x, y);
            var projectedPoint = mymap.project(latlong, mapZoom);
            // return crs.latLngToPoint(latlong, mapZoom);
            // console.log(projectedPoint);
            return projectedPoint;
        };

        /**LATLONG to POINT
         * convert latlong to point and use it to porject xy coordinates of the sprite
         * https://stackoverflow.com/questions/40986573/project-leaflet-latlng-to-tile-pixel-coordinates
         */

        var icon = L.icon({
            iconUrl: 'texture/ball.png',
            iconSize:     [10, 10] // size of the icon
            // shadowSize:   [50, 64], // size of the shadow
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62],  // the same for the shadow
            // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });


        data.forEach(function (d) {
            var coord = L.latLng(d.long, d.lat);
            // var layerPoint = crs.latLngToPoint(coord, mapZoom);
            // console.log(translate([layerPoint.x, layerPoint.y]));
            // var radius = 1000;
            // var circle = L.circle(coord, radius, circle_options).addTo(mymap);
            var marker = L.marker(coord, {icon: icon}).addTo(mymap);
            marker.on('mouseover', function(e){
                // console.log(d);
                d3.select("#textTitle")
                    .html("<strong<p>" + d.Description_from_Notebook + "</p>" +
                        "<span class='date'>Date : " + d.Archive_Date + " </span> <br>" +
                        "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                    );
                d3.select("#dataImage")
                    .attr("src", d.Image_URL)

            });
        });

        /**
         * On zoom map, remove, update and draw pointClouds
         *
         */

        mymap.on('zoomend', function (e) {
            // console.log(mapZoom)
            console.log(e.target);

            // remove point cloud
            delete3DOBJ("pointCloud");
            // add new point cloud with project points
        });


        // var marker = L.marker([51.5, -0.09]).addTo(mymap);
        //
        // var circle = L.circle([51.508, -0.11], {
        //     color: 'red',
        //     fillColor: '#f03',
        //     fillOpacity: 0.5,
        //     radius: 500
        // }).addTo(mymap);
        //

        var polygon = L.polygon([
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047]
        ]).addTo(mymap);

    };


    pCube.clearScene = function () {
        // scene.clear();
        console.log(scene)
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
            console.log(i);

            segs.forEach(function (d) {
                // d.position.y = interval + interval;
                // d.position.y = interval * i - 125;

                var rotate = new TWEEN.Tween(d.position)
                    .to({
                            y: interval * i - (62.5 * 3)
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
     * Translate function for the long and lat coordinates
     * @param point
     * @returns {*[]}
     * http://blog.mastermaps.com/2013/11/showing-gps-tracks-in-3d-with-threejs.html
     */

    function translate(point) {
        return [point[0] - (width / 2), (height / 2) - point[1]];
        // return [point[0] - (width), (height) - point[1]];
    }

    /**
     * Remove object from scene
     */

    function delete3DOBJ(objName) {
        var selectedObject = scene.getObjectByName(objName);
        console.log(selectedObject);

        // var elem = document.getElementsByClassName("pointCloud");
        var elem = d3.selectAll("." + objName);
        elem.remove();
        // elem.remove();
        // elem.parentNode.removeChild(elem);

        scene.remove(selectedObject);
        pCube.animate();

        console.log(elem);
    }

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
