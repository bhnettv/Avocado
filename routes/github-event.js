const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {github_event: 'Test'} );
} );

// Read single GitHub event by ID
router.get( '/:id', ( req, res ) => {
  let event = req.db.prepare( `
    SELECT
      GitHubEvent.uuid AS "id",
      GitHubEvent.created_at,
      GitHubEvent.updated_at,
      GitHub.uuid AS "github_id",
      GitHubEvent.published_at,
      GitHubEvent.event,
      GitHubEvent.event_name,
      GitHubEvent.repository,
      GitHubEvent.repository_name
    FROM 
      GitHub,
      GitHubEvent
    WHERE 
      GitHubEvent.github_id = GitHub.id AND
      GitHubEvent.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( event === undefined ) {
    event = null;
  }

  res.json( event );
} );

// Read single event by GitHub ID
router.get( '/id/:id', ( req, res ) => {
  let event = req.db.prepare( `
    SELECT
      GitHubEvent.uuid AS "id",
      GitHubEvent.created_at,
      GitHubEvent.updated_at,
      GitHub.uuid AS "github_id",
      GitHubEvent.published_at,
      GitHubEvent.event,
      GitHubEvent.event_name,
      GitHubEvent.repository,
      GitHubEvent.repository_name
    FROM 
      GitHub,
      GitHubEvent
    WHERE 
      GitHubEvent.github_id = GitHub.id AND
      GitHubEvent.event = ?
  ` )
  .get( 
    req.params.id
  );

  if( event === undefined ) {
    event = null;
  }

  res.json( event );
} );

// Read all events
router.get( '/', ( req, res ) => {
  let events = req.db.prepare( `
    SELECT
      GitHubEvent.uuid AS "id",
      GitHubEvent.created_at,
      GitHubEvent.updated_at,
      GitHub.uuid AS "github_id",
      GitHubEvent.published_at,
      GitHubEvent.event,
      GitHubEvent.event_name,
      GitHubEvent.repository,
      GitHubEvent.repository_name
    FROM 
      GitHub,
      GitHubEvent
    WHERE GitHubEvent.github_id = GitHub.id
    ORDER BY GitHubEvent.published_at DESC
  ` )
  .all();

  res.json( events );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    github_uuid: req.body.github_id,
    published_at: req.body.published_at,
    event: req.body.event,
    event_name: req.body.event_name,
    repository: req.body.repository,
    repository_name: req.body.repository_name
  };

  let github = req.db.prepare( `
    SELECT GitHub.id
    FROM GitHub
    WHERE GitHub.uuid = ?
  ` )
  .get( 
    record.github_uuid
  );
  record.github_id = github.id;

  let info = req.db.prepare( `
    INSERT INTO GitHubEvent
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.github_id,
    record.published_at,
    record.event,
    record.event_name,
    record.repository,
    record.repository_name
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    github_id: record.github_uuid,
    published_at: record.published_at,
    event: record.event,
    event_name: record.event_name,
    repository: record.repository,
    repository_name: record.repository_name
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    github_uuid: req.body.github_id,
    published_at: req.body.published_at,
    event: req.body.event,
    event_name: req.body.event_name,
    repository: req.body.repository,
    repository_name: req.body.repository_name
  };

  let github = req.db.prepare( `
    SELECT GitHub.id
    FROM GitHub
    WHERE GitHub.uuid = ?
  ` )
  .get( 
    record.github_uuid
  );
  record.github_id = github.id;

  let info = req.db.prepare( `
    UPDATE GitHubEvent
    SET 
      updated_at = ?,
      github_id = ?,
      published_at = ?,
      event = ?,
      event_name = ?,
      repository = ?,
      repository_name = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.github_id,
    record.published_at,
    record.event,
    record.event_name,
    record.repository,
    record.repository_name,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      GitHubEvent.uuid AS "id",
      GitHubEvent.created_at,
      GitHubEvent.updated_at,
      GitHub.uuid AS "github_id",
      GitHubEvent.published_at,
      GitHubEvent.event,
      GitHubEvent.event_name,
      GitHubEvent.repository,
      GitHubEvent.repository_name
    FROM 
      GitHub,
      GitHubEvent
    WHERE 
      GitHubEvent.github_id = GitHub.id AND
      GitHubEvent.uuid = ?
  ` )
  .get( 
    record.uuid 
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM GitHubEvent
    WHERE GitHubEvent.uuid = ?
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
