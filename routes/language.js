const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {language: 'Test'} );
} );

// Read single language by ID
router.get( '/:id', ( req, res ) => {
  let language = req.db.prepare( `
    SELECT
      Language.uuid AS "id",
      Language.created_at, 
      Language.updated_at,
      Language.name
    FROM Language
    WHERE Language.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( language === undefined ) {
    language = null;
  }

  res.json( language );
} );

// Search for languages with a given start
router.get( '/name/:prefix', ( req, res ) => {
  let languages = req.db.prepare( `
    SELECT
      Language.uuid AS "id",
      Language.created_at, 
      Language.updated_at,
      Language.name
    FROM 
    Language
    WHERE
    Language.name LIKE ?
  ` )
  .all( 
    req.params.prefix + '%'
  );

  if( languages === undefined ) {
    languages = null;
  }

  res.json( languages );
} );

// Languages a given developer speaks
router.get( '/developer/:id', ( req, res ) => {
  let languages = req.db.prepare( `
    SELECT
      Language.uuid AS "id",
      Language.created_at, 
      Language.updated_at,
      Language.name
    FROM 
      Developer,
      DeveloperLanguage,
      Language
    WHERE
      Developer.uuid = ? AND
      Developer.id = DeveloperLanguage.developer_id AND
      DeveloperLanguage.language_id = Language.id
  ` )
  .all( 
    req.params.id 
  );

  if( languages === undefined ) {
    languages = null;
  }

  res.json( languages );
} );

// Read all languages
// Include how many developers speak each
router.get( '/', ( req, res ) => {
  let languages = req.db.prepare( `
    SELECT 
      Language.uuid AS "id", 
      Language.created_at,
      Language.updated_at,
      Language.name,
      COUNT( DeveloperLanguage.id ) AS "count"
    FROM Language
    LEFT JOIN DeveloperLanguage ON Language.id = DeveloperLanguage.language_id
    GROUP BY Language.id
    ORDER BY Language.name ASC
  ` )
  .all();

  res.json( languages );
} );

// Associate language with developer
router.post( '/:language/developer/:developer', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    language_uuid: req.params.language
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Language.id AS "language_id"
    FROM
      Developer,
      Language
    WHERE
      Developer.uuid = ? AND
      Language.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.language_uuid
  );
  record.developer_id = ids.developer_id;
  record.language_id = ids.language_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperLanguage
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.language_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    language_id: record.language_uuid
  } );
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

  let existing = req.db.prepare( `
    SELECT 
      Language.uuid AS "id",
      Language.created_at,
      Language.updated_at,
      Language.name
    FROM Language
    WHERE Language.name = ?
  ` )
  .get( record.name );

  if( existing === undefined ) {
    let info = req.db.prepare( `
      INSERT INTO Language
      VALUES ( ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.name
    );

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      name: record.name
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
    name: req.body.name
  };

  let info = req.db.prepare( `
    UPDATE Language
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
      Language.uuid AS "id",
      Language.created_at, 
      Language.updated_at,
      Language.name
    FROM Language
    WHERE Language.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Language
    WHERE Language.uuid = ?
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
