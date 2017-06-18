    /**
 * Created by raj on 2016/11/05.
 */
var Dashboard;
    Dashboard = function () {

    var jsonfile = require('jsonfile');
    const path = require('path');
    var jiraFile;
    var confluenceFile;
    var bambooFile;
    var fs = require('fs');
    var fileContent;
    var dashboardPath = './data/dashboards';
    var users = require('./users.js');

    this.getDashboardConfig = function(dashboardName) {
        return './data/dashboards/'+dashboardName+'/config.json';
    };

    this.updateConfig = function (dashboardName,data) {
        jiraFile = './data/dashboards/'+dashboardName+'/config.json';
        try{
            jsonfile.writeFileSync(jiraFile, data);
        }
        catch(err){
            console.log(err);
            return err;
        }
    return "success";
    };

    this.getDashboardList = function(userName,userType) {
        var tempList,i;
        var tempData = [],userData = [];
        tempList =  fs.readdirSync(dashboardPath)
                .filter(file => fs.statSync(path.join(dashboardPath, file)).isDirectory())
        for(i=0;i<tempList.length;i++)
            tempData.push(JSON.parse('{"val":"'+tempList[i]+'"}'));
        if(userType.indexOf("admin")===0)
            return tempData;
        else{
            var userList = users.getUserDetails(userName);
            for(i=0;i<userList.dashboards.length;i++)
            {
                for(j=0;j<tempData.length;j++)
                {
                    if(userList.dashboards[i].name.indexOf(tempData[j].val)===0)
                        userData.push(JSON.parse('{"val":"'+tempData[j].val+'"}'));
                }
            }
            return userData;
        }
    }

};

module.exports = new Dashboard();
