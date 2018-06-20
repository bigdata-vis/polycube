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

    var segmentedData;
    let tempArr = [];
    let superTemporalMap = new Map();


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
        }).iterations(2))

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

        let dateUnixEx = d3.extent(datasets, function (d) {
            return d.unix;
        });


        var timeLinear = d3.scaleLinear().domain(dateTestEx).range([-heightHalf, heightHalf]);

        let timeLinearUnix = d3.scaleLinear().domain(dateUnixEx).range([-heightHalf, heightHalf]);


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
        var dataBySeg = d3.nest()
            .key(function (d) {
                return d.ts;
                // return d.Genre_1;
            })
            .entries(datasets).sort(function (a, b) {
                return a.key > b.key;
            });

        /**
         * convert category data into a time and group hierarchy
         */
        let segDataGroups = d3.nest()
            .key(function (d) { //temporal distribution
                // console.log(d);
                // console.log(timeRage(d.time,dateTestEx[0],dateTestEx[1],12));
                // return d.ts;
                return timeRage(d.time, dateTestEx[0], dateTestEx[1], segSlices);
            })
            .key(function (d) {
                return d.Genre_1;
            }) //group sets distribution
            .entries(datasets).sort(function (a, b) {
                return a.key > b.key;
            });

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
        var elements = d3.select("body").selectAll('.element')
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
        let colorList = [];
        let originalPositions = [];
        let allGroups = [];

        let firstSlice = null;
        //color scale
        var colorScale = d3.scaleOrdinal()
        // .domain(["New York", "San Francisco", "Austin"])
            .domain(colorList.unique())
            .range(["#FF0000", "#009933", "#0000FF", "#ffea3f", "#422ba1", "#671a34"]);
        // .range(d3.schemePaired);

        // let simulation =

        pCube.updatePC = function (segDataGroups) {

            //clear all pc on the scene
            //clear all d3 elements in DOM
            //clean up labels

            pointCloud.children = [];
            glbox.children = [];
            d3.selectAll('.pointCloud').remove();

            interval = height / segSlices;//new interval


            // var myPack = d3.pack()
            //     .size([500, 500])
            //     .padding(3);

            // simulation.nodes(segDataGroups);

            //Data Point Cloud Draw
            var PC2Elem = d3.selectAll('.pointCloud')
                .data(segDataGroups).enter()
                .each(function (data, i) { //time layers :ral
                    simulation.nodes(data.values);
                    //console.log("data.values: ");
                    //console.log(data.values);

                    // console.log(data)
                    //node sim test
                    // let nodes = d3.hierarchy({children: data.values})
                    //     .sum(function (d) {
                    //         let size = d.length;
                    //         return size;
                    //     });
                    // nodes = myPack(nodes);
                    // console.log(nodes);
                    // let nodeData = nodes.children;
                    // //node sim test
                    // nodeData.forEach(function (d) {
                    //     console.log(d)
                    // });

                    // // push first set of largest array layers position to the origposition to be used by the rest of the cube
                    // let maxArray = segDataGroups.map(function (a) {
                    //     return a.values.length;
                    // }).indexOf(Math.max.apply(Math, segDataGroups.map(function (a) {
                    //     return a.values.length;
                    // })));
                    //
                    // maxArray = segDataGroups[maxArray].values;
                    //
                    // if (i === 0) {
                    //     console.log(maxArray);
                    //     originalPositions.push(maxArray);
                    // }

                    data.values.forEach(function (data) { // data groups :ral
                        colorList.push(data.key);

                        allGroups.push(data);

                        //circle geometry
                        const rad = data.values.length;//ral: size of the big circles
                        const geometry = new THREE.CircleGeometry(rad, 32);//hull resolution
                        const material = new THREE.MeshBasicMaterial({
                            color: colorScale(data.key),
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

                        // console.log((height/segSlices * i) - heightHalf);

                        // console.log((interval * i) - heightHalf);

                        // circle.position.y = (interval * i) - interval - interval;
                        circle.position.y = (interval * i) - heightHalf;

                        circle.updateMatrixWorld();
                        glbox.add(circle);

                        //create group and add the points
                        const group = new THREE.Group();
                        group.name = data.key;
                        group.position.copy(circle.position);
                        group.radius = circle.geometry.parameters.radius;
                        group.matrixWorldNeedsUpdate = true;
                        group.updateMatrixWorld();

                        data.values.forEach(function (d) { //points

                            var image = document.createElement('div');
                            var min = -50;
                            image.style.width = 10 + "px";
                            image.style.height = 10 + "px";
                            image.className = "pointCloud";
                            const stc = new THREE.Object3D();

                            var object = new THREE.CSS3DSprite(image);
                            // object.position.y = timeLinear(d.time); //for unix date
                            // object.position.y = (interval * i) - interval - interval; //todo: height + scale + time to determine y axis
                            // object.position.z = Math.random() * (data.values.length / 3 - (-90)) + (-90);
                            // object.position.x = Math.random() * (data.values.length / 3 - (min)) + (min);

                            const objPos = randomSpherePoint(group.position.x, group.position.y, group.position.z, group.radius);
                            // console.log(randomSpherePoint(group.position.x,group.position.y,group.position.z, group.radius));
                            object.position.x = objPos[0];
                            object.position.y = objPos[1];
                            // object.position.y = timeLinearUnix(d.unix);
                            // object.position.y = timeLinear(d.time);
                            object.position.z = objPos[2];

                            // console.log(d);

                            object.name = "pointCloud"; //todo: remove later

                            // object.element.onclick = function () {
                            object.element.onmouseover = function () {

                                //clean point hull data
                                // console.log(hullGroup)

                                // console.log(d.Genre_1);
                                d3.select("#textTitle")
                                    .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                                        "<span class='date'>Group : " + d.Genre_1 + " </span> <br>" +
                                        "<span class='location'>Date : " + d.time + "</span> <br>"
                                        // "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
                                    );
                                d3.select("#dataImage")
                                    .attr("src", d.Image_URL);
                            };


                            object.element.ondblclick = (() => {
                                polyCube.drawHull(d.Genre_1); //draw each group on click
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
        pCube.updateSupelayer = function () {
            let superLayerPos = getSuperLayer(allGroups); //original position from the superlayer
            
            /* Forced Layout */
            //createForcedLayout(superLayerPos,widthHalf, heightHalf);
            /* Forced DiagonalLinear */
            createDiagonalLayout(superLayerPos);
            /* Forced Circular */
            // createCircularLayout(superLayerPos);


            let duration = 700;
            
            
            // console.log("##### superlayerpos:");
            console.log(superLayerPos);
            // console.log("##### segDataGroups:");
            // console.log(segDataGroups);


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
// >>>>>>> 8bf6ede30b47c6da1ef2f453a22ebf77516b1b47
                });
            });

            // console.log(segDataGroups);

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
        layout = "STC";
    };

    function createPoint(a) {
        console.log('creating point');
        console.log(a);
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3(a.x, a.y, a.z));
        var dotMaterial = new THREE.PointsMaterial({size: 10, sizeAttenuation: true});
        var dot = new THREE.Points(dotGeometry, dotMaterial);
        glbox.add(dot);
    };

    function createRectangle(a, b, c, d) {
        let geometry = new THREE.BufferGeometry();
        let vertices = new Float32Array([
            a.x, a.y, a.z,
            b.x, b.y, b.z,
            c.x, c.y, c.z,

            b.x, b.y, b.z,
            c.x, c.y, c.z,
            d.x, d.y, d.z
        ]);
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        let material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, opacity: 0.5});
        let mesh = new THREE.Mesh(geometry, material);
        glbox.add(mesh);
        console.log('mesh added');
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

        // console.log((i * interval) - height / 2)
        // console.log((i * interval) - height / 2)
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
        // hideGuide();


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


        // console.log(scene);

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

        pCube.juxstaPose_functions.forEach(f => f.call(pCube, duration, width, height));
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
        let glHullbox = WGLScene.getObjectByName("glbox");
        let count = 0;
        glHullbox.children.forEach(d => {

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
            //deal with first component structure
            // if (i < 1) {
            //     meshData = [new THREE.Vector3(tempArr[0][0].x, -(heightHalf + 10), tempArr[0][0].z)].concat(tempArr[0]);
            //     addMeshToScene(meshData);
            //     // console.log(meshData)
            // }

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

        // for(let z = 0; z < tempArr.length; z++){
        //     if(z < tempArr.length){
        //         let meshData = tempArr[z].concat(tempArr[z+1]);
        //         addMeshToScene(meshData)
        //     }
        // }

        function addMeshToScene(d) {
            //Advanced 3d convex geo
            // view-source:https://cs.wellesley.edu/~cs307/threejs/dirksen/chapter-06/01-advanced-3d-geometries-convex.html
            // use the same points to create a convexgeometry

            var meshMaterial = new THREE.MeshBasicMaterial({color: 0xffffdd, transparent: true, opacity: 0.3});
            meshMaterial.side = THREE.DoubleSide;
            var wireFrameMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.3});
            wireFrameMat.wireframe = true;

            let hullGeometry = new THREE.ConvexGeometry(d);
            // var material = new THREE.MeshBasicMaterial( { wireframe: true } );
            let hullMesh = new THREE.Mesh(hullGeometry, [wireFrameMat]);
            // let hullMesh = new THREE.Mesh( hullGeometry, [meshMaterial, wireFrameMat] );
            hullGroup.add(hullMesh); // add to group hull
            glbox.add(hullMesh);
        }

        //lathe example
        //https://threejs.org/docs/#api/geometries/LatheGeometry
        // let points = [];
        // for ( let i = 0; i < 50; i ++ ) {
        //     console.log(new THREE.Vector2( Math.sin( i * 0.2 ) * 50 + 5, ( i - 5 ) * 2 ) );
        //     points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
        // }
        //
        // var geometry = new THREE.LatheGeometry( points );
        // var material = new THREE.MeshBasicMaterial( { color: 0xffff00, doubleSided: true } );
        // var lathe = new THREE.Mesh( geometry, material );
        // glbox.add( lathe );

        //CSG example
        // var cylinder = THREE.CSG.toCSG(new THREE.CylinderGeometry(100, 100, 200, 16, 4, false ),new THREE.Vector3(0,-100,0));
        // var sphere   = THREE.CSG.toCSG(new THREE.SphereGeometry(100,16,12));
        // var circle   = THREE.CSG.toCSG(new THREE.CircleGeometry(10,26));
        //
        // // var geometry = cylinder.union(sphere);
        // var geometry = sphere.union(cylinder).union(circle);
        // var mesh = new THREE.Mesh(THREE.CSG.fromCSG( geometry ),new THREE.MeshNormalMaterial());
        // glbox.add(mesh);

        // // console.log(points);
        // // console.log(pointsHullArray);
        //
        // WGLScene.add( new THREE.AmbientLight( 0x222222 ) );
        // var light = new THREE.PointLight( 0xffffff, 1 );
        // camera.add( light );
        //
        // var pointsGeometry = new THREE.DodecahedronGeometry( 10 );
        //
        // for (var i = 0; i < pointsGeometry.vertices.length; i++) {
        //     pointsGeometry.vertices[i].add(randomPoint().multiplyScalar(50)); // wiggle the points
        // }
        //
        // var pointsMaterial = new THREE.PointsMaterial( {
        //     color: 0x0080ff,
        //     size: 1,
        //     alphaTest: 0.5
        // } );
        //
        // var pointsGM = new THREE.Points( pointsGeometry, pointsMaterial );
        // glbox.add( pointsGM );
        //
        // // convex hull
        // var meshMaterial = new THREE.MeshLambertMaterial( {
        //     color: 0xffffff,
        //     opacity: 0.5,
        //     transparent: true
        // } );
        //
        // var meshGeometry = new THREE.ConvexBufferGeometry( pointsGeometry.vertices );
        //
        // var mesh = new THREE.Mesh( meshGeometry, meshMaterial );
        // mesh.material.side = THREE.BackSide; // back faces
        // mesh.renderOrder = 0;
        // glbox.add( mesh );
        // var mesh = new THREE.Mesh( meshGeometry, meshMaterial.clone() );
        // mesh.material.side = THREE.FrontSide; // front faces
        // mesh.renderOrder = 1;
        // glbox.add( mesh );
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

    let hullGroup = new THREE.Group; //hold hullbox as a group content

    var groupCloud = new THREE.Object3D();
    groupCloud.name = "groupCloud";


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
