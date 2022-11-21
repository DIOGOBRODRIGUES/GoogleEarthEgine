// exemplo 1 ****************************************************

// Load a raw Landsat scene and display it.
var raw = ee.Image('LANDSAT/LC08/C01/T1/LC08_044034_20140318');
Map.centerObject(raw, 10);
Map.addLayer(raw, {bands: ['B4', 'B3', 'B2'], min: 6000, max: 12000}, 'raw');

// Convert the raw data to radiance.
var radiance = ee.Algorithms.Landsat.calibratedRadiance(raw);
Map.addLayer(radiance, {bands: ['B4', 'B3', 'B2'], max: 90}, 'radiance');

// Convert the raw data to top-of-atmosphere reflectance.
var toa = ee.Algorithms.Landsat.TOA(raw);

Map.addLayer(toa, {bands: ['B4', 'B3', 'B2'], max: 0.2}, 'toa reflectance');

// exemplo 2*************************************************************
// Carregue uma cena Landsat nublada e exiba-a.
var cloudy_scene = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_044034_20140926');
Map.centerObject(cloudy_scene);
Map.addLayer(cloudy_scene, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'TOA', false);

// Adicione uma banda de pontuação de nuvem. É automaticamente denominado 'nuvem'.
var scored = ee.Algorithms.Landsat.simpleCloudScore(cloudy_scene);

// Crie uma máscara a partir da pontuação da nuvem e combine-a com a máscara da imagem.
var mask = scored.select(['cloud']).lte(20);

// Aplique a máscara à imagem e exiba o resultado.
var masked = cloudy_scene.updateMask(mask);
Map.addLayer(masked, {bands: ['B4', 'B3', 'B2'], max: 0.4}, 'masked');

