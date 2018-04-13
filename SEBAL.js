
/**********************************************************************
*************************Algoritmo SEBAL v1****************************
**********************************************************************/

/*1-Dados da estação  meteorológica************************************
**********************************************************************/

//1.1 Temperatura do ar média em °C das 10:00 as 12:00 
var Tar =31.46666667;
//1.2 Altitude média (m)
var  Alt = 444;
//1.3 Velocidade do Vento (m/s) (média das 10h as 12h )
var Vento = 2.733333333;
//1.4 Radiação solar acumulada (w/m2)
var Rn24= ee.Number(303.9);
//1.5 transmitância 24h
var tsw24= ee.Number(0.71);

/*1-FIM***************************************************************
**********************************************************************/


/* 2-Selecionar Imagem *********************************************
*******************************************************************/
var l8nov2017 = ee.Image('LANDSAT/LC08/C01/T1/LC08_216065_20160920');
Map.addLayer(l8nov2017, {bands: ['B4', 'B3', 'B2'], min: 6000, max: 12000}, 'l8nov2017');

/*2-FIM***************************************************************
**********************************************************************/

/*3-Converte a imgane para radiância espectral***********************
**********************************************************************/
var radiance = ee.Algorithms.Landsat.calibratedRadiance(l8nov2017);
//Map.addLayer(radiance, {bands: ['B4', 'B3', 'B2'], max: 90}, 'radiance');

/*3-FIM***************************************************************
**********************************************************************/

/*4-Converte a imagem para refletância*******************************
**********************************************************************/
var toa = ee.Algorithms.Landsat.TOA(l8nov2017);
//recortando area de interesse 
var toa_clip = toa.clip(geometry);
//adicionar ao mapa 
Map.centerObject(toa_clip, 10);
//Map.addLayer(toa_clip, {bands: ['B4', 'B3', 'B2'], max: 0.2}, 'toa reflectance');

/*4-FIM***************************************************************
**********************************************************************/

/* 5- Computando indices de vegetação******************************
**********************************************************************/

//5.1-NDVI
var nir = toa_clip.select('B5');
var red =toa_clip.select('B4');
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
// Adicionar mapa no display.
var ndviParams = {min: 0, max: 0.9, palette: ['#800000', '#FFFF00', '#00FF00','#008000']};
Map.addLayer(ndvi, ndviParams, 'NDVI image');
//exportar imagem
Export.image.toDrive({
  image: ndvi,
  description: '20092016_NDVI',
  scale: 30,
  //region: geometry
});


//5.2-SAVI
var savi = toa_clip.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': toa_clip.select('B5'),
      'red': toa_clip.select('B4'),
      'L': 0.5
});
var savi_pixel = savi.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var savi_pixel_Nu = ee.Number(savi_pixel);
//print ('savi:', savi_pixel_Nu);
var saviParams = {min: -0.3, max: 0.55, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(savi, saviParams, 'SAVI image');

//5.3-IAF
var iaf = toa_clip.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savi
});
var iafParams = {min: 0, max: 0.1, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(iaf, iafParams, 'IAF image');

/*5-FIM***************************************************************
**********************************************************************/

/*6-Albedo**********************************************************
*********************************************************************/

//6.1 Albedo toa 
var albtoa = toa_clip.expression(
    '0.300*p2+0.276*p3+0.233*p4+0.143*p5+0.035*p6+0.012*p7', {
     'p2': toa_clip.select('B2'),
     'p3': toa_clip.select('B3'),
     'p4': toa_clip.select('B4'),
     'p5': toa_clip.select('B5'),
     'p6': toa_clip.select('B6'),
     'p7': toa_clip.select('B7')
    
});
var albtoaParams = {min: 0, max: 0.35, palette: ['blue', 'white', 'red']};
//Map.addLayer(albtoa,  albtoaParams,'Albedo toa');

//6.2 Albedo Superficie 
var tsw = 0.75+2*Math.pow(10, -5)*Alt;
//print('tsw: ', tsw);
var albsuper =toa_clip.expression(
    '(albtoa-0.03)/tsw**2', {
     'albtoa': albtoa,
     'tsw': tsw
});
var albsuperParams = {min: 0, max: 0.51, palette: ['#008000', '#00FF00', '#800080', '#800000']};
Map.addLayer(albsuper,  albsuperParams,'Albedo superficie');
//exportar imagem
Export.image.toDrive({
  image: albsuper,
  description: '20092016_albsuper',
  scale: 30,
  //region: geometry
});

/*6-FIM***************************************************************
**********************************************************************/

/*7-Temperatura da superficie ***************************************
**********************************************************************/

var Tsup = toa_clip.select('B10');
var TsupParams = {min: 290, max: 320, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(Tsup,  TsupParams,'Temperatura de superficie');

/*7-FIM***************************************************************
**********************************************************************/


/*8-Saldo de Radiacao **********************************************
*******************************************************************/

//8.1-Radiação de onda curta incidente
var se = toa.get('SUN_ELEVATION');
// print('SUN_ELEVATION: ', se);     
var sundist= toa.get('EARTH_SUN_DISTANCE');
 //  print('EARTH_SUN_DISTANCE: ', sundist); 
var Rolcurtins = ee.Number(1367).multiply(((ee.Number(90).subtract(se)).multiply(Math.PI).divide(180)).cos()).multiply(sundist).multiply(tsw);
//print('Rolcurtins: ', Rolcurtins);  

//8.2-Radiação de Onda Longa Emitida
//emissividade e0
var e0 = toa.expression(
    '(ndvi>0)*(iaf<3)*(0.95+0.01*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.985', {
     'iaf': iaf,
     'ndvi': ndvi
});

var e0Params = {min: 0.95, max: 1, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(e0,  e0Params,'emissividade e0');

var SBoltzman = 5.67*Math.pow(10, -8); 

var Rolemi = toa.expression(
    'e0*SBoltzmant*tsup**4', {
    'SBoltzmant': SBoltzman,
     'e0': e0,
     'tsup': toa_clip.select('B10')
});

var RolemiParams = {min: 300, max: 500, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(Rolemi,  RolemiParams,'Rolemi:');

// 8.3-Radiação de onda longa incidente
var ea =0.85*Math.pow((-Math.log(tsw)),0.09);
//print('ea: ', ea); 
var Rolatm = ea*5.67*Math.pow(10, -8)*Math.pow(Tar+273.15, 4);
//print('Rolatm: ', Rolatm);


//8.4-Saldo de radiacao
var Rn = toa.expression(
    'A*(1-B)-C+D-(1-E)*D', {
    'A': Rolcurtins,
    'B':albsuper,
    'C': Rolemi,
    'D':Rolatm,
    'E': e0
});
var RnParams = {min: 100, max: 900, palette: ['#000080', '#808000', '#FF0000']};
// Adicionar mapa no display.
Map.addLayer(Rn,  RnParams,'Rn');
//exportar imagem
Export.image.toDrive({
  image: Rn,
  description: '20092016_Rn',
  scale: 30,
  //region: geometry
});

/*8-FIM***************************************************************
**********************************************************************/

/*9-Fluxo de Calor no Solo********************************************
**********************************************************************/
var G = toa_clip.expression(
    '(ndvi>=0)*((Ts-273.15)/albesup*(0.0039*albesup+0.0074*albesup**2)*(1-0.98*ndvi**4)*Rn)+(ndvi<0)*(0.3*Rn)', {
    'Ts': toa_clip.select('B10'),
    'ndvi':ndvi,
    'albesup': albsuper,
    'Rn': Rn
});

var GParams = {min: 20, max: 190, palette: ['#008000', '#FFFACD', '#FFA500', '#FFE4E1']};
// Adicionar mapa no display.
Map.addLayer(G,  GParams,'G');
Export.image.toDrive({
  image: G,
  description: '20092016_G',
  scale: 30,
  //region: geometry
});


/*8-FIM***************************************************************
**********************************************************************/

/*9-Fluxo de calor sensível********************************************
**********************************************************************/

//9.1-velocidade de fricção
var uf= (0.41*Vento)/Math.log(2/(0.12*0.1));
//print('uf: ',uf);

//9.2-velocidade a 200m estabilidade neutra
var u200 = uf*Math.log(200/(0.12*0.1))/0.41;
//print('u200: ',u200);

//Z0m (m) pode ser obtido em função do SAVI segundo equação desenvolvida por Bastiaanssen (2000)
var z0 = toa.expression(
    'exp(-5.809+5.62*SAVI)', {
    'SAVI': savi
});

var z0_pixel = z0.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var z0pixel_Nu = ee.Number(z0_pixel);
//print ('z0:', z0pixel_Nu);
var z0Params = {min: 0, max: 0.1, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(z0,  z0Params,'z0');

//9.3-velocidade de fricção (u*) para cada pixel 
var ufp = toa.expression(
    '(k*u200)/log(200/z0)', {
    'u200': u200,
    'z0': z0,
    'k': 0.41
});

var ufp_pixel = ufp.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var ufp_pixel_Nu = ee.Number(ufp_pixel);
//print ('ufp:', ufp_pixel_Nu);

var ufpParams = {min: 0, max: 1, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(ufp,  ufpParams,'ufp');

//9.10-Resistência aerodinâmica rah (sm-1) 
var rah = toa.expression(
    'log(Z2/Z1 )/(ufp*k)', {
    'Z2': 2,
    'Z1': 0.1,
    'ufp': ufp,
    'k': 0.41
});

var rahParams = {min: 0, max: 1, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
//Map.addLayer(rah,  rahParams,'ufp');

/*Inicio do loop*************************************************
*****************************************************************/
    var teste_rah = ee.Number(0);
    var contador_loop =0;
    while (contador_loop<8){
    //9.11-coeficiente b
        var Rn_HotP = Rn.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var Rn_HotP_Nu = ee.Number(Rn_HotP);
        //print ("Rn ", Rn_HotP_Nu);

        var G_HotP = G.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('NDVI');
        var G_HotP_Nu = ee.Number(G_HotP);
        //print ('G:', G_HotP_Nu);

        var rah_HotP = rah.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var rah_HotP_Nu = ee.Number(rah_HotP);
        print ('rah:', rah_HotP_Nu);

        var Ts_HotP = Tsup.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('B10');
        var Ts_HotP_Nu = ee.Number(Ts_HotP);
        //print ('Ts:', Ts_HotP_Nu);

        var Ts_ColP = Tsup.reduceRegion(ee.Reducer.first(),cold_pixel,10).get('B10');
        var Ts_ColP_Nu = ee.Number(Ts_ColP);
        //print ('Ts:', Ts_ColP_Nu);

        var b = (rah_HotP_Nu.multiply(Rn_HotP_Nu.subtract(G_HotP_Nu))).divide((Ts_HotP_Nu.subtract(Ts_ColP_Nu)).multiply(1.15*1004));
        print('b:',b);
        
        //9.12- Coeficiente a
        var a = ee.Number(-1).multiply(b).multiply(Ts_ColP_Nu.subtract(273.15));
        print('a:',a);
  
        //9.13-Fluxo de Calor Sensivel
        var H_quente = toa.expression(
          '1.15*1004*(a+b*(Tsup-273.15))/ra',{
          'ra':rah,
          'a': a,
          'b': b,
          'Tsup':Tsup
        });
       // Map.addLayer(H_quente, null, 'Hquente');
        var H_pixel = H_quente.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var H_pixel_Nu = ee.Number(H_pixel);
        print ('H_pixel:', H_pixel_Nu);

       //9.14-Comprimento de Monin-Obukhov L 
        var L = toa.expression(
          '-1.15*1004*ufp**3*Tsup/(0.41*9.81*H)', {
          'H':H_quente,
          'Tsup': Tsup,
          'b': b,
          'ufp': ufp
        });
      // Map.addLayer(L, null, 'L' );
        var L_pixel = L.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var L_pixel_Nu = ee.Number(L_pixel);
        print ('L_pixel:', L_pixel_Nu);
      
      //9.15-psi_200
        var psi_m200 = toa.expression(
          'L<0?(2*log((1+((1-16*200/L)**0.25))/2)+log((1+((1-16*200/L)**0.25)**2)/2)-2*atan((1-16*200/L)**0.25)+0.5*3.14159265359):(L>0 ? (-5*(200/L)):(0/L*L))', {
          'L':L
        });
        //Map.addLayer(psi_m200, null, 'psi_m200');
        var psi_m200_pixel = psi_m200.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var psi_m200_pixel_Nu = ee.Number( psi_m200_pixel);
        print ('psi_m200:', psi_m200_pixel_Nu);
        
      //9.16-psi_2m
        var psi_m2 = toa.expression(
          'L<0?(2*log((1+((1-16*2/L)**0.25)**2)/2)):(L>0 ? (-5*(2/L)):(0/L*L))', {
          'L':L
     });
  
        var psi_m2_pixel = psi_m2.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var psi_m2_pixel_Nu = ee.Number( psi_m2_pixel);
        print ('psi_m2:', psi_m2_pixel_Nu);
        //Map.addLayer(psi_m2, null, 'psi_m2');

      //9.17-psi_1m
        var psi_m1 = toa.expression(
          'L<0?(2*log((1+((1-16*0.1/L)**0.25)**2)/2)):(L>0 ? (-5*(0.1/L)):(0/L*L))', {
          'L':L
         });
        var psi_m1_pixel = psi_m1.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var psi_m1_pixel_Nu = ee.Number( psi_m1_pixel);
        print ('psi_m1:', psi_m1_pixel_Nu);
        // Map.addLayer(psi_m1,  null, 'psi_m1');

      //9.18-velocidade de fricção (u*) para cada pixel Corrigida
        var ufp_corr = toa.expression(
          '(k*u200)/(log(200/z0)-psi_m200)', {
          'SAVI': savi,
          'u200': u200,
          'z0': z0,
          'k': 0.41,
          'psi_m200':psi_m200
        });
      // Map.addLayer(ufp_corr, null, 'ufp_corr');
        var ufp_corr_pixel = ufp_corr.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var ufp_corr_pixel_Nu = ee.Number(ufp_corr_pixel);
        print ('ufp_corr:', ufp_corr_pixel_Nu);

      //9.20-resistência aerodinâmica rah (sm-1) corrrigida
        var rah_corr = toa.expression(
          '(log(Z2/Z1)-psi_m2+psi_m1)/(ufp_corr*k)', {
          'Z2': 2,
          'Z1': 0.1,
          'ufp_corr': ufp_corr,
          'k': 0.41,
          'psi_m2':psi_m2,
          'psi_m1':psi_m1
      });
      //Map.addLayer(rah_corr);
        var rah_HotP_Corr = rah_corr.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var rah_HotP_Corr_Nu = ee.Number(rah_HotP_Corr);
        print ('rah_corr',rah_HotP_Corr_Nu);
  
      //9.21-determinação do dT
        var dT = toa.expression(
          'rah*(Rn-G)/(1.15*1004)', {
          'rah':rah_corr,
          'Rn': Rn,
          'G': G
      });
        var dT_hot = dT.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var dt_hot_Nu = ee.Number(rah_HotP_Corr);
        print ('dt_hot', dt_hot_Nu);
  
        //9.22-Cálculo do erro  
        var rah_dif =  rah_HotP_Nu.subtract(rah_HotP_Corr_Nu);
        //print (typeof rah_dif);
        var rah_dif = ee.Algorithms.If(rah_dif.lt(0), rah_dif.multiply(-1), rah_dif );
        //print (rah_dif);
        rah_dif = ee.Number(rah_dif);
        var teste_rah = rah_dif.multiply(100).divide(rah_HotP_Corr_Nu);
        print ("teste_rah", teste_rah);
        rah = rah_corr;
        ufp=ufp_corr;
        contador_loop++;
        print ( "contador", contador_loop);
}
//Mapa do fluxo do calor Sensinvel 
var H_quenteParams = {min: 0, max: 500, palette: ['#008000', '#FFFACD', '#FFA500', '#FFE4E1']};
// Adicionar mapa no display.
Map.addLayer(H_quente,  H_quenteParams,'H');

Export.image.toDrive({
  image: H_quente,
  description: '20092016_H',
  scale: 30,
  //region: geometry
});


/*9-FIM e fim do loop**************************************************
*****************************************************************/

/*10-Fluxo de Calor Latente ****************************************
********************************************************************/
var L = toa.expression(
   'Rn-G-H', {
   'Rn': Rn,
   'G': G,
   'H':H_quente
  });
  var LParams = {min: 0, max: 500, palette: ['#008000', '#FFFACD', '#FFA500', '#FFE4E1']};
  Map.addLayer(L, LParams, 'L');
  
Export.image.toDrive({
  image: L,
  description: '20092016_L',
  scale: 30,
  //region: geometry
});

  
/*10-FIM ***********************************************************
********************************************************************/

/*11-Fração evaporativa******************************************
********************************************************************/
var Fe24h = toa.expression(
   'L/(Rn-G)', {
   'Rn': Rn,
   'G': G,
   'L':L
  });
//Map.addLayer(Fe24h, null, 'Fe24h');

/*11-FIM ***********************************************************
********************************************************************/

/*12- Fluxo de calor latente 24 horas**********************************
***********************************************************************/
var Rn24n = toa.expression(
   'Rn24*(1-albtoa)-123*tsw24', {
   'Rn24': Rn24,
   'tsw24':  tsw24,
   'albtoa':albtoa
  });
//saldo de radiação diaria 
//Map.addLayer(Rn24n, null, 'Rn24n');

var Le24h = toa.expression(
   'Fe24h*Rn24n', {
   'Rn24n': Rn24n,
   'Fe24h': Fe24h
  });
//Map.addLayer(Le24h, null, 'Le24h');

/*12-FIM ***********************************************************
********************************************************************/  


/*13-Conversão da LE24h para ETo24h*********************************
**********************************************************************/
var ETd = toa.expression(
   '0.035*Fe24h*Rn24n', {
   'Rn24n': Rn24n,
   'Fe24h': Fe24h
  });
var EtdParams = {min: 1, max: 4, palette: ['blue', 'white', 'red']};
Map.addLayer(ETd, EtdParams, 'ETd');

Export.image.toDrive({
  image: ETd,
  description: '20092016_ETd',
  scale: 30,
  //region: geometry
});
