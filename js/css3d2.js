/**
 * Created by simba on 07/03/2017.
 */
// Cube using three.js r.64 CSS3DRenderer

var renderer, scene, camera, controls;
var cube = new THREE.Object3D();

init();
animate();

function init() {

    // renderer
    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );
    camera.position.set( 200, 100, 250 );

    // controls
    //controls = new THREE.TrackballControls( camera );
    controls = new THREE.TrackballControls( camera );

    // params
    var r = Math.PI / 2;
    var d = 50;
    var pos = [ [ d, 0, 0 ], [ -d, 0, 0 ], [ 0, d, 0 ], [ 0, -d, 0 ], [ 0, 0, d ], [ 0, 0, -d ] ];
    var rot = [ [ 0, r, 0 ], [ 0, -r, 0 ], [ -r, 0, 0 ], [ r, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ] ];

    scene.add( cube );

    // sides
    for ( var i = 0; i < 6; i ++ ) {

        var element = document.createElement( 'div' );
        element.style.width = '100px';
        element.style.height = '100px';
        element.style.background = new THREE.Color( "#ececec" ).getStyle();
        element.style.opacity = '0.20';
        element.style.border = "2px solid #0000FF";

        var object = new THREE.CSS3DObject( element );
        object.position.fromArray( pos[ i ] );
        object.rotation.fromArray( rot[ i ] );
        object.name = "side"+i;

        //console.log(object);
        cube.add( object );
    }

}


function animate() {

    requestAnimationFrame( animate );

    controls.update();

    renderer.render( scene, camera );

}

function tranform(side){
    //scene.remove( "side0" );
    //scene.remove(cube.children[0]);
    //console.log(cube);
    scene.children[0].children.forEach(function(object){
        //var newPos = object.position.x;

        if(object.name == "side"+side){
            console.log(object);

            //postition
            object.position.x += 10;
            object.position.y += 10;

            //rotation
            object.rotation.x = 0;
            object.rotation.y = 0;
            object.rotation.z = 0;
        }

        //if(object.name == "side")
    });

    // reset camera
    //camera.position.set( 100, 50, 250 );
    renderer.render( scene, camera );
}
