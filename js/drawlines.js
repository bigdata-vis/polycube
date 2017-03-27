/**
 * Created by simba on 22/03/2017.
 */
// vertical line: down -> up
x1 = 150, y1 = 350,
    x2 = 150, y2 = 150;
drawnode(x1, y1);
drawnode(x2, y2);
drawline(x1, y1, x2, y2);

function drawnode(x, y) {

    var ele = ""
    var style = "";
    style += "position:absolute;";
    style += "z-index:100;"
    ele += "<div class='relNode' style=" + style + ">";
    ele += "<span> Test Node</span>"
    ele += "<div>"

    $('#rPaper').show();
    var node = $(ele).appendTo('#rPaper');
    var width = node.width();
    var height = node.height();

    var centerX = width / 2;
    var centerY = height / 2;

    var startX = x - centerX;
    var startY = y - centerY;

    node.css("left", startX).css("top", startY);

}

function drawline(ax, ay, bx, by) {
    console.log('ax: ' + ax);
    console.log('ay: ' + ay);
    console.log('bx: ' + bx);
    console.log('by: ' + by);


    if (ax > bx) {
        bx = ax + bx;
        ax = bx - ax;
        bx = bx - ax;
        by = ay + by;
        ay = by - ay;
        by = by - ay;
    }


    console.log('ax: ' + ax);
    console.log('ay: ' + ay);
    console.log('bx: ' + bx);
    console.log('by: ' + by);

    var angle = Math.atan((ay - by) / (bx - ax));
    console.log('angle: ' + angle);

    angle = (angle * 180 / Math.PI);
    console.log('angle: ' + angle);
    angle = -angle;
    console.log('angle: ' + angle);

    var length = Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
    console.log('length: ' + length);

    var style = ""
    style += "left:" + (ax) + "px;"
    style += "top:" + (ay) + "px;"
    style += "width:" + length + "px;"
    style += "height:1px;"
    style += "background-color:black;"
    style += "position:absolute;"
    style += "transform:rotate(" + angle + "deg);"
    style += "-ms-transform:rotate(" + angle + "deg);"
    style += "transform-origin:0% 0%;"
    style += "-moz-transform:rotate(" + angle + "deg);"
    style += "-moz-transform-origin:0% 0%;"
    style += "-webkit-transform:rotate(" + angle + "deg);"
    style += "-webkit-transform-origin:0% 0%;"
    style += "-o-transform:rotate(" + angle + "deg);"
    style += "-o-transform-origin:0% 0%;"
    style += "-webkit-box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, .1);"
    style += "box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, .1);"
    style += "z-index:99;"
    $("<div style='" + style + "'></div>").appendTo('#rPaper');
}