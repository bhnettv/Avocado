const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {media: 'Test'} );
} );

// Read single media by ID
router.get( '/:id', ( req, res ) => {
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
      Media.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( media === undefined ) {
    media = null;
  } else {
    if( media.keywords === null ) {
      media.keywords = [];
    } else {
      media.keywords = media.keywords.split( ',' );
    }
  }

  res.json( media );
} );

// Read all media
router.get( '/', ( req, res ) => {
  let medias = req.db.prepare( `
    SELECT
      Media.uuid AS "id",
      Media.created_at, 
      Media.updated_at,
      Media.url,
      Media.keywords
    FROM 
      Media
    ORDER BY datetime( Media.updated_at ) DESC
  ` )
  .all();

  for( let m = 0; m < medias.length; m++ ) {
    if( medias[m].keywords === null ) {
      medias[m].keywords = [];
    } else {
      medias[m].keywords = medias[m].keywords.split( ',' );
    }
  }

  res.json( medias );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    url: req.body.url,
    keywords: req.body.keywords
  };

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }

  let info = req.db.prepare( `
    INSERT INTO Media
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.url,
    record.keywords
  );

  if( record.keywords === null ) {
    record.keywords = [];
  } else {
    record.keywords = record.keywords.split( ',' );
  }

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    url: record.url,
    keywords: record.keywords
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    url: req.body.url,
    keywords: req.body.keywords
  };

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }

  let info = req.db.prepare( `
    UPDATE Media
    SET 
      updated_at = ?,
      url = ?,
      keywords = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.url,
    record.keywords,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Media.uuid AS "id",
      Media.created_at, 
      Media.updated_at,
      Media.url,
      Media.keywords
    FROM 
      Media
    WHERE 
      Media.uuid = ?  
  ` )
  .get(
    record.uuid
  );

  if( record.keywords === null ) {
    record.keywords = [];
  } else {
    record.keywords = record.keywords.split( ',' );
  }

  res.json( {
    id: record.id,
    created_at: record.created_at,
    updated_at: record.updated_at,
    url: record.url,
    keywords: record.keywords
  } );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Media
    WHERE Media.uuid = ?
  ` )
  .run(
    req.params.id
  );  

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
