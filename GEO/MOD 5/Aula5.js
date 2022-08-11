//exemplo 1************************

// Make a cloud-free Landsat 8 TOA composite (from raw imagery).
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1');

var image = ee.Algorithms.Landsat.simpleComposite({
  collection: l8.filterDate('2018-01-01', '2018-12-31'),
  asFloat: true
});

// Use these bands for prediction.
var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10', 'B11'];

// Load training points. The numeric property 'class' stores known labels.
var points = ee.FeatureCollection('GOOGLE/EE/DEMOS/demo_landcover_labels');

// This property stores the land cover labels as consecutive
// integers starting from zero.
var label = 'landcover';

// Overlay the points on the imagery to get training.
var training = image.select(bands).sampleRegions({
  collection: points,
  properties: [label],
  scale: 30
});

// Train a CART classifier with default parameters.
var trained = ee.Classifier.smileCart().train(training, label, bands);

// Classify the image with the same bands used for training.
var classified = image.select(bands).classify(trained);

// Display the inputs and the results.
Map.centerObject(points, 11);
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'image');
Map.addLayer(classified,
             {min: 0, max: 2, palette: ['red', 'green', 'blue']},
             'classification');
			 
//Exemplo 2*******************************************


// Define uma região de interesse como um ponto. Altere as coordenadas
// para obter uma classificação de qualquer lugar onde haja imagens.
var roi = ee.Geometry.Point(-122.3942, 37.7295);

// Load Landsat 5 input imagery.
var landsat = ee.Image(ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA')
  // Filter to get only one year of images.
  .filterDate('2011-01-01', '2011-12-31')
  // Filter to get only images under the region of interest.
  .filterBounds(roi)
  // Sort by scene cloudiness, ascending.
  .sort('CLOUD_COVER')
  // Get the first (least cloudy) scene.
  .first());

// Compute cloud score.
var cloudScore = ee.Algorithms.Landsat.simpleCloudScore(landsat).select('cloud');

// Mascarar a entrada para nuvens. Calcular o min da máscara de entrada para mascarar
// pixels onde qualquer banda é mascarada. Combine isso com a máscara de nuvem.
var input = landsat.updateMask(landsat.mask().reduce('min').and(cloudScore.lte(50)));

// Use cobertura de terra MODIS, classificação IGBP, para treinamento.
var modis = ee.Image('MODIS/051/MCD12Q1/2011_01_01')
    .select('Land_Cover_Type_1');

// Faça uma amostra das imagens de entrada para obter um FeatureCollection de dados de treinamento.
var training = input.addBands(modis).sample({
  numPixels: 5000,
  seed: 0
});

// Faça um classificador Random Forest e treine-o.
var classifier = ee.Classifier.smileRandomForest(10)
    .train({
      features: training,
      classProperty: 'Land_Cover_Type_1',
      inputProperties: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']
    });

// Classify the input imagery.
var classified = input.classify(classifier);

// Obtém uma matriz de confusão representando a precisão da substituição.
var trainAccuracy = classifier.confusionMatrix();
print('Resubstitution error matrix: ', trainAccuracy);
print('Training overall accuracy: ', trainAccuracy.accuracy());

// Sample the input with a different random seed to get validation data.
var validation = input.addBands(modis).sample({
  numPixels: 5000,
  seed: 1
  // Filter the result to get rid of any null pixels.
}).filter(ee.Filter.neq('B1', null));

// Classify the validation data.
var validated = validation.classify(classifier);

// Obtém uma matriz de confusão que representa a precisão esperada.
var testAccuracy = validated.errorMatrix('Land_Cover_Type_1', 'classification');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());

// Define a palette for the IGBP classification.
var igbpPalette = [
  'aec3d4', // water
  '152106', '225129', '369b47', '30eb5b', '387242', // forest
  '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40',  // shrub, grass
  '111149', // wetlands
  'cdb33b', // croplands
  'cc0013', // urban
  '33280d', // crop mosaic
  'd7cdcc', // snow and ice
  'f7e084', // barren
  '6f6f6f'  // tundra
];

// Display the input and the classification.
Map.centerObject(roi, 10);
Map.addLayer(input, {bands: ['B3', 'B2', 'B1'], max: 0.4}, 'landsat');
Map.addLayer(classified, {palette: igbpPalette, min: 0, max: 17}, 'classification');

//Exemplo 3*************************

// Load a pre-computed Landsat composite for input.
var input = ee.Image('LANDSAT/LE7_TOA_1YEAR/2001');

// Define a region in which to generate a sample of the input.
var region = ee.Geometry.Rectangle(29.7, 30, 32.5, 31.7);

// Display the sample region.
Map.setCenter(31.5, 31.0, 8);
Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'region');

// Cria o conjunto de dados de treinamento.
var training = input.sample({
  region: region,
  scale: 30,
  numPixels: 5000
});

// Instancia o clusterer e treina-o.
var clusterer = ee.Clusterer.wekaKMeans(15).train(training);

// Cluster a entrada usando o clusterer treinado.
var result = input.cluster(clusterer);

// Display the clusters with random colors.
Map.addLayer(result.randomVisualizer(), {}, 'clusters');