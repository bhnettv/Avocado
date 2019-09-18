const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {dev: 'Test'} );
} );

// Read single Dev account by ID
router.get( '/:id', ( req, res ) => {
  let dev = req.db.prepare( `
    SELECT
      Dev.uuid AS "id",
      Dev.created_at, 
      Dev.updated_at,
      Developer.uuid AS "developer_id",
      Dev.user_name
    FROM 
      Developer, 
      Dev
    WHERE 
      Dev.developer_id = Developer.id AND
      Dev.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( dev === undefined ) {
    dev = null;
  }

  res.json( dev );
} );

// Read all Dev accounts
router.get( '/', ( req, res ) => {
  let devs = req.db.prepare( `
    SELECT
      Dev.uuid AS "id",
      Dev.created_at, 
      Dev.updated_at,
      Developer.uuid AS "developer_id",
      Dev.user_name
    FROM 
      Developer,
      Dev
    WHERE Dev.developer_id = Developer.id
    ORDER BY Dev.updated_at DESC
  ` )
  .all();

  res.json( devs );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user_name: req.body.user_name
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
    INSERT INTO Dev
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.user_name
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    user_name: record.user_name
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user_name: req.body.user_name
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
    UPDATE Dev
    SET 
      updated_at = ?,
      developer_id = ?,
      user_name = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.user_name,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT 
      Dev.uuid AS "id",
      Dev.created_at,
      Dev.updated_at,
      Developer.uuid AS "developer_id",
      Dev.user_name
    FROM 
      Dev,
      Developer
    WHERE 
      Developer.id = Dev.developer_id AND
      Dev.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Dev
    WHERE Dev.uuid = ?
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
