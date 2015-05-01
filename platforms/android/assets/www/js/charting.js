

function drawChart(containerWidth, objTagArray, actionTagArray, propertyName, startDate, endDate) {
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = containerWidth - margin.left - margin.right,
      height = containerWidth - margin.top - margin.bottom;

  var yAxisLabel = propertyName;

  var parseDate = d3.time.format("%y-%m-%dT%H:%M:%S.%L").parse;

    //   {
    //     "dateTime": "2015-04-30T11:33:38.528409+00:00",
    //     "properties": {
    //         "ultraviolet-index": 0.31
    //     }
    // }

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

  $('#chartContainer').empty();
  var svg = d3.select("#chartContainer").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // var startDate = new Date('1 May 2015');
  // var endDate = new Date('2 May 2015');
  data = getChartData(objTagArray, actionTagArray, propertyName, startDate, endDate, function(data) {
  // d3.tsv("data.tsv", function(error, data) {
    data.forEach(function(d) {
      d.date = d.dateTime;
      d.close = d.properties[propertyName];
      d.date = new Date(d.date);
      // d.date = parseDate(d.date);
      d.close = +d.close;
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.close; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .text('Time');

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yAxisLabel);

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
    }, function() { alert('error'); });
}
