/**
 * Created by simba on 06/04/2017.
 */
(function () {
    var timeBrush = {};
    var dateRange = [new Date(1902, 7, 1), new Date(2017, 7, 15) - 1];

    var margin = {top: 10, right: 40, bottom: 40, left: 40},
        width = 120 - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom;

    var y = d3.scaleTime() //todo: pass the date range from datasets for polycube
    //            .domain([new Date(2002, 7, 1), new Date(2013, 7, 15) - 1])
        .domain(dateRange)
        .rangeRound([height, 0]);

    x = d3.scaleLinear().range([height, 0]);

    var brush = d3
        .brushY()
        .extent([[0, 0], [width, height]])
        .on("end", brushended);

    timeBrush.init = function () {

        var svg = d3.select("#timeLine")
            .style("position", "relative")
            .style("z-index", "999")
            .style("width", "150px")
            .style("top", (-100) + "px")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //y axis
        svg.append("g")
            .attr("class", "axis2 axis--y2")
            .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .call(d3.axisLeft(y)
                .ticks(d3.timeMonth, 12)
                .tickSize(-width)
                .tickFormat(function () {
                    return null;
                }))
            .selectAll(".tick")
            .classed("tick--minor", function (d) {
                return d.getHours();
            });

        svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(d3.axisLeft(y)
                .tickPadding(6))
            .attr("text-anchor", null)
            .selectAll("text")
            .attr("x", 6);

        svg.append("g")
            .attr("class", "brush")
            .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .call(brush);
    };

    var datasets = [0, 45, 2, 8, 0, 45, 2, 100, 400, 8, 7, 100, 400, 8, 7];

    function brushended() {
        if (!d3.event.sourceEvent) return; // Only transition after input.
        if (!d3.event.selection) return; // Ignore empty selections.
        var d0 = d3.event.selection.map(y.invert),
            d1 = d0.map(d3.timeDay.round);
        //
        // var d0 = d3.event.selection.map(x.invert),
        //     d1 = d0.map(d3.timeDay.round);

        // If empty when rounded, use floor & ceil instead.
        // if (d1[0] >= d1[1]) {
        //     d1[0] = d3.timeDay.floor(d0[0]);
        //     d1[1] = d3.timeDay.offset(d1[0]);
        // }

        // d3.select(this).transition().call(d3.event.target.move, d1.map(x));
        d3.select(this).transition().call(d3.event.target.move, d1.map(y));

        var range = d3.brushSelection(this)
            .map(y.invert);

        // polyCube.drawElements(datasets, range[1], range[0]);
        // polyCube.animate();

        // polyCube.timeStart(range[1]);
        // polyCube.timeStop(range[0]);

        console.log(polyCube.timeStart(range[1]))
    }

    function drawPolycube(parameters) {
        if (parameters === undefined) parameters = {};
        var from = parameters["from"] || "Tue Aug 06 2013 19:21:49 GMT+0100 (BST)";
        var to = parameters["to"] || "Thu Aug 08 2013 21:22:54 GMT+0100 (BST)";

        // console.log(from);
        // console.log(to);
    }

    window.timeBrush = timeBrush;
}());