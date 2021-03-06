/* globals */
//OBJECTS TO BE POPULATED WITH DATA LATER
var lines, valueLabels, nameLabels;
var pieData = [];    
var oldPieData = [];
var filteredPieData = [];
var arc;
var width = 450;
var height = 300;
var radius = 100;
var innerRadius = 60;
var textOffset = 14;
var tweenDuration = 500;

///////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////
///////////////////////////////////////////////////////////

function fillArray() {
  var arrayRange = 100; //range of potential values for each item
  return {
    port: "port",
    octetTotalCount: Math.ceil(Math.random() * (arrayRange))
  };
}

// Interpolate the arcs in data space.
function pieTween(d, i) {
  var s0;
  var e0;
  if(oldPieData[i]){
    s0 = oldPieData[i].startAngle;
    e0 = oldPieData[i].endAngle;
  }
  else if (!(oldPieData[i]) && oldPieData[i - 1]) {
    s0 = oldPieData[i - 1].endAngle;
    e0 = oldPieData[i - 1].endAngle;
  }
  else if(!(oldPieData[i - 1]) && oldPieData.length > 0){
    s0 = oldPieData[oldPieData.length - 1].endAngle;
    e0 = oldPieData[oldPieData.length - 1].endAngle;
  }
  else {
    s0 = 0;
    e0 = 0;
  }

  var inter = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});

  return function(t) {
    var b = inter(t);
    console.log(b);
    console.log(arc(b));
    return arc(b);
  };
}

function textTween(d, i) {
  var a;
  if(oldPieData[i]){
    a = (oldPieData[i].startAngle + oldPieData[i].endAngle - Math.PI) / 2;
  }
  else if (!(oldPieData[i]) && oldPieData[i - 1]) {
    a = (oldPieData[i - 1].startAngle + oldPieData[i - 1].endAngle - Math.PI) / 2;
  }
  else if(!(oldPieData[i - 1]) && oldPieData.length > 0) {
    a = (oldPieData[oldPieData.length - 1].startAngle + oldPieData[oldPieData.length - 1].endAngle - Math.PI) / 2;
  }
  else {
    a = 0;
  }
  var b = (d.startAngle + d.endAngle - Math.PI) / 2;

  var fn = d3.interpolateNumber(a, b);
  return function(t) {
    var val = fn(t);
    return "translate(" + Math.cos(val) * (radius + textOffset) + "," + Math.sin(val) * (radius + textOffset) + ")";
  };
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", function(){
  //D3 helper function to populate pie slice parameters from array data
  var donut = d3.layout.pie().value(function(d){
    return d.octetTotalCount;
  });
    //D3 helper function to create colors from an ordinal scale of 20 categorical colors
  var color = d3.scale.category20c();

  //D3 helper function to draw arcs, populates parameter "d" in path object
  arc = d3.svg.arc()
    .startAngle(function(d){ return d.startAngle; })
    .endAngle(function(d){ return d.endAngle; })
    .innerRadius(innerRadius)
    .outerRadius(radius);

  var vis = d3.select("#workspace").append("svg:svg")
    .attr("width", width)
    .attr("height", height);

  //GROUP FOR ARCS/PATHS
  var arc_group = vis.append("svg:g")
    .attr("class", "arc")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

  //GROUP FOR LABELS
  var label_group = vis.append("svg:g")
    .attr("class", "label_group")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

  //GROUP FOR CENTER TEXT  
  var center_group = vis.append("svg:g")
    .attr("class", "center_group")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

  //PLACEHOLDER GRAY CIRCLE
  var paths = arc_group.append("svg:circle")
      .attr("fill", "#EFEFEF")
      .attr("r", radius);

  //WHITE CIRCLE BEHIND LABELS
  var whiteCircle = center_group.append("svg:circle")
    .attr("fill", "white")
    .attr("r", innerRadius);

  // "TOTAL" LABEL
  var totalLabel = center_group.append("svg:text")
    .attr("class", "label")
    .attr("dy",  - 15)
    .attr("text-anchor", "middle") // text-align: right
    .text("TOTAL");

  //TOTAL TRAFFIC VALUE
  var totalValue = center_group.append("svg:text")
    .attr("class", "total")
    .attr("dy", 7)
    .attr("text-anchor", "middle") // text-align: right
    .text("Waiting...");

  //UNITS LABEL
  var totalUnits = center_group.append("svg:text")
    .attr("class", "units")
    .attr("dy", 21)
    .attr("text-anchor", "middle") // text-align: right
    .text("kb");

  var streakerDataAdded = d3.range(getRandomInt(1,3)).map(fillArray);
  var totalOctets = 0;
  var items = donut(streakerDataAdded);
  //REMOVE PLACEHOLDER CIRCLE
  arc_group.selectAll("circle").remove();
  filteredPieData = items.filter(filterData);

  function filterData(element, index, array) {
    element.name = array[index].data.port;
    element.value = array[index].data.octetTotalCount;
    totalOctets += element.value;
    return (element.value > 0);
  }

  totalValue.text(function(){
    var kb = totalOctets / 1024;
    return kb.toFixed(1);
  });

  //DRAW ARC PATHS
  paths = arc_group.selectAll("path").data(filteredPieData);

  paths.enter().append("svg:path")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("fill", function(d, i) { return color(i); });

  paths.transition()
      .duration(tweenDuration)
      .attrTween("d", pieTween);

  //DRAW TICK MARK LINES FOR LABELS
  lines = label_group.selectAll("line").data(filteredPieData);

  lines.enter().append("svg:line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", -radius - 3)
    .attr("y2", -radius - 8)
    .attr("stroke", "gray");

  lines.transition()
    .duration(tweenDuration)
    .attr("transform", function(d) {
      return "rotate(" + (d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + ")";
    });

  //lines.exit().remove();

  //DRAW LABELS WITH PERCENTAGE VALUES
  valueLabels = label_group.selectAll("text.value").data(filteredPieData)
    .attr("dy", function(d){
      if ((d.startAngle + d.endAngle) / 2 > Math.PI / 2 && (d.startAngle + d.endAngle) / 2 < Math.PI * 1.5 ) {
        return 5;
      } else {
        return -7;
      }
    })
    .attr("text-anchor", function(d){
      if ( (d.startAngle + d.endAngle) / 2 < Math.PI ){
        return "beginning";
      } else {
        return "end";
      }
    })
    .text(function(d){
      var percentage = (d.value/totalOctets)*100;
      return percentage.toFixed(1) + "%";
    });

  valueLabels.enter().append("svg:text")
    .attr("class", "value")
    .attr("transform", function(d) {
      return "translate(" + Math.cos(((d.startAngle + d.endAngle - Math.PI) / 2)) * (radius + textOffset) + "," + Math.sin((d.startAngle + d.endAngle - Math.PI) / 2) * (radius + textOffset) + ")";
    })
    .attr("dy", function(d){
      if ((d.startAngle + d.endAngle) / 2 > Math.PI / 2 && (d.startAngle + d.endAngle) / 2 < Math.PI * 1.5 ) {
        return 5;
      } else {
        return -7;
      }
    })
    .attr("text-anchor", function(d){
      if ( (d.startAngle + d.endAngle) / 2 < Math.PI ){
        return "beginning";
      } else {
        return "end";
      }
    }).text(function(d){
      var percentage = (d.value/totalOctets)*100;
      return percentage.toFixed(1) + "%";
    });

  valueLabels.transition()
    .duration(tweenDuration)
    .attrTween("transform", textTween);

  //valueLabels.exit().remove();

  //DRAW LABELS WITH ENTITY NAMES
  nameLabels = label_group.selectAll("text.units").data(filteredPieData)
    .attr("dy", function(d){
      if ((d.startAngle + d.endAngle) / 2 > Math.PI / 2 && (d.startAngle + d.endAngle) / 2 < Math.PI * 1.5 ) {
        return 17;
      } else {
        return 5;
      }
    })
    .attr("text-anchor", function(d){
      if ((d.startAngle + d.endAngle) / 2 < Math.PI ) {
        return "beginning";
      } else {
        return "end";
      }
    }).text(function(d){
      return d.name;
    });

  nameLabels.enter().append("svg:text")
    .attr("class", "units")
    .attr("transform", function(d) {
      return "translate(" + Math.cos(((d.startAngle + d.endAngle - Math.PI) / 2)) * (radius + textOffset) + "," + Math.sin((d.startAngle + d.endAngle - Math.PI) / 2) * (radius + textOffset) + ")";
    })
    .attr("dy", function(d){
      if ((d.startAngle + d.endAngle) / 2 > Math.PI / 2 && (d.startAngle + d.endAngle) / 2 < Math.PI * 1.5 ) {
        return 17;
      } else {
        return 5;
      }
    })
    .attr("text-anchor", function(d){
      if ((d.startAngle + d.endAngle) / 2 < Math.PI ) {
        return "beginning";
      } else {
        return "end";
      }
    }).text(function(d){
      return d.name;
    });

  nameLabels.transition()
    .duration(tweenDuration)
    .attrTween("transform", textTween);

  //nameLabels.exit().remove();
});