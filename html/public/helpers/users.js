    /**
 * Created by raj on 2016/11/05.
 */
var Users;
    Users = function () {

    var jsonfile = require('jsonfile');
    const path = require('path');
    var fs = require('fs');
    var usersPath = './data/users';
    var userFile;

    this.getUserList = function() {
        var tempList,i;
        var tempData = [];
        tempList =  fs.readdirSync(usersPath)
                .filter(file => fs.statSync(path.join(usersPath, file)).isFile())
        for(i=0;i<tempList.length;i++)
        {
            userDetail = jsonfile.readFileSync(usersPath+'/'+tempList[i]);
            tempData.push(JSON.parse('{"name":"'+tempList[i].split(".",1)+'","type":"'+userDetail.type+'"}'));
        }
        return tempData;
    }

    this.getUserListDetail = function() {
        var tempList,i;
        var tempData = [];
        tempList =  fs.readdirSync(usersPath)
                .filter(file => fs.statSync(path.join(usersPath, file)).isFile())
        for(i=0;i<tempList.length;i++)
        {
            userDetail = jsonfile.readFileSync(usersPath+'/'+tempList[i]);
            tempData.push(JSON.parse('{"name":"'+tempList[i].split(".",1)+'","type":"'+userDetail.type+'","password":"'+userDetail.password+'"}'));
        }
        return tempData;
    }

    this.getUserDetails = function(userName) {
        userFile = usersPath+'/'+userName+'.json';
        var userDetail;
        try{
            userDetail = jsonfile.readFileSync(userFile);
        }
        catch(err){
            console.log(err);
            return err;
        }
    return userDetail;
    }

    this.addUser = function(userName,userDetails) {
        var result={"code":1,"message":"error"};
    if (fs.existsSync(usersPath+'/'+userName+'.json')) {
        result.code = 1;
        result.message = "user already exists";
        return result;
    }
    else {
            // fs.mkdirSync(usersPath);
            if (fs.existsSync(usersPath))
            {
                fs.writeFileSync(usersPath+'/'+userName+'.json',userDetails);
            }
            result.code = 0;
            result.message = "success";
            return result;
        }
    }

    this.deleteUser = function(userName) {
        var result={"code":1,"message":"error"};
        if(fs.existsSync(usersPath+'/'+userName+'.json'))
        {
            fs.unlinkSync(usersPath+'/'+userName+'.json');
            result.code = 0;
            result.message = "success";
            return result;
        }
        else{
            result.code = 1;
            result.message = "User not exists";
            return result;
        }
    }

};

module.exports = new Users();
