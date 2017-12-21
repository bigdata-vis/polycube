/**
 * Created by simba on 06/04/2017.
 *  * addint data to time brush
 * http://blockbuilder.org/mbostock/4349545
 * move dateExtent to the main data entry point
 */
(function () {
    let timeBrush = {};
    let parse5 = d3.timeParse("%Y");
    let format2 = d3.timeFormat("%Y");
    var genre;
    let chosenData;
    let checkSelect = false;


    function init() {
        // console.log(window.dateTestEx);

        // let dateRange = [new Date(1977, 1, 1), new Date(1938, 1, 1) - 1]; //Cushman Todo: Manual Change
        let dateRange = [new Date(window.dateTestEx[0], 1, 1), new Date(window.dateTestEx[1], 1, 1) - 1]; //Cushman Todo: Manual Change


        let margin = {top: 40, right: 40, bottom: 140, left: 40},
            width = 120 - margin.left - margin.right,
            height = window.innerHeight - margin.top - margin.bottom;

        let y = d3.scaleTime() //todo: pass the date range from datasets for polycube
            .domain(dateRange)
            .rangeRound([height, 0]);

        let x = d3.scaleLinear()
            .range([0, width - 10]);

        let data = window.data;
        x.domain([0, d3.max(count(), function (d) {
            return d.val;
        })]);

        // define the area
        let area = d3.area()
            .y(d => {
                return y(new Date(d.date, 1, 1))
            })
            .x0(0)
            .x1(d => {
                return x(d.val);
            })
            .curve(d3.curveCardinal);


        let line = d3.line()
            .y(d => {
                return y(new Date(d.date, 1, 1))
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
            .style("position", "absolute")
            .style("z-index", "999")
            .style("width", "150px")
            .style("top", (30) + "px")
            .style("left", (-30) + "px")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //y axis2
        svg.append("g")
            .attr("class", "axis2 axis--y2")
            .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .call(d3.axisLeft(y)
                .ticks(d3.timeMonth)
                // .ticks(d3.timeYear) //khm
                .tickSize(-width)
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
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(d3.axisLeft(y)
                .ticks(d3.timeYear) //cushman
                .tickPadding(6)
            )
            .attr("text-anchor", null)
            .selectAll("text")
            .attr("x", 6)
            // .attr("class", "timelineTick")
            // .attr("fill", "#ffffff");
            .attr("fill", function (d) {
                let year = new Date(d).getFullYear();
                let colorScale = window.colorScale;
                // console.log(colorScale(year));
                return colorScale(year)
            })
            .classed('timelineTick', true);

        //area chart domain

        svg.select(".axis2")
            .append("path")
            // .attr("fill", "#ed7019")
            // .attr("fill", "#ed7019")
            .attr("fill", "#7b7b7b")
            .attr("fill-opacity", 0.3)
            .attr("d", area(count()));


        svg.select(".axis2").select(".domain")
            .attr("fill", "none")
            // .attr("stroke", "#ed7019")
            .attr("stroke", "#7b7b7b")
            .attr("stroke-width", "2")
            .attr("d", line(count()));


        //legend domain
        svg.select(".axis").select(".domain")
            .attr("fill", "none");
        //     .style("fill", "url(#gradient)");

        svg.append("g")
            .attr("class", "brush")
            .attr("transform", "translate(" + 0 + "," + margin.top + ")")
            .call(brush)
            .append("text")
            .attr("class", "brush_count")
            .attr("x", function () {
                return 5;
            })
            .attr("y", -20)
            .attr("dy", ".35em")
            .attr("stroke", "#8a8a8a")
            // .attr("stroke", "blue")
            .text(function (d) {
                return 778;
            });

        // animate button
        let animateButton = svg.append("g")
            .attr("transform", "translate(" + 0 + "," + (height + 50 ) + ")");

        animateButton.append("rect")
            .attr("width", 40)
            .attr("height", 40)
            .attr("rx", 4)
            .style("fill", "#999a9a")
            .attr("fill-opacity", 0.3)
            .on("click", function () {
                //animate on click
                animateTimer()
            });

        animateButton.append("path")
            .attr("d", "M5 5 L5 35 L35 20 Z")
            .style("fill", "#8a8a8a")
            .style("stroke", "#8a8a8a");

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
                d1 = d0.map(d3.timeMonth.round);

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
            let start = +format2(range[1]);
            let end = +format2(range[0]);

            // console.log(window.dateTestEx);

            let selectedData = data.filter(function (d) {
                if (d.time >= start && d.time <= end) {
                    return d;
                }
            });
            polyCube.updatePC(selectedData);

            //update global variable
            chosenData = selectedData;

            //update text count
            d3.select(".brush_count")
                .text(selectedData.length);
        }

        function count() {
            let counts = {};
            let container = [];

            let cat = {};
            let categories = [];

            for (let i = 0; i < data.length; i++) {
                counts[data[i].time] = 1 + (counts[data[i].time] || 0);
                cat[data[i].Genre_1] = 1 + (cat[data[i].Genre_1] || 0);
            }

            let obj;
            let value;

            d3.keys(counts).forEach(function eachKey(key) {
                obj = +key;
                value = counts[key];
                container.push({date: obj, val: counts[key]});
            });

            d3.keys(cat).forEach(function eachKey(key) {
                categories.push({title: key, count: cat[key]});
            });

            genre = categories;

            return container;
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

        var animateTimer = function (times = 17, gap = 1) {
            var i = 0;
            let start = window.dateTestEx[0] - gap;
            let end = start + gap;
            let defaultData = data;

            //update select from brush list
            if (chosenData) {
                defaultData = chosenData;
            }

            // while (i < times || function(){ /* callback */ return false;}) {
            // while (i < times) {
            //     (function (i) {
            //             setTimeout(function () {
            //
            //                 //start and end from chosenData extents
            //                 let newStart = start += gap;
            //                 let newEnd = end += gap;
            //
            //                 // console.log(newStart + ": " + newEnd)
            //                 // let selectedData = data.filter(function (d) {
            //                 let selectedData = defaultData.filter(function (d) {
            //                     if (d.time >= newStart && d.time <= newEnd) {
            //                         return d;
            //                     }
            //                 });
            //                 polyCube.updatePC(selectedData);
            //
            //                 //move brush
            //                 // svg.select(".brush").call(brush.move, [y0,y1]);
            //                 svg.select(".brush").call(brush.move, [height - (height - y(new Date(newEnd, 1, 1))), height - (height - y(new Date(newStart, 1, 1)))]);
            //
            //             }, 500 * i)
            //         })(i++);
            // }

            for (let x = 0; x < times; x++) {
                setTimeout(function (i) {

                    //start and end from chosenData extents
                    let newStart = start += gap;
                    let newEnd = end += gap;

                    // console.log(newStart + ": " + newEnd)
                    // let selectedData = data.filter(function (d) {
                    let selectedData = defaultData.filter(function (d) {
                        if (d.time >= newStart && d.time <= newEnd) {
                            return d;
                        }
                    });
                    polyCube.updatePC(selectedData);

                    //move brush
                    // svg.select(".brush").call(brush.move, [y0,y1]);
                    svg.select(".brush").call(brush.move, [height - (height - y(new Date(newEnd, 1, 1))), height - (height - y(new Date(newStart, 1, 1)))]);

                    //add one extra layer for full structure view
                    // if(x >= (times-1)){
                    //     // console.log(data)
                    //     polyCube.updatePC(data)
                    // }

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