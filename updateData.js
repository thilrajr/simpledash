/**
 * Created by raj on 2017/06/01.
 */

var UpdateData = function() {

    var getRequest;
    var http = require('http');
    var logger = require('./logger.js');
    var dashPathPrefix = './data/dashboards/';
    var dataFile = "/data.json";
    var db = require('./html/public/helpers/db.js');
    var low = require('lowdb');
    var dashData;
    var i, j, k;

    var monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

    this.init = function (currentDashName) {
        try {
            dashData = db.getData(dashPathPrefix + currentDashName);
        }
        catch (err) {
            logger.writeLog("getData", err);
        }
    };

    this.myParser = function (data) {
        if (data.length) {
            return JSON.parse(data);
        }
        else {
            console.log("Error retrieving data...");
        }
        return 0;
    };

    this.bugCount = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                module.exports.init(currentDashName);

                var parsed = module.exports.myParser(body);
                if (typeof parsed.errorMessages !== "undefined") {
                    logger.writeLog(prjWidget, parsed.errorMessages[0] + "-" + url);
                }
                else {
                    if (parsed) {
                        try {
                            if (tempVal >= dashData.totalLoggedDefects.length) {
                                dashData.totalLoggedDefects.push(JSON.parse(JSON.stringify(dashData.totalLoggedDefects[0])));
                            }

                            dashData.totalLoggedDefects[tempVal].stats[0].count = 0;
                            dashData.totalLoggedDefects[tempVal].stats[1].count = 0;
                            dashData.totalLoggedDefects[tempVal].stats[2].count = 0;
                            for (i = 0; i < parsed.total; i++) {
                                if (parsed.issues[i].fields.priority.name === "Minor" || parsed.issues[i].fields.priority.name === "Trivial") {
                                    dashData.totalLoggedDefects[tempVal].stats[0].count++;
                                }

                                else if (parsed.issues[i].fields.priority.name === "Medium") {
                                    dashData.totalLoggedDefects[tempVal].stats[1].count++;
                                }
                                else {
                                    dashData.totalLoggedDefects[tempVal].stats[2].count++;
                                }
                            }

                            low(dashPathPrefix + currentDashName + dataFile).get('totalLoggedDefects')
                                .assign(dashData.totalLoggedDefects)
                                .write();
                        }
                        catch (err) {
                            logger.writeLog(prjWidget, err + "-" + url);
                        }
                    }
                    else {
                        logger.writeLog(prjWidget, "Parsing error -" + url);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });
    };

    this.storyCount = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (typeof parsed.errorMessages !== "undefined") {
                    logger.writeLog(prjWidget, parsed.errorMessages[0] + "-" + url);
                }
                else {
                    if (parsed) {
                        try {
                            dashData.totalStories[tempVal].stats[0].count = 0;
                            dashData.totalStories[tempVal].stats[1].count = 0;
                            dashData.totalStories[tempVal].stats[2].count = 0;
                            for (i = 0; i < parsed.issues.length; i++) {
                                if (parsed.issues[i].fields.status.name === "Closed" || parsed.issues[i].fields.status.name === "Done") {
                                    dashData.totalStories[tempVal].stats[2].count++;
                                }
                                else if (parsed.issues[i].fields.status.name === "To Do") {
                                    dashData.totalStories[tempVal].stats[0].count++;
                                }
                                else {
                                    dashData.totalStories[tempVal].stats[1].count++;
                                }
                            }
                            low(dashPathPrefix + currentDashName + dataFile).get('totalStories')
                                .assign(dashData.totalStories)
                                .write();
                        }
                        catch (err) {
                            logger.writeLog(prjWidget, err + "-" + url);
                        }
                    }
                    else {
                        logger.writeLog(prjWidget, "Parsing error -" + url);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });
    };

    this.bamboo = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });

            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed) {
                    try {
                        var tempBuildStatus = low(dashPathPrefix + currentDashName + dataFile).get('buildStatus[' + tempVal + ']').value();
                        tempBuildStatus.buildName = parsed.results.result[0].plan.key;
                        tempBuildStatus.shortName = parsed.results.result[0].plan.shortName;
                        tempBuildStatus.result = parsed.results.result[0].buildState +
                            ": " + parsed.results.result[0].buildTestSummary;
                        tempBuildStatus.latest_build = "Ran " + parsed.results.result[0].buildRelativeTime +
                            "for " + parsed.results.result[0].buildDurationDescription;
                        tempBuildStatus.status = parsed.results.result[0].buildState;
                        tempBuildStatus.build_link = parsed.results.result[0].link.href.replace("rest/api/latest/result", "browse");
                        tempBuildStatus.result_detail = "Pass " + parsed.results.result[0].successfulTestCount +
                            ", Fail " + parsed.results.result[0].failedTestCount +
                            ", Quarantine " + parsed.results.result[0].quarantinedTestCount +
                            ", Skip " + parsed.results.result[0].skippedTestCount;
                        var date = new Date();
                        tempBuildStatus.lastUpdated = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        tempBuildStatus.buildList = [];
                        var tempLink;
                        for (k = 0; k < parsed.results.result.length && k < 6; k++) {
                            tempLink = parsed.results.result[k].link.href.replace("rest/api/latest/result", "browse");
                            tempBuildStatus.buildList.push({
                                no: parsed.results.result[k].id,
                                time: parsed.results.result[k].buildRelativeTime,
                                status: parsed.results.result[k].state,
                                link: tempLink
                            });
                        }
                        low(dashPathPrefix + currentDashName + dataFile).get('buildStatus[' + tempVal + ']')
                            .assign(tempBuildStatus)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err + "-" + url);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });

    };

    this.bambooDailyStats = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });

            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed) {
                    try {
                        if (tempVal >= dashData.buildDailyStatus.length) {
                            dashData.buildDailyStatus.push(JSON.parse(JSON.stringify(dashData.buildDailyStatus[0])));
                        }
                        dashData.buildDailyStatus[tempVal].buildName = parsed.results.result[0].plan.key;
                        dashData.buildDailyStatus[tempVal].shortName = parsed.results.result[0].plan.shortName;
                        dashData.buildDailyStatus[tempVal].build_link = parsed.results.result[0].link.href.replace("rest/api/latest/result", "browse");
                        var date = new Date();
                        dashData.buildDailyStatus[tempVal].lastUpdated = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        dashData.buildDailyStatus[tempVal].buildList = [];
                        var tempLink;
                        for (var k = 0; k < parsed.results.result.length && dashData.buildDailyStatus[tempVal].buildList.length < 7; k++) {
                            var tempDate = parsed.results.result[k].prettyBuildCompletedTime;
                            tempDate = tempDate.slice(tempDate.indexOf(", ") + 2, tempDate.length);
                            tempDate = tempDate.slice(0, tempDate.indexOf(", "));
                            var tempPass, tempFail;
                            if (parsed.results.result[k].successful) {
                                tempPass = 1;
                                tempFail = 0;
                            }
                            else {
                                tempPass = 0;
                                tempFail = 1;
                            }
                            var tempNotFound = true;
                            for (var l = 0; l < dashData.buildDailyStatus[tempVal].buildList.length; l++) {
                                if (dashData.buildDailyStatus[tempVal].buildList[l].date.indexOf(tempDate) === 0) {
                                    dashData.buildDailyStatus[tempVal].buildList[l].pass += tempPass;
                                    dashData.buildDailyStatus[tempVal].buildList[l].fail += tempFail;
                                    tempNotFound = false;
                                }
                            }
                            if (tempNotFound) {
                                dashData.buildDailyStatus[tempVal].buildList.push({
                                    date: tempDate,
                                    pass: tempPass,
                                    fail: tempFail
                                });
                            }
                        }
                        low(dashPathPrefix + currentDashName + dataFile).get('buildDailyStatus')
                            .assign(dashData.buildDailyStatus)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err + "-" + url);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });

    };

    this.bambooTestDailyStats = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });

            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed) {
                    try {
                        if (tempVal >= dashData.testDailyStatus.length) {
                            dashData.testDailyStatus.push(JSON.parse(JSON.stringify(dashData.testDailyStatus[0])));
                        }
                        dashData.testDailyStatus[tempVal].buildName = parsed.results.result[0].plan.key;
                        dashData.testDailyStatus[tempVal].shortName = parsed.results.result[0].plan.shortName;
                        dashData.testDailyStatus[tempVal].build_link = parsed.results.result[0].link.href.replace("rest/api/latest/result", "browse");
                        var date = new Date();
                        dashData.testDailyStatus[tempVal].lastUpdated = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        dashData.testDailyStatus[tempVal].buildList = [];
                        var tempLink;
                        for (var k = 0; k < parsed.results.result.length && dashData.testDailyStatus[tempVal].buildList.length < 6; k++) {
                            var tempDate = parsed.results.result[k].buildRelativeTime;
                            var tempPass, tempFail;
                            if ((parsed.results.result[k].successfulTestCount +
                                parsed.results.result[k].failedTestCount +
                                parsed.results.result[k].quarantinedTestCount +
                                parsed.results.result[k].skippedTestCount) === 0) {
                                if (parsed.results.result[k].successful) {
                                    tempPass = 1;
                                    tempFail = 0;
                                }
                                else {
                                    tempPass = 0;
                                    tempFail = 1;
                                }
                            }
                            else {
                                tempPass = parsed.results.result[k].successfulTestCount;
                                tempFail = parsed.results.result[k].failedTestCount;
                            }
                            dashData.testDailyStatus[tempVal].buildList.push({
                                date: tempDate,
                                pass: tempPass,
                                fail: tempFail
                                // status: parsed.results.result[k].state,
                                // link: tempLink
                            });
                        }
                        low(dashPathPrefix + currentDashName + dataFile).get('testDailyStatus')
                            .assign(dashData.testDailyStatus)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err + "-" + url);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });

    };

    this.jiraSummary = function (url, tempVal, prjWidget, currentDashName) {
        getRequest = http.get(url, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed) {
                    try {
                        if (typeof dashData.jiraSummary[tempVal] !== "undefined") {
                            dashData.jiraSummary[tempVal].list.splice(0, 100);
                        }
                        else {
                            dashData.jiraSummary.push(JSON.parse(JSON.stringify(dashData.jiraSummary[0])));
                        }
                        for (i = 0; i < parsed.total && i < 50; i++) {
                            var temp_priority = parsed.issues[i].fields.priority ? parsed.issues[i].fields.priority.name : '-';
                            var temp_phase = parsed.issues[i].fields.customfield_12400 ? parsed.issues[i].fields.customfield_12400[0].value : '-';
                            // if (parsed.issues[i].fields.customfield_12400 != null) {
                            dashData.jiraSummary[tempVal].list.push(
                                {
                                    row: [{val: i + 1}, {val: parsed.issues[i].key}, {val: temp_priority},
                                        {val: parsed.issues[i].fields.summary}, {val: temp_phase}]
                                }
                            );
                        }
                        low(dashPathPrefix + currentDashName + dataFile).get('jiraSummary')
                            .assign(dashData.jiraSummary)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err + "-" + url);
                    }
                }

            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err + "-" + url);
        });
    };

    this.commit = function (commitURL, tempCommitPos, prjWidget, currentDashName) {
        getRequest = http.get(commitURL, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed && parsed.values) {
                    try {
                        if ((typeof dashData.commitDetails[tempCommitPos] !== 'undefined') &&
                            (typeof dashData.commitDetails[tempCommitPos].stats !== 'undefined')) {
                            dashData.commitDetails[tempCommitPos].stats.splice(0, dashData.commitDetails.length); //remove all elements
                        }
                        else {
                            dashData.commitDetails[tempCommitPos] = {stats: []};
                        }
                        var tempDate, tempFlag, tempFlag2;
                        for (i = 0; i < parsed.values.length; i++) {
                            tempDate = new Date(parsed.values[i].authorTimestamp);
                            tempFlag = 0;
                            for (j = 0; j < dashData.commitDetails[tempCommitPos].stats.length; j++) {
                                if (dashData.commitDetails[tempCommitPos].stats[j].val.indexOf(tempDate.getDate() + ' ' + monthName[tempDate.getMonth()]) !== -1) {
                                    dashData.commitDetails[tempCommitPos].stats[j].commitCount++;
                                    dashData.commitDetails[tempCommitPos].stats[j].commitNo.push({val: parsed.values[i].displayId});
                                    dashData.commitDetails[tempCommitPos].stats[j].commitAuthor.push({val: parsed.values[i].author.displayName});
                                    dashData.commitDetails[tempCommitPos].stats[j].commitMessage.push({val: parsed.values[i].message});
                                    tempFlag = 1;
                                    tempFlag2 = 0;
                                    for (k = 0; k < dashData.commitDetails[tempCommitPos].stats[j].commitAuthor.length - 1; k++) {
                                        if (dashData.commitDetails[tempCommitPos].stats[j].commitAuthor[k].val === parsed.values[i].author.displayName) {
                                            tempFlag2 = 1;
                                            break;
                                        }
                                    }
                                    if (tempFlag2 === 0) {
                                        dashData.commitDetails[tempCommitPos].stats[j].personCount++;
                                        dashData.commitDetails[tempCommitPos].stats[j].uniqueAuthor.push({val: parsed.values[i].author.displayName});
                                    }
                                }
                            }
                            if (tempFlag === 0 && dashData.commitDetails[tempCommitPos].stats.length < 7) {
                                dashData.commitDetails[tempCommitPos].stats.push(
                                    {
                                        val: tempDate.getDate() + ' ' + monthName[tempDate.getMonth()],
                                        commitCount: 1,
                                        personCount: 1,
                                        commitNo: [{val: parsed.values[i].displayId}],
                                        commitAuthor: [{val: parsed.values[i].author.displayName}],
                                        uniqueAuthor: [{val: parsed.values[i].author.displayName}],
                                        commitMessage: [{val: parsed.values[i].message}]
                                    }
                                );
                            }
                        }

                        low(dashPathPrefix + currentDashName + dataFile).get('commitDetails')
                            .assign(dashData.commitDetails)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err + "-" + commitURL);
                    }
                }
                else {
                    if (parsed.message) {
                        logger.writeLog(prjWidget, parsed.message + "-" + commitURL);
                    }
                    else {
                        logger.writeLog(prjWidget, "Parsing error" + "-" + commitURL);
                    }
                }
            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err);
        });
    };

    this.sonarCube = function (sonarCubeURL, sonarCubeMetrics, prjWidget, currentDashName) {
        for (i = 0; i < sonarCubeMetrics.length; i++) {
            sonarCubeURL += sonarCubeMetrics[i] + ",";
        }

        getRequest = http.get(sonarCubeURL, function (response) {
            var body = "";
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                module.exports.init(currentDashName);
                var parsed = module.exports.myParser(body);
                if (parsed) {
                    try {
                        for (i = 0; i < sonarCubeMetrics.length - 1; i++) {
                            if (parsed[0].msr[i]) {
                                switch (parsed[0].msr[i].key) {
                                    case "blocker_violations":
                                        dashData.codeQuality.staticAnalysis.blocker = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "major_violations":
                                        dashData.codeQuality.staticAnalysis.major = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "critical_violations":
                                        dashData.codeQuality.staticAnalysis.critical = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "violations":
                                        dashData.codeQuality.staticAnalysis.issues = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "test_success_density":
                                        dashData.codeQuality.unitTest.success = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "test_failures":
                                        dashData.codeQuality.unitTest.failure = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "test_errors":
                                        dashData.codeQuality.unitTest.error = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "tests":
                                        dashData.codeQuality.unitTest.test = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "tests_coverage":
                                        dashData.codeQuality.coverage.linesOfCode = parsed[0].msr[i].frmt_val;
                                        break;
                                    case "line_coverage":
                                        dashData.codeQuality.coverage.lineCoverage = parsed[0].msr[i].val;
                                        break;
                                }
                            }
                        }
                        low(dashPathPrefix + currentDashName + dataFile).get('codeQuality')
                            .assign(dashData.codeQuality)
                            .write();
                    }
                    catch (err) {
                        logger.writeLog(prjWidget, err);
                    }
                }

            });
        });
        getRequest.on('error', function (err) {
            logger.writeLog(prjWidget, err);
        });
    };

};

module.exports = new UpdateData();