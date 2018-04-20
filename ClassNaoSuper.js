//var l8 = imageCollection.filterDate('2017-11-01', '2017-11-30').filterBounds(table);
var img = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_216065_20171126');

//Área onde vai ser procurado os valores
var regiao = ee.Geometry.Polygon(geometry);

var treinamento = img.sample({
  region:geometry , 
  scale:30, //valor do tamanho do pixel
  numPixels:100  //numero de pixel para cluster
});

var agrupamento = ee.Clusterer.wekaLVQ(10).train(treinamento);

var resultado = img.cluster(agrupamento);

Map.addLayer(img,{max:0.453, min:0.050,bands: 'B6, B5, B4'}, 'OLI');
Map.addLayer(resultado.randomVisualizer(), {}, 'Agrupamento');