var placeNames = [];

lido.forEach(function (d) {

    var placename = d.descriptiveMetadata["0"].eventWrap["0"].eventSet["0"].event["0"];

    if (placename !== undefined) {

        if (placename.eventPlace) {

            if (placename.eventPlace["0"].displayPlace) {
                var collections = d.administrativeMetadata["0"].recordWrap["0"].recordSource["0"].legalBodyID["0"]._;

                if (typeof placename.eventPlace["0"].displayPlace["0"] === 'object') { //check for object in music collection
                    placeNames.push("Collections" + collections); //collections
                    placeNames.push(placename.eventPlace["0"].displayPlace["0"]["_"]); //
                    //for items in the collection places

                    console.log(collections)
                } else {
                    placeNames.push("Collections " + collections); //collections
                    placeNames.push(placename.eventPlace["0"].displayPlace["0"]);

                    console.log(collections)
                }
            }
        }
    } else {
        console.log("no place name")
    }
});

console.log(placeNames);

var uniq = placeNames.reduce(function (a, b) {
    if (a.indexOf(b) < 0) a.push(b);
    return a;
}, []);

//        console.log(uniq);
download(uniq, "placeNames.txt", "text/plain");

function download(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}