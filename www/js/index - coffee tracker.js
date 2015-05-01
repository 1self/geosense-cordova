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

        registerOnClickCallback();

        doBeaconMagic();

        drawChart();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        console.log('Received Event: ' + id);
    }
};

app.initialize();


// {
//  "dateTime": "2015-03-19T13:26:55.000+00:00",
//  "objectTags": ["ibeacon", "proximity"],
//  "actionTags": ["enter"],
//  "properties": {
//    "geofence": "ibeacon://geofence/1/1"
//  }
// }
// 
// 3f670706-8e2e-4f33-b7b2-23ea3122df8b
// 
// https://api-staging.1self.co/v1/streams/HGQHKWYKBDEAGAQR/events/ibeacon,proximity/enter/count/daily/barchart
// 


function logToDom(message) {
    var now = new Date();
    document.getElementById('debugText').innerHTML += '[<i>' + now.toString() + '</i>]<br />';
    document.getElementById('debugText').innerHTML += message;
    document.getElementById('debugText').innerHTML += '<br />';
}

// $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,temperature/sample/mean(celsius)/daily/barchart");

window.addEventListener("message", receiveMessage, false);

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


function doBeaconMagic() {

    var delegate = new cordova.plugins.locationManager.Delegate();

    delegate.didDetermineStateForRegion = function (pluginResult) {
        // var now = new Date();

        logToDom('didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
        console.log("Did determine state");
        console.log(pluginResult);

        if (pluginResult.state && pluginResult.region && pluginResult.region.uuid && pluginResult.region.uuid.length > 0) {

            if (pluginResult.state === "CLRegionStateInside") {
                enterBeaconRange(pluginResult.region.uuid, 111, 222);

            } else if (pluginResult.state === "CLRegionStateOutside") {
                exitBeaconRange(pluginResult.region.uuid, 111, 222);
            }
        } else {
            console.log('No region information');
        }

        // cordova.plugins.locationManager.appendToDeviceLog('[' + now.toString() + '] didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
    };

    delegate.didStartMonitoringForRegion = function (pluginResult) {
        
        console.log('didStartMonitoringForRegion:', pluginResult);

        logToDom('didStartMonitoringForRegion:' + JSON.stringify(pluginResult));
    };

    delegate.didRangeBeaconsInRegion = function (pluginResult) {
        addLocalNotification(pluginResult);
        logToDom('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
    };


    cordova.plugins.locationManager.setDelegate(delegate);

    // required in iOS 8+
    cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
    // or cordova.plugins.locationManager.requestAlwaysAuthorization()

    for (i = 0; i < UUIDS.length; i++) {

        var identifier = UUIDS[i].regionName;
        var uuid = UUIDS[i].uuid;
        // var minor = 14191;
        // var major = 50994;
        // 
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid); //, major, minor);
        cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
            .fail(console.error)
            .done();
    }
    // cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
    //     .fail(console.error)
    //     .done();       
}

// function addLocalNotification(pluginResult) {
//     var now = new Date();
//     window.plugin.notification.local.schedule({
//         id:         11111,
//         title:      'Range change',
//         text:       JSON.stringify(pluginResult),
//         led:        '#ffff00' 
//     });

//         // json:       JSON.stringify({ "imageUrl": smileJSON.imageUrl, "smileInnerMessage" : smileJSON.smileInnerMessage }),
//         // smallIcon:  'ic_launcher',
//         // icon:       'ic_launcher',
// }

function enterBeaconRange(uuid, major, minor) {
    logToDom('enter beacon range ' + uuid);

    var now = new Date();
    var dateStr = now.toISOString();

    if (uuid.toLowerCase() === "3f670706-8e2e-4f33-b7b2-23ea3122df8b") {
        // Coffee counter beacon
        enteredCoffeeRange(now, uuid);
    } else {

        $('#divEnter1').show();
        $('#divEnterTime1').text(dateStr);

        writeProximityEvent(dateStr, 'enter', uuid, major, minor);
    }
}

function exitBeaconRange(uuid, major, minor) {
    logToDom('exit beacon range ' + uuid);
    

    if (uuid.toLowerCase() === "3f670706-8e2e-4f33-b7b2-23ea3122df8b") {
        exitedCoffeeRange(uuid);
    } else {
        var dateStr = new Date().toISOString();

        $('#divExit').show();
        $('#divExitTime').text(dateStr);
        
        writeProximityEvent(dateStr, 'exit', uuid, major, minor);
    }
}

function getStream() {

    var response;
    var stream = localStorage.stream;

    if (stream) {
        logToDom('Got stream: ' + stream);
        response = JSON.parse(stream);
        if (response.streamid && response.streamid.length > 0) {
            return response;
        }
    }

    console.log('Creating new stream');

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", API_URL + "/streams", false);
    xmlhttp.setRequestHeader("Authorization", APP_ID + ":" + APP_SECRET);
    xmlhttp.send();

    response = JSON.parse(xmlhttp.response);
    localStorage.stream = xmlhttp.response;
    console.log('Created new stream: ' + xmlhttp.response);
    // localStorage.streamid = response.streamid;
    // localStorage.readtoken = response.readToken;
    // localStorage.writetoken = response.writeToken;

    return response;
}

function writeProximityEvent(dateStr, action, uuid, major, minor) {

    var properties = { "geofence": "ibeacon://" + uuid }; // + "/" + major + "/" + minor"}

    writeEventTo1self(dateStr, ["ibeacon", "proximity"], [action], properties);
}

function writeEventTo1self(dateStr, objTagArray, actionTagArray, propertiesObj) {

    var stream = getStream();

    logToDom('streamid: ' + stream.streamid);
    logToDom('writeToken: ' + stream.writeToken);

    var proximityEvent = {
            "dateTime": dateStr,
            "objectTags": objTagArray,
            "actionTags": actionTagArray,
            "properties": propertiesObj
        };

    logToDom('proximityEvent: ' + JSON.stringify(proximityEvent));

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", API_URL + "/streams/" + stream.streamid + "/events", false);
    xmlhttp.setRequestHeader("Authorization", stream.writeToken);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(proximityEvent));

    logToDom('did send event');

    console.log("logged to 1self");
    console.log(proximityEvent);
    console.log(stream);

    var response = xmlhttp.response;
}

function enteredCoffeeRange(enterDate, uuid) {

    var dateStr = enterDate.toISOString();

    localStorage.prevEnteredCoffeeRange = localStorage.enteredCoffeeRange;
    localStorage.enteredCoffeeRange = enterDate.getTime();
    localStorage.enteredCoffeeUuid = uuid;

    console.log('enteredrange');

    setTimeout(function() { doCoffeeWork(); }, proximityDurationSec * 1000);

}

function exitedCoffeeRange(uuid) {
    console.log('exited');
    localStorage.enteredCoffeeUuid = "";
    var now = new Date();
    localStorage.exitedCoffeeRange = now.getTime();
}

function doCoffeeWork() {
    var prevEnteredCoffeeRange = localStorage.prevEnteredCoffeeRange;
    var enteredCoffeeRange = localStorage.enteredCoffeeRange;
    var exitedCoffeeRange = localStorage.exitedCoffeeRange;
    var enteredCoffeeUuid = localStorage.enteredCoffeeUuid;

    console.log("exited: " + exitedCoffeeRange);
    console.log("entered: " + enteredCoffeeRange);
    console.log("previous: " + prevEnteredCoffeeRange);

    if (typeof exitedCoffeeRange === "undefined" || exitedCoffeeRange == "undefined") exitedCoffeeRange = 0;
    if (typeof prevEnteredCoffeeRange === "undefined" || prevEnteredCoffeeRange == "undefined") prevEnteredCoffeeRange = 0;

    if (enteredCoffeeRange) {
        if (exitedCoffeeRange - enteredCoffeeRange > proximityDurationSec * 1000 || exitedCoffeeRange - enteredCoffeeRange < 0) {
            if (enteredCoffeeRange - prevEnteredCoffeeRange > 60000 * minProximityWaitMin) {

                console.log(exitedCoffeeRange - enteredCoffeeRange);
                console.log(enteredCoffeeRange - prevEnteredCoffeeRange);
                console.log('coffee!!');

                cordova.plugins.notification.local.schedule({
                    id: 1,
                    text: 'Are you getting a drink?',
                    icon: 'http://www.optimizeordie.de/wp-content/plugins/social-media-widget/images/default/64/googleplus.png',
                    sound: null,
                    led: "0000FF",
                    data: { "hadDrinkTime": enteredCoffeeRange, "enteredCoffeeUuid": enteredCoffeeUuid }
                });

                addPendingDrink(enteredCoffeeRange, enteredCoffeeUuid);
            } else {

                console.log('too soon since last entry');
                console.log(exitedCoffeeRange - enteredCoffeeRange);
                console.log(enteredCoffeeRange - prevEnteredCoffeeRange);
            }

        } else {
            console.log('too short');
            console.log(exitedCoffeeRange - enteredCoffeeRange);
            console.log(enteredCoffeeRange - prevEnteredCoffeeRange);
        }
    }
}

function addPendingDrink(drinkTime, enteredCoffeeUuid) {
    var pendingDrinksJSON = tryParseJSON(localStorage.pendingDrinks);

    if (!pendingDrinksJSON || !pendingDrinksJSON.drinks) {
        pendingDrinksJSON = {"drinks": []};
    }

    pendingDrinksJSON.drinks.push({"drinkTime": drinkTime, "enteredCoffeeUuid": enteredCoffeeUuid});

    localStorage.pendingDrinks = JSON.stringify(pendingDrinksJSON);
}

function removePendingDrink(drinkTime) {
    var pendingDrinksJSON = tryParseJSON(localStorage.pendingDrinks);

    if (pendingDrinksJSON) {
        console.log(pendingDrinksJSON);

        for (var i = 0; i < pendingDrinksJSON.drinks.length; i++) {
            if (parseInt(pendingDrinksJSON.drinks[i].drinkTime) === parseInt(drinkTime)) {
                pendingDrinksJSON.drinks.splice(i, 1);
                localStorage.pendingDrinks = JSON.stringify(pendingDrinksJSON);
                console.log(pendingDrinksJSON);
                break;
            }
        }
    }
}

function registerOnClickCallback() {

    cordova.plugins.notification.local.on('click', function (notification) {
        console.log('onclick', arguments);
        console.log(notification);

        drinkWorkflowNext();
    });
}

function drinkWorkflowNext() {

    var pendingDrinksJSON = JSON.parse(localStorage.pendingDrinks);
    var dateStr;

    if (pendingDrinksJSON.drinks.length > 0) {
        $('#divData').hide();
        $('#divDrinkSelect1').show();
        $('#divDrinkSelect2').hide();
        $('#divDrinkSelect3').hide();

        if (pendingDrinksJSON.drinks.length === 1) {
            dateStr = pendingDrinksJSON.drinks[0].drinkTime;
            $('#divDrinkDetectedTime').text("Drink detected at: " + dateStr);
        } else {
            dateStr = pendingDrinksJSON.drinks[0].drinkTime;
            var drinkString = "You have " + pendingDrinksJSON.drinks.length + " unconfirmed drinks. <br />";
            // drinkString += "Confirming drink 1 of " + pendingDrinksJSON.drinks.length + ".<br/>";
            drinkString += "Drink detected at: " + dateStr;
            $('#divDrinkDetectedTime').text(drinkString);
        }
        return true;
    } else {
        return false;
    }
}

function hadDrink(drink) {

    var pendingDrinksJSON = JSON.parse(localStorage.pendingDrinks);
    var hadDrinkTime = parseInt(pendingDrinksJSON.drinks[0].drinkTime);
    var enteredCoffeeUuid = pendingDrinksJSON.drinks[0].enteredCoffeeUuid;
    var geofence = "ibeacon://" + enteredCoffeeUuid;

    if (hadDrinkTime) {
        var hadDrinkDate = new Date();
        hadDrinkDate.setTime(hadDrinkTime);

        var dateStr = hadDrinkDate.toISOString();

        var drinkEvent = {
            "dateTime": dateStr,
            "actionTags": ["drink"],
            "properties": {"geofence": geofence}
        };

        if (drink === 'coffee' || drink === 'tea') {
                drinkEvent.objTags = [drink, "hot"];
                drinkEvent.properties.cup = 1;
                pendingDrinksJSON.drinks[0].drinkEvent = drinkEvent;
                localStorage.pendingDrinks = JSON.stringify(pendingDrinksJSON);
                $('#divDrinkSelect1').hide();
                $('#divDrinkSelect2').show();
        } else if (drink === 'water' || drink === 'squash') {
                drinkEvent.objectTags = [drink, "cold"];
                drinkEvent.properties.glass = 1;
                writeEventTo1self(dateStr, drinkEvent.objectTags, drinkEvent.actionTags, drinkEvent.properties);
                removePendingDrink(hadDrinkTime);
                if (!drinkWorkflowNext()) {
                    $('#divDrinkSelect1').hide();
                    drawChartWithParams(drink, "drink", "count");
                }
        } else if (drink === 'herbal tea') {
                drinkEvent.objectTags = ["herbal-tea", "decaffeinated", "hot"];
                drinkEvent.properties.cup = 1;
                writeEventTo1self(dateStr, drinkEvent.objectTags, drinkEvent.actionTags, drinkEvent.properties);
                removePendingDrink(hadDrinkTime);
                if (!drinkWorkflowNext()) {
                    $('#divDrinkSelect1').hide();
                    drawChartWithParams("herbal-tea", "drink", "count");
                }
        } else if (drink === 'other') {
                $('#divDrinkSelect1').hide();
                $('#divDrinkSelect3').show();
        } else if (drink === 'none') {
                $('#divData').show();
                $('#divDrinkSelect1').hide();
        }
    }

}

function hadDrink2(caffeine) {
    var pendingDrinksJSON = JSON.parse(localStorage.pendingDrinks);
    var drinkEvent = pendingDrinksJSON.drinks[0].drinkEvent;
    drinkEvent.objTags.push(caffeine);
    writeEventTo1self(drinkEvent.dateTime, drinkEvent.objTags, drinkEvent.actionTags, drinkEvent.properties);
    removePendingDrink(pendingDrinksJSON.drinks[0].drinkTime);
    if (!drinkWorkflowNext()) {
        $('#divDrinkSelect2').hide();
        drawChartWithParams(drinkEvent.objTags.toString(), "drink", "count");
    }
}

function drawChart() {
    var streamId = getStream().streamid;
    $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,humidity/sample/mean(humidity-percent)/daily/barchart");
    $('#divData').show();
}

function drawChartWithParams(objTags, actionTags, aggregation) {
    var streamId = getStream().streamid;
    $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/" + objTags + "/" + actionTags + "/" + aggregation + "/daily/barchart");
    $('#divData').show();
}

function changeChart(chartType) {
    var streamId = getStream().streamid;

    switch (chartType) {
        case 'humidity':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,humidity/sample/mean(humidity-percent)/daily/barchart");
            break;
        case 'temperature':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,temperature/sample/mean(celsius)/daily/barchart");
            break;
        case 'vis':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,visible-light/sample/mean(lux)/daily/barchart");
            break;
        case 'IR':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,infrared/sample/mean(lux)/daily/barchart");
            break;
        case 'UV':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ambient,ultraviolet/sample/mean(ultraviolet-index)/daily/barchart");
            break;
        case 'enter':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ibeacon,proximity/enter/count/daily/barchart");
            break;
        case 'exit':
            $('#dataIframe').attr('src', APP_URL + "/streams/" + streamId + "/events/ibeacon,proximity/exit/count/daily/barchart");
            break;
    }
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