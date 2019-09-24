const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {medium_post: 'Test'} );
} );

// Read single post by ID
router.get( '/:id', ( req, res ) => {
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
  } else {
    if( post.category === null ) {
      post.category = [];
    } else {
      post.category = post.category.split( ',' );
    }

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
      MediumPost,
      MediumPostMedia
    WHERE 
      Media.id = MediumPostMedia.media_id AND
      MediumPostMedia.post_id = MediumPost.id AND
      MediumPost.uuid = ?
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
    guid 
  );

  if( post === undefined ) {
    post = null;
  } else {
    if( post.category === null ) {
      post.category = [];
    } else {
      post.category = post.category.split( ',' );
    }

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

  for( let p = 0; p < posts.length; p++ ) {
    if( posts[p].category === null ) {
      posts[p].category = [];
    } else {
      posts[p].category = posts[p].category.split( ',' );
    }

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
      MediumPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      MediumPost,   
      Media
    WHERE
      MediumPost.uuid = ? AND
      Media.uuid = ?
  ` )
  .get( 
    record.post_uuid,
    record.media_uuid
  );
  record.post_id = ids.post_id;
  record.media_id = ids.media_id;

  let info = req.db.prepare( `
    INSERT INTO MediumPostMedia
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

  if( record.category.length === 0 ) {
    record.category = null;
  } else {
    record.category = record.category.join( ',' );
  }

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

  if( record.category === null ) {
    record.category = [];
  } else {
    record.category = record.category.split( ',' );
  }

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
router.put( '/:id', ( req, res ) => {
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

  if( record.category.length === 0 ) {
    record.category = null;
  } else {
    record.category = record.category.join( ',' );
  }

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

  record = req.db.prepare( `
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
    record.uuid 
  );

  if( record.category === null ) {
    record.category = [];
  } else {
    record.category = record.category.split( ',' );
  }

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
      MediumPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      Media,
      MediumPost
    WHERE
      MediumPost.uuid = ? AND
      Media.uuid = ?    
  ` )
  .get( 
    req.params.post,
    req.params.media
  );

  let info = req.db.prepare( `
    DELETE FROM MediumPostMedia
    WHERE 
      MediumPostMedia.post_id = ? AND
      MediumPostMedia.media_id = ?
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
