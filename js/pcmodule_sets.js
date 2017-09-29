/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const TREEMAP = 'treemap';
  const TREEMAP_FLAT = 'treemap_flat'; // TODO: treemap flat with lines between layers
  const MATRIX = 'matrix';

  const LINE_STYLE_CENTER = 'center';
  const LINE_STYLE_CORNER = 'corner';

  const SWITCH_SETS_DISPLAY = TREEMAP_FLAT;
  const SWITCH_SCALE_CUBE = true;
  const SWITCH_TREEMAP_FLAT_LINE_STYLE = LINE_STYLE_CORNER;
  const SWITCH_TREEMAP_RENDER_IN_WEBGL = false;


  const SELECTION_CLASS = ["Gemälde", "Gefäß", "Glyptik", "Schmuck", "Skulptur", "Zupfinstrument"]; // ["Gemälde", "Gefäß", "Glyptik", "Schmuck", "Skulptur", "Zupfinstrument"];
  const SELECTION_YEAR = [1000, 2000];

  const TREEMAP_PADDING = 0;
  const NUMBER_OF_LAYERS = pCube.dataSlices;
  const DOMAIN_RANGE_MAX = NUMBER_OF_LAYERS - 1;
  const DOMAIN_RANGE = [0, DOMAIN_RANGE_MAX];
  const CUBE_SIZE = 500;
  const CUBE_SIZE_HALF = CUBE_SIZE / 2;
  const LAYER_SIZE = CUBE_SIZE / NUMBER_OF_LAYERS;

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([CUBE_SIZE, CUBE_SIZE]).padding(TREEMAP_PADDING);
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
  let _cubeScale = null;
  let _nodes;
  let _root = null;
  let _totalItemsCount = 0;

  pCube.drawSets = (options) => {

    pCube.sets_data = options;
    pCube.sets_filtered_by_selection = SELECTION_CLASS && SELECTION_CLASS.length > 0 ? options.parsedData
      .filter(d => _.intersection(d.term, SELECTION_CLASS).length > 0)
      .filter(d => {
        if (SELECTION_YEAR && SELECTION_YEAR.length === 2) {
          return d.time >= SELECTION_YEAR[0] && d.time <= SELECTION_YEAR[1];
        }
        return true;

      })
      .map(d => {
        d.term = _.intersection(d.term, SELECTION_CLASS);
        return d;
      }) : options.parsedData;
    pCube.treemap_sets = {}; // data for treemap grouped by layerNumber.setname
    pCube.matrix_sets = {};

    // time
    let dateExt = d3.extent(pCube.sets_filtered_by_selection, d => d.time);
    let yearScale = d3.scaleLinear().domain([dateExt[0], dateExt[1]]).range(DOMAIN_RANGE);
    console.info(dateExt, yearScale(dateExt[0]), yearScale(dateExt[1]), Math.floor(yearScale(1000)));
    // pCube.dateTestEx(dateExt);

    // update labels 
    let mi = new Date();
    mi.setFullYear(dateExt[0]);
    let ma = new Date();
    ma.setFullYear(dateExt[1]);
    pCube.drawLabels({ //Todo: fix label with proper svg
      labelPosition: {
        x: CUBE_SIZE_HALF,//offset border
        y: -(CUBE_SIZE / 2),
        z: CUBE_SIZE_HALF
      },
      startDate: mi,
      endDate: ma
    });

    // cube scale
    const itemsCount = pCube.sets_filtered_by_selection.length;
    _totalItemsCount = itemsCount;
    _cubeScale = d3.scaleLinear().domain([0, itemsCount]).range([0, CUBE_SIZE]);


    // do matrix and classification 
    const matrixStruct = emptyMatrixSetStructure(pCube.sets_filtered_by_selection);
    const setsStruct = emptyTreemapSetStructure(pCube.sets_filtered_by_selection);

    for (var index = -1; index < NUMBER_OF_LAYERS; index++) {
      if (!pCube.treemap_sets[index]) {
        pCube.treemap_sets[index] = _.cloneDeep(setsStruct);
      }
      if (!pCube.matrix_sets[index]) {
        pCube.matrix_sets[index] = _.cloneDeep(matrixStruct.matrix);
      }
    }

    // classifications
    pCube.sets_filtered_by_selection.forEach((val, idx) => {
      let layerNumber = val.time === null ? -1 : Math.floor(yearScale(val.time));
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
    } else if (SWITCH_SETS_DISPLAY === TREEMAP_FLAT) {
      drawTreemapFlat();
    } else if (SWITCH_SETS_DISPLAY === MATRIX) {
      drawMatrix(matrixStruct);
    }
  };

  pCube.default_functions.push((duration) => {
    pCube.getCube().children.forEach(function (object, i) {
      if (object.name == 'set-layer') {
        var posTween = new TWEEN.Tween(object.position)
          .to({
            x: 0,
            y: 0,
            z: 0
          }, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();


        var rotate = new TWEEN.Tween(object.rotation)
          .to({ x: 0, y: 0, z: 0 }, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();
      }
    });
  });

  pCube.juxstaPose_functions.push((duration, width, height) => {
    pCube.getCube().children.forEach(function (object, i) {
      if (object.name == 'set-layer') {

        var reduceLeft2 = {
          x: ((object.userData.layerNumber % 5) * (width + 50)) - (width * 2),
          y: (-(Math.floor(object.userData.layerNumber / 5) % 5) * (width + 50)) + 400, //just another way of getting 550
          z: 0
        };

        var posTween = new TWEEN.Tween(object.position)
          .to(reduceLeft2, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();

        var rotate = new TWEEN.Tween(object.rotation)
          .to({ x: Math.PI / 2, y: 0, z: 0 }, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();
      }
    });

  });


  const drawTreemap = () => {
    pCube.getGLSegments().forEach((layer, idx) => {
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
          if (SWITCH_TREEMAP_RENDER_IN_WEBGL) {
            drawBoxGL(n.data.name, n.x0, n.y0, w, LAYER_SIZE, d, p, count);
          } else {
            drawBox(n.data.name, n.x0, n.y0, w, 50, d, p, count);
          }
        });
      }
    });
  };


  const drawTreemapFlat = () => {
    let linesContainer = new THREE.Object3D();
    let linesMemory = [];
    pCube.getGLSegments().forEach((layer, idx) => {

      let p = layer.position;
      let layerContainer = new THREE.Object3D();
      layerContainer.name = 'set-layer';
      layerContainer.userData = { layerNumber: idx };
      pCube.getCube().add(layerContainer);
      if (idx < NUMBER_OF_LAYERS) {

        let count = Object.keys(pCube.treemap_sets[idx]).reduce((o, x) => { return o + pCube.treemap_sets[idx][x].length || 0 }, 0);
        let cubeSize = SWITCH_SCALE_CUBE ? _cubeScale(count) : CUBE_SIZE;
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, idx);
        // drawBox("test", 50, 50, 100, 200, 300, p);
        _nodes.forEach(n => {

          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          let rect = drawRect(n.data.name, n.x0, n.y0, w, LAYER_SIZE, d, p, count);
          layerContainer.add(rect);
          if (!linesMemory[idx]) {
            linesMemory[idx] = {};
          }
          linesMemory[idx][n.data.name] = { rect, w, d };
          if (idx > 0) {
            let prevRect = linesMemory[idx - 1][n.data.name];
            if (prevRect) {
              if (SWITCH_TREEMAP_FLAT_LINE_STYLE === LINE_STYLE_CENTER) {
                drawLine(n.data.name, linesContainer,
                  new THREE.Vector3(rect.position.x, rect.position.y, rect.position.z),
                  new THREE.Vector3(prevRect.rect.position.x, prevRect.rect.position.y, prevRect.rect.position.z)
                );
              } else if (SWITCH_TREEMAP_FLAT_LINE_STYLE === LINE_STYLE_CORNER) {
                for (let k = 0; k < 4; k++) {
                  let tx = (w / 2), ty = (d / 2), ptx = (prevRect.w / 2), pty = (prevRect.d / 2);
                  if (k === 1) {
                    tx *= -1;
                    ptx *= -1;
                  } else if (k === 2) {
                    ty *= -1;
                    pty *= -1;
                  } else if (k === 3) {
                    tx *= -1;
                    ptx *= -1;
                    ty *= -1;
                    pty *= -1;
                  }
                  drawLine(n.data.name, linesContainer,
                    new THREE.Vector3(
                      rect.position.x + tx,
                      rect.position.y,
                      rect.position.z + ty
                    ),
                    new THREE.Vector3(
                      prevRect.rect.position.x + ptx,
                      prevRect.rect.position.y,
                      prevRect.rect.position.z + pty
                    )
                  );
                }
              }
            }
          }
        });
      }
    });
    pCube.getGLBox().add(linesContainer);
  };

  const drawMatrix = (matrixStruct) => {
    let xSplit = CUBE_SIZE / matrixStruct.setNames.length;
    let ySplit = CUBE_SIZE / matrixStruct.repoNames.length;

    pCube.getGLSegments().forEach((layer, idx) => {
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

  const drawRect = (setName, x, z, width, height, depth, layerPosition, layerItemCount) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = SWITCH_SCALE_CUBE ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF;

    const pos = [0, -h, 0];
    const rot = [r, 0, 0];

    var element = document.createElement('div');
    element.classList = ['set-side', 'set', 'set-' + setName].join(' ')

    element.style.width = width + 'px';
    element.style.height = depth + 'px';

    element.style.border = "1px solid red";
    element.style.backgroundColor = _colorScale(setName);
    element.style.opacity = 0.3;

    var object = new THREE.CSS3DObject(element);
    // object.position.fromArray(pos);
    object.rotation.fromArray(rot);
    object.name = setName;

    box.add(object);
    box.name = 'set-rect';

    box.position.y = layerPosition.y;
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;

    return box;
  };


  const drawLine = (setName, container, v1, v2) => {

    let color = _colorScale(setName);

    var material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      linecap: 'round', //ignored by WebGLRenderer
      linejoin: 'round' //ignored by WebGLRenderer
    });
    material.blending = THREE.NoBlending;
    var geometry = new THREE.Geometry();

    geometry.vertices.push(v1, v2);
    //geometry.vertices.push(new THREE.Vector3(lineList[i].x, lineList[i].y, lineList[i].z));
    var line = new THREE.Line(geometry, material);
    container.add(line);
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