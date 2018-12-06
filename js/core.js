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
function timeRage(d = 1952, start = 1938, end = 1955, segment) {
    let rangeArray = [];
    let scale = d3.scaleTime()
        .domain([new Date(start, 0, 0), new Date(end, 0, 0)]);
    //range scale
    let xRange = scale.ticks(segment);

    // const st = new Date(2012, 0, 15);
    // const en   = new Date(2012, 4, 23);
    // const ran = moment().range(st, en);

    // console.log(ran);

    // let xRange = scale.tickValues([1,2,3,4]);
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

    // console.log(rangeArray);

    // console.log(rangeArray);

    return myQuantizeFunction(d)
}

//https://stackoverflow.com/questions/5531827/random-point-on-a-given-sphere
function randomSpherePoint1(x0, y0, z0, radius) {
    var u = Math.random();
    var v = Math.random();

    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);

    // var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    // var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    var y = y0;
    // var z = z0 + (radius * Math.cos(phi));

    let a = Math.random() * 2 * Math.PI;
    // let r = R * Math.sqrt(random());

// If you need it in Cartesian coordinates
    let x = x0 + radius * Math.cos(a);
    let z = z0 + radius * Math.sin(a);
    return [x, y, z];
}


function randomSpherePoint(x0, y0, z0, radius, group) {
    // while (group === defaultGroup){
    //
    //
    // }
    // for (group === defaultGroup; let deg = 0; deg < 360*6; deg += 3) {
    //     var angle = deg * Math.PI/180;
    //     var x = Math.cos(angle) * radius;
    //     var y = Math.sin(angle) * radius;
    //     drawCircle(x,y,2);
    //     radius = radius + 0.2;
    // }

    // console.log(group);

    let y = y0;

    r = radius * Math.sqrt(Math.random());

    let a = Math.random() * 2 * Math.PI;

    let x = x0 + r * Math.cos(a);
    let z = z0 + r * Math.sin(a);

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
function compareArrayBySizeDesc(a, b) {
    if (a.values.length < b.values.length)
        return 1;
    if (a.values.length > b.values.length)
        return -1;
    return 0;
}

function compareArrayBySizeAsc(a, b) {
    if (a.values.length > b.values.length)
        return 1;
    if (a.values.length < b.values.length)
        return -1;
    return 0;
}

// returns a time-flattened representation of the data set
function getFlattenedLayer(allGroups) {
    allGroups.sort(compareArrayBySizeDesc);
    let flattenedLayer = new Map();

    for (let i = 0; i < allGroups.length; i++) {
        if (flattenedLayer.get(allGroups[i].key)) {
            let concatenatedArray = flattenedLayer.get(allGroups[i].key).concat(allGroups[i].values);
            flattenedLayer.set(allGroups[i].key, concatenatedArray);
        } else {
            flattenedLayer.set(allGroups[i].key, allGroups[i].values);
        }
    }
    // convert to array of object so it works with other functions
    let result = [];

    flattenedLayer.forEach((value, key) => {
        result.push({key: key, values: value});
    });

    // console.log(result);
    let sorted_categories = result.sort(function (one, other) {
        //a - b is
        //   0 when elements are the same
        //  >0 when a > b
        //  <0 when a < b
        return one.values.length - other.values.length;
    });
    // console.log(sorted_categories);

    return sorted_categories;
}

function getSuperLayer(allGroups) {

    //1 = sorting all groups
    allGroups.sort(compareArrayBySizeDesc);

    //1.5 = get all groups name
    let unique_groups_names = [...new Set(allGroups.map(item => item.key))];
    // console.log(unique_groups_names);

    let biggest_of_each_group = [];

    unique_groups_names.forEach(function (n) { //todo: RAL
        for (let i = 0; i < allGroups.length; i++) {
            if (allGroups[i].key === n) {
                biggest_of_each_group.push({key: allGroups[i].key, values: allGroups[i].values});
                break;
            }//end if
        }//end for
    });

    // console.log(biggest_of_each_group)

    return biggest_of_each_group;
}

function createForcedLayout(group_list, widthHalf, heightHalf) {
    // console.log("group_list before:");
    // console.log(group_list);
    let simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(widthHalf, heightHalf))
        .force('collision', d3.forceCollide().strength(1).radius(function (d) {
            let rad = d.values.length;
            return rad;
        }).iterations(2));

    simulation.nodes(group_list);
    // console.log("group_list after:");
    // console.log(group_list);

    return group_list;
}


// function createSimpleForcedLayout(group_list, widthHalf, heightHalf) {
//
//     let center_force = d3.forceCenter(widthHalf+widthHalf, heightHalf*2);
//     let radius = 10;
//
//     group_list.reverse();
//
//     let simulation = d3.forceSimulation()
//         .force('charge_force', d3.forceManyBody())
//         .force('center_force', center_force)
//         .force('box_force', box_force)
//         .force('collision', d3.forceCollide().strength(1).radius(function (d) {
//             return radius
//         }).iterations(2))
//         .nodes(group_list)
//         .on("end", computeReadability);
//
//     function box_force() {
//         for (let i = 0, n = group_list.length; i < n; ++i) {
//             curr_node = group_list[i];
//             curr_node.x = Math.max(radius, Math.min(widthHalf - radius, curr_node.x));
//             curr_node.y = Math.max(radius, Math.min(heightHalf - radius, curr_node.y));
//         }
//     }
//
//     // simulation.nodes(group_list);
//     function computeReadability () {
//         let nodes = simulation.nodes();
//         console.log(nodes)
//     }
//
//     return group_list;
// }


function createDiagonalLayout(group_list, originalSizes = null) {
    let posX = 25;
    let posY = 25;
    let rad = 0;
    // console.log(group_list);
    let useOriginalSize = originalSizes !== null ? true : false;
    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = posX;
        group_list[i].y = posY;

        rad = useOriginalSize ? originalSizes[i].values.length : group_list[i].values.length;
        if (rad < 40) rad = 40;
        posX = posX - rad / 12.5;
        posY = posY - rad / 12.5;
    }
    return group_list;
}

function createMatrixLayout(group_list, asc = false) {

    let border = 22;
    let posX = border;
    let posY = border;
    let grainX = (2 * border) / 3;
    // currently hardcoded grid cell coordinates TODO extend to dynamic grid
    let gridPositionArray = new Array(
        {x: 22, y: 22},
        {x: 7.333333333333334, y: 22},
        {x: -7.333333333333332, y: 22},
        {x: -22, y: 22},
        {x: 22, y: 7.333333333333334},
        {x: 7.333333333333334, y: 7.333333333333334},
        {x: -7.333333333333332, y: 7.333333333333334},
        {x: -22, y: 7.333333333333334},
        {x: 22, y: -7.333333333333332},
        {x: 7.333333333333334, y: -7.333333333333332},
        {x: -7.333333333333332, y: -7.333333333333332},
        {x: -22, y: -7.333333333333332},
        {x: 22, y: -22},
        {x: 7.333333333333334, y: -22}
    );
    // group_list = shuffle(group_list);
    group_list = group_list.sort(asc ? compareArrayBySizeAsc : compareArrayBySizeDesc);

    console.log(group_list)

    for (var i = 0; i < group_list.length; i++) {
        group_list[i].x = gridPositionArray[i].x;
        group_list[i].y = gridPositionArray[i].y;
        //
        // if ((posX - grainX) < -border) {
        //     posX = border;
        //     posY = posY - grainX;
        // }
        // else {
        //     posX = posX - grainX;
        // }
    }
    return group_list;
}

function createCircularLayout(group_list, superlayer) {

    // console.log(group_list);
    // console.log(superlayer);

    group_list.forEach(function (d) {
        superlayer.forEach(function (sd) {
            if (d.key === sd.key) {
                d.values = sd.values;
            }
        })
    });

    group_list.sort(function (one, other) {
        //a - b is
        //   0 when elements are the same
        //  >0 when a > b
        //  <0 when a < b
        return one.values.length - other.values.length;
    });

    let fraction = (2 * Math.PI) / group_list.length;
    let current_pos = 0;
    let r = 20;
    let posX = r * Math.cos(current_pos);
    let posY = r * Math.sin(current_pos);

    // for (var i = 0; i < group_list.length; i++) {
    //     group_list[i].x = posX;
    //     group_list[i].y = posY;
    //
    //     current_pos += fraction;
    //     posX = r * Math.cos(current_pos);
    //     posY = r * Math.sin(current_pos);
    // }

    group_list.forEach(function (d) {
        d.x = posX;
        d.y = posY;

        current_pos += fraction;
        posX = r * Math.cos(current_pos);
        posY = r * Math.sin(current_pos);
    })

    // console.log(group_list);

}

function createSpiralLayout(centerX, centerY, radius, group_list) {
    let sides = group_list.length,
        coils = 2,
        rotation = 2 * (Math.PI / 180);

    // How far to step away from center for each side.
    let awayStep = radius / sides;
    // let awayStep = 1.2;

// How far to rotate around center for each side.
    let aroundStep = coils / sides;// 0 to 1 based.

// Convert aroundStep to radians.
    let aroundRadians = aroundStep * (Math.PI / 180);
    let new_time = [];

    // sort group by years
    group_list.sort(function (a, b) {
        return a.year == b.year ? 0 : +(a.year > b.year) || -1;
    });


    // For every side, step around and away from center.
    // for (let i = 0; i < sides; i++) {
    //     // How far away from center
    //     let away = (i * awayStep);
    //     // let away = (i + 0.1);
    //
    //     // How far around the center.
    //     let around = i + aroundRadians * rotation;
    //
    //     // console.log(away/);
    //
    //     // Convert 'around' and 'away' to X and Y.
    //     let x = centerX + Math.sin(around) * (Math.sqrt(away) * 6);
    //     let y = centerY + Math.cos(around) * (Math.sqrt(away) * 6);
    //
    //     new_time.push({x: x, y: y, data: group_list[i]});
    //
    //     // console.log(group_list[i]);
    //     // group_list[i].x = x;
    //     // group_list[i].y = y;
    // }


    // // For every side, step around and away from center.
    for (let i = 0; i < sides; i++) {
        // How far away from center
        let away = (i * awayStep);
        // let away = (i + 0.1);

        // How far around the center.
        let around = i + aroundRadians * rotation;

        // Convert 'around' and 'away' to X and Y.
        let x = centerX + Math.sin(around) * away;
        let y = centerY + Math.cos(around) * away;

        new_time.push({x: x, y: y, data: group_list[i]});

        // console.log(group_list[i]);
        // group_list[i].x = x;
        // group_list[i].y = y;
    }


    // for (let i = 0; i < sides; i++) {
    //     // // How far away from center
    //     // let away = (i * awayStep);
    //     var theta = 2.39998131 * i;
    //     // let away = (i + 0.1);
    //     //
    //     // // How far around the center.
    //     // let around = i + aroundRadians * rotation;
    //     //
    //     // // Convert 'around' and 'away' to X and Y.
    //     // let x = centerX + Math.sin(around) * away;
    //     // let y = centerY + Math.cos(around) * away;
    //
    //     let away = 3.5 * Math.sqrt(theta);
    //
    //     let x = centerX + Math.cos(theta) * away;
    //     let y = centerY + Math.sin(theta) * away;
    //
    //     //
    //     new_time.push({x: x, y: y, data: group_list[i]});
    //
    // }


    // console.log(x0);
    return new_time;
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

function getRadScale(radius, min = 0, max = 94, height = 1000) {

    let x = d3.scaleLinear()
        .domain([min, max])
        .range([0, (height / 4)]);
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

function documentReady(callback) {
    // in case the document is already rendered
    if (document.readyState != 'loading') callback();
    // modern browsers
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
    // IE <= 8
    else document.attachEvent('onreadystatechange', function () {
            if (document.readyState == 'complete') callback();
        });
}

function getUrlQueryByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize)
            R.push(this.slice(i, i + chunkSize));
        return R;
    }
});


function getDynamicTimeAxis(start, end, labelCount) {
    //check if the start and end is day, month, or year

    let dateArray = d3.scaleTime()
        .domain([new Date(start), new Date(end)])
        .ticks((d3.timeHour, labelCount))

    // console.log(dateArray)

}

function randomIntFromInterval(min, max) // min and max included
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}