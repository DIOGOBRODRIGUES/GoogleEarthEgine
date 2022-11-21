


var retanguloEnv = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-39.37362663726958, -7.856392761543975],
          [-39.37362663726958, -9.279501757774907],
          [-36.94564812164458, -9.279501757774907],
          [-36.94564812164458, -7.856392761543975]]], null, false);


var images = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA");

var imagensFiltradas = images.filterBounds(retanguloEnv)
                        .filterDate('2015-10-01','2016-10-01')
                        .reduce('mean');
                        
// Combinar redutores de uma unica entrada

var stats = imagensFiltradas.reduceRegion ({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.stdDev(), 
    sharedInputs: true
  }), geometry: retanguloEnv,
  scale: 10,
  bestEffort: true // Use maxPixels if you care about scale.
});
print(stats);

Map.addLayer(imagensFiltradas);

var meansImage = stats.toImage().select('.*_mean');
var sdsImage = stats.toImage().select('.*_stdDev');

//Exportando os DADOS
Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(null, stats)]),
  description: 'exported_stats_demo_',
  fileFormat: 'CSV'
});
