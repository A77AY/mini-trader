function Graph(element, indicators, oIndicators, type, file, val) {
  const indicatorsArr = [];

  if (indicators.isMacd) indicatorsArr.push("macd");
  if (indicators.isRsi) indicatorsArr.push("rsi");
  if (indicators.isStochastic) indicatorsArr.push("stochastic");

  var dim = {
    width: element.offsetWidth, height: 700,
    margin: {top: 20, right: 50, bottom: 30, left: 50},
    ohlc: {heightPart: 0.5},
    indicator: {
      height: 0,
      padding: 5,
      count: Object.keys(indicators).length
    }
  };

  const height = dim.height - dim.margin.top - dim.margin.bottom;
  dim.ohlc.height = dim.indicator.count > 0 ? Math.round(height * dim.ohlc.heightPart) : height;

  if (dim.indicator.count > 0) dim.indicator.height = (height - dim.ohlc.height - (dim.indicator.padding * (dim.indicator.count + 1))) / dim.indicator.count;

  dim.plot = {
    width: dim.width - dim.margin.left - dim.margin.right,
    height: dim.height - dim.margin.top - dim.margin.bottom
  };
  dim.indicator.top = dim.ohlc.height + dim.indicator.padding;
  dim.indicator.bottom = dim.indicator.top + dim.indicator.height + dim.indicator.padding;


  var indicatorTop = d3.scale.linear()
    .range([dim.indicator.top, dim.indicator.bottom]);

  var parseDate = d3.time.format("%Y-%m-%d").parse;

  var zoom = d3.behavior.zoom()
    .on("zoom", draw);

  var zoomPercent = d3.behavior.zoom();

  var x = techan.scale.financetime()
    .range([0, dim.plot.width]);

  var y = d3.scale.linear()
    .range([dim.ohlc.height, 0]);

  var yPercent = y.copy();   // Same as y at this stage, will get a different domain later

  var yVolume = d3.scale.linear()
    .range([y(0), y(0.2)]);

  var candlestick = techan.plot[type]()
    .xScale(x)
    .yScale(y);

  var tradearrow = techan.plot.tradearrow()
    .xScale(x)
    .yScale(y)
    .y(function (d) {
      // Display the buy and sell arrows a bit above and below the price, so the price is still visible
      if (d.type === 'buy') return y(d.low) + 5;
      if (d.type === 'sell') return y(d.high) - 5;
      else return y(d.price);
    });

  var sma0 = techan.plot.sma()
    .xScale(x)
    .yScale(y);

  var sma1 = techan.plot.sma()
    .xScale(x)
    .yScale(y);

  var ema2 = techan.plot.ema()
    .xScale(x)
    .yScale(y);

  var ichimoku = techan.plot.ichimoku()
    .xScale(x)
    .yScale(y);

  var volume = techan.plot.volume()
    .accessor(candlestick.accessor())   // Set the accessor to a ohlc accessor so we get highlighted bars
    .xScale(x)
    .yScale(yVolume);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var timeAnnotation = techan.plot.axisannotation()
    .axis(xAxis)
    .format(d3.time.format('%Y-%m-%d'))
    .width(65)
    .translate([0, dim.plot.height]);

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right");

  var ohlcAnnotation = techan.plot.axisannotation()
    .axis(yAxis)
    .format(d3.format(',.2fs'))
    .translate([x(1), 0]);

  var closeAnnotation = techan.plot.axisannotation()
    .axis(yAxis)
    .accessor(candlestick.accessor())
    .format(d3.format(',.2fs'))
    .translate([x(1), 0]);

  var percentAxis = d3.svg.axis()
    .scale(yPercent)
    .orient("left")
    .tickFormat(d3.format('+.1%'));

  var percentAnnotation = techan.plot.axisannotation()
    .axis(percentAxis);

  var volumeAxis = d3.svg.axis()
    .scale(yVolume)
    .orient("right")
    .ticks(3)
    .tickFormat(d3.format(",.3s"));

  var volumeAnnotation = techan.plot.axisannotation()
    .axis(volumeAxis)
    .width(35);

  var macdScale = d3.scale.linear()
    .range([indicatorTop(0) + dim.indicator.height, indicatorTop(0)]);

  var rsiScale = macdScale.copy()
    .range([indicatorTop(+!!indicators.isMacd) + dim.indicator.height, indicatorTop(+!!indicators.isMacd)]);

  var stochasticScale = macdScale.copy()
    .range([indicatorTop(+!!indicators.isMacd+!!indicators.isRsi) + dim.indicator.height, indicatorTop(+!!indicators.isMacd+!!indicators.isRsi)]);

  var macd = techan.plot.macd()
    .xScale(x)
    .yScale(macdScale);

  var macdAxis = d3.svg.axis()
    .scale(macdScale)
    .ticks(3)
    .orient("right");

  var macdAnnotation = techan.plot.axisannotation()
    .axis(macdAxis)
    .format(d3.format(',.2fs'))
    .translate([x(1), 0]);

  var macdAxisLeft = d3.svg.axis()
    .scale(macdScale)
    .ticks(3)
    .orient("left");

  var macdAnnotationLeft = techan.plot.axisannotation()
    .axis(macdAxisLeft)
    .format(d3.format(',.2fs'));

  var rsi = techan.plot.rsi()
    .xScale(x)
    .yScale(rsiScale);

  var rsiAxis = d3.svg.axis()
    .scale(rsiScale)
    .ticks(3)
    .orient("right");

  var rsiAnnotation = techan.plot.axisannotation()
    .axis(rsiAxis)
    .format(d3.format(',.2fs'))
    .translate([x(1), 0]);

  var rsiAxisLeft = d3.svg.axis()
    .scale(rsiScale)
    .ticks(3)
    .orient("left");

  var rsiAnnotationLeft = techan.plot.axisannotation()
    .axis(rsiAxisLeft)
    .format(d3.format(',.2fs'));

  var stochastic = techan.plot.stochastic()
    .xScale(x)
    .yScale(stochasticScale);

  var stochasticAxis = d3.svg.axis()
    .scale(stochasticScale)
    .ticks(3)
    .orient("right");

  var stochasticAnnotation = techan.plot.axisannotation()
    .axis(stochasticAxis)
    .format(d3.format(',.2fs'))
    .translate([x(1), 0]);

  var stochasticAxisLeft = d3.svg.axis()
    .scale(stochasticScale)
    .ticks(3)
    .orient("left");

  var stochasticAnnotationLeft = techan.plot.axisannotation()
    .axis(stochasticAxisLeft)
    .format(d3.format(',.2fs'));

  var ohlcCrosshair = techan.plot.crosshair()
    .xScale(timeAnnotation.axis().scale())
    .yScale(ohlcAnnotation.axis().scale())
    .xAnnotation(timeAnnotation)
    .yAnnotation([ohlcAnnotation, percentAnnotation, volumeAnnotation])
    .verticalWireRange([0, dim.plot.height]);

  var macdCrosshair = techan.plot.crosshair()
    .xScale(timeAnnotation.axis().scale())
    .yScale(macdAnnotation.axis().scale())
    .xAnnotation(timeAnnotation)
    .verticalWireRange([0, dim.plot.height]);

  var rsiCrosshair = techan.plot.crosshair()
    .xScale(timeAnnotation.axis().scale())
    .yScale(rsiAnnotation.axis().scale())
    .xAnnotation(timeAnnotation)
    .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
    .verticalWireRange([0, dim.plot.height]);

  var stochasticCrosshair = techan.plot.crosshair()
    .xScale(timeAnnotation.axis().scale())
    .yScale(stochasticAnnotation.axis().scale())
    .xAnnotation(timeAnnotation)
    .yAnnotation([stochasticAnnotation, stochasticAnnotationLeft])
    .verticalWireRange([0, dim.plot.height]);

  element.innerHTML = '';
  var svg = d3.select(element).append("svg")
    .attr("width", dim.width)
    .attr("height", dim.height);

  var defs = svg.append("defs");

  defs.append("clipPath")
    .attr("id", "ohlcClip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", dim.plot.width)
    .attr("height", dim.ohlc.height);

  defs.selectAll("indicatorClip").data([0, 1])
    .enter()
    .append("clipPath")
    .attr("id", function (d, i) {
      return "indicatorClip-" + i;
    })
    .append("rect")
    .attr("x", 0)
    .attr("y", function (d, i) {
      return indicatorTop(i);
    })
    .attr("width", dim.plot.width)
    .attr("height", dim.indicator.height);

  svg = svg.append("g")
    .attr("transform", "translate(" + dim.margin.left + "," + dim.margin.top + ")");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + dim.plot.height + ")");

  var ohlcSelection = svg.append("g")
    .attr("class", "ohlc")
    .attr("transform", "translate(0,0)");

  ohlcSelection.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + x(1) + ",0)")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -12)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Цена (" + val + ")");

  ohlcSelection.append("g")
    .attr("class", "close annotation up");

  ohlcSelection.append("g")
    .attr("class", "volume")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "candlestick")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "indicator sma ma-0")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "indicator sma ma-1")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "indicator ema ma-2")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "indicator ichimoku")
    .attr("clip-path", "url(#ohlcClip)");

  ohlcSelection.append("g")
    .attr("class", "percent axis");

  ohlcSelection.append("g")
    .attr("class", "volume axis");

  var indicatorSelection = svg.selectAll("svg > g.indicator").data(indicatorsArr).enter()
    .append("g")
    .attr("class", function (d) {
      return d + " indicator";
    });

  indicatorSelection.append("g")
    .attr("class", "axis right")
    .attr("transform", "translate(" + x(1) + ",0)");

  indicatorSelection.append("g")
    .attr("class", "axis left")
    .attr("transform", "translate(" + x(0) + ",0)");

  indicatorSelection.append("g")
    .attr("class", "indicator-plot")
    .attr("clip-path", function (d, i) {
      return "url(#indicatorClip-" + i + ")";
    });

// Add trendlines and other interactions last to be above zoom pane
  svg.append('g')
    .attr("class", "crosshair ohlc");

  svg.append('g')
    .attr("class", "crosshair macd");

  svg.append('g')
    .attr("class", "crosshair rsi");

  svg.append('g')
    .attr("class", "crosshair stochastic");

  svg.append("g")
    .attr("class", "tradearrow")
    .attr("clip-path", "url(#ohlcClip)");

  d3.select("button").on("click", reset);

  d3.csv(file, (error, data) => {
    var accessor = candlestick.accessor(),
      indicatorPreRoll = 33;  // Don't show where indicators don't have data

    data = data.map(function (d) {
      return {
        date: parseDate(d.Date),
        open: +d.Open,
        high: +d.High,
        low: +d.Low,
        close: +d.Close,
        volume: +d.Volume
      };
    }).sort(function (a, b) {
      return d3.ascending(accessor.d(a), accessor.d(b));
    });

    x.domain(techan.scale.plot.time(data).domain());
    y.domain(techan.scale.plot.ohlc(data.slice(indicatorPreRoll)).domain());

    yPercent.domain(techan.scale.plot.percent(y, accessor(data[indicatorPreRoll])).domain());
    yVolume.domain(techan.scale.plot.volume(data).domain());

    const macdData = techan.indicator.macd()(data);
    macdScale.domain(techan.scale.plot.macd(macdData).domain());
    const rsiData = techan.indicator.rsi()(data);
    rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());
    const stochasticData = techan.indicator.stochastic()(data);
    stochasticScale.domain(techan.scale.plot.stochastic(stochasticData).domain());

    const ichimokuData = techan.indicator.ichimoku()(data);

    // TRADES

    var trades = [];

    if (indicators.isMacd) {
      let pos = data.map(e => {
        return e.date;
      }).indexOf(macdData[0].date);
      for (let i = 1, last = macdData[0]; i < macdData.length; ++i) {
        let curr = macdData[i];
        if (curr.macd < 0 && last.signal >= last.macd && curr.signal < curr.macd) {
          trades.push({date: curr.date, type: "buy", price: data[i + pos].low, low: data[i + pos].low, high: data[i + pos].high});
        } else if (curr.macd > 0 && last.signal <= last.macd && curr.signal > curr.macd) {
          trades.push({date: curr.date, type: "sell", price: data[i + pos].low, low: data[i + pos].low, high: data[i + pos].high});
        }
        last = curr;
      }
    }

    if (indicators.isRsi) {
      let pos = data.map(e => {
        return e.date;
      }).indexOf(rsiData[0].date);
      for (let i = 1, last = rsiData[0]; i < rsiData.length; ++i) {
        let curr = rsiData[i];
        if (curr.rsi < 30 && last.rsi >= 30) {
          trades.push({date: curr.date, type: "buy", price: data[i + pos].low, low: data[i + pos].low, high: data[i + pos].high});
        } else if (curr.rsi > 70 && last.rsi <= 70) {
          trades.push({date: curr.date, type: "sell", price: data[i + pos].low, low: data[i + pos].low, high: data[i + pos].high});
        }
        last = curr;
      }
    }


    if (indicators.isStochastic) {

      for (let i = 1, last = stochasticData[0]; i < stochasticData.length; ++i) {
        let curr = stochasticData[i];
        if (
          curr.stochasticD >= 20 && last.stochasticD < 20
          || curr.stochasticK >= 20 && last.stochasticK < 20
          || curr.stochasticK > curr.stochasticD && last.stochasticK <= last.stochasticD
        ) {
          let pos = data.map(e => {
            return e.date;
          }).indexOf(curr.date);
          trades.push({date: curr.date, type: "buy", price: data[pos].low, low: data[pos].low, high: data[pos].high});
        } else if (
          curr.stochasticD <= 80 && last.stochasticD > 80
          || curr.stochasticK <= 80 && last.stochasticK > 80
          || curr.stochasticK < curr.stochasticD && last.stochasticK >= last.stochasticD
        ) {
          let pos = data.map(e => {
            return e.date;
          }).indexOf(curr.date);
          trades.push({date: curr.date, type: "sell", price: data[pos].low, low: data[pos].low, high: data[pos].high});
        }
        last = curr;
      }
    }

    if (oIndicators.isIchimoku.status) {
      for (let i = 0, last = ichimokuData[0]; i < ichimokuData.length; ++i) {
        let curr = ichimokuData[i];
        if (
          (curr.tenkanSen && curr.kijunSen && last.tenkanSen && last.kijunSen && curr.tenkanSen > curr.kijunSen && last.tenkanSen <= last.kijunSen) // крест
          || (curr.senkouSpanA && curr.senkouSpanB && last.senkouSpanA && last.senkouSpanB && curr.senkouSpanA > curr.senkouSpanB && last.senkouSpanA <= last.senkouSpanB)
          || (curr.chikouSpan && data.close && last.chikouSpan && last.close && curr.chikouSpan > data.close && last.chikouSpan <= last.close)
        ) {
          trades.push({date: curr.date, type: "buy", price: data[i].low, low: data[i].low, high: data[i].high});
        } else if (
          (curr.tenkanSen && curr.kijunSen && last.tenkanSen && last.kijunSen && curr.tenkanSen < curr.kijunSen && last.tenkanSen >= last.kijunSen)
          || (curr.senkouSpanA && curr.senkouSpanB && last.senkouSpanA && last.senkouSpanB && curr.senkouSpanA < curr.senkouSpanB && last.senkouSpanA >= last.senkouSpanB)
          || (curr.chikouSpan && data.close && last.chikouSpan && last.close && curr.chikouSpan < data.close && last.chikouSpan >= last.close)
        ) {
          trades.push({date: curr.date, type: "sell", price: data[i].low, low: data[i].low, high: data[i].high});
        }
        last = curr;
      }
    }


    svg.select("g.candlestick").datum(data).call(candlestick);
    svg.select("g.close.annotation").datum([data[data.length - 1]]).call(closeAnnotation);
    svg.select("g.volume").datum(data).call(volume);
    if (oIndicators.isSma.status) svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(10)(data)).call(sma0);
    if (oIndicators.isEma.status) svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(20)(data)).call(sma1);
    if (oIndicators.isEma.status) svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(50)(data)).call(ema2);
    if (oIndicators.isIchimoku.status) svg.select("g.ichimoku").datum(ichimokuData).call(ichimoku);

    svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
    svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);
    svg.select("g.stochastic .indicator-plot").datum(stochasticData).call(stochastic);

    svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);
    svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
    svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
    svg.select("g.crosshair.stochastic").call(stochasticCrosshair).call(zoom);

    svg.select("g.tradearrow").datum(trades).call(tradearrow);

    var zoomable = x.zoomable();
    zoomable.domain([indicatorPreRoll, data.length]); // Zoom in a little to hide indicator preroll

    draw();

    // Associate the zoom with the scale after a domain has been applied
    zoom.x(zoomable).y(y);
    zoomPercent.y(yPercent);
  });

  function reset() {
    zoom.scale(1);
    zoom.translate([0, 0]);
    draw();
  }

  function draw() {
    zoomPercent.translate(zoom.translate());
    zoomPercent.scale(zoom.scale());

    svg.select("g.x.axis").call(xAxis);
    svg.select("g.ohlc .axis").call(yAxis);
    svg.select("g.volume.axis").call(volumeAxis);
    svg.select("g.percent.axis").call(percentAxis);
    svg.select("g.macd .axis.right").call(macdAxis);
    svg.select("g.stochastic .axis.right").call(stochasticAxis);
    svg.select("g.rsi .axis.right").call(rsiAxis);
    svg.select("g.macd .axis.left").call(macdAxisLeft);
    svg.select("g.stochastic .axis.left").call(stochasticAxisLeft);
    svg.select("g.rsi .axis.left").call(rsiAxisLeft);

    // We know the data does not change, a simple refresh that does not perform data joins will suffice.
    svg.select("g.candlestick").call(candlestick.refresh);
    svg.select("g.close.annotation").call(closeAnnotation.refresh);
    svg.select("g.volume").call(volume.refresh);
    svg.select("g .sma.ma-0").call(sma0.refresh);
    svg.select("g .sma.ma-1").call(sma1.refresh);
    svg.select("g .ema.ma-2").call(ema2.refresh);
    svg.select("g .ichimoku").call(ichimoku.refresh);

    svg.select("g.macd .indicator-plot").call(macd.refresh);
    svg.select("g.stochastic .indicator-plot").call(stochastic.refresh);
    svg.select("g.rsi .indicator-plot").call(rsi.refresh);
    svg.select("g.crosshair.ohlc").call(ohlcCrosshair.refresh);
    svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
    svg.select("g.crosshair.stochastic").call(stochasticCrosshair.refresh);
    svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);

    svg.select("g.tradearrow").call(tradearrow.refresh);
  }
}

const element = document.getElementById('graph');
const indicators = {
  isMacd: {
    element: document.getElementById('isMacd')
  },
  isRsi: {
    element: document.getElementById('isRsi')
  },
  isStochastic: {
    element: document.getElementById('isStochastic')
  }
};
const oIndicators = {
  isSma: {
    element: document.getElementById('isSma')
  },
  isEma: {
    element: document.getElementById('isEma')
  },
  isIchimoku: {
    element: document.getElementById('isIchimoku')
  }
};

let type = 'candlestick';

document.getElementById('cand').addEventListener('change', (e)=> {
  type = 'candlestick';
  update();
});
document.getElementById('ohlc').addEventListener('change', (e)=> {
  type = 'ohlc';
  update();
});
document.getElementById('close').addEventListener('change', (e)=> {
  type = 'close';
  update();
});


let file;

function setFile(cen, data) {
  file = "data/" + cen + "-" + data + ".csv";
}

///
let data = 'd';
let val = '₽';
let cen = 'BANE';
document.getElementById('day').addEventListener('change', (e)=> {
  data = 'd';
  setFile(cen, data);
  update();
});
document.getElementById('week').addEventListener('change', (e)=> {
  data = 'w';
  setFile(cen, data);
  update();
});
document.getElementById('month').addEventListener('change', (e)=> {
  data = 'm';
  setFile(cen, data);
  update();
});


document.getElementById('BANE').addEventListener('change', (e)=> {
  cen = 'BANE';
  val = '₽';
  setFile(cen, data);
  update();
});
document.getElementById('YNDX').addEventListener('change', (e)=> {
  cen = 'YNDX';
  val = '$';
  setFile(cen, data);
  update();
});
document.getElementById('KMAZ').addEventListener('change', (e)=> {
  cen = 'KMAZ';
  val = '₽';
  setFile(cen, data);
  update();
});

const currentIndicators = {};

for (const key in oIndicators) {
  oIndicators[key].element.addEventListener('change', () => {
    oIndicators[key].status = oIndicators[key].element.checked;
    update();
  })
}

for (const key in indicators) {
  indicators[key].element.addEventListener('change', () => {
    indicators[key].status = indicators[key].element.checked;
    if (indicators[key].status) currentIndicators[key] = indicators[key];
    else delete currentIndicators[key];
    update();
  })
}

function update() {
  Graph(element, currentIndicators, oIndicators, type, file, val);
}


function handleFileSelect(e) {
  const f = e.target.files[0];
  var reader = new FileReader();
  reader.onload = ((theFile) => {
    return function(evt) {
      val = '';
      file= evt.target.result;
      update();
    };
  })(f);
  reader.readAsDataURL(f);
}

document.getElementById('file').addEventListener('change', handleFileSelect, false);

$(window).resize(()=> {
  update();
});

setFile(cen, data);
update();