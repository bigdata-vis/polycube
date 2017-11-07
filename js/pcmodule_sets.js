/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const SET_VIS_TYPE_TREEMAP = 'treemap';
  const SET_VIS_TYPE_TREEMAP_FLAT = 'treemap_flat';
  const SET_VIS_TYPE_MATRIX = 'matrix';
  const SET_VIS_TYPE_SQUARE_AREA = 'square_area';
  pCube.SET_VIS_TYPES = [SET_VIS_TYPE_TREEMAP, SET_VIS_TYPE_TREEMAP_FLAT, SET_VIS_TYPE_MATRIX, SET_VIS_TYPE_SQUARE_AREA];

  const SCALE_TOTAL_COUNT = 'scale_total_count';
  const SCALE_CATEGORY_COUNT = 'scale_category_count';
  pCube.SCALE_TYPES = [null, SCALE_TOTAL_COUNT, SCALE_CATEGORY_COUNT];

  const LAYER_CLICK_ANIMATION_MOVE = 'move';
  const LAYER_CLICK_ANIMATION_OPACITY = 'opacity';
  pCube.LAYER_CLICK_ANIMATION_STYLES = [LAYER_CLICK_ANIMATION_MOVE, LAYER_CLICK_ANIMATION_OPACITY];

  const LINE_STYLE_CENTER = 'center';
  const LINE_STYLE_CORNER = 'corner';
  const TREEMAP_FLAT_RECT_OPACITY = 0.5;

  const OVERLAPPING_OPTION_UNION = 'union';
  const OVERLAPPING_OPTION_INTERSECTION = 'intersection';
  pCube.OVERLAPPING_OPTIONS = [OVERLAPPING_OPTION_UNION, OVERLAPPING_OPTION_INTERSECTION];

  const SELECT_TYPE_COLOR = 'color';
  const SELECT_TYPE_VISIBILITY = 'visibility';
  pCube.SELECT_TYPES = [SELECT_TYPE_VISIBILITY, SELECT_TYPE_COLOR];

  /**
   * display only the data within the time-range but keep the overall proportions and scale
   */
  const TIME_CUTTING = 'time_cutting';
  /**
   * display only the data within the time-range and ignore that data outside of this time-range exists.
   */
  const ONLY_TIME_RANGE = 'only_time_range';
  pCube.SET_CALCULATION_OPTIONS = [TIME_CUTTING, ONLY_TIME_RANGE];

  const SWITCH_TREEMAP_RENDER_IN_WEBGL = true;
  const SWITCH_GRIDHELPER = false;
  const SWITCH_GRIDHELPER_LAYERS = false;
  const SWITCH_OUTPUT_OBJECTS_WITH_MULTIPLE_SETS = true;

  /* if data_with_categories is filled you can use this switch to remove all other categories from the dataset */
  const SWITCH_DATA_REMOVE_UNLISTED_CATEGORIES = false;

  const RENDER_ORDER_LAYER = 100;

  const TREEMAP_PADDING = 0;

  let NUMBER_OF_LAYERS = pCube.dataSlices;
  let DOMAIN_RANGE_MAX = NUMBER_OF_LAYERS - 1;
  let DOMAIN_RANGE = [0, DOMAIN_RANGE_MAX];
  let CUBE_SIZE = 500;
  let CUBE_SIZE_HALF = CUBE_SIZE / 2;
  let LAYER_SIZE = CUBE_SIZE / NUMBER_OF_LAYERS;
  let LAYER_SIZE_HALF = LAYER_SIZE / 2;

  /**
   * treemap object that is calcuated to visualize treemap structures
   */
  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([CUBE_SIZE, CUBE_SIZE]).padding(TREEMAP_PADDING);
  const _baseColor = '#EAECEE';
  const _highlightColor = '#1B4F72';
  const _setOperationColor = '#7F302B'
  const _baseColorGL = new THREE.Color(0xEAECEE);
  const _highlightColorGL = new THREE.Color(0x1B4F72);
  const _setOperationColorGL = new THREE.Color(0x7F302B);


  let _matrix_struct_info = {}
  let _infoBox = null;

  /**
   * color-scales that is used for sets
   */
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

  let _yearScale = null;
  let _cubeScale = null;
  const _stats = {
    itemsCount: 0,
    selectedItemsCount: 0,
    countGroupedByTerm: {},
    selectedCountGroupedByTerm: {},
    countGroupedByMultiSets: {},
    selectedCountGroupedByMultiSets: {},
    matrixStructure: {}
  };
  /**
   * hierarchy root element for the treemap visualization
   */
  let _hierarchy_root = null;

  /**
   * collection containing all boxes drawn
   */
  const _boxes = [];
  /**
   * collection containing selected boxes drawn to help visualize overlapping sets
   */
  const _selectedBoxes = [];
  /**
   * collection containing all lines drawn
   */
  const _lines = [];
  /**
   * collection containing all rects drawn
   */
  const _rects = [];
  /**
   * collection containing selected rects drawn to help visualize overlapping sets
   */
  const _selectedRects = [];
  const _linesContainer = new THREE.Object3D();
  const _htmlElements = [];
  const _matrixGridHelpers = [];
  const _layers = [];
  const _layersGL = [];

  /**
   * default options fot set visualization
   */
  const default_options = {
    vis_type: SET_VIS_TYPE_TREEMAP_FLAT,
    vis_type_treemap_flat_line_style: LINE_STYLE_CORNER,
    vis_type_matrix_count_opacity: true,
    vis_type_matrix_show_grid: false,
    vis_type_layer_clickable: true,
    vis_type_layer_click_animation: LAYER_CLICK_ANIMATION_MOVE,
    vis_type_select_type: pCube.SELECT_TYPES[0],
    vis_type_set_calculation_option: pCube.SET_CALCULATION_OPTIONS[0],
    /**
     * data_year_range only allows elements in the cube that are within this time-range.
     */
    data_year_range: [1800, 2000],
    /**
     * data_with_cateogires only allows elements in the cube that contain those categories.
     */
    data_with_categories: [], //['Andachtsbild', 'Relief'], // ['Andachtsbild'], //["Gemälde", "Gefäß", "Glyptik", "Schmuck", "Skulptur", "Zupfinstrument"]
    data_scale_cube: SCALE_TOTAL_COUNT,
    data_layer_sumUp: true,
    data_threshold: 0.01, // remove data category that is less then 1% of the total number of items    
    /**
     * function that is executes when clicking on an layers 
     */
    onLayerClick: (data) => {
      // visType, layerNumber, groupedByCategory, listOfItems, layerData
      console.info(data);
    },
    onSetClick: (data) => {
      // alert(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${listOfItems.length}`);
      console.info(`layerNumber: ${data.layerNumber}, setName: ${data.setName}, repoName: ${data.repoName}, count of items: ${data.items.length}`, data.items);

      let items = [];
      if (_.isEqual(sets_selected_categories, [data.setName])) {
        items = pCube.selectItemsBySets([], 'union');
      } else {
        items = pCube.selectItemsBySets([data.setName], 'union');
      }

    }
  };

  /**
   * additional styles added to page for highlighting.
   */
  let sets_style = document.createElement('style');
  sets_style.setAttribute('type', 'text/css');
  sets_style.innerHTML = `
            .layer.highlight {
              background-color: ${_highlightColor} !important; 
              opacity: 0.2 !important;
            }
            div.set-rect-hover:hover {
              background-color: ${_highlightColor} !important; 
              opacity: 0.7 !important;
              cursor: pointer;
            }
            #infoBox {
              position: absolute;
              height: 100px;
              width: 200px;
              top: 0;
              left: 0;
              color: white;
            }`;
  document.head.appendChild(sets_style);

  /**
   * Options settings for set visualization
   */
  pCube.sets_options = {};
  /**
   * data filted by selection of terms and years
   */
  pCube.sets_filtered_by_selection = [];
  _sets_data_before_time_range = [];
  /**
   * data storage for the treemap data
   */
  pCube.treemap_sets = {};
  /**
   * data storage for the matrix data
   */
  pCube.matrix_sets = {};
  /**
   * data storage for matrix data but instead of numeric count values stores list of objects
   */
  pCube.sets_matrix_objects = {};
  /**
   * Selected Layer Number 
   */
  sets_selected_layer = null;

  /**
   * currently selected category/set
   */
  sets_selected_category = null;
  /**
   * currently selected categories/sets (multi-sets)
   */
  sets_selected_categories = [];
  /**
   * currently selected set operation for sets_selected_categories
   */
  sets_selected_operations = null;

  /**
   * Get the list of categories sorted by total number of items in this category.
   */
  pCube.getSetsSortedByTotalCount = () => {
    return Object.keys(_stats.countGroupedByTerm)
      .sort((a, b) => _stats.countGroupedByTerm[b] - _stats.countGroupedByTerm[a])
      .map(x => {
        return { setName: x, count: _stats.countGroupedByTerm[x] };
      });
  };

  /**
   * Get a list setNames of possible intersect candidates.
   */
  pCube.getPossibleSetsToIntersectSortedByTotalCount = (setName) => {
    let list = [];
    Object.keys(_stats.countGroupedByMultiSets)
      .filter(k => k.indexOf(setName) > -1)
      .map(k => k.split(','))
      .forEach(k => {
        list = _.union(list, k);
      });

    return list
      .sort((a, b) => _stats.countGroupedByTerm[b] - _stats.countGroupedByTerm[a])
      .map(x => {
        return { setName: x, count: _stats.countGroupedByTerm[x] };
      });
  }

  /**
   * Get the list of categories and overlapping categories sorted by total number of items in this category.
   */
  pCube.getMultiSetsSortedByTotalCount = () => {
    return Object.keys(_stats.countGroupedByMultiSets)
      .sort((a, b) => _stats.countGroupedByMultiSets[b] - _stats.countGroupedByMultiSets[a]);
  };

  /**
   * Get the list of categories and overlapping categories sorted by total number of items in this category.
   */
  pCube.getSetsAndMultiSetsSortedByTotalCount = () => {
    let merged = Object.assign({}, _stats.countGroupedByTerm, _stats.countGroupedByMultiSets);
    return Object.keys(merged).sort((a, b) => merged[b] - merged[a]);
  };

  /**
   * draw set visualization on the polyCube layers based on options
   */
  pCube.drawSets = (options) => {

    clearSets();

    initSizes();

    /**
     * ADD RENDER_FUNCTION for mouse events (e.g. hover)
     */
    pCube.render_functions.push(onMouseHover);
    pCube.root.addEventListener('mousemove', onMouseMove, false);
    pCube.root.addEventListener('mousedown', onMouseDown, false);

    if (SWITCH_GRIDHELPER) {
      var gridhelper = new THREE.GridHelper(1000, 10);
      pCube.getGLScene().add(gridhelper);
    }

    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF);
    pCube.getGLScene().add(ambientLight);

    // FIXME: maybe do this with options
    // hide sides && mapbox of the cube to interact better with the layers
    document.querySelectorAll("div.side").forEach(x => x.style.display = "none");
    document.querySelectorAll('#mapbox').forEach(x => x.style.display = "none");


    // add info box for hover and click information 
    if (!_infoBox) {
      _infoBox = document.createElement('div');
      _infoBox.id = 'infoBox';
      pCube.root.appendChild(_infoBox);
    }

    pCube.sets_options = { ...default_options, ...options };

    _stats.countGroupedByTerm = {};
    _stats.selectedCountGroupedByTerm = {};
    _stats.countGroupedByMultiSets = {};
    _stats.selectedCountGroupedByMultiSets = {};

    // create stats for sets and multi-sets before filtering
    options.parsedData.forEach((val, idx) => {
      if (val.term.length > 1) {
        let v = val.term.join(',');
        if (!_stats.countGroupedByMultiSets[v]) {
          _stats.countGroupedByMultiSets[v] = 1;
        } else {
          _stats.countGroupedByMultiSets[v] += 1;
        }
      }
      val.term.forEach(v => {
        if (!_stats.countGroupedByTerm[v]) {
          _stats.countGroupedByTerm[v] = 1;
        } else {
          _stats.countGroupedByTerm[v] += 1;
        }
      });
    });

    if (SWITCH_OUTPUT_OBJECTS_WITH_MULTIPLE_SETS) {
      console.info(`out of ${options.parsedData.length} items, ${_.sum(Object.values(_stats.countGroupedByMultiSets))} have multiple categories`, _stats.countGroupedByMultiSets);
    }

    pCube.sets_filtered_by_selection = pCube.sets_options.data_with_categories && pCube.sets_options.data_with_categories.length > 0 ? options.parsedData
      .filter(d => _.intersection(d.term, pCube.sets_options.data_with_categories).length > 0)
      .map(d => {
        if (SWITCH_DATA_REMOVE_UNLISTED_CATEGORIES) {
          d.term = _.intersection(d.term, pCube.sets_options.data_with_categories);
        }
        return d;
      }) : options.parsedData;

    if (pCube.sets_options.data_year_range && pCube.sets_options.data_year_range.length > 0) {

      _sets_data_before_time_range = pCube.sets_filtered_by_selection.filter(d => {
        if (pCube.sets_options.data_year_range && pCube.sets_options.data_year_range.length === 2) {
          return d.time < pCube.sets_options.data_year_range[0];
        }
        return true;
      });

      pCube.sets_filtered_by_selection =
        pCube.sets_filtered_by_selection.filter(d => {
          if (pCube.sets_options.data_year_range && pCube.sets_options.data_year_range.length === 2) {
            return d.time >= pCube.sets_options.data_year_range[0] && d.time <= pCube.sets_options.data_year_range[1];
          }
          return true;
        });
    }

    // filter out data that is below the data threshold - based on the number of already filtered out data.
    if (pCube.sets_options.data_threshold) {
      pCube.sets_filtered_by_selection = pCube.sets_filtered_by_selection.filter(d => {
        let percentAmount = 0;
        d.term.forEach(t => {
          // let per = _stats.selectedCountGroupedByTerm[t] / pCube.sets_filtered_by_selection.length; // FIXME: maybe threshold only from displayed elements.
          let per = _stats.countGroupedByTerm[t] / options.parsedData.length; // options.parsedData.length;
          if (percentAmount < per) {
            percentAmount = per;
          }
        });
        return percentAmount >= pCube.sets_options.data_threshold;
      });
    }

    // create stats for sets and multi-sets after filtering
    pCube.sets_filtered_by_selection.forEach((val, idx) => {
      if (val.term.length > 1) {
        let v = val.term.join(',');
        if (!_stats.selectedCountGroupedByMultiSets[v]) {
          _stats.selectedCountGroupedByMultiSets[v] = 1;
        } else {
          _stats.selectedCountGroupedByMultiSets[v] += 1;
        }
      }
      val.term.forEach(v => {
        if (!_stats.selectedCountGroupedByTerm[v]) {
          _stats.selectedCountGroupedByTerm[v] = 1;
        } else {
          _stats.selectedCountGroupedByTerm[v] += 1;
        }
      });
    });

    pCube.treemap_sets = {}; // data for treemap grouped by layerNumber.setname
    pCube.matrix_sets = {};
    pCube.sets_matrix_objects = {};

    // time
    let years = pCube.sets_options.data_year_range.concat(pCube.sets_filtered_by_selection.map(d => d.time));
    let dateExt = d3.extent(years);
    _yearScale = d3.scaleLinear().domain([dateExt[0], dateExt[1]]).range(DOMAIN_RANGE).clamp(true);
    console.info(dateExt, _yearScale(dateExt[0]), _yearScale(dateExt[1]), Math.floor(_yearScale(1000)));
    // pCube.dateTestEx(dateExt);

    // update labels 
    let mi = new Date();
    mi.setFullYear(dateExt[0]);
    let ma = new Date();
    ma.setFullYear(dateExt[1]);
    pCube.drawLabels({ //Todo: fix label with proper svg
      labelPosition: {
        x: CUBE_SIZE_HALF,//offset border
        y: -(CUBE_SIZE / 2) + 20,
        z: CUBE_SIZE_HALF
      },
      startAtBottom: true, // TODO: NOTE: draw minDate to
      fontSize: 30,
      startDate: ma, // switched because of drawLabels logic
      endDate: mi // switched because of drawLabels logic
      // startDate: mi,
      // endDate: ma
    });

    // reinsert the previous data to be analysed, if cube should start with data instead of nothing.
    if (pCube.sets_options.vis_type_set_calculation_option === TIME_CUTTING) {
      pCube.sets_filtered_by_selection = pCube.sets_filtered_by_selection.concat(_sets_data_before_time_range);
    }

    // cube scale
    _stats.totalItemsCount = pCube.sets_options.parsedData.length;
    _stats.selectedItemsCount = pCube.sets_filtered_by_selection.length;
    // if use TIME_CUTTING use all items in cube scaling, if ONLY_TIME_RANGE use only filtered time data
    _stats.itemsCount = pCube.sets_options.vis_type_set_calculation_option === TIME_CUTTING ? _stats.totalItemsCount : _stats.selectedItemsCount;
    _cubeScale = d3.scaleLog().clamp(true).domain([1, _stats.itemsCount]).range([0, CUBE_SIZE]);
    // _cubeScale = d3.scaleLinear().clamp(true).domain([1, _stats.itemsCount]).range([0, CUBE_SIZE]); // TODO: LOG-SCALE of the Cube?


    // do matrix and classification 
    const matrixStruct = emptyMatrixSetStructure(pCube.sets_filtered_by_selection);
    _stats.matrixStructure = matrixStruct;
    const setsStruct = emptyTreemapSetStructure(pCube.sets_filtered_by_selection);
    _matrix_struct_info = {
      setNames: matrixStruct.setNames,
      repoNames: matrixStruct.repoNames
    };

    for (var index = -1; index < NUMBER_OF_LAYERS; index++) {
      if (!pCube.treemap_sets[index]) {
        pCube.treemap_sets[index] = _.cloneDeep(setsStruct);
      }
      if (!pCube.matrix_sets[index]) {
        pCube.matrix_sets[index] = _.cloneDeep(matrixStruct.matrix);
        pCube.sets_matrix_objects[index] = _.cloneDeep(matrixStruct.matrixObjects);
      }
    }

    // classifications
    pCube.sets_filtered_by_selection.forEach((val, idx) => {
      let layerNumber = val.time === null ? -1 : Math.floor(_yearScale(val.time));
      val.term.forEach(v => {
        pCube.treemap_sets[layerNumber][v].push(val);

        let setIdx = matrixStruct.setNames.indexOf(v);
        let repoIdx = matrixStruct.repoNames.indexOf(val.legalBodyID);
        pCube.matrix_sets[layerNumber][setIdx][repoIdx] += 1;
        pCube.sets_matrix_objects[layerNumber][setIdx][repoIdx].push(val);
      });
    });

    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.log(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.log(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
    }

    if (pCube.sets_options.data_layer_sumUp) {
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
        pCube.sets_matrix_objects[k] = pCube.sets_matrix_objects[k].map((a, ai) => {
          return a.map((b, bi) => {
            return b.concat(pCube.sets_matrix_objects[k - 1][ai][bi]);
          });
        });
      }
    }

    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.log(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.log(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
      console.log(`sets_matrix_objects: layer ${index} with ${getMatrixLayerItemCountWithIdArray(pCube.sets_matrix_objects[index])} items`);
    }

    drawLayers();

    if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP) {
      drawTreemap();
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_FLAT) {
      drawTreemapFlat();
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_MATRIX) {
      drawMatrix(matrixStruct);
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_SQUARE_AREA) {
      drawSquareArea(matrixStruct);
    }
  };

  /**
   * Add an additional function to the default view on the polycube
   * moves the layers back to default position
   */
  pCube.default_functions.push((duration) => {
    _linesContainer.visible = true;
    let move = function (object, i) {
      if (object.name == 'set-layer') {
        var posTween = new TWEEN.Tween(object.position)
          .to({
            x: 0,
            y: (LAYER_SIZE * object.userData.layerNumber + LAYER_SIZE_HALF) - CUBE_SIZE_HALF,
            z: 0
          }, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();

        var rotate = new TWEEN.Tween(object.rotation)
          .to({ x: 0, y: 0, z: 0 }, duration)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();
      }
    };
    pCube.getCube().children.forEach(move);
    pCube.getGLBox().children.forEach(move);

    d3.selectAll(".pointCloud").classed("hide", true);
  });

  /**
   * Add an additional function to the juxsta-pose view on the polycube
   * moves the layers back to juxsta or side-by-side position
   */
  pCube.juxstaPose_functions.push((duration, width, height) => {
    _linesContainer.visible = false;
    const move = function (object, i) {
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
    };
    pCube.getCube().children.forEach(move);
    pCube.getGLBox().children.forEach(move);
  });


  var _raycaster = new THREE.Raycaster();
  var _mouse = new THREE.Vector2();
  var _intersected = null;

  const getIntersectingBox = () => {

    // calculate objects intersecting the picking ray
    let objects = [].concat(_selectedBoxes, _boxes);
    let intersects = _raycaster.intersectObjects(objects);
    intersects = intersects.filter(x => {
      return x.object.visible && x.object.material.opacity > 0 && (x.object.name === 'set-box' || x.object.name === 'set-box-selection');
    });

    if (intersects.length > 0) {
      let elm = intersects[0];

      if (elm.object.name === 'set-box' || elm.object.name === 'set-box-selection') {
        return elm;
      } else {
        return null;
      }
    }
    return null;
  };

  const onMouseHover = (camera) => {
    // update the picking ray with the camera and mouse position
    _raycaster.setFromCamera(_mouse, camera);

    let intBox = getIntersectingBox();

    if (intBox) {
      let box = intBox.object;
      let boxSide = getIntersectedBoxSide(intBox);
      if (_intersected) {
        _intersected.material.color = _intersected.oldColor;
      }
      box.oldColor = box.material.color;
      box.material.color = _highlightColorGL;
      document.body.style.cursor = 'pointer';

      let items = [];
      if (box.name === 'set-box') {
        items = getListOfItemsByVisType(box.userData);
      } else if (box.name === 'set-box-selection') {
        // let selectionName = buildSelectionName(sets_selected_operations, sets_selected_categories);
        // items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, sets_selected_categories));
        items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, [box.userData.setName]));
      }

      updateInfoBox(`layerNumber: ${box.userData.layerNumber}, setName: ${box.userData.setName}, repoName: ${box.userData.repoName}, count of items: ${items.length}`);

      _intersected = box;
    } else {
      document.body.style.cursor = 'default';

      if (_intersected) {
        updateInfoBox('');
        _intersected.material.color = _intersected.oldColor;
        _intersected = null;
      }
    }
  };

  /**
   * top: 2
   * bottom: 3
   * 4-sides: 0,1,4,5
   */
  const getIntersectedBoxSide = (intersectedObject) => {
    var index = Math.floor(intersectedObject.faceIndex / 2);
    return index;
  }

  const onMouseMove = (event) => {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
    _mouse.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
    _mouse.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;
  };

  const onMouseDown = (event) => {
    let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
    _mouse.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
    _mouse.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;

    let intBox = getIntersectingBox();
    if (intBox) {
      let box = intBox.object
      let boxSide = getIntersectedBoxSide(intBox);

      if (box.name === 'set-box') {
        let items = getListOfItemsByVisType(box.userData);
        let data = {
          visType: pCube.sets_options.vis_type,
          layerNumber: box.userData.layerNumber,
          setName: box.userData.setName,
          repoName: box.userData.repoName,
          items: items
        };
        pCube.sets_options.onSetClick(data);
      } else if (box.name === 'set-box-selection') {
        // let selectionName = buildSelectionName(sets_selected_operations, sets_selected_categories);
        // let items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, sets_selected_categories));
        let items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, [box.userData.setName]));
        let data = {
          visType: pCube.sets_options.vis_type,
          layerNumber: box.userData.layerNumber,
          setName: box.userData.setName,
          repoName: box.userData.repoName,
          items: items
        };
        pCube.sets_options.onSetClick(data);
      }
    } else {
      updateInfoBox('')
    }

  };

  /**
   * mark sets with the highlight color and give all other elements the base color
   */
  pCube.selectSet = (setName, layerNumber) => {
    TWEEN.removeAll();
    sets_selected_category = setName || null;

    let boxesAndLines = [].concat(_boxes, _lines);
    clearSelection();
    if (setName === '') {
      return [];
    }

    boxesAndLines.forEach(b => {
      if (b.name === 'set-box' || b.name === 'set-rect' || b.name === 'set-line') {
        if (b.userData.setName === setName) {
          if (b.name === 'set-line') {
            b.visible = true;
          }
          var colorTween = new TWEEN.Tween(b.material.color)
            .to(_highlightColorGL, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
        } else {
          if (b.name === 'set-line') {
            b.visible = false;
          }
          var colorTween = new TWEEN.Tween(b.material.color)
            .to(_baseColorGL, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
        }
      }
    });
    _rects.forEach(b => {
      if (b.name === 'set-rect') {
        let curColor = d3.color(b.children[0].element.style.backgroundColor);
        if (b.userData.setName === setName) {
          let newColor = d3.color(_highlightColor);

          var colorTween = new TWEEN.Tween(curColor)
            .to(newColor, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
              b.children[0].element.style.backgroundColor = curColor.rgb().toString();
            })
            .start();
        } else {
          let newColor = d3.color(_baseColor);

          var colorTween = new TWEEN.Tween(curColor)
            .to(newColor, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
              b.children[0].element.style.backgroundColor = curColor.rgb().toString();
            })
            .start();
        }
      }
    });

    let items = getListOfItemsInTreemap().filter(itm => {
      return itm.term.indexOf(setName) > -1;
    });

    console.info('selected items:', items);
    return items;
  };

  /**
   * highlight boxes or rects based on the given array of setnames
   */
  pCube.selectItemsBySets = (setNames, overlappingOption = pCube.OVERLAPPING_OPTIONS[0]) => {
    TWEEN.removeAll();
    console.info('select of overlapping sets:', setNames);
    sets_selected_categories = setNames || [];
    sets_selected_operations = overlappingOption || null;
    if (sets_selected_categories === ['']) {
      sets_selected_categories = [];
    }

    clearSelection();
    if (sets_selected_categories === []) {
      return [];
    }

    let items = [];
    if (sets_selected_categories.length > 0) {
      switch (overlappingOption) {
        case OVERLAPPING_OPTION_UNION: {
          items = selectItemsBySetsUnion(sets_selected_categories);
          break;
        }
        case OVERLAPPING_OPTION_INTERSECTION: {
          items = selectItemsBySetsIntersection(sets_selected_categories);
          break;
        }
      }
    }

    console.info('selected items:', items);
    return items;
  };

  pCube.showSetsStats = () => {
    return _stats;
  };

  pCube.getCurrentSelectionName = () => {
    return buildSelectionName(sets_selected_operations, sets_selected_categories);
  };

  /**
   * ========================================================================
   *                              INTERNAL FUNCTIONS
   * ========================================================================
   */


  /**
   * Clear all elements that been drawn by drawSets
   */
  const clearSets = () => {
    _hierarchy_root = null;
    pCube.getGLBox().remove(_linesContainer);
    _matrixGridHelpers.forEach(gh => {
      gh.parent.remove(gh);
    });
    _matrixGridHelpers.splice(0, _matrixGridHelpers.length);
    _linesContainer.children = [];
    _layers.forEach(l => pCube.getCube().remove(l));
    _layersGL.forEach(l => pCube.getGLBox().remove(l));
    _layers.splice(0, _layers.length);
    _layersGL.splice(0, _layersGL.length);
    _htmlElements.forEach(e => e.remove());
    _boxes.splice(0, _boxes.length);
    _selectedBoxes.splice(0, _selectedBoxes.length);
    _lines.splice(0, _lines.length);
    _rects.splice(0, _rects.length);
    _selectedRects.splice(0, _selectedRects.length);
  };

  const initSizes = () => {
    NUMBER_OF_LAYERS = pCube.dataSlices;
    DOMAIN_RANGE_MAX = NUMBER_OF_LAYERS - 1;
    DOMAIN_RANGE = [0, DOMAIN_RANGE_MAX];
    CUBE_SIZE = 500;
    CUBE_SIZE_HALF = CUBE_SIZE / 2;
    LAYER_SIZE = CUBE_SIZE / NUMBER_OF_LAYERS;
    LAYER_SIZE_HALF = LAYER_SIZE / 2;
  }

  const updateInfoBox = (text = '') => {
    if (_infoBox) {
      _infoBox.innerText = text;
    }
  };

  const toggleBoxOpacity = (b, opacity) => {
    b.material.opacity = opacity;
    if (b.children.length > 0) {
      b.children[0].material.opacity = opacity;
    }
  };

  const clearSelection = () => {
    let boxesAndLines = [].concat(_boxes, _lines);
    boxesAndLines.forEach(b => {
      if (b.name === 'set-box' || b.name === 'set-rect' || b.name === 'set-line') {
        if (b.name === 'set-line') {
          b.visible = true;
        }

        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          toggleBoxOpacity(b, 1);
        } else if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_COLOR) {
          var colorTween = new TWEEN.Tween(b.material.color)
            .to(new THREE.Color(_colorScale(b.userData.setName)), 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
        }
      }
    });
    _rects.forEach(b => {
      if (b.name === 'set-rect') {
        let curColor = d3.color(b.children[0].element.style.backgroundColor);
        let newColor = d3.color(_colorScale(b.userData.setName));


        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          b.children[0].element.style.opacity = TREEMAP_FLAT_RECT_OPACITY;
          b.children[0].element.style.display = '';
        } else if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_COLOR) {
          var colorTween = new TWEEN.Tween(curColor)
            .to(newColor, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
              b.children[0].element.style.backgroundColor = curColor.rgb().toString();
            })
            .start();
        }
      }
    });

    _selectedBoxes.forEach(b => {
      b.visible = false;
      b.children[0].material.opacity = 0;
    });
    _selectedRects.forEach(b => {
      b.element.style.opacity = 0;
      b.element.style.display = 'none';
    });

  };

  const getListOfItemsByVisType = (userData) => {
    if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP || pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_FLAT) {
      if (userData) {
        return getListOfItemsInTreemap(userData.layerNumber, userData.setName);
      } else {
        return getListOfItemsInTreemap();
      }
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_MATRIX || pCube.sets_options.vis_type === SET_VIS_TYPE_SQUARE_AREA) {
      if (userData) {
        return getListOfItemsInMatrix(userData.layerNumber, userData.setName, userData.repoName);
      } else {
        return getListOfItemsInMatrix();
      }
    }
  };

  const buildSelectionName = (operation, setNames) => {
    if (operation === OVERLAPPING_OPTION_UNION) {
      return setNames.join(' ∪ ');
    } else if (operation === OVERLAPPING_OPTION_INTERSECTION) {
      return setNames.join(' ∩ ');
    }
  };

  const buildSetOperationFunction = (operation, setNames) => {
    if (operation === OVERLAPPING_OPTION_UNION) {
      return itm => {
        return _.intersection(itm.term, setNames).length > 0;
      };
    } else if (operation === OVERLAPPING_OPTION_INTERSECTION) {
      return itm => {
        return _.intersection(itm.term, setNames).length === setNames.length;
      };
    }
  }

  const selectItemsBySetsUnion = (setNames) => {
    const selectionItems = (userData) => {
      // check if list contains items that needs to be selected (multi-sets)
      return getListOfItemsByVisType(userData).filter(buildSetOperationFunction(OVERLAPPING_OPTION_UNION, setNames));
    };

    const fnGetItems = (userData) => {
      return getListOfItemsByVisType(userData);
    };

    let selectionName = buildSelectionName(OVERLAPPING_OPTION_UNION, setNames);

    selectItemsBySetsTweenBasedOnSelectionItemsFunction(selectionItems, fnGetItems, selectionName);

    return getListOfItemsByVisType().filter(buildSetOperationFunction(OVERLAPPING_OPTION_UNION, setNames));
  };

  const selectItemsBySetsIntersection = (setNames) => {
    const selectionItems = (userData) => {
      // check if list contains items that needs to be selected (multi-sets)
      return getListOfItemsByVisType(userData).filter(buildSetOperationFunction(OVERLAPPING_OPTION_INTERSECTION, setNames));
    };

    const fnGetItems = (userData) => {
      return getListOfItemsByVisType(userData);
    };

    let selectionName = buildSelectionName(OVERLAPPING_OPTION_INTERSECTION, setNames);

    selectItemsBySetsTweenBasedOnSelectionItemsFunction(selectionItems, fnGetItems, selectionName);

    return getListOfItemsByVisType().filter(buildSetOperationFunction(OVERLAPPING_OPTION_INTERSECTION, setNames));
  };

  const selectItemsBySetsTweenBasedOnSelectionItemsFunction = (fnSelectionItems, fnGetItems, selectionName) => {
    let boxesAndLines = [].concat(_boxes, _lines);

    _lines.forEach(b => {
      if (b.name === 'set-line') {
        let selectionItems = fnSelectionItems(b.userData);
        b.visible = selectionItems.length > 0 ? true : false; // TODO: draw lines on selected area!
        let co = new THREE.Color(selectionItems.length > 0 ? _setOperationColorGL : _colorScale(b.userData.setName));

        var colorTween = new TWEEN.Tween(b.material.color)
          .to(co, 1500)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();
      }
    });
    _boxes.forEach(b => {
      if (b.name === 'set-box' || b.name === 'set-rect') {
        let selectionItems = fnSelectionItems(b.userData);
        if (selectionItems.length > 0) {
          let selBox = b.children.find(x => x.name === 'set-box-selection');
          selBox.visible = true;
          let items = fnGetItems(b.userData);
          let nscale = selectionItems.length / items.length;
          selBox.scale.set(1, 1, nscale);
          var colorTween = new TWEEN.Tween(selBox.material.color)
            .to(_setOperationColorGL, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();

          selBox.children[0].material.opacity = 1;
        }

        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          toggleBoxOpacity(b, 0);
        } else if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_COLOR) {
          var colorTween = new TWEEN.Tween(b.material.color)
            .to(_baseColorGL, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
        }

      }
    });
    _rects.forEach(b => {
      if (b.name === 'set-rect') {

        let selectionItems = fnSelectionItems(b.userData);
        if (selectionItems.length > 0) {

          let selElement = b.children.find(c => c.name === 'set-rect-side-selection');
          let curColor = d3.color(b.children[0].element.style.backgroundColor);
          let newColor = d3.color(_setOperationColor);

          let orgHeight = parseFloat(b.children[0].element.style.height);
          let items = fnGetItems(b.userData);
          let newHeight = (orgHeight / items.length) * selectionItems.length;

          selElement.element.style.opacity = 1;
          selElement.element.style.display = '';
          selElement.element.style.height = newHeight + 'px';

          // selElement.element.title = selectionName;
          let data = {
            visType: pCube.sets_options.vis_type,
            layerNumber: selElement.userData.layerNumber,
            setName: selElement.userData.setName,
            repoName: selElement.userData.repoName,
            items: selectionItems
          };
          selElement.element.onclick = () => pCube.sets_options.onSetClick(data);
          // selElement.element.onmouseover = () => selElement.element.classList console.log(selectionName);

          var colorTween = new TWEEN.Tween(curColor)
            .to(newColor, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
              selElement.element.style.backgroundColor = curColor.rgb().toString();
            })
            .start();
        }
        let curColor = d3.color(b.children[0].element.style.backgroundColor);
        let newColor = d3.color(_baseColor);

        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          b.children[0].element.style.opacity = 0;
          b.children[0].element.style.display = 'none';
        } else if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_COLOR) {
          var colorTween = new TWEEN.Tween(curColor)
            .to(newColor, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(() => {
              b.children[0].element.style.backgroundColor = curColor.rgb().toString();
            })
            .start();
        }

      }
    });
  };

  /**
   * move layer out of the cube to look into part of the timeframe
   */
  const moveLayer = (layerNumber, layerData) => {
    TWEEN.removeAll();

    const move = l => {
      let moveValue;
      if (l.name === 'set-layer') {
        if (l.userData.layerNumber === layerNumber) {
          if (pCube.sets_selected_layer === layerNumber) {
            moveValue = 0;
          } else {
            moveValue = CUBE_SIZE + 20;
          }
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

  const opacityLayer = (layerNumber, layerData) => {
    TWEEN.removeAll();

    const change = l => {
      let isDeselect = pCube.sets_selected_layer === layerNumber;

      let opaValue;
      if (l.name === 'set-layer') {
        if (isDeselect) {
          opaValue = Infinity;
        } else {
          if (l.userData.layerNumber === layerNumber) {
            opaValue = Infinity;
          } else {
            opaValue = 0.1;
          }
        }

        l.children.filter(c => c.name === 'set-box').forEach(c => {
          c.material.opacity = opaValue;
        });
        l.children.filter(c => c.name === 'set-rect').forEach(c => {
          let val = isDeselect ? TREEMAP_FLAT_RECT_OPACITY : '1';
          c.children[0].element.style.opacity = opaValue === Infinity ? val : opaValue.toString();
        });
      }
    };

    pCube.getCube().children.forEach(change);
    pCube.getGLBox().children.forEach(change);
  };

  const animateSelectLayer = (layerNumber, layerData) => {
    switch (pCube.sets_options.vis_type_layer_click_animation) {
      case LAYER_CLICK_ANIMATION_MOVE:
        moveLayer(layerNumber, layerData);
        break;
      case LAYER_CLICK_ANIMATION_OPACITY:
        opacityLayer(layerNumber, layerData);
        break;
    }
  };

  const makeLayerElementsClickable = (layerNumber, layerData) => {
    console.info('make layer elements clickable');
  };

  const makeLayersClickable = () => {
    _layers.forEach((layerBox, idx) => {
      layerBox.children.forEach(x => {

        x.element.style.display = '';
        x.element.onmouseover = () => document.querySelectorAll('.layer-' + idx).forEach(x => x.classList.add('highlight'));
        x.element.onmouseout = () => document.querySelectorAll('.layer-' + idx).forEach(x => x.classList.remove('highlight'));
        x.element.onclick = function () {

          switch (pCube.sets_options.vis_type) {
            case SET_VIS_TYPE_TREEMAP:
            case SET_VIS_TYPE_TREEMAP_FLAT:
              animateSelectLayer(idx, pCube.treemap_sets[idx]);

              var listOfItems = getListOfItemsInTreemap(idx);

              var layerData = {
                visType: pCube.sets_options.vis_type,
                layerNumber: idx,
                groupedData: pCube.treemap_sets[idx],
                items: listOfItems,
                raw: pCube.treemap_sets[idx],
                layer: x,
                layerGL: _layersGL[idx]
              };
              // pCube.onLayerClick(pCube.sets_options.vis_type, idx, pCube.treemap_sets[idx], listOfItems);
              pCube.sets_options.onLayerClick(layerData);
              break;
            case SET_VIS_TYPE_MATRIX:
            case SET_VIS_TYPE_SQUARE_AREA:
              animateSelectLayer(idx, pCube.sets_matrix_objects[idx]);

              var listOfItems = getListOfItemsInMatrix(idx);

              let groupedByCategory = getMatrixLayerCategoryGrouped(pCube.sets_matrix_objects[idx]);
              var layerData = {
                visType: pCube.sets_options.vis_type,
                layerNumber: idx,
                groupedData: groupedByCategory,
                items: listOfItems,
                raw: pCube.matrix_sets[idx],
                rawMatrixObjects: pCube.sets_matrix_objects[idx],
                layer: x,
                layerGL: _layersGL[idx]
              };
              pCube.sets_options.onLayerClick(layerData);
              // pCube.onLayerClick(pCube.sets_options.vis_type, idx, groupedByCategory, listOfItems, pCube.sets_matrix_objects[idx]);// pCube.matrix_sets[idx]);
              break;
          }

          if (pCube.sets_selected_layer === idx) { // "deselect"
            pCube.sets_selected_layer = null;
          } else { // "select"
            pCube.sets_selected_layer = idx;
          }
        };
      });
    });
  };

  /**
   * draw cliable and movable layers with CSS3D, base structure for other elements and events
   */
  const drawLayers = () => {
    pCube.getGLSegments().forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let layerBox = drawBox(pCube.getCube(), idx, "layer-box", null, layer.position.x, layer.position.y, layer.position.z, CUBE_SIZE, LAYER_SIZE, CUBE_SIZE);
        layerBox.name = 'set-layer';
        layerBox.userData = { layerNumber: idx };
        _layers.push(layerBox);

        let layerBoxGL = drawBoxGL(pCube.getGLBox(), idx, "layer-box", null, layer.position.x, layer.position.y, layer.position.z, CUBE_SIZE, LAYER_SIZE, CUBE_SIZE, null, 0, false, false);
        layerBoxGL.renderOrder = RENDER_ORDER_LAYER;
        layerBoxGL.name = 'set-layer';
        layerBoxGL.userData = { layerNumber: idx };
        _layersGL.push(layerBoxGL);

        layerBox.children.forEach(x => {
          x.element.style.opacity = 0.0;
          x.element.classList.add('box-layer');
          x.element.classList.add('layer');
          x.element.classList.add('layer-' + idx);
          x.element.title = `${_yearScale.ticks()[idx]} - ${_yearScale.ticks()[idx + 1]}`;

          x.element.style.display = 'none';
        });

        if (pCube.sets_options.vis_type_layer_clickable) {
          makeLayersClickable();
        }

        if (SWITCH_GRIDHELPER_LAYERS) {
          var gridhelper = new THREE.GridHelper(CUBE_SIZE, 10);
          layerBoxGL.add(gridhelper);
        }
      }
    });
  };

  /**
   * draw a treemap visualization in 3d based on the layers
   */
  const drawTreemap = () => {
    _layers.forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let count = getListOfItemsByVisType({ layerNumber: idx }).length;
        let cubeSize = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT ? _cubeScale(count) : CUBE_SIZE; // TODO: scale only works for total-count
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, idx);
        // drawBox(pCube.getCube(), "test", 50, 50, 100, 200, 300, p);
        nodes.forEach((n, i) => {
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (SWITCH_TREEMAP_RENDER_IN_WEBGL) {
            const l = _layersGL[idx];
            drawBoxGL(l, idx, n.data.name, null, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count, 1, true, true);
          } else {
            drawBox(layer, idx, n.data.name, null, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count);
          }
        });
      }
    });
  };

  /**
   * draw a treemap visualation that is flat with connected lines between layers.
   */
  const drawTreemapFlat = () => {
    let linesMemory = [];
    _layers.forEach((layer, layerNumber) => {

      let p = layer.position;
      if (layerNumber < NUMBER_OF_LAYERS) {

        let count = getListOfItemsByVisType({ layerNumber: layerNumber }).length;
        let cubeSize = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT ? _cubeScale(count) : CUBE_SIZE; // TODO: scale only works for total-count
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, layerNumber);
        nodes.forEach(n => {

          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (isNaN(d)) {
            console.error("weird NaN form treemap", d, n, nodes);
          }
          let rect = drawRect(layer, layerNumber, n.data.name, null, n.x0, 0, n.y0, w, LAYER_SIZE, d, count, TREEMAP_FLAT_RECT_OPACITY, true);

          if (!linesMemory[layerNumber]) {
            linesMemory[layerNumber] = {};
          }
          linesMemory[layerNumber][n.data.name] = { rect, w, d, layerPos: p };
          if (layerNumber > 0) {
            let prevRect = linesMemory[layerNumber - 1][n.data.name];
            if (prevRect) {
              if (pCube.sets_options.vis_type_treemap_flat_line_style === LINE_STYLE_CENTER) {
                drawLine(n.data.name, layerNumber, _linesContainer,
                  new THREE.Vector3(rect.position.x, layer.position.y, rect.position.z),
                  new THREE.Vector3(prevRect.rect.position.x, prevRect.layerPos.y, prevRect.rect.position.z)
                );
              } else if (pCube.sets_options.vis_type_treemap_flat_line_style === LINE_STYLE_CORNER) {
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
                  drawLine(n.data.name, layerNumber, _linesContainer,
                    new THREE.Vector3(
                      rect.position.x + tx,
                      layer.position.y,
                      rect.position.z + ty
                    ),
                    new THREE.Vector3(
                      prevRect.rect.position.x + ptx,
                      prevRect.layerPos.y,
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

  /**
   * draw a matrix visualization
   */
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
              const totalCountPerCategory = pCube.matrix_sets[NUMBER_OF_LAYERS - 1][setIdx][repoIdx];
              const c = pCube.matrix_sets[idx][setIdx][repoIdx];
              const opacity = pCube.sets_options.vis_type_matrix_count_opacity ? c / totalCountPerCategory : 1;
              const l = _layersGL[idx];
              drawBoxGL(l, idx, matrixStruct.setNames[setIdx], matrixStruct.repoNames[repoIdx], xSplit * setIdx, -LAYER_SIZE_HALF, ySplit * repoIdx, xSplit, LAYER_SIZE, ySplit, _stats.itemsCount, opacity, true, true);
              //drawBoxGL(pCube.getGLBox(), matrixStruct.setNames[setIdx], xSplit * setIdx, ySplit * repoIdx, xSplit, xSplit, xSplit, p, _stats.itemsCount, opacity);
            }
          });
        });
      }
    });
  };

  /**
   * draw a square area matrix visualization based on the matrix data
   */
  const drawSquareArea = (matrixStruct) => {
    // draw x and y axis labels
    drawText(_layers[_layers.length - 1], "x-axis", 0, LAYER_SIZE_HALF, -CUBE_SIZE_HALF, "Category");
    drawText(_layers[_layers.length - 1], "y-axis", -CUBE_SIZE_HALF, LAYER_SIZE_HALF, 0, "Collections", 0, Math.PI / 2);

    const setSizes = Math.max.apply(null, [matrixStruct.setNames.length, matrixStruct.repoNames.length]);
    let split = CUBE_SIZE / setSizes;

    if (pCube.sets_options.vis_type_matrix_show_grid) {
      _layersGL.forEach((layer, idx) => {
        let gridhelper = new THREE.GridHelper(CUBE_SIZE, setSizes);
        gridhelper.position.y += LAYER_SIZE_HALF;
        _matrixGridHelpers.push(gridhelper);
        layer.add(gridhelper);

        gridhelper = new THREE.GridHelper(CUBE_SIZE, setSizes);
        gridhelper.position.y -= LAYER_SIZE_HALF;
        _matrixGridHelpers.push(gridhelper);
        layer.add(gridhelper);
      });
      for (var i = 0; i <= setSizes; i++) {
        let gridhelper = new THREE.GridHelper(CUBE_SIZE, NUMBER_OF_LAYERS);
        gridhelper.position.z = (split * i) - CUBE_SIZE_HALF;
        gridhelper.rotation.x = Math.PI / 2;
        _matrixGridHelpers.push(gridhelper);
        pCube.getGLScene().add(gridhelper);
      }
    }

    _layers.forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        const countRangeInLastLayer = d3.extent(Object.values(_stats.selectedCountGroupedByTerm));

        matrixStruct.setNames.forEach((s, setIdx) => {
          matrixStruct.repoNames.forEach((r, repoIdx) => {
            if (pCube.matrix_sets[idx][setIdx][repoIdx] > 0) {
              const totalCountCategory = pCube.matrix_sets[NUMBER_OF_LAYERS - 1][setIdx][repoIdx];
              const c = pCube.matrix_sets[idx][setIdx][repoIdx];
              const opacity = pCube.sets_options.vis_type_matrix_count_opacity ? c / totalCountCategory : 1;
              const l = _layersGL[idx];

              let width = split;
              if (pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT) {
                const scale = d3.scaleLog().clamp(true).domain([1, countRangeInLastLayer[1]]).range([0, split]); // FIXME: try log scale
                width = scale(c);
              } else if (pCube.sets_options.data_scale_cube === SCALE_CATEGORY_COUNT) {
                const scale = d3.scaleLog().clamp(true).domain([1, totalCountCategory]).range([0, split]); // FIXME: try log scale
                width = scale(c);
              }
              const yPos = -width / 2;

              let xSplit = CUBE_SIZE / matrixStruct.setNames.length;
              let ySplit = CUBE_SIZE / matrixStruct.repoNames.length;
              let diffSplit = Math.abs(xSplit - ySplit);
              if (matrixStruct.setNames.length > matrixStruct.repoNames.length) {
                drawBoxGL(l, idx, matrixStruct.setNames[setIdx], matrixStruct.repoNames[repoIdx], split * setIdx, yPos, (split + diffSplit) * repoIdx, width, width, width, _stats.itemsCount, opacity, true, true);
              } else if (matrixStruct.setNames.length < matrixStruct.repoNames.length) {
                drawBoxGL(l, idx, matrixStruct.setNames[setIdx], matrixStruct.repoNames[repoIdx], (split + diffSplit) * setIdx, yPos, split * repoIdx, width, width, width, _stats.itemsCount, opacity, true, true);
              } else {
                drawBoxGL(l, idx, matrixStruct.setNames[setIdx], matrixStruct.repoNames[repoIdx], split * setIdx, yPos, split * repoIdx, width, width, width, _stats.itemsCount, opacity, true, true);
              }
            }
          });
        });
      }
    });
  };

  const getListOfItemsInTreemap = (layerNumber, setName) => {
    if (setName && layerNumber >= 0) {
      return pCube.treemap_sets[layerNumber][setName];
    } else if (layerNumber >= 0) {
      return Object.values(pCube.treemap_sets[layerNumber]).reduce((o, cur) => {
        return o.concat(cur);
      }, []);
    } else {
      return pCube.sets_filtered_by_selection;
    }
  };

  const getListOfItemsInMatrix = (layerNumber, setName, repoName) => {
    if (repoName && setName && layerNumber >= 0) {
      let setIdx = _stats.matrixStructure.setNames.indexOf(setName);
      let repoIdx = _stats.matrixStructure.repoNames.indexOf(repoName);
      return pCube.sets_matrix_objects[layerNumber][setIdx][repoIdx];
    } else if (setName && layerNumber >= 0) {
      let setIdx = _stats.matrixStructure.setNames.indexOf(setName);
      let listOfItems = [];
      pCube.sets_matrix_objects[layerNumber][setIdx].forEach(items => {
        listOfItems = listOfItems.concat(items);
      });
      return listOfItems;
    } else if (layerNumber >= 0) {
      let listOfItems = [];
      pCube.sets_matrix_objects[layerNumber].forEach(arr => {
        arr.forEach(items => {
          listOfItems = listOfItems.concat(items);
        });
      });
      return listOfItems;
    } else {
      return pCube.sets_filtered_by_selection;
    }
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
      return o + cur.reduce((o1, cur1) => {
        return o1 + cur1.length;
      }, 0);
    }, 0);
  };

  const getMatrixLayerItemSetCount = (data) => {
    return data.reduce((o1, cur1) => {
      return o1 + cur1;
    }, 0);
  };

  /**
   * get map of elements grouped by term/category
   */
  const getMatrixLayerCategoryGrouped = (data) => {
    let map = {};
    _matrix_struct_info.setNames.forEach((s, setIdx) => {
      map[s] = data[setIdx].reduce((o, cur) => {
        return o.concat(cur);
      }, []);
    });
    return map;
  }

  /**
   * create empty structure for a layer for the treemap visualiatzion
   */
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

  /**
   * create empty matrix structure for a layer for the matrix visualization
   */
  const emptyMatrixSetStructure = (data) => {
    let setNames = []; // new Set();
    let repoNames = []; // new Set();
    let matrix = [];
    let matrixObjects = [];
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
      matrixObjects[i] = [];
      for (var k = 0; k < repoNames.length; k++) {
        matrix[i][k] = 0;
        matrixObjects[i][k] = [];
      }
    }

    return {
      setNames,
      repoNames,
      matrix,
      matrixObjects
    }
  };

  /**
   * create or update the treemap hierarchy and treemap_nodes, based on current dataset
   */
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
    let nodes = _tmap(_hierarchy_root).leaves();
    console.debug(layerNumber, _hierarchy_root);
    return nodes;
  };

  /**
   * draw box in CSS3D on a specific position in an specific container
   */
  const drawBox = (container, layerNumber, setName, repoName, x, y, z, width, height, depth, layerItemCount) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT && layerItemCount ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF; // FIXME: rethink this part !!!

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
      object.name = 'set-side';
      object.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName };

      box.add(object);
    }

    box.name = 'set-box';
    box.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName };
    box.position.y = y + h;
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;
    container.add(box);

    _boxes.push(box);

    return box;
  };

  /**
   * draw rect in CSS3D on a specific position in an specific container
   */
  const drawRect = (container, layerNumber, setName, repoName, x, y, z, width, height, depth, layerItemCount, opacity = 1, multiSelectPossible = false) => {

    const box = new THREE.Object3D();
    const r = Math.PI / 2;
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT && layerItemCount > 0 ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF; // FIXME: rethink this part!!!!
    const pos = [0, -h, 0];
    const rot = [r, 0, 0];

    var element = document.createElement('div');
    _htmlElements.push(element);
    element.classList = ['set-side', 'set', 'set-rect', 'set-' + setName].join(' ')
    element.style.width = width + 'px';
    element.style.height = depth + 'px';
    element.style.border = "1px solid #000000";
    element.style.backgroundColor = _colorScale(setName);
    element.style.opacity = opacity;
    // element.title = setName;

    let items = getListOfItemsByVisType({ layerNumber, setName });
    let data = {
      visType: pCube.sets_options.vis_type,
      layerNumber: layerNumber,
      setName: setName,
      repoName: null,
      items: items
    };
    element.onclick = () => pCube.sets_options.onSetClick(data);
    element.onmouseover = () => {
      if (element.style.opacity > 0) {
        element.classList.add('set-rect-hover');
        updateInfoBox(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${items.length}`);
      }
    };
    element.onmouseout = () => {
      if (element.style.opacity > 0) {
        element.classList.remove('set-rect-hover');
        updateInfoBox('');
      }
    };


    var object = new THREE.CSS3DObject(element);
    // object.position.fromArray(pos);
    object.rotation.fromArray(rot);
    object.name = 'set-rect-side';
    object.userData = {
      setName: setName,
      layerNumber: layerNumber
    };

    box.add(object);
    box.name = 'set-rect';
    box.userData = {
      setName: setName,
      layerNumber: layerNumber
    };
    box.position.y = y;
    box.position.x = x - cubesize_per_items + w;
    box.position.z = z - cubesize_per_items + d;

    if (multiSelectPossible) {
      // build selection rect
      let selElement = document.createElement('div');
      _htmlElements.push(selElement);
      selElement.classList = ['set-side', 'set, set-rect', 'set-select'].join(' ')
      selElement.style.width = width + 'px';
      selElement.style.height = '10px';
      selElement.style.border = "1px solid #000000";
      selElement.style.backgroundColor = '#000';
      selElement.style.opacity = 0;
      selElement.style.display = 'none';

      // selElement.title = setName;
      let data = {
        visType: pCube.sets_options.vis_type,
        layerNumber: layerNumber,
        setName: setName,
        repoName: null,
        items: []
      };
      selElement.onclick = () => pCube.sets_options.onSetClick(data);
      selElement.onmouseover = () => {
        if (selElement.style.opacity > 0) {
          selElement.classList.add('set-rect-hover');
          updateInfoBox(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${items.length}`);
        }
      };
      selElement.onmouseout = () => {
        if (selElement.style.opacity > 0) {
          selElement.classList.remove('set-rect-hover');
          updateInfoBox('');
        }
      };

      var selObject = new THREE.CSS3DObject(selElement);
      // object.position.fromArray(pos);
      selObject.rotation.fromArray(rot);
      selObject.name = 'set-rect-side-selection';
      selObject.userData = {
        setName: setName,
        layerNumber: layerNumber
      };
      box.add(selObject);
      _selectedRects.push(selObject);
    }

    container.add(box);

    _rects.push(box);

    return box;
  };

  /**
   * draw a line from vector 1 to vector 2 in a specific container
   */
  const drawLine = (setName, layerNumber, container, v1, v2) => {

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
    line.name = 'set-line';
    line.userData = {
      setName: setName,
      layerNumber: layerNumber
    };

    container.add(line);

    _lines.push(line);

    return line;
  };

  /**
   * draw box in WebGL on a specific position in an specific container
   */
  const drawBoxGL = (container, layerNumber, setName, repoName, x, y, z, width, height, depth, layerItemCount, opacity, withBorder, multiSelectPossible = false) => {
    const h = height / 2,
      w = width / 2,
      d = depth / 2;
    const cubesize_per_items = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT && layerItemCount > 0 ? _cubeScale(layerItemCount) / 2 : CUBE_SIZE_HALF; // FIXME: rethink this part!!!

    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshBasicMaterial({
      color: _colorScale(setName),
      transparent: true,
      opacity: opacity || opacity >= 0 ? opacity : 1,
      flatShading: THREE.FlatShading,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    });
    let set = new THREE.Mesh(geometry, material);
    set.name = 'set-box';
    set.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName };

    set.position.x = x - cubesize_per_items + w; // -150 + node.x0 + (w / 2);
    set.position.z = z - cubesize_per_items + d; // -150 + node.y0 + (d / 2);
    set.position.y = y + h; // y + height / 2;

    // add border edges
    if (withBorder) {
      var geo = new THREE.EdgesGeometry(set.geometry); // or WireframeGeometry
      var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 1 });
      var border = new THREE.LineSegments(geo, mat);
      set.add(border);
    }

    if (multiSelectPossible) {

      let selGeometry = new THREE.BoxGeometry(width, height, depth);
      let selMaterial = new THREE.MeshBasicMaterial({
        color: _setOperationColorGL,
        flatShading: THREE.FlatShading
      });
      let selBox = new THREE.Mesh(selGeometry, selMaterial);
      selBox.name = 'set-box-selection';
      selBox.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName };
      selBox.visible = false;

      if (withBorder) {
        var geo = new THREE.EdgesGeometry(selBox.geometry); // or WireframeGeometry
        var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0 });
        var border = new THREE.LineSegments(geo, mat);
        selBox.add(border);
      }

      set.add(selBox);
      _selectedBoxes.push(selBox);
    }

    _boxes.push(set);
    container.add(set);

    return set;
  };

  /**
   * draw text on a specific position in an specific container
   */
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
