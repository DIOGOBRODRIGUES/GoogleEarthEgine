// Exemplo1 *********************************

// Convert dates from milliseconds to seconds.
var start = ee.Date('2012-01-01').millis().divide(1000);
var end = ee.Date('2013-01-01').millis().divide(1000);

// Load the FORMA 500 dataset.
var forma = ee.Image('FORMA/FORMA_500m');

// Create a binary layer from the dates of interest.
var forma2012 = forma.gte(start).and(forma.lte(end));

Map.setCenter(15.87, -0.391, 7);
Map.addLayer(
  forma2012.mask(forma2012),
  {palette: ['FF0000']},
  'FORMA alerts in 2012'
);


//Exemplo 2*******************************************

// Load country features from Large Scale International Boundary (LSIB) dataset.
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');

// Subset the Congo Republic feature from countries.
var congo = ee.Feature(
  countries
    .filter(ee.Filter.eq('country_na', 'Rep of the Congo'))
    .first()
);

// Subset protected areas to the bounds of the congo feature
// and other criteria. Clip to the intersection with congo.
var protectedAreas = ee.FeatureCollection('WCMC/WDPA/current/polygons')
  .filter(ee.Filter.and(
    ee.Filter.bounds(congo.geometry()),
    ee.Filter.neq('IUCN_CAT', 'VI'),
    ee.Filter.neq('STATUS', 'proposed'),
    ee.Filter.lt('STATUS_YR', 2010)
  ))
  .map(function(feat){
    return congo.intersection(feat);
  });

// Display protected areas on the map.
Map.addLayer(
  protectedAreas,
  {color: '000000'},
  'Congo Republic protected areas'
);

// Calculate the number of FORMA pixels in protected
// areas of the Congo Republic, 2012.
var stats = forma2012.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: protectedAreas.geometry(),
  scale: 500
});
print('Number of FORMA pixels, 2012: ', stats.get('constant'));

//Exemplo 3******
var regionsStats = forma2012.reduceRegions({
  collection: protectedAreas,
  reducer: ee.Reducer.sum(),
  scale: forma2012.projection().nominalScale()
});
print(regionsStats);


//Exemplo 4**********************

// Convert dates from milliseconds to seconds.
var start = ee.Date('2012-01-01').millis().divide(1000);
var end = ee.Date('2013-01-01').millis().divide(1000);
var region = ee.Geometry.Rectangle([-59.81163, -9.43348, -59.27561, -9.22818]);

// Load the FORMA 500 dataset.
var forma = ee.Image('FORMA/FORMA_500m');

// Create a binary layer from the dates of interest.
var forma2012 = forma.gte(start).and(forma.lte(end));

// Load Hansen et al. data and get change in 2012.
var gfc = ee.Image('UMD/hansen/global_forest_change_2020_v1_8');
var gfc12 = gfc.select(['lossyear']).eq(12);

// Create an image which is one where the datasets
// both show deforestation and zero elsewhere.
var gfc_forma = gfc12.eq(1).and(forma2012.eq(1));

// Display data on the map.
Map.setCenter(-59.58813, -9.36439, 11);
Map.addLayer(forma.updateMask(forma), {palette: '00FF00'}, 'Forma (green)');
Map.addLayer(gfc12.updateMask(gfc12), {palette: 'FF0000'}, 'Hansen (red)');
Map.addLayer(
  gfc_forma.updateMask(gfc_forma),
  {palette: 'FFFF00'},
  'Hansen & FORMA (yellow)'
);