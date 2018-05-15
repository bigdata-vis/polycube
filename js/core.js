THREE.Object3D.prototype.clear = function(){
    var children = this.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        child.clear();
        this.removeChild(child);
    }
};

Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
};

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}


//points inside sphere
// function randomSpherePoint(x0,y0,z0,radius){
//     var u = Math.random();
//     var v = Math.random();
//     var theta = 2 * Math.PI * u;
//     var phi = Math.acos(2 * v - 1);
//     var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
//     var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
//     var z = z0 + (radius * Math.cos(phi));
//     return [x,y,z];
// }

//https://stackoverflow.com/questions/5531827/random-point-on-a-given-sphere
function randomSpherePoint(x0,y0,z0,radius){
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    // var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    var y = y0;
    var z = z0 + (radius * Math.cos(phi));
    return [x,y,z];
}
