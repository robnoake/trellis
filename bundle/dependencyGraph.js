var Vertex = require('./vertex.js'),
	Graph = require('./graph.js');

function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}


module.exports = function() {
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
		var workingGraph = deepCopy(graph), graphRoots = workingGraph.getRootVertices(),
			loadOrder = [];

		if (Object.keys(workingGraph.vertices).length === 0) {
			throw new Error('Graph has no vertices');
		}

		if (graphRoots.length === 0) {
			throw new Error('Graph has no root vertices');
		}

		while (graphRoots.length > 0) {
			var rootVertex = graphRoots.pop();
			loadOrder.push(rootVertex.name);
			while (rootVertex.successors.length > 0) {
				var successorVertex = workingGraph.vertices[rootVertex.successors[0]];
				workingGraph.delEdge(rootVertex.name, successorVertex.name);

				if (successorVertex.isRootVertex()) {
					graphRoots.push(successorVertex);
				}
			}
		}
		if (workingGraph.edgeCount > 0) {
			throw new Error('Graph has at least one cycle');
		}
		else {
			return loadOrder;
		}
	}

	function addBundle(bundleName, bundleRequires) {
		if (!graph.hasVertex(bundleName)) {
			graph.createVertex(bundleName);
		}
		for (var i = 0; i < bundleRequires.length; i++) {
			var bundleDependency = bundleRequires[i];
			if (!graph.hasVertex(bundleDependency)) {
				graph.createVertex(bundleDependency);
			}
			graph.addEdge(bundleDependency, bundleName);
		}
	}

	function getLoadOrder() {
		try {
			return topologicalSort();
		}
		catch (e) {
			switch (e.message) {
			case 'Graph has no vertices':
				throw new Error('No bundles loaded, check your configuration');
			case 'Graph has no root vertices':
			case 'Graph has at least one cycle':
				throw new Error('Circular dependencies detected; cannot determine a load order');
			default:
				throw e;
			}
		}
	}

	function getDependents(bundleName) {
		return graph.vertices[bundleName].successors;
	}

	graph = new Graph();

	return {
		addBundle: addBundle,
		getLoadOrder: getLoadOrder,
		getDependents: getDependents
	};
}();
