/**
 * Created by simba on 20/02/2017.
 */
(function () {
    d3.json("/js/config.json", function(error, config){
        if (error){console.error(error)}

        renderSpreadsheetData(config.public_spreadsheet)
    });
    function renderSpreadsheetData(url) {
        Tabletop.init({
            key: url,
            callback: draw,
            simpleSheet: true
        })
    }

    function draw(data) {
        //load data from google sheets
        var PCube = cube.vis("cubeBox");
        PCube.dataGsheet(data);
    }

    ////offline cube
    //var pCube = cube.vis("cubeBox");
    //pCube.dataCSV('/data/cubeData.csv')

    //d3.json("/data/kuntMuseum.json", function(error, data){
    //    if(error){console.error(error)}
    //
    //    //console.log(data.items.)
    //
    //});

})();