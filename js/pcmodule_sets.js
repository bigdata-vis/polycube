/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const TREEMAP = 'treemap';
  const MATRIX = 'matrix';

  const SWITCH_SETS_DISPLAY = MATRIX;
  const SWITCH_SCALE_CUBE = true;

  const NUMBER_OF_LAYERS = pCube.dataSlices;
  const DOMAIN_RANGE_MAX = NUMBER_OF_LAYERS - 1;
  const DOMAIN_RANGE = [0, DOMAIN_RANGE_MAX];
  const CUBE_SIZE = 500;
  const CUBE_SIZE_HALF = CUBE_SIZE / 2;
  const LAYER_SIZE = CUBE_SIZE / NUMBER_OF_LAYERS;

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([CUBE_SIZE, CUBE_SIZE]);
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
  let _cubeScale = null;
  let _nodes;
  let _root = null;
  let _totalItemsCount = 0;

  pCube.drawSets = (options) => {

    pCube.sets_data = options;
    pCube.treemap_sets = {}; // data for treemap grouped by layerNumber.setname
    pCube.matrix_sets = {};

    // time
    let minDate = d3.min(options.parsedData.map(x => x.time));
    let maxDate = d3.max(options.parsedData.map(x => x.time));
    let yearScale = d3.scaleLinear().domain([minDate, maxDate]).range(DOMAIN_RANGE);
    console.info(minDate, maxDate, yearScale(minDate), yearScale(maxDate), Math.floor(yearScale(1000)));

    // TODO: update labels 
    let mi = new Date();
    mi.setFullYear(minDate);
    let ma = new Date();
    ma.setFullYear(maxDate);
    pCube.drawLabels({ //Todo: fix label with proper svg
      labelPosition: {
        x: CUBE_SIZE_HALF,//offset border
        y: -(CUBE_SIZE / 2),
        z: CUBE_SIZE_HALF
      },
      labelCount : 10,
      startDate: mi,
      endDate: ma
    });

    // cube scale
    const itemsCount = options.parsedData.length;
    _totalItemsCount = itemsCount;
    _cubeScale = d3.scaleLinear().domain([0, itemsCount]).range([0, CUBE_SIZE]);


    // do matrix and classification 
    const matrixStruct = emptyMatrixSetStructure(options.parsedData);
    const setsStruct = emptyTreemapSetStructure(options.parsedData);

    // classifications
    options.parsedData.forEach((val, idx) => {
      let layerNumber = val.time === null ? -1 : Math.floor(yearScale(val.time));
      if (!pCube.treemap_sets[layerNumber]) {
        pCube.treemap_sets[layerNumber] = _.cloneDeep(setsStruct);
      }
      if (!pCube.matrix_sets[layerNumber]) {
        pCube.matrix_sets[layerNumber] = _.cloneDeep(matrixStruct.matrix);
      }
      val.term.forEach(v => {
        pCube.treemap_sets[layerNumber][v].push(val);

        let setIdx = matrixStruct.setNames.indexOf(v);
        let repoIdx = matrixStruct.repoNames.indexOf(val.legalBodyID);
        pCube.matrix_sets[layerNumber][setIdx][repoIdx] += 1;
      });
    });

    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.log(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.log(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
    }

    // console.log("matrix_sets", pCube.matrix_sets);

    // sum up all the layers form 1-10 so sets grow over time and are not split by the time-slots.
    // https://lodash.com/docs/4.17.4#mergeWith
    const customizer = (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
      }
    };
    const arraySumUp = (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return _.zipWith(objValue, srcValue, (a, b) => a + b);
      }
    }
    for (var k = 1; k < NUMBER_OF_LAYERS; k++) {
      pCube.treemap_sets[k] = _.mergeWith({}, pCube.treemap_sets[k], pCube.treemap_sets[k - 1], customizer);
      pCube.matrix_sets[k] = _.mergeWith(pCube.matrix_sets[k], pCube.matrix_sets[k - 1], arraySumUp);
    }
    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.log(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.log(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
    }

    if (SWITCH_SETS_DISPLAY === TREEMAP) {
      drawTreemap();
    } else if (SWITCH_SETS_DISPLAY === MATRIX) {
      drawMatrix(matrixStruct);
    }
  };

  const drawTreemap = () => {
    const dy = LAYER_SIZE; // size between the layers
    pCube.getCube().children.filter(x => x.name === 'seg').forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let count = Object.keys(pCube.treemap_sets[idx]).reduce((o, x) => { return o + pCube.treemap_sets[idx][x].length || 0 }, 0);
        let cubeSize = SWITCH_SCALE_CUBE ? _cubeScale(count) : CUBE_SIZE;
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, idx);
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

  const drawMatrix = (matrixStruct) => {
    let xSplit = CUBE_SIZE / matrixStruct.setNames.length;
    let ySplit = CUBE_SIZE / matrixStruct.repoNames.length;

    pCube.getCube().children.filter(x => x.name === 'seg').forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        matrixStruct.setNames.forEach((s, setIdx) => {
          matrixStruct.repoNames.forEach((r, repoIdx) => {
            if (pCube.matrix_sets[idx][setIdx][repoIdx] > 0) {
              // drawBoxGL(matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, LAYER_SIZE, 20, p);
              const tc = pCube.matrix_sets[NUMBER_OF_LAYERS - 1][setIdx][repoIdx];
              const c = pCube.matrix_sets[idx][setIdx][repoIdx];
              const opacity = c / tc;
              drawBoxGL(matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, LAYER_SIZE, ySplit, p, _totalItemsCount, opacity);
              //drawBoxGL(matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, xSplit, xSplit, p, _totalItemsCount, opacity);
            }
          });
        });
      }
    });

  };

  const getTreemapLayerItemCount = (data) => {
    let count = 0;
    Object.keys(data).forEach(s => {
      count += data[s].length;
    });
    return count;
  };

  const getMatrixLayerItemCount = (data) => {
    return data.reduce((o, cur) => {
      return o + getMatrixLayerItemSetCount(cur);
    }, 0);
  };

  const getMatrixLayerItemSetCount = (data) => {
    return data.reduce((o1, cur1) => {
      return o1 + cur1;
    }, 0);
  };

  const emptyTreemapSetStructure = (data) => {
    let emptySets = {};
    data.forEach((val, idx) => {
      val.term.forEach(v => {
        if (!emptySets[v]) {
          emptySets[v] = [];
        }
      });
    });
    return emptySets;
  };

  const emptyMatrixSetStructure = (data) => {
    let setNames = []; // new Set();
    let repoNames = []; // new Set();
    let matrix = [];
    data.forEach((val, idx) => {
      if (repoNames.indexOf(val.legalBodyID) === -1) {
        repoNames.push(val.legalBodyID);
      }
      val.term.forEach(v => {
        if (setNames.indexOf(v) === -1) {
          setNames.push(v);
        }
      });
    });
    for (var i = 0; i < setNames.length; i++) {
      matrix[i] = [];
      for (var k = 0; k < repoNames.length; k++) {
        matrix[i][k] = 0;
      }
    }

    return {
      setNames,
      repoNames,
      matrix
    }
  };

  const doTreemapLayout = (dataset, layerNumber) => {
    if (!dataset[layerNumber]) {
      return;
    }

    let data = {
      name: 'tree',
      children: Object.keys(dataset[0]).map(key => {
        return { name: key };
      })
    };
    if (!_root) { // init calculation with the biggest collection items 
      _root = d3.hierarchy(data);
      _root = _root.sum(function (d) { return d.name !== 'tree' ? dataset[DOMAIN_RANGE_MAX][d.name].length : null; })
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


  const drawBoxGL = (setName, x, z, width, height, depth, layerPosition, layerItemCount, opacity) => {
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = SWITCH_SCALE_CUBE ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF;

    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshBasicMaterial({
      color: _colorScale(setName),
      transparent: opacity ? true : false,
      opacity: opacity || 1
    });
    let set = new THREE.Mesh(geometry, material);
    set.name = setName;
    set.userData = setName;


    set.position.x = x - cubesize_per_items + w; // -150 + node.x0 + (w / 2);
    set.position.z = z - cubesize_per_items + d; // -150 + node.y0 + (d / 2);
    set.position.y = layerPosition.y + h; // y + height / 2;
    pCube.getGLBox().add(set);
  };


})(window.polyCube);