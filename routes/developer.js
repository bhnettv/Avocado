const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {developer: 'Test'} );
} );

// Read single developer by ID
router.get( '/id/:id', ( req, res ) => {
  let developer = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.first,
      Developer.last,
      Developer.nickname,
      Developer.email,
      Developer.notes
    FROM 
      Developer
    WHERE 
      Developer.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( developer === undefined ) {
    developer = null;
  }

  res.json( developer );
} );

// Read developers by label
router.get( '/label/:id', ( req, res ) => {
  let developers = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.first,
      Developer.last,
      Developer.nickname,
      Developer.email,
      Developer.notes
    FROM 
      Developer,
      DeveloperLabel,
      Label
    WHERE 
      Developer.id = DeveloperLabel.developer_id AND
      DeveloperLabel.label_id = Label.id AND
      Label.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  if( developers === undefined ) {
    developers = null;
  }

  res.json( developers );
} );

// Read all developers
router.get( '/', ( req, res ) => {
  let developers = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.first,
      Developer.last,
      Developer.nickname,
      Developer.email,
      Developer.notes
    FROM 
      Developer
    ORDER BY last ASC
  ` )
  .all();

  res.json( developers );
} );

// Associate developer with label
router.post( '/:developer/label/:label', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    label_uuid: req.params.label
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Label.id AS "label_id"
    FROM
      Developer,
      Label
    WHERE
      Developer.uuid = ? AND
      Label.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.label_uuid
  );
  record.developer_id = ids.developer_id;
  record.label_id = ids.label_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperLabel
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.label_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    label_id: record.label_uuid
  } );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    first: req.body.first,
    last: req.body.last,
    nickname: req.body.nickname,
    email: req.body.email,
    notes: req.body.notes
  };

  let info = req.db.prepare( `
    INSERT INTO Developer
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.first,
    record.last,
    record.nickname,
    record.email,
    record.notes
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    first: record.first,
    last: record.last,
    nickname: record.nickname,
    email: record.email,
    notes: record.notes
  } );
} );

// Update
router.put( '/id/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    first: req.body.first,
    last: req.body.last,
    nickname: req.body.nickname,
    email: req.body.email,
    notes: req.body.notes
  };

  let info = req.db.prepare( `
    UPDATE Developer
    SET 
      updated_at = ?,
      first = ?,
      last = ?,
      nickname = ?,
      email = ?,
      notes = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.first,
    record.last,
    record.nickname,
    record.email,
    record.notes,
    record.uuid
  );

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
    first: record.first,
    last: record.last,
    nickname: record.nickname,
    email: record.email,
    notes: record.notes
  } );  
} );

// Remove developer from label
router.delete( '/:developer/label/:label', ( req, res ) => {
  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Label.id AS "label_id"
    FROM
      Developer,
      Label
    WHERE
      Developer.uuid = ? AND
      Label.uuid = ?    
  ` )
  .get( 
    req.params.developer,
    req.params.label
  );

  let info = req.db.prepare( `
    DELETE FROM DeveloperLabel
    WHERE 
      DeveloperLabel.developer_id = ? AND
      DeveloperLabel.label_id = ?
  ` )
  .run(
    ids.developer_id,
    ids.label_id
  );  

  res.json( {
    developer_id: req.params.developer,
    label_id: req.params.label
  } );
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Developer
    WHERE Developer.uuid = ?
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
