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

// console.log(x(new Date(+d, 0, 0))); // 640
// console.log(timeRage(1945)); // 640


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

function createCircularLayout(group_list){
    let fraction = (2* Math.PI)/group_list.length;
    let current_pos = 0;
    let r = 25;
    let posX = r*Math.cos(current_pos);
    let posY = r*Math.sin(current_pos);

    console.log(fraction);
    
    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = posX;
        group_list[i].y = posY;

        current_pos += fraction;
        posX = r*Math.cos(current_pos);
        posY = r*Math.sin(current_pos);
    }

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

function forceRadial(radius, x, y) {
  var nodes,
      strength = constant(0.1),
      strengths,
      radiuses;

  if (typeof radius !== "function") radius = constant(+radius);
  if (x == null) x = 0;
  if (y == null) y = 0;

  function force(alpha) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var node = nodes[i],
          dx = node.x - x || 1e-6,
          dy = node.y - y || 1e-6,
          r = Math.sqrt(dx * dx + dy * dy),
          k = (radiuses[i] - r) * strengths[i] * alpha / r;
      node.vx += dx * k;
      node.vy += dy * k;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    radiuses = new Array(n);
    for (i = 0; i < n; ++i) {
      radiuses[i] = +radius(nodes[i], i, nodes);
      strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _, initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  return force;
}

function constant(x) {
  return function() {
    return x;
  };
}
