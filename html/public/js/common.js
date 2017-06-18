/**
 * Created by raj on 2017/05/11.
 */

var toggle_sidebar_visible = true;
window.onload = function()
{
    document.getElementById("id_selectDashboard").selectedIndex = 0;
};
var currentView="Dashboard";
var currrentSettingsTab="project";

function loadDashboard() {
    var e = document.getElementById("id_selectDashboard");
    var strUser = e.options[e.selectedIndex].value;
    var data = {};
    data.dashboardName = strUser;
    showSpinner("Please wait...",0);

    $('#id_dashboardTileContent').load("/dashboard",data,function(responseTxt, statusTxt, xhr)
    {
        if(statusTxt == "success")
        {
            closeSpinner();
            displayTile(currentView);
            changeTab(currrentSettingsTab);
            if(document.getElementById("id_toggleWidgetSort")) document.getElementById("id_toggleWidgetSort").checked = false;
            if(document.getElementById("id_widgetSortButton")) document.getElementById("id_widgetSortButton").style.visibility = "hidden";
        }
        else
        {
            closeSpinner();
            showMessage("Error","Error retrieving data from server.");
            if(document.getElementById("id_toggleWidgetSort")) document.getElementById("id_toggleWidgetSort").checked = false;
        }
    });
}

function displayTile(view)
{
    var e = document.getElementById("id_selectDashboard");
    var strUser = e.options[e.selectedIndex].value;
    currentView=view;
    if(document.getElementById("sidebar_menu_Dashboard")) document.getElementById("sidebar_menu_Dashboard").className='sidebar-menu';
    if(document.getElementById("sidebar_menu_Settings")) document.getElementById("sidebar_menu_Settings").className='sidebar-menu';
    if(document.getElementById("sidebar_menu_Users")) document.getElementById("sidebar_menu_Users").className='sidebar-menu';
    if(document.getElementById("sidebar_menu_"+view)) document.getElementById("sidebar_menu_"+view).className='sidebar-menu-selected';
    document.getElementById("id_main_header_title").innerHTML = currentView+" - ";
    if(strUser.indexOf("selectDashboard")==0)
        document.getElementById("id_main_header_project").innerHTML = "Select";
    else
        document.getElementById("id_main_header_project").innerHTML = strUser;
    if(view=="Dashboard")
    {
        if(document.getElementById("id_dashboardTile")) document.getElementById("id_dashboardTile").style.display='block';
        if(document.getElementById("id_settingsTile")) document.getElementById("id_settingsTile").style.display='none';
        if(document.getElementById("id_usersTile")) document.getElementById("id_usersTile").style.display='none';
        if(document.getElementById("id_sidebarToggleButton")) document.getElementById("id_sidebarToggleButton").style.display='block';
        // loadDashboard();
    }
    else if(view=="Settings")
    {
        if(document.getElementById("id_dashboardTile")) document.getElementById("id_dashboardTile").style.display='none';
        if(document.getElementById("id_settingsTile")) document.getElementById("id_settingsTile").style.display='block';
        if(document.getElementById("id_usersTile")) document.getElementById("id_usersTile").style.display='none';
        if(document.getElementById("id_sidebarToggleButton")) document.getElementById("id_sidebarToggleButton").style.display='none';
    }
    else if(view=="Users")
    {
        if(document.getElementById("id_dashboardTile")) document.getElementById("id_dashboardTile").style.display='none';
        if(document.getElementById("id_settingsTile")) document.getElementById("id_settingsTile").style.display='none';
        if(document.getElementById("id_usersTile")) document.getElementById("id_usersTile").style.display='block';
        if(document.getElementById("id_sidebarToggleButton")) document.getElementById("id_sidebarToggleButton").style.display='none';
        loadUserList();
    }

}

///// toggle Fullscreen

function toggleFullScreen()
{
    if(fullScreenApi.isFullScreen())
    {
        fullScreenApi.cancelFullScreen(document.documentElement);
        document.getElementById("id_fullScreenIcon").innerHTML="<i class='fa fa-expand' aria-hidden='true'></i>";
    }
    else
    {
        fullScreenApi.requestFullScreen(document.documentElement);
        document.getElementById("id_fullScreenIcon").innerHTML="<i class='fa fa-compress' aria-hidden='true'></i>";
    }
}

(function() {
    var
        fullScreenApi = {
            supportsFullScreen: false,
            nonNativeSupportsFullScreen: false,
            isFullScreen: function() { return false; },
            requestFullScreen: function() {},
            cancelFullScreen: function() {},
            fullScreenEventName: '',
            prefix: ''
        },
        browserPrefixes = 'webkit moz o ms khtml'.split(' ');

    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreenApi.supportsFullScreen = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
            fullScreenApi.prefix = browserPrefixes[i];

            if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
                fullScreenApi.supportsFullScreen = true;

                break;
            }
        }
    }

    // update methods to do something useful
    if (fullScreenApi.supportsFullScreen) {
        fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';

        fullScreenApi.isFullScreen = function() {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        }
        fullScreenApi.requestFullScreen = function(el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
        }
        fullScreenApi.cancelFullScreen = function(el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        }
    }
    else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        fullScreenApi.nonNativeSupportsFullScreen = true;
        fullScreenApi.requestFullScreen = fullScreenApi.requestFullScreen = function (el) {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
        fullScreenApi.isFullScreen = function() {
            return document.body.clientHeight == screen.height && document.body.clientWidth == screen.width;
        }
    }

    // jQuery plugin
    if (typeof jQuery != 'undefined') {
        jQuery.fn.requestFullScreen = function() {

            return this.each(function() {
                if (fullScreenApi.supportsFullScreen) {
                    fullScreenApi.requestFullScreen(this);
                }
            });
        };
    }

    // export api
    window.fullScreenApi = fullScreenApi;
})();