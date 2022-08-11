//Exemplo 1 *************************************
var UF = ee.FeatureCollection('users/diogoborbar/lml_unidade_federacao_a');
var PE = UF.filter(ee.Filter.eq('nome', 'Pernambuco'));
Map.centerObject(PE)
Map.addLayer(UF, null, "Brasil");
Map.addLayer(PE, null, "PE");

//Exemplo 2***********************************************

// Load a landsat image and select three bands.
var landsat = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_123032_20140515')
  .select(['B4', 'B3', 'B2']);

// Create a geometry representing an export region.
var geometry = ee.Geometry.Rectangle([116.2621, 39.8412, 116.4849, 40.01236]);

// Recupera as informações de projeção de uma banda da imagem original.
// Chama getInfo() na projeção para solicitar um objeto do lado do cliente contendo
// as informações crs e transform necessárias para a função de exportação do lado do cliente.
var projection = landsat.select('B2').projection().getInfo();


// Export the image, specifying the CRS, transform, and region.

Export.image.toDrive({
  image: landsat,
  description: 'imageToDriveExample_transform',
  crs: projection.crs,
  crsTransform: projection.transform,
  region: geometry
});

//Exemplo 3********************************************************
~
// Get band 4 from the Landsat image, copy it.
var band4 = landsat.select('B4').rename('b4_mean')
  .addBands(landsat.select('B4').rename('b4_sample'))
  .addBands(landsat.select('B4').rename('b4_max'));

// Export the image to an Earth Engine asset.
Export.image.toAsset({
  image: band4,
  description: 'imageToAssetExample',
  assetId: 'exampleExport',
  crs: projection.crs,
  crsTransform: projection.transform,
  region: geometry,
  pyramidingPolicy: {
    'b4_mean': 'mean',
    'b4_sample': 'sample',
    'b4_max': 'max'
  }
});


//Exemplo 4 *************************************************

// Make a collection of points.
var features = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(30.41, 59.933), {name: 'Voronoi'}),
  ee.Feature(ee.Geometry.Point(-73.96, 40.781), {name: 'Thiessen'}),
  ee.Feature(ee.Geometry.Point(6.4806, 50.8012), {name: 'Dirichlet'})
]);

// Export the FeatureCollection to a KML file.
Export.table.toDrive({
  collection: features,
  description:'vectorsToDriveExample',
  fileFormat: 'KML'
});
