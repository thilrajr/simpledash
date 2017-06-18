/**
 * Created by raj on 2017/06/01.
 */

var Logger = function()
{
    this.writeLog = function(source,message) {
        var d = new Date();
        var timestamp = "[ " + (d.getDate()) + "/" + (d.getMonth() + 1) +
            "/" + d.getFullYear() + " @ " +
            d.getHours() + ":" +
            d.getMinutes() + ":" + d.getSeconds() + "] - ";
        console.log(timestamp + " : " + source + " : " + message);
    };
};

module.exports = new Logger();