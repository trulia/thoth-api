require('./fieldsMapping')();
require('./environment')();

var http = require('http');
var querystring = require('querystring');

// Thoth configuration
var thoth_hostname = process.env.THOTH_HOST;
var thoth_port = process.env.THOTH_PORT;

// function isServerInJson(server,array){
//   for (var i=0; i<array.length; i++){
//     console.log("isServerInJson: " + array.key + "   " + server)
//     if (array.hostname == server) return i;
//   }
//   return -1;
// }
function pushIfNotPresent(element, array){
  var present = false;
  var arr = array;
  for (var i=0;i<array.length;i++){
    if (array[i]==element) present = true;
  }
  if (!present){
    arr.push(element);
  }
  return arr;
}


function poolJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        json = JSON.parse(data).response;
        var docs = json.docs;
        // console.log(docs);

        var servers = [];
        var info = [];
        var timestamp;
        var value;
        var tot = [];


        for (var i=0; i<docs.length;i++){
          var hostname = docs[i]['hostname_s'];
          pushIfNotPresent(hostname, servers);
        }        

        for (var i=0; i<servers.length; i++){
          var val =  []; 
          for (var j=0; j<docs.length;j++){
             
            if (docs[j]['hostname_s'] == servers[i]){
              var value = docs[j][attribute];
              var timestamp = docs[j]['masterTime_dt'];
              val.push([timestamp, value]);
            }
          }
          tot.push({"key": servers[i], "values": val});
        }
          // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");

        backendResp.json(
          tot 
        );   
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
      backendResp.status(503).send('Thoth index not available' + err);
  }


}

function realtimeJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // // Get only the docs
        json = JSON.parse(data).stats;
        var qtime_stats = json.stats_fields.qtime_i.mean;
        console.log(qtime_stats);

        // var servers = [];
        // var info = [];
        // var timestamp;
        // var value;
        // var tot = [];


        // for (var i=0; i<docs.length;i++){
        //   var hostname = docs[i]['hostname_s'];
        //   pushIfNotPresent(hostname, servers);
        // }        

        // for (var i=0; i<servers.length; i++){
        //   var val =  []; 
        //   for (var j=0; j<docs.length;j++){
             
        //     if (docs[j]['hostname_s'] == servers[i]){
        //       var value = docs[j][attribute];
        //       var timestamp = docs[j]['masterTime_dt'];
        //       val.push([timestamp, value]);
        //     }
        //   }
        //   tot.push({"key": servers[i], "values": val});
        // }
        // 
        // 
        var el = {
  "nqueries": {
    "avg": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 100
    },
    "integral": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": json.stats_fields.qtime_i.count
    }
  },
  "queriesOnDeck": {
    "avg": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 9721
    }
  },
  "exception": {
    "count": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 9721
    },
    "integral": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 6450
    }
  },
  "zeroHits": {
    "count": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 9721
    },
    "integral": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": 9721
    }
  },
  "qtime": {
    "avg": {
      "timestamp": "2014-03-20T01:45:01Z",
      "value": qtime_stats
    }
  }
}

          // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");

        backendResp.json(
          el 
        );   
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
      backendResp.status(503).send('Thoth index not available' + err);
  }


}
function mockPoolJsonResponse(backendResp, resp, attribute, integral){
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  backendResp.header('Access-Control-Allow-Origin', "*");
  // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");
  // TODO: change to application/json ?
 

var elements = [];
elements.push( 
  {
    "key": "search501",
    "values": [ [ 1025409600000 , 0] , [ 1028088000000 , -6.3382185140371] , [ 1030766400000 , -5.9507873460847] , [ 1033358400000 , -11.569146943813] , [ 1036040400000 , -5.4767332317425] , [ 1038632400000 , 0.50794682203014] , [ 1041310800000 , -5.5310285460542] , [ 1043989200000 , -5.7838296963382] , [ 1046408400000 , -7.3249341615649] , [ 1049086800000 , -6.7078630712489] , [ 1051675200000 , 0.44227126150934] , [ 1054353600000 , 7.2481659343222] , [ 1056945600000 , 9.2512381306992] , [ 1059624000000 , 11.341210982529] , [ 1062302400000 , 14.734820409020] , [ 1064894400000 , 12.387148007542] , [ 1067576400000 , 18.436471461827] , [ 1070168400000 , 19.830742266977] , [ 1072846800000 , 22.643205829887] , [ 1075525200000 , 26.743156781239] , [ 1078030800000 , 29.597478802228] , [ 1080709200000 , 30.831697585341] , [ 1083297600000 , 28.054068024708] , [ 1085976000000 , 29.294079423832] , [ 1088568000000 , 30.269264061274] , [ 1091246400000 , 24.934526898906] , [ 1093924800000 , 24.265982759406] , [ 1096516800000 , 27.217794897473] , [ 1099195200000 , 30.802601992077] , [ 1101790800000 , 36.331003758254] , [ 1104469200000 , 43.142498700060] , [ 1107147600000 , 40.558263931958] , [ 1109566800000 , 42.543622385800] , [ 1112245200000 , 41.683584710331] , [ 1114833600000 , 36.375367302328] , [ 1117512000000 , 40.719688980730] , [ 1120104000000 , 43.897963036919] , [ 1122782400000 , 49.797033975368] , [ 1125460800000 , 47.085993935989] , [ 1128052800000 , 46.601972859745] , [ 1130734800000 , 41.567784572762] , [ 1133326800000 , 47.296923737245] , [ 1136005200000 , 47.642969612080] , [ 1138683600000 , 50.781515820954] , [ 1141102800000 , 52.600229204305] , [ 1143781200000 , 55.599684490628] , [ 1146369600000 , 57.920388436633] , [ 1149048000000 , 53.503593218971] , [ 1151640000000 , 53.522973979964] , [ 1154318400000 , 49.846822298548] , [ 1156996800000 , 54.721341614650] , [ 1159588800000 , 58.186236223191] , [ 1162270800000 , 63.908065540997] , [ 1164862800000 , 69.767285129367] , [ 1167541200000 , 72.534013373592] , [ 1170219600000 , 77.991819436573] , [ 1172638800000 , 78.143584404990] , [ 1175313600000 , 83.702398665233] , [ 1177905600000 , 91.140859312418] , [ 1180584000000 , 98.590960607028] , [ 1183176000000 , 96.245634754228] , [ 1185854400000 , 92.326364432615] , [ 1188532800000 , 97.068765332230] , [ 1191124800000 , 105.81025556260] , [ 1193803200000 , 114.38348777791] , [ 1196398800000 , 103.59604949810] , [ 1199077200000 , 101.72488429307] , [ 1201755600000 , 89.840147735028] , [ 1204261200000 , 86.963597532664] , [ 1206936000000 , 84.075505208491] , [ 1209528000000 , 93.170105645831] , [ 1212206400000 , 103.62838083121] , [ 1214798400000 , 87.458241365091] , [ 1217476800000 , 85.808374141319] , [ 1220155200000 , 93.158054469193] , [ 1222747200000 , 65.973252382360] , [ 1225425600000 , 44.580686638224] , [ 1228021200000 , 36.418977140128] , [ 1230699600000 , 38.727678144761] , [ 1233378000000 , 36.692674173387] , [ 1235797200000 , 30.033022809480] , [ 1238472000000 , 36.707532162718] , [ 1241064000000 , 52.191457688389] , [ 1243742400000 , 56.357883979735] , [ 1246334400000 , 57.629002180305] , [ 1249012800000 , 66.650985790166] , [ 1251691200000 , 70.839243432186] , [ 1254283200000 , 78.731998491499] , [ 1256961600000 , 72.375528540349] , [ 1259557200000 , 81.738387881630] , [ 1262235600000 , 87.539792394232] , [ 1264914000000 , 84.320762662273] , [ 1267333200000 , 90.621278391889] , [ 1270008000000 , 102.47144881651] , [ 1272600000000 , 102.79320353429] , [ 1275278400000 , 90.529736050479] , [ 1277870400000 , 76.580859994531] , [ 1280548800000 , 86.548979376972] , [ 1283227200000 , 81.879653334089] , [ 1285819200000 , 101.72550015956] , [ 1288497600000 , 107.97964852260] , [ 1291093200000 , 106.16240630785] , [ 1293771600000 , 114.84268599533] , [ 1296450000000 , 121.60793322282] , [ 1298869200000 , 133.41437346605] , [ 1301544000000 , 125.46646042904] , [ 1304136000000 , 129.76784954301] , [ 1306814400000 , 128.15798861044] , [ 1309406400000 , 121.92388706072] , [ 1312084800000 , 116.70036100870] , [ 1314763200000 , 88.367701837033] , [ 1317355200000 , 59.159665765725] , [ 1320033600000 , 79.793568139753] , [ 1322629200000 , 75.903834028417] , [ 1325307600000 , 72.704218209157] , [ 1327986000000 , 84.936990804097] , [ 1330491600000 , 93.388148670744]]
  }
);
elements.push( 
  {
    "key": "search502",
    "values": [ [ 1025409600000 , 0] , [ 1028088000000 , 0] , [ 1030766400000 , 0] , [ 1033358400000 , 0] , [ 1036040400000 , 0] , [ 1038632400000 , 0] , [ 1041310800000 , 0] , [ 1043989200000 , 0] , [ 1046408400000 , 0] , [ 1049086800000 , 0] , [ 1051675200000 , 0] , [ 1054353600000 , 0] , [ 1056945600000 , 0] , [ 1059624000000 , 0] , [ 1062302400000 , 0] , [ 1064894400000 , 0] , [ 1067576400000 , 0] , [ 1070168400000 , 0] , [ 1072846800000 , 0] , [ 1075525200000 , -0.049184266875945] , [ 1078030800000 , -0.10757569491991] , [ 1080709200000 , -0.075601531307242] , [ 1083297600000 , -0.061245277988149] , [ 1085976000000 , -0.068227316401169] , [ 1088568000000 , -0.11242758058502] , [ 1091246400000 , -0.074848439408270] , [ 1093924800000 , -0.11465623676497] , [ 1096516800000 , -0.24370633342416] , [ 1099195200000 , -0.21523268478893] , [ 1101790800000 , -0.37859370911822] , [ 1104469200000 , -0.41932884345151] , [ 1107147600000 , -0.45393735984802] , [ 1109566800000 , -0.50868179522598] , [ 1112245200000 , -0.48164396881207] , [ 1114833600000 , -0.41605962887194] , [ 1117512000000 , -0.48490348490240] , [ 1120104000000 , -0.55071036101311] , [ 1122782400000 , -0.67489170505394] , [ 1125460800000 , -0.74978070939342] , [ 1128052800000 , -0.86395050745343] , [ 1130734800000 , -0.78524898506764] , [ 1133326800000 , -0.99800440950854] , [ 1136005200000 , -1.1177951153878] , [ 1138683600000 , -1.4119975432964] , [ 1141102800000 , -1.2409959736465] , [ 1143781200000 , -1.3088936375431] , [ 1146369600000 , -1.5495785469683] , [ 1149048000000 , -1.1563414981293] , [ 1151640000000 , -0.87192471725994] , [ 1154318400000 , -0.84073995183442] , [ 1156996800000 , -0.88761892867370] , [ 1159588800000 , -0.81748513917485] , [ 1162270800000 , -1.2874081041274] , [ 1164862800000 , -1.9234702981339] , [ 1167541200000 , -1.8377768147648] , [ 1170219600000 , -2.7107654031830] , [ 1172638800000 , -2.6493268125418] , [ 1175313600000 , -3.0814553134551] , [ 1177905600000 , -3.8509837783574] , [ 1180584000000 , -5.2919167850718] , [ 1183176000000 , -5.2297750650773] , [ 1185854400000 , -3.9335668501451] , [ 1188532800000 , -2.3695525190114] , [ 1191124800000 , -2.3084243151854] , [ 1193803200000 , -3.0753680726738] , [ 1196398800000 , -2.2346609938962] , [ 1199077200000 , -3.0598810361615] , [ 1201755600000 , -1.8410154270386] , [ 1204261200000 , -1.6479442038620] , [ 1206936000000 , -1.9293858622780] , [ 1209528000000 , -3.0769590460943] , [ 1212206400000 , -4.2423933501421] , [ 1214798400000 , -2.6951491617768] , [ 1217476800000 , -2.8981825939957] , [ 1220155200000 , -2.9662727940324] , [ 1222747200000 , 0.21556750497498] , [ 1225425600000 , 2.6784995167088] , [ 1228021200000 , 4.1296711248958] , [ 1230699600000 , 3.7311068218734] , [ 1233378000000 , 4.7695330866954] , [ 1235797200000 , 5.1919133040990] , [ 1238472000000 , 4.1025856045660] , [ 1241064000000 , 2.8498939666225] , [ 1243742400000 , 2.8106017222851] , [ 1246334400000 , 2.8456526669963] , [ 1249012800000 , 0.65563070754298] , [ 1251691200000 , -0.30022343874633] , [ 1254283200000 , -1.1600358228964] , [ 1256961600000 , -0.26674408835052] , [ 1259557200000 , -1.4693389757812] , [ 1262235600000 , -2.7855421590594] , [ 1264914000000 , -1.2668244065703] , [ 1267333200000 , -2.5537804115548] , [ 1270008000000 , -4.9144552474502] , [ 1272600000000 , -6.0484408234831] , [ 1275278400000 , -3.3834349033750] , [ 1277870400000 , -0.46752826932523] , [ 1280548800000 , -1.8030186027963] , [ 1283227200000 , -0.99623230097881] , [ 1285819200000 , -3.3475370235594] , [ 1288497600000 , -3.8187026520342] , [ 1291093200000 , -4.2354146250353] , [ 1293771600000 , -5.6795404292885] , [ 1296450000000 , -6.2928665328172] , [ 1298869200000 , -6.8549277434419] , [ 1301544000000 , -6.9925308360918] , [ 1304136000000 , -8.3216548655839] , [ 1306814400000 , -7.7682867271435] , [ 1309406400000 , -6.9244213301058] , [ 1312084800000 , -5.7407624451404] , [ 1314763200000 , -2.1813149077927] , [ 1317355200000 , 2.9407596325999] , [ 1320033600000 , -1.1130607112134] , [ 1322629200000 , -2.0274822307752] , [ 1325307600000 , -1.8372559072154] , [ 1327986000000 , -4.0732815531148] , [ 1330491600000 , -6.4417038470291]]
  }
);
elements.push( 
  {
    "key": "search504",
    "values": [ [ 1025409600000 , 0] , [ 1028088000000 , -6.3382185140371] , [ 1030766400000 , -5.9507873460847] , [ 1033358400000 , -11.569146943813] , [ 1036040400000 , -5.4767332317425] , [ 1038632400000 , 0.50794682203014] , [ 1041310800000 , -5.5310285460542] , [ 1043989200000 , -5.7838296963382] , [ 1046408400000 , -7.3249341615649] , [ 1049086800000 , -6.7078630712489] , [ 1051675200000 , 0.44227126150934] , [ 1054353600000 , 7.2481659343222] , [ 1056945600000 , 9.2512381306992] , [ 1059624000000 , 11.341210982529] , [ 1062302400000 , 14.734820409020] , [ 1064894400000 , 12.387148007542] , [ 1067576400000 , 18.436471461827] , [ 1070168400000 , 19.830742266977] , [ 1072846800000 , 22.643205829887] , [ 1075525200000 , 26.693972514363] , [ 1078030800000 , 29.489903107308] , [ 1080709200000 , 30.756096054034] , [ 1083297600000 , 27.992822746720] , [ 1085976000000 , 29.225852107431] , [ 1088568000000 , 30.156836480689] , [ 1091246400000 , 24.859678459498] , [ 1093924800000 , 24.151326522641] , [ 1096516800000 , 26.974088564049] , [ 1099195200000 , 30.587369307288] , [ 1101790800000 , 35.952410049136] , [ 1104469200000 , 42.723169856608] , [ 1107147600000 , 40.104326572110] , [ 1109566800000 , 42.034940590574] , [ 1112245200000 , 41.201940741519] , [ 1114833600000 , 35.959307673456] , [ 1117512000000 , 40.234785495828] , [ 1120104000000 , 43.347252675906] , [ 1122782400000 , 49.122142270314] , [ 1125460800000 , 46.336213226596] , [ 1128052800000 , 45.738022352292] , [ 1130734800000 , 40.782535587694] , [ 1133326800000 , 46.298919327736] , [ 1136005200000 , 46.525174496692] , [ 1138683600000 , 49.369518277658] , [ 1141102800000 , 51.359233230659] , [ 1143781200000 , 54.290790853085] , [ 1146369600000 , 56.370809889665] , [ 1149048000000 , 52.347251720842] , [ 1151640000000 , 52.651049262704] , [ 1154318400000 , 49.006082346714] , [ 1156996800000 , 53.833722685976] , [ 1159588800000 , 57.368751084016] , [ 1162270800000 , 62.620657436870] , [ 1164862800000 , 67.843814831233] , [ 1167541200000 , 70.696236558827] , [ 1170219600000 , 75.281054033390] , [ 1172638800000 , 75.494257592448] , [ 1175313600000 , 80.620943351778] , [ 1177905600000 , 87.289875534061] , [ 1180584000000 , 93.299043821956] , [ 1183176000000 , 91.015859689151] , [ 1185854400000 , 88.392797582470] , [ 1188532800000 , 94.699212813219] , [ 1191124800000 , 103.50183124741] , [ 1193803200000 , 111.30811970524] , [ 1196398800000 , 101.36138850420] , [ 1199077200000 , 98.665003256909] , [ 1201755600000 , 87.999132307989] , [ 1204261200000 , 85.315653328802] , [ 1206936000000 , 82.146119346213] , [ 1209528000000 , 90.093146599737] , [ 1212206400000 , 99.385987481068] , [ 1214798400000 , 84.763092203314] , [ 1217476800000 , 82.910191547323] , [ 1220155200000 , 90.191781675161] , [ 1222747200000 , 66.188819887335] , [ 1225425600000 , 47.259186154933] , [ 1228021200000 , 40.548648265024] , [ 1230699600000 , 42.458784966634] , [ 1233378000000 , 41.462207260082] , [ 1235797200000 , 35.224936113579] , [ 1238472000000 , 40.810117767284] , [ 1241064000000 , 55.041351655012] , [ 1243742400000 , 59.168485702020] , [ 1246334400000 , 60.474654847301] , [ 1249012800000 , 67.306616497709] , [ 1251691200000 , 70.539019993440] , [ 1254283200000 , 77.571962668603] , [ 1256961600000 , 72.108784451998] , [ 1259557200000 , 80.269048905849] , [ 1262235600000 , 84.754250235173] , [ 1264914000000 , 83.053938255703] , [ 1267333200000 , 88.067497980334] , [ 1270008000000 , 97.556993569060] , [ 1272600000000 , 96.744762710807] , [ 1275278400000 , 87.146301147104] , [ 1277870400000 , 76.113331725206] , [ 1280548800000 , 84.745960774176] , [ 1283227200000 , 80.883421033110] , [ 1285819200000 , 98.377963136001] , [ 1288497600000 , 104.16094587057] , [ 1291093200000 , 101.92699168281] , [ 1293771600000 , 109.16314556604] , [ 1296450000000 , 115.31506669000] , [ 1298869200000 , 126.55944572261] , [ 1301544000000 , 118.47392959295] , [ 1304136000000 , 121.44619467743] , [ 1306814400000 , 120.38970188330] , [ 1309406400000 , 114.99946573061] , [ 1312084800000 , 110.95959856356] , [ 1314763200000 , 86.186386929240] , [ 1317355200000 , 62.100425398325] , [ 1320033600000 , 78.680507428540] , [ 1322629200000 , 73.876351797642] , [ 1325307600000 , 70.866962301942] , [ 1327986000000 , 80.863709250982] , [ 1330491600000 , 86.946444823715]]
  }
);

backendResp.type('application/text');
backendResp.json(
  elements
);   

}

function listJsonResponse(backendResp, resp, attribute){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        json = JSON.parse(data).facet_counts;
        var facet_fields = json.facet_fields[attribute];
        var list = [];
        for (var i=0;i<facet_fields.length;i++){
          if (i%2 === 0) list.push(facet_fields[i]);
        }
          // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");

        backendResp.json(
          {"numFound" : list.length, "list"  : list }
        );   
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
      backendResp.status(503).send('Thoth index not available' + err);
  }






}


function prepareJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        json = JSON.parse(data).response;
        var docs = json.docs;
        var numFound = json.numFound;
        var numberOfAttributes = attribute.length;

        if (numberOfAttributes == 1) {
          if (attribute.indexOf(',') == -1) {
            blob = addValueIfNull(docs, attribute, 0 );
          }
          else {
            blob = docs;
          }
          if (integral) {
            var c = 0;
            for (var i=0;i<blob.length;i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              c += blob[i][attribute];
              blob[i].value = c;
              delete blob[i][attribute];
            }

          } else {
            for (var i=0;i<blob.length;i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              blob[i].value = blob[i][attribute];
              delete blob[i][attribute];
            }
          }

        } 
        else  if (numberOfAttributes == 2) {
          if (attribute[0].indexOf(',') == -1) blob = addValueIfNull(docs, attribute[0], 0 ) ;
          else blob = docs;
          for (var i=0;i<blob.length;i++){
            blob[i].timestamp = blob[i]['masterTime_dt'];
            delete blob[i]['masterTime_dt'];
            blob[i].value = blob[i][attribute[0]];
            delete blob[i][attribute[0]];
            blob[i].tot = blob[i][attribute[1]];
            delete blob[i][attribute[1]];
          }
        }
        else if (numberOfAttributes == 4){
         blob = docs;
          for (var i=0;i<blob.length;i++){
            blob[i].timestamp = blob[i]['masterTime_dt'];
            delete blob[i]['masterTime_dt'];
            blob[i].between_0_10 = blob[i][attribute[0]];
            delete blob[i][attribute[0]];
            blob[i].between_10_100 = blob[i][attribute[1]];
            delete blob[i][attribute[1]];
            blob[i].between_100_1000 = blob[i][attribute[2]];
            delete blob[i][attribute[2]];
            blob[i].over_1000 = blob[i][attribute[3]];
            delete blob[i][attribute[3]];
          } 
        }

        // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");
        // TODO: change to application/json ?
        backendResp.type('application/text');
        backendResp.json(
          {"numFound" : numFound, "values"  : blob }
        );   
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
      backendResp.status(503).send('Thoth index not available' + err);
  }
}


function prepareListInfoJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // // Get only the docs
        json = JSON.parse(data).response;
        var docs = json.docs;
        var numFound = json.numFound;
         blob = docs;
          for (var i=0;i<blob.length;i++){
            blob[i].timestamp = blob[i]['date_dt'];
            delete blob[i]['date_dt'];
            delete blob[i]['timestamp_dt'];
            blob[i].qtime = blob[i]['qtime_i'];
            delete blob[i]['qtime_i'];
            blob[i].query = blob[i]['params_s'];
            delete blob[i]['params_s'];
          } 

        // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");
        // TODO: change to application/json ?
        backendResp.type('application/text');
        backendResp.json(
          {"numFound" : numFound, "values"  : blob }
        );   
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
      backendResp.status(503).send('Thoth index not available' + err);
  }
}


function createSolrServerRequest(req, filter){
	var server = req.params.server;
	var core = req.params.core;
	var port = req.params.port;
	var start = req.params.start;
	var end = req.params.end;
	var solrQueryInformation = {
	  "q": 'masterDocumentMin_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
	  "rows": 10000,
	  "sort": 'masterTime_dt asc'
	};
    solrQueryInformation.fl =  filter +',masterTime_dt' ;
    console.log(solrQueryInformation);
    return solrQueryInformation;
}

function createListInfoServerRequest(req, filter){
  var server = req.params.server;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var page = req.params.page;
  var attribute = req.params.attribute;

  var listType;
  var sortParam;
  if (attribute == 'slowqueries'){
    listType = 'slowQueryDocument_b';
    sortParam = 'qtime_i desc';
  } else{
    listType = 'exception_b';
    sortParam = 'date_dt desc';
  }

  var solrQueryInformation = {
    "q": listType + ':true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND date_dt:[' + start +' TO ' + end +'] ',
    "rows": 12,
    "sort": sortParam,
    "start" : page*12
  };
    solrQueryInformation.fl =  filter +',date_dt' ;
    console.log(solrQueryInformation);
    return solrQueryInformation;
}

function createSolrRealtimeRequest(req, filter){
  var server = req.params.server;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var solrQueryInformation = {
    "q": 'hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port,
    "rows": 0,
    // "sort": 'masterTime_dt asc',
    "stats": true,
    "stats.field": "qtime_i"
  };
    solrQueryInformation.fl =  filter +',masterTime_dt' ;
    return solrQueryInformation;
}


function createListRequest(req, filter){
  // var server = req.params.server;
  // var core = req.params.core;
  // var port = req.params.port;
  // var start = req.params.start;
  // var end = req.params.end;
  var solrQueryInformation = {
    "q": '*:*',
    "rows": 0,
    "facet": true,
    "facet.field": filter,
    "facet.limit": 1000
  };
    // solrQueryInformation.fl =  filter +',masterTime_dt' ;
    return solrQueryInformation;
}


function createSolrPoolRequest(req, filter){
  var pool = req.params.pool;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var solrQueryInformation = {
    "q": 'masterDocumentMin_b:true AND pool_s:' + pool + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
    "rows": 10000,
    "sort": 'masterTime_dt asc'
  };
  solrQueryInformation.fl =  filter +',masterTime_dt,hostname_s' ;
  console.log(solrQueryInformation);
  return solrQueryInformation;
}




/**
 * Creates a zero value for a json property
 * @param  json a json array
 * @param  propertyToCheck property that must have a defined value
 * @param  valueToAdd value that will be added if propertyToCheck does not have a value
 */
function addValueIfNull(json, propertyToCheck, valueToAdd){
  for (var i=0;i<json.length;i++){
    if (!json[i].hasOwnProperty(propertyToCheck)){
      json[i][propertyToCheck] = valueToAdd;
    }
  }
  return json;
}

function prepareHttpRequest(solrOptions){
	var requestOptions = {}

	requestOptions.host = thoth_hostname;
	requestOptions.port = thoth_port;
	requestOptions.path = '/solr/shrank/select?';

	var solrQueryOptions = {};
	solrQueryOptions.wt = 'json';
	solrQueryOptions.omitHeader = true

	for (var key in solrOptions) {
	if (solrOptions.hasOwnProperty(key)) {
	  var value = solrOptions[key];
	  if (value != null ){
	    solrQueryOptions[key] = value ;
	  }
	}
	}
	requestOptions.path += querystring.stringify(solrQueryOptions);
	return requestOptions;
}


function prepareRealtimeHttpRequest(solrOptions){
  var requestOptions = {}

  requestOptions.host = thoth_hostname;
  requestOptions.port = thoth_port;
  requestOptions.path = '/solr/collection1/select?';

  var solrQueryOptions = {};
  solrQueryOptions.wt = 'json';
  solrQueryOptions.omitHeader = true

  for (var key in solrOptions) {
  if (solrOptions.hasOwnProperty(key)) {
    var value = solrOptions[key];
    if (value != null ){
      solrQueryOptions[key] = value ;
    }
  }
  }
  requestOptions.path += querystring.stringify(solrQueryOptions);
  console.log(requestOptions);
  return requestOptions;
}

module.exports = {
	dispatch: function(req, res, entity){
	  if (entity === 'server'){
	    module.exports.dispatchServer(req, res);
	  }
    if (entity === 'pool'){
      module.exports.dispatchPool(req, res);
    }
    if (entity === 'list'){
      module.exports.dispatchList(req, res);
    }
    if (entity === 'realtime'){
      module.exports.dispatchRealtime(req, res);
    }    
	},

  dispatchList: function (req, res) {
    var attribute = req.params.attribute;
    var filter ="";

    if (attribute==="servers") filter = "hostname_s";
    if (attribute==="pools") filter = "pool_s";
    if (attribute==="cores") filter = "coreName_s";
    if (attribute==="ports") filter = "port_i";

    http.get(prepareHttpRequest(createListRequest(req, filter)), function (resp){
      listJsonResponse(res, resp, filter);
    }).on("error", function(e){
        console.log(e);
      });
  },
  dispatchRealtime: function (req, res) {
    var attribute = req.params.attribute;
    var filter ="";

    // if (attribute==="servers") filter = "hostname_s";
    // if (attribute==="pools") filter = "pool_s";
    // if (attribute==="cores") filter = "coreName_s";
    // if (attribute==="ports") filter = "port_i";

    http.get(prepareRealtimeHttpRequest(createSolrRealtimeRequest(req, filter)), function (resp){
      realtimeJsonResponse(res, resp, filter);
    }).on("error", function(e){
        console.log(e);
      });
  },
  dispatchPool: function (req, res) {

    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter,jsonFieldWithValue;
    var integral = false;

    if (information == 'avg'){
      filter = thothFieldsMappings.avg[attribute];
      jsonFieldWithValue = [thothFieldsMappings.avg[attribute]];
    }

    
    if (information == 'count'){
      filter = thothFieldsMappings.count[attribute] + ',tot-count_i';
      jsonFieldWithValue = [thothFieldsMappings.count[attribute],'tot-count_i'];
    }

    if (information == 'integral'){
      filter = thothFieldsMappings.integral[attribute];
      jsonFieldWithValue = [thothFieldsMappings.integral[attribute]];
      integral = true;
    }

    http.get(prepareHttpRequest(createSolrPoolRequest(req, filter)), function (resp) {
      poolJsonResponse(res, resp, jsonFieldWithValue, integral);
    }).on("error", function(e){
        console.log(e);
      });

  },

	dispatchServer: function(req,res){
		var information = req.params.information;
		var attribute = req.params.attribute;
		var filter,jsonFieldWithValue;
		var integral = false;

    if (information == 'list'){
      filter = thothFieldsMappings.slowqueries;
      http.get(prepareHttpRequest(createListInfoServerRequest(req, filter, req.params.page)), function (resp) {
        prepareListInfoJsonResponse(res, resp, jsonFieldWithValue, integral);
      }).on("error", function(e){
        console.log(e);
      });   

    } else {

      if (information == 'avg'){
        filter = thothFieldsMappings.avg[attribute];
        jsonFieldWithValue = [thothFieldsMappings.avg[attribute]];
      }

      if (information == 'count'){
        filter = thothFieldsMappings.count[attribute] + ',tot-count_i';
        jsonFieldWithValue = [thothFieldsMappings.count[attribute],'tot-count_i'];
      }

      if (information == 'integral'){
        filter = thothFieldsMappings.integral[attribute];
        jsonFieldWithValue = [thothFieldsMappings.integral[attribute]];
        integral = true;
      }

      if (information == 'distribution'){
        filter = thothFieldsMappings.distribution[attribute];
        jsonFieldWithValue = thothFieldsMappings.distribution[attribute].split(',');
      }

    http.get(prepareHttpRequest(createSolrServerRequest(req, filter)), function (resp) {
      prepareJsonResponse(res, resp, jsonFieldWithValue, integral);
    }).on("error", function(e){
      console.log(e);
    });   

    }
  }

};

