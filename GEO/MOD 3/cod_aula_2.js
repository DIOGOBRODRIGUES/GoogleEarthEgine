// AULA 2 GEE 


/* exemplo de Composição *********/

// Carregue três quads de um quarto do NAIP no mesmo local, em horários diferentes.
var naip2004_2012 = ee.ImageCollection('USDA/NAIP/DOQQ')
  .filterBounds(ee.Geometry.Point(-71.08841, 42.39823))
  .filterDate('2004-07-01', '2012-12-31')
  .select(['R', 'G', 'B']);

// Componha temporariamente as imagens com uma função de valor máximo.
var composite = naip2004_2012.max();
Map.setCenter(-71.12532, 42.3712, 12);
Map.addLayer(composite, {}, 'max value composite');


/*Exemplo de mosaico ***********************************************/

// Carregue quatro quadrantes trimestrais NAIP 2012, locais diferentes.
var naip2012 = ee.ImageCollection('USDA/NAIP/DOQQ')
  .filterBounds(ee.Geometry.Rectangle(-71.17965, 42.35125, -71.08824, 42.40584))
  .filterDate('2012-01-01', '2012-12-31');

// Faça um mosaico espacial das imagens na coleção e na exibição.
var mosaic = naip2012.mosaic();
Map.setCenter(-71.12532, 42.3712, 12);
Map.addLayer(mosaic, {}, 'spatial mosaic');