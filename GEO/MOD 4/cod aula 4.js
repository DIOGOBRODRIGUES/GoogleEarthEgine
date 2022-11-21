//exemplo 1
var ft = ee.FeatureCollection('users/diogoborbar/SIG/pe_municipios');
Map.centerObject(ft, 5);
Map.addLayer(ft);

// Exemplo 2

// 1. filter the feature collection 
var midt = ft.filter(ee.Filter.eq('NM_MUNICIP', 'GAMELEIRA'));
Map.addLayer(midt, {'color':'FF0000'});
Map.centerObject(midt, 10);
// 2. load in NDVI MODIS 16-Day Composite
var NDVI = ee.ImageCollection('MODIS/MCD43A4_NDVI').filterDate('2011-01-01','2011-12-31');

//reduce the NDVImidt to median
var median = NDVI.median();

var midtNDVI = median.clip(midt);

Map.addLayer(midtNDVI, {palette:'000000, 00FF00', min:0, max:0.8});


//Exemplo 3***********************

// media do NDVI
var average = midtNDVI.reduceRegion(ee.Reducer.mean(),midt, 500); // 500 é aproximadamente o tamanhdo do pixel 
print(average);

// para todos o poligonos
var NDVI2015 = ee.ImageCollection('MODIS/MCD43A4_NDVI').filterDate('2015-01-01','2015-12-31');

var median2 = NDVI2015.median();

var average2 = median2.reduceRegion(ee.Reducer.mean(), ft, 500);
print(average2);



//Exemplo 4*************************

var averageNDVI = ft.map(function(feature) {
  var Districtaverage = median2.reduceRegion(ee.Reducer.mean(), feature.geometry(), 500);
  return feature.set({'ndvi':Districtaverage});
});

print(averageNDVI);

// Exemplo 5 **********

var Kenya = ee.FeatureCollection("users/diogoborbar/Kenya_points");
Map.addLayer(Kenya);
Map.centerObject(Kenya);