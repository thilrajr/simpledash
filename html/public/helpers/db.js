    /**
 * Created by raj on 2016/11/05.
 */
var db;
    db = function () {

    var jsonfile = require('jsonfile');
    const path = require('path');
    var jiraFile;
    var confluenceFile;
    var bambooFile;
    var fs = require('fs');
    var fileContent;
    var dashboardPath = './data/dashboards/';

    const low = require('lowdb');
    const fileAsync = require('lowdb/lib/storages/file-async');
    const fileSync = require('lowdb/lib/storages/file-sync');
    // Set some defaults if your JSON file is empty

    this.getData = function(filePath) {
        const dbData= low(filePath+'/data.json', {
                            storage: {
                                read: fileSync.read
                            },
                            format: {
                                serialize: JSON.parse
                            }
                        });
        return dbData.read().value();
    };

    // this.write = function(dashboardName,dashboardField,dashboardData) {
    //     const dbData= low(dashboardPath+dashboardName+'/data.json', {
    //         storage: {
    //             write: fileSync.write
    //         },
    //         format: {
    //             serialize: JSON.parse
    //         }
    //     });
    //
    //     try {
    //         db.get(dashboardField).find({ title: 'low!' })
    //             .assign({ title: 'hi!'})
    //             .write();
    //             .push(dashboardData)
    //             .write();
    //     }
    //
    //     catch(err) {
    //         console.log(err);
    //         return err;
    //     }
    //
    //     return "success";
    // };


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

    this.getDashboardList = function() {
        var tempList,i;
        var tempData = [];
        tempList =  fs.readdirSync(dashboardPath)
                .filter(file => fs.statSync(path.join(dashboardPath, file)).isDirectory())
        for(i=0;i<tempList.length;i++)
            tempData.push(JSON.parse('{"val":"'+tempList[i]+'"}'));
        return tempData;
    }

};

module.exports = new db();
