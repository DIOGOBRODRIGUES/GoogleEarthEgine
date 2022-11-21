// exemplo 1*******************************************************

var data = ee.List([0, 1, 2, 3, 4, 5]);
var chart = ui.Chart.array.values(data, 0, data);
print(chart);

var data = ee.List([0, 1, 2, 3, 4, 5]);
var chart = ui.Chart.array.values(data, 0, data);
var chartPanel = ui.Panel(chart);
Map.add(chartPanel);


// Exemplo 2 *********************************************

// Import the example feature collection.
var ecoregions = ee.FeatureCollection('projects/google/charts_feature_example');

// Load PRISM climate normals image collection; convert images to bands.
var normClim = ee.ImageCollection('OREGONSTATE/PRISM/Norm81m').toBands();

// Define the chart and print it to the console.
var chart =
    ui.Chart.image
        .byRegion({
          image: normClim.select('[0-9][0-9]_tmean'),
          regions: ecoregions,
          reducer: ee.Reducer.mean(),
          scale: 500,
          xProperty: 'label'
        })
        .setSeriesNames([
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
          'Nov', 'Dec'
        ])
        .setChartType('ColumnChart')
        .setOptions({
          title: 'Average Monthly Temperature by Ecoregion',
          hAxis:
              {title: 'Ecoregion', titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'Temperature (°C)',
            titleTextStyle: {italic: false, bold: true}
          },
          colors: [
            '604791', '1d6b99', '39a8a7', '0f8755', '76b349', 'f0af07',
            'e37d05', 'cf513e', '96356f', '724173', '9c4f97', '696969'
          ]
        });
print(chart);



//Exemplo 3 ***************************************************

// Import the example feature collection and subset the forest feature.
var forest = ee.FeatureCollection('projects/google/charts_feature_example')
                 .filter(ee.Filter.eq('label', 'Forest'));

// Load MODIS vegetation indices data and subset a decade of images.
var vegIndices = ee.ImageCollection('MODIS/006/MOD13A1')
                     .filter(ee.Filter.date('2010-01-01', '2020-01-01'))
                     .select(['NDVI', 'EVI']);

// Define the chart and print it to the console.
var chart =
    ui.Chart.image
        .series({
          imageCollection: vegIndices,
          region: forest,
          reducer: ee.Reducer.mean(),
          scale: 500,
          xProperty: 'system:time_start'
        })
        .setSeriesNames(['EVI', 'NDVI'])
        .setOptions({
          title: 'Average Vegetation Index Value by Date for Forest',
          hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'Vegetation index (x1e4)',
            titleTextStyle: {italic: false, bold: true}
          },
          lineWidth: 5,
          colors: ['e37d05', '1d6b99'],
          curveType: 'function'
        });
print(chart);


//Exemplo 4
// Import the example feature collection and subset the glassland feature.
var grassland = ee.FeatureCollection('projects/google/charts_feature_example')
                    .filter(ee.Filter.eq('label', 'Grassland'));

// Load MODIS vegetation indices data and subset a decade of images.
var vegIndices = ee.ImageCollection('MODIS/006/MOD13A1')
                     .filter(ee.Filter.date('2010-01-01', '2020-01-01'))
                     .select(['NDVI', 'EVI']);

// Set chart style properties.
var chartStyle = {
  title: 'Average Vegetation Index Value by Day of Year for Grassland',
  hAxis: {
    title: 'Day of year',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'}
  },
  vAxis: {
    title: 'Vegetation index (x1e4)',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'},
    format: 'short',
    baselineColor: 'FFFFFF'
  },
  series: {
    0: {lineWidth: 3, color: 'E37D05', pointSize: 7},
    1: {lineWidth: 7, color: '1D6B99', lineDashStyle: [4, 4]}
  },
  chartArea: {backgroundColor: 'EBEBEB'}
};

// Define the chart.
var chart =
    ui.Chart.image
        .doySeries({
          imageCollection: vegIndices,
          region: grassland,
          regionReducer: ee.Reducer.mean(),
          scale: 500,
          yearReducer: ee.Reducer.mean(),
          startDay: 1,
          endDay: 365
        })
        .setSeriesNames(['EVI', 'NDVI']);

// Apply custom style properties to the chart.
chart.setOptions(chartStyle);

// Print the chart to the console.
print(chart);