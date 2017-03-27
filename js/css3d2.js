/**
 * Created by simba on 07/03/2017.
 */
// Cube using three.js r.64 CSS3DRenderer

var renderer, scene, camera, controls;
var cube = new THREE.Object3D();
var mesh = new THREE.Object3D();

init();
animate();
//drawGraphs()

var lineList = [];

function init() {
    // renderer
    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    document.body.appendChild(renderer.domElement);

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(200, 100, 250);

    // controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 0, 0);
    //controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    //controls.addEventListener('change', function () {
    //    renderer.render(scene, camera)
    //});

    // params
    var r = Math.PI / 2;
    var d = 50;
    var pos = [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]];
    var rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];

    scene.add(cube);
    scene.add(mesh);

    // sides
    for (var i = 0; i < 6; i++) {

        var element = document.createElement('div');
        element.style.width = '100px';
        element.style.height = '100px';
        element.style.background = new THREE.Color("#ececec").getStyle();
        element.style.opacity = '0.1';
        element.style.border = "0.5px dotted #FFF";
        element.className = "side";

        var object = new THREE.CSS3DObject(element);
        object.position.fromArray(pos[i]);
        object.rotation.fromArray(rot[i]);
        //object.name = "side" + i;
        object.name = "side";

        cube.add(object);
    }

    var datasets = [0, 45, 2, 8, 89, 5, 9];

    // segments
    var segments = datasets.length;


    //D3
    var width = 100,
        height = 130;

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

    //console.log(elements[0])
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
            .classed("hide", function (d) {
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
                var cx = d.geometry.coordinates[0] += 10;
                return cx;
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

    function objectify(d, i) {
        //console.log(this);
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

    //hide all subunits paths
}

function transform(side) {
    var duration = 2500;
    TWEEN.removeAll();

    //display all the maps for the segments
    d3.selectAll("svg").select(".subunit")
        .classed("hide", false);

    scene.children[0].children.forEach(function (object, i) {

        //remove box shapes
        if (object.name == "side") {
            //object.position.y = 10000;
            object.element.hidden = true;
            //console.log(object.element.hidden)
        }

        //show only segments
        if (object.name == "seg") {

            //change opacity
            //object.element.firstChild.style.opacity = 1.5;
            console.log(object.element.firstChild.style);

            var posTween = new TWEEN.Tween(object.position)
                .to({
                    x: (( i % 5 ) * 150) - 300,
                    y: ( -( Math.floor(i / 5) % 5 ) * 150 + 150 ),
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
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.enablePan = false;

    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

//function removeObject(id) {
//    scene.remove(scene.getObjectByName(id));
//}

function drawGraphs() {

    console.log(lineList);
    lineList.forEach(function (d) {
        var x = d[0];
        var y = d[1];
        //console.log(y);
        //cylinderMesh(x,y)
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
}
function superImpose() {
    //console.log(window.camera.position.x);
    //console.log(window.camera.position.y);
    //console.log(window.camera.position.z);
    //

    console.log(camera);

    //change camera view
    //camera super imposition
    var tween = new TWEEN.Tween({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    })
        .to({
            x: 0,
            y: 200,
            z: -6
        }, 1000)
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

    //camera.far = 100;
    //change perspective to top
    //zoom into
    //north south axis
    //medge section into one view
    //color coding chronological views


}

function geoVis() {

}

function setVis() {

}

function netVis() {

}