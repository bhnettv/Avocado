const cheerio = require( 'cheerio' );
const express = require( 'express' );
const fileType = require( 'file-type' );
const fs = require( 'fs' );
const path = require( 'path' );
const rp = require( 'request-promise-native' );
const sizeOf = require( 'image-size' );
const url = require( 'url' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {utility: 'Test'} );
} );

// Extract images from URL
router.get( '/images/:url', async ( req, res ) => {
  let accept = null;
  let check = null;
  let scan = null;

  // Check file type
  if( !req.query.check ) {
    check = true;
  } else {
    check = new Boolean( req.query.check );
  }

  // CSV list of accepted file types
  if( !req.query.accept ) {
    // Watson acceptable types
    accept = ['jpeg', 'jpg', 'png', 'tiff', 'gif'];
  } else {
    accept = req.query.accept.split( ',' );
  }

  // Check database for uniqueness
  if( !req.query.scan ) {
    scan = true;
  } else {
    scan = new Boolean( req.query.scan );    
  }

  // Get page URL from query string
  // Base64 for safe URL encoding
  let buffer = new Buffer.from( req.params.url, 'base64' );
  let uri = buffer.toString( 'utf8' );  

  // Load page
  // Expose virtual DOM
  let body = await rp( uri );
  let $ = cheerio.load( body );

  // Get image tags
  let images = $( 'body' ).find( 'img' ).toArray();

  // Temporary image file storage
  // Removed at end of run
  let local = path.join( __dirname, '../', 'dimensions' );

  // Extracted images
  // Not necessarily results
  // That comes later
  let extracted = [];

  // For each of the images
  for( let i = 0; i < images.length; i++ ) {
    // Resolve full path
    let remote = url.resolve( uri, images[i].attribs.src );

    // Download image file
    let data = await rp( {
      method: 'GET',
      url: remote,
      encoding: null,
      resolveWithFullResponse: true
    } );

    // Decode to image bytes
    // Write to local file
    const buffer = Buffer.from( data.body, 'utf8' );
    fs.writeFileSync( local, buffer );    

    // Get image dimensions
    let dimensions = sizeOf( local );

    // Restrict for Watson minimum requirements
    if( dimensions.width < 35 || dimensions.height < 35 ) {
      continue;
    }

    // Get file type
    let info = fileType( buffer );

    // If request wants file type check
    // Defaults to true
    if( check ) {
      // See if there is a match in the accepted list
      for( let a = 0; a < accept.length; a++ ) {
        if( info.ext === accept[a] ) {
          extracted.push( remote );
          break;
        }
      }       
    } else {
      // No check requested
      extracted.push( remote );
    }
  }

  let results = [];

  // For each of the extracted images
  for( let e = 0; e < extracted.length; e++ ) {
    let found = false;

    // Already in results
    for( let r = 0; r < results.length; r++ ) {
      if( results[r] === extracted[e] ) {
        found = true;
        break;
      }
    }

    // Do not return
    if( found ) {
      continue;
    }

    // If request wants database check
    // Defaults to true 
    if( scan ) {
      let media = req.db.prepare( `
        SELECT
          Media.uuid AS "id",
          Media.created_at, 
          Media.updated_at,
          Media.url,
          Media.keywords
        FROM 
          Media
        WHERE 
          Media.url = ?
      ` )
      .get( 
        extracted[e]
      );
        
      // Not in the database
      if( media === undefined ) {
        results.push( extracted[e] );
      }
    } else {
      // No database check required
      // Go ahead and return
      results.push( extracted[e] );
    }
  }

  // Clean up
  if( fs.existsSync( path ) ) {
    fs.unlinkSync( local );
  }

  // Return array of URL strings
  res.json( results );
} );

// Export
module.exports = router;
