Vertex = function(name) {
	this.name = name;

	this.successors = [];
	this.predecessors = [];

	return this;
};

Vertex.prototype.addPredecessor = function(vertexName) {
	this.predecessors.push(vertexName);
};

Vertex.prototype.addSuccessor = function(vertexName) {
	this.successors.push(vertexName);
};

Vertex.prototype.hasSuccessor = function(vertexName) {
	return (this.successors.indexOf(vertexName) > -1);
};

Vertex.prototype.isRootVertex = function() {
	return (this.predecessors.length === 0);
};

Vertex.prototype.deleteSuccessor = function(successorName) {
	var index = this.successors.indexOf(successorName);

	if (index > -1) {
		this.successors.splice(index, 1);
		return true;
	}
	else {
		return false;
	}
};

Vertex.prototype.deletePredecessor = function(predecessorName) {
	var index = this.predecessors.indexOf(predecessorName);
	if (index > -1) {
		this.predecessors.splice(index, 1);
		return true;
	}
	else {
		return false;
	}
};

module.exports = Vertex;