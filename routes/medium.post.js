const express = require( 'express' );
const uuidv4 = require( 'uuid' );
const rp = require( 'request-promise-native' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {medium_post: 'Test'} );
} );

// Read single post by ID
router.get( '/id/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      MediumPost.uuid AS "id",
      MediumPost.created_at,
      MediumPost.updated_at,
      Medium.uuid AS "medium_id",
      MediumPost.published_at,
      MediumPost.guid,
      MediumPost.link,
      MediumPost.title,
      MediumPost.summary,
      MediumPost.claps,
      MediumPost.category,
      MediumPost.keywords,
      MediumPost.concepts,
      MediumPost.entities
    FROM 
      Medium,
      MediumPost
    WHERE 
      MediumPost.medium_id = Medium.id AND
      MediumPost.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( post === undefined ) {
    post = null;
  }

  res.json( post );
} );

// Read all posts
router.get( '/', ( req, res ) => {
  let posts = req.db.prepare( `
    SELECT
      MediumPost.uuid AS "id",
      MediumPost.created_at,
      MediumPost.updated_at,
      Medium.uuid AS "medium_id",
      MediumPost.published_at,
      MediumPost.guid,
      MediumPost.link,
      MediumPost.title,
      MediumPost.summary,
      MediumPost.claps,
      MediumPost.category,
      MediumPost.keywords,
      MediumPost.concepts,
      MediumPost.entities
    FROM 
      Medium,
      MediumPost
    WHERE MediumPost.medium_id = Medium.id
    ORDER BY MediumPost.published_at DESC
  ` )
  .all();

  res.json( posts );
} );

// Read single post by ID
// Medium GUIDs are URLs
// Easier to transmit over POST
router.post( '/guid', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      MediumPost.uuid AS "id",
      MediumPost.created_at,
      MediumPost.updated_at,
      Medium.uuid AS "medium_id",
      MediumPost.published_at,
      MediumPost.guid,
      MediumPost.link,
      MediumPost.title,
      MediumPost.summary,
      MediumPost.claps,
      MediumPost.category,
      MediumPost.keywords,
      MediumPost.concepts,
      MediumPost.entities
    FROM 
      Medium,
      MediumPost
    WHERE 
      MediumPost.medium_id = Medium.id AND
      MediumPost.guid = ?
  ` )
  .get( 
    req.body.url 
  );

  if( post === undefined ) {
    post = null;
  }

  res.json( post );
} );

// Get statistics for post
router.post( '/claps', async ( req, res ) => {
  const CLAPS = 'clapCount":';

  let body = await rp( {
    url: req.body.url,
    method: 'GET'
  } );

  const start = body.indexOf( CLAPS ) + CLAPS.length;
  const end = body.indexOf( ',', start );
  const part = body.substring( start, end );

  res.json( {
    claps: parseInt( part )
  } );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    medium_uuid: req.body.medium_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    claps: req.body.claps,
    category: req.body.category,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities
  };

  let medium = req.db.prepare( `
    SELECT Medium.id
    FROM Medium
    WHERE Medium.uuid = ?
  ` )
  .get( 
    record.medium_uuid
  );
  record.medium_id = medium.id;

  let info = req.db.prepare( `
    INSERT INTO MediumPost
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.medium_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.claps,
    record.category,
    record.keywords,
    record.concepts,
    record.entities
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    medium_id: record.medium_uuid,
    published_at: record.published_at,
    guid: record.guid,
    link: record.link,
    title: record.title,
    summary: record.summary,
    claps: record.claps,
    category: record.category,
    keywords: record.keywords,
    concepts: record.concepts,
    entities: record.entities
  } );
} );

// Update
router.put( '/id/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    medium_uuid: req.body.medium_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    claps: req.body.claps,
    category: req.body.category,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities    
  };

  let medium = req.db.prepare( `
    SELECT Medium.id
    FROM Medium
    WHERE Medium.uuid = ?
  ` )
  .get( 
    record.medium_uuid
  );
  record.medium_id = medium.id;

  let info = req.db.prepare( `
    UPDATE MediumPost
    SET 
      updated_at = ?,
      medium_id = ?,
      published_at = ?,
      guid = ?,
      link = ?,
      title = ?,
      summary = ?,
      claps = ?,
      category = ?,
      keywords = ?,
      concepts = ?,
      entities = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.medium_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.claps,
    record.category,
    record.keywords,
    record.concepts,
    record.entities,
    record.uuid
  );

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
    medium_uuid: req.body.medium_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    claps: req.body.claps,
    category: req.body.category,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities    
  } );  
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM MediumPost
    WHERE MediumPost.uuid = ?
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
