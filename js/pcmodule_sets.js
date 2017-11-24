/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const SET_VIS_TYPE_TREEMAP = 'treemap';
  const SET_VIS_TYPE_TREEMAP_FLAT = 'treemap_flat';
  const SET_VIS_TYPE_TREEMAP_HIERARCHY = 'treemap_hierarchy';
  const SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT = 'treemap_hierarchy_flat';
  const SET_VIS_TYPE_MATRIX = 'matrix';
  const SET_VIS_TYPE_SQUARE_AREA = 'square_area';
  pCube.SET_VIS_TYPES = [SET_VIS_TYPE_TREEMAP, SET_VIS_TYPE_TREEMAP_FLAT, SET_VIS_TYPE_MATRIX, SET_VIS_TYPE_SQUARE_AREA, SET_VIS_TYPE_TREEMAP_HIERARCHY, SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT];

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

  const TREEMAP_SORT_BY_VALUE = 'value';
  const TREEMAP_SORT_BY_NAME = 'name';

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
  const SWITCH_OUTPUT_OBJECTS_WITH_MULTIPLE_SETS = false;

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
  let _infoCounter = null;
  let _selectionInfoBox = null;

  /**
   * color-scales that is used for sets
   */
  const colors_for_scale = _.flatten([].concat(d3.schemeCategory20c, d3.schemeCategory20b));
  const _colorScale = d3.scaleOrdinal(colors_for_scale);

  let _dataBeforeFilterAfterThreshold = null;
  let _yearScale = null;
  let _yearTicks = null;
  let _cubeScale = null;
  const _stats = {
    itemsCount: 0,
    selectedItemsCount: 0,
    countGroupedByTerm: {},
    selectedCountGroupedByTerm: {},
    countGroupedByMultiSets: {},
    selectedCountGroupedByMultiSets: {},
    matrixStructure: {},
    countGroupedByRepo: {},
    selectedCountGroupedByRepo: {}
  };
  /**
   * hierarchy root element for the treemap visualization
   */
  let _simple_hierarchy_root = null;
  let _complex_hierarchy_root = null;

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
   * collection containing all highlighted lines drawn and visible only in selection
   */
  const _selectedLines = [];
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
    vis_type_treemap_sort_by: TREEMAP_SORT_BY_VALUE,
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
     * remove categories from items that are below the data_threshold
     */
    data_threshold_remove_categories_below: true,
    /**
     * function that is executes when clicking on an layers 
     */
    onLayerClick: (data) => {
      // visType, layerNumber, groupedByCategory, listOfItems, layerData
      console.info(data);
    },
    onSetClick: (event, data) => {
      // alert(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${listOfItems.length}`);
      console.info(`layerNumber: ${data.layerNumber}, setName: ${data.setName}, repoName: ${data.repoName}, count of items: ${data.items.length}`, data.items);

      let items = [];

      var names = [data.setName];
      var operation = 'union';
      if (data.setName.indexOf('tree.') === 0) {
        names = data.setName.replace('tree.', '').split('.');
        operation = names.length > 1 ? 'intersection' : 'union';
      }
      if (_.isEqual(sets_selected_categories, names)) {
        items = pCube.selectItemsBySets([], 'union');
      } else {
        items = pCube.selectItemsBySets(names, 'union');
      }

    },
    onSetHover: (data) => {
      return `layerNumber: ${data.layerNumber}${data.yearRange.join(' - ')}, setName: ${data.setName}, repoName: ${data.repoName}, count of items: ${data.items.length}`;
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
                      top: 0;
                      left: 0;
                      color: white;
                    }
                    #infoCounter {
                      position: absolute;
                      top: 0;
                      right: 10px;
                      color: white;
                    }
                    #selectionInfoBox {
                      position: absolute;
                      top: 25px;
                      right: 10px;
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
   * Memory storage for items that are in the current selection
   */
  pCube.sets_selected_items_memory = [];
  /**
   * data storage for the treemap data
   */
  pCube.treemap_sets = {};
  /**
   * data storage for the treemap data with category hierarchy 
   */
  pCube.treemap_hierarchy = {};
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
   * currently selected repository name in which categories and operation are performed
   */
  sets_selected_repository = null;

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
  pCube.getPossibleSetsToIntersectSortedByTotalCount = (setName, setName2) => {
    let list = [];
    Object.keys(_stats.countGroupedByMultiSets)
      .filter(k => k.indexOf(setName) > -1 && (setName2 ? k.indexOf(setName2) > -1 : true))
      .map(k => k.split(','))
      .forEach(k => {
        list = _.union(list, k);
      });

    if (isTreemapHierarchy()) {
      list = [];
      Object.keys(_stats.countGroupedByMultiSets)
        .filter(k => k.indexOf(setName) > -1 && (setName2 ? k.indexOf(setName2) > -1 : true))
        .map(k => {
          const names = [setName];
          if (setName2) {
            names.push(setName2);
          }
          const tmp = names.join(',');
          console.info(k, tmp)
          return k.substring(k.indexOf(tmp)).split(',').slice(names.length);
        })
        .forEach(k => {
          let v = k[0];
          list = v ? _.union(list, [v]) : list;
        });
    }

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

  pCube.getRepositoriesSortedByTotalCount = () => {
    return Object.keys(_stats.countGroupedByRepo)
      .sort((a, b) => _stats.countGroupedByRepo[b] - _stats.countGroupedByRepo[a])
      .map(x => {
        return { repoName: x, count: _stats.countGroupedByRepo[x] };
      });
  };

  const categoryTotalPercentage = cat => {
    return _stats.countGroupedByTerm[cat] / pCube.sets_options.parsedData.length;
  }

  const categoryAboveThreshold = cat => {
    let per = categoryTotalPercentage(cat);
    return per >= pCube.sets_options.data_threshold;
  }

  const isAboveThreshold = d => {
    let percentAmount = 0;
    d.term.forEach(t => {
      let per = categoryTotalPercentage(t);
      if (percentAmount < per) {
        percentAmount = per;
      }
    });
    return percentAmount >= pCube.sets_options.data_threshold;
  };

  const buildTotalStats = (data) => {
    _stats.countGroupedByTerm = {};
    _stats.countGroupedByMultiSets = {};
    _stats.countGroupedByRepo = {};

    data.forEach((val, idx) => {
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

      if (!_stats.countGroupedByRepo[val.repoName]) {
        _stats.countGroupedByRepo[val.repoName] = 1;
      } else {
        _stats.countGroupedByRepo[val.repoName] += 1;
      }
    });
  };

  const buildSelectedStats = (data) => {
    _stats.selectedCountGroupedByTerm = {};
    _stats.selectedCountGroupedByMultiSets = {};
    _stats.selectedCountGroupedByRepo = {};

    data.forEach((val, idx) => {
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
      if (!_stats.selectedCountGroupedByRepo[val.repoName]) {
        _stats.selectedCountGroupedByRepo[val.repoName] = 1;
      } else {
        _stats.selectedCountGroupedByRepo[val.repoName] += 1;
      }
    });
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
    pCube.root.addEventListener('mouseup', onMouseUp, false);
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

      _infoCounter = document.createElement('div');
      _infoCounter.id = 'infoCounter';
      pCube.root.appendChild(_infoCounter);

      _selectionInfoBox = document.createElement('div');
      _selectionInfoBox.id = 'selectionInfoBox';
      pCube.root.appendChild(_selectionInfoBox);
    }

    pCube.sets_options = { ...default_options, ...options };

    console.info('options:', pCube.sets_options);

    pCube.sets_filtered_by_selection = options.parsedData.map(d => d).filter(x => x.time !== null);
    console.info(`No Date filter reduced data from ${pCube.sets_options.parsedData.length} to ${pCube.sets_filtered_by_selection.length}`);

    // create stats for sets and multi-sets before filtering
    buildTotalStats(pCube.sets_filtered_by_selection);

    if (SWITCH_OUTPUT_OBJECTS_WITH_MULTIPLE_SETS) {
      console.info(`out of ${pCube.sets_filtered_by_selection.length} items, ${_.sum(Object.values(_stats.countGroupedByMultiSets))} have multiple categories`, _stats.countGroupedByMultiSets);
    }

    pCube.sets_filtered_by_selection = options.parsedData.map(d => d);

    // filter out data that is below the data threshold - based on the number of already filtered out data.
    const pre_threshold_count = pCube.sets_filtered_by_selection.length;
    if (pCube.sets_options.data_threshold) {
      pCube.sets_filtered_by_selection = pCube.sets_filtered_by_selection.filter(isAboveThreshold);
      if (pCube.sets_options.data_threshold_remove_categories_below) {
        pCube.sets_filtered_by_selection.map(d => {
          d.term = d.term.filter(t => categoryAboveThreshold(t));
          return d;
        });
      }
      console.info(`Threshold filter reduced data from ${pre_threshold_count} to ${pCube.sets_filtered_by_selection.length}`);
    }

    // build stats after threshold filter
    buildTotalStats(pCube.sets_filtered_by_selection);
    _dataBeforeFilterAfterThreshold = pCube.sets_filtered_by_selection.map(d => d);
    _stats.totalItemsCount = pCube.sets_filtered_by_selection.length;

    // create initial treemap data from all data before time filtering
    if (isTreemapHierarchy()) {
      let tmp = [emptyTreemapHierarchyStructure(pCube.sets_filtered_by_selection)];
      pCube.sets_filtered_by_selection.forEach(val => {
        let tkey = ['tree'];
        val.term.forEach(v => {
          tkey.push(v);
          tmp[0][tkey.join('.')].push(val);
        });
      });
      doTreemapHierarchyLayout(tmp, 0);
    } else {
      let tmp = [{}];
      Object.keys(_stats.countGroupedByTerm).forEach(x => {
        let arr = [];
        arr.length = _stats.countGroupedByTerm[x];
        tmp[0][x] = arr;
      });
      doTreemapLayout(tmp, 0);
    }

    pCube.sets_filtered_by_selection = pCube.sets_options.data_with_categories && pCube.sets_options.data_with_categories.length > 0 ? pCube.sets_filtered_by_selection
      .filter(d => _.intersection(d.term, pCube.sets_options.data_with_categories).length > 0)
      .map(d => {
        if (SWITCH_DATA_REMOVE_UNLISTED_CATEGORIES) {
          d.term = _.intersection(d.term, pCube.sets_options.data_with_categories);
        }
        return d;
      }) : pCube.sets_filtered_by_selection;

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

    // create stats for sets and multi-sets after filtering
    buildSelectedStats(pCube.sets_filtered_by_selection);

    pCube.treemap_sets = []; // data for treemap grouped by layerNumber.setname
    pCube.treemap_hierarchy = []; // grouped by hierarchy setnames
    pCube.matrix_sets = {};
    pCube.sets_matrix_objects = {};

    const findBestTicks = (min, max, wantedTicks) => {
      let tickSize = findBestTickSize(min, max, wantedTicks);
      let range = d3.range(min, max, tickSize);
      range.push(max);
      return range.map(y => parseInt(y, 10));
    }

    const findBestTickSize = (min, max, wantedTicks) => {
      var ticks = null;
      var tickSize = null
      tickSize = d3.tickStep(min, max, wantedTicks);
      ticks = d3.range(min, max, tickSize).length;
      while (ticks !== wantedTicks) {
        tickSize = ticks > wantedTicks ? tickSize + (tickSize / 10) : tickSize - (tickSize / 10);
        ticks = d3.range(min, max, tickSize).length;
      }

      return tickSize;
    }

    // TODO: Maybe Think about this https://github.com/segmentio/chunk-date-range

    // time
    let years = pCube.sets_options.data_year_range.concat(pCube.sets_filtered_by_selection.map(d => d.time));
    let dateExt = d3.extent(years);

    let tickValues = findBestTicks(dateExt[0], dateExt[1], NUMBER_OF_LAYERS);
    // console.info(tickValues);
    // let rangeValues = findBestTicks(DOMAIN_RANGE[0], DOMAIN_RANGE[1], NUMBER_OF_LAYERS);
    // [dateExt[0], dateExt[1]] DOMAIN_RANGE
    _yearTicks = tickValues;
    // _yearScale = d3.scaleLinear().domain(tickValues).range(rangeValues).clamp(true).nice();
    // console.debug(dateExt, _yearScale(dateExt[0]), _yearScale(dateExt[1]), Math.floor(_yearScale(1000)));
    // pCube.dateTestEx(dateExt);

    // update labels 
    const createDateFromYear = (year) => {
      let d = new Date(year, 1, 1);
      d.setFullYear(year);
      return d;
    };
    let mi = new Date();
    mi.setFullYear(dateExt[0]);
    let ma = new Date();
    ma.setFullYear(dateExt[1]);
    pCube.drawLabels({ //Todo: fix label with proper svg
      labelPosition: {
        x: CUBE_SIZE_HALF + 20, //offset border
        y: -(CUBE_SIZE / 2) + 20,
        z: CUBE_SIZE_HALF + 20
      },
      deleteLabels: true,
      labelCount: _yearTicks.length,
      dateArray: _yearTicks.map(createDateFromYear),
      fontSize: 20,
      startDate: ma, // switched because of drawLabels logic
      endDate: mi // switched because of drawLabels logic
    });
    pCube.drawLabels({ //Todo: fix label with proper svg
      labelPosition: {
        x: -(CUBE_SIZE_HALF + 20), //offset border
        y: -(CUBE_SIZE / 2) + 20,
        z: -(CUBE_SIZE_HALF + 20)
      },
      rotation: { y: 200 },
      deleteLabels: false,
      labelCount: _yearTicks.length,
      dateArray: _yearTicks.map(createDateFromYear),
      fontSize: 20,
      startDate: ma, // switched because of drawLabels logic
      endDate: mi // switched because of drawLabels logic
    });

    // reinsert the previous data to be analysed, if cube should start with data instead of nothing.
    // but only if you also do the sumup step otherwise there is to many data in the first layer
    if (pCube.sets_options.vis_type_set_calculation_option === TIME_CUTTING && pCube.sets_options.data_layer_sumUp) {
      pCube.sets_filtered_by_selection = pCube.sets_filtered_by_selection.concat(_sets_data_before_time_range);
    }

    // cube scale
    // _stats.totalItemsCount = pCube.sets_options.parsedData.length;
    _stats.selectedItemsCount = pCube.sets_filtered_by_selection.length;
    // if use TIME_CUTTING use all items in cube scaling, if ONLY_TIME_RANGE use only filtered time data
    _stats.itemsCount = pCube.sets_options.vis_type_set_calculation_option === TIME_CUTTING ? _stats.totalItemsCount : _stats.selectedItemsCount;
    _cubeScale = d3.scaleLog().clamp(true).domain([1, _stats.itemsCount]).range([0, CUBE_SIZE]);
    // _cubeScale = d3.scaleLinear().clamp(true).domain([1, _stats.itemsCount]).range([0, CUBE_SIZE]); // TODO: LOG-SCALE of the Cube?


    // do matrix and classification 
    const matrixStruct = emptyMatrixSetStructure(_dataBeforeFilterAfterThreshold);
    _stats.matrixStructure = matrixStruct;
    const setsStruct = emptyTreemapSetStructure(_dataBeforeFilterAfterThreshold);
    const hierarchyStruct = emptyTreemapHierarchyStructure(_dataBeforeFilterAfterThreshold);
    _matrix_struct_info = {
      setNames: matrixStruct.setNames,
      repoNames: matrixStruct.repoNames
    };

    for (var index = -1; index < NUMBER_OF_LAYERS; index++) {
      if (!pCube.treemap_sets[index]) {
        pCube.treemap_sets[index] = _.cloneDeep(setsStruct);
      }
      if (!pCube.treemap_hierarchy[index]) {
        pCube.treemap_hierarchy[index] = _.cloneDeep(hierarchyStruct);
      }
      if (!pCube.matrix_sets[index]) {
        pCube.matrix_sets[index] = _.cloneDeep(matrixStruct.matrix);
        pCube.sets_matrix_objects[index] = _.cloneDeep(matrixStruct.matrixObjects);
      }
    }

    // classifications
    pCube.sets_filtered_by_selection.forEach((val, idx) => {

      // let layerNumber = val.time === null ? -1 : Math.floor(_yearScale(val.time));
      let layerNumber = val.time === null ? -1 : getLayerNumberFromYear(val.time);
      let tkey = ['tree'];
      val.term.forEach(v => {
        pCube.treemap_sets[layerNumber][v].push(val);

        tkey.push(v);
        pCube.treemap_hierarchy[layerNumber][tkey.join('.')].push(val);

        let setIdx = matrixStruct.setNames.indexOf(v);
        let repoIdx = matrixStruct.repoNames.indexOf(val.repoName);
        pCube.matrix_sets[layerNumber][setIdx][repoIdx] += 1;
        pCube.sets_matrix_objects[layerNumber][setIdx][repoIdx].push(val);
      });
    });

    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.debug(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.debug(`treemap_hierarchy: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_hierarchy[index])} items`);
      console.debug(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
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
        pCube.treemap_hierarchy[k] = _.mergeWith({}, pCube.treemap_hierarchy[k], pCube.treemap_hierarchy[k - 1], customizer);
        pCube.matrix_sets[k] = _.mergeWith(pCube.matrix_sets[k], pCube.matrix_sets[k - 1], arraySumUp);
        pCube.sets_matrix_objects[k] = pCube.sets_matrix_objects[k].map((a, ai) => {
          return a.map((b, bi) => {
            return b.concat(pCube.sets_matrix_objects[k - 1][ai][bi]);
          });
        });
      }
    }

    for (var index = 0; index < NUMBER_OF_LAYERS; index++) {
      console.debug(`treemap: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_sets[index])} items`);
      console.debug(`treemap_hierarchy: layer ${index} with ${getTreemapLayerItemCount(pCube.treemap_hierarchy[index])} items`);
      console.debug(`matrix: layer ${index} with ${getMatrixLayerItemCount(pCube.matrix_sets[index])} items`);
      console.debug(`sets_matrix_objects: layer ${index} with ${getMatrixLayerItemCountWithIdArray(pCube.sets_matrix_objects[index])} items`);
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
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY) {
      drawTreemapHierarchy();
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT) {
      drawTreemapHierarchyFlat();
    }

    updateInfoCounter();

    if (sets_selected_categories.length > 0 && sets_selected_operations) {
      pCube.selectItemsBySets(sets_selected_categories, sets_selected_operations, sets_selected_repository);
    } else if (sets_selected_repository) {
      pCube.selectItemsBySets([], 'union', sets_selected_repository);
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
  var _mouseDown = new THREE.Vector2();
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
      let selectionName = box.userData.setName;
      if (box.name === 'set-box') {
        items = getListOfItemsByVisType(box.userData);
      } else if (box.name === 'set-box-selection') {
        selectionName = buildSelectionName(sets_selected_operations, sets_selected_categories);
        items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, sets_selected_categories, sets_selected_repository));
      }

      let yearRange = getYearRangeFromLayerNumber(box.userData.layerNumber);
      updateInfoBox(polyCube.sets_options.onSetHover({ ...box.userData, items: items, yearRange: yearRange }));

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

  const didMouseMove = (event) => {
    if (event) {
      let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
      _mouse.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
      _mouse.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;
    }

    return !_.isEqual(_mouse, _mouseDown);
  };

  const onMouseMove = (event) => {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
    _mouse.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
    _mouse.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;
  };

  const onMouseDown = (event) => {
    let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
    _mouseDown.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
    _mouseDown.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;
  }

  const onMouseUp = (event) => {
    let rect = pCube.getGLRenderer().domElement.getBoundingClientRect();
    _mouse.x = ((event.clientX - rect.left) / pCube.getInnerWidth()) * 2 - 1;
    _mouse.y = - ((event.clientY - rect.top) / pCube.getInnerHeight()) * 2 + 1;

    if (didMouseMove()) {
      return;
    }

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
        pCube.sets_options.onSetClick(event, data);
      } else if (box.name === 'set-box-selection') {
        let items = getListOfItemsByVisType(box.userData).filter(buildSetOperationFunction(sets_selected_operations, sets_selected_categories, sets_selected_repository));
        let data = {
          visType: pCube.sets_options.vis_type,
          layerNumber: box.userData.layerNumber,
          setName: box.userData.setName,
          repoName: box.userData.repoName,
          items: items
        };
        pCube.sets_options.onSetClick(event, data);
      }
    } else {
      updateInfoBox('');
    }

  };

  /**
   * mark sets with the highlight color and give all other elements the base color
   */
  pCube.selectSet = (setName, layerNumber) => {
    TWEEN.removeAll();
    sets_selected_category = setName || null;

    _selectionInfoBox.innerText = sets_selected_category;

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
    updateInfoCounter();
    return items;
  };

  /**
   * highlight boxes or rects based on the given array of setnames
   * @param setNames: list of categories
   * @param overlappingOption: set operation performed on the categories
   * @param repoName: repository name in which the categories and action should be performed. 
   */
  pCube.selectItemsBySets = (setNames, overlappingOption = pCube.OVERLAPPING_OPTIONS[0], repoName = sets_selected_repository) => {
    TWEEN.removeAll();

    setNames = convertTreeHierarchySetNames(setNames);

    setNames = _.uniq(setNames);
    console.info('select of overlapping sets:', setNames, repoName);
    sets_selected_categories = setNames || [];
    sets_selected_operations = overlappingOption || null;
    sets_selected_repository = repoName || null;
    if (sets_selected_categories === ['']) {
      sets_selected_categories = [];
    }

    clearSelection();
    if (sets_selected_categories === [] && sets_selected_repository === null) {
      return [];
    }

    _selectionInfoBox.innerText = buildSelectionName(sets_selected_operations, sets_selected_categories, sets_selected_repository);
    updateInfoCounter();

    let items = [];
    if (sets_selected_categories.length > 0 || sets_selected_repository) {
      switch (sets_selected_operations) {
        case OVERLAPPING_OPTION_UNION: {
          items = selectItemsBySetsUnion(sets_selected_categories, sets_selected_repository);
          break;
        }
        case OVERLAPPING_OPTION_INTERSECTION: {
          items = selectItemsBySetsIntersection(sets_selected_categories, sets_selected_repository);
          break;
        }
      }
    }

    console.info('selected items:', items);
    pCube.sets_selected_items_memory = items;
    updateInfoCounter();

    return items;
  };

  pCube.showSetsStats = () => {
    return _stats;
  };

  pCube.getCurrentSelectionInfo = () => {
    return {
      selectionName: buildSelectionName(sets_selected_operations, sets_selected_categories, sets_selected_repository),
      categories: sets_selected_categories,
      operation: sets_selected_operations,
      repoName: sets_selected_repository
    };
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
    _simple_hierarchy_root = null;
    _complex_hierarchy_root = null;
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
    _selectedLines.splice(0, _selectedLines.length);
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

  const getLayerNumberFromYear = (year) => {
    const idx = _.findIndex(_yearTicks, x => x >= year) - 1;
    return idx === -1 ? 0 : idx;
  }

  const getYearRangeFromLayerNumber = (layerNumber) => {
    // let year = _yearScale.invert(layerNumber);
    // let end = _yearScale.ticks().filter(x => x > year)[0];
    // let start = _yearScale.ticks().filter(x => x < year).slice(-1)[0];
    let year = _yearTicks[layerNumber];
    let end = _yearTicks.filter(x => x > year)[0];
    let start = year;
    end = _.isUndefined(end) ? year : end;
    let range = [start, end];
    // console.info(range);
    return range;
  }

  const updateInfoBox = (text = '') => {
    if (_infoBox) {
      _infoBox.innerText = text;
    }
  };

  const updateInfoCounter = () => {
    if (_infoCounter) {
      const ct = polyCube.sets_selected_items_memory.length > 0 ? polyCube.sets_selected_items_memory.length : polyCube.sets_filtered_by_selection.length;
      _infoCounter.innerText = `${ct} items displayed`;
    }
  }

  const toggleBoxOpacity = (b, opacity, borderOpacity = 0) => {
    b.material.opacity = opacity;
    if (b.children.length > 0) {
      b.children[0].material.opacity = borderOpacity;
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
          const targetOpacity = pCube.sets_options.vis_type_matrix_count_opacity ? b.userData.defaultOpacity : 1;

          if (isTreemapHierarchy()) {
            if (b.userData.setName.split('.').length === 2) {
              toggleBoxOpacity(b, targetOpacity, 1);
            } else {
              b.visible = false;
            }
          } else {
            toggleBoxOpacity(b, targetOpacity, 1);
          }
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

        b.children[0].element.isClickable = true;

        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          b.children[0].element.style.opacity = TREEMAP_FLAT_RECT_OPACITY;
          b.children[0].element.style.display = '';
          if (isTreemapHierarchy()) {
            if (b.userData.setName.split('.').length === 2) {
              b.children[0].element.style.display = '';
            } else {
              b.children[0].element.style.display = 'none';
            }
          }
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
    _selectedLines.forEach(line => {
      pCube.getGLScene().remove(line);
    });

  };

  const isTreemapHierarchy = () => {
    return pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY || pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT;
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
    } else if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY || pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT) {
      if (userData) {
        return getListOfItemsInTreemapHierarchy(userData.layerNumber, userData.setName);
      } else {
        return getListOfItemsInTreemapHierarchy();
      }
    }
  };

  const buildSelectionName = (operation, setNames, repoName) => {
    let repoStr = repoName ? ` in '${repoName}'` : '';

    if (operation === OVERLAPPING_OPTION_UNION) {
      return setNames.join(' ∪ ') + repoStr;
    } else if (operation === OVERLAPPING_OPTION_INTERSECTION) {
      return setNames.join(' ∩ ') + repoStr;
    }
  };

  const convertTreeHierarchySetNames = (setNames) => {

    // FIXME: feels a bit to hacky
    if (pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY || pCube.sets_options.vis_type === SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT) {
      if (_.isArray(setNames) && setNames.length > 0 && setNames[0].indexOf('tree.') === 0) {
        setNames = _.flatten(setNames.map(x => x.replace('tree.', '').split('.')));
      } else if (setNames.indexOf('tree.') === 0) {
        setNames = setNames.replace('tree.', '').split('.');
      }
    }
    return setNames;
  }

  const buildSetOperationFunction = (operation, setNames, repoName) => {
    const fnInRepo = (itm) => repoName ? itm.repoName === repoName : true;
    setNames = convertTreeHierarchySetNames(setNames);

    if (operation === OVERLAPPING_OPTION_UNION && setNames.length > 0) {
      if (isTreemapHierarchy()) {
        return itm => {
          const arr = _.intersection(itm.term, setNames);
          return arr.length > 0 && itm.term.join('.').indexOf(arr.join('.')) === 0;
        };
      } else {
        return itm => {
          return _.intersection(itm.term, setNames).length > 0 && fnInRepo(itm);
        };
      }
    } else if (operation === OVERLAPPING_OPTION_INTERSECTION && setNames.length > 0) {
      if (isTreemapHierarchy()) {
        return itm => {
          return itm.term.join('.').indexOf(setNames.join('.')) === 0;
        }
      } else {
        return itm => {
          return _.intersection(itm.term, setNames).length === setNames.length && fnInRepo(itm);
        };
      }
    } else {
      return itm => {
        return fnInRepo(itm);
      }
    }
  }

  const selectItemsBySetsUnion = (setNames, repoName) => {
    const selectionItems = (userData) => {
      // check if list contains items that needs to be selected (multi-sets)
      return getListOfItemsByVisType(userData).filter(buildSetOperationFunction(OVERLAPPING_OPTION_UNION, setNames, repoName));
    };

    const fnGetItems = (userData) => {
      return getListOfItemsByVisType(userData);
    };
    const fnDisplayObject = (userData) => {
      var set = true;
      if (isTreemapHierarchy()) {
        // const sn = convertTreeHierarchySetNames(userData.setName);
        const count = setNames.filter(x => userData.setName === 'tree.' + x).length;
        set = setNames.length > 0 ? count > 0 : true;
      } else {
        set = setNames.length > 0 ? setNames.indexOf(userData.setName) > -1 : true;
      }

      const repo = repoName ? userData.repoName === repoName : true;
      return set && repo;
    };

    let selectionName = buildSelectionName(OVERLAPPING_OPTION_UNION, setNames, repoName);

    selectItemsBySetsTweenBasedOnSelectionItemsFunction(selectionItems, fnGetItems, selectionName, fnDisplayObject);

    return getListOfItemsByVisType().filter(buildSetOperationFunction(OVERLAPPING_OPTION_UNION, setNames, repoName));
  };

  const selectItemsBySetsIntersection = (setNames, repoName) => {
    const selectionItems = (userData) => {
      // check if list contains items that needs to be selected (multi-sets)
      return getListOfItemsByVisType(userData).filter(buildSetOperationFunction(OVERLAPPING_OPTION_INTERSECTION, setNames, repoName));
    };

    const fnGetItems = (userData) => {
      return getListOfItemsByVisType(userData);
    };
    const fnDisplayObject = (userData) => {
      var set = true;
      if (isTreemapHierarchy()) {
        const comp = 'tree.' + setNames.join('.');
        set = setNames.length > 0 ? comp === userData.setName : true;
      } else {
        set = setNames.length > 0 ? setNames.indexOf(userData.setName) > -1 : true;
      }

      const repo = repoName ? userData.repoName === repoName : true;
      return set && repo;
    };

    let selectionName = buildSelectionName(OVERLAPPING_OPTION_INTERSECTION, setNames, repoName);

    selectItemsBySetsTweenBasedOnSelectionItemsFunction(selectionItems, fnGetItems, selectionName, fnDisplayObject);

    return getListOfItemsByVisType().filter(buildSetOperationFunction(OVERLAPPING_OPTION_INTERSECTION, setNames, repoName));
  };

  const selectItemsBySetsTweenBasedOnSelectionItemsFunction = (fnSelectionItems, fnGetItems, selectionName, fnDisplayObject) => {
    let boxesAndLines = [].concat(_boxes, _lines);

    _lines.forEach(b => {
      if (b.name === 'set-line') {
        let selectionItems = fnSelectionItems(b.userData);
        b.visible = selectionItems.length && fnDisplayObject(b.userData) ? true : false; // TODO: draw lines on selected area!
        let co = new THREE.Color(selectionItems.length > 0 && fnDisplayObject(b.userData) ? _setOperationColorGL : _colorScale(b.userData.setName));

        b.visible = false;

        var colorTween = new TWEEN.Tween(b.material.color)
          .to(co, 1500)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .start();
      }
    });
    _boxes.forEach(b => {
      if (b.name === 'set-box' || b.name === 'set-rect') {
        let selectionItems = fnSelectionItems(b.userData);
        let parentBorderOpacity = 0;
        if (selectionItems.length > 0 && fnDisplayObject(b.userData)) { // FIXME: restrict view to sets that are really selected by user
          let selBox = b.children.find(x => x.name === 'set-box-selection');
          selBox.visible = true;
          let items = fnGetItems(b.userData);
          let nscale = selectionItems.length / items.length;
          selBox.scale.set(1, 1, nscale);
          // var colorTween = new TWEEN.Tween(selBox.material.color)
          //   .to(_setOperationColorGL, 1500)
          //   .easing(TWEEN.Easing.Sinusoidal.InOut)
          //   .start();

          selBox.children[0].material.opacity = 1;
          parentBorderOpacity = 0.2;

          if (isTreemapHierarchy()) {
            b.visible = true;
            const parts = b.userData.parentSetName.split('.');
            let tempLoop = [];
            parts.forEach(p => {
              tempLoop.push(p);
              if (tempLoop.length > 1) {
                _boxes.filter(x => x.name === 'set-box' && x.userData.layerNumber === b.userData.layerNumber && x.userData.setName === tempLoop.join('.')).forEach(temp => {
                  toggleBoxOpacity(temp, 0, parentBorderOpacity);
                });
              }
            });
          }

        }
        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          toggleBoxOpacity(b, 0, parentBorderOpacity);
        } else if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_COLOR) {
          var colorTween = new TWEEN.Tween(b.material.color)
            .to(_baseColorGL, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
        }

      }
    });
    let linesMemory = [];
    _layers.forEach((layer, layerNumber) => {
      if (!linesMemory[layerNumber]) {
        linesMemory[layerNumber] = {};
      }
    });
    _rects.forEach(b => {
      if (b.name === 'set-rect') {

        let selectionItems = fnSelectionItems(b.userData);
        let hasSelectPart = selectionItems.length > 0 && fnDisplayObject(b.userData);
        if (hasSelectPart) { // FIXME: restrict view to sets that are really selected by user

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
          let yearRange = getYearRangeFromLayerNumber(selElement.userData.layerNumber);
          let data = {
            visType: pCube.sets_options.vis_type,
            layerNumber: selElement.userData.layerNumber,
            setName: selElement.userData.setName,
            repoName: selElement.userData.repoName,
            items: selectionItems,
            yearRange: yearRange
          };
          selElement.element.onmouseup = (event) => !didMouseMove() && pCube.sets_options.onSetClick(event, data);
          selElement.element.onmouseover = () => {
            if (selElement.element.style.opacity > 0) {
              selElement.element.classList.add('set-rect-hover');
              updateInfoBox(polyCube.sets_options.onSetHover({ ...selElement.userData, items: selectionItems, yearRange: yearRange }));
            }
          };

          // create linesMemory for selection
          let w = parseFloat(selElement.element.style.width.replace('px', ''), 10);
          let d = newHeight;
          let p = _layers[selElement.userData.layerNumber].position;
          let tmp = { ...selElement, position: b.position }; // copy element properties but with position of parent cube, for correct lines positions.

          let rect = { rect: tmp, w, d, layerPos: p, setName: selElement.userData.setName };
          linesMemory[selElement.userData.layerNumber][selElement.userData.setName] = rect;

          // var colorTween = new TWEEN.Tween(curColor)
          //   .to(newColor, 1500)
          //   .easing(TWEEN.Easing.Sinusoidal.InOut)
          //   .onUpdate(() => {
          //     selElement.element.style.backgroundColor = curColor.rgb().toString();
          //   })
          //   .start();
        }
        let curColor = d3.color(b.children[0].element.style.backgroundColor);
        let newColor = d3.color(_baseColor);

        if (pCube.sets_options.vis_type_select_type === SELECT_TYPE_VISIBILITY) {
          if (hasSelectPart) {
            b.children[0].element.style.opacity = 0.1;
            b.children[0].element.isClickable = false;
          } else {
            b.children[0].element.style.opacity = 0;
            b.children[0].element.style.display = 'none';
          }
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

    drawLinesFromMemory(linesMemory);
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
            case SET_VIS_TYPE_TREEMAP_HIERARCHY:
            case SET_VIS_TYPE_TREEMAP_HIERARCHY_FLAT:
              animateSelectLayer(idx, pCube.treemap_hierarchy[idx]);

              var listOfItems = getListOfItemsInTreemapHierarchy(idx);

              var layerData = {
                visType: pCube.sets_options.vis_type,
                layerNumber: idx,
                groupedData: pCube.treemap_hierarchy[idx],
                items: listOfItems,
                raw: pCube.treemap_hierarchy[idx],
                layer: x,
                layerGL: _layersGL[idx]
              };
              pCube.sets_options.onLayerClick(layerData);
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
          // x.element.title = `${_yearScale.ticks()[idx]} - ${_yearScale.ticks()[idx + 1]}`;
          x.element.title = `${_yearTicks[idx]} - ${_yearTicks[idx + 1]}`;

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

  const drawLinesBetweenRects = (rect, prevRect, name, layerNumber, container) => {
    if (pCube.sets_options.vis_type_treemap_flat_line_style === LINE_STYLE_CENTER) {
      drawLine(name, layerNumber, container,
        new THREE.Vector3(rect.rect.position.x, rect.layerPos.y, rect.rect.position.z),
        new THREE.Vector3(prevRect.rect.position.x, prevRect.layerPos.y, prevRect.rect.position.z)
      );
    } else if (pCube.sets_options.vis_type_treemap_flat_line_style === LINE_STYLE_CORNER) {
      for (let k = 0; k < 4; k++) {
        let tx = (rect.w / 2), ty = (rect.d / 2), ptx = (prevRect.w / 2), pty = (prevRect.d / 2);
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
        drawLine(name, layerNumber, container,
          new THREE.Vector3(
            rect.rect.position.x + tx,
            rect.layerPos.y,
            rect.rect.position.z + ty
          ),
          new THREE.Vector3(
            prevRect.rect.position.x + ptx,
            prevRect.layerPos.y,
            prevRect.rect.position.z + pty
          )
        );
      }
    }
  };

  const drawLinesFromMemory = (linesMemory) => {
    linesMemory.forEach((memory, layerNumber) => {
      Object.keys(memory).forEach(name => {
        let rect = memory[name];
        if (layerNumber > 0) {
          let prevRect = linesMemory[layerNumber - 1][name];
          if (prevRect) {
            drawLinesBetweenRects(rect, prevRect, rect.setName, layerNumber, _linesContainer);
          }
        }
      });
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
        nodes.forEach((n, i) => {
          if (n.value === 0) {
            return;
          }
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

  const drawTreemapHierarchy = () => {
    _layers.forEach((layer, idx) => {
      let p = layer.position;
      if (idx < NUMBER_OF_LAYERS) {
        let count = getListOfItemsByVisType({ layerNumber: idx }).length;
        let cubeSize = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT ? _cubeScale(count) : CUBE_SIZE; // TODO: scale only works for total-count
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapHierarchyLayout(pCube.treemap_hierarchy, idx);
        // let maxDepth = d3.max(nodes, x => x.depth);
        nodes.forEach((n, i) => {
          if (n.value === 0) {
            return;
          }
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (SWITCH_TREEMAP_RENDER_IN_WEBGL) {
            const l = _layersGL[idx];
            // let depthHeight = (LAYER_SIZE / maxDepth) * n.depth;
            let box = drawBoxGL(l, idx, n.data.name, null, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count, 1, true, true);
            box.visible = n.depth === 1;
          } else {
            drawBox(layer, idx, n.data.name, null, n.x0, -LAYER_SIZE_HALF, n.y0, w, LAYER_SIZE, d, count);
          }
        });
      }
    });
  };

  const drawTreemapHierarchyFlat = () => {
    let linesMemory = [];
    _layers.forEach((layer, layerNumber) => {
      if (!linesMemory[layerNumber]) {
        linesMemory[layerNumber] = {};
      }
    });
    _layers.forEach((layer, layerNumber) => {

      let p = layer.position;
      if (layerNumber < NUMBER_OF_LAYERS) {

        let count = getListOfItemsByVisType({ layerNumber: layerNumber }).length;
        let cubeSize = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT ? _cubeScale(count) : CUBE_SIZE; // TODO: scale only works for total-count
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapHierarchyLayout(pCube.treemap_hierarchy, layerNumber);
        nodes.forEach(n => {
          if (n.value === 0) {
            return;
          }

          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (isNaN(d)) {
            console.error("weird NaN form treemap", d, n, nodes);
          }
          let rectObject = drawRect(layer, layerNumber, n.data.name, null, n.x0, 0, n.y0, w, LAYER_SIZE, d, count, TREEMAP_FLAT_RECT_OPACITY, true);
          rectObject.children[0].element.style.display = n.depth === 1 ? '' : 'none';

          if (n.depth === 1) {
            let rect = { rect: rectObject, w, d, layerPos: p, setName: n.data.name };
            linesMemory[layerNumber][n.data.name] = rect;
          }
        });
      }
    });

    drawLinesFromMemory(linesMemory);

    pCube.getGLBox().add(_linesContainer);
  };

  /**
   * draw a treemap visualation that is flat with connected lines between layers.
   */
  const drawTreemapFlat = () => {
    let linesMemory = [];
    _layers.forEach((layer, layerNumber) => {
      if (!linesMemory[layerNumber]) {
        linesMemory[layerNumber] = {};
      }
    });
    _layers.forEach((layer, layerNumber) => {

      let p = layer.position;
      if (layerNumber < NUMBER_OF_LAYERS) {

        let count = getListOfItemsByVisType({ layerNumber: layerNumber }).length;
        let cubeSize = pCube.sets_options.data_scale_cube === SCALE_TOTAL_COUNT ? _cubeScale(count) : CUBE_SIZE; // TODO: scale only works for total-count
        _tmap.size([cubeSize, cubeSize]);
        let nodes = doTreemapLayout(pCube.treemap_sets, layerNumber);
        nodes.forEach(n => {
          if (n.value === 0) {
            return;
          }

          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (isNaN(d)) {
            console.error("weird NaN form treemap", d, n, nodes);
          }
          let rectObject = drawRect(layer, layerNumber, n.data.name, null, n.x0, 0, n.y0, w, LAYER_SIZE, d, count, TREEMAP_FLAT_RECT_OPACITY, true);

          let rect = { rect: rectObject, w, d, layerPos: p, setName: n.data.name };
          linesMemory[layerNumber][n.data.name] = rect;
        });
      }
    });

    drawLinesFromMemory(linesMemory);

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
        const countRangeInLastLayer = d3.extent(Object.values(_stats.countGroupedByTerm));

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

  const getListOfItemsInTreemapHierarchy = (layerNumber, setName) => {
    if (setName && layerNumber >= 0) {
      return pCube.treemap_hierarchy[layerNumber][setName];
    } else if (layerNumber >= 0) {
      return Object.values(pCube.treemap_hierarchy[layerNumber]).reduce((o, cur) => {
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

  const emptyTreemapHierarchyStructure = (data) => {
    const storage = { 'tree': [] };
    data.forEach(x => {
      let tkey = ['tree'];
      x.term.forEach(t => {
        tkey.push(t);
        if (!storage[tkey.join('.')]) {
          storage[tkey.join('.')] = [];
        }
      });
      let key = tkey.join('.')
      if (!storage[key]) {
        storage[key] = [];
      }
    });

    return storage;
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
      if (repoNames.indexOf(val.repoName) === -1) {
        repoNames.push(val.repoName);
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

  const treemapSortFunction = (a, b) => {
    switch (pCube.sets_options.vis_type_treemap_sort_by) {
      case TREEMAP_SORT_BY_NAME: {
        return b.height - a.height || a.data.name.localeCompare(b.data.name);
      }
      case TREEMAP_SORT_BY_VALUE:
      default: {
        return b.height - a.height || b.value - a.value;
      }
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
    if (!_simple_hierarchy_root) { // init calculation with the biggest collection items 
      let maxLayer = dataset.length - 1;
      _simple_hierarchy_root = d3.hierarchy(data);
      _simple_hierarchy_root = _simple_hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[maxLayer][d.name].length : null; })
        .sort(treemapSortFunction);
      console.debug(_simple_hierarchy_root);
    }
    _simple_hierarchy_root = _simple_hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[layerNumber][d.name].length : null; })
      .sort(treemapSortFunction);
    let nodes = _tmap(_simple_hierarchy_root).leaves();
    console.debug(layerNumber, _simple_hierarchy_root);
    return nodes;
  };

  const doTreemapHierarchyLayout = (dataset, layerNumber) => {
    if (!dataset[layerNumber]) {
      return;
    }

    if (!_complex_hierarchy_root) { // init calculation with the biggest collection items 
      let list = Object.keys(dataset[0]).map(x => {
        return {
          name: x,
          count: dataset[0][x]
        };
      });
      var stratify = d3.stratify()
        .id(d => d.name)
        .parentId(d => {
          return d.name.substring(0, d.name.lastIndexOf("."));
        });

      let maxLayer = dataset.length - 1;
      _complex_hierarchy_root = stratify(list);
      _complex_hierarchy_root = _complex_hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[maxLayer][d.name].length : null; })
        .sort(treemapSortFunction);
      console.debug(_complex_hierarchy_root);
    }
    _complex_hierarchy_root = _complex_hierarchy_root.sum(function (d) { return d.name !== 'tree' && dataset[layerNumber][d.name] ? dataset[layerNumber][d.name].length : null; })
      .sort(treemapSortFunction);
    let nodes = _tmap(_complex_hierarchy_root).descendants();
    console.debug(layerNumber, _complex_hierarchy_root);
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
    element.isClickable = true;
    element.classList = ['set-side', 'set', 'set-rect', 'set-' + setName].join(' ')
    element.style.width = width + 'px';
    element.style.height = depth + 'px';
    element.style.border = "1px solid #000000";
    element.style.backgroundColor = _colorScale(setName);
    element.style.opacity = opacity;
    // element.title = setName;

    let items = getListOfItemsByVisType({ layerNumber, setName });
    let yearRange = getYearRangeFromLayerNumber(layerNumber);
    let data = {
      visType: pCube.sets_options.vis_type,
      layerNumber: layerNumber,
      setName: setName,
      repoName: null,
      items: items,
      yearRange: yearRange
    };
    element.onmouseup = (event) => !didMouseMove() && element.isClickable && pCube.sets_options.onSetClick(event, data);
    element.onmouseover = () => {
      if (element.style.opacity > 0 && element.isClickable) {
        element.classList.add('set-rect-hover');
        updateInfoBox(polyCube.sets_options.onSetHover(data));
        // updateInfoBox(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${items.length}`);
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
      selElement.style.backgroundColor = _colorScale(setName); // '#000';
      selElement.style.opacity = 0;
      selElement.style.display = 'none';

      // selElement.title = setName;
      let yearRange = getYearRangeFromLayerNumber(layerNumber);
      let data = {
        visType: pCube.sets_options.vis_type,
        layerNumber: layerNumber,
        setName: setName,
        repoName: null,
        items: [],
        yearRange: yearRange
      };
      selElement.onmouseup = (event) => !didMouseMove() && pCube.sets_options.onSetClick(event, data);
      selElement.onmouseover = () => {
        if (selElement.style.opacity > 0) {
          selElement.classList.add('set-rect-hover');
          updateInfoBox(polyCube.sets_options.onSetHover(data));
          // updateInfoBox(`layerNumber: ${layerNumber}, setName: ${setName}, repoName: ${repoName}, count of items: ${items.length}`);
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
    const parentSetName = isTreemapHierarchy() ? setName.substring(0, setName.lastIndexOf('.')) : null;
    set.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName, parentSetName, defaultOpacity: opacity };

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
        color: _colorScale(setName), // _setOperationColorGL,
        flatShading: THREE.FlatShading,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 4
      });
      let selBox = new THREE.Mesh(selGeometry, selMaterial);
      selBox.name = 'set-box-selection';
      selBox.userData = { setName: setName, layerNumber: layerNumber, repoName: repoName, parentSetName, defaultOpacity: opacity };
      selBox.visible = false;

      if (withBorder) {
        var geo = new THREE.EdgesGeometry(selBox.geometry); // or WireframeGeometry
        var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 1 });
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
