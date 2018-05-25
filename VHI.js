/******************************************************************
*Script VHI utilizando imgens RAW L5 e L8 ***********************
********************************************************************/

//Bando de dados de imagens Landsat
var ColecaoL5= ee.ImageCollection('LANDSAT/LT05/C01/T1');
var ColecaoL8= ee.ImageCollection('LANDSAT/LC08/C01/T1');
//shapefile da bacia do Pajeú
var table = ee.FeatureCollection('users/diogoborbar/bacia_pajeu');

// Mascara de nuvem
function maskL5(image) {
   var clouds = ee.Algorithms.Landsat.simpleCloudScore(image).select('BQA');
   //672 cod para pixel limpo no LANDSAT 5
   return image.updateMask(clouds.eq(672));
}

//Radiancia e Reflectancia--> B1_1 e B1_2
function RadReflect(image){
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(image);
  var refletancia = ee.Algorithms.Landsat.TOA(image);
  return image.addBands(radiance).addBands(refletancia);
}

//NDVI   SAVI  IAF --> B4_2_1 SAVI constant constant_1
function NDVIL5(image){
  var NDVI= image.expression('(NIR - RED)/(RED + NIR)',{
      'RED': image.select('B3_2'),
      'NIR': image.select('B4_2')
  });
  var SAVI = image.expression('((1 + L) * (NIR - RED))/ (NIR + RED + L)',{
      'RED': image.select('B3_2'),
      'NIR': image.select('B4_2'),
      'L': 0.5
  });
  var IAF = image.expression('-log((0.69-savi)/0.59)/0.91',{
    'savi': SAVI
  });
 return image.addBands(NDVI.rename('ndvi')).addBands(SAVI.rename('savi'))
             .addBands(IAF.rename('iaf'));
}

//Enb --> B4_2_1_1
function Enb(image){
    var enb= image.expression('(NDVI>0)*(IAF<3)*(0.97+0.0033*IAF)+(IAF>=3)*0.98+(NDVI<0)*0.99', {
      'IAF': image.select('iaf'),
      'NDVI': image.select('ndvi')
  });
 return image.addBands(enb.rename('enb'));
}

//temperatura de superficie
function Tempsuper(image){
  var tempL5 = image.expression('k2/log(enb*k1/l6+1)-273.15', {
     'k2':ee.Number(image.get('K2_CONSTANT_BAND_6')),
     'k1':ee.Number(image.get('K1_CONSTANT_BAND_6')),
     'enb': image.select('enb'),
     'l6': image.select('B6_1')
  });
  return image.addBands(tempL5.rename('lst'));
}

// Funcao para calculo do VCI e TCI -->NDVI_1 constant
function VCITCI (image, variavel, equacao, nome){
  var Max= image.select(variavel).reduceRegion({
      reducer:ee.Reducer.max(),
      geometry:table,
      scale:90
     });

  var Min = image.select(variavel).reduceRegion({
      reducer:ee.Reducer.min(),
      geometry:table,
      scale:90
     });

  var vcitci = image.expression(equacao,{
    'valor':image.select(variavel),
    'min': ee.Number(Min.get(variavel)),
    'max': ee.Number(Max.get(variavel))
  });
  return image.addBands(vcitci.rename(nome));
}

//implementacao das funcoes na biblioteca das imagens
var L5 = ColecaoL5.filterBounds(table)
                  .filterDate('1996-01-01', '1996-12-31')
                   .map(maskL5)
                   .map(RadReflect)
                   .map(NDVIL5)
                   .map(Enb)
                   .map(Tempsuper)
                   .median()
                   .clip(table);
Map.addLayer(L5);

//Calulo do VCI e TCI
var resultadoVCI = VCITCI(L5, 'ndvi', '(valor-0.2)/(max-0.2)*100','vci');
var resultadoTCI = VCITCI(L5, 'lst', '(max-valor)/(max-min)*100','tci');

var VHI = ee.Image().expression('0.5*VCI+0.5*TCI',{
  'VCI':resultadoVCI.select('vci'),
  'TCI':resultadoTCI.select('tci')
});
var VHIParams = {min: 10, max: 40, palette: ['red', 'white', 'green']};
Map.addLayer(VHI, VHIParams,'VHI');
