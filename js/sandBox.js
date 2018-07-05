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
    var width = 1000,
        height = 1000,
        widthHalf = width / 2,
        heightHalf = height / 2;
    var svg;

    var formatTime = d3.timeFormat("%Y");

    var projectionScale = 5000;
    var firstPass = true;
    /**
     * Point of entry function to draw scene elements and inject data from map (), point cloud () and segements ()
     * @param datasets
     * @param datasets2
     */

    var dataSlices = 4;
    var segSlices = 16; //dynamic segment numbers
    var interval = height / dataSlices; //height/segments

    var timeLinearG;
    var layout;
    let elements;

    var segmentedData;
    let tempArr = [];
    let superTemporalMap = new Map();
    let superLayerPos;
    let superFlattenedLayer;

    let dataBySeg; //hold segment data for superimposition
    let colorList = [];

    let colour;
    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0) // d3 tooltip for inspecting single points
    //color scale
    var colorScale = d3.scaleOrdinal()
    // .domain(["New York", "San Francisco", "Austin"])
        .domain(colorList.unique())
        .range(["#FF0000", "#009933", "#0000FF", "#ffea3f", "#422ba1", "#671a34"]);

    pCube.fixedSetCoordinates = function (datasets) {

        let glHullbox = WGLScene.getObjectByName("glbox");
        // console.log(glHullbox);
        glHullbox.children.forEach((child) => {
            if (!superTemporalMap.has(child.name)) {
                superTemporalMap.set(child.name, {x: child.position.x, z: child.position.z})
            }
        });
        firstPass = false;
        pCube.drawElements(datasets);
        //  console.log(superTemporalMap);
    };

    //force directed sim
    let simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(widthHalf, heightHalf))
        .force('collision', d3.forceCollide().strength(1).radius(function (d, i) {
            let rad = d.values.length;
            return rad;
            // return i;
        }).iterations(2));

    pCube.drawElements = function (datasets) {
        // console.log(datasets);
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

            //get full date
            let full_date = d.time;

            d.time = +format2(d.time);

            //get unix
            d.unix = +(full_date / 1000).toFixed(0);


            //data segmentation
            /**
             * Group dataSets by intervals and sum of the intervals date range,
             * add a field to each data object representing the value of the range in y axis e.g jp:1, jp:2, jp:3
             * use d3.nest() to group all elements in dataSet by jp suing example from the link below
             * https://proquestionasker.github.io/blog/d3Nest/
             * pass grouped data to elements d3 function and draw them on maps individually
             */

            var jp1 = 1942, jp2 = 1946, jp3 = 1950, jp4 = 1955;

            if (d.time < jp1) {
                d.ts = "jp1";
                d.label = jp1;
            }

            if (d.time > jp1 && d.time <= jp2) {
                d.ts = "jp2";
                d.label = jp2;
            }

            if (d.time > jp2 && d.time <= jp3) {
                d.ts = "jp3";
                d.label = jp3;
            }

            if (d.time > jp3 && d.time <= jp4) {
                d.ts = "jp4";
                d.label = jp4;
            }

            if (d.time > jp4) {
                d.ts = "jp5";
                d.label = "> 1955";
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

        let dateUnixEx = d3.extent(datasets, function (d) {
            return d.unix;
        });


        var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);

        let timeLinearUnix = d3.scaleLinear().domain(dateUnixEx).range([-heightHalf, heightHalf]);


        timeLinearG = timeLinear;

        //export date years min and max to windows
        window.dateTimeEx = dateTestEx;
        window.dateUnixEx = dateUnixEx;

        /**
         * Color scale from unix time for temporal encoding
         */
        var colorRange = ['#422ba1', '#F6F6F4'];

        colour =
            d3.scaleSequential(d3.interpolateViridis)
            // d3.scaleLinear().range(colorRange)
            // colour = d3.scaleSequential(d3.interpolateRainbow)
            .domain(dateUnixEx);

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
        // WGLRenderer.setClearColor(0x00ff00, 0.0);
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
        // glbox.position.copy(cube.position);
        // glbox.rotation.copy(cube.rotation);
        //

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
        camera.position.set(600, 400, 1800);

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
        WGLScene.add(groupSets);
        WGLScene.add(hullGroup);
        /**
         * Lights
         *
         */

        var light = new THREE.PointLight(0xffffff);
        WGLScene.add(light);

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
         * D3.nest to segment each data by its temporal ts property
         * sort data by jp1
         */
        dataBySeg = d3.nest()
            .key(function (d) {
                return d.ts;
                // return d.Genre_1;
            })
            .key(function (d) {
                return d.Genre_1;
            })
            .entries(datasets)
            .sort(function (a, b) {
                return a.key == b.key ? 0 : +(a.key > b.key) || -1;
            });

        //
        // let dataCount = d3.nest()
        //     .key(function (d) {
        //         return d.Genre_1
        //     }).entries(datasets).sort(function (a, b) {
        //         return a.key > b.key;
        //     });
        // console.log(dataCount);

        /**
         * convert category data into a time and group hierarchy
         */
        let segDataGroups = d3.nest()
            .key(function (d) { //temporal distribution
                return timeRage(d.time, dateTestEx[0], dateTestEx[1], segSlices);
            })
            .key(function (d) {
                return d.Genre_1;
            }) //group sets distribution
            .entries(datasets)
            .sort(function (a, b) {
                return a.key == b.key ? 0 : +(a.key > b.key) || -1;
            });

        // .sort(function (a, b) {
        //     return a.key < b.key;
        // });

        // console.log(segDataGroups);

        // /**
        //  * push segmented data to global variable
        //  * @type {any}
        //  */
        // segmentedData = dataBySeg;

        // console.log(segDataGroups);

        /**
         *Create Div holders for the segments
         * main Element Div (Create new segments holders from here)
         *Currently using todo: datasets1 should be changed to datasets2
         */
        elements = d3.select("body").selectAll('.element')
            .data(dataBySeg)//automate the use of slices
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
            .append("g");

        /**
         * Objectify and draw segments elements
         */
        elements.each(addtoScene);

        /**
         * Push pc data to scene
         */
        let newList = [];
        let originalPositions = [];
        let allGroups = [];

        let firstSlice = null;
        // .range(d3.schemePaired);

        // let simulation =

        pCube.updatePC = function (segDataGroups) {

            //clear all pc on the scene
            //clear all d3 elements in DOM
            //clean up labels

            pointCloud.children = [];
            glbox.children = [];
            groupSets.children = [];
            hullGroup.children = [];
            allGroups = new Array();
            d3.selectAll('.pointCloud').remove();
            d3.selectAll('.set-label').classed('hide', true);

            let interval = height / segSlices;//new interval
            // let interval = height / dataSlices;//new interval


            //Data Point Cloud Draw
            var PC2Elem = d3.selectAll('.pointCloud')
                .data(segDataGroups).enter()
                .each(function (data, i) { //time layers :ral
                    simulation.nodes(data.values);

                    // push first set of largest array layers position to the origposition to be used by the rest of the cube
                    // let maxArray = segDataGroups.map(function (a) {
                    //     return a.values.length;
                    // }).indexOf(Math.max.apply(Math, segDataGroups.map(function (a) {
                    //     return a.values.length;
                    // })));
                    //
                    // maxArray = segDataGroups[maxArray].values;
                    //
                    // if (i === 0) {
                    //     // console.log(maxArray);
                    //     originalPositions.push(maxArray);
                    // }

                    data.values.forEach(function (data) { // data groups :ral
                        colorList.push(data.key);
                        allGroups.push(data);

                        //circle geometry
                        const rad = data.values.length;//ral: size of the big circles
                        const geometry = new THREE.CircleGeometry(rad, 32);//hull resolution
                        const material = new THREE.MeshBasicMaterial({
                            color: '#797979',
                            // color: colorScale(data.key),
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.7
                        });
                        const circle = new THREE.Mesh(geometry, material);

                        circle.matrixWorldNeedsUpdate = true;
                        circle.name = data.key;
                        circle.rotation.x = Math.PI / 2;
                        circle.groupName = "CircleGroup";

                        //apply force layout
                        circle.position.x = data.y * getRadScale(7);
                        circle.position.z = data.x * getRadScale(7);

                        // circle.position.y = (interval * i) - interval - interval;
                        circle.position.y = (interval * i) - heightHalf;
                        // circle.position.y = (interval * i);
                        // circle.position.y = (interval * i < 0) ? (interval * i) - heightHalf :(interval * i) + heightHalf;
                        // let value = (((interval * i) - heightHalf) === 0) ? (interval * i) + heightHalf : (interval * i) - heightHalf;
                        // console.log((interval * i) - heightHalf);

                        circle.updateMatrixWorld();

                        glbox.add(circle);

                        //create group and add the points
                        const group = new THREE.Group();
                        group.name = data.key;
                        group.position.copy(circle.position);
                        group.radius = circle.geometry.parameters.radius;
                        group.matrixWorldNeedsUpdate = true;
                        group.updateMatrixWorld();

                        // hullGroup.add(group); //store group positions
                        groupSets.add(circle); //add sets position

                        let newData = createSpiralLayout(group.position.x, group.position.z, group.radius, data.values);

                        newData.forEach(function (d) { //points

                            // console.log(d);

                            var image = document.createElement('div');
                            var min = -50;
                            image.style.width = 8 + "px";
                            image.style.height = 8 + "px";
                            image.className = "pointCloud";
                            const stc = new THREE.Object3D();

                            var object = new THREE.CSS3DSprite(image);

                            // const objPos = randomSpherePoint(group.position.x, group.position.y, group.position.z, group.radius, d.Genre_1);
                            // console.log(randomSpherePoint(group.position.x,group.position.y,group.position.z, group.radius));
                            object.position.x = d.x;
                            object.position.y = group.position.y;
                            object.position.z = d.y;


                            object.name = "pointCloud"; //todo: remove later

                            // object.element.onclick = function () {
                            object.element.onmouseover = function ($event) {

                                //clean point hull data
                                // console.log(hullGroup)
                                tooltip.transition()
                                    .duration(200)
                                    .style("opacity", .9);
                                tooltip	.html(`${d.data.time}<br/>${d.data.Genre_1}`)
                                    .style("left", ($event.x) + "px")
                                    .style("top", ($event.y - 28) + "px");
                                  // console.log(d.Genre_1);
                                d3.select("#textTitle")
                                    .html("<strong<p>" + d.data.Description_from_Slide_Mount + "</p>" +
                                        "<span class='date'>Group : " + d.data.Genre_1 + " </span> <br>" +
                                        "<span class='location'>Date : " + d.data.time + "</span> <br>"
                                        // "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                                    );
                                d3.select("#dataImage")
                                    .attr("src", d.data.Image_URL);
                            };
                            object.element.onmouseout = function () {
                                tooltip.transition()
                                    .duration(500)
                                    .style("opacity", 0);
                            };
                            object.element.ondblclick = (() => {

                                polyCube.drawHull(d.data.Genre_1); //draw each group on click
                            });

                            object["newData"] = d;
                            stc.position.x = object.position.x;
                            stc.position.y = object.position.y; // for unix
                            stc.position.z = object.position.z;
                            object['STC'] = stc;

                            //add object to group
                            group.add(object);

                            lineList.push(object.position);

                            //onlick object

                            /**
                             * Add point clouds to pointCloud object created not scene so we can modify and display its rotation and position
                             */
                            pointCloud.add(object);
                        })

                        // data.values.forEach(function (d) { //points
                        //     var image = document.createElement('div');
                        //     var min = -50;
                        //     image.style.width = 8 + "px";
                        //     image.style.height = 8 + "px";
                        //     image.className = "pointCloud";
                        //     const stc = new THREE.Object3D();
                        //
                        //     var object = new THREE.CSS3DSprite(image);
                        //     // var object = new THREE.CSS3DObject(image);
                        //     // object.position.y = timeLinear(d.time); //for unix date
                        //     // object.position.y = (interval * i) - interval - interval; //todo: height + scale + time to determine y axis
                        //     // object.position.z = Math.random() * (data.values.length / 3 - (-90)) + (-90);
                        //     // object.position.x = Math.random() * (data.values.length / 3 - (min)) + (min);
                        //
                        //     const objPos = randomSpherePoint(group.position.x, group.position.y, group.position.z, group.radius, d.Genre_1);
                        //     // console.log(randomSpherePoint(group.position.x,group.position.y,group.position.z, group.radius));
                        //     object.position.x = objPos[0];
                        //     object.position.y = objPos[1];
                        //     // object.position.y = timeLinearUnix(d.unix);
                        //     // object.position.y = timeLinear(d.time);
                        //     object.position.z = objPos[2];
                        //
                        //     // console.log(d);
                        //
                        //     object.name = "pointCloud"; //todo: remove later
                        //
                        //     // object.element.onclick = function () {
                        //     object.element.onmouseover = function () {
                        //
                        //         //clean point hull data
                        //         // console.log(hullGroup)
                        //
                        //         // console.log(d.Genre_1);
                        //         d3.select("#textTitle")
                        //             .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                        //                 "<span class='date'>Group : " + d.Genre_1 + " </span> <br>" +
                        //                 "<span class='location'>Date : " + d.time + "</span> <br>"
                        //                 // "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                        //             );
                        //         d3.select("#dataImage")
                        //             .attr("src", d.Image_URL);
                        //     };
                        //
                        //     object.element.ondblclick = (() => {
                        //         console.log(d);
                        //
                        //         polyCube.drawHull(d.Genre_1); //draw each group on click
                        //     });
                        //
                        //     object["newData"] = d;
                        //     stc.position.x = object.position.x;
                        //     stc.position.y = object.position.y; // for unix
                        //     stc.position.z = object.position.z;
                        //     object['STC'] = stc;
                        //
                        //     //add object to group
                        //     group.add(object);
                        //
                        //     lineList.push(object.position);
                        //
                        //     //onlick object
                        //
                        //     /**
                        //      * Add point clouds to pointCloud object created not scene so we can modify and display its rotation and position
                        //      */
                        //     pointCloud.add(object);
                        // })
                    });

                });
            // getSuperLayer(allGroups);

        };
        pCube.updatePC(segDataGroups);
        // pCube.updateScene = function () {
        //     let duration = 700;
        //     // redraw solutions
        //     segDataGroups.forEach(data => {
        //         //update testdata with new cordinates
        //         // console.log(data);
        //         data.values.forEach(data => {
        //             let key = data;
        //
        //             originalPositions[0].forEach(function (data) {
        //                 if (key.key === data.key) {
        //                     // console.log(data.x);
        //                     // console.log(key.key);
        //                     key.x = data.x;
        //                     key.y = data.y;
        //                 }
        //                 // console.log(data.key);
        //                 // console.log(key.key)
        //             });
        //
        //
        //         });
        //     });
        //     pCube.updatePC(segDataGroups);
        // };
        // pCube.updateScene();


        //super layer test
        pCube.updateSupelayer = function (layout = 'circle', ordering = 'ascending') {
            superLayerPos = getSuperLayer(allGroups); //original position from the superlayer
            superFlattenedLayer = getFlattenedLayer(allGroups); //flattened combined layers of all sets

            if (layout === 'force') {
                /* Forced Layout */
                 createForcedLayout(superLayerPos, widthHalf, heightHalf);
            } else if (layout === 'diagonal') {
                /* Forced DiagonalLinear */
                superLayerPos = createDiagonalLayout(superFlattenedLayer, superLayerPos);
            } else if (layout === 'circle') {
                /* Forced Circular */
                createCircularLayout(superLayerPos);
            }
            else if (layout === 'matrix') {
                /* Forced Circular */
                let order = ordering === 'ascending' ? true : false;
                createMatrixLayout(superLayerPos, order);
            }

            let params = {fontsize: 32, fontface: "Georgia", borderColor: {r: 0, g: 0, b: 255, a: 1.0}};
            for (var i = 0; i < superLayerPos.length; i++) {
                let label = createNewSpriteLabel(superLayerPos[i].key, params);
                mesh.add(label);
                label.position.set(superLayerPos[i].y * getRadScale(7), heightHalf + 20, superLayerPos[i].x * getRadScale(7));
            }

            segDataGroups.forEach(data => {
                // console.log(data);
                data.values.forEach(data => {
                    let key = data;
                    superLayerPos.forEach(data => { //todo: fix array length issues
                        if (key.key === data.key) {
                            key.x = data.x;
                            key.y = data.y;
                        }
                    });
                });
            });

            pCube.updatePC(segDataGroups);
        };
        pCube.updateSupelayer();

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

            var startDate = parameters["startDate"] || dateTestEx[1].toString();
            var endDate = parameters["endDate"] || dateTestEx[0].toString();

            // console.log(startDate);
            // console.log(endDate);

            var dateArray = d3.scaleTime()
                .domain([new Date(endDate), new Date(startDate)])
                .ticks(dataSlices);

            // var dateARR = d3.scaleTime().domain([new Date(startDate), new Date(endDate)]);
            // console.log(segDataGroups);
            // console.log(dateArray);

            // var separator = height / dateArray.length;
            var separator = height / dataSlices;
            var p = parameters["labelPosition"] || {
                x: -80,//offset border
                y: 0,
                z: 100
            };

            // console.log(dateArray);

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
                let label = makeTextSprite(formatTime(d), {fontsize: 20});
                label.position.set(p.x, p.y+interval, p.z);
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

                // var object = new THREE.CSS3DObject(element);
                var object = new THREE.CSS3DSprite(element);
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
        layout = "STC";
    };

    function createPoint(a) {
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3(a.x, a.y, a.z));
        var dotMaterial = new THREE.PointsMaterial({size: 10, sizeAttenuation: true});
        var dot = new THREE.Points(dotGeometry, dotMaterial);
        glbox.add(dot);
    };

    function addtoScene(d, i) {

        // let interval = height / dataSlices;//new interval

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

    pCube.onWindowResize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        WGLRenderer.setSize(window.innerWidth, window.innerHeight);
        pCube.render()
    };

    pCube.animate = function () {
        requestAnimationFrame(pCube.animate);
        TWEEN.update();
        controls.update();
        pCube.render()
    };

    /**
     * Juxtaposition function
     *
     */
    pCube.juxstaPose = function () { //todo: RAL
        var duration = 2500;
        // clean func
        TWEEN.removeAll();
        WGLScene.getObjectByName("glbox").visible = false;
        // hide groups
        d3.selectAll(".circle_elements")
            .classed("hide", false);
        /**
         * Hide SegLable
         */
        d3.selectAll(".segLabel")
            .classed("hide", false);

        d3.selectAll(".set-label")
            .classed("hide", true);

        //hide labels and circles
        //show glbox
        WGLScene.getObjectByName("groupSets").visible = false;
        hullGroup.visible = false;

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

        // animate the layers to new position
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

        //group layout

        //select all segment layers
        //append layers to the group

        let segmentLayers = elements.selectAll('svg');
        let offSetCounter = 0;
        let groupofLabelGroups = new THREE.Group();
        segmentLayers.each(function (d) {
            //console.log(d);
            // let elm = this;
            let elm = d3.select(this)
                .append('g');
            let labelGroup = new THREE.Group();
            d.values.forEach(function (data) {

                // console.log(data);
                // console.log(superLayerPos);

                let key = data;

                superLayerPos.forEach(data => { //todo: fix array length issues

                    // let layers =  d3.select(elm)
                    //      .append('g');

                    if (key.key === data.key) {
                        let label = createNewSpriteLabel(data.key);
                        label.position.set((data.x * 15) + offSetCounter * 1000, (-data.y * 15) - 100, 0);
                        labelGroup.add(label);
                        // console.log(key.values[0].unix);
                        elm.append("text")
                            .text(function (d) {
                                switch(d.values[0].values[0].label) {
                                  case 1942:
                                    return '1938-1942';
                                  case 1946:
                                    return '1943-1946';
                                  case 1950:
                                    return '1947-1950';
                                  case 1955:
                                    return '1951-1955';
                                  default:
                                    return '1956-1969';
                                }
                                //return d.values[0].values[0].label ? d.values[0].values[0].label : '1955+';
                            })
                            .style("font-size", '100px')
                            .style("fill", '#dcdcdc')
                            .style("stroke", '#dcdcdc')
                            .style("transform", 'translateY(100px)');
                        elm.append("circle")
                            .attr("cx", function (d, i) {
                                key.x = (data.x * 15) + widthHalf;
                                return key.x;
                            })
                            .attr("cy", function (d, i) {
                                key.y = (data.y * 15) + heightHalf;
                                return key.y;
                            })
                            .attr("r", function (d, i) {
                                return key.values.length / 1.7;
                            })
                            // .attr("fill", colorScale(key.key))
                            .attr("fill", '#dcdcdc')
                            .each(function (d) {
                                let circle = d3.select(this).append('g');
                                // let cx = circle.attr('cx')
                                let cx = (data.x * 15) + widthHalf;
                                let cy = (data.y * 15) + heightHalf;
                                let rad = key.values.length / 1.7;

                                //spiral layout
                                // createSpiralLayout(cx,cy,rad,key.values);
                                let newData = createSpiralLayout(cx, cy, rad, key.values);
                                newData.forEach(function (d) {
                                    // console.log(d.data.unix);
                                    elm.append("circle")
                                        .attr("cx", function () {
                                            return d.x;
                                            // return randomSpherePoint(cx,cy,0,rad)[0];
                                        })
                                        .attr("cy", function () {
                                            return d.y;
                                            // return randomSpherePoint(cx,cy,0,rad)[1];
                                        })
                                        .attr("r", function () {
                                            return 3;
                                        })
                                        // .attr("fill", '#c83409')
                                        .attr("fill", function() {
                                          let assignedColor = colour(d.data.unix);
                                          //console.log(new Date(d.data.unix*1000).getFullYear() +   '%c ' + assignedColor, 'background-color: ' + assignedColor + '; color: #fff');
                                          return assignedColor;
                                        })
                                })

                                //
                                // key.values.forEach(d =>{
                                //
                                //     elm.append("circle")
                                //         .attr("cx", function (d, i) {
                                //             return cx;
                                //             // return randomSpherePoint(cx,cy,0,rad)[0];
                                //         })
                                //         .attr("cy", function (d, i) {
                                //             return cy;
                                //             // return randomSpherePoint(cx,cy,0,rad)[1];
                                //         })
                                //         .attr("r", function (d, i) {
                                //             return 5;
                                //         })
                                //         .attr("fill", 'blue')
                                // })
                            });

                    }
                });

            });
            offSetCounter++;
            groupofLabelGroups.add(labelGroup);
            //append circle from values to each element
        });

        let gap = 100;
        groupofLabelGroups.children.forEach((labelGroup, i) => {
            if (i !== 0) {
                labelGroup.children.forEach(label => {
                    label.translateX(gap);
                });
                gap += 50;
            }
        });
        groupofLabelGroups.translateX(-1000);
        setTimeout(function () {
            scene.add(groupofLabelGroups);
        }, 2750);
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

        // pCube.juxstaPose_functions.forEach(f => f.call(pCube, duration, width, height));
    };

    /**
     * Default STC Layout Fallback function
     *
     */
    pCube.default = function (callbackFuntion) {
        var segments = dataSlices;
        var interval = height / segments; //height/segments

        var duration = 2500;
        TWEEN.removeAll();


        /**Clean func section
         * group points
         */
        // hide groups
        d3.selectAll(".circle_elements")
            .classed("hide", true);

        //show glbox
        WGLScene.getObjectByName("glbox").visible = true;
        hullGroup.visible = true;

        /**
         * show all time panels
         */
        d3.selectAll(".textTitle")
            .classed("hide", false);

        d3.selectAll(".set-label")
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


        var segCounter = 0; //keep list of the segment counters

        /**
         * Point Cloud reverse flattening
         */
        scene.getObjectByName("pointCloud").children.forEach(function (d) {

            //update points color
            d.element.style.backgroundColor = "#c83409";

            var unFlattenPoints = new TWEEN.Tween(d.position)
                .to({
                    y: d.STC.position.y,
                    x: d.STC.position.x,
                    z: d.STC.position.z
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

        /**
         * animate camera position
         */
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


        /**
         * Reverse Sets hiding
         * show hull
         */
        WGLScene.getObjectByName("groupSets").visible = true;
        WGLScene.getObjectByName("hullGroup").visible = true;

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

        let  duration = 700;
        let pointClouds = scene.getObjectByName("pointCloud").children;


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
        pointClouds.forEach(function (d) {

            // console.log(d.newData);

            // colour(d.newData.data.unix);
            d.element.style.backgroundColor = colour(d.newData.data.unix);

            // update matrix true on entry
            d.matrixAutoUpdate = true;
            d.updateMatrix();

            //flatten points time
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

        /**
         * Super Layout Distribution
         */
        let segDataByGenre = d3.nest()
            .key(function (d) {
                // console.log(d.newData.data.Genre_1);
                return d.newData.data.Genre_1;
            }) //group sets distribution
            .entries(pointClouds);

        // console.log(superLayerPos);

        segDataByGenre.forEach(function (points) {
            superLayerPos.forEach(layer => {
                if (points.key === layer.key) {
                    // points.x = layer.x;
                    // points.y = layer.y;

                    let centerX = layer.x * 27,
                        centerY = layer.y * 27,
                        rad = points.values.length/3;

                    let newLayout = createSpiralLayout(centerX,centerY,rad, points.values);
                    console.log(newLayout);

                    newLayout.forEach(function (d) {
                        let threePoint = d.data;

                        threePoint.position.z = d.x;
                        threePoint.position.x = d.y;

                        // var unFlattenPoints = new TWEEN.Tween(threePoint.position)
                        //     .to({
                        //         x: d.x,
                        //         z: d.y
                        //     }, duration)
                        //     .easing(TWEEN.Easing.Sinusoidal.InOut)
                        //     .start();

                        // console.log(threePoint)

                    })
                }
            });

        });

        /**
         * Sets flattening
         * hide sets
         * hide hull
         */
        let sets = WGLScene.getObjectByName("groupSets");
        sets.visible = false;

        WGLScene.getObjectByName("hullGroup").visible = false;

        // console.log(superFlattenedLayer);

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

    //hull implementation
    let pointsHullArray = [];


    pCube.drawLines = function () {
        lineList = pointsHullArray;
        // console.log(pointsHullArray);

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
    pCube.drawLines_old = function () {
        console.log(lineList);

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
    pCube.create3DShape = function () {

        //get data
        let glHullbox = WGLScene.getObjectByName("glbox");
        glHullbox.children.forEach(d => {
            if (d.name === "Identification photographs") {
                let object = d.getObjectByName("Identification photographs");
                //add geometry points to points vertices
                var array_aux = [];
                object.geometry.vertices.forEach((d) => {
                    pointsHullArray.push(d); //add every vertices into points geometry
                    array_aux.push(object.localToWorld(d));
                });
                tempArr.push(array_aux);
            }
        });


        //draw shape
        console.log(tempArr[0]);
        for (let i = 0; i < tempArr.length - 1; i++) { // array of arrays
            let a = tempArr[i];
            let b = tempArr[i + 1];
            for (let j = 1; j < a.length; j++) { // item @ idx 0 is the center; array of vertices
                let firstAVertex = a[j];
                let tempY = firstAVertex.y;
                let tempZ = firstAVertex.z;
                firstAVertex.y = tempZ;
                firstAVertex.z = tempY;

                // firstAVertex.z = firstAVertex.y;
                // firstAVertex.y = (interval * i) - interval - interval;
                let secondAVertex = a[j + 1 % a.length];
                tempY = secondAVertex.y;
                tempZ = secondAVertex.z;
                secondAVertex.y = tempZ;
                secondAVertex.z = tempY;
                // secondAVertex.z = secondAVertex.y;
                // secondAVertex.y = (interval * i) - interval - interval;
                let firstBVertex = b[j % a.length];
                tempY = firstBVertex.y;
                tempZ = firstBVertex.z;
                firstBVertex.y = tempZ;
                firstBVertex.z = tempY;
                // firstBVertex.z = firstBVertex.y;
                // firstBVertex.y = (interval * (i+1)) - interval - interval;
                let secondBVertex = b[j + 1 % a.length];
                tempY = secondBVertex.y;
                tempZ = secondBVertex.z;
                secondBVertex.y = tempZ;
                secondBVertex.z = tempY;
                // secondBVertex.z = secondBVertex.y;
                // secondBVertex.y = (interval * (i+1)) - interval - interval;
                createPoint(firstAVertex);
                //createRectangle(firstAVertex, secondAVertex, firstBVertex, secondBVertex);
            }
            // HANDLE LAST IDX TO FIRST
        }
    };

    //hull implementation
    pCube.drawHull = function (group = "Identification photographs") {

        //clean func
        tempArr = [];
        //get hall data
        let count = 0;

        groupSets.children.forEach(d => {
            // console.log(d.name);
            // console.log(group);
            if (d.name === group) {
                let object = d.getObjectByName(group);
                // console.log(object);

                //add geometry points to points vertices
                var array_aux = [];
                object.geometry.vertices.forEach((d) => {
                    // pointsHullArray.push(d); //add every vertices into points geometry
                    array_aux.push(object.localToWorld(d));
                });
                tempArr.push(array_aux);
                count++;
            }
        });

        tempArr.forEach((d, i) => {
            let meshData;

            if (i !== tempArr.length - 1) { //if to deal with last component structure
                meshData = tempArr[i].concat(tempArr[i + 1]);
                addMeshToScene(meshData)
            } else { //to show the cone ontop of the structure
                // meshData = tempArr[i].concat(new THREE.Vector3(tempArr[i][0].x, (heightHalf / 1.5), tempArr[i][0].z));
                // addMeshToScene(meshData);
                // console.log(tempArr[i][0].x);
                // console.log(tempArr[i]);
            }
        });

        function addMeshToScene(d) {
            //Advanced 3d convex geo
            // view-source:https://cs.wellesley.edu/~cs307/threejs/dirksen/chapter-06/01-advanced-3d-geometries-convex.html
            // use the same points to create a convexgeometry

            // var meshMaterial = new THREE.MeshBasicMaterial({color: 0xffffdd, transparent: true, opacity: 0.3});
            var meshMaterial = new THREE.MeshBasicMaterial({color: '#2347ff', transparent: true, opacity: 0.3});
            meshMaterial.side = THREE.DoubleSide;
            var wireFrameMat = new THREE.MeshBasicMaterial({color: '#a2a2a2', transparent: true, opacity: 0.3});
            wireFrameMat.wireframe = true;

            let hullGeometry = new THREE.ConvexGeometry(d);
            // var material = new THREE.MeshBasicMaterial( { wireframe: true } );
            let hullMesh = new THREE.Mesh(hullGeometry, [wireFrameMat]);
            // let hullMesh = new THREE.Mesh( hullGeometry, [meshMaterial, wireFrameMat] );
            hullGroup.add(hullMesh); // add to group hull
            // glbox.add(hullMesh);
        }
    };
    pCube.drawCompleteHull = function () {
        hullGroup.children = [];
        hullGroup.visible = true;
        superLayerPos.forEach(function (d) {
            pCube.drawHull(d.key)
        })
    };

    pCube.hideAllHull = function () {
        hullGroup.visible = false;
        // console.log(hullGroup);
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
                            y: interval
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

    let hullGroup = new THREE.Object3D(); //hold hullbox as a group content
    hullGroup.name = 'hullGroup';

    var groupSets = new THREE.Object3D();
    groupSets.name = "groupSets";

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
