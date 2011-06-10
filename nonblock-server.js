/*
 * Autor: Mauro Monti.
 * Email: mauro.monti@globant.com
 * Date: 09/06/2011
 * 
 * NonBlock/IO Server.
 */
var express = require('express');
var app = express.createServer();
var paperboy = require('paperboy');
var	socketio = require('socket.io');
var data = require('data');
var sqlite = require('sqlite');

var config = require('./config.js')

// - Constants.
// var WEBROOT = path.join(path.dirname(__filename), 'webroot');

// - Setting Middlewares.
// app.use(express.logger());
app.use(express.bodyParser());
app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));

// - Setup Routes.
app.post(config.poster, function(request, response){
	var message = request.body;

	// - Database.
	var db = new sqlite.Database();
	db.open(config.db_filename, function(error) {
		if (error) {
      		console.log("Error trying to open database [dbname=%].", dbname);
      		throw error;
  		}

		/*
		var insert = "INSERT INTO positions (id, name) VALUES (?, ?)";
		db.execute(insert, [1, 'Intendente'], function (error, rows) {
        	if (error) {
        		console.log("Error running statement. [stmt=%].", insert);
        		throw error;
        	}
      	});
      	*/
      	
      	var select = "SELECT id, name FROM positions";
		db.prepare(select, function (error, statement) {
			if (error) {
				throw error;
			}
		
			// - Fill in the placeholders (Not Necesary 4 now).
    		// statement.bindArray(['milkshake', 30], function () {});
			
			statement.fetchAll(function (error, rows) {
				console.log("Rows lenght=%", rows.length);
				
				statement.finalize(function (error) {
					console.log("Fetching done!");
				});
			});
    	});
      	
	});
	
	/*
	var message = { 
		mesa: 758, 
		data: [{
			puesto : 'intendente',
			candidato : 'Giustiniani',
			partido : 'PSD',
			cant : 7
		}]
	};
	*/
	response.send(JSON.stringify({ response: 'OK', data: message }));
});

function serveFiles(request, response) {
	var deliver = paperboy.deliver(config.webroot_folder, request, response);
	var remoteAddress = request.connection.remoteAddress;

	deliver.before(function() {
		//console.log('Received Request');
	});
	deliver.after(function(pStatusCode) {
    	console.info('Status=' + pStatusCode + ', Url=' + request.url);
	});
}

app.get(config.client, serveFiles)

/*
app.get('/client/', serveFiles);
app.get('/client/*', serveFiles);
*/

// - Start listening for incomming requests.
app.listen(config.server_port);

/*
 * WebSocket Message Handling.
 */

// = Registered clients.
var registeredClients = new data.Hash();

var socket = socketio.listen(app);
socket.on('connection', function(client){
	
	console.info('New client [sessionId=%s] arrived.', client.sessionId);
	
	client.on('message', function(message){
		var clientHolder = Object.create({ client: null, data: null });;

		/*
		 *	Subscribe message.
		 *  
		message = {
			name : 'subscribe',
			data : {
				puesto : 'Intendente',
				alcance : 'localidad',
				nivel : 'mesa',
				valor_alc : 'Rosario',
				valor_niv : '174'
			}
		};
		*/
		
		if (message.name == 'subscribe') {
			clientHolder.client = client;
			clientHolder.data = message.data;
			
			registeredClients.set(client.sessionId, clientHolder);
			
			console.info('Client [sessionId=%s] subscribed.', client.sessionId);
					
			// response to the client.
			client.send({ response: 'OK', sessionId: client.sessionId, index: registeredClients.index(client.sessionId), data: message });
		}

		/*
		 *	Cancel message.
		 *  
		message = {
			name : 'cancel',
			data : {
				puesto : 'Intendente',
				alcance : 'localidad',
				nivel : 'mesa',
				valor_alc : 'Rosario',
				valor_niv : '147'
			}
		};
		*/
		
		if (message.name == 'cancel') {
			registeredClients.del(client.sessionId);

			console.info('Client [sessionId=%s] cancelled subscription.', client.sessionId);

			// response to the client.
			client.send({ response: 'OK', sessionId: client.sessionId, data: message });
		}
		
		/*
		 * NewData message.
		 * 
		message = {
			name : 'newdata',
			data : {
				event : {
					puesto : 'xxx',
					alcance : 'xxx',
					nivel : 'xxx',
					valor_alc : 'xxx'
					valor_niv : 'xxx'
				},
				data: [{
					puesto : 'xxx',
					candidato : 'xxx',
					partido : 'xxx',
					cant : 7
				}]
			}
		};
		*/

		if (message.name == 'newdata') {
			console.info('Client [sessionId=%s] fetching new data.', client.sessionId);

			// TODO: Fetch info and return to the client.
			
			// response to the client.
			client.send({ response: 'OK', sessionId: client.sessionId, data: message });
		}
	});
	
	client.on('disconnect', function(){
		console.info('Client [sessionId=%s] disconnected.', client.sessionId);
	});
});

console.log("\nNonBlock Server is up and running: http://127.0.0.1:%s/", app.address().port);