/**
 * Created by simba on 06/04/2017.
 */
(function () {
    var timeBrush = {};
    var dateRange = [new Date(1902, 7, 1), new Date(2017, 7, 15) - 1];

    var margin = {top: 40, right: 10, bottom: 40, left: 40},
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom;

    var svg = d3.select("#timeLine")
        .style("position", "relative")
        .style("z-index", "99")
        .style("top", (0) + "px")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("%Y-%m-%d");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(x),
        yAxis = d3.axisLeft(y);

    var zoom = d3.zoom()
        .scaleExtent([1, 32])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return x(d.date);
        })
        .y0(height)
        .y1(function (d) {
            return y(d.price);
        });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    console.log(dateRange);

    function updatePrices(min_id) {

        x.domain(d3.extent(data, function (d) {
//            console.log(d);
            return d.date;
        }));
        y.domain([0, d3.max(data, function (d) {
            return d.price;
        })]);

        //remove old paths and axis
        d3.selectAll(".area").remove();
        d3.selectAll(".axis").remove();

        g.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        g.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

        var d0 = new Date(2016, 7, 1),
            d1 = new Date(2016, 12, 1);

        // Gratuitous intro zoom!
        svg.call(zoom).transition()
            .duration(1500)
            .call(zoom.transform, d3.zoomIdentity
                .scale(width / (x(d1) - x(d0)))
                .translate(-x(d0), 0));
    }

    updatePrices("STATES' AVERAGE");

    function zoomed() {
        var t = d3.event.transform, xt = t.rescaleX(x);
        g.select(".area").attr("d", area.x(function (d) {
            return xt(d.date);
        }));
        g.select(".axis--x").call(xAxis.scale(xt));
    }

    return timeBrush;
}());