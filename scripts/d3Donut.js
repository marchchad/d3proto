var d3Donut = function(props){
  this.setProperties = function(props){
    for(var prop in props){
      this[prop] = props[prop];
    }
  };

  if(props) this.setProperties(props);
}

module.exports = d3Donut;