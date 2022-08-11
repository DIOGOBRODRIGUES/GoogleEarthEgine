//Exemplo 1***************************
var gsw = ee.Image('JRC/GSW1_3/GlobalSurfaceWater');
var occurrence = gsw.select('occurrence');

var VIS_OCCURRENCE = {
  min: 0,
  max: 100,
  palette: ['red', 'blue']
};

Map.addLayer({
  eeObject: occurrence.updateMask(occurrence.divide(100)),
  name: 'Water Occurrence (1984-2015)',
  visParams: VIS_OCCURRENCE
});


//Exemlo 2*****************************

var gsw = ee.Image('JRC/GSW1_3/GlobalSurfaceWater');
var change = gsw.select("change_abs");

var VIS_CHANGE = {
    min:-50,
    max:50,
    palette: ['red', 'black', 'limegreen']
};

Map.setCenter(-74.4557, -8.4289, 11);  // Ucayali River, Peru
Map.addLayer({
  eeObject: change,
  visParams: VIS_CHANGE,
  name: 'occurrence change intensity'
});

//Exemplo 3 ***************************************

// Generate a histogram object and print it to the console tab.
var histogram = ui.Chart.image.histogram({
  image: change,
  region: roi,
  scale: 30,
  minBucketWidth: 10
});
histogram.setOptions({
  title: 'Histogram of surface water change intensity.'
});

print(histogram);