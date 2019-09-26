const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {developer_note: 'Test'} );
} );

// Read single notes by ID
router.get( '/:id', ( req, res ) => {
  let note = req.db.prepare( `
    SELECT
      DeveloperNote.uuid AS "id",
      DeveloperNote.created_at, 
      DeveloperNote.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      DeveloperNote.full_text
    FROM 
      Activity,
      Developer,
      DeveloperNote
    WHERE 
      DeveloperNote.activity_id = Activity.id AND
      DeveloperNote.developer_id = Developer.id AND
      DeveloperNote.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( note === undefined ) {
    note = null;
  }

  res.json( note );
} );

// Read all notes
router.get( '/', ( req, res ) => {
  let notes = req.db.prepare( `
    SELECT
      DeveloperNote.uuid AS "id",
      DeveloperNote.created_at, 
      DeveloperNote.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      DeveloperNote.full_text
    FROM 
      Activity,
      Developer,
      DeveloperNote
    WHERE 
      DeveloperNote.activity_id = Activity.id AND
      DeveloperNote.developer_id = Developer.id
    ORDER BY DeveloperNote.updated_at DESC
  ` )
  .all();

  res.json( notes );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    activity_uuid: req.body.activity_id,
    full_text: req.body.full_text
  };

  let ids = req.db.prepare( `
    SELECT
      Activity.id AS "activity_id",
      Developer.id AS "developer_id"
    FROM
      Activity,
      Developer
    WHERE
      Activity.uuid = ? AND
      Developer.uuid = ?
  ` )
  .get(
    record.activity_uuid,
    record.developer_uuid
  );
  record.activity_id = ids.activity_id;
  record.developer_id = ids.developer_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperNote
    VALUES ( ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.activity_id,
    record.full_text
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    activity_id: record.activity_uuid,
    full_text: record.full_text
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    activity_uuid: req.body.activity_id,
    full_text: req.body.full_text
  };

  let ids = req.db.prepare( `
    SELECT
      Activity.id AS "activity_id",
      Developer.id AS "developer_id"
    FROM
      Activity,
      Developer
    WHERE
      Activity.uuid = ? AND
      Developer.uuid = ?
  ` )
  .get(
    record.activity_uuid,
    record.developer_uuid
  );
  record.activity_id = ids.activity_id;
  record.developer_id = ids.developer_id;

  let info = req.db.prepare( `
    UPDATE DeveloperNote
    SET 
      updated_at = ?,
      developer_id = ?,
      activity_id = ?,
      full_text = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.activity_id,
    record.full_text,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      DeveloperNote.uuid AS "id",
      DeveloperNote.created_at, 
      DeveloperNote.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      DeveloperNote.full_text
    FROM 
      Activity,
      Developer,
      DeveloperNote
    WHERE 
      DeveloperNote.activity_id = Activity.id AND
      DeveloperNote.developer_id = Developer.id AND
      DeveloperNote.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM DeveloperNote
    WHERE DeveloperNote.uuid = ?
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
