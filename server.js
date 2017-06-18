var express = require('express');
var app = express();
var handlebars = require('handlebars');
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require('path');
var jsonfile = require('jsonfile');
var http = require('http');
const low = require('lowdb');

var dashboard = require('./html/public/helpers/dashboard.js');
var users = require('./html/public/helpers/users.js');
var db = require('./html/public/helpers/db.js');

var dashboardTilesPath = './data/dashboards/';
var reportTilesPath = './data/dashboards/';
var defaultDataPath = './data/default';
var dashboardTilesFile = '/dashboard.json';
var reportTilesFile = '/report.json';
var dataConfigFile = '/dataConfig.json';
var dataFile = '/data.json';
var dataTemplateFile = './data/templateDataConfig.json';
var currentProject = "default";

var dashData;
var dashboardTiles;
var reportTiles;
var dataConfig;
var dataTemplate;
var template;
var loginData={"errorMessage":""};

var widgets = [ {id:"bugCountTile",name:"Jira Defects Pie Chart"},
                {id:"storyCountTile",name:"Jira Story Pie Chart"},
                {id:"defectSummaryTile",name:"Jira Summary list"},
                {id:"bambooBuildTile",name:"Bitbucket Bamboo Build"},
                {id:"bambooBuildDailyStatsTile",name:"Bamboo Build - Area Chart"},
                {id:"bambooTestDailyStatsTile",name:"Bamboo Build - Bar Chart"},
                {id:"codeQualityTile",name:"Sonar Cube"},
                {id:"commitDetailsTile",name:"Bitbucket Commit Details"},
                {id:"separatorTile",name:"Separator Header"}
                ];

app.use(bodyParser.text()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing appl ication/x-www-form-urlencoded
app.use(express.static(__dirname + '/html/public'));
app.use(express.static(__dirname + '/node_modules'));

handlebars.registerPartial("sidebarTile", fs.readFileSync(__dirname + '/html/public/partials/sidebar.html', 'utf8'));
handlebars.registerPartial("mainTile", fs.readFileSync(__dirname + '/html/public/partials/mainTile.html', 'utf8'));
handlebars.registerPartial("popupTile", fs.readFileSync(__dirname + '/html/public/partials/popupTile.html', 'utf8'));
handlebars.registerPartial("dashboardTile", fs.readFileSync(__dirname + '/html/public/partials/dashboardTile.html', 'utf8'));
handlebars.registerPartial("reportTile", fs.readFileSync(__dirname + '/html/public/partials/reportTile.html', 'utf8'));
handlebars.registerPartial("settingsTile", fs.readFileSync(__dirname + '/html/public/partials/settingsTile.html', 'utf8'));
handlebars.registerPartial("usersTile", fs.readFileSync(__dirname + '/html/public/partials/usersTile.html', 'utf8'));
handlebars.registerPartial("defaultMainTile", fs.readFileSync(__dirname + '/html/public/partials/defaultMainTile.html', 'utf8'));

// Widgets
handlebars.registerPartial("bugCountTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/bugCountTile.html', 'utf8'));
handlebars.registerPartial("bambooBuildTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/bambooBuildTile.html', 'utf8'));
handlebars.registerPartial("bambooBuildDailyStatsTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/bambooBuildDailyStatsTile.html', 'utf8'));
handlebars.registerPartial("bambooTestDailyStatsTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/bambooTestDailyStatsTile.html', 'utf8'));
handlebars.registerPartial("defectSummaryTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/defectSummaryTile.html', 'utf8'));
handlebars.registerPartial("commitDetailsTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/commitDetailsTile.html', 'utf8'));
handlebars.registerPartial("codeQualityTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/codeQualityTile.html', 'utf8'));
handlebars.registerPartial("defaultTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/defaultTile.html', 'utf8'));

handlebars.registerPartial("separatorTile", fs.readFileSync(__dirname + '/html/public/partials/widgets/separatorTile.html', 'utf8'));

// Reading config files
readAllData(currentProject);


//Helpers

handlebars.registerHelper( "helpAverage", function ( v1, v2 ){
    return (parseInt((v1/v2)*100));
});

handlebars.registerHelper("mathAdd", function(value1, value2, value3) {
    value1 = parseFloat(value1);
    value2 = parseFloat(value2);
    value3 = parseFloat(value3);

    return value1 + value2 + value3;
});

handlebars.registerHelper('getWidgetName',function(id){
    for(var i=0;i<widgets.length;i++) {
        if(id.indexOf(widgets[i].id)>=0)
        {
            return widgets[i].name;
        }
    }
    return "unknown";
});

handlebars.registerHelper('ifindexEqTile',function(str1, str2, options){
    var pos = str1.indexOf("_")+1;
    try{
        var newStr = parseInt(str1.substring(pos,str1.length));
        if(newStr===str2)
        {
            return options.fn(this);
        }
        options.inverse(this);
    }
    catch(err)
    {
        console.log(err);
    }
});

handlebars.registerHelper('iferrorMessage',function(str1, options){
    if(str1.length>0)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifuserTypeAdmin',function(str1, options){
    if(str1.indexOf("admin")===0)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifuserTypeUser',function(str1, options){
    if(str1.indexOf("user")===0)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifuserTypeSuperUser',function(str1, options){
    if(str1.indexOf("superUser")>0)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifbambooBuildTile',function(str, options){
    if(str.indexOf("bambooBuildTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifbugCountTile',function(str, options){
    if(str.indexOf("bugCountTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifstoryCountTile',function(str, options){
    if(str.indexOf("storyCountTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('iffeatureCountTile',function(str, options){
    if(str.indexOf("featureCountTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifdefectSummaryTile',function(str, options){
    if(str.indexOf("defectSummaryTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifcommitDetailsTile',function(str, options){
    if(str.indexOf("commitDetailsTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifcodeQualityTile',function(str, options){
    if(str.indexOf("codeQualityTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifbambooBuildDailyStatsTile',function(str, options){
    if(str.indexOf("bambooBuildDailyStatsTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifbambooTestDailyStatsTile',function(str, options){
    if(str.indexOf("bambooTestDailyStatsTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifseparatorTile',function(str, options){
    if(str.indexOf("separatorTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

handlebars.registerHelper('ifdefaultTile',function(str, options){
    if(str.indexOf("defaultTile")!==-1)
    {
        return options.fn(this);
    }
    options.inverse(this);
});

// Server request response
app.get('/', function (req, res) {
    fs.readFile(path.join(__dirname + '/html/login.html'), 'utf-8', function (error, source) {
        if (error) {
            console.log(error);
            res.send("error");
        }

        template = handlebars.compile(source);
        loginData.errorMessage="";
        var resHtml = template(loginData);
        res.send(resHtml);
    });
});

app.post('/home', function (req, res) {

    var userType = validateUser(req);
    if(userType.indexOf("invalid")===0)
    {
        fs.readFile(path.join(__dirname + '/html/login.html'), 'utf-8', function (error, source) {
            if (error) {
                console.log(error);
                res.send("error");
            }

            template = handlebars.compile(source);
            loginData.errorMessage="Invalid user! Please check your username and password.";
            var resHtml = template(loginData);
            res.send(resHtml);
        });
    }
    else if( (userType.indexOf("user")===0) || (userType.indexOf("admin")===0) )
    {
        fs.readFile(path.join(__dirname + '/html/index.html'), 'utf-8', function(error, source){
            if(error){
                console.log(error);
                res.send("error");
            }
            dashData = db.getData(defaultDataPath);
            dashData.dashboardList = dashboard.getDashboardList(req.body.userName,userType);
            template = handlebars.compile(source);
            dashData.dashboardTiles=dashboardTiles;
            dashData.reportTiles=reportTiles;
            dashData.currentProject = currentProject;
            dashData.dataConfig = dataConfig;
            dashData.dataTemplate = dataTemplate;
            dashData.userType = userType;
            var resHtml = template(dashData);
            res.send(resHtml);
        });
    }
    else if(userType.indexOf("error")===0)
    {
        res.send("Invalid request.");
    }
});

app.post('/dashboard', function (req, res) {
    var result={"widget":{},"code":1,"message":"error"};
    console.log(req.body.dashboardName);
    if (!fs.existsSync(dashboardTilesPath+req.body.dashboardName)&&req.body.dashboardName.indexOf("selectDashboard")!==0) {
        result.code = 1;
        result.message = "Dashboard '"+req.body.dashboardName+"'not available";
        res.send(result);
    }
    else {
        fs.readFile(path.join(__dirname + '/html/public/partials/dashboardTile.html'), 'utf-8', function (error, source) {
            if (error) {
                console.log(error);
                result.code = 1;
                result.message = "Error...";
                res.send(result);
            }
            console.log("Dashboard request received : " + req.body.dashboardName);
            currentProject = req.body.dashboardName;
            if (currentProject.indexOf("selectDashboard") === 0) {
                currentProject = "default";
                dashData = db.getData(defaultDataPath);
            }
            else {
                dashData = db.getData(dashboardTilesPath + currentProject);
            }
            readAllData(currentProject);
            dashData.dashboardList = dashboard.getDashboardList("getAllDashboards","admin");
            dashData.dashboardTiles = dashboardTiles;
            dashData.reportTiles = reportTiles;
            dashData.currentProject = currentProject;
            dashData.dataConfig = dataConfig;
            dashData.dataTemplate = dataTemplate;
            if (currentProject.indexOf("default") === 0)
            {
                template = handlebars.compile('{{> defaultMainTile}}');
            }
            else
            {
                template = handlebars.compile('{{> mainTile}}');
            }
            var resHtml = template(dashData);
            res.send(resHtml);
        });
    }
});

app.post('/updateWidget', function (req, res) {
    var result={"widget":{},"code":1,"message":"error"};
    if (fs.existsSync(dashboardTilesPath+req.body.dashboardName)) {
        var widget = low(dashboardTilesPath+req.body.dashboardName+'/dataConfig.json').get("tiles").find({name:req.body.widget.name})
            .assign(req.body.widget)
            .write();
        readDataConfig(currentProject);
        result.widget=widget;
        result.code = 0;
        result.message = "success";
        res.send(result);
    }
    else {
        result.code = 1;
        result.message = "dashboard not exists";
        res.send(result);
    }

});

app.post('/addWidget', function (req, res) {


    var i,idCount=0,resultCount1,resultCount2;
    var result={"code":1,"message":"error"};

    for(i=0;i<dataConfig.tiles.length;i++)
    {
        if(dataConfig.tiles[i].name.indexOf(req.body.widget.name)>=0)
        {
            idCount++;
        }
    }
    req.body.widget.name = req.body.widget.name +"_"+idCount;
    req.body.dashboardWidget.name = req.body.dashboardWidget.name +"_"+idCount;

    low(dashboardTilesPath+req.body.dashboardName+dataConfigFile).get("tiles")
        .push(req.body.widget)
        .write();

    low(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile).get("tiles")
        .push(req.body.dashboardWidget)
        .write();

    resultCount1 = low(dashboardTilesPath+req.body.dashboardName+dataConfigFile).get("tiles")
        .find({name:req.body.widget.name}).size()
        .value();

    resultCount2 = low(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile).get("tiles")
        .find({name:req.body.dashboardWidget.name}).size()
        .value();

    if(resultCount1&&resultCount2)
    {
        result.code = 0;
        result.message = "Successfully added";
        updateData(req.body.dashboardName);
        res.send(result);
    }
    else
    {
        result.code = 1;
        result.message = "Update failed";
        res.send(result);
    }

});

function updateData(projectName)
{
    var options = {
        host: "localhost",
        port: "8093",
        path: "/updateData?projectName="+projectName,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer token"
        }
    };

    console.log("updatedata...");
    var req = http.request(options, function (res) {
        var responseString = "";

        res.on("data", function (data) {
            responseString += data;
            // save all the data from response
        });
        res.on("end", function () {
            console.log(responseString);
            // print to console when response ends
        });
    });
    req.on("error", function (err) {
        console.log(err);
        // print to console when response ends
    });
    req.write("update");
}

app.post('/deleteWidget', function (req, res) 
{
    var i,idCount=0,resultCount1,resultCount2;
    var result={"code":1,"message":"error"};

    low(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile).get("tiles")
        .remove({name:req.body.widget.name})
        .write();

    resultCount1 = low(dashboardTilesPath+req.body.dashboardName+reportTilesFile).get("tiles")
        .find({name:req.body.widget.name}).size()
        .value();

    if(!resultCount1)
    {
        low(dashboardTilesPath+req.body.dashboardName+dataConfigFile).get("tiles")
            .remove({name:req.body.widget.name})
            .write();
    }

    resultCount2 = low(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile).get("tiles")
        .find({name:req.body.widget.name}).size()
        .value();

    if(!resultCount2)
    {
        result.code = 0;
        result.message = "Successfully removed";
        res.send(result);
    }
    else
    {
        result.code = 1;
        result.message = "Delete failed";
        res.send(result);
    }

});

app.post('/sortWidgets', function (req, res) 
{
    var result={"code":1,"message":"error"},i,j;
    var currentTiles = jsonfile.readFileSync(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile);

    if(req.body.tile.length!==currentTiles.tiles.length)
    {
        result.code = 0;
        result.message = "Error - tiles not matching";
        res.send(result);
    }
    else{
        var sortedTiles = {"tiles":[]};
        for(i=0;i<req.body.tile.length;i++)
        {
            for(j=0;j<currentTiles.tiles.length;j++)
            {
                if(req.body.tile[i].name.indexOf(currentTiles.tiles[j].name)===0)
                {
                    sortedTiles.tiles.push({name: req.body.tile[i].name, title: currentTiles.tiles[j].title });
                }
            }

        }

        low(dashboardTilesPath+req.body.dashboardName+dashboardTilesFile).get('tiles')
        .assign(sortedTiles.tiles)
        .write();

        result.code = 0;
        result.message = "Successfully updated";
        res.send(result);
    }
});

app.post('/addProject', function (req, res) 
{
    var result={"widget":{},"code":1,"message":"error"};
    var prjName = req.body.projectName;
    console.log(prjName);
    console.log("Add dashboard request: "+prjName);
    if(dashboard.getDashboardList("getAllDashboards","admin").length>4)
    {
        result.code = 1;
        result.message = "You have reached maximum dashboard limit";
        res.send(result);
    }
    else if (fs.existsSync(dashboardTilesPath+prjName)) {
        result.code = 1;
        result.message = "dashboard already exists";
        res.send(result);
    }
    else {
        fs.mkdirSync(dashboardTilesPath+prjName);
        if (fs.existsSync(dashboardTilesPath+prjName))
        {
            var buff;
            buff = fs.readFileSync(defaultDataPath+dashboardTilesFile);
            fs.writeFileSync(dashboardTilesPath+prjName+dashboardTilesFile,buff);
            buff = fs.readFileSync(defaultDataPath+dataConfigFile);
            fs.writeFileSync(dashboardTilesPath+prjName+dataConfigFile,buff);
            buff = fs.readFileSync(defaultDataPath+reportTilesFile);
            fs.writeFileSync(dashboardTilesPath+prjName+reportTilesFile,buff);
            buff = fs.readFileSync(defaultDataPath+dataFile);
            fs.writeFileSync(dashboardTilesPath+prjName+dataFile,buff);
            result.code = 0;
            result.message = "Project successfully created";
            res.send(result);
        }
        else
        {
            result.code = 1;
            result.message = "Error";
            res.send(result);
        }
    }

});

app.post('/deleteProject', function (req, res) 
{
    var result={"widget":{},"code":1,"message":"error"};
    var prjName = req.body.projectName;
    console.log("Delete project request: "+prjName);

    if (fs.existsSync(dashboardTilesPath+prjName)) {
        if(fs.existsSync(dashboardTilesPath+prjName+dashboardTilesFile))
        {
            fs.unlinkSync(dashboardTilesPath+prjName+dashboardTilesFile);
        }
        if(fs.existsSync(dashboardTilesPath+prjName+dataConfigFile))
        {
            fs.unlinkSync(dashboardTilesPath+prjName+dataConfigFile);
        }
        if(fs.existsSync(dashboardTilesPath+prjName+reportTilesFile))
        {
            fs.unlinkSync(dashboardTilesPath+prjName+reportTilesFile);
        }
        if(fs.existsSync(dashboardTilesPath+prjName+dataFile))
        {
            fs.unlinkSync(dashboardTilesPath+prjName+dataFile);
        }
        fs.rmdirSync(dashboardTilesPath+prjName);
        result.code = 0;
        result.message = "Dashboard successfully removed";
        res.send(result);
    }
    else {
        result.code = 1;
        result.message = "Dashboard '"+prjName+"'not exists";
        res.send(result);
    }
});

app.post('/getUserList', function (req, res) 
{
    var result={"userList":{},"code":1,"message":"error"};
    var list = users.getUserList();
    
    if (list.length===0) {
        result.code = 1;
        result.message = "No users found";
        res.send(result);
    }
    else {
        result.code = 0;
        result.message = "success";
        result.userList = list;
        res.send(result);
    }
});

app.post('/addUser', function (req, res) 
{
    var result = users.addUser(req.body.userName,JSON.stringify(req.body.userDetails));
    res.send(result);
});

app.post('/deleteUser', function (req, res) 
{
    var result={"code":1,"message":"error"};
    var userDetail = users.getUserDetails(req.body.userName);
    if(userDetail.type.indexOf("superUser")>0)
    {
        result.code = 1;
        result.message = "Cannot delete super user";
        res.send(result);
    }

    else{
        res.send(users.deleteUser(req.body.userName));
    }
});

var server_listen = app.listen(8091, function () 
{
    console.log('Server started on port 8091!');
});

exports.closeServer = function(){
  server_listen.close();
};

function readAllData(dashboardName) 
{
    readDashboardTiles(dashboardName);
    readReportTiles(dashboardName);
    readDataConfig(dashboardName);
    readDataTemplate(dashboardName);
}

function readDashboardTiles(dashboardName) 
{
    try{
        if(dashboardName.indexOf("default")===0)
        {
            dashboardTiles=jsonfile.readFileSync(defaultDataPath+dashboardTilesFile);
        }
        else
        {
            dashboardTiles=jsonfile.readFileSync(dashboardTilesPath+dashboardName+dashboardTilesFile);
        }
    }
    catch(err){
        console.log(err);
    }
}

function readReportTiles(dashboardName) 
{
    try{
        if(dashboardName.indexOf("default")===0)
        {
            reportTiles=jsonfile.readFileSync(defaultDataPath+reportTilesFile);
        }
        else
        {
            reportTiles=jsonfile.readFileSync(reportTilesPath+dashboardName+reportTilesFile);
        }
    }
    catch(err){
        console.log(err);
    }
}

function readDataConfig(dashboardName) 
{
    try{
        if(dashboardName.indexOf("default")===0)
        {
            dataConfig=jsonfile.readFileSync(defaultDataPath+dataConfigFile);
        }
        else
        {
            dataConfig=jsonfile.readFileSync(reportTilesPath+dashboardName+dataConfigFile);
        }
    }
    catch(err){
        console.log(err);
    }
}

function readDataTemplate(dashboardName) 
{
    try{
        dataTemplate=jsonfile.readFileSync(dataTemplateFile);
    }
    catch(err){
        console.log(err);
    }
}

function validateUser(req)
{
    var userList = users.getUserListDetail();
    var i;
    if(!req.body.userName)
    {
        return "error";
    }
    else {
        for(i=0;i<userList.length;i++)
        {
            if(req.body.userName.indexOf(userList[i].name)===0 && req.body.password.indexOf(userList[i].password)===0)
            {
                return userList[i].type;
            }
        }
    }
    return "invalid";
}