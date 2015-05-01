

function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns 'null', and typeof null === "object", 
        // so we must check for that, too.
        if (o && typeof o === "object" && o !== null) {
            return o;
        }
    }
    catch (e) { }

    return false;
}

function loadURL(url){
    navigator.app.loadUrl(url, { openExternal:true });
    return false;
} 

function arrayContentsEqual(array1, array2) {
    return JSON.stringify(array1) == JSON.stringify(array2);
}

function formatDateString(newRandTime) {
    // var formattedDate = "" + newRandTime.getFullYear() + prependZero(newRandTime.getMonth() + 1) + prependZero(newRandTime.getDate()) 
    //                         + prependZero(newRandTime.getHours()) + prependZero(newRandTime.getMinutes()) + prependZero(newRandTime.getSeconds())
    //                         + prependZero(newRandTime.getMilliseconds());

    var formattedDate = "" + prependZero(newRandTime.getHours()) + prependZero(newRandTime.getMinutes()) + prependZero(newRandTime.getSeconds())
                            + prependZero(newRandTime.getMilliseconds());

    return formattedDate;
}

function friendlyDateString(dateObj) {

    var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    var currMonth = dateObj.getMonth();

    var formattedDate = "" + prependZero(dateObj.getHours()) + ":" + prependZero(dateObj.getMinutes());
    formattedDate += ":" + prependZero(dateObj.getSeconds()) + " " + prependZero(dateObj.getDate());
    formattedDate += " " + months[currMonth] + " " + dateObj.getFullYear();

    return formattedDate;
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100);
    var seconds = parseInt((duration/1000)%60);
    var minutes = parseInt((duration/(1000*60))%60);
    var hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds; // + "." + milliseconds;
}

function prependZero(digit) {
    var prependedString;

    if (digit < 10)
        prependedString = "0" + digit;
    else
        prependedString = "" + digit;

    return prependedString;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomHexFromInt(min, max) {
    return getRandomInt(min, max).toString(16);
}

function getEncodedEmailArrayString(emailArray) {
    var returnString = "[";
    
    for(var i = 0; i < emailArray.length; i++) {
        if (i > 0) returnString += ",";
        returnString += "'" + encodeURI(emailArray[i].value) + "'";
    }

    returnString += "]";
    return returnString;
}