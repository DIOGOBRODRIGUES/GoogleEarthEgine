//http://adsabs.harvard.edu/abs/2017AGUFMIN14A..08E

//TerraCLimate
var bancoTerraClimate = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE');
//alterar a shape para outra região
var shapePajeu = ee.FeatureCollection('users/diogoborbar/bacia_pajeu');

var TerraClimate = bancoTerraClimate.select('pdsi').filterBounds(shapePajeu).filterDate('1988-01-01','2017-12-31');


var TerraClimate1958 = bancoTerraClimate.select('pdsi').filterDate('1958-01-01', '1987-12-31')
                        .mean().clip(shapePajeu);


var TerraClimate1988 = bancoTerraClimate.select('pdsi').filterDate('1988-01-01', '2017-12-31')
                        .mean().clip(shapePajeu);



// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});
 
// Create legend title
var legendTitle = ui.Label({
  value: 'PDSI Legenda:',
  style: {
    fontWeight: 'bold',
    fontSize: '20px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px', fontSize: '18px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
 
//  Palette with the colors
var palette =['bc0101', 'e00c0c', 'ff3a00', 'ffb205','f2ff2f','0bff34','59ddf3','35bde7','4e74ff','0f00ff', 'a800ff'];
 
// name of the legend
var names = ['Extremamente Seco','Muito Seco','Moderadamente Seco','Ligeiramente Seco'
,'Seca Incipiente'
,'Próximo ao Normal'
,'Úmido Incipiente'
,'Ligeiramente Úmido'
,'Moderadamente Úmido'
,'Muito Úmido'
,'Extremamente Úmido'];
 
// Add color and and names
for (var i = 0; i < 11; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  
 
// add legend to map (alternatively you can also print the legend to the console)








var maps = [display1(), display2()];

ui.root.widgets().reset(maps);
var linker = ui.Map.Linker(maps);


function display1(){
  var map = new ui.Map();
  map.addLayer(TerraClimate1958,{palette:  ['bc0101', 'e00c0c', 'ff3a00', 'ffb205','f2ff2f','0bff34','59ddf3','35bde7','4e74ff','0f00ff', 'a800ff'], min: -400, max: 400});
  map.add(ui.Label('1958-1987', {position:'bottom-center', fontSize: '20px'}));
  map.add(legend);
  return map;
}

function display2(){
  var map = new ui.Map();
   map.add(ui.Label('1988-2017', {position:'bottom-center', fontSize: '20px'}));
  map.addLayer(TerraClimate1988,{palette:  ['bc0101', 'e00c0c', 'ff3a00', 'ffb205','f2ff2f','0bff34','59ddf3','35bde7','4e74ff','0f00ff', 'a800ff'], min: -499, max: 400});
  //map.add(legend);
  return map;
}



//Map.addLayer(TerraClimate1958, {palette:  ['bc0101', '1f7404', '2dd62a', 'c4e221','ebff4e','3891ff'], min: -500, max: 500});

//Fazer o gráfico
//print(ui.Chart.image.series(TerraClimate,shapePajeu, ee.Reducer.mean(), 180));
//Map.addLayer(TerraClimate);