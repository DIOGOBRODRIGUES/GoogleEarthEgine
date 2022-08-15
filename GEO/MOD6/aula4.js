//Exemplo com mapBiomas

var mapBiomas = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1');
var UF = ee.FeatureCollection('users/diogoborbar/lml_unidade_federacao_a');
var PE = UF.filter(ee.Filter.eq('nome', 'Pernambuco'));

var projectyear =2000
var startyear = projectyear - 1
var endyear = projectyear + 16
for (var yr= projectyear; yr <= endyear; yr = yr + 1) {
  
  var bioma_reclass =mapBiomas.select('classification_'+yr).expression(
    '(bioma==1)*1/bioma*bioma+(bioma==2)*1/bioma*bioma+(bioma==3)*1/bioma*bioma +(bioma==4)*4/bioma*bioma+(bioma==5)*3/bioma*bioma+(bioma==9)*1/bioma*bioma+(bioma==10)*4/bioma*bioma+(bioma==11)*4/bioma*bioma+(bioma==12)*4/bioma*bioma+(bioma==32)*7/bioma*bioma+(bioma==13)*4/bioma*bioma+(bioma==14)*2/bioma*bioma+(bioma==15)*2/bioma*bioma+(bioma==19)*2/bioma*bioma+(bioma==20)*2/bioma*bioma+(bioma==21)*2/bioma*bioma+(bioma==22)*7/bioma*bioma+(bioma==23)*7/bioma*bioma+(bioma==24)*5/bioma*bioma+(bioma==29)*7/bioma*bioma+(bioma==30)*7/bioma*bioma+(bioma==25)*7/bioma*bioma+(bioma==26)*6/bioma*bioma+(bioma==33)*6/bioma*bioma+(bioma==31)*6/bioma*bioma+(bioma==27)*0/bioma*bioma'

, {
    'bioma': mapBiomas.select('classification_'+yr)
});


Export.image.toDrive({
  image:bioma_reclass,
  description: 'TowersBuffer'+yr,
  scale: 30,
  region: PE
});

Map.addLayer(bioma_reclass.clip(PE), {palette:['129912', 'BBFCAC', 'FFFFB2', 'EA9999','0000FF'], min: 1, max: 7}, "ano"+yr)
  
}
