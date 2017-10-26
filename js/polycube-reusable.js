function PolyCube() {

    let pCube = {};
    
    class CubeProp {
        constructor(name, initVal = null, redigest = true, onChange = newVal => {
        }) {
            this.name = name;
            this.initVal = initVal;
            this.redigest = redigest;
            this.onChange = onChange;
        }
    }

    const env = { // Holds component state to use it to wipe the content in the Dom enviromment
        initialised: false,
        onFrame: () => {}
    };

    const exposeProp = [
        new CubeProp('width', window.innerWidth),
        new CubeProp('height', window.innerHeight),
        new CubeProp('dataSlices', 4)
    ];
    
    pCube.drawElement = function () {

        env.domElement.innerHTML = ""; //wipe scene compoenets on entry


    }

}