var cors = require( 'cors' );
var Database = require( 'better-sqlite3' );
var express = require( 'express' );
var jsonfile = require( 'jsonfile' );
var parser = require( 'body-parser' );

// Configuration
var config = jsonfile.readFileSync( 'config.json' );

// Database
var db = new Database( config.server.database[config.server.mode], { 
	verbose: console.log 
} );

// Application
var app = express();

// IP tracking
app.enable( 'trust proxy' );

// Cross-domain
app.use( cors() );

// Middleware
app.use( parser.json( {limit: '50mb'} ) );
app.use( parser.urlencoded( { 
	limit: '50mb',
	extended: false,
	parameterLimit: 50000
} ) );

// Per-request actions
app.use( ( req, res, next ) => {	
	// Configuration
	req.config = config;
  req.db = db;
  
	// Just keep swimming
	next();
} );

// Static for main files
app.use( '/', express.static( 'public' ) );

// Routes
app.use( '/api/label', require( './routes/label' ) );
app.use( '/api/developer', require( './routes/developer' ) );
app.use( '/api/blog', require( './routes/blog' ) );
app.use( '/api/blog/post', require( './routes/blog.post' ) );
app.use( '/api/dev', require( './routes/dev' ) );
app.use( '/api/dev/post', require( './routes/dev.post' ) );
app.use( '/api/medium', require( './routes/medium' ) );
app.use( '/api/medium/post', require( './routes/medium.post' ) );
app.use( '/api/media', require( './routes/media' ) );
app.use( '/api/watson', require( './routes/watson' ) );

// Listen
var server = app.listen( config.server.port, function() {
	// Debug
	console.log( 'Get relating!' );
} );
