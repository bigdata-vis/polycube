/**
 * Created by simba on 07/03/2017.
 */
// Cube using three.js r.64 CSS3DRenderer

var renderer, scene, camera, controls;
var cube = new THREE.Object3D();
var mesh = new THREE.Object3D();

init();
animate();

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

        var object = new THREE.CSS3DObject(element);
        object.position.fromArray(pos[i]);
        object.rotation.fromArray(rot[i]);
        //object.name = "side" + i;
        object.name = "side";

        cube.add(object);
    }


    // segments
    var segments = 4;
    for (var z = 0; z < segments; z++) {
        var seg = document.createElement('div');
        seg.style.width = '100px';
        seg.style.height = '130px';
        seg.style.background = new THREE.Color("#ececec").getStyle();
        seg.style.opacity = '0.20';
        var interval = 100 / segments; //height/segments

        var objSeg = new THREE.CSS3DObject(seg);


        //objSeg.position.fromArray(pos[i]);

        //position
        objSeg.position.x = 0;
        objSeg.position.y = (z * interval) - 50;
        objSeg.position.z = 0;

        //rotation
        objSeg.rotation.fromArray(rot[2]);
        objSeg.name = "seg";

        //console.log(objSeg.position);
        //console.log(objSeg.element);

        cube.add(objSeg);
    }
}

function tranform(side) {
    //scene.remove( "side0" );
    //scene.remove(cube.children[0]);
    //console.log(cube);
    scene.children[0].children.forEach(function (object, i) {
        //var newPos = object.position.x;

        //if (object.name == "side" + side) {

        //console.log(object.position);

        //var tempx = 100;

        //rotation
        object.rotation.x = 0;
        object.rotation.y = 0;
        object.rotation.z = 0;

        ////postition
        //object.position.x += tempx;
        //
        //if(object.position.y >= 50){
        //    object.position.y += 50;
        //}
        //
        //if(object.position.y < 0){
        //    object.position.y += 50;
        //}
        //
        //object.position.y += 0;
        //object.position.z += 0;

        object.position.x = (( i % 5 ) * 150) - 300;
        object.position.y = ( -( Math.floor(i / 5) % 5 ) * 150 + 150 );
        //object.position.z = (Math.floor(i / 25)) * 1000 - 2000;
        object.position.z = 0;
        //}
        //console.log(object.element);

        //if(object.name == "side")

    });

    //modify controls
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.enablePan = false;

    // reset camera
    camera.position.set(100, 50, 1050);
    renderer.render(scene, camera);
}

function transform(side) {
    var duration = 2500;
    TWEEN.removeAll();

    scene.children[0].children.forEach(function (object, i) {

        //remove box shapes
        if (object.name == "side") {
            object.position.y = 10000;
        }

        //show only segments
        if (object.name == "seg") {
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

    // reset camera
    //camera.position.set(100, 50, 1050);

    renderer.render(scene, camera);
}

function animate() {

    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

function removeObject(id) {
    scene.remove(scene.getObjectByName(id));
}