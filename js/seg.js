/**
 * Created by simba on 27/03/2017.
 */
(function () {
    'use strict';


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
    var pcObjects = [];

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
    let formatDate = d3.timeFormat("%d %b %Y");
    let parse4 = d3.timeParse("%Y-%m-%dT00:00:00Z");

    var projectionScale = 5000;

    let flat_time = false; //used to store flatten or timelinear info on pointCloud

    /**
     * Point of entry function to draw scene elements and inject data from map (), point cloud () and segements ()
     * @param datasets
     * @param datasets2
     */

    var dataSlices = 3;
    var interval = 500 / dataSlices; //height/segments

    var timeLinearG;

    let dataBySeg;

    var layout;


    var projection;
    var path;
    var elements;

    // let colour2 = d3.scaleSequential(d3.interpolatePiYG())

    var position = new THREE.Vector3();

    var pointSelectedLines = [];

    var overlapingData;
    // var noicyData;

    let colour;
    /**
     * Flip mirro and horizontal
     * https://threejs.org/docs/#manual/introduction/Matrix-transformations
     * https://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
     */

    // var mS = (new THREE.Matrix4()).identity();

    pCube.drawElements = function (datasets, geoMap) {

        //update datasets with new data
        //update cube.children
        //update glbox.children
        //update pointCloud.children
        //update mesh.children

        //Wipe pointcloud, glbox and cube containers
        pointCloud.children = [];
        glbox.children = [];
        cube.children = [];

        /**
         * Time linear function to calculate the y axis on the cube by passing the value of year from the datasets
         *
         */
        var dateTestEx = d3.extent(datasets, function (d) {
            return d.time;
        });

        let dateUnixEx = d3.extent(datasets, function (d) {
            return d.unix;
        });

        // console.log(dateUnixEx);

        window.dateTestEx = dateTestEx;
        window.dateExUnix = dateUnixEx;
        window.geoMapData = geoMap;

        // var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);
        var timeLinear = d3.scaleLinear().domain(dateUnixEx).range([-heightHalf, heightHalf]);

        // let colour = d3.scaleOrdinal()
        // colour = d3.scaleSequential(d3.interpolateRainbow)
        // colour = d3.scaleSequential(d3.interpolateCool)
        colour = d3.scaleSequential(d3.interpolateViridis)
        //     .domain([dateTestEx[0], dateTestEx[1]]);
            .domain(dateUnixEx);

        /**
         * Define and Transfer the color scaler
         */

        window.colorScale = colour;

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
         * D3.nest to segment each data by ts property
         * sort data by jp1
         */

        dataBySeg = d3.nest()
            .key(function (d) {
                return d.ts;
            })
            .entries(datasets).sort(function (a, b) {
                return a.key < b.key;
            });

        // console.log(dataBySeg)
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
        svgScene = new THREE.Scene();

        /**
         * Render point cloud from the automated data and points;
         * TrackballControls makes object disspear when zooming out ?
         */
        pCube.showPointCloud = function () {
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
        // WGLRenderer.setClearColor(0x00ff00, 0.0);
        WGLRenderer.domElement.style.position = 'absolute';
        // WGLRenderer.domElement.style.zIndex = 1;
        WGLRenderer.domElement.style.top = 0;
        document.body.appendChild(WGLRenderer.domElement);

        // /**
        //  * SVG Renderer
        //  */
        // svgRenderer = new THREE.SVGRenderer();
        // svgRenderer.setSize(window.innerWidth, window.innerHeight);
        // svgRenderer.domElement.style.top = 0;
        // // svgRenderer.setQuality('low');
        // svgRenderer.domElement.style.position = 'absolute';
        // svgRenderer.domElement.style.backgroundColor = 'black';
        //
        // document.body.appendChild(svgRenderer.domElement);


        /**CSS renderer
         *
         * @type {THREE.CSS3DRenderer}
         */
        renderer = new THREE.CSS3DRenderer();
        renderer.domElement.id = "CSSLayoutBox";
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = 0;
        document.body.appendChild(renderer.domElement);


        /**
         * Callibrating css cubebox and glcube box positions
         * https://stackoverflow.com/questions/24681170/three-js-properly-blending-css3d-and-webgl/24688807#24688807
         * Copy position of the cube box and attach it to glbox to callibrate both objects
         */
        // glbox.position.copy(cube.position);
        // glbox.rotation.copy(cube.rotation);

        // pointCloud.position.copy(cube.position);
        // pointCloud.rotation.copy(cube.position);

        // console.log(pointCloud);

        // pointCloud.rotation.y = -1.54;
        // pointCloud.position.z += -5;
        // pointCloud.position.x += 5;

        pointCloud.rotation.y = -1.6;
        pointCloud.position.z += 1;
        pointCloud.position.x += -1;


        //calibration glbox lines with CSS scene
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
        // controls.pan = false;
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

        //KHM
        // pointCloud.rotation.z = 3.15;
        // pointCloud.position.z = 90;
        // pointCloud.position.y += 5;
        // pointCloud.position.x -= 625;
        // glbox.rotation.z = 3.15;
        // glbox.position.z = -90;
        // glbox.position.y += 5;

        //Cushman
        // pointCloud.rotation.z = 3.15;
        // pointCloud.position.z = -90;
        // pointCloud.position.y += 5;

        // glbox.rotation.z = 3.15;
        // glbox.position.z = -90;
        // glbox.position.y += 5;


        /**
         * SandBox
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
         //  */

        pCube.updateMap = function (scale = 400, mapData) {

            //clear all map data on the scene todo: finc a smarter way
            //clear all d3 elements in DOM

            // cube.children = [];
            // d3.selectAll('.elements').remove();
            // d3.selectAll('#mapbox').remove();
            // pointCloud.children = [];
            // d3.selectAll('.pointCloud').remove();
            // d3.selectAll("elements.parent").selectAll("*").remove();
            // // d3.selectAll('.element').remove();
            // d3.selectAll('.map-div').remove();
            // d3.selectAll('.elements_child').remove();
            // // d3.selectAll('svg').remove();
            // d3.selectAll('img').remove();


            projection = d3.geoEquirectangular()
                .translate([width / 2, height / 2])
                // .center([21.62731, 47.5316049])
                .center([-91.154552, 30.4507462])
                .scale(scale);

            path = d3.geoPath().projection(projection);


            /**
             *Create Div holders for the segments
             * main Element Div (Create new segments holders from here)
             *Currently using todo: datasets1 should be changed to datasets2
             */

            // console.log(dataBySeg);

            //to reverse data from begining
            dataBySeg.reverse();

            elements = d3.select("body").selectAll('.elements')
            //todo: add function to .data to slice dataSets into dataSlides amount of individual segments
            //     .data(datasets.slice(0, dataSlices)).enter() //todo: limit datasets to sepcific time for y axis
                .data(dataBySeg)
                .enter()
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
                        // var maps = pCube.drawMap(d.key, d.values);

                        // var geoMap = pCube.drawMap2(d.key,d.values,path)

                    var geoMap = pCube.drawMap2(d.key, mapData, d.values)
                });

            elements.append('p')
                .attr("class", "segLabel")
                .classed("hide", true)
                .html(function (d) {
                    // console.log(d);
                    let retVal;

                    switch (d.key) {
                        case "jp1":
                            retVal = "1938";
                            break;

                        case "jp2":
                            retVal = "1939";
                            break;

                        case "jp3":
                            retVal = "1940";
                            break;

                        case "jp4":
                            retVal = ">= 1951";
                            break;
                    }

                    return retVal;

                });
        };
        pCube.updateMap(400, geoMap);

        /**
         * Colour Scale
         */

        // console.log(dateTestEx);

        overlapingData = datasets;

        pCube.updatePC = function (datasets = datasets, jitter, color=false) {
            // var image, interval, stc, object;

            /**
             * Remove all elements from the scene
             * remove pointClouds threejs
             * remmove d3elements threejs
             * @type {Array}
             * TODO: Draw with tween on entry
             */

            //clear all pc on the scene todo: finc a smarter way
            //clear all d3 elements in DOM
            pointCloud.children = [];
            d3.selectAll('.pointCloud').remove();

            /**
             *hide guide lines
             */
            hideGuide();

            var testElem = d3.selectAll('.pointCloud')
                .data(datasets).enter()
                .each(function (d, i) {
                    const image = document.createElement('div');
                    interval = 500 / dataSlices; //height/segments
                    const stc = new THREE.Object3D();
                    // var object = new THREE.CSS3DObject(image),
                    const object = new THREE.CSS3DSprite(image);
                    // update matrix true on entry
                    object.matrixAutoUpdate = true;
                    // object.updateMatrix();

                    image.style.width = 3.5 + "px";
                    image.style.height = 3.5 + "px";
                    image.className = "pointCloud";

                    if(color){
                        // image.style.background = "#EDCA3A";
                        image.className = "pointCloud green_BG";
                    }else {
                        image.style.background = colour(d.unix);
                        // image.style.background = colour(d.time);
                    }


                    // object.position.copy(position);
                    object.position.multiplyScalar(75);

                    var long = d.lat,
                        lat = d.long,
                        coord = translate(projection([long, lat]));

                    if (flat_time) {
                        object.position.y = 0;
                    } else {
                        object.position.y = timeLinear(d.unix); //for unix date
                    }

                    if (jitter) {
                        object.position.z = coord[1] + getRandomInt(-jitter, jitter);
                        object.position.x = coord[0] + getRandomInt(-jitter, jitter);
                    } else {
                        object.position.z = coord[1];
                        object.position.x = coord[0];
                    }

                    // update matrix off on exit
                    object.matrixAutoUpdate = false;
                    object.matrixWorldNeedsUpdate = false;
                    object.updateMatrix();

                    // const cp = {...object.position};

                    /**
                     * add each proerties of the pointcloud to new data
                     *
                     */
                    object["newData"] = d;
                    stc.position.x = object.position.x;
                    stc.position.y = timeLinear(d.unix); // for unix
                    stc.position.z = object.position.z;
                    object['STC'] = stc;

                    // add object rotation
                    // object.rotation.fromArray(rot[2]);

                    object.name = "pointCloud"; //todo: remove later

                    object.element.onclick = function () {
                        // object.element.onmouseover = function () {

                        //Change image src
                        // console.log(d);

                        d3.select("#textTitle")
                            .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                                "<span class='date'>Date : " + formatDate(parse4(d.Date)) + " </span> <br>" +
                                "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                            );

                        // d3.select("#searchLink")
                        //     .attr("href", "https://www.google.co.uk/search?tbm=isch&q=" + d.City_and_State + "+" + d.Description_from_Slide_Mount);

                        d3.select("#dataImage")
                            .attr("src", d.Image_URL);

                        drawPointSelectedLines(object.position);
                    };

                    // lineList.push(object.position);
                    /**
                     * Add point clouds to pointCloud object created not scene so we can modify and display its rotation and position
                     */

                    pointCloud.add(object);
                    // pointCloud.push(object);

                    // }
                    // }, false);
                    // image.src = 'texture/ball2.png';
                });

            polyCube.render()
        };
        pCube.updatePC(datasets,6, false);

        //pass datasets to overlapping function
        window.noicyData = datasets;

        elements.each(addtoScene);

        /**
         * Draw Timeline and Labels
         * todo: Redo timeLine
         *
         */

        drawLabels({ //Todo: fix label with proper svg
            labelPosition: {
                x: widthHalf,//offset border
                y: -(height / 2) - 10,
                // y: -(height / 2) + 80,
                z: widthHalf
            },
            labelCount: 17
        });

        // drawLabels({ //Todo: fix label with proper svg
        //     labelPosition: {
        //         x: -widthHalf,//offset border
        //         y: -(height / 2) - 10,
        //         z: -widthHalf
        //     },
        //     rotation: 10,
        //     labelCount:17
        // });

        function drawLabels(parameters) {

            if (parameters === undefined) parameters = {};
            let labelCount = parameters["labelCount"] || dataSlices; //use label count or specified parameters

            // let startDate = parameters["startDate"] || dateTestEx[1].toString();
            // let endDate = parameters["endDate"] || dateTestEx[0].toString();

            let rotation = parameters["rotation"] || 20;
            // console.log(endDate);

            // let dateArrayOld = d3.scaleTime()
            //     .domain([new Date(window.dateExUnix[0] * 1000), new Date(window.dateExUnix[1] * 1000)])
            //     .ticks();

            let dateArray = d3.timeYears(new Date(window.dateTestEx[0], 1-1, 1 ), new Date(window.dateTestEx[1], 1, 1));

            // let dateArray = d3.timeYears(new Date(window.dateExUnix[0] * 1000), new Date(window.dateExUnix[1] * 1000));

            let separator = height / labelCount;
            let p = parameters["labelPosition"] || {
                x: -80,//offset border
                y: height / dateArray.length,
                z: 100
            };

            // console.log(new Date(window.dateExUnix[0] * 1000), new Date(window.dateExUnix[1] * 1000));

            dateArray.forEach(function (d) {
                // console.log(d);
                let label = makeTextSprite(formatTime(d), {fontsize: 10});
                label.position.set(p.x, p.y, p.z);
                label.rotation.y = rotation;
                p.y += height / dateArray.length; //increment y position of individual label to increase over time
                // p.y += separator; //increment y position of individual label to increase over time
            });
            //
            // for (let i = 0; i < (dateArray.length); i++) {
            //     // console.log(i);
            //     let label = makeTextSprite(formatTime(dateArray[i]), {fontsize: 10});
            //     label.position.set(p.x, p.y, p.z);
            //     label.rotation.y = rotation;
            //     // p.y += separator; //increment y position of individual label to increase over time
            //     p.y += height / dateArray.length; //increment y position of individual label to increase over time
            // }

            function makeTextSprite(message, parameters) {
                if (parameters === undefined) parameters = {};
                var fontsize = parameters["fontsize"] || 70;

                var element = document.createElement('p');
                element.className = "textTitle";
                element.style.color = 'grey';
                element.style.fontSize = fontsize + "px";
                var elMessage = document.createTextNode(message);
                element.appendChild(elMessage);

                // var object = new THREE.CSS3DObject(element);
                var object = new THREE.CSS3DSprite(element);
                cube.add(object);

                return object;
            }
        }

        /**
         * BioVis Styling
         */
        d3.selectAll(".elements_child")
            .style("background-color", "transparent");

        pCube.render();
        layout = "STC";
        window.layout = layout;
    };

    function addtoScene(d, i) {
        var objSeg = new THREE.CSS3DObject(this);
        // objSeg.translate( 0, 0, 0 );

        //position
        objSeg.position.x = 0;
        objSeg.position.y = (i * interval) - height / 2;
        objSeg.position.z = 0;
        //rotation
        objSeg.rotation.fromArray(rot[2]);
        objSeg.name = "seg";
        cube.add(objSeg);
    }

    // console.log(testData);
    function setViewData(d, i) {
        var vector, phi, theta;
        var stc, jp, si;

        // stc = new THREE.Object3D();
        // stc.position.x = Math.random() * 4000 - 2000;
        // stc.position.y = Math.random() * 4000 - 2000;
        // stc.position.z = Math.random() * 4000 - 2000;
        // d['STC'] = stc;

        stc = new THREE.Object3D();
        stc.position.x = d.position.x;
        stc.position.y = d.position.y;
        stc.position.z = d.position.z;
        d['STC'] = stc;


        // jp = new THREE.Object3D();
        // jp.position.x = (( i % 5 ) * (width + 50)) - (width * 2);
        // jp.position.y = ( -( Math.floor(i / 5) % 5 ) * (width + 50) ) + 400;
        // jp.position.z = 0;
        // jp.time = ["1920", "1930"];
        // d['JP'] = jp;
        //
        // si = new THREE.Object3D();
        // si.position.x = (( i % 5 ) * 1050) - 2000;
        // si.position.y = ( -( Math.floor(i / 5) % 5 ) * 650 ) + 800;
        // si.position.z = 0;
        // d['SI'] = si;
    }

    /**
     * Default STC Layout Fallback function
     *
     */
    pCube.default = function (callbackFuntion) {
        var segments = dataSlices;
        var interval = height / segments; //height/segments

        flat_time = false;

        var duration = 2500;
        TWEEN.removeAll();

        /**
         * Hide leaflet markers
         */
        d3.selectAll(".subunit_points")
            .classed("hide", true);

        /**
         * Hide SegLable
         */
        d3.selectAll(".segLabel")
            .classed("hide", true);

        /**
         * show all time panels
         */
        d3.selectAll(".textTitle")
            .classed("hide", false);

        /**
         * show all point clouds
         * delay poitcloud introduction
         * add transition tween
         */

        setTimeout(function () {
            d3.selectAll(".pointCloud")
                .classed("hide", false);
        }, 2500);

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
        scene.getObjectByName("pointCloud").children.forEach(function (d) {

            var unFlattenPoints = new TWEEN.Tween(d.position)
                .to({
                    y: d.STC.position.y
                }, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();

            // update matrix false on exit
            // d.matrixAutoUpdate = false;
            // d.updateMatrix();

            // console.log(d)
        });

        /**
         * Reverse array to show last segment first
         * Only show
         */

        if (layout !== "STC") {
            // scene.children[0].children.reverse(); //on
        }

        // if(layout !== "JP"){
        //     scene.children[0].children.reverse();
        // }
        //
        // if(layout === "SI"){
        //     scene.children[0].children.reverse();
        // }

        d3.selectAll(".elements_child")
            .filter(function (d, i) {  //todo: point of hiding other map items
                // console.log(d);
                // return i !== 0;
                return d.key !== "jp1";
            })
            .classed("hide", true)
            .classed("dataPane", false);


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
        // console.log(d3.selectAll(".elements_child"));


        //callback function to run at the end of every default redraw
        if (callbackFuntion) {
            callbackFuntion()
        }

        layout = "STC";
        window.layout = layout;
    };

    /**
     * Juxtaposition function
     *
     */
    pCube.juxstaPose = function () {
        var duration = 2500;
        TWEEN.removeAll();

        /**
         * show leaflet markers
         * show leaflet maps
         * show pointer event on layers
         */
        d3.selectAll(".subunit_points")
            .classed("hide", false);

        /**
         * Hide SegLable
         */
        d3.selectAll(".segLabel")
            .classed("hide", false);

        /**
         *hide guide lines
         */
        hideGuide();


        // conntrols
        controls.noZoom = false;
        controls.noRotate = true;

        //display all the maps for the segments
        d3.selectAll(".elements_child")
            .classed("hide", false);

        //hide canvas temporarily //todo: remove all pointClouds


        if (layout === "STC") {
            //flatten pointCloud time first if layout is STC
            polyCube.setsDraw();
        }

        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

        var segCounter = 0; //keep list of the segment counters

        /**
         * reverse array before animating
         * Flatten Time before animating
         */

        // scene.children[0].children.reverse(); //on


        // console.log(scene.children[0].children);

        scene.children[0].children.forEach(function (object, i) { //todo: fixleftspace

            var reduceLeft = {
                x: (( segCounter % 5 ) * (width + 50)) - (width),
                y: ( -( Math.floor(segCounter / 5) % 5 ) * (width + 50) ) - 100, //just another way of getting 550
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
                //delay the transition to flatten time first
                // if (layout === "STC") {
                //
                // }

                setTimeout(function () {
                    d3.selectAll(".pointCloud")
                        .classed("hide", true);

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
                }, 1200);


                // console.log(object)

                //store object JP position inside the container
                var jp = new THREE.Object3D();
                jp.position.x = object.position.x;
                jp.position.y = object.position.y;
                jp.position.z = object.position.z;
                object['JP'] = jp;
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

        layout = "JP";
        window.layout = layout;

    };

    pCube.onWindowResize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        WGLRenderer.setSize(window.innerWidth, window.innerHeight);
        // svgRenderer.setSize(window.innerWidth, window.innerHeight);
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
        flat_time = true;

        /**
         * make control center thesame as cube xyz position
         */
        controls.center.add(cube.position);

        /**
         * controls
         */
        controls.noRotate = true;


        //hide all time panels
        d3.selectAll(".textTitle")
            .classed("hide", true);

        //display all the maps for the segments
        d3.selectAll(".elements_child")
            .classed("hide", false);

        /**
         * Hide SegLable
         */
        d3.selectAll(".segLabel")
            .classed("hide", true);

        /**
         *hide guide lines
         */
        hideGuide();

        var duration = 700;

        /**
         * Reverse array to show last segment first
         */
        // scene.children[0].children.reverse(); //on
        // console.log(scene.children[0].children);

        /**
         * Point Cloud Flattening
         * create a new object STC, save positions of STC inside object
         * rotate point cloud to match the positions of the
         */

        scene.getObjectByName("pointCloud").children.forEach(function (d) {

            // d.position.y = -249;

            // console.log(d3.select(d.element));

            // d3.select(d.element).classed("green_BG", false);

            // update matrix true on entry
            d.matrixAutoUpdate = true;
            d.updateMatrix();

            var flattenPoints = new TWEEN.Tween(d.position)
                .to({
                    y: 0.5
                }, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();

            // console.log(d)

            // // update matrix false on exit
            // d.matrixAutoUpdate = false;
            // d.updateMatrix();
        });

        /**
         * Layers flattening
         */

        // SI to JP
        // scene.getObjectByName("cube").children.forEach(function (d, i) {
        //     if(d.getObjectByName("side")){
        //         d.element.hidden = true;
        //     }
        //
        //     if(d.getObjectByName("seg")){
        //         var reduceLeft = {
        //             x: 0,
        //             y: ( -( Math.floor(i / 5) % 5 ) * (width + 50) ) + 100, //just another way of getting 550
        //             z: 0
        //         };
        //
        //         //make the rotation thesame as jp segments
        //         // d.rotation._x = 0;
        //         // d.rotation._y = 0;
        //         // d.rotation._z = 0;
        //
        //
        //         var posTween = new TWEEN.Tween(d.position)
        //             .to(reduceLeft, duration)
        //             .easing(TWEEN.Easing.Sinusoidal.InOut)
        //             .start();
        //
        //         var rotate = new TWEEN.Tween(d.rotation)
        //             .to({x: 0, y: 0, z: 0}, duration)
        //             .easing(TWEEN.Easing.Sinusoidal.InOut)
        //             .start();
        //
        //         //make the point cloud rotation thesame as above
        //
        //         console.log(d);
        //
        //         d.position.x = 0;
        //         d.position.z = 0;
        //     }
        // });

        scene.children[0].children.forEach(function (object, i) {

            // remove box shapes
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
                        // opacity: 0.3
                    }, duration).easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start()
            }

        });

        //change camera view
        //camera position

        //if juxtapos = false
        /**
         * Smoothing the camera transition
         */

        if (layout === "JP" || layout === "SI") {

            //transparent leaflet maps
            // setTimeout(function () {
            polyCube.hideLeafletMap(true);
            // }, duration)

            //put the segments together
            scene.getObjectByName("cube").children.forEach(function (d, i) {
                if (d.getObjectByName("seg")) {
                    var reduceLeft = {
                        x: 0,
                        // y: ( -( Math.floor(i / 5) % 5 ) * (width + 50) ) + 200, //just another way of getting 550
                        z: 0
                    };

                    var posTween = new TWEEN.Tween(d.position)
                        .to(reduceLeft, duration)
                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                        .start();

                    var rotate = new TWEEN.Tween(d.rotation)
                        .to({x: 0, y: 0, z: 0}, duration)
                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                        .start();

                    d.position.x = 0;
                    d.position.z = 0;
                }
            });
            //and rotate the camera with all the points showing as above

            //or show the points only with only one map on the pane

            //rotate the pointclouds thesame way and position as the camera

        } else {
            //camera rotation
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
                    // camera.lookAt(scene.position);
                })
                .start();

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
                // .onUpdate(function () {
                //     // camera.rotation.set(this.x, this.y, this.z);
                //     // // camera.lookAt(new THREE.Vector3(0, 0, 0));
                //     // //camera.fov = 8; todo: add a new fov to change perspective
                // })
                .onComplete(function () {

                })
                .start();

        }

        //else
        // do not rotate camera
        /**
         * Use Orthographic Camera
         * https://threejs.org/docs/#api/cameras/OrthographicCamera
         * https://threejs.org/docs/#examples/cameras/CombinedCamera
         */

        // camera.toOrthographic();

        layout = "SI";
        window.layout = layout;
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
        image.src = 'texture/ball2.png';
    };

    pCube.render = function () {


        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // remember to call both renderers!
        WGLRenderer.render(WGLScene, camera);
        renderer.render(scene, camera);
        // svgRenderer.render(svgScene, camera);

        // cube.rotation.y -= 0.05;
        // pointCloud.rotation.y -= 0.05;

        // console.log(layout)

        //make mesh always face camera
        // mesh.lookAt( camera.position );
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

        /**LATLONG to POINT
         * convert latlong to point and use it to porject xy coordinates of the sprite
         * https://stackoverflow.com/questions/40986573/project-leaflet-latlng-to-tile-pixel-coordinates
         */

        pCube.projection = function projectPoint(x, y) {
            // return mymap.latLngToLayerPoint(new L.LatLng(y, x));
            var latlong = new L.LatLng(x, y);
            var projectedPoint = mymap.project(latlong, mapZoom);
            // return crs.latLngToPoint(latlong, mapZoom);
            // console.log(projectedPoint);
            return projectedPoint;
        };

        var icon = L.icon({
            iconUrl: 'texture/ball.png',
            iconSize: [10, 10] // size of the icon
            // shadowSize:   [50, 64], // size of the shadow
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62],  // the same for the shadow
            // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        data.forEach(function (d) {
            var coord = L.latLng(d.long, d.lat);
            // var layerPoint = crs.latLngToPoint(coord, mapZoom);
            // var radius = 1000;

            // var circle = L.circle(coord, radius, circle_options).addTo(mymap);

            var marker = L.marker(coord, {icon: icon}).addTo(mymap);
            // marker.on('mouseover', function (e) {
            marker.on('click', function (e) {
                // console.log(d);
                d3.select("#textTitle")
                    .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                        "<span class='date'>Date : " + formatDate(parse4(d.Date)) + " </span> <br>" +
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

        // mymap.on('zoomend', function (e) {
        //     // console.log(mapZoom)
        //     console.log(e.target);
        //
        //     // remove point cloud
        //     delete3DOBJ("pointCloud");
        //     // add new point cloud with project points
        // });

        // var polygon = L.polygon([
        //     [51.509, -0.08],
        //     [51.503, -0.06],
        //     [51.51, -0.047]
        // ]).addTo(mymap);

        // mymap.addLayer(layers.street3);

        /**
         * Switch leaflet map layers
         * @param map
         */

        var baseMaps = {
            "Street1": street,
            "Street2": street2,
            "Street3": street3
        };

        var overlays = {};

        L.control.layers(baseMaps, overlays).addTo(mymap);

        pCube.switchMap = function (map) {
            if (mymap.hasLayer(street)) {
                mymap.removeLayer(street)
            } else {
                mymap.addLayer(street2)
            }
        };
    };

    pCube.drawMap3 = function (elemID, data, points) {

        // console.log(elemID);
        // console.log(points);

        var counter = 0; //counter to monitor the amount of data rounds

        // Convert the TopoJSON features to GeoJSON
        var features = topojson.feature(data, data.objects.land);

        // console.log(features);

        var mapSVG = d3.selectAll("#" + elemID).append("svg")
        // .attr("class", "elements_child")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.2);

        // console.log(mapSVG);

        mapSVG.selectAll(".subunit")
            .data([features])
            // .data(aut.features)
            .enter()
            .append('g')
            // .attr('transform', 'translate(460,0)rotate(80)')
            // .attr('transform', 'translate(460,0)rotate(80)')
            .append("path")
            .attr("class", function (d, i) {
                return "subunit"; //remove id
            })
            // .classed("hide", function (d, i) {
            //     counter += 1;
            //     if (counter !== 1) { //only display map path for first map
            //         return true
            //     }
            // })
            .attr("d", path);
    };

    pCube.drawMap2 = function (elemID, data, points) {
        let mapSVG = d3.selectAll("#" + elemID).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0.7);

        // let features = topojson.feature(data, data.objects.land);
        let mapPoints = points;

        //countries
        mapSVG.append("g")
            .attr("class", "boundary")
            .selectAll("boundary")
            .data(topojson.feature(data, data.objects.countries).features)
            .enter().append("path")
            .attr("name", function (d) {
                return d.properties.name;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .attr("d", path);

        //states
        mapSVG.append("g")
            .attr("class", "boundary state hidden")
            .selectAll("boundary")
            .data(topojson.feature(data, data.objects.states).features)
            .enter().append("path")
            .attr("name", function (d) {
                return d.properties.name;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .attr("d", path);

        //labels
        mapSVG.append("g")
            .attr("class", "labelsOnMap")
            .selectAll(".subunit-label")
            .data(topojson.feature(data, data.objects.states).features)
            .enter().append("text")
            .attr("class", function (d) {
                return "subunit-label " + d.id;
            })
            .attr("transform", function (d) {
                return "translate(" + path.centroid(d) + ")";
            })
            .attr("dy", ".35em")
            .text(function (d) {
                return d.properties.name;
            });

        //points on map
        mapSVG.append("g")
            .attr("class", "pointOnMap")
            .selectAll(".subunit_points")
            .data(mapPoints)
            .enter().append("circle")
            .attr("class", "subunit_points hide")
            .attr("r", 3)
            .attr("cx", function (d) {
                let cx = projection([d.lat, d.long])[0];
                d.cx = cx;
                return cx;
            })
            .attr("cy", function (d) {
                let cy = projection([d.lat, d.long])[1];
                d.cy = cy;
                return cy;
            })
            .attr("fill", function (d) {
                // console.log(d);
                // return colour(d.unix);
                return "#EDCA3A"
            })
            .on('click', function (d, i) {
                // update elements

                d3.select("#textTitle")
                    .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                        "<span class='date'>Date : " + formatDate(parse4(d.Date)) + " </span> <br>" +
                        "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                    );

                // d3.select("#searchLink")
                //     .attr("href", "https://www.google.co.uk/search?tbm=isch&q=" + d.City_and_State + "+" + d.Description_from_Slide_Mount);


                d3.select("#dataImage")
                    .attr("src", d.Image_URL);
            });
    };

    pCube.hideLeafletMap = function (value) {

        d3.selectAll(".leaflet-pane .leaflet-tile-pane")
            .filter(function (d, i) {  //todo: point of hiding other map items
                return i !== 0;
            })
            .classed("hide", value)
    };

    pCube.setsDraw = function () {
        var duration = 1000;
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

                d.matrixAutoUpdate = true;
                d.updateMatrix();

                var rotate = new TWEEN.Tween(d.position)
                    .to({
                            y: interval * i - (interval + interval)
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

    pCube.overlappingNodes = function (value, properties) {
        var duration = 700;
        TWEEN.removeAll();
        // cleanup
        // pointSelectedLines.forEach(x => WGLScene.remove(x));
        pointSelectedLines.forEach(x => glbox.remove(x));
        pointSelectedLines = [];

        scene.getObjectByName("pointCloud").children.forEach(function (d) {

            d.matrixAutoUpdate = true;
            d.updateMatrix();
            // console.log(d);

            //radomise STC
            var unClusterPoints = new TWEEN.Tween(d.position)
                .to({
                    x: d.position.x += (getRandomInt(-value, value)),
                    z: d.position.z += (getRandomInt(-value, value))
                }, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();


            var elementPosition = {x: d.position.x, y: d.position.y, z: d.position.z};
            var elementDefault = {x: d.STC.position.x, y: d.STC.position.y, z: d.STC.position.z};
            // var elementDefault = {x: d.STC.position.x, y: -250, z: d.STC.position.z};


            // drawMeshLines(elementPosition,elementDefault)
        });

        //randomise JP
        d3.selectAll(".subunit_points").attr("cx", function (d) {
            let def = d.cx;
            return def += (getRandomInt(-value, value));
        }).attr("cy", function (d) {
            let def = d.cy;
            return def += (getRandomInt(-value, value));
        });

        // d3.selectAll(".subunit_points")._groups[0].forEach(function (d) {
        //     d3.selectAll(this).attr("cx", 100);
        // });

        // d3.selectAll("subunit_points");
    };

    pCube.nooverlappingNodes = function () {
        TWEEN.removeAll();
        let duration = 700;
        // cleanup
        // pointSelectedLines.forEach(x => WGLScene.remove(x));
        pointSelectedLines.forEach(x => glbox.remove(x));
        pointSelectedLines = [];

        scene.getObjectByName("pointCloud").children.forEach(function (d) {

            d.matrixAutoUpdate = true;
            d.updateMatrix();

            var clusterPoints = new TWEEN.Tween(d.position)
                .to({
                    x: d.STC.position.x,
                    z: d.STC.position.z
                }, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();
        });

        //reverse randomise JP
        d3.selectAll(".subunit_points").attr("cx", function (d) {
            // console.log(d);
            return d.cx;
        }).attr("cy", function (d) {
            return d.cy;
        });

    };

    function drawPointSelectedLines(elementPosition) {

        // cleanup
        // pointSelectedLines.forEach(x => WGLScene.remove(x));
        pointSelectedLines.forEach(x => glbox.remove(x));
        pointSelectedLines = [];

        const drawLine = (vec1, vec2) => {

            // var material = new THREE.LineBasicMaterial({
            //   color: 0x0000ff
            // });

            var material = new THREE.LineDashedMaterial({
                color: "#898989",
                linewidth: 10,
                scale: 1,
                dashSize: 1,
                gapSize: 1,
            });

            var geometry = new THREE.Geometry();
            geometry.name = "guidelines";

            geometry.vertices.push(
                vec1, vec2
            );
            // geometry.computeLineDistances();

            var line = new THREE.Line(geometry, material);

            //fix rotation - take rotation from pointcloud
            line.rotation.copy(pointCloud.rotation);

            pointSelectedLines.push(line);
            // WGLScene.add(line);
            glbox.add(line);
        };

        if(layout === "STC" || layout === "JP" ){
            drawLine(
                new THREE.Vector3(elementPosition.x, elementPosition.y, elementPosition.z),
                new THREE.Vector3(elementPosition.x, -250, elementPosition.z)
            );
        }

        // drawLine(
        //     new THREE.Vector3(elementPosition.x, elementPosition.y, elementPosition.z),
        //     new THREE.Vector3(250, elementPosition.y, -250)
        // );
    }

    function drawMeshLines(elementPosition, elementDefault) {

        // cleanup
        // pointSelectedLines.forEach(x => WGLScene.remove(x));
        // pointSelectedLines.forEach(x => glbox.remove(x));
        // pointSelectedLines = [];

        const drawLine = (vec1, vec2) => {

            // var material = new THREE.LineBasicMaterial({
            //   color: 0x0000ff
            // });

            // var material = new THREE.LineDashedMaterial({
            var material = new THREE.LineBasicMaterial({
                color: "#181818",
                linewidth: 2,
                scale: 1,
                // dashSize: 1,
                // gapSize: 1,
            });


            var geometry = new THREE.Geometry();
            geometry.name = "guidelines";

            geometry.vertices.push(
                vec1, vec2
            );
            geometry.computeLineDistances();

            var line = new THREE.Line(geometry, material);

            //fix rotation - take rotation from pointcloud
            line.rotation.copy(pointCloud.rotation);

            pointSelectedLines.push(line);
            // WGLScene.add(line);
            glbox.add(line);
        };

        //only draw when not on SI
        if (layout !== "SI") {
            drawLine(
                new THREE.Vector3(elementPosition.x, elementPosition.y, elementPosition.z),
                new THREE.Vector3(elementDefault.x, elementDefault.y, elementDefault.z)
            );
        }

    }


    /**
     * Translate function for the long and lat coordinates
     * @param point
     * @returns {*[]}
     * http://blog.mastermaps.com/2013/11/showing-gps-tracks-in-3d-with-threejs.html
     */

    function translate(point) {
        // return [point[0] - (width / 2), (height / 2) - point[1]];
        return [point[1] - (width / 2), (height / 2) - point[0]];
    }

    function hideGuide(show = false) {
        if (glbox.children) {
            glbox.children = []
        }
    }

    function getRandomInt(min, max) {
        return (Math.random() * (max - min + 1)) + min;
    }

    /**
     * 3D Scene Renderer
     *
     */
    var renderer, scene, camera, controls;
    var cube = new THREE.Object3D();
    cube.name = "cube";
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
        WGLRenderer,
        svgScene,
        svgRenderer;

    /**
     * Array cube rotation and position css3d matrix
     * @type {*[]}
     */
    var r = Math.PI / 2;
    var d = 250;
    var pos = [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]];
    var rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];


    // pointCloud.position.x = 0;
    // pointCloud.position.z = 0;


    window.polyCube = pCube;
}());
