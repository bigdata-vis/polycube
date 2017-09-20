/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const NUMBER_OF_LAYERS = 10;

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([500, 500]);
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
  let _nodes;
  let _root = null;

  pCube.drawSets = (dataset) => {

    pCube.sets_data = {};

    // time
    let minDate = d3.min(dataset.parsedData.map(x => x.time));
    let maxDate = d3.max(dataset.parsedData.map(x => x.time));
    let range = d3.scaleLinear().domain([minDate, maxDate]).range([0, 10]);
    console.debug(minDate, maxDate, range, range(minDate), range(maxDate), Math.floor(range(1000)));

    // classifications
    const emptySets = emptySetStructure(dataset.parsedData);
    dataset.parsedData.forEach((val, idx) => {
      let layerNumber = val.time === null ? -1 : Math.floor(range(val.time));
      if (!pCube.sets_data[layerNumber]) {
        pCube.sets_data[layerNumber] = _.cloneDeep(emptySets);
      }
      val.term.forEach(v => {
        pCube.sets_data[layerNumber][v].push(val);
      });
    });

    // sum up all the layers form 1-10 so sets grow over time and are not split by the time-slots.
    // https://lodash.com/docs/4.17.4#mergeWith
    const customizer = (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
      }
    };
    for (var k = 1; k < 10; k++) {
      pCube.sets_data[k] =  _.mergeWith(pCube.sets_data[k], pCube.sets_data[k - 1], customizer);
    }
    console.log(pCube.sets_data[8]["Blasinstrument"].length, pCube.sets_data[9]["Blasinstrument"].length);

    const dy = 50; // size between the layers
    pCube.getCube().children.filter(x => x.name === 'seg').forEach((layer, idx) => {
      let p = layer.position;
      let nodes = doTreemapLayout(pCube.sets_data, idx);
      if (idx < NUMBER_OF_LAYERS) {
        // drawBox("test", 50, 50, 100, 200, 300, p);
        _nodes.forEach((n, idx) => {
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (idx < 1000) {
            drawBox(n.data.name, n.x0, n.y0, w, 50, d, p);
          }
        });
      }
    });
  };

  const emptySetStructure = (data) => {
    let emptySets = {};
    data.forEach((val, idx) => {
      val.term.forEach(v => {
        if (!emptySets[v]) {
          emptySets[v] = [];
        }
      });
    });
    return emptySets;
  }

  const doTreemapLayout = (dataset, layerNumber) => {
    let data = {
      name: 'tree',
      children: Object.keys(dataset[layerNumber]).map(key => {
        return { name: key };
      })
    };
    if (!_root) {
      _root = d3.hierarchy(data);
    }
    _root = _root.sum(function (d) { return d.name !== 'tree' ? dataset[layerNumber][d.name].length : null; })
      .sort(function (a, b) { return dataset[layerNumber][b.data.name].length - dataset[layerNumber][a.data.name].length; });
    _nodes = _tmap(_root).leaves();

    return _nodes;
  };

  /**CSS3D Scene
   * Cube Sides
   *6 sided cube creation with CSS3D, div and then added to cube group object
   */
  const drawBox = (setName, x, z, width, height, depth, layerPosition) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;

    const pos = [[w, 0, 0], [-w, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, d], [0, 0, -d]];
    const rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (var i = 0; i < 6; i++) {
      var element = document.createElement('div');
      element.classList = ['set-side', 'side-' + i, 'set', 'set-' + setName].join(' ')

      /**
       * Cube Width and height
       * @type {string}
       */
      if (i < 2) {
        element.style.width = depth + 'px';
        element.style.height = height + 'px';
      } else if (i < 4) {
        element.style.width = width + 'px';
        element.style.height = depth + 'px';
      } else {
        element.style.width = width + 'px';
        element.style.height = height + 'px';
      }

      /**
       *
       * @type {string}
       */
      // element.style.opacity = '0.3';
      element.style.border = "1px solid red";
      element.style.backgroundColor = _colorScale(setName);
      element.style.opacity = 0.4;

      /**
       * Create new CSS3D object side and add it to the cube group
       * get position from array of predefined cube rotation and position css3d matrix
       * @type {THREE.CSS3DObject}
       */
      var object = new THREE.CSS3DObject(element);
      object.position.fromArray(pos[i]);
      object.rotation.fromArray(rot[i]);
      object.name = setName;

      box.add(object);
    }
    box.position.y = layerPosition.y + h;
    box.position.x = x - 250 + w;
    box.position.z = z - 250 + d;
    pCube.getCube().add(box);
  }



})(window.polyCube);