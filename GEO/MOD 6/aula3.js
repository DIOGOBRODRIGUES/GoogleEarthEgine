
//desenhar retangulo utilizando ferrramenta do GEE e nomear "geometry"
var trmm = ee.ImageCollection('TRMM/3B42');

var months = ee.List.sequence(1, 12);


// Group by month, and then reduce within groups by mean();
// the result is an ImageCollection with one image for each
// month.
//select(0)  seleciona a primeira banda 
//ee.Filter.calendarRange(m, m, 'month')) filtro de calendário que inicia e finaliza no próprio mês
var byMonth = ee.ImageCollection.fromImages(
      months.map(function (m) {
        return trmm.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .filterBounds(geometry)
                    .filterDate('2008-01-01', '2008-12-31')
                    .select(0).sum()
                    .set('month', m).clip(geometry);
}));

//gerar gráfico da imageCollection
var grafico = ui.Chart.image.series({
  imageCollection: byMonth,
  region: geometry,
  xProperty: 'month',
  reducer: ee.Reducer.mean(),
  scale: 500,
});
print(grafico);

print(byMonth);
Map.centerObject(geometry, 7);
Map.addLayer(byMonth.mean(), {bands:'precipitation', min:0, max:80, palette:['#ff8e19', '#ad0dff']});

Export.image.toAsset({
  image:byMonth.mean(),
  description:'pp_mes',
  scale: 500,
  region: geometry
});
