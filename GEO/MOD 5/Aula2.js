//Exemplo 1 *************************************************
var gfc2014 = ee.Image('UMD/hansen/global_forest_change_2020_v1_8');
 //verde onde há floresta, vermelha onde há perda de floresta, azul onde há ganho de floresta e magenta onde há ganho e perda.

Map.addLayer(gfc2014, {
  bands: ['loss', 'treecover2000', 'gain'],
  max: [1, 255, 1]
}, 'forest cover, loss, gain');



// Exemplo 2****************************************************************

// Carregar características de país do conjunto de dados Large Scale International Boundary (LSIB).
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');

// Subconjunto o recurso República do Congo de países.
var congo = countries.filter(ee.Filter.eq('country_na', 'Rep of the Congo'));

// Obtém a imagem de perda da floresta.
var gfc2014 = ee.Image('UMD/hansen/global_forest_change_2020_v1_8');
var lossImage = gfc2014.select(['loss']);
var areaImage = lossImage.multiply(ee.Image.pixelArea());

// Soma os valores dos pixels de perda de floresta na República do Congo.
var stats = areaImage.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: congo,
  scale: 30,
  maxPixels: 1e9
});
print('pixels representing loss: ', stats.get('loss'), 'square meters');


//Exemplo 3*******************************************************************

// Carrega os limites do país do LSIB.
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
// Obtenha uma coleção de recursos apenas com o recurso Congo.
var congo = countries.filter(ee.Filter.eq('country_co', 'CF'));

// Obtém a imagem de perda.
// Este conjunto de dados é atualizado anualmente, então obtemos a versão mais recente.
var gfc2017 = ee.Image('UMD/hansen/global_forest_change_2020_v1_8');
var lossImage = gfc2017.select(['loss']);
var lossAreaImage = lossImage.multiply(ee.Image.pixelArea());

var lossYear = gfc2017.select(['lossyear']);
var lossByYear = lossAreaImage.addBands(lossYear).reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1
    }),
  geometry: congo,
  scale: 30,
  maxPixels: 1e9
});
print(lossByYear);

//formatação da datas imprimir dados separados por ano
var statsFormatted = ee.List(lossByYear.get('groups'))
  .map(function(el) {
    var d = ee.Dictionary(el);
    return [ee.Number(d.get('group')).format("20%02d"), d.get('sum')];
  });
var statsDictionary = ee.Dictionary(statsFormatted.flatten());
print(statsDictionary);


//construindo gráfico
var chart = ui.Chart.array.values({
  array: statsDictionary.values(),
  axis: 0,
  xLabels: statsDictionary.keys()
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Yearly Forest Loss',
    hAxis: {title: 'Year', format: '####'},
    vAxis: {title: 'Area (square meters)'},
    legend: { position: "none" },
    lineWidth: 1,
    pointSize: 3
  });
print(chart);