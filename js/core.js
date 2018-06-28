THREE.Object3D.prototype.clear = function () {
    var children = this.children;
    for (var i = children.length - 1; i >= 0; i--) {
        var child = children[i];
        child.clear();
        this.removeChild(child);
    }
};

// Data between two dates to replace tp
//https://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates
Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(currentDate);
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

//https://codepen.io/anon/pen/MwvQXq
//http://jsfiddle.net/sarathsaleem/8tmLrb9t/7/
//https://stackoverflow.com/questions/42838389/get-constant-interval-of-ticks-value-in-d3-scaletime
function timeRage(d = 1952, start = 1938, end = 1955, segment = 12) {
    let rangeArray = [];
    let scale = d3.scaleTime()
        .domain([new Date(start, 0, 0), new Date(end, 0, 0)]);

    //range scale
    let xRange = scale.ticks(segment);
    xRange.forEach(d => {
        rangeArray.push(d.getFullYear().toString())
    });

    //time scale
    // let xScale = scale.range(xRange);

    // var x = d3.scaleTime()
    //     .domain([new Date(start, 0, 0), new Date(end, 0, 0)])
    //     // .range(rangeArray);
    //     .range([10, 50, 200, 1000])
    //     .clamp(true);

    let myQuantizeFunction = d3.scaleQuantize()
        .domain([start, end])
        .range(rangeArray);
    let filterQuantize = function (d) {
        if (d == 0) {
            return range[0];
        } else {
            return myQuantizeFunction(d);
        }
    };

    // console.log(rangeArray);

    return myQuantizeFunction(d)
}

//https://stackoverflow.com/questions/5531827/random-point-on-a-given-sphere
function randomSpherePoint(x0, y0, z0, radius) {
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    // var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    var y = y0;
    var z = z0 + (radius * Math.cos(phi));
    return [x, y, z];
}



//How to get unique values in an array
Array.prototype.unique = function () {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
        if (!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
};

// sort by largest or smallest array
function compareArrayBySize(a, b) {
    if (a.values.length < b.values.length)
        return 1;
    if (a.values.length > b.values.length)
        return -1;
    return 0;
}

// returns a time-flattened representation of the data set
function getFlattenedLayer(allGroups) {
  allGroups.sort(compareArrayBySize);
  let flattenedLayer = new Map();

  for(let i = 0; i < allGroups.length; i++) {
    if(flattenedLayer.get(allGroups[i].key)) {
      let concatenatedArray = flattenedLayer.get(allGroups[i].key).concat(allGroups[i].values);
      flattenedLayer.set(allGroups[i].key, concatenatedArray);
    } else {
      flattenedLayer.set(allGroups[i].key, allGroups[i].values);
    }
  }
  return Array.from(flattenedLayer);
}

function getSuperLayer(allGroups) {

    //1 = sorting all groups
    allGroups.sort(compareArrayBySize);

    //1.5 = get all groups name
    let unique_groups_names = [...new Set(allGroups.map(item => item.key))];
    // console.log(unique_groups_names);

    let biggest_of_each_group = [];

    unique_groups_names.forEach(function (n) { //todo: RAL
        for (let i = 0; i < allGroups.length; i++) {
            if(allGroups[i].key === n){
                biggest_of_each_group.push({key: allGroups[i].key, values: allGroups[i].values});
                break;
            }//end if
        }//end for
    });

    // console.log(biggest_of_each_group)

    return biggest_of_each_group;
}

function createForcedLayout(group_list,widthHalf, heightHalf){
    // console.log("group_list before:");
    // console.log(group_list);
    let simulation = d3.forceSimulation()
                .force('charge', d3.forceManyBody())
                .force('center', d3.forceCenter(widthHalf, heightHalf))
                .force('collision', d3.forceCollide().strength(1).radius(function (d) {
                    let rad = d.values.length ;
                    return rad;
                }).iterations(2));

    simulation.nodes(group_list);
    // console.log("group_list after:");
    // console.log(group_list);

    return group_list;
}

function createDiagonalLayout(group_list){
    let posX = 25;
    let posY = 25;
    let rad = 0;

    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = posX;
        group_list[i].y = posY;

        rad = group_list[i].values.length;
        posX = posX - rad/10;
        posY = posY - rad/10;
    }

    return group_list;
}

function createMatrixLayout(group_list){
    let border = 22
    let posX = border;
    let posY = border;
    let grainX = (2*border)/3;

    group_list = shuffle(group_list);

    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = posX;
        group_list[i].y = posY;
        
        if((posX - grainX)<-border){ posX = border;
                              posY = posY - grainX; }
        else{                 posX = posX - grainX; }        
        
    }

    return group_list;
}

function createCircularLayout(group_list){
    let fraction = (2* Math.PI)/group_list.length;
    let current_pos = 0;
    let r = 20;
    let posX = r*Math.cos(current_pos);
    let posY = r*Math.sin(current_pos);

    // console.log(fraction);
    
    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = posX;
        group_list[i].y = posY;

        current_pos += fraction;
        posX = r*Math.cos(current_pos);
        posY = r*Math.sin(current_pos);
    }

}

function createCiclePackingLayout(group_list,widthHalf, heightHalf) {

    const packLayout = d3.pack()
        .size([1000, 1000])
        .radius(() => 60)
        .padding(5);


    let simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(widthHalf, heightHalf))
        .force('collision', d3.forceCollide().strength(1).radius(function (d) {
            let rad = d.values.length ;
            return rad;
        }).iterations(2));

    simulation.nodes(group_list);

    return group_list;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }
//get super layer and use it the

//getRadScale

function getRadScale( radius, min = 0, max = 94, height = 1000){

    let x = d3.scaleLinear()
        .domain([min, max])
        .range([0, (height/4)]);
    return x(radius)
    //input all the radius list,  min and max, width, height
    //return the scale for the largest radius
}

function createNewSpriteLabel(message, parameters) {
  if (parameters === undefined) parameters = {};
  var size = parameters["size"] || 10; // check params
  let label = document.createElement('p');
  label.style.width = '50px';
  label.style.height = '50px';
  label.style.color = '#7b7b7b';
  label.className = 'set-label';
  let textLabel = document.createTextNode(message);
  label.appendChild(textLabel);
  let object = new THREE.CSS3DSprite(label);
  return object;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r)
{
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
