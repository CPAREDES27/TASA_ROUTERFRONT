'use strict';

const oauthClient = require('client-oauth2');
const request = require('request-promise');
var cors = require('cors')
const express = require('express');
const app = express();

//CORS Configuration
var allowlist = ['https://workspaces-ws-2x82d-app1.us10.applicationstudio.cloud.sap', 'https://workspaces-ws-8m9sh-app1.us10.applicationstudio.cloud.sap'];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

//CLIENT CREDENTIALS
const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
const XSUAA_URL = VCAP_SERVICES.xsuaa[0].credentials.url; 
const XSUAA_CLIENTID = VCAP_SERVICES.xsuaa[0].credentials.clientid; 
const XSUAA_CLIENTSECRET = VCAP_SERVICES.xsuaa[0].credentials.clientsecret;
const XSUAA_ZONEID = VCAP_SERVICES.xsuaa[0].credentials.identityzone;

//SERVICIOS
var HOST = 'https://flotabackend.cfapps.us10.hana.ondemand.com';
if (XSUAA_ZONEID == "tasaqas") {
    HOST = 'https://flotabackendqas.cfapps.us10.hana.ondemand.com';
}

//const HOST = 'https://flotabackendqas.cfapps.us10.hana.ondemand.com';

const _getAccessToken = function() {
    return new Promise((resolve, reject) => {
        const oautClient = new oauthClient({
            accessTokenUri: XSUAA_URL + '/oauth/token',
            clientId: XSUAA_CLIENTID,
            clientSecret: XSUAA_CLIENTSECRET,
            scopes: []
        });

        oautClient.owner.getToken('clahura@xternal.biz', 'XtsComer18$')
        .then((result) => {
            resolve({accessToken: result.accessToken});
        })
        .catch((error) => {
            reject({message: 'Error: failed to get access token. ', error: error}); 
        });
    });
}

 const _doQUERY = function (serviceUrl, accessToken, sBody){
    return new Promise (function(resolve, reject){
        const options = {
            url: serviceUrl,
            resolveWithFullResponse: true ,
            headers: { 
                Authorization: 'Bearer ' + accessToken, 
                Accept : 'application/json'
            }
        };

        if(sBody){
            options.data = sBody;
        }

        request(options)
        .then((response) => {
            if(response && response.statusCode == 200){
                resolve({responseBody: response.body});
            }
            reject({ message: 'Error while calling OData service'});
        })  
        .catch((error) => {
            reject({ message: 'Error occurred while calling OData service', error: error });
        });
    });
 };

// get
app.get('/api/embarcacion/listaEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/listaEmbarcacion";
        return _doQUERY(sUrl, result.accessToken, null);
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody.substring(0,64));
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//post
app.post('/api/embarcacion/listaTipoEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/listaTipoEmbarcacion";
        return _doQUERY(sUrl, result.accessToken, req.body);
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody.substring(0,64));
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});




// the server
const port = process.env.PORT || 3000;  // cloud foundry will set the PORT env after deploy
app.listen(port, function () {
    console.log('Node server running. Port: ' + port);
    console.log(port);
})