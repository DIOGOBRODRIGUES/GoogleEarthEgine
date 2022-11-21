// exemplo 1*******************************************************

// Load an image collection, filtered so it's not too much data.
var collection = ee.ImageCollection('LANDSAT/LT05/C01/T1')
  .filterDate('2008-01-01', '2008-12-31')
  .filter(ee.Filter.eq('WRS_PATH', 216))
  .filter(ee.Filter.eq('WRS_ROW', 66));

// Compute the median in each band, each pixel.
// Band names are B1_median, B2_median, etc.
var median = collection.reduce(ee.Reducer.median());

// The output is an Image.  Add it to the map.
var vis_param = {bands: ['B4_median', 'B3_median', 'B2_median'], gamma: 1.6};
Map.setCenter(-38.3605, -8.6091, 9);
Map.addLayer(median, vis_param);


// exemplo 2 *********************************************************************

// Load input imagery: Landsat 7 5-year composite.
var image = ee.Image('LANDSAT/LE7_TOA_5YEAR/2008_2012');

// Load an input region: floresta tropical .


var tropical = ee.Feature(ee.FeatureCollection('RESOLVE/ECOREGIONS/2017')
  .filter(ee.Filter.eq('ECO_ID', 491))
  .first());

Map.addLayer(tropical);
// Reduce the region. The region parameter is the Feature geometry.
var meanDictionary = image.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: tropical.geometry(),
  scale: 30,
  maxPixels: 1e9
});

// The result is a Dictionary.  Print it.
print(meanDictionary);


// Exemplo 3 ********************************************************************


// Define a region in the redwood forest.
var redwoods = ee.Geometry.Rectangle(-124.0665, 41.0739, -123.934, 41.2029);

// Load input NAIP imagery and build a mosaic.
var naipCollection = ee.ImageCollection('USDA/NAIP/DOQQ')
  .filterBounds(redwoods)
  .filterDate('2012-01-01', '2012-12-31');
var naip = naipCollection.mosaic();

// Compute NDVI from the NAIP imagery.
var naipNDVI = naip.normalizedDifference(['N', 'R']);

// Compute standard deviation (SD) as texture of the NDVI.
var texture = naipNDVI.reduceNeighborhood({
  reducer: ee.Reducer.stdDev(),
  kernel: ee.Kernel.circle(7),
});

// Display the results.
Map.centerObject(redwoods, 12);
Map.addLayer(naip, {}, 'NAIP input imagery');
Map.addLayer(naipNDVI, {min: -1, max: 1, palette: ['FF0000', '00FF00']}, 'NDVI');
Map.addLayer(texture, {min: 0, max: 0.3}, 'SD of NDVI');


//Exemplo 4 ****************************************************


// Make a toy FeatureCollection.
var aFeatureCollection = ee.FeatureCollection([
  ee.Feature(null, {foo: 1, weight: 1}),
  ee.Feature(null, {foo: 2, weight: 2}),
  ee.Feature(null, {foo: 3, weight: 3}),
]);

// Compute a weighted mean and display it. Computa a media ponderada.
print(aFeatureCollection.reduceColumns({
  reducer: ee.Reducer.mean(),
  selectors: ['foo'],
  weightSelectors: ['weight']
}));


//Exemplo 5 


// This function adds a time band to the image.
var createTimeBand = function(image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata('system:time_start').divide(1e18));
};

// Load the input image collection: projected climate data.
var collection = ee.ImageCollection('NASA/NEX-DCP30_ENSEMBLE_STATS')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filterDate(ee.Date('2006-01-01'), ee.Date('2050-01-01'))
  // Map the time band function over the collection.
  .map(createTimeBand);

// Reduce the collection with the linear fit reducer.
// Independent variable are followed by dependent variables.
var linearFit = collection.select(['system:time_start', 'pr_mean'])
  .reduce(ee.Reducer.linearFit());

// Display the results.
Map.setCenter(-100.11, 40.38, 5);
Map.addLayer(linearFit,
  {min: 0, max: [-0.9, 8e-5, 1], bands: ['scale', 'offset', 'scale']}, 'fit');