Graph = function() {
	this.vertices = {};
	this.edgeCount = 0; // used to detect cycles when performing topological sort
	return this;
};

Graph.prototype.createVertex = function(vertexName) {
	var vertex = new Vertex(vertexName);
	this.vertices[vertex.name] = vertex;
};

Graph.prototype.hasVertex = function(vertexName) {
	return this.vertices.hasOwnProperty(vertexName);
};

Graph.prototype.getRootVertices = function() {
	var rootVertices = [];
	for (var property in this.vertices) {
		if (this.vertices.hasOwnProperty(property) && this.vertices[property].isRootVertex()) {
			rootVertices.push(this.vertices[property]);
		}
	}
	return rootVertices;
};

Graph.prototype.addEdge = function(headVertexName, tailVertexName) {
	var headVertex, tailVertex, edge;

	if (!this.hasVertex(headVertexName) || !this.hasVertex(tailVertexName)) {
		return false;
	}

	headVertex = this.vertices[headVertexName];
	tailVertex = this.vertices[tailVertexName];

	// Check for existing edge
	if (!headVertex.hasSuccessor(tailVertex)) {
		headVertex.addSuccessor(tailVertex.name);
		tailVertex.addPredecessor(headVertex.name);
		this.edgeCount++;
	}
	return true;
};

Graph.prototype.delEdge = function(headVertexName, tailVertexName) {
	var headVertex, tailVertex, edge;

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
	}
	else {
		return false;
	}
};

module.exports = Graph;