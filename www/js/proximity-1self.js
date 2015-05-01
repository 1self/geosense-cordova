var softExitIntervalSec = 10;
var logSoftExits = false;

function registerBeaconMonitoring() {

    var delegate = new cordova.plugins.locationManager.Delegate();

    delegate.didDetermineStateForRegion = function (pluginResult) {
        console.log("Did determine state");
        console.log(pluginResult);

        if (pluginResult.state && pluginResult.region && pluginResult.region.uuid && pluginResult.region.uuid.length > 0) {

            if (pluginResult.state === "CLRegionStateInside") {
                enterBeaconRange(pluginResult.region.identifier, pluginResult.region.uuid, 111, 222);

            } else if (pluginResult.state === "CLRegionStateOutside") {
                exitBeaconRange(pluginResult.region.identifier, pluginResult.region.uuid, 111, 222);
            }
        } else {
            console.log('No region information');
        }
    };

    delegate.didStartMonitoringForRegion = function (pluginResult) {
        console.log('didStartMonitoringForRegion:', pluginResult);
    };

    delegate.didRangeBeaconsInRegion = function (pluginResult) {
        console.log('didRangeBeaconsInRegion:', pluginResult);
    };


    cordova.plugins.locationManager.setDelegate(delegate);

    // required in iOS 8+
    cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
    // or cordova.plugins.locationManager.requestAlwaysAuthorization()

    for (i = 0; i < UUIDS.length; i++) {

        var identifier = UUIDS[i].regionName;
        var uuid = UUIDS[i].uuid;

        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid); //, major, minor);
        cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
            .fail(console.error)
            .done();
    }
    // cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
    //     .fail(console.error)
    //     .done();       
}



function enterBeaconRange(regionName, uuid, major, minor) {

    var now = new Date();
    var dateStr = now.toISOString();
    var friendlyDateStr = friendlyDateString(now);

    var regionKey = uuid + "/" + major + "/" + minor;
    var lastEntered = 0;
    var lastExited = 0;
    var enteredExitedRegions = tryParseJSON(localStorage.enteredExitedRegions);
    var enterType = "";

    console.log("enteredExitedRegions", enteredExitedRegions);

    if (enteredExitedRegions) {
        var i;
        var thisRegionInfo;
        for (i = 0; i < enteredExitedRegions.length; i++) {
            if (enteredExitedRegions[i].regionKey === regionKey) {
                thisRegionInfo = enteredExitedRegions[i];
                break;
            }
        }

        if (thisRegionInfo) {
            lastEntered = thisRegionInfo.enteredDate;
            lastExited = thisRegionInfo.exitedDate;
            enteredExitedRegions[i].enteredDate = now.getTime();
        } else {
            enteredExitedRegions.push({ "regionKey" : regionKey, "enteredDate" : now.getTime() });
        }
    } else {
        enteredExitedRegions = [{ "regionKey" : regionKey, "enteredDate" : now.getTime() }];
    }

    localStorage.enteredExitedRegions = JSON.stringify(enteredExitedRegions);

    console.log("now.getTime() - lastEntered", now.getTime() - lastEntered);

    if (now.getTime() - lastEntered < softExitIntervalSec * 1000) {
        // soft enter
        enterType = "soft";
    } else {
        // hard enter
        enterType = "hard";
        $('#divEnter1').show();
        $('#divEnterTime1').text(friendlyDateStr);

    }

    console.log(enterType);

    writeProximityEvent(dateStr, regionName, 'enter', enterType, uuid, major, minor);
}

function exitBeaconRange(regionName, uuid, major, minor) {
    var now = new Date();
    var dateStr = now.toISOString();

    setTimeout(function() { doExitWork(now, regionName, uuid, major, minor); }, softExitIntervalSec * 1000);

}

function doExitWork(timeOfExit, regionName, uuid, major, minor) {

    var dateStr = timeOfExit.toISOString();
    var friendlyDateStr = friendlyDateString(timeOfExit);

    var regionKey = uuid + "/" + major + "/" + minor;
    var lastEntered = 0;
    var lastExited = 0;
    var enteredExitedRegions = tryParseJSON(localStorage.enteredExitedRegions);
    var exitType = "";

    console.log("enteredExitedRegions", enteredExitedRegions);

    if (enteredExitedRegions) {
        var i;
        var thisRegionInfo;
        for (i = 0; i < enteredExitedRegions.length; i++) {
            if (enteredExitedRegions[i].regionKey === regionKey) {
                thisRegionInfo = enteredExitedRegions[i];
                break;
            }
        }

        if (thisRegionInfo) {
            lastEntered = thisRegionInfo.enteredDate;
            lastExited = thisRegionInfo.exitedDate;
            enteredExitedRegions[i].exitedDate = timeOfExit.getTime();
        } else {
            enteredExitedRegions.push({ "regionKey" : regionKey, "exitedDate" : timeOfExit.getTime() });
        }
    } else {
        enteredExitedRegions = [{ "regionKey" : regionKey, "exitedDate" : timeOfExit.getTime() }];
    }

    localStorage.enteredExitedRegions = JSON.stringify(enteredExitedRegions);

    console.log("lastEntered - timeOfExit.getTime()", lastEntered - timeOfExit.getTime());

    // if I entered again within softExitIntervalSec seconds then soft exit else hard exit
    if (lastEntered > timeOfExit.getTime()) {
        // soft exit
        exitType = "soft";
    } else {
        // hard exit
        exitType = "hard";
        $('#divExit').show();
        $('#divExitTime').text(friendlyDateStr);
    }

    console.log(exitType);
    
    writeProximityEvent(dateStr, regionName, 'exit', exitType, uuid, major, minor);
}

function writeProximityEvent(dateStr, regionName, action, enterExitType, uuid, major, minor) {

    var properties = { "geofence": "ibeacon://" + uuid, "type": enterExitType, "region-name": regionName }; // + "/" + major + "/" + minor"}

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

    return response;
}

function getToken(objTagArray, actionTagArray, propertyName) {

    var response;
    var tokens = tryParseJSON(localStorage.tokens);

    if (tokens) {
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (arrayContentsEqual(token.scope.objectTags, objTagArray) && arrayContentsEqual(token.scope.actionTags, actionTagArray)) {
                response = token;
                console.log('got token', token);
                return response;
            }
        }
    } else {
        tokens = [];
    }

    console.log('Creating new token');

    var postProperties = '{';
    postProperties += '"objectTags":' + JSON.stringify(objTagArray) + ',';
    postProperties += '"actionTags":' + JSON.stringify(actionTagArray) + ',';
    postProperties += '"' + propertyName + '":true';
    postProperties += '}';


    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", API_URL + "/apps/" + APP_ID + "/token", false);
    xmlhttp.setRequestHeader("Authorization", "Basic " + APP_ID + ":" + APP_SECRET);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(postProperties);

    response = JSON.parse(xmlhttp.response);
    tokens.push(response);
    localStorage.tokens = JSON.stringify(tokens);
    console.log('Created new token: ' + response);

    return response;
}

function getChartData(objTagArray, actionTagArray, propertyName, startDate, endDate, successCallback, errorCallback) {

    var token = getToken(objTagArray, actionTagArray, propertyName);

    var url = API_URL + "/apps/" + APP_ID + "/events/";
    url += objTagArray.toString() + "/";
    url += actionTagArray.toString() + "/.json?";
    url += "token=" + token.token;

    console.log('data url', url);


    $.getJSON(url,
        function() {
          console.log( "accessed api for data" );
        })
        .done(function(data) {
            data = filterData(data, startDate, endDate);
            successCallback(data);
        })
        .fail(function(data) {
            errorCallback(data);
        });
}

function filterData(data, startDate, endDate) {
    var newData = [];
    for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
        var dataDate = new Date(dataItem.dateTime);
        if (dataDate > startDate && dataDate < endDate) {
            newData.push(dataItem);
        }
    }
    return newData;
}