var camera, scene, renderer;
var geometry, material, mesh;

var scene2, renderer2;

var controls;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 400, 400, 400 );

    controls = new THREE.OrbitControls( camera );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;

    //scene = new THREE.Scene();

    geometry = new THREE.CubeGeometry( 200, 300, 400 );

    material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, wireframeLinewidth: 1 } );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(50,100,70);
    mesh.rotation.x = Math.PI/3;
    mesh.rotation.y = Math.PI/4;
    mesh.rotation.z = Math.PI/5;

    //scene.add( mesh );

    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene2 = new THREE.Scene();

    // params
    var r = Math.PI / 2;
    var width = 200;
    var height = 300;
    var depth = 400;
    var x = 50;
    var y = 100;
    var z = 70;
    var pos = [ [ x+width/2, -y+height/2, z ], [ -depth, y/2, x/2 ], [ 0, height/2+y, x/2 ], [ depth, -y/2, x/2 ], [ x, y/2, depth/2+x/2 ], [ 0, y/2, -depth/2 +x/2] ];
    var rot = [ [ 0, r, 0 ], [ 0, -r, 0 ], [ -r, 0, 0 ], [ r, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ] ];

    // cube
    var cube = new THREE.Object3D();
    scene2.add( cube );

    // sides
    for ( var i = 0; i < 6; i ++ ) {
        var txt = document.createTextNode("side:"+i);
        var element = document.createElement( 'div' );

        element.className = "face"+i;
        element.style.width = width+'px';
        element.appendChild(txt);
        element.style.height = height+'px';
        element.style.background = new THREE.Color( Math.random() * 0xffffff ).getStyle();
        element.style.opacity = '0.8';

        var object = new THREE.CSS3DObject( element );
        object.position.fromArray( pos[ i ] );
        object.rotation.fromArray( rot[ i ] );
        cube.add( object );

        console.log(object.position)
    }

    //console.log(object.parent);
    //object.parent.children[0].position.x = 1400;
    //console.log(object.parent.children[0].position.x = 400);
    //

    renderer2 = new THREE.CSS3DRenderer();
    renderer2.setSize( window.innerWidth, window.innerHeight );
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = 0;
    document.body.appendChild( renderer2.domElement );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update();

    //renderer.render( scene, camera );
    renderer2.render( scene2, camera );

}
