const express = require( 'express' );
const uuidv4 = require( 'uuid' );
const rp = require( 'request-promise-native' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {dev_post: 'Test'} );
} );

// Read single post by ID
router.get( '/id/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.link,
      DevPost.title,
      DevPost.summary,
      DevPost.likes,
      DevPost.reading,
      DevPost.unicorn,
      DevPost.keywords,
      DevPost.concepts,
      DevPost.entities
    FROM 
      Dev,
      DevPost
    WHERE 
      DevPost.dev_id = Dev.id AND
      DevPost.uuid = ?
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
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.link,
      DevPost.title,
      DevPost.summary,
      DevPost.likes,
      DevPost.reading,
      DevPost.unicorn,
      DevPost.keywords,
      DevPost.concepts,
      DevPost.entities
    FROM 
      Dev,
      DevPost
    WHERE DevPost.dev_id = Dev.id
    ORDER BY DevPost.published_at DESC
  ` )
  .all();

  res.json( posts );
} );

// Read single post by ID
// Dev.to GUIDs are URLs
// Easier to transmit over POST
router.post( '/guid', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.link,
      DevPost.title,
      DevPost.summary,
      DevPost.likes,
      DevPost.reading,
      DevPost.unicorn,
      DevPost.keywords,
      DevPost.concepts,
      DevPost.entities
    FROM 
      Dev,
      DevPost
    WHERE 
      DevPost.dev_id = Dev.id AND
      DevPost.guid = ?
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
router.post( '/reactions', async ( req, res ) => {
  const ARTICLE = 'data-article-id="';

  // Load raw post
  let page = await rp( {
    url: req.body.url,
    method: 'GET'
  } );

  // Parse article ID
  const start = page.indexOf( ARTICLE ) + ARTICLE.length;
  const end = page.indexOf( '"', start );
  const part = page.substring( start, end );
  const article = parseInt( part );

  // Load reactions
  let reactions = await rp( {
    url: 'https://dev.to/reactions',
    method: 'GET',
    qs: {
      article_id: article
    },
    json: true
  } );  

  // Hold results
  let result = {
    likes: 0,
    reading: 0,
    unicorn: 0
  };

  // Find results
  for( let r = 0; r < reactions.article_reaction_counts.length; r++ ) {
    switch( reactions.article_reaction_counts[r].category ) {
      case 'like':
        result.likes = reactions.article_reaction_counts[r].count;
        break;
      case 'readinglist':
        result.reading = reactions.article_reaction_counts[r].count;
        break;            
      case 'unicorn':
        result.unicorn = reactions.article_reaction_counts[r].count;
        break;            
    }
  }

  res.json( result );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dev_uuid: req.body.dev_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    likes: req.body.likes,
    reading: req.body.reading,
    unicorn: req.body.unicorn,
    category: req.body.category,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities
  };

  let dev = req.db.prepare( `
    SELECT Dev.id
    FROM Dev
    WHERE Dev.uuid = ?
  ` )
  .get( 
    record.dev_uuid
  );
  record.dev_id = dev.id;

  let info = req.db.prepare( `
    INSERT INTO DevPost
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.dev_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.likes,
    record.reading,
    record.unicorn,
    record.keywords,
    record.concepts,
    record.entities
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    dev_id: record.dev_uuid,
    published_at: record.published_at,
    guid: record.guid,
    link: record.link,
    title: record.title,
    summary: record.summary,
    likes: record.likes,
    reading: record.reading,
    unicorn: record.unicorn,
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
    dev_uuid: req.body.dev_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    likes: req.body.likes,
    reading: req.body.reading,
    unicorn: req.body.unicorn,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities    
  };

  let dev = req.db.prepare( `
    SELECT Dev.id
    FROM Dev
    WHERE Dev.uuid = ?
  ` )
  .get( 
    record.dev_uuid
  );
  record.dev_id = dev.id;

  let info = req.db.prepare( `
    UPDATE DevPost
    SET 
      updated_at = ?,
      dev_id = ?,
      published_at = ?,
      guid = ?,
      link = ?,
      title = ?,
      summary = ?,
      likes = ?,
      reading = ?,
      unicorn = ?,
      keywords = ?,
      concepts = ?,
      entities = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.dev_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.likes,
    record.reading,
    record.unicorn,
    record.keywords,
    record.concepts,
    record.entities,
    record.uuid
  );

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
    dev_uuid: req.body.dev_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    likes: req.body.likes,
    reading: req.body.reading,
    unicorn: req.body.unicorn,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities    
  } );  
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM DevPost
    WHERE DevPost.uuid = ?
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
