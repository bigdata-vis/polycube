/**
 * Created by simba on 06/04/2017.
 *  * addint data to time brush
 * http://blockbuilder.org/mbostock/4349545
 * move dateExtent to the main data entry point
 */

(function () {


    setTimeout(function () {
        if (window.dateTimeEx) {
            continuous("#timeLine");
        }
    }, 1000);

// create continuous color legend
    function continuous(selector_id) {

        let colorscale = d3.scaleSequential(d3.interpolateViridis)
        // .domain([0, 300]);
            .domain(window.dateTimeEx);

        // var legendheight = 400,
        var margin = {top: 10, right: 60, bottom: 10, left: 2},
            legendheight = window.innerHeight - (margin.top *2),
            legendwidth = 80;

        var canvas = d3.select(selector_id)
            .style("height", legendheight + "px")
            .style("width", legendwidth + "px")
            .style("position", "absolute")
            .style('left', '10px')
            .style('top', window.innerHeight - legendheight - margin.bottom + 'px')
            .append("canvas")
            .attr("height", legendheight - margin.top - margin.bottom)
            .attr("width", 1)
            .style("height", (legendheight - margin.top - margin.bottom) + "px")
            .style("width", (legendwidth - margin.left - margin.right) + "px")
            // .style("border", "1px solid #000")
            .style("position", "absolute")
            .style("top", (margin.top) + "px")
            .style("left", (margin.left) + "px")
            .node();

        var ctx = canvas.getContext("2d");

        var legendscale = d3.scaleLinear()
            .range([ legendheight - margin.top - margin.bottom, 1])
            .domain(colorscale.domain());

        // let legendTime =  d3.scaleTime() //todo: pass the date range from datasets for polycube
        //     .domain(window.dateTimeEx)
        //     .rangeRound([legendheight, 0]);

        // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
        var image = ctx.createImageData(1, legendheight);
        d3.range(legendheight).forEach(function(i) {
            // var c = d3.rgb(colorscale(legendscale.invert(i)));
            var c = d3.rgb(colorscale(legendscale.invert(i)));
            image.data[4*i] = c.r;
            image.data[4*i + 1] = c.g;
            image.data[4*i + 2] = c.b;
            image.data[4*i + 3] = 255;
        });
        ctx.putImageData(image, 0, 0);

        var legendaxis = d3.axisRight()
            .scale(legendscale)
            .tickSize(6)
            .ticks(18)
            .tickFormat(function (d) {
                // console.log(d)
                return d.toString();
            });

        var svg = d3.select(selector_id)
            .append("svg")
            .attr("height", (legendheight) + "px")
            .attr("width", (legendwidth) + "px")
            .style("position", "absolute")
            .style("left", "0px")
            .style("top", "0px");

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
            .call(legendaxis);
    };
}());
