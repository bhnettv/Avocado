const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {developer_note: 'Test'} );
} );

// Read all notes for given developer
router.get( '/developer/:id', ( req, res ) => {
  let notes = req.db.prepare( `
    SELECT
      Note.uuid AS "id",
      Note.created_at, 
      Note.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      Activity.name AS "activity_name",
      Note.full_text
    FROM 
      Activity,
      Developer,
      Note
    WHERE 
      Note.activity_id = Activity.id AND
      Note.developer_id = Developer.id AND
      Developer.uuid = ?
    ORDER BY Note.updated_at DESC
  ` )
  .all(
    req.params.id
  );

  res.json( notes );
} );

// Read single notes by ID
router.get( '/:id', ( req, res ) => {
  let note = req.db.prepare( `
    SELECT
      Note.uuid AS "id",
      Note.created_at, 
      Note.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      Note.full_text
    FROM 
      Activity,
      Developer,
      Note
    WHERE 
      Note.activity_id = Activity.id AND
      Note.developer_id = Developer.id AND
      Note.uuid = ?
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
      Note.uuid AS "id",
      Note.created_at, 
      Note.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      Note.full_text
    FROM 
      Activity,
      Developer,
      Note
    WHERE 
      Note.activity_id = Activity.id AND
      Note.developer_id = Developer.id
    ORDER BY Note.updated_at DESC
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
      Activity.name AS "activity_name",
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
  record.activity_name = ids.activity_name;
  record.developer_id = ids.developer_id;

  let info = req.db.prepare( `
    INSERT INTO Note
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
    activity_name: record.activity_name,
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
    UPDATE Note
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
      Note.uuid AS "id",
      Note.created_at, 
      Note.updated_at,
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      Note.full_text
    FROM 
      Activity,
      Developer,
      Note
    WHERE 
      Note.activity_id = Activity.id AND
      Note.developer_id = Developer.id AND
      Note.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Note
    WHERE Note.uuid = ?
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
