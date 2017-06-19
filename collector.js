
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
const low = require('lowdb');

var db = require('./html/public/helpers/db.js');
var dashboard = require('./html/public/helpers/dashboard.js');
var updateData = require('./updateData.js');
var logger = require('./logger.js');

var dashData;
var dashPathPrefix = './data/dashboards/';
var dataConfigFile = '/dataConfig.json';
var dataFile = "/data.json";

var sonarCubePostfix = "/api/resources?";
var sonarCubeMetrics = ["blocker_violations","major_violations","critical_violations","violations","test_success_density","test_failures","test_errors","tests","tests_coverage","line_coverage","ncloc"];

app.use(bodyParser.text()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing appl ication/x-www-form-urlencoded
app.use(express.static(__dirname + '/html/public'));
app.use(express.static(__dirname + '/node_modules'));

app.listen(8093, function () {
    logger.writeLog('ServerStart','Server started on port 8093!');
});

app.post('/updateData', function (req, res) {
    getData(req.query.projectName);
    res.send("success");
});

/*realtime data start*/

updateDatabase();
setInterval(updateDatabase , 30*60000);

function updateDatabase()
{
    var dashboardList = dashboard.getDashboardList("admin","admin");
    for (var dCount = 0; dCount < dashboardList.length; dCount++) {
        getData(dashboardList[dCount].val);
    }
}
function getData(currentDashName) {
    var noOfTiles, dashboardTiles;

    logger.writeLog("getData","Updating data for "+currentDashName);
    try {
        dashboardTiles = jsonfile.readFileSync(dashPathPrefix + currentDashName + dataConfigFile);
        dashData = db.getData(dashPathPrefix+currentDashName);
    }
    catch (err) {
        logger.writeLog("getData",err);
    }
    var url,tempVal,prjWidget;
    for (noOfTiles = 0; noOfTiles < dashboardTiles.tiles.length; noOfTiles++) {
        tempVal = (dashboardTiles.tiles[noOfTiles].name.slice(dashboardTiles.tiles[noOfTiles].name.indexOf("_")+1, dashboardTiles.tiles[noOfTiles].name.length));
        prjWidget = currentDashName+"-"+(dashboardTiles.tiles[noOfTiles].name.slice(0, dashboardTiles.tiles[noOfTiles].name.indexOf("_")))+"-"+tempVal;
        switch (dashboardTiles.tiles[noOfTiles].name.slice(0, dashboardTiles.tiles[noOfTiles].name.indexOf("_"))) {
            case "bugCountTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val;
                updateData.bugCount(url,tempVal,prjWidget,currentDashName);
            break;

            case "storyCountTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val;
                updateData.storyCount(url,tempVal,prjWidget,currentDashName);
            break;

            case "bambooBuildTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val +
                    dashboardTiles.tiles[noOfTiles].param[2].val;
                updateData.bamboo(url,tempVal,prjWidget,currentDashName);
            break;

            case "bambooBuildDailyStatsTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val +
                    dashboardTiles.tiles[noOfTiles].param[2].val;
                updateData.bambooDailyStats(url,tempVal,prjWidget,currentDashName);
            break;

            case "bambooTestDailyStatsTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val +
                    dashboardTiles.tiles[noOfTiles].param[2].val;
                updateData.bambooTestDailyStats(url,tempVal,prjWidget,currentDashName);
            break;

            case "defectSummaryTile" :
                url = dashboardTiles.tiles[noOfTiles].param[0].val +
                    dashboardTiles.tiles[noOfTiles].param[1].val;
                updateData.jiraSummary(url,tempVal,prjWidget,currentDashName);
            break;

            case "commitDetailsTile" :
                var commitURL = dashboardTiles.tiles[noOfTiles].param[0].val;
                var tempCommitPos = (dashboardTiles.tiles[noOfTiles].name.slice(dashboardTiles.tiles[noOfTiles].name.indexOf("_")+1, dashboardTiles.tiles[noOfTiles].name.length));
                updateData.commit(commitURL,tempCommitPos,prjWidget,currentDashName);
            break;

            case "codeQualityTile" :
                var sonarCubeURL = dashboardTiles.tiles[noOfTiles].param[0].val + sonarCubePostfix + "resource=" +
                    dashboardTiles.tiles[noOfTiles].param[1].val + "&format=json&" +
                    "&metrics=";
                updateData.sonarCube(sonarCubeURL,sonarCubeMetrics,prjWidget,currentDashName);
                break;
        }
    }

}
/*realtime data end*/

// -------------------------------------------- Pull data End

