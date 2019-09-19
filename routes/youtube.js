const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {youtube: 'Test'} );
} );

// Read single YouTube account by ID
router.get( '/:id', ( req, res ) => {
  let tube = req.db.prepare( `
    SELECT
      YouTube.uuid AS "id",
      YouTube.created_at, 
      YouTube.updated_at,
      Developer.uuid AS "developer_id",
      YouTube.channel_id
    FROM 
      Developer, 
      YouTube
    WHERE 
      YouTube.developer_id = Developer.id AND
      YouTube.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( tube === undefined ) {
    tube = null;
  }

  res.json( tube );
} );

// Read all YouTube accounts
router.get( '/', ( req, res ) => {
  let tubes = req.db.prepare( `
    SELECT
      YouTube.uuid AS "id",
      YouTube.created_at, 
      YouTube.updated_at,
      Developer.uuid AS "developer_id",
      YouTube.channel_id
    FROM 
      Developer,
      YouTube
    WHERE YouTube.developer_id = Developer.id
    ORDER BY YouTube.updated_at DESC
  ` )
  .all();

  res.json( tubes );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    channel_id: req.body.channel_id
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
    INSERT INTO YouTube
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.channel_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    channel_id: record.channel_id
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    channel_id: req.body.channel_id
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
    UPDATE YouTube
    SET 
      updated_at = ?,
      developer_id = ?,
      channel_id = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.channel_id,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT 
      YouTube.uuid AS "id",
      YouTube.created_at,
      YouTube.updated_at,
      Developer.uuid AS "developer_id",
      YouTube.channel_id
    FROM 
      Developer,
      YouTube      
    WHERE 
      Developer.id = YouTube.developer_id AND
      YouTube.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM YouTube
    WHERE YouTube.uuid = ?
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
