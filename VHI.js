var l5sr = l5colection;
var l8sr = l8colection;

// Function to cloud mask from the Fmask band of Landsat 8 SR data.
function maskLsr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = ee.Number(2).pow(3).int();
  var cloudsBitMask = ee.Number(2).pow(5).int();

  // Get the pixel QA band.
  var qa = image.select('BQA');

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  // Return the masked image, scaled to [0, 1].
  return image.updateMask(mask);
}

// Map the function over one year of data and take the median.
var l5out98 = l5sr.filterDate('1998-10-01', '1998-10-31')
                    .map(maskLsr)
                    .median();
					
var l5out06 = l5sr.filterDate('2006-10-01', '2006-10-31')
                    .map(maskLsr)
                    .median();
					
var l5out10 = l5sr.filterDate('2010-10-01', '2010-10-31')
                    .map(maskLsr)
                    .median();
					
var l8out16 = l8sr.filterDate('2016-10-01', '2016-10-31')
                    .map(maskLsr)
                    .median();


//radiancia					
var radl5out98 = ee.Algorithms.Landsat.calibratedRadiance(l5out98);	

var radl5out06 = ee.Algorithms.Landsat.calibratedRadiance(l5out06);

var radl5out10 = ee.Algorithms.Landsat.calibratedRadiance(l5out10);

var radl8out16 = ee.Algorithms.Landsat.calibratedRadiance(l8out16);	


//reflectancia
var toal5out98 = ee.Algorithms.Landsat.TOA(l5out98);	

var toal5out06 = ee.Algorithms.Landsat.TOA(l5out06);

var toal5out10 = ee.Algorithms.Landsat.TOA(l5out10);

var toal8out16 = ee.Algorithms.Landsat.TOA(l8out16);	



// Adicionar mapa no display.
Map.addLayer(l5out98, null, 'toa');


//NDVI
var ndvil5out98 = toal5out98.normalizedDifference(['B4', 'B3']).rename('NDVIl5out98');

var ndvil5out06 = toal5out06.normalizedDifference(['B4', 'B3']).rename('NDVIl5out06');

var ndvil5out10 = toal5out10.normalizedDifference(['B4', 'B3']).rename('NDVIl5out10');

var ndvil8out16 = toal8out16.normalizedDifference(['B5', 'B4']).rename('NDVIl8out16');

//SAVI
var savil5out98 = toal5out98.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': toal5out98.select('B4'),
      'red': toal5out98.select('B3'),
      'L': 0.5
});

var savil5out06 = toal5out98.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': toal5out06.select('B4'),
      'red': toal5out06.select('B3'),
      'L': 0.5
});

var savil5out10 = toal5out98.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': toal5out10.select('B4'),
      'red': toal5out10.select('B3'),
      'L': 0.5
});

var savil8out16 = toal5out98.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': l8out16.select('B5'),
      'red': l8out16.select('B4'),
      'L': 0.5
});



//IAF
var iafl5out98 = toal5out98.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savil5out98
});

var iafl5out06 = toal5out98.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savil5out06
});

var iafl5out10 = toal5out98.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savil5out10
});

var iafl8out16 = toal5out98.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savil8out16
});
//var iafParams = {min: 0, max: 0.1, palette: ['blue', 'white', 'red']};


//Emissividade NB

var enbl5out98 = toal5out98.expression(
    '(ndvi>0)*(iaf<3)*(0.97+0.0033*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.99', {
     'iaf': iafl5out98,
     'ndvi': ndvil5out98
});

var enbl5out06 = toal5out98.expression(
    '(ndvi>0)*(iaf<3)*(0.97+0.0033*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.99', {
     'iaf': iafl5out06,
     'ndvi': ndvil5out06
});

var enbl5out10 = toal5out98.expression(
    '(ndvi>0)*(iaf<3)*(0.97+0.0033*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.99', {
     'iaf': iafl5out10,
     'ndvi': ndvil5out10
});

var enbl8out16 = toal5out98.expression(
    '(ndvi>0)*(iaf<3)*(0.97+0.0033*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.99', {
     'iaf': iafl8out16,
     'ndvi': ndvil8out16
});	

//temperatura
var temp5out98 = toal5out98.expression(
    'k2/log(enb*k1/l6+1)', {
     'k2':1260.56,
	    'k1':607.76, 
	   'enb': enbl5out98,
     'l6': toal5out98.select('B10')
});	

var templ5out06 = toal5out98.expression(
    'k2/log(enb*k1/l6+1)', {
     'k2':1260.56,
	 'k1':607.76, 
	 'enb': enbl5out06,
     'l6': toal5out06.select('B10')
});


var templ5out10 = toal5out98.expression(
    'k2/log(enb*k1/l6+1)', {
     'k2':1260.56,
	 'k1':607.76, 
	 'enb': enbl5out10,
     'l6': toal5out10.select('B10')
});

 var k1 = toal8out16.get('K1_CONSTANT_BAND_10');
 var k2 = toal8out16.get('K2_CONSTANT_BAND_10');

var templ8out16 = toal5out98.expression(
    'k2/log(enb*k1/l6+1)', {
     'k2':k2,
	    'k1':k1, 
	    'enb': enbl8out16,
     'l6': toal8out16.select('B10')
});

var TempParams = {min: 220, max: 270, palette: ['blue', 'white', 'red']};

//Map.addLayer(temp5out98, TempParams, 'temp5out98');
//Map.addLayer(templ5out06, TempParams, 'templ5out06');
//Map.addLayer(templ5out10, TempParams, 'templ5out10');
//Map.addLayer(templ8out16, TempParams, 'templ8out16');

// Display the results.
//Map.addLayer(composite, {bands: ['B3', 'B2', 'B1'], min: 0, max: 0.2});
Map.addLayer(table);
