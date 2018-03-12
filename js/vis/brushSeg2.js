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
    var genre;
    let chosenData;
    let checkSelect = false;
    let rightPane = document.getElementById('right-pane');


    Date.prototype.addMonths = function (m) {
        var d = new Date(this);
        var years = Math.floor(m / 12);
        var months = m - (years * 12);
        if (years) d.setFullYear(d.getFullYear() + years);
        if (months) d.setMonth(d.getMonth() + months);
        return d;
    };

    function init() {
        let dateRange = [new Date(window.dateExUnix[0] * 1000), new Date(window.dateExUnix[1] * 1000)]; //Cushman Todo: Manual Change

        let margin = {top: 20, right: 0, bottom: 50, left: 0},
            width = 70 - margin.left - margin.right,
            height = rightPane.offsetWidth - margin.top - margin.bottom;

        let y = d3.scaleTime() //todo: pass the date range from datasets for polycube
            .domain(dateRange)
            .rangeRound([height, 0]);

        let x = d3.scaleLinear()
            .range([0, width - 10]);

        let data = window.data;
        x.domain([0, d3.max(count(), function (d) {
            return d.val;
        })]);

        // console.log(count())

        // define the area
        let area = d3.area()
            .y(d => {
                return y(new Date(d.date * 1000));
            })
            .x0(0)
            .x1(d => {
                return x(d.val);
            })
            .curve(d3.curveCardinal);

        let line = d3.line()
            .y(d => {
                return y(new Date(d.date * 1000))
            })
            .x(d => {
                return x(d.val);
            })
            .curve(d3.curveCardinal);


        let brush = d3
            .brushY()
            .extent([[0, 0], [width, height]])
            .on("end", brushened);


        let svg = d3.select("#timeLine")
        // .style("top", (100) + "px")
        // .style("right", (-60) + "px")
            .style("position", "relative")
            .append("svg")
            .style("z-index", "999")
            // .style("width", "100px")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //y axis2
        svg.append("g")
            .attr("class", "axis2 axis--y2")
            // .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .attr("transform", "translate(" + 0 + "," + 10 + ")")
            .call(d3.axisLeft(y)
                .ticks(d3.timeMonth)
                // .ticks(d3.timeYear) //khm
                .tickSize(-width/4)
                .tickFormat(function () {
                    return null;
                }))
            .selectAll(".tick")
            .classed("tick--minor", function (d) {
                return d.getYear();
            });

        //axis
        svg.append("g")
            .attr("class", "axis axis--y")
            // .attr("transform", "translate(" + margin.left + "," + 8 + ")")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(d3.axisLeft(y)
                    .tickFormat(function (date) {
                        if (d3.timeYear(date) < date) {
                            return d3.timeFormat('-----%b')(date);
                        } else {
                            return d3.timeFormat('-----%b%Y')(date);
                        }
                    })
                // .ticks(d3.timeMonth)
                // .tickPadding(6)
            )
            .attr("text-anchor", null)
            .selectAll("text")
            .attr("x", 0)
            // .attr("class", "timelineTick")
            // .attr("fill", "#ffffff");
            .attr("fill", function (d) {

                // let year = new Date(d).getFullYear();
                let year = (d / 1000).toFixed(0);
                let colorScale = window.colorScale;

                return colorScale(year)
            });
        // .classed('timelineTick', true);

        //area chart domain
        // svg.select(".axis2")
        //     .append("path")
        //     // .attr("fill", "#ed7019")
        //     // .attr("fill", "#ed7019")
        //     .attr("fill", "#7b7b7b")
        //     .attr("fill-opacity", 0.3)
        //     .attr("d", area(count()));

        // svg.select(".axis2").select(".domain")
        //     .attr("fill", "none")
        //     // .attr("stroke", "#ed7019")
        //     .attr("stroke", "#7b7b7b")
        //     .attr("stroke-width", "2")
        //     .attr("d", line(count()));

        //legend domain
        svg.select(".axis").select(".domain")
            .attr("fill", "none");
        //     .style("fill", "url(#gradient)");

        //brush
        svg.append("g")
            .attr("class", "brush")
            .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .call(brush)
            .append("text")
            .attr("class", "brush_count")
            .attr("x", function () {
                return 5;
            })
            // .attr("y", -20)
            .attr("dy", ".35em")
            .attr("stroke", "#8a8a8a")
            // .attr("stroke", "blue")
            .text(function (d) {
                return data.length;
            });

        //selectAllData function
        svg.selectAll(".selection")
            .on("contextmenu", seletAllData, true);

        // animate button
        let animateButton = svg.append("g")
            .attr("transform", "translate(" + 0 + "," + (height + 50 ) + ")")
            .attr("class", "animateButton");

        animateButton.append("rect")
            .attr("width", 40)
            .attr("height", 40)
            .attr("rx", 4)
            .style("fill", "#999a9a")
            .attr("fill-opacity", 0.3);
        // .on("click", function () {
        //     //animate on click
        //     animateTimer()
        // });

        animateButton.append("path")
            .attr("d", "M5 5 L5 35 L35 20 Z")
            .style("fill", "#8a8a8a")
            .style("stroke", "#8a8a8a");

        animateButton.on("click", function () {
            //animate on click
            animateTimer()
        });

        //select options
        let select = d3.select("#timeLine")
            .append('select')
            .attr('class', 'select')
            .on('change', onChangeSelect);

        select.selectAll('option')
            .data(genre).enter()
            .append('option')
            .attr("value", function (d) {
                return d.title;
            })
            .text(function (d) {
                return d.title + ": " + d.count;
            });

        function brushened() {
            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.

            let d0 = d3.event.selection.map(y.invert),
                d1 = d0.map(d3.timeDay.round);

            // d3.select(this).transition().call(d3.event.target.move, d1.map(x));
            d3.select(this).transition().call(d3.event.target.move, d1.map(y));

            let range = d3.brushSelection(this)
                .map(y.invert);

            /**
             * TODO:Function to determine what data to use from the start and end date
             * @type {Array.<>}
             * window.data for each, if (time >= startDate and <= endDate, return)
             */
                // dateRange = [new Date(dateTestEx[0], 1, 1), new Date(dateTestEx[1], 1, 1) - 1];
                // init();
                // let start = +format2(range[1]);
                // let end = +format2(range[0]);

            let start = +(range[1] / 1000).toFixed(0);
            let end = +(range[0] / 1000).toFixed(0);

            // console.log(range);
            // console.log(+(range[1] / 1000).toFixed(0) + " to " + +(range[0] / 1000).toFixed(0));

            let selectedData = data.filter(function (d) {
                if (d.unix >= start && d.unix <= end) {
                    return d;
                }
            });
            polyCube.updatePC(selectedData);

            //update global variable
            chosenData = selectedData;

            //update text count
            d3.select(".brush_count")
                .text(selectedData.length);

            //update dotplot selection
            //cleanup
            d3.selectAll(".closeButton").remove();
            d3.selectAll('.highlightDot').classed("highlightDot", false);
            d3.selectAll('.brownDot').classed("brownDot", false);
            d3.selectAll('.dotplot')  //here's how you get all the nodes
                .each(function (dot) {
                    selectedData.map(d => {
                        if (d.IU_Archives_Number === dot.name) {
                            // console.log(d3.select(this));
                            d3.select(this).classed("highlightDot", true);
                            d3.select(this).classed("brownDot", true);
                        }
                    })
                });

            d3.selectAll(".brush")
                .append("g")
                .on("click", seletAllData, true)
                .classed("closeButton", true)
                .append("text")
                .attr("y", function () {
                    // let newy = d3.selectAll(".selection").attr("y");
                    // console.log(+d3.selectAll(".selection").attr("y") + 60)
                    return +d3.selectAll(".selection").attr("y") - 10;
                })
                .attr("x", 45)
                .attr("dy", ".35em")
                .attr("stroke", "#8a8a8a")
                .style("pointer-events", "visible")
                .style("cursor", "pointer")
                .text(function (d) {
                    return "X";
                })

        }

        function count() {
            let counts = {};
            let container = [];

            let cat = {};
            let categories = [];

            // console.log(data);

            for (let i = 0; i < data.length; i++) {

                counts[data[i].unix] = 1 + (counts[data[i].unix] || 0);
                // counts[data[i].time] = 1 + (counts[data[i].time] || 0);
                cat[data[i].Genre_1] = 1 + (cat[data[i].Genre_1] || 0);
            }

            let obj;
            let value;

            // console.log(counts);

            d3.keys(counts).forEach(function eachKey(key) {
                obj = +key;
                value = counts[key];
                container.push({date: obj, val: counts[key]});
            });

            d3.keys(cat).forEach(function eachKey(key) {
                categories.push({title: key, count: cat[key]});
            });

            genre = categories;

            return container.sort(function (x, y) {
                return d3.descending(+x.date, +y.date);
            });
        }

        function onChangeSelect() {
            let selectValue = d3.select(this).property('value');
            let defaultData = data;
            checkSelect = true;
            // console.log(data);

            //update select from brush list
            if (chosenData) {
                defaultData = chosenData;
            }


            let selectedData = defaultData.filter(function (d) {
                if (d.Genre_1 === selectValue) {
                    return d;
                }
            });

            //update data count
            d3.select(".brush_count")
                .text(selectedData.length);

            polyCube.updatePC(selectedData);

            if (!checkSelect) {
                chosenData = selectedData;
            }
        }

        /**
         * Animate brush from A to B
         * http://bl.ocks.org/timelyportfolio/5c136de85de1c2abb6fc
         */

        function seletAllData() {
            // polyCube.updatePC(data, 6);

            d3.event.preventDefault();

            let ustart = new Date(window.dateExUnix[0] * 1000);
            let uend = new Date(window.dateExUnix[1] * 1000);

            // console.log("Brushed");
            // console.log(ustart);
            // console.log(uend);


            //move brush
            svg.select(".brush").call(brush.move, [height - (height - y(uend)), height - (height - y(ustart))]);
            svg.select(".brush").call(brush.move, null);
        }


        // animate briush from a to b
        function animateBrush() {
            // our year will this.innerText
            console.log(this.innerText);

            // // define our brush extent to be begin and end of the year
            // brush.extent([new Date(this.innerText + '-01-01'), new Date(this.innerText + '-12-31')]);
            //
            // // now draw the brush to match our extent
            // // use transition to slow it down so we can see what is happening
            // // remove transition so just d3.select(".brush") to just draw
            // brush(d3.select(".brush").transition());
            //
            // // now fire the brushstart, brushmove, and brushend events
            // brush.event(d3.select(".brush").transition().delay(1000))
        }

        var animateTimer = function (times = 36, gap = 2) {
            var i = 1;
            let ustart = new Date(window.dateExUnix[0] * 1000).addMonths(-2);
            let uend = ustart.addMonths(gap);
            let defaultData = data;

            //update select from brush list
            if (chosenData) {
                defaultData = chosenData;
            }

            for (let x = 0; x < times; x++) {
                setTimeout(function () {

                    //start and end from chosenData extents
                    // let newStart = start += gap;
                    // let newEnd = end += gap;

                    //for brush labels only
                    let unewStart = ustart.addMonths(++i);
                    let unewEnd = uend.addMonths(+i);

                    //for unix value
                    let unixStart = +(unewStart / 1000).toFixed(0);
                    let unixEnd = +(unewEnd / 1000).toFixed(0);

                    // console.log(unixStart + " to " + unixEnd);

                    // let selectedData = defaultData.filter(function (d) {
                    //
                    //     if (d.time >= newStart && d.time <= newEnd) {
                    //         return d;
                    //     }
                    // });

                    let selectedData = defaultData.filter(function (d) {

                        if (d.unix >= unixStart && d.unix <= unixEnd) {
                            return d;
                        }
                    });

                    polyCube.updatePC(selectedData, 6);

                    //move brush
                    // svg.select(".brush").call(brush.move, [height - (height - y(new Date(newEnd, 1, 1))), height - (height - y(new Date(newStart, 1, 1)))]);
                    svg.select(".brush").call(brush.move, [height - (height - y(unewEnd)), height - (height - y(unewStart))]);

                }, 500 * x);
            }

        };
        // animateTimer();
    }

    setTimeout(function () {
        if (window.dateTestEx) {
            init();
        }
    }, 1000);

    /**
     * animate with setTimeout
     * https://stackoverflow.com/questions/37728184/settimeout-method-inside-a-while-loop
     */

}());
