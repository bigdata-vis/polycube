/**
 * Created by simba on 20/02/2017.
 */
(function () {
    d3.json("/js/config.json", function(error, config){
        if (error){console.error(error)}
        //console.log(config.public_spreadsheet);
        //var public_spreadsheet_url = config.public_spreadsheet;
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
        cube.vis("cubeBox").dataGsheet(data);
    }

})();