let _container,_stats;
let _camera, _scene,_renderer, _controls;

let _raycaster;
let _mouse;
let _objects = [];
let _objects_map = [];

let _spline_objects = [];


let _data;
let _data_map = new Map();

let _textlabels = [];


let _date_range = 0; //year(s)
let _amount_of_layers = 100;
let _distribution = [];

let _first_event_year = 3000;
let _last_event_year = 0;

//cushman_relationships presents 14 categories
_uniq_categories = [];
//TODO: define collor palette
_uniq_colors = [0x8dd3c7,0xffffb3,0xbebada,0xfb8072,0x80b1d3,0xfdb462,0xb3de69,0xfccde5,0xd9d9d9,0xbc80bd,0xccebc5,0xffed6f,
                0x8dd3c7,0xffffb3,0xbebada,0xfb8072,0x80b1d3,0xfdb462,0xb3de69,0xfccde5,0xd9d9d9,0xbc80bd,0xccebc5,0xffed6f];
//#################
//##### MAIN CALLS
//#################

//loadDataCushmanRelationships();
loadDataCountriesRelationships();

function loadDataCushmanRelationships() {
    let xhr = new XMLHttpRequest();
    xhr.overrideMimeType('application/json');
    xhr.open('GET', './data/cushman_relationships.json');
    xhr.send();
    xhr.onreadystatechange = function() {    
        if(this.readyState == 4 && this.status == '200') {
            _data = JSON.parse(xhr.responseText);
            
            //map constructor
            _data.forEach(element => {
                _data_map.set(element.id, element);
            });            
            
            init_cushman();
            animate();
        } 
    }
}

function loadDataCountriesRelationships() {
    let xhr = new XMLHttpRequest();
    xhr.overrideMimeType('application/json');
    xhr.open('GET', './data/countries/001_countries_events.json');
    xhr.send();
    xhr.onreadystatechange = function() {    
        if(this.readyState == 4 && this.status == '200') {
            _data = JSON.parse(xhr.responseText);
            
            //data cleaner (remove countries without events)
            for(var i = _data.length - 1; i >= 0; i--) {
                if(_data[i].events_id_list.length === 0) {
                    _data.splice(i, 1);
                }
            }//end for

            //map constructor
            _data.forEach(element => {
                _data_map.set(element.country, element);
            });            

            init_countries();
            animate();
        } 
    }
}

function sortArrayByDate(a,b){
    let c = new Date(a.date_time);
    let d = new Date(b.date_time);
    return c-d;
}

function sortArrayByEvents(a,b){
    let c = a.events_id_list.length;
    let d = b.events_id_list.length;
    return d-c;
}

function sortArrayByAge(a,b){
    let c = a.overall_end - a.overall_start;
    let d = b.overall_end - b.overall_start;
    return d-c;
}

function getDataCategories(){
    let c = [];

    _data.forEach(e => { c.push(e.category_1); });

    return [...new Set(c)];
}

function millisecondsToDays(m){
    return m/(1000*60*60*24);
}

function getDataRangeInDays(){
    let firstDate = new Date(_data[0].date_time);
    let lastDate = new Date(_data[_data.length-1].date_time);    
    return millisecondsToDays(lastDate - firstDate);
}

function getPositionInDistribution(element){
    let factor = _date_range/_amount_of_layers;
    let firstDate = new Date(_data[0].date_time);
    let date = new Date(element.date_time);
    let difference = millisecondsToDays(date - firstDate);
    return Math.floor(difference/factor);
}

function getDistribution(){    
    let distribution_result = []
    for(var i=0; i<_amount_of_layers; i++){ distribution_result[i]=0; }

    _data.forEach(e => {                
        let distribution_position = getPositionInDistribution(e);        
        //last element treatment
        if(distribution_position>_amount_of_layers-1){distribution_position-=1;}
        distribution_result[distribution_position]++;
    }); 
    return distribution_result;
}



function init_countries() {

    _container = document.createElement('div');
    document.body.appendChild( _container );
    
    _camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    _camera.position.set( 0, 300, 500 );
    _camera.rotation.set( -0.44, -0.85, -0.34 );

    
    _renderer = new THREE.WebGLRenderer();
    _renderer.setPixelRatio( window.devicePixelRatio );
    _renderer.setSize( window.innerWidth, window.innerHeight );

    // Setup controls
    _controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    _controls.target = new THREE.Vector3(0, 0, 0);
    _controls.enableDampening = true;
    _controls.enableZoom = true;

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color( 0xf0f0f0 );

    generateCountriesMetaInfo();
    _data = _data.sort(sortArrayByAge);

    //////////////////////////////////////////
    // FIRST CALL
    //////////////////////////////////////////
    distributeCountriesCubesInTube();
    ////distributeCountriesCubesInForcedLayout();
    distributeCountriesEdges();
    distributeNodeTextLabels();
    createAxisLabels();

   
    //////////////////////////////////////////

    _raycaster = new THREE.Raycaster();
    _mouse = new THREE.Vector2();
    _container.appendChild( _renderer.domElement );
    _stats = new Stats();
    _container.appendChild(_stats.dom );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}

function createAxisLabels(){

    let right = 250;
    let left = -230;

    var spritey_first_1 = makeTextSprite( ""+_first_event_year, 
        { fontsize: 25,fontface: "Georgia",
          borderColor: {r:0, g:0, b:255, a:1.0} } );

        spritey_first_1.position.set(right, 
                                   -25,
                                   0);

    var spritey_first_2 = makeTextSprite( ""+_first_event_year, 
        { fontsize: 25,fontface: "Georgia",
            borderColor: {r:0, g:0, b:255, a:1.0} } );

        spritey_first_2.position.set(left, 
                                    -25,
                                    0);

    var spritey_last_1 = makeTextSprite( ""+_last_event_year, 
        { fontsize: 25,fontface: "Georgia",
            borderColor: {r:0, g:0, b:255, a:1.0} } );

        spritey_last_1.position.set(right, 
                                  _last_event_year-_first_event_year-10,
                                  0);
    var spritey_last_2 = makeTextSprite( ""+_last_event_year, 
        { fontsize: 25,fontface: "Georgia",
            borderColor: {r:0, g:0, b:255, a:1.0} } );

        spritey_last_2.position.set(left, 
                                  _last_event_year-_first_event_year-10,
                                  0);

        _scene.add( spritey_first_1 );
        _scene.add( spritey_first_2 );
        _scene.add( spritey_last_1 );
        _scene.add( spritey_last_2 );
}

function distributeNodeTextLabels(){
    _objects.forEach((e,i) => { 
        let font_size = 23;//calc_size(e.info.overall_end, e.info.overall_start);
        let cube_height = getCubeHeightByCountryName(e.info.country);
        let pos_y = -cube_height +  (e.info.overall_start - _first_event_year);
        
        var spritey = makeTextSprite( e.info.country, 
		{ fontsize: font_size, fontface: "Georgia", borderColor: {r:0, g:0, b:0, a:1.0} } );
        spritey.position.set(e.position.x, 
                             pos_y,
                             e.position.z);
        //spritey.scale.set(0.1,0.1,0.1);//hides it //0,0,0 makes matrix error
        spritey.name = e.info.country;
        spritey.visible = false;
        _textlabels.push( spritey );
        _scene.add( spritey );
    });//end for
}

//DEPRECATED
function calc_size(end, start){
    let size = end-start;
    if(size<25) size = 25;
    else if (size>40) size = 40;
    return size;
}

function makeTextSprite( message, parameters )
  {
      if ( parameters === undefined ) parameters = {};
      
      var fontface = parameters.hasOwnProperty("fontface") ? 
          parameters["fontface"] : "Arial";
      
      var fontsize = parameters.hasOwnProperty("fontsize") ? 
          parameters["fontsize"] : 18;
      
      var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
          parameters["borderThickness"] : 4;
      
      var borderColor = parameters.hasOwnProperty("borderColor") ?
          parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
      
      var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
          parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };
  
      //var spriteAlignment = THREE.SpriteAlignment.topLeft;
          
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      context.font = "Bold " + fontsize + "px " + fontface;
      
      // get size data (height depends only on font size)
      var metrics = context.measureText( message );
      var textWidth = metrics.width;
      
      // background color
      context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
                                    + backgroundColor.b + "," + backgroundColor.a + ")";
      // border color
      context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
                                    + borderColor.b + "," + borderColor.a + ")";
  
      context.lineWidth = borderThickness;
      roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
      // 1.4 is extra height factor for text below baseline: g,j,p,q.
      
      // text color
      context.fillStyle = "rgba(0, 0, 0, 1.0)";
  
      context.fillText( message, borderThickness, fontsize + borderThickness);
      
      // canvas contents will be used for a texture
      var texture = new THREE.Texture(canvas) 
      texture.needsUpdate = true;
  
      var spriteMaterial = new THREE.SpriteMaterial( 
          { map: texture, useScreenCoordinates: false } );
      var sprite = new THREE.Sprite( spriteMaterial );
      sprite.scale.set(100,50,1.0);
      return sprite;	
  }

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}

function distributeCountriesEdges(){

    _data.forEach((e,i) => { 
        e.events_id_list.forEach(id=>{
            createCountriesLinkById(id);
        });
    });//end for

}

function createCountriesLinkById(id){
    let event = _events_map.get(id);
    if(event){        
        //console.log(_data_map.get(event.state_name1).position);

        let pos_source_x = _data_map.get(event.state_name1).position.x;
        let pos_source_z = _data_map.get(event.state_name1).position.z;
        let pos_target_x = _data_map.get(event.state_name2).position.x;
        let pos_target_z = _data_map.get(event.state_name2).position.z;
      
        let pos_y = getCountryEdgePositionYByYear(event.start);
        let position_source = new THREE.Vector3( pos_source_x, pos_y, pos_source_z );;
        let position_target = new THREE.Vector3( pos_target_x, pos_y, pos_target_z );;
        //console.log(_data_map.get(event.state_name1).position);
        //console.log("-------------");

        //specify curve/line features
        var curve = new THREE.LineCurve3( position_source, position_target );
        var points = curve.getPoints( 50 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );    
        var material = getCountriesEdgeColorByAgreement(event);
        // Create the final object to add to the scene
        var splineObject = new THREE.Line( geometry, material );
        splineObject.info = event;    
        _spline_objects.push(splineObject);
        _scene.add(splineObject);
    }
}

function getCountryEdgePositionYByYear(year){
    return year - _first_event_year;
}

function getCountriesEdgeColorByAgreement(event){
    if(event.defense) return new THREE.LineBasicMaterial( { color : 0xe41a1c } );  
    else if (event.entente) return new THREE.LineBasicMaterial( { color : 0x377eb8 } );  
    else if (event.neutrality) return new THREE.LineBasicMaterial( { color : 0x4daf4a } );  
    else { // if event.nonaggression
        return new THREE.LineBasicMaterial( { color : 0x984ea3 } );    
    }
}


function init_cushman() {

    _data = _data.sort(sortArrayByDate);
    _date_range = getDataRangeInDays();
    _distribution = getDistribution();
    _uniq_categories = getDataCategories();
    console.log(_uniq_categories);

    _container = document.createElement('div');
    document.body.appendChild( _container );
    
    _camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    _camera.position.set( 0, 300, 500 );
    _camera.rotation.set( -0.44, -0.85, -0.34 );

    
    _renderer = new THREE.WebGLRenderer();
    _renderer.setPixelRatio( window.devicePixelRatio );
    _renderer.setSize( window.innerWidth, window.innerHeight );

    // Setup controls
    _controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    _controls.target = new THREE.Vector3(0, 0, 0);
    _controls.enableDampening = true;
    _controls.enableZoom = true;

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color( 0xf0f0f0 );

    //distributeRandomCubes();
    //distributeCubesByData();
    distributeCushmanCubesInTubeByData(false);
    distributeCushmanEdges();

    _raycaster = new THREE.Raycaster();
    _mouse = new THREE.Vector2();
    _container.appendChild( _renderer.domElement );
    _stats = new Stats();
    _container.appendChild(_stats.dom );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}

function getRandomColor(){
    let idx = Math.floor(Math.random() * 12);
    return _uniq_colors[idx];
}

function getColorByCategory(category){
    let idx = _uniq_categories.indexOf(category);
    return _uniq_colors[idx];
}

function distributeRandomCubes(){
    var geometry = new THREE.BoxBufferGeometry( 50, 50, 50 );
    for ( var i = 0; i < 10; i ++ ) {
        var object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff } ) ); //, opacity: 0.5
        object.position.x = Math.random() * 800 - 400;
        object.position.y = Math.random() * 800 - 400;
        object.position.z = Math.random() * 800 - 400;

        object.name = "p"+i;

        _scene.add( object );
        _objects.push( object );
    }//end for
}


function distributeCubesByData(){
    let cube_size = 5;
    let geometry = new THREE.BoxBufferGeometry( cube_size, cube_size, cube_size );
    let distribution_count = [];
    for(let i=0; i<_amount_of_layers; i++){ distribution_count[i]=0; }

    _data.forEach(e => { 
        let object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: getColorByCategory(e.category_1) } ) ); // ,opacity: 0.5
        
        let dist_pos = getPositionInDistribution(e);        
        let pos_x = distribution_count[dist_pos];

        object.position.x = pos_x * cube_size;        
        object.position.z = 0;
        object.position.y = dist_pos * cube_size;
        object.info = e;

        distribution_count[dist_pos]++;
        _scene.add(object);
        _objects.push(object);
    });//end for
}

/*
 This function find and add overall_start & overall_end to countries data based on its events_id_list
*/
function generateCountriesMetaInfo(){
    _data.forEach((c,i) => { 
        let overall_start = 3000;
        let overall_end = 0;

        c.events_id_list.forEach(id=>{
            let event = _events_map.get(id);
            if(overall_start > event.start) overall_start = event.start;
            if(overall_end < event.end) overall_end = event.end;
        });

        c.overall_start = overall_start;
        c.overall_end = overall_end;       

        if(_first_event_year > overall_start) _first_event_year = overall_start;
        if(_last_event_year < overall_end) _last_event_year = overall_end;
        
    });
}

function distributeCountriesCubesInTube(){
    let cube_size = 5;
      
    let r = _data.length*cube_size/4;
    let fraction = (2* Math.PI)/_data.length;

    console.log(_first_event_year);
    console.log(_last_event_year);

    _data.forEach((e,i) => { 
        let cube_height = getCubeHeightByCountryName(e.country);
        let geometry = new THREE.BoxBufferGeometry( cube_size, cube_height, cube_size );  
        //let object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: getRandomColor() } ) ); // ,opacity: 0.5
        let object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xadd8e6 } ) ); // ,opacity: 0.5
        
        let pos = i*fraction;

        object.position.x = r*Math.cos(pos);        
        object.position.z = r*Math.sin(pos);
        object.position.y = -cube_height/2 +  (e.overall_start - _first_event_year);
        object.info = e;

        //update respectiove element position in map
        _data_map.get(e.country).position = object.position;

        _scene.add(object);
        _objects.push(object);      

    });//end for

}



function distributeCountriesCubesInForcedLayout(){
    let cube_size = 5;

    _data.forEach((e,i) => { 
        let cube_height = getCubeHeightByCountryName(e.country);
        let geometry = new THREE.BoxBufferGeometry( cube_size, cube_height, cube_size );  
        let object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: getRandomColor() } ) ); // ,opacity: 0.5
        
        
        object.position.x = _countries_position_map.get(e.country).x/2;        
        object.position.z = _countries_position_map.get(e.country).y/2;  
        object.position.y = -cube_height/2 +  (e.overall_start - _first_event_year);
        object.info = e;

        //update respectiove element position in map
        _data_map.get(e.country).position = object.position;

        _scene.add(object);
        _objects.push(object);
    });//end for

}

function getCubeHeightByCountryName(country){
    return _data_map.get(country).overall_start - _data_map.get(country).overall_end;
}

function distributeCubesInTubeByData(isUniformlyDistributed){
    let cube_size = 10;
    let geometry = new THREE.BoxBufferGeometry( cube_size, cube_size, cube_size );
    let distribution_count = [];
    for(let i=0; i<_amount_of_layers; i++){ distribution_count[i]=0; }    

    //count positions according to amount of layers
    _data.forEach(e => {              
        distribution_count[getPositionInDistribution(e)]++;
    });//end for

    let biggest_layer_amount = getBiggestLayerAmount(distribution_count);

    //distribute elements in a circular layout
    let saved_distribution_count = distribution_count.slice(0);//copy array
    for(let i=0; i<_amount_of_layers; i++){ distribution_count[i]=0; }  
    let r = biggest_layer_amount*cube_size/4;
    let current_pos = 0;
    let fraction = (2* Math.PI)/biggest_layer_amount;

    _data.forEach(e => { 
        let object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: getColorByCategory(e.category_1) } ) ); // ,opacity: 0.5
        
        let dist_pos = getPositionInDistribution(e);        
        let order_in_layer_pos = distribution_count[dist_pos];//get id
        
        if(isUniformlyDistributed){fraction = (2* Math.PI)/saved_distribution_count[dist_pos];} //uniform circular distribution
        else{ fraction = (2* Math.PI)/biggest_layer_amount; } //sequential circular distribution        
        current_pos = order_in_layer_pos * fraction;

        object.position.x = r*Math.cos(current_pos);        
        object.position.z = r*Math.sin(current_pos);
        object.position.y = dist_pos * cube_size;
        object.info = e;

        distribution_count[dist_pos]++;
        _scene.add(object);
        _objects.push(object);
    });//end for

    updateObjectsToMap();
}

/*
    Edge Bundles are using "spline curves":
    paper: https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=4015425
    spline curve doc: https://threejs.org/docs/#api/en/extras/curves/SplineCurve
*/
function distributeCushmanEdges(){
    
    _objects.forEach(o=>{
        let target = {id:"",location:""};
        target.id = o.info.target_nodes[0];//get only first node related
        
        if(_objects_map[target.id]){
            target.location = _objects_map[target.id].position;

            //specify curve/line features
            var curve = new THREE.LineCurve3( o.position, target.location );
            var points = curve.getPoints( 50 );
            var geometry = new THREE.BufferGeometry().setFromPoints( points );    
            var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );    
            // Create the final object to add to the scene
            var splineObject = new THREE.Line( geometry, material );    
            _scene.add(splineObject);
        }        
    });

}

function updateObjectsToMap(){
    _objects_map = [];
    _objects.forEach(o=>{
        console.log(o.info.id);
        _objects_map[o.info.id] = o;
    });
}

function getBiggestLayerAmount(distribution_count){
    let biggest_amount = 0;
    distribution_count.forEach(e=>{
        if(e>biggest_amount) biggest_amount = e;
    });
    return biggest_amount;
}

function onWindowResize() {
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentTouchStart( event ) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );
}


//CLICK
function onDocumentMouseDown( event ) {    
    event.preventDefault();
    _mouse.x = ( event.clientX / _renderer.domElement.clientWidth ) * 2 - 1;
    _mouse.y = - ( event.clientY / _renderer.domElement.clientHeight ) * 2 + 1;
    _raycaster.setFromCamera( _mouse, _camera );
    var intersects = _raycaster.intersectObjects( _objects );
    

    if ( intersects.length > 0 ) {
        //pinta todos objetos de branco
        paintAllNodes(0xffffff);
        let selected_obj = intersects[0].object;
        console.log(selected_obj.info);        
        
        //paint selected node
        selected_obj.material.color.setHex( 0x000000 );
        let related_countries = getAllRelatedCountries(selected_obj.info.country,
                                                       selected_obj.info.events_id_list);       
                                                              
        paintNodesList(related_countries, 0xadd8e6)
        highlightCountryEdges(selected_obj.info.country);
        showTextLabels(selected_obj.info.country, related_countries);
    }//end if
    else{
        //reset
        paintAllNodes(0xadd8e6);
        paintAllEdges();
        hideAllLabels();
    }    
}

function showTextLabels(country, related_countries){
    let show_list = related_countries;
    show_list.push(country);
    console.log(show_list);

    _textlabels.forEach(label=>{
        //if show_list contains label`s name
        if(show_list.indexOf(label.name) > -1){
            label.visible = true;
        }
        else{
            label.visible = false;
        }
    });
}

function hideAllLabels(){
    _textlabels.forEach(label=>{
        label.visible = false;
    });
}

function paintAllEdges(){
    _spline_objects.forEach(line=>{
        let color = getCountriesEdgeColorByAgreement(line.info).color;        
        line.material.color = color ;
    });
}

function highlightCountryEdges(country){
    _spline_objects.forEach(line=>{
        if(verifyLineEvent(line, country)){
            let color = getCountriesEdgeColorByAgreement(line.info).color;
            line.material.color = color;
        }
        else{            
            line.material.color.setHex( 0xffffff );
        }
    });
}

function verifyLineEvent(line, selected_country){
    if(line.info.state_name1 == selected_country ||
       line.info.state_name2 == selected_country){
        return true
    }
    return false;
}

function getAllRelatedCountries(source_country, event_list){
    let related_countries_list = [];
    event_list.forEach(id=>{
        let event = _events_map.get(id);
        if(event.state_name1==source_country) related_countries_list.push(event.state_name2);
        else related_countries_list.push(event.state_name1)
    });

    //return list of uniques
    return [...new Set(related_countries_list)];
}

function paintNodesList(list, color){
    _objects.forEach(o=>{
        //if contains
        if(list.indexOf(o.info.country) > -1){
            o.material.color.setHex( color );
        }
    });
}

function paintAllNodes(color){
    _objects.forEach(o=>{
        o.material.color.setHex( color );
    });
}
//
function animate() {
    requestAnimationFrame( animate );
    _controls.update();
    render();
    _stats.update();
}

var radius = 600;
var theta = 0;

function render() {
    // theta += 0.1;
    // _camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
    // _camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
    // _camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
    // _camera.lookAt( _scene.position );
    _renderer.render( _scene, _camera );
}