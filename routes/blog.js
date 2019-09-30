const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {blog: 'Test'} );
} );

// Read single blog by ID
router.get( '/:id', ( req, res ) => {
  let blog = req.db.prepare( `
    SELECT
      Blog.uuid AS "id",
      Blog.created_at, 
      Blog.updated_at,
      Developer.uuid AS "developer_id",
      Blog.url,
      Blog.feed
    FROM 
      Developer, 
      Blog
    WHERE 
      Blog.developer_id = Developer.id AND
      Blog.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( blog === undefined ) {
    blog = null;
  }

  res.json( blog );
} );

// Read all blogs
router.get( '/', ( req, res ) => {
  let blogs = req.db.prepare( `
    SELECT
      Blog.uuid AS "id",
      Blog.created_at, 
      Blog.updated_at,
      Developer.uuid AS "developer_id",
      Blog.url,
      Blog.feed
    FROM 
      Developer,
      Blog
    WHERE Blog.developer_id = Developer.id
    ORDER BY datetime( Blog.updated_at ) DESC
  ` )
  .all();

  res.json( blogs );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    url: req.body.url,
    feed: req.body.feed
  };

  let existing = req.db.prepare( `
    SELECT
      Blog.uuid AS "id",
      Blog.created_at,
      Blog.updated_at,
      Developer.uuid AS "id",
      Blog.url,
      Blog.feed
    FROM
      Blog,
      Developer
    WHERE 
      Blog.developer_id = Developer.id AND
      Blog.url = ?
  ` ).get( 
    req.body.url
  );

  if( existing === undefined ) {
    let developer = req.db.prepare( `
      SELECT Developer.id
      FROM Developer
      WHERE Developer.uuid = ?
    ` )
    .get( 
      record.developer_uuid
    );
    record.developer_id = developer.id;

    let info = req.db.prepare( `
      INSERT INTO Blog
      VALUES ( ?, ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.url,
      record.feed
    );

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      url: record.url,
      feed: record.feed
    };
  } else {
    record = existing;
  }

  res.json( record );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    url: req.body.url,
    feed: req.body.feed
  };

  let developer = req.db.prepare( `
    SELECT Developer.id
    FROM Developer
    WHERE Developer.uuid = ?
  ` )
  .get( 
    record.developer_uuid
  );
  record.developer_id = developer.id;

  let info = req.db.prepare( `
    UPDATE Blog
    SET 
      updated_at = ?,
      developer_id = ?,
      url = ?,
      feed = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.url,
    record.feed,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Blog.uuid AS "id",
      Blog.created_at, 
      Blog.updated_at,
      Developer.uuid AS "developer_id",
      Blog.url,
      Blog.feed
    FROM 
      Developer, 
      Blog
    WHERE 
      Blog.developer_id = Developer.id AND
      Blog.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Blog
    WHERE Blog.uuid = ?
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
