const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {team: 'Test'} );
} );

// Read single team by ID
router.get( '/:id', ( req, res ) => {
  let team = req.db.prepare( `
    SELECT
      Team.uuid AS "id",
      Team.created_at, 
      Team.updated_at,
      Team.name
    FROM Team
    WHERE Team.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( team === undefined ) {
    team = null;
  }

  res.json( team );
} );

// Read all teams
router.get( '/', ( req, res ) => {
  let teams = req.db.prepare( `
    SELECT
      Team.uuid AS "id",
      Team.created_at, 
      Team.updated_at,
      Team.name
    FROM Team
  ` )
  .all();

  res.json( teams );
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
    INSERT INTO Team
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

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Team
    WHERE Team.uuid = ?
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
