//Aula 3 ------------------------------------------

//exemplo 1 ---------------------------------------

var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');

// Obtenha a mediana ao longo do tempo, em cada banda, em cada pixel.
var median = l8.filterDate('2016-01-01', '2016-12-31').median();

// Faça uma variável útil de parâmetros de visualização.
var visParams = {bands: ['B4', 'B3', 'B2'], max: 0.3};

// Exiba o composto mediano.
Map.addLayer(median, visParams, 'median');


//exemplo 2 ----------------------------------------

var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');

// Get the median over time, in each band, in each pixel.
var median = l8.filterDate('2016-01-01', '2016-12-31').median();

// Make a handy variable of visualization parameters.
var visParams = {bands: ['B4', 'B3', 'B2'], max: 0.3};

// Display the median composite.
Map.addLayer(median, visParams, 'median');


// Load or import the Hansen et al. forest change dataset.
var hansenImage = ee.Image('UMD/hansen/global_forest_change_2015');

// Select the land/water mask.
var datamask = hansenImage.select('datamask');

// Create a binary mask.
var mask = datamask.eq(1);

// Update the composite mask with the water mask.
var maskedComposite = median.updateMask(mask);

Map.addLayer(maskedComposite, visParams, 'masked');

//Exemplo 3 --------- Continuação do exemplo 2 

// Faça uma imagem da água com a máscara.
var water = mask.not();

// Mascare a água consigo mesmo para mascarar todos os zeros (não água).
water = water.mask(water);

// Faça uma coleção de imagens de visualização.
var mosaic = ee.ImageCollection([
  median.visualize(visParams),
  water.visualize({palette: '000044'}),
]).mosaic();

// Display the mosaic.
Map.addLayer(mosaic, {}, 'custom mosaic');




// Exemplo 4

// Import the Landsat 8 TOA image collection.
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');

// Map a function over the Landsat 8 TOA collection to add an NDVI band.
var withNDVI = l8.map(function(image) {
  var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
});

// Create a chart.
var chart = ui.Chart.image.series({
  imageCollection: withNDVI.select('NDVI'),
  region: roi,
  reducer: ee.Reducer.first(),
  scale: 30
}).setOptions({title: 'NDVI over time'});

// Display the chart in the console.
print(chart);


//Exemplo 5 

var cloudlessNDVI = l8.map(function(image) {
  // Get a cloud score in [0, 100].
  var cloud = ee.Algorithms.Landsat.simpleCloudScore(image).select('cloud');

  // Create a mask of cloudy pixels from an arbitrary threshold.
  var mask = cloud.lte(20);

  // Compute NDVI.
  var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');

  // Return the masked image with an NDVI band.
  return image.addBands(ndvi).updateMask(mask);
});

print(ui.Chart.image.series({
  imageCollection: cloudlessNDVI.select('NDVI'),
  region: roi,
  reducer: ee.Reducer.first(),
  scale: 30
}).setOptions({title: 'Cloud-masked NDVI over time'}));


//exemplo 6


var greenest = cloudlessNDVI.qualityMosaic('NDVI');

// Create a 3-band, 8-bit, color-IR composite to export.
var visualization = greenest.visualize({
  bands: ['B5', 'B4', 'B3'],
  max: 0.4
});

// Create a task that you can launch from the Tasks tab.
Export.image.toDrive({
  image: visualization,
  description: 'Greenest_pixel_composite',
  scale: 30
});