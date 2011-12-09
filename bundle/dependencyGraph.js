Vertex = function(name) {
    this.name = name;
    
    this.successors = [];
    this.predecessors = [];
    
    return this;
};

Vertex.prototype.isRootVertex = function() {
    return (this.predecessors.length === 0);
};

Vertex.prototype.deleteSuccessor = function(successorName) {
    var index = this.successors.indexOf(successorName);
    if (index > -1) {
        this.successors.splice(index,1);
        return true;
    } else {
        return false;
    }
};

Vertex.prototype.deletePredecessor = function(predecessorName) {
    var index = this.predecessors.indexOf(predecessorName);
    if (index > -1) {
        this.predecessors.splice(index,1);
        return true;
    } else {
        return false;
    }
};

Graph = function () {
    this.vertices = {};
    this.edgeCount = 0; // used to detect cycles when performing topological sort
    
    return this;
};

Graph.prototype.createVertex = function (vertexName) {
    var vertex = new Vertex(vertexName);
    this.vertices[vertex.name] = vertex;
};

Graph.prototype.hasVertex = function (vertexName) {
    return (this.vertices.hasOwnProperty(vertexName) !== 'undefined');
};

Graph.prototype.getRootVertices = function () {
    var rootVertices = [];
    for (var property in this.vertices) {
        if (this.vertices.hasOwnProperty(property) && this.vertices[property].isRootVertex()) {
            rootVertices.push(this.vertices[property]);
        }
    }
    return rootVertices;
};

Graph.prototype.addEdge = function (headVertexName, tailVertexName) {
    var headVertex,
        tailVertex,
        edge;
        
    if (!this.hasVertex(headVertexName) || !this.hasVertex(tailVertexName)) {
        return false;
    }
    
    headVertex = this.vertices[headVertexName];
    tailVertex = this.vertices[tailVertexName];
        
    // Check for existing edge
    if (!headVertex.hasSuccessor(tailVertex)) {
        headVertex.successors.push(tailVertex.name);
        tailVertex.predecessors.push(headVertex.name);
    }
    this.edgeCount++;
    return true;
};

Graph.prototype.delEdge = function (headVertexName, tailVertexName) {
    var headVertex,
        tailVertex,
        edge;
        
    if (!this.hasVertex(headVertexName) || !this.hasVertex(tailVertexName)) {
        return false;
    }
    
    headVertex = this.vertices[headVertexName];
    tailVertex = this.vertices[tailVertexName];
        
    // Check for existing edge
    if (headVertex.deleteSuccessor(tailVertex.name)) {
        tailVertex.deletePredecessor(headVertex.name);
        this.edgeCount--;
        return true;
    } else {
        return false;
    }
};

module.exports = function () {
    var graph;
    
    /**
     * Peforms a topological sort to determine load order.
     * Returns a traversal order if one can be found, otherwise throws an Error.
     * 
     * Reproduced from algorithm as described at:
     *  http://en.wikipedia.org/wiki/Topological_sort
     * 
     * Based upon work by Kahn (1962):
     *  Kahn, A. B. (1962), "Topological sorting of large networks", Communications of the ACM 5 (11): 558–562, doi:10.1145/368996.369025
     */
    function topologicalSort() {
        var graphRoots = graph.getRootVertices(),
            loadOrder = [];
        
        if (graphRoots.length === 0) {
            throw new Error('Graph has no root vertices');
        }
        
        while (graphRoots.length > 0) {
            var rootVertex = graphRoots.pop();
            loadOrder.push(rootVertex.name);
            while (rootVertex.successors.length > 0) {
                var successorVertex = rootVertex.successors.pop();
                graph.delEdge(rootVertex.name, successorVertex.name);
                
                if (successorVertex.isRootVertex()) {
                    graphRoots.push(successorVertex);
                }
            }
        }
        if (graph.edgeCount > 0) {
            throw new Error('Graph has at least one cycle');
        } else {
            return loadOrder;
        }
    }
    
    function addBundle(bundleName, bundleRequires) {
        console.log('Adding bundle: ' + bundleName);
        graph.createVertex(bundleName);
        bundleRequires.forEach(function (bundleDependency) {
            if (!graph.hasVertex(bundleDependency)) {
                graph.createVertex(bundleDependency);
            }
            graph.addEdge(bundleDependency, bundleName);
        });
    }
    
    function getLoadOrder() {
        try {
            return topologicalSort();
        } catch (e) {
            switch (e.message) {
                case 'Graph has no root vertices':
                case 'Graph has at least one cycle':
                    throw new Error('Circular dependencies detected; cannot determine a load order');
                    break;
                default:
                    throw e;
            }
        }
    }
    
    graph = new Graph();
    
    return {
        addBundle: addBundle,
        getLoadOrder: getLoadOrder
    };
}();