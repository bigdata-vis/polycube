/**
 * Created by syrenio on 19/09/2017.
 */
(function (pCube) {

  const _tmap = d3.treemap().tile(d3.treemapResquarify).size([500, 500]);
  const _colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
  let _nodes;

  pCube.drawSets = (dataset) => {

    doTreemapLayout(dataset);

    const dy = 50; // size between the layers
    pCube.getCube().children.filter(x => x.name === 'seg').forEach((layer, idx) => {
      let p = layer.position;
      if (idx === 0) {
        // drawBox("test", 50, 50, 100, 200, 300, p);
        _nodes.forEach( (n,idx) => {
          let w = n.x1 - n.x0;
          let d = n.y1 - n.y0;
          if (idx < 1000) {
            console.log(p,n)
            drawBox(n.data.name, n.x0, n.y0, w, 50, d, p);
          }
        });

      }
    });
  };

  const doTreemapLayout = (dataset) => {
    let data = {
      name: 'tree',
      children: Object.keys(dataset.sets).map(key => {
        return { name: key, count: dataset.sets[key].length };
      })
    };
    _root = d3.hierarchy(data);
    _root = _root.sum(function (d) { return d.count; })
      .sort(function (a, b) { return b.data.count - a.data.count; });
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
      } else if ( i < 4) {
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