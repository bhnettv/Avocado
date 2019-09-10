const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {blog_post: 'Test'} );
} );

// Read single post by ID
router.get( '/id/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      BlogPost.blog_id,
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
  }

  res.json( post );
} );

// Read single post by ID
router.get( '/guid', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      BlogPost.blog_id,
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
    req.query.guid 
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
      BlogPost.uuid AS "id",
      BlogPost.created_at,
      BlogPost.updated_at,
      BlogPost.blog_id,
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

  res.json( posts );
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
router.put( '/id/:id', ( req, res ) => {
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

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
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
  } );  
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
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
