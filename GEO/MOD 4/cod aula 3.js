//exemplo 1*********************************************************

// Carregar o Sentinel-1 ImageCollection, filtrar para observações de junho a setembro de 2020.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD')
                    .filterDate('2020-06-01', '2020-10-01');

// Filtre a coleção do Sentinel-1 por propriedades de metadados.
var vvVhIw = sentinel1
  // Filtre para obter imagens com polarização dupla VV e VH.
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filtre para obter imagens coletadas no modo de faixa ampla interferométrica.
  .filter(ee.Filter.eq('instrumentMode', 'IW'));

// Separe as imagens da órbita ascendente e descendente em coleções distintas.
var vvVhIwAsc = vvVhIw.filter(
  ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
var vvVhIwDesc = vvVhIw.filter(
  ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

// Calcule as médias temporais de várias observações para usar na visualização.
// VH médio ascendente.
var vhIwAscMean = vvVhIwAsc.select('VH').mean();
// VH médio descendente.
var vhIwDescMean = vvVhIwDesc.select('VH').mean();
// VV médio para coleções de imagens ascendentes e descendentes combinadas.
var vvIwAscDescMean = vvVhIwAsc.merge(vvVhIwDesc).select('VV').mean();
// Mean VH for combined ascending and descending image collections.
var vhIwAscDescMean = vvVhIwAsc.merge(vvVhIwDesc).select('VH').mean();

// Exibe as médias temporais para várias observações, compare-as.
Map.addLayer(vvIwAscDescMean, {min: -12, max: -4}, 'vvIwAscDescMean');
Map.addLayer(vhIwAscDescMean, {min: -18, max: -10}, 'vhIwAscDescMean');
Map.addLayer(vhIwAscMean, {min: -18, max: -10}, 'vhIwAscMean');
Map.addLayer(vhIwDescMean, {min: -18, max: -10}, 'vhIwDescMean');
Map.setCenter(-73.8719, 4.512, 9);  // Bogota, Colombia


//exemplo 2 ***********************************************************************
// Carregue uma imagem Landsat em São Francisco, Califórnia, UAS.
var landsat = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_044034_20160323');

// Defina os parâmetros de exibição e visualização.
Map.setCenter(-122.37383, 37.6193, 15);
var visParams = {bands: ['B4', 'B3', 'B2'], max: 0.3};

// Exibe a imagem Landsat usando a reamostragem do vizinho mais próximo padrão.
// ao reprojetar para Mercator para o mapa do Editor de código.
Map.addLayer(landsat, visParams, 'original image');

// Força a próxima reprojeção nesta imagem para usar reamostragem bicúbica.
var resampled = landsat.resample('bicubic');

// Exibe a imagem Landsat usando reamostragem bicúbica.
Map.addLayer(resampled, visParams, 'resampled');

//Exemplo 3**************************************

// Carrega uma imagem MODIS EVI.
var modis = ee.Image(ee.ImageCollection('MODIS/006/MOD13A1').first())
    .select('EVI');

// Exiba a imagem EVI perto de La Honda, Califórnia.
Map.setCenter(-122.3616, 37.5331, 12);
Map.addLayer(modis, {min: 2000, max: 5000}, 'MODIS EVI');

// Obtenha informações sobre a projeção MODIS.
var modisProjection = modis.projection();
print('MODIS projection:', modisProjection);

// Carregue e exiba os dados da cobertura florestal com resolução de 30 metros.
var forest = ee.Image('UMD/hansen/global_forest_change_2015')
    .select('treecover2000');
Map.addLayer(forest, {max: 80}, 'forest cover 30 m');

// Obtenha os dados de cobertura florestal em escala e projeção MODIS.
var forestMean = forest
    // Força a próxima reprojeção a agregar em vez de reamostrar.
    .reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    })
    // Solicitar os dados na escala e projeção da imagem MODIS.
    .reproject({
      crs: modisProjection
    });

// Exibe os dados agregados e reprojetados da cobertura florestal.
Map.addLayer(forestMean, {max: 80}, 'forest cover at MODIS scale');