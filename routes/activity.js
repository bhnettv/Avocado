const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {activity: 'Test'} );
} );

// Read single activity by ID
router.get( '/:id', ( req, res ) => {
  let activity = req.db.prepare( `
    SELECT
      Activity.uuid AS "id",
      Activity.created_at, 
      Activity.updated_at,
      Activity.name
    FROM Activity
    WHERE Activity.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( activity === undefined ) {
    activity = null;
  }

  res.json( activity );
} );

// Read all labels
router.get( '/', ( req, res ) => {
  let activities = req.db.prepare( `
    SELECT
      Activity.uuid AS "id",
      Activity.created_at, 
      Activity.updated_at,
      Activity.name
    FROM Activity
    ORDER BY name ASC
  ` )
  .all();

  res.json( activities );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: req.body.name
  };

  let info = req.db.prepare( `
    INSERT INTO Activity
    VALUES ( ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.name
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    name: record.name
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    name: req.body.name
  };

  let info = req.db.prepare( `
    UPDATE Activity
    SET 
      updated_at = ?,
      name = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.name,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Activity.uuid AS "id",
      Activity.created_at, 
      Activity.updated_at,
      Activity.name
    FROM Activity
    WHERE Activity.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Activity
    WHERE Activity.uuid = ?
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
