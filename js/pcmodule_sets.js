/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const SWITCH_SCALE_CUBE = true;

  const NUMBER_OF_LAYERS = 10;
  const DOMAIN_RANGE = [0, NUMBER_OF_LAYERS];
  const CUBE_SIZE = 500;
  const CUBE_SIZE_HALF = CUBE_SIZE / 2;
  const LAYER_SIZE = 50;

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([CUBE_SIZE, CUBE_SIZE]);
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
  let _cubeScale = null;
  let _nodes;
  let _root = null;

  pCube.drawSets = (dataset) => {

    pCube.sets_data = {};

    // time
    let minDate = d3.min(dataset.parsedData.map(x => x.time));
    let maxDate = d3.max(dataset.parsedData.map(x => x.time));
    let range = d3.scaleLinear().domain([minDate, maxDate]).range(DOMAIN_RANGE);
    console.debug(minDate, maxDate, range, range(minDate), range(maxDate), Math.floor(range(1000)));

    // cube scale
    const itemsCount = dataset.parsedData.length;
    _cubeScale = d3.scaleLinear().domain([0, itemsCount]).range([0, CUBE_SIZE]);

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
    for (var k = 1; k < NUMBER_OF_LAYERS; k++) {
      pCube.sets_data[k] = _.mergeWith({}, pCube.sets_data[k], pCube.sets_data[k - 1], customizer);
    }
    console.log(pCube.sets_data[NUMBER_OF_LAYERS - 1]["Blasinstrument"].length, pCube.sets_data[NUMBER_OF_LAYERS]["Blasinstrument"].length);

    const dy = LAYER_SIZE; // size between the layers
    pCube.getCube().children.filter(x => x.name === 'seg').forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let count = Object.keys(pCube.sets_data[idx]).reduce((o, x) => { return o + pCube.sets_data[idx][x].length || 0 }, 0);
        let cubeSize = SWITCH_SCALE_CUBE ? _cubeScale(count) : CUBE_SIZE;
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.sets_data, idx);
        // drawBox("test", 50, 50, 100, 200, 300, p);
        _nodes.forEach((n, idx) => {
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (idx < 1000) {
            //drawBox(n.data.name, n.x0, n.y0, w, 50, d, p, count);
            drawBoxGL(n.data.name, n.x0, n.y0, w, LAYER_SIZE, d, p, count);
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
    if (!dataset[layerNumber]) {
      return;
    }

    let data = {
      name: 'tree',
      children: Object.keys(dataset[NUMBER_OF_LAYERS]).map(key => {
        return { name: key };
      })
    };
    if (!_root) { // init calculation with the biggest collection items 
      _root = d3.hierarchy(data);
      _root = _root.sum(function (d) { return d.name !== 'tree' ? dataset[NUMBER_OF_LAYERS][d.name].length : null; })
        .sort(function (a, b) { return b.height - a.height || a.data.name.localeCompare(b.data.name); });
      console.debug(_root);
    }
    _root = _root.sum(function (d) { return d.name !== 'tree' ? dataset[layerNumber][d.name].length : null; })
      .sort(function (a, b) { return b.height - a.height || a.data.name.localeCompare(b.data.name); });
    _nodes = _tmap(_root).leaves();
    console.debug(layerNumber, _root);
    return _nodes;
  };

  /**CSS3D Scene
   * Cube Sides
   *6 sided cube creation with CSS3D, div and then added to cube group object
   */
  const drawBox = (setName, x, z, width, height, depth, layerPosition, layerItemCount) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = SWITCH_SCALE_CUBE ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF; 

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
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;
    pCube.getCube().add(box);
  };


  const drawBoxGL = (setName, x, z, width, height, depth, layerPosition, layerItemCount) => {
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = SWITCH_SCALE_CUBE ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF; 

    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshBasicMaterial({ color: _colorScale(setName) });
    let set = new THREE.Mesh(geometry, material);
    set.name = setName;
    set.userData = setName;


    set.position.x = x - cubesize_per_items + w; // -150 + node.x0 + (w / 2);
    set.position.z = z - cubesize_per_items + d; // -150 + node.y0 + (d / 2);
    set.position.y = layerPosition.y + h; // y + height / 2;
    pCube.getGLBox().add(set);
  };


})(window.polyCube);