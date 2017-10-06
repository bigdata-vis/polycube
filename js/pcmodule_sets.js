/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const TREEMAP = 'treemap';
  const TREEMAP_FLAT = 'treemap_flat';
  const MATRIX = 'matrix';

  const LINE_STYLE_CENTER = 'center';
  const LINE_STYLE_CORNER = 'corner';

  const SWITCH_TREEMAP_FLAT_LINE_STYLE = LINE_STYLE_CORNER;
  const SWITCH_TREEMAP_RENDER_IN_WEBGL = true;

  const TREEMAP_PADDING = 0;
  const NUMBER_OF_LAYERS = pCube.dataSlices;
  const DOMAIN_RANGE_MAX = NUMBER_OF_LAYERS - 1;
  const DOMAIN_RANGE = [0, DOMAIN_RANGE_MAX];
  const CUBE_SIZE = 500;
  const CUBE_SIZE_HALF = CUBE_SIZE / 2;
  const LAYER_SIZE = CUBE_SIZE / NUMBER_OF_LAYERS;
  const LAYER_SIZE_HALF = LAYER_SIZE / 2;

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([CUBE_SIZE, CUBE_SIZE]).padding(TREEMAP_PADDING);
  const _baseColor = '#EAECEE';
  const _highlightColor = '#1B4F72';
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

  let _cubeScale = null;
  let _treemap_nodes;
  let _hierarchy_root = null;
  let _totalItemsCount = 0;

  const _htmlElements = [];
  const _linesContainer = new THREE.Object3D();
  const _layers = [];
  const _layersGL = [];

  const default_options = {
    sets_display: TREEMAP_FLAT,
    selection_year: [1800, 2000],
    selection_class: [], //["Gemälde", "Gefäß", "Glyptik", "Schmuck", "Skulptur", "Zupfinstrument"]
    data_scale_cube: true,
    data_threshold: 0.01 // remove data category that is less then 1% of the total number of items
  };

  let sets_style = document.createElement('style');
  sets_style.setAttribute('type', 'text/css');
  sets_style.innerHTML = `
    .layer.highlight {
      background-color: ${_highlightColor} !important; 
      opacity: 0.2 !important;
    } 
    .box-layer:hover {
      background-color: ${_highlightColor} !important;
      opacity: 0.2 !important;
    }`;
  document.head.appendChild(sets_style);

  pCube.sets_options = {};
  pCube.sets_filtered_by_selection = [];
  pCube.treemap_sets = {};
  pCube.matrix_sets = {};
  pCube.sets_matrix_Ids = {};

  pCube.clearSets = () => {
    pCube.getGLBox().remove(_linesContainer);
    _linesContainer.children = [];
    _layers.forEach(l => pCube.getCube().remove(l));
    _layersGL.forEach(l => pCube.getGLBox().remove(l));
    _layers.splice(0, _layers.length);
    _layersGL.splice(0, _layersGL.length);
    _htmlElements.forEach(e => e.remove());
  };

  pCube.drawSets = (options) => {

    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF);
    pCube.getGLScene().add(ambientLight);

    // hide sides of the cube to interact better with the layers
    document.querySelectorAll("div.side").forEach(x => x.style.display = "none");

    pCube.sets_options = { ...default_options, ...options };

    const groupByTerm = {};
    options.parsedData.forEach((val, idx) => {
      val.term.forEach(v => {
        if (!groupByTerm[v]) {
          groupByTerm[v] = 1;
        } else {
          groupByTerm[v] += 1;
        }
      });
    });

    pCube.sets_filtered_by_selection = pCube.sets_options.selection_class && pCube.sets_options.selection_class.length > 0 ? options.parsedData
      .filter(d => _.intersection(d.term, pCube.sets_options.selection_class).length > 0)
      .map(d => {
        d.term = _.intersection(d.term, pCube.sets_options.selection_class);
        return d;
      }) : options.parsedData;

    if (pCube.sets_options.selection_year && pCube.sets_options.selection_year.length > 0) {
      pCube.sets_filtered_by_selection =
        pCube.sets_filtered_by_selection.filter(d => {
          if (pCube.sets_options.selection_year && pCube.sets_options.selection_year.length === 2) {
            return d.time >= pCube.sets_options.selection_year[0] && d.time <= pCube.sets_options.selection_year[1];
          }
          return true;
        });
    }

    if (pCube.sets_options.data_threshold) {
      pCube.sets_filtered_by_selection = pCube.sets_filtered_by_selection.filter(d => {
        let percentAmount = 1;
        d.term.forEach(t => {
          percentAmount *= groupByTerm[d.term] / options.parsedData.length;
        });
        return percentAmount >= pCube.sets_options.data_threshold;
      });
    }

    pCube.treemap_sets = {}; // data for treemap grouped by layerNumber.setname
    pCube.matrix_sets = {};
    pCube.sets_matrix_Ids = {};

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
      startDate: ma, // switched because of drawLabels logic
      endDate: mi // switched because of drawLabels logic
      // startDate: mi,
      // endDate: ma
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
        pCube.sets_matrix_Ids[index] = _.cloneDeep(matrixStruct.matrixIds);
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
        pCube.sets_matrix_Ids[layerNumber][setIdx][repoIdx].push(val.lidoRecID);
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
      pCube.sets_matrix_Ids[k] = pCube.sets_matrix_Ids[k].map( (a, ai) => {
        return a.map( (b, bi) => {
          return b.concat(pCube.sets_matrix_Ids[k - 1][ai][bi]);
        });
      });
    }
    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.log(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.log(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
      console.log(`sets_matrix_Ids: layer ${index} with ${getMatrixLayerItemCountWithIdArray(pCube.sets_matrix_Ids[index])} items`);
    }

    drawLayers();

    if (pCube.sets_options.sets_display === TREEMAP) {
      drawTreemap();
    } else if (pCube.sets_options.sets_display === TREEMAP_FLAT) {
      drawTreemapFlat();
    } else if (pCube.sets_options.sets_display === MATRIX) {
      drawMatrix(matrixStruct);
    }
  };

  pCube.default_functions.push((duration) => {
    _linesContainer.visible = true;
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
    _linesContainer.visible = false;
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

  pCube.onLayerClick = (layerNumber, layerData) => {
    console.info(layerNumber, layerData);
  };

  const moveLayer = (layerNumber, layerData) => {

    TWEEN.removeAll();

    const move = l => {
      let moveValue;
      if (l.name === 'set-layer') {
        if (l.userData.layerNumber === layerNumber) {
          moveValue = CUBE_SIZE + 20;
        } else {
          moveValue = 0;
        }
        var posTween = new TWEEN.Tween(l.position)
          .to({ ...l.position, x: moveValue }, 500)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .onComplete(() => {
            // TODO: make layers rects clickable
            if (moveValue > 0) {
              makeLayerElementsClickable(layerNumber, layerData);
            }
          })
          .start();
      }
    };

    pCube.getCube().children.forEach(move);
    pCube.getGLBox().children.forEach(move);
  };

  const makeLayerElementsClickable = (layerNumber, layerData) => {
    console.info('make layer elements clickable');
  };

  const drawLayers = () => {
    pCube.getGLSegments().forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let layerBox = drawBox(pCube.getCube(), "layer-box", layer.position.x, layer.position.y, layer.position.z, CUBE_SIZE, LAYER_SIZE, CUBE_SIZE);
        layerBox.name = 'set-layer';
        layerBox.userData = { layerNumber: idx };
        _layers.push(layerBox);

        let layerBoxGL = drawBoxGL(pCube.getGLBox(), "layer-box", layer.position.x, layer.position.y, layer.position.z, CUBE_SIZE, LAYER_SIZE, CUBE_SIZE, null, 0, false);
        layerBoxGL.renderOrder = 100;
        layerBoxGL.name = 'set-layer';
        layerBoxGL.userData = { layerNumber: idx };
        _layersGL.push(layerBoxGL);

        layerBox.children.forEach(x => {
          x.element.style.opacity = 0.0;
          x.element.classList.add('box-layer');
          x.element.classList.add('layer');
          x.element.classList.add('layer-' + idx);
          x.element.onmouseover = () => document.querySelectorAll('.layer-' + idx).forEach(x => x.classList.add('highlight'));
          x.element.onmouseout = () => document.querySelectorAll('.layer-' + idx).forEach(x => x.classList.remove('highlight'));
          x.element.onclick = function () {
            switch (pCube.sets_options.sets_display) {
              case TREEMAP:
              case TREEMAP_FLAT:
                moveLayer(idx, pCube.treemap_sets[idx]);
                pCube.onLayerClick(idx, pCube.treemap_sets[idx]);
                break;
              case MATRIX:
                moveLayer(idx, pCube.sets_matrix_Ids[idx]);
                pCube.onLayerClick(idx, pCube.sets_matrix_Ids[idx], pCube.matrix_sets[idx]);
                break;
            }
          };
        });
      }
    });
  };

  const drawTreemap = () => {
    _layers.forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let count = Object.keys(pCube.treemap_sets[idx]).reduce((o, x) => { return o + pCube.treemap_sets[idx][x].length || 0 }, 0);
        let cubeSize = pCube.sets_options.data_scale_cube ? _cubeScale(count) : CUBE_SIZE;
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, idx);
        // drawBox(pCube.getCube(), "test", 50, 50, 100, 200, 300, p);
        _treemap_nodes.forEach((n, i) => {
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (SWITCH_TREEMAP_RENDER_IN_WEBGL) {
            const l = _layersGL[idx];
            drawBoxGL(l, n.data.name, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count, 1, true);
          } else {
            drawBox(layer, n.data.name, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count);
          }
        });
      }
    });
  };


  const drawTreemapFlat = () => {
    let linesMemory = [];
    _layers.forEach((layer, idx) => {

      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {

        let count = Object.keys(pCube.treemap_sets[idx]).reduce((o, x) => { return o + pCube.treemap_sets[idx][x].length || 0 }, 0);
        let cubeSize = pCube.sets_options.data_scale_cube ? _cubeScale(count) : CUBE_SIZE;
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, idx);
        _treemap_nodes.forEach(n => {

          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          let rect = drawRect(layer, n.data.name, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count);

          if (!linesMemory[idx]) {
            linesMemory[idx] = {};
          }
          linesMemory[idx][n.data.name] = { rect, w, d, layerPos: p };
          if (idx > 0) {
            let prevRect = linesMemory[idx - 1][n.data.name];
            if (prevRect) {
              if (SWITCH_TREEMAP_FLAT_LINE_STYLE === LINE_STYLE_CENTER) {
                drawLine(n.data.name, _linesContainer,
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
                  drawLine(n.data.name, _linesContainer,
                    new THREE.Vector3(
                      rect.position.x + tx,
                      layer.position.y - LAYER_SIZE_HALF,
                      rect.position.z + ty
                    ),
                    new THREE.Vector3(
                      prevRect.rect.position.x + ptx,
                      prevRect.layerPos.y - LAYER_SIZE_HALF,
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
    pCube.getGLBox().add(_linesContainer);
  };

  const drawMatrix = (matrixStruct) => {
    // draw x and y axis labels
    drawText(_layers[_layers.length - 1], "x-axis", 0, LAYER_SIZE_HALF, -CUBE_SIZE_HALF, "Category");
    drawText(_layers[_layers.length - 1], "y-axis", -CUBE_SIZE_HALF, LAYER_SIZE_HALF, 0, "Collections", 0, Math.PI / 2);

    let xSplit = CUBE_SIZE / matrixStruct.setNames.length;
    let ySplit = CUBE_SIZE / matrixStruct.repoNames.length;

    _layers.forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        matrixStruct.setNames.forEach((s, setIdx) => {
          matrixStruct.repoNames.forEach((r, repoIdx) => {
            if (pCube.matrix_sets[idx][setIdx][repoIdx] > 0) {
              // drawBoxGL(pCube.getGLBox(), matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, LAYER_SIZE, 20, p);
              const tc = pCube.matrix_sets[NUMBER_OF_LAYERS - 1][setIdx][repoIdx];
              const c = pCube.matrix_sets[idx][setIdx][repoIdx];
              const opacity = c / tc;
              const l = _layersGL[idx];
              drawBoxGL(l, matrixStruct.setNames[setIdx], xSplit * setIdx, -LAYER_SIZE_HALF, ySplit * repoIdx, xSplit, LAYER_SIZE, ySplit, _totalItemsCount, opacity, true);
              //drawBoxGL(pCube.getGLBox(), matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, xSplit, xSplit, p, _totalItemsCount, opacity);
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

  const getMatrixLayerItemCountWithIdArray = (data) => {
    return data.reduce((o, cur) => {
      return o + cur.reduce( (o1, cur1) => {
        return o1 + cur1.length;
      }, 0);
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
    let matrixIds = [];
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
      matrixIds[i] = [];
      for (var k = 0; k < repoNames.length; k++) {
        matrix[i][k] = 0;
        matrixIds[i][k] = [];
      }
    }

    return {
      setNames,
      repoNames,
      matrix,
      matrixIds
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
    if (!_hierarchy_root) { // init calculation with the biggest collection items 
      _hierarchy_root = d3.hierarchy(data);
      _hierarchy_root = _hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[DOMAIN_RANGE_MAX][d.name].length : null; })
        .sort(function (a, b) { return b.height - a.height || a.data.name.localeCompare(b.data.name); });
      console.debug(_hierarchy_root);
    }
    _hierarchy_root = _hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[layerNumber][d.name].length : null; })
      .sort(function (a, b) { return b.height - a.height || a.data.name.localeCompare(b.data.name); });
    _treemap_nodes = _tmap(_hierarchy_root).leaves();
    console.debug(layerNumber, _hierarchy_root);
    return _treemap_nodes;
  };

  /**CSS3D Scene
   * Cube Sides
   *6 sided cube creation with CSS3D, div and then added to cube group object
   */
  const drawBox = (container, setName, x, y, z, width, height, depth, layerItemCount) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube && layerItemCount ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF;

    const pos = [[w, 0, 0], [-w, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, d], [0, 0, -d]];
    const rot = [[0, r, 0], [0, -r, 0], [-r, 0, 0], [r, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (var i = 0; i < 6; i++) {
      var element = document.createElement('div');
      _htmlElements.push(element);
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
      //element.style.border = "1px solid red";
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

    box.position.y = y + h;
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;
    container.add(box);

    return box;
  };

  const drawRect = (container, setName, x, y, z, width, height, depth, layerItemCount) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF;

    const pos = [0, -h, 0];
    const rot = [r, 0, 0];

    var element = document.createElement('div');
    _htmlElements.push(element);
    element.classList = ['set-side', 'set', 'set-' + setName].join(' ')

    element.style.width = width + 'px';
    element.style.height = depth + 'px';

    element.style.border = "1px solid #000000";
    element.style.backgroundColor = _colorScale(setName);
    // element.style.opacity = 0.5;

    var object = new THREE.CSS3DObject(element);
    // object.position.fromArray(pos);
    object.rotation.fromArray(rot);
    object.name = setName;

    box.add(object);
    box.name = 'set-rect';

    box.position.y = y;
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;

    container.add(box);

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

  const drawBoxGL = (container, setName, x, y, z, width, height, depth, layerItemCount, opacity, withBorder) => {
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube && layerItemCount > 0 ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF;

    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshBasicMaterial({
      color: _colorScale(setName),
      transparent: opacity || opacity >= 0 ? true : false,
      opacity: opacity || opacity >= 0 ? opacity : 1,
      flatShading: THREE.FlatShading,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    });
    let set = new THREE.Mesh(geometry, material);
    set.name = setName;
    set.userData = setName;

    set.position.x = x - cubesize_per_items + w; // -150 + node.x0 + (w / 2);
    set.position.z = z - cubesize_per_items + d; // -150 + node.y0 + (d / 2);
    set.position.y = y + h; // y + height / 2;

    // add border edges
    if (withBorder) {
      var geo = new THREE.EdgesGeometry( set.geometry ); // or WireframeGeometry
      var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
      var border = new THREE.LineSegments( geo, mat );
      set.add( border );
    }

    container.add(set);

    return set;
  };

  const drawText = (container, name, x, y, z, text, rx, ry, rz) => {

    var labelName = `${name}-label`;
    var element = document.createElement('p');
    _htmlElements.push(element);
    element.className = labelName;
    element.style.color = 'grey';
    element.style.fontSize = "50px";
    var elText = document.createTextNode(text);
    element.appendChild(elText);

    var object = new THREE.CSS3DObject(element);
    object.name = labelName;
    object.position.x = x;
    object.position.y = y;
    object.position.z = z;
    object.rotation.x = rx || 0;
    object.rotation.y = ry || 0;
    object.rotation.z = rz || 0;

    container.add(object);

    return object;
  };

})(window.polyCube);