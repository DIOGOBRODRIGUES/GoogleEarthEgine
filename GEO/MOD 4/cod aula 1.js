//exemplo 1
var clientString = 'Eu sou uma String';
print(typeof clientString);  // string



// exemplo 2 

var serverString = ee.String('Eu não sou uma string!');
print(typeof serverString);  // object
print('Is this an EE object?',
    serverString instanceof ee.ComputedObject);  // true


//Exemplo 3

var someString = serverString.getInfo();
var strings = someString + '  Am I?';
print(strings);  // I am not a String!  Am I?



//Exemplo 4

var myList = ee.List([1, 2, 3]);
var serverBoolean = myList.contains(5);
print(serverBoolean);  // false

var serverConditional = ee.Algorithms.If(serverBoolean, 'True!', 'False!');
print('deveria ser falso ', serverConditional);  // False!


//Exemplo 5

var image = ee.Image('LANDSAT/LC08/C01/T1/LC08_044034_20140318').select('B3');

var printAtScale = function(scale) {
  print('Pixel value at '+scale+' meters scale',
    image.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: image.geometry().centroid(),
      // The scale determines the pyramid level from which to pull the input
      scale: scale
  }).get('B3'));
};

printAtScale(10); // 8883
printAtScale(30); // 8883
printAtScale(50); // 8337
printAtScale(70); // 9215
printAtScale(200); // 8775
printAtScale(500); // 8300


//Exemplo 6

var image = ee.Image('LANDSAT/LC08/C01/T1/LC08_044034_20140318').select(0);
print('Projection, crs, and crs_transform:', image.projection());
print('Scale in meters:', image.projection().nominalScale());