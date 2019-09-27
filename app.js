var cors = require( 'cors' );
var Database = require( 'better-sqlite3' );
var express = require( 'express' );
var jsonfile = require( 'jsonfile' );
var parser = require( 'body-parser' );
var request = require( 'sync-request' );

// Configuration
var config = jsonfile.readFileSync( 'config.json' );

// Twitter credentials
// Synchronous for simplicity in this case only
// Once at startup has no further performance penalties
var authentication = Buffer.from( config.twitter.key + ':' + config.twitter.secret );
var response = request( 'POST', 'https://api.twitter.com/oauth2/token', {
 	headers: {
		'Authorization': 'Basic ' + authentication.toString( 'base64' ),
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	body: 'grant_type=client_credentials'
} );
var twitter = JSON.parse( response.getBody( 'utf8' ) );

// Database
var db = null;

// Verbose for development
if( config.server.mode === 'production' ) {
	db = new Database( config.server.database[config.server.mode] );
} else {
	db = new Database( config.server.database[config.server.mode], { 
		verbose: console.log 
	} );
}

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
	req.twitter = twitter;
  
	// Just keep swimming
	next();
} );

// Static for main files
app.use( '/', express.static( 'public' ) );

// Routes
app.use( '/api/activity', require( './routes/activity' ) );
app.use( '/api/label', require( './routes/label' ) );
app.use( '/api/developer/note', require( './routes/developer-note' ) );
app.use( '/api/developer', require( './routes/developer' ) );
app.use( '/api/blog/post', require( './routes/blog-post' ) );
app.use( '/api/blog', require( './routes/blog' ) );
app.use( '/api/dev/post', require( './routes/dev-post' ) );
app.use( '/api/dev', require( './routes/dev' ) );
app.use( '/api/github/event', require( './routes/github-event' ) );
app.use( '/api/github', require( './routes/github' ) );
app.use( '/api/medium/post', require( './routes/medium-post' ) );
app.use( '/api/medium', require( './routes/medium' ) );
app.use( '/api/youtube/video', require( './routes/youtube-video' ) );
app.use( '/api/youtube', require( './routes/youtube' ) );
app.use( '/api/media', require( './routes/media' ) );
app.use( '/api/so/question', require( './routes/so-question' ) );
app.use( '/api/so/answer', require( './routes/so-answer' ) );
app.use( '/api/so', require( './routes/so' ) );
app.use( '/api/twitter/status', require( './routes/twitter-status' ) );
app.use( '/api/twitter', require( './routes/twitter' ) );
app.use( '/api/repository', require( './routes/repository' ) );
app.use( '/api/watson', require( './routes/watson' ) );
app.use( '/api/utility', require( './routes/utility' ) );

// Listen
var server = app.listen( config.server.port, function() {
	// Debug
	console.log( 'Get relating!' );
} );
