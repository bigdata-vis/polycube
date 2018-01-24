THREE.Object3D.prototype.clear = function(){
    var children = this.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        child.clear();
        this.removeChild(child);
    }
};

