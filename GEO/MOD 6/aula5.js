/**********************************************************************
*************************SEBAL Algorithm v1****************************
**********************************************************************/

/*1- Weather station data and scene selection landsat8 OLI*************
**********************************************************************/

//1.1 Average air temperature in °C from 10:00 a.m. to 12:00 p.m.
var Tar =27.4333;
//1.2 Wind Speed (m/s) (average 10h to 12h)
var Vento =2.1333;
//1.3 Accumulated solar radiation (w/m2)
var Rs24= ee.Number(198.0370);
//1.4 transmittance 24h
var tsw24= ee.Number(0.4405);
//1.5 temperature of the month with maximum NDVI
var Topt = 25.6419
//1.6 Average daytime air temperature °C
var Tdia = 29.6250
//1.7 date of image
var data ='20171212'
//1.8 Path/Row of image
var pathRow ='216065'

/*1-END***************************************************************
**********************************************************************/

/* 2-Selecionar Imagem *********************************************
*******************************************************************/
var l8nov2017 = ee.Image('LANDSAT/LC08/C01/T1/LC08_'+pathRow+'_'+data);

//image SRTM
var srtm = ee.Image('USGS/SRTMGL1_003');
var srtm_clip = srtm.clip(geometry);
Map.centerObject(geometry, 10);

/*2-FIM***************************************************************
**********************************************************************/

/*3-Converte a imgane para radiância espectral***********************
**********************************************************************/
var radiance = ee.Algorithms.Landsat.calibratedRadiance(l8nov2017);


/*3-FIM***************************************************************
**********************************************************************/

/*4-Converte a imagem para refletância*******************************
**********************************************************************/
var toa = ee.Algorithms.Landsat.TOA(l8nov2017);
//recortando area de interesse 
var toa_clip = toa.clip(geometry);


/*4-FIM***************************************************************
**********************************************************************/

/* 5- Computando indices de vegetação******************************
**********************************************************************/
//5.1-NDVI
var nir = toa_clip.select('B5');
var red =toa_clip.select('B4');
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');


//5.2-SAVI
var savi = toa_clip.expression(
    '((1 + L) * (nir - red))/ (nir + red + L)', {
      'nir': toa_clip.select('B5'),
      'red': toa_clip.select('B4'),
      'L': 0.5
});
var savi_pixel = savi.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var savi_pixel_Nu = ee.Number(savi_pixel);


//5.3-IAF
var iaf = toa_clip.expression(
    '-log((0.69-savi)/0.59)/0.91', {
    'savi': savi
});
var iafParams = {min: 0, max: 0.1, palette: ['blue', 'white', 'red']};


/*5-FIM***************************************************************
**********************************************************************/

/*6-Albedo**********************************************************
*********************************************************************/
//6.1 Albedo toa 
var albtoa = toa_clip.expression(
    '0.300*p2+0.277*p3+0.233*p4+0.143*p5+0.036*p6+0.012*p7', {
     'p2': toa_clip.select('B2'),
     'p3': toa_clip.select('B3'),
     'p4': toa_clip.select('B4'),
     'p5': toa_clip.select('B5'),
     'p6': toa_clip.select('B6'),
     'p7': toa_clip.select('B7')
});
var albtoaParams = {min: 0, max: 0.35, palette: ['blue', 'white', 'red']};


//6.2 Albedo Superficie 
var tsw = srtm_clip.expression(
    '0.75+2*10**(-5)*srtm',{
      'srtm':srtm_clip
    });


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
  description: 'albsuper_'+data,
  scale: 30,
  //region: geometry
});

/*6-FIM***************************************************************
**********************************************************************/


/*7-Temperatura da superficie ***************************************
**********************************************************************/
//7.01 enb 
  var enb= toa_clip.expression('(NDVI>0)*(IAF<3)*(0.97+0.0033*IAF)+(IAF>=3)*0.98+(NDVI<0)*0.99', {
      'IAF': iaf,
      'NDVI': ndvi
  });
  
  var Tsup = toa_clip.expression('(k2/log(enb*k1/l10+1))-273.15', {
     'k2':ee.Number(toa_clip.get('K2_CONSTANT_BAND_10')),
     'k1':ee.Number(toa_clip.get('K1_CONSTANT_BAND_10')),
     'enb': enb,
     'l10': radiance.select('B10')
  });


var TsupParams = {min: 20, max: 40, palette: ['blue', 'white', 'red']};
// Adicionar mapa no display.
Map.addLayer(Tsup,  TsupParams,'Temperatura de superficie');

/*7-FIM***************************************************************
**********************************************************************/

/*8-Saldo de Radiacao **********************************************
*******************************************************************/

//8.1-Radiação de onda curta incidente
var se = toa.get('SUN_ELEVATION');
// print('SUN_ELEVATION: ', se);     
var sundist= toa.get('EARTH_SUN_DISTANCE');
 //  print('EARTH_SUN_DISTANCE: ', sundist); 
var Rolcurtins = toa.expression('1367*cos((90-se)*3.141592/180)*(1/sundist)**2*tsw',{
  'se':ee.Number(se),
  'sundist':ee.Number(sundist),
  'tsw':tsw
});


//8.2-Radiação de Onda Longa Emitida
//emissividade e0
var e0 = toa.expression(
    '(ndvi>0)*(iaf<3)*(0.95+0.01*iaf)+(iaf>=3)*0.98+(ndvi<0)*0.985', {
     'iaf': iaf,
     'ndvi': ndvi
});


var SBoltzman = 5.67*Math.pow(10, -8); 

var Rolemi = toa.expression(
    'e0*SBoltzmant*(tsup+273.15)**4', {
    'SBoltzmant': SBoltzman,
     'e0': e0,
     'tsup': Tsup
});


// 8.3-Radiação de onda longa incidente
var ea= toa.expression('0.85*(-log(tsw))**0.09',{
  'tsw':tsw
});

var Rolatm = toa.expression('ea*5.67*10**(-8)*(Tar+273.15)**4',{
  'ea':ea,
  'Tar':Tar
});


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
  description: 'Rn_'+data,
  scale: 30,
  //region: geometry
});

/*8-FIM***************************************************************
**********************************************************************/

/*9-Fluxo de Calor no Solo********************************************
**********************************************************************/
var G = toa_clip.expression(
    '(ndvi>=0)*(Ts/albesup*(0.0039*albesup+0.0074*albesup**2)*(1-0.98*ndvi**4)*Rn)+(ndvi<0)*(0.3*Rn)', {
    'Ts': Tsup,
    'ndvi':ndvi,
    'albesup': albsuper,
    'Rn': Rn
});

var GParams = {min: 20, max: 190, palette: ['#008000', '#FFFACD', '#FFA500', '#FFE4E1']};
// Adicionar mapa no display.
Map.addLayer(G,  GParams,'G');
Export.image.toDrive({
  image: G,
  description: 'G_'+data,
  scale: 30,
  //region: geometry
});


/*8-FIM***************************************************************
**********************************************************************/

/*9-Fluxo de calor sensível********************************************
**********************************************************************/

//9.1-velocidade de fricção
var uf= (0.41*Vento)/Math.log(2/(0.12*0.1));


//9.2-velocidade a 200m estabilidade neutra
var u200 = uf*Math.log(200/(0.12*0.1))/0.41;


//Z0m (m) pode ser obtido em função do SAVI segundo equação desenvolvida por Bastiaanssen (2000)
var z0 = toa.expression(
    'exp(-5.809+5.62*SAVI)', {
    'SAVI': savi
});

var z0_pixel = z0.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var z0pixel_Nu = ee.Number(z0_pixel);


//9.3-velocidade de fricção (u*) para cada pixel 
var ufp = toa.expression(
    '(k*u200)/log(200/z0)', {
    'u200': u200,
    'z0': z0,
    'k': 0.41
});

var ufp_pixel = ufp.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
var ufp_pixel_Nu = ee.Number(ufp_pixel);


//9.10-Resistência aerodinâmica rah (sm-1) 
var rah = toa.expression(
    'log(Z2/Z1 )/(ufp*k)', {
    'Z2': 2,
    'Z1': 0.1,
    'ufp': ufp,
    'k': 0.41
});


/*Inicio do loop*************************************************
*****************************************************************/
    var teste_rah = ee.Number(0);
    var contador_loop =0;
    while (contador_loop<8){
    //9.11-coeficiente b
        var Rn_HotP = Rn.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var Rn_HotP_Nu = ee.Number(Rn_HotP);
        
        var G_HotP = G.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('NDVI');
        var G_HotP_Nu = ee.Number(G_HotP);
        
        var rah_HotP = rah.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var rah_HotP_Nu = ee.Number(rah_HotP);
        print ('rah:', rah_HotP_Nu);

        var Ts_HotP = Tsup.reduceRegion(ee.Reducer.first(),hot_pixel,10).get('constant');
        var Ts_HotP_Nu = ee.Number(Ts_HotP);

        var Ts_ColP = Tsup.reduceRegion(ee.Reducer.first(),cold_pixel,10).get('constant');
        var Ts_ColP_Nu = ee.Number(Ts_ColP);

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
//Map.addLayer(H_quente,  H_quenteParams,'H');

Export.image.toDrive({
  image: H_quente,
  description: 'H_'+data,
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
  description: 'L_'+data,
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
Map.addLayer(Fe24h, null, 'Fe24h');

/*11-FIM ***********************************************************
********************************************************************/

/*12- Fluxo de calor latente 24 horas**********************************
***********************************************************************/
var Rn24n = toa.expression(
   'Rs24*(1-albtoa)-123*tsw24', {
   'Rs24': Rs24,
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
  description: 'ETd_'+data,
  scale: 30,
  //region: geometry
});
/*13-FIM ***********************************************************
********************************************************************/ 


/*14- RFA- radiação fotossinteticamente ativa*********************************
**********************************************************************/
var rfa = Rs24.multiply(0.48);

/*14-FIM ***********************************************************
********************************************************************/ 


//15-RFAA - a radiação fotossinteticamente ativa absorvida 

var RFAA = toa.expression(
   'rfa*(-0.161+1.257*ndvi)', {
   'ndvi': ndvi,
   'rfa':rfa
  });
//Map.addLayer(RFAA);
  
  /*15-FIM ***********************************************************
********************************************************************/ 

/*16 e- eficiência do uso de luz  ***********************************
********************************************************************/

var t1 = 0.8+0.02*Topt-(0.0005*Topt*Topt);
print('t1',t1);
var t2 =1/(1+Math.exp(0.2*Topt-10-Tdia))-1/(1+Math.exp(0.3*(Topt-10+Tdia)));
print('t2',t2);
var e = toa.expression(
   '2.15*t1*t2*fe24h', {
   'fe24h': Fe24h,
   't1':t1,
   't2':t2
  });
  
/*16-FIM ***********************************************************
********************************************************************/ 

/*17 GPP ***********************************
********************************************************************/

var GPP = toa.expression(
   'RFAA*e', {
   'e': e,
   'RFAA':RFAA
  });


var GPPParams = {min: 0, max: 10, palette: ['red', 'white', 'green']};
Map.addLayer(GPP, GPPParams, 'GPP');
//Map.addLayer(GPP);

Export.image.toDrive({
  image:GPP,
  description: 'GPP_'+data,
  scale: 30,
  //region: geometry
});