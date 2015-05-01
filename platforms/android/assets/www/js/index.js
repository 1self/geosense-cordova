/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        document.addEventListener("backbutton", backButtonHandler, false);

        registerBeaconMonitoring();

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        console.log('Received Event: ' + id);
    }
};

app.initialize();


function backButtonHandler(e) {
    if ($('#headerSelectDailyAvg').is(':visible') || $('#headerSelectTodayData').is(':visible')) {
        viewHome();
    } else if ($('#headerChart').is(':visible')) {
        viewTodayData();
    } else if ($('#headerMain').is(':visible')) {
        navigator.app.exitApp();
    }
}


function logToDom(message) {
    var now = new Date();
    document.getElementById('debugText').innerHTML += '[<i>' + now.toString() + '</i>]<br />';
    document.getElementById('debugText').innerHTML += message;
    document.getElementById('debugText').innerHTML += '<br />';
}

function receiveMessage(event) {
    console.log(event.data);
    console.log(window.location.href);
    if(event.data.loginUrl !== undefined){
        var loginUrl = event.data.loginUrl + '?redirectUrl=' +  window.location.href;
        loginUrl = loginUrl + '&intent=' + event.data.intent;
        console.log(loginUrl);
        window.location.href = loginUrl;
    }
}

function drawChartWithParams(objTags, actionTags, aggregation) {
    var streamId = getStream().streamid;
    var qs = "?bgColor=84c341&readToken=" + stream.readToken;
    var uri = APP_URL + "/streams/" + streamId + "/events/" + objTags + "/" + actionTags + "/" + aggregation + "/daily/barchart" + qs;
    loadURL(uri);
}

function changeChart(divObj, chartType) {
    var stream = getStream();
    var streamId = stream.streamid;
    var qs = "?bgColor=84c341&readToken=" + stream.readToken;

    var uri;

    switch (chartType) {
        case 'humidity':
            uri = APP_URL + "/streams/" + streamId + "/events/ambient,humidity/sample/mean(humidity-percent)/daily/barchart" + qs;
            break;
        case 'temperature':
            uri = APP_URL + "/streams/" + streamId + "/events/ambient,temperature/sample/mean(celsius)/daily/barchart" + qs;
            break;
        case 'vis':
            uri = APP_URL + "/streams/" + streamId + "/events/ambient,visible-light/sample/mean(lux)/daily/barchart" + qs;
            break;
        case 'IR':
            uri = APP_URL + "/streams/" + streamId + "/events/ambient,infrared/sample/mean(lux)/daily/barchart" + qs;
            break;
        case 'UV':
            uri = APP_URL + "/streams/" + streamId + "/events/ambient,ultraviolet/sample/mean(ultraviolet-index)/daily/barchart" + qs;
            break;
        case 'enter':
            uri = APP_URL + "/streams/" + streamId + "/events/ibeacon,proximity/enter/count/daily/barchart" + qs;
            break;
        case 'exit':
            uri = APP_URL + "/streams/" + streamId + "/events/ibeacon,proximity/exit/count/daily/barchart" + qs;
            break;
    }

    $(divObj).attr('class','chart-select-selected'); 

    setTimeout(function() {
        loadURL(uri);
        $(divObj).attr('class','chart-select'); 
    }, 150);
}

function drawAndShowChart(divObj, chartType) {

    var objTagArray;
    var actionTagArray = ['sample'];
    var propertyName;
    var startDate = new Date();
    var endDate = new Date();

    startDate.setHours(0,0,0,0);
    endDate.setTime(startDate.getTime() + (24 * 60 * 60 * 1000));


    switch (chartType) {
        case 'humidity':
            objTagArray = ['ambient', 'humidity'];
            propertyName = 'humidity-percent';
            break;
        case 'temperature':
            objTagArray = ['ambient', 'temperature'];
            propertyName = 'celsius';
            break;
        case 'vis':
            objTagArray = ['ambient', 'visible-light'];
            propertyName = 'lux';
            break;
        case 'IR':
            objTagArray = ['ambient', 'infrared'];
            propertyName = 'lux';
            break;
        case 'UV':
            objTagArray = ['ambient', 'ultraviolet'];
            propertyName = 'ultraviolet-index';
            break;
    }

    $(divObj).attr('class','chart-select-selected'); 

    setTimeout(function() {
        hideAllElements();
        $('#divChart').show();
        $('#headerChart').show();
        drawChart($('#divChart').width(), objTagArray, actionTagArray, propertyName, startDate, endDate);
        $(divObj).attr('class','chart-select'); 
    }, 150);

}

function hideAllElements() {
    // hide homepage elements
    $('#divViewDailyAvg').hide();
    $('#divViewTodayData').hide();
    $('#headerMain').hide();
    $('#divEnterExit').hide();

    // hide TodayData elements
    $('#divTodayDataList').hide();
    $('#headerSelectTodayData').hide();

    // hide chart elements
    $('#divChart').hide();
    $('#headerChart').hide();
    
    // hide DailyAvg elements
    $('#divDailyAvgList').hide();
    $('#headerSelectDailyAvg').hide();   
}

function viewDailyAvg() {

    hideAllElements();
    
    // show DailyAvg elements
    $('#divDailyAvgList').show();
    $('#headerSelectDailyAvg').show();
}

function viewTodayData() {

    hideAllElements();
    
    // show DailyAvg elements
    $('#divTodayDataList').show();
    $('#headerSelectTodayData').show();
}

function viewHome() {
    hideAllElements();

    // show Home elements
    $('#divViewDailyAvg').show();
    $('#divViewTodayData').show();
    $('#headerMain').show();
    $('#divEnterExit').show();
}



// function startScan()
//     {
//         // The delegate object holds the iBeacon callback functions
//         // specified below.
//         var delegate = new locationManager.Delegate();

//         // Called continuously when ranging beacons.
//         delegate.didRangeBeaconsInRegion = function(pluginResult)
//         {
//             //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
//             for (var i in pluginResult.beacons)
//             {
//                 // Insert beacon into table of found beacons.
//                 var beacon = pluginResult.beacons[i];
//                 beacon.timeStamp = Date.now();
//                 var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
//                 beacons[key] = beacon;
//             }
//         };

//         // Called when starting to monitor a region.
//         // (Not used in this example, included as a reference.)
//         delegate.didStartMonitoringForRegion = function(pluginResult)
//         {
//             //console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
//         };

//         // Called when monitoring and the state of a region changes.
//         // (Not used in this example, included as a reference.)
//         delegate.didDetermineStateForRegion = function(pluginResult)
//         {
//             //console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
//         };

//         // Set the delegate object to use.
//         locationManager.setDelegate(delegate);

//         // Request permission from user to access location info.
//         // This is needed on iOS 8.
//         locationManager.requestAlwaysAuthorization();

//         // Start monitoring and ranging beacons.
//         for (var i in regions)
//         {
//             var beaconRegion = new locationManager.BeaconRegion(
//                 i + 1,
//                 regions[i].uuid);

//             // Start ranging.
//             locationManager.startRangingBeaconsInRegion(beaconRegion)
//                 .fail(console.error)
//                 .done();

//             // Start monitoring.
//             // (Not used in this example, included as a reference.)
//             locationManager.startMonitoringForRegion(beaconRegion)
//                 .fail(console.error)
//                 .done();
//         }
//     }