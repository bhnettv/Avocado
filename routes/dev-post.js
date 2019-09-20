const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {dev_post: 'Test'} );
} );

// Read single post by ID
router.get( '/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.article_id,
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
  } else {
    if( post.keywords === null ) {
      post.keywords = [];
    } else {
      post.keywords = post.keywords.split( ',' );
    }
    
    if( post.concepts === null ) {
      post.concepts = [];
    } else {
      post.concepts = post.concepts.split( ',' );
    }
    
    if( post.entities === null ) {
      post.entities = [];
    } else {
      post.entities = post.entities.split( ',' );
    }    
  }

  res.json( post );
} );

// Read all media for specific post
router.get( '/:id/media', ( req, res ) => {
  let medias = req.db.prepare( `
    SELECT
      Media.uuid AS "id",
      Media.created_at,
      Media.updated_at,
      Media.url,
      Media.keywords
    FROM 
      Media,
      DevPost,
      DevPostMedia
    WHERE 
      Media.id = DevPostMedia.media_id AND
      DevPostMedia.post_id = DevPost.id AND
      DevPost.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  for( let m = 0; m < medias.length; m++ ) {
    if( medias[m].keywords === null ) {
      medias[m].keywords = [];
    } else {
      medias[m].keywords = medias[m].keywords.split( ',' );
    }
  }

  res.json( medias );
} );

// Read single post by GUID
// GUIDs are often URLs
// Base64 encoded
router.get( '/guid/:id', ( req, res ) => {
  let buffer = new Buffer.from( req.params.id, 'base64' );
  let guid = buffer.toString( 'utf8' );  

  let post = req.db.prepare( `
    SELECT
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.article_id,
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
    guid 
  );

  if( post === undefined ) {
    post = null;
  } else {
    if( post.keywords === null ) {
      post.keywords = [];
    } else {
      post.keywords = post.keywords.split( ',' );
    }
    
    if( post.concepts === null ) {
      post.concepts = [];
    } else {
      post.concepts = post.concepts.split( ',' );
    }
    
    if( post.entities === null ) {
      post.entities = [];
    } else {
      post.entities = post.entities.split( ',' );
    } 
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
      DevPost.article_id,
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

  for( let p = 0; p < posts.length; p++ ) {
    if( posts[p].keywords === null ) {
      posts[p].keywords = [];
    } else {
      posts[p].keywords = posts[p].keywords.split( ',' );
    }
    
    if( posts[p].concepts === null ) {
      posts[p].concepts = [];
    } else {
      posts[p].concepts = posts[p].concepts.split( ',' );
    }
    
    if( posts[p].entities === null ) {
      posts[p].entities = [];
    } else {
      posts[p].entities = posts[p].entities.split( ',' );
    }    
  }

  res.json( posts );
} );

// Associate media with post
router.post( '/:id/media', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    post_uuid: req.params.id,
    media_uuid: req.body.media_id
  };

  let ids = req.db.prepare( `
    SELECT
      DevPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      DevPost,   
      Media
    WHERE
      DevPost.uuid = ? AND
      Media.uuid = ?
  ` )
  .get( 
    record.post_uuid,
    record.media_uuid
  );
  record.post_id = ids.post_id;
  record.media_id = ids.media_id;

  let info = req.db.prepare( `
    INSERT INTO DevPostMedia
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.post_id,
    record.media_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    post_id: record.post_uuid,
    media_id: record.media_uuid
  } );  
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
    article_id: req.body.article_id,
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

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }    

  if( record.concepts.length === 0 ) {
    record.concepts = null;
  } else {
    record.concepts = record.concepts.join( ',' );
  }    
  
  if( record.entities.length === 0 ) {
    record.entities = null;
  } else {
    record.entities = record.entities.join( ',' );
  }    

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
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.dev_id,
    record.published_at,
    record.guid,
    record.article_id,
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

  if( record.keywords === null ) {
    record.keywords = [];
  } else {    
    record.keywords = record.keywords.split( ',' );
  }  

  if( record.concepts === null ) {
    record.concepts = [];
  } else {    
    record.concepts = record.concepts.split( ',' );
  }

  if( record.entities === null ) {
      record.entities = [];
  } else {    
    record.entities = record.entities.split( ',' );
  }  

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    dev_id: record.dev_uuid,
    published_at: record.published_at,
    guid: record.guid,
    article_id: record.article_id,
    link: record.link,
    title: record.title,
    summary: record.summary,
    likes: record.likes,
    reading: record.reading,
    unicorn: record.unicorn,    
    keywords: record.keywords,
    concepts: record.concepts,
    entities: record.entities
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    dev_uuid: req.body.dev_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    article_id: req.body.article_id,
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

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }    

  if( record.concepts.length === 0 ) {
    record.concepts = null;
  } else {
    record.concepts = record.concepts.join( ',' );
  }    
  
  if( record.entities.length === 0 ) {
    record.entities = null;
  } else {
    record.entities = record.entities.join( ',' );
  }    

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
      article_id = ?,
      link = ?,
      title = ?,
      summary = ?,
      likes = ?,
      reading = ?,
      unicorn = ?,            
      keywords = ?,
      concepts = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.dev_id,
    record.published_at,
    record.guid,
    record.article_id,
    record.link,
    record.title,
    record.summary,
    record.likes,
    record.reading,
    record.unicorn,        
    record.keywords,
    record.concepts,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      DevPost.uuid AS "id",
      DevPost.created_at,
      DevPost.updated_at,
      Dev.uuid AS "dev_id",
      DevPost.published_at,
      DevPost.guid,
      DevPost.article_id,
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
    record.uuid 
  );

  if( record.keywords === null ) {
    record.keywords = [];
  } else {    
    record.keywords = record.keywords.split( ',' );
  }  

  if( record.concepts === null ) {
    record.concepts = [];
  } else {    
    record.concepts = record.concepts.split( ',' );
  }

  if( record.entities === null ) {
      record.entities = [];
  } else {    
    record.entities = record.entities.split( ',' );
  }

  res.json( record );  
} );

// Remove media associated with post
router.delete( '/:post/media/:media', ( req, res ) => {
  let ids = req.db.prepare( `
    SELECT
      DevPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      Media,
      DevPost
    WHERE
      DevPost.uuid = ? AND
      Media.uuid = ?    
  ` )
  .get( 
    req.params.post,
    req.params.media
  );

  let info = req.db.prepare( `
    DELETE FROM DevPostMedia
    WHERE 
      DevPostMedia.post_id = ? AND
      DevPostMedia.media_id = ?
  ` )
  .run(
    ids.post_id,
    ids.media_id
  );  

  res.json( {
    post_id: req.params.post,
    media_id: req.params.media
  } );
} );

// Delete
router.delete( '/:id', ( req, res ) => {
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
