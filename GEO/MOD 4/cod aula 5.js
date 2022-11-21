var l8 =  ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');
var PE = ee.FeatureCollection('users/diogoborbar/SIG/pe_municipios');
var gameleira = PE.filter(ee.Filter.eq('NM_MUNICIP', 'PESQUEIRA'));


// Este campo contém tempo UNIX em milisegundos.
var timeField = 'system:time_start';
// Use está função para realizar a mascara nas nuvens na imagem landsat 8.
var maskClouds = function(image) {
var quality = image.select('BQA');
var cloud01 = quality.eq(61440);
var cloud02 = quality.eq(53248);
var cloud03 = quality.eq(28672);
var mask = cloud01.or(cloud02).or(cloud03).not();
return image.updateMask(mask);
};
// Utilize esta função para adicionar variaveis para o NDVI, tempo e a
// constante na imagem Landsat 8.
var addVariables = function(image) {
// Fracione o tempo em anos desde a primeira época.
var date = ee.Date(image.get(timeField));
var years = date.difference(ee.Date('1970-01-01'), 'year');
// Devolva a imagem com as bandas adicionadas.
return image
 // Adicione a banda de NDVI.
 .addBands(image.normalizedDifference(['B5', 'B4']).rename('NDVI'))
.float()
 // Adicione a banda de tempo
 .addBands(ee.Image(years).rename('t').float())
 // Adcione a banda de constante.
 //.addBands(ee.Image.constant(1));
};
// Remove clouds, add variables and filter to the area of interest.
var filteredLandsat = l8
.filterBounds(gameleira)
.map(maskClouds)
.map(addVariables);
// Plote a série temporal de NDVI de um ponto na imagem.
var l8Chart = ui.Chart.image.series(filteredLandsat.select('NDVI'),
gameleira)
 .setChartType('ScatterChart')
 .setOptions({
title: 'Landsat 8 NDVI time series at ROI',
 trendlines: {0: {
 color: 'CC0000'
 }},
 lineWidth: 1,
 pointSize: 3,
 });
print(l8Chart);
