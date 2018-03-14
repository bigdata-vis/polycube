/**
 * Created by simba on 06/04/2017.
 *  * addint data to time brush
 * http://blockbuilder.org/mbostock/4349545
 * move dateExtent to the main data entry point
 */
(function () {

    'use strict';


    let timeBrush = {};
    let parse5 = d3.timeParse("%Y");
    let format2 = d3.timeFormat("%Y");
    let formatDate = d3.timeFormat("%d %b %Y");
    let parse4 = d3.timeParse("%Y-%m-%dT00:00:00Z");
    var genre;
    let chosenData;
    let checkSelect = false;
    let newallData = window.data;
    var rightPane = document.getElementById('right-pane');

    //Note: data fetching is done each time the function is ran
    //as d3.csv is replaced by tabletop.js request to get data each time
    //from google spreadsheet

    //SVG setup
    const margin = {top: 40, right: 40, bottom: 40, left: 40},
        // width = 550 - margin.left - margin.right,
        width = rightPane.offsetWidth - margin.left - margin.right,
        // height = 480 - margin.top - margin.bottom;
        height = rightPane.offsetHeight / 2 - margin.top - margin.bottom;

    //set up svg
    const svg = d3.select("#dotPlot")
        .style("top", (80) + "px")
        // .style("right", (-60) + "px")
        .style("position", "relative")
        .append("svg")
        .style("z-index", "999")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const t = d3.transition()
        .duration(1000);

    const dataFile = "/data/dotplot.csv";

    //number of bins for histogram
    const nbins = 36;

    // const nbins = 72;

    function initDotPlot() {

        //x scales
        const x = d3.scaleLinear()
            .rangeRound([0, width])
            .nice()
            .domain([2, 11]);


        // Get the data
        // d3.csv(dataFile, function (error, allData) {


        var allData = window.data;


        allData.forEach(function (d) {

            d.Name = d.IU_Archives_Number;
            d.Value = +d.unix;

            // d.Name = d.Name;
            // d.Value = +d.Value;
        });

        const dataExt = d3.extent(allData, function (d) {
            return d.Value;
        });
        const [min, max] = d3.extent(allData, function (d) {
            return d.Value;
        });

        x.domain([min, max]);

        const thresholds = d3.range(min, max, (max - min) / nbins);

        let data = allData;

        //histogram binning
        const histogram = d3.histogram()
        // const histogram = d3.layout.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(nbins))
            // .thresholds(thresholds)
            .value(function (d) {
                return d.Value;
            });

        //binning data and filtering out empty bins
        const bins = histogram(data).filter(d => d.length > 0);

        //g container for each bin
        let binContainer = svg.selectAll(".gBin")
            .data(bins);

        binContainer.exit().remove();

        let binContainerEnter = binContainer.enter()
            .append("g")
            .attr("class", "gBin")
            // .attr("transform", d => `translate(${x(d.x0)}, ${height})`);
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + height + ")"
            });

        //need to populate the bin containers with data the first time
        binContainerEnter.selectAll("dotplot")
            .data(d => d.map((p, i) => {

                // cons
                return {
                    City_and_State: p.City_and_State,
                    Date: p.Date,
                    Description_from_Slide_Mount: p.Description_from_Slide_Mount,
                    Image_URL: p.Image_URL,
                    idx: i,
                    name: p.Name,
                    value: p.Value,
                    radius: (x(d.x1) - x(d.x0)) / 9
                }
            }))
            .enter()
            .append("circle")
            .attr("class", "dotplot")
            .attr("cx", 0) //g element already at correct x pos
            .attr("cy", function (d) {
                return -d.idx * 2 * d.radius - d.radius;
            })
            .attr("r", 0)
            // .on("mouseover", tooltipOn)
            .on("click", tooltipOn)
            .on("mouseout", tooltipOff)
            .transition()
            .duration(500)
            .attr("r", function (d) {
                return (d.length == 0) ? 0 : d.radius;
            });

        binContainerEnter.merge(binContainer)
        // .attr("transform", d => `translate(${x(d.x0)}, ${height})`)
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + height + ")"
            });

        //enter/update/exit for circles, inside each container
        let dots = binContainer.selectAll("dotplot")
            .data(d => d.map((p, i) => {
                return {
                    City_and_State: p.City_and_State,
                    Date: p.Date,
                    Description_from_Slide_Mount: p.Description_from_Slide_Mount,
                    Image_URL: p.Image_URL,
                    idx: i,
                    name: p.Name,
                    value: p.Value,
                    radius: (x(d.x1) - x(d.x0)) / 9
                }
            }));

        //EXIT old elements not present in data
        dots.exit()
            .attr("class", "exit")
            .transition(t)
            .attr("r", 0)
            .remove();

        //UPDATE old elements present in new data.
        dots.attr("class", "update");

        //ENTER new elements present in new data.
        dots.enter()
            .append("circle")
            .attr("class", "dotplot")
            .attr("cx", 0) //g element already at correct x pos
            .attr("cy", function (d) {
                return -d.idx * 2 * d.radius - d.radius;
            })
            .attr("r", 0)
            .merge(dots)
            // .on("mouseover", tooltipOn)
            .on("click", tooltipOn)
            .on("mouseout", tooltipOff)
            .transition()
            .duration(500)
            .attr("r", function (d) {
                return (d.length == 0) ? 0 : d.radius;
                // })
            });//d3.csv
    }

    function tooltipOn(d) {
        //clean up all highlightDot
        d3.selectAll(".highlightDot").classed("highlightDot", false);
        d3.selectAll('.brownDot').classed("brownDot", false);
        d3.selectAll('.highlight').classed("highlight", false);

        //x position of parent g element
        // let gParent = d3.select(this.parentElement);
        // let translateValue = gParent.attr("transform");
        //
        // let gX = translateValue.split(",")[0].split("(")[1];
        // let gY = height + (+d3.select(this).attr("cy") - 50);
        //
        // d3.select(this)
        //     .classed("selected", true);
        // tooltip.transition()
        //     .duration(200)
        //     .style("opacity", .9);
        // // tooltip.html(d.name + "<br/> (" + d.value + ")")
        // tooltip.html(d.name + "<br/> (" + new Date(d.value * 1000) + ")")
        //     .style("right", gX + "px")
        //     .style("top", gY + 300 + "px");

        d3.select("#dataImage")
            .attr("src", d.Image_URL);

        d3.select("#textTitle")
            .html("<strong<p>" + d.Description_from_Slide_Mount + "</p>" +
                "<span class='date'>Date : " + formatDate(parse4(d.Date)) + " </span> <br>" +
                "<span class='location'>Location : " + d.City_and_State + "</span> <br>"
            );

        let selectedData = window.data.filter(function (p) {
            // console.log(d)
            if (p.IU_Archives_Number === d.name) {
                return p;
            }
        });

        //delay highlight to refresh cube
        // polyCube.updatePC(window.data);
        polyCube.highlightNodes(selectedData);

        //highlight dotted selection
        // d3.select(this).classed("brownDot", true);
        // d3.select(this).classed("highlightDot", true);

        d3.select(this).classed("highlight", true);

    }//tooltipOn

    function tooltipOff(d) {
        d3.select(this)
            .classed("selected", false);
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }//tooltipOff

    setTimeout(function () {
        if (window.data) {
            initDotPlot();
        }
    }, 1500);

    /**
     * animate with setTimeout
     * https://stackoverflow.com/questions/37728184/settimeout-method-inside-a-while-loop
     */

}());
