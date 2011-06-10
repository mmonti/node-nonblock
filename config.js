/*
 * Constants for nonblock-server.
 */

var path = require('path');

// Server Constants.
exports.server_port = 3000;

// Server Static Content Constants.
exports.webroot = 'webroot';
exports.webroot_folder = path.join(path.dirname(__filename), this.webroot);

// Database Constants.
exports.db_filename = 'db.sqlite';

// Express Constants.
exports.client = '^\/client[\/]?$';
exports.poster = '^\/submitter[\/]?$';


