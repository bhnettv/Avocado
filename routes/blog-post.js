const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {blog_post: 'Test'} );
} );

// Read single post by ID
router.get( '/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      Blog.uuid AS "blog_id",
      BlogPost.published_at,
      BlogPost.guid,
      BlogPost.link,
      BlogPost.title,
      BlogPost.summary,
      BlogPost.views,
      BlogPost.category,
      BlogPost.keywords,
      BlogPost.concepts,
      BlogPost.entities
    FROM 
      Blog,
      BlogPost
    WHERE 
      BlogPost.blog_id = Blog.id AND
      BlogPost.uuid = ?
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
      BlogPost,
      BlogPostMedia
    WHERE 
      Media.id = BlogPostMedia.media_id AND
      BlogPostMedia.post_id = BlogPost.id AND
      BlogPost.uuid = ?
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
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      Blog.uuid AS "blog_id",
      BlogPost.published_at,
      BlogPost.guid,
      BlogPost.link,
      BlogPost.title,
      BlogPost.summary,
      BlogPost.views,
      BlogPost.category,
      BlogPost.keywords,
      BlogPost.concepts,
      BlogPost.entities
    FROM 
      Blog,
      BlogPost
    WHERE 
      BlogPost.blog_id = Blog.id AND
      BlogPost.guid = ?
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
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      Blog.uuid AS "blog_id",
      BlogPost.published_at,
      BlogPost.guid,
      BlogPost.link,
      BlogPost.title,
      BlogPost.summary,
      BlogPost.views,
      BlogPost.category,
      BlogPost.keywords,
      BlogPost.concepts,
      BlogPost.entities
    FROM 
      Blog,
      BlogPost
    WHERE BlogPost.blog_id = Blog.id
    ORDER BY BlogPost.published_at DESC
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
      BlogPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      BlogPost,   
      Media
    WHERE
      BlogPost.uuid = ? AND
      Media.uuid = ?
  ` )
  .get( 
    record.post_uuid,
    record.media_uuid
  );
  record.post_id = ids.post_id;
  record.media_id = ids.media_id;

  let info = req.db.prepare( `
    INSERT INTO BlogPostMedia
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
    blog_uuid: req.body.blog_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    views: req.body.views,
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

  let blog = req.db.prepare( `
    SELECT Blog.id
    FROM Blog
    WHERE Blog.uuid = ?
  ` )
  .get( 
    record.blog_uuid
  );
  record.blog_id = blog.id;

  let info = req.db.prepare( `
    INSERT INTO BlogPost
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.blog_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.views,
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
    blog_id: record.blog_uuid,
    published_at: record.published_at,
    guid: record.guid,
    link: record.link,
    title: record.title,
    summary: record.summary,
    views: record.views,
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
    blog_uuid: req.body.blog_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    link: req.body.link,
    title: req.body.title,
    summary: req.body.summary,
    views: req.body.views,
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

  let blog = req.db.prepare( `
    SELECT Blog.id
    FROM Blog
    WHERE Blog.uuid = ?
  ` )
  .get( 
    record.blog_uuid
  );
  record.blog_id = blog.id;

  let info = req.db.prepare( `
    UPDATE BlogPost
    SET 
      updated_at = ?,
      blog_id = ?,
      published_at = ?,
      guid = ?,
      link = ?,
      title = ?,
      summary = ?,
      views = ?,
      category = ?,
      keywords = ?,
      concepts = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.blog_id,
    record.published_at,
    record.guid,
    record.link,
    record.title,
    record.summary,
    record.views,
    record.category,
    record.keywords,
    record.concepts,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      Blog.uuid AS "blog_id",
      BlogPost.published_at,
      BlogPost.guid,
      BlogPost.link,
      BlogPost.title,
      BlogPost.summary,
      BlogPost.views,
      BlogPost.category,
      BlogPost.keywords,
      BlogPost.concepts,
      BlogPost.entities
    FROM 
      Blog,
      BlogPost
    WHERE 
      BlogPost.blog_id = Blog.id AND
      BlogPost.uuid = ?
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
      BlogPost.id AS "post_id",
      Media.id AS "media_id"
    FROM
      Media,
      BlogPost
    WHERE
      BlogPost.uuid = ? AND
      Media.uuid = ?    
  ` )
  .get( 
    req.params.post,
    req.params.media
  );

  let info = req.db.prepare( `
    DELETE FROM BlogPostMedia
    WHERE 
      BlogPostMedia.post_id = ? AND
      BlogPostMedia.media_id = ?
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
    DELETE FROM BlogPost
    WHERE BlogPost.uuid = ?
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
