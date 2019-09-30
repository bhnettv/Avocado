const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {repository: 'Test'} );
} );

// Read single repository by ID
router.get( '/:id', ( req, res ) => {
  let repo = req.db.prepare( `
    SELECT
      Repository.uuid AS "id",
      Repository.created_at, 
      Repository.updated_at,
      Repository.repository,
      Repository.name,
      Repository.full_name,
      Repository.description,
      Repository.is_fork,
      Repository.started_at,
      Repository.pushed_at,
      Repository.size,
      Repository.stargazers,
      Repository.watchers,
      Repository.forks,
      Repository.issues,
      Repository.network,
      Repository.subscribers
    FROM 
      Repository
    WHERE 
      Repository.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( repo === undefined ) {
    repo = null;
  } else {
    repo.is_fork = new Boolean( repo.is_fork );
  }

  res.json( repo );
} );

// Read all repositories
router.get( '/', ( req, res ) => {
  let repos = req.db.prepare( `
    SELECT
      Repository.uuid AS "id",
      Repository.created_at, 
      Repository.updated_at,
      Repository.repository,
      Repository.name,
      Repository.full_name,
      Repository.description,
      Repository.is_fork,
      Repository.started_at,
      Repository.pushed_at,
      Repository.size,
      Repository.stargazers,
      Repository.watchers,
      Repository.forks,
      Repository.issues,
      Repository.network,
      Repository.subscribers
    FROM 
      Repository
    ORDER BY name
  ` )
  .all();

  for( let r = 0; r < repos.length; r++ ) {
    repos[r].is_fork = new Boolean( repos[r].is_fork );    
  }

  res.json( repos );
} );

// Create
router.post( '/', async ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repository: null,
    name: null,
    full_name: req.body.full_name,
    description: null,
    is_fork: 0,
    started_at: null,
    pushed_at: null,
    size: 0,
    stargazers: 0,
    watchers: 0,
    forks: 0,
    issues: 0,
    network: 0,
    subscribers: 0
  };

  let existing = req.db.prepare( `
    SELECT
      Repository.uuid AS "id",
      Repository.created_at,
      Repository.updated_at,
      Repository.name,
      Repository.full_name,
      Repository.description,
      Repository.is_fork,
      Repository.started_at,
      Repository.pushed_at,
      Repository.size,
      Repository.stargazers,
      Repository.watchers,
      Repository.forks,
      Repository.issues,
      Repository.network,
      Repository.subscribers
    FROM Repository
    WHERE Repository.full_name = ?
  ` ).get(
    record.full_name
  );

  if( existing === undefined ) {
    let details = await rp( {
      url: `https://api.github.com/repos/${record.full_name}`,
      method: 'GET',
      headers: {
        'User-Agent': 'IBM Developer'
      },    
      qs: {
        access_token: req.config.github.access_token
      },
      json: true
    } );
  
    record.repository = details.id;
    record.name = details.name;
    record.description = details.description;
    record.is_fork = details.fork ? 1 : 0;
    record.started_at = new Date( details.created_at ).toISOString();
    record.pushed_at = new Date( details.pushed_at ).toISOString();
    record.size = details.size;
    record.stargazers = details.stargazers_count;
    record.watchers = details.watchers_count;
    record.forks = details.forks_count;
    record.issues = details.open_issues_count;
    record.network = details.network_count;
    record.subscribers = details.subscribers_count;
  
    let info = req.db.prepare( `
      INSERT INTO Repository
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.repository,
      record.name,
      record.full_name,
      record.description,
      record.is_fork,
      record.started_at,
      record.pushed_at,
      record.size,
      record.stargazers,
      record.watchers,
      record.forks,
      record.issues,
      record.network,
      record.subscribers
    );
  
    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      repository: record.repository,
      name: record.name,
      full_name: record.full_name,
      description: record.description,
      is_fork: new Boolean( record.is_fork ),
      started_at: record.started_at,
      pushed_at: record.pushed_at,
      size: record.size,
      stargazers: record.stargazers,
      watchers: record.watchers,
      forks: record.forks,
      issues: record.issues,
      network: record.network,
      subscribers: record.subscribers
    };
  } else {
    record = existing;
  }

  res.json( record );
} );

// Update using API
router.patch( '/:id', async ( req, res ) => {
  let record = req.db.prepare( `
    SELECT
      Repository.uuid AS "id",
      Repository.created_at, 
      Repository.updated_at,
      Repository.repository,
      Repository.name,
      Repository.full_name,
      Repository.description,
      Repository.is_fork,
      Repository.started_at,
      Repository.pushed_at,
      Repository.size,
      Repository.stargazers,
      Repository.watchers,
      Repository.forks,
      Repository.issues,
      Repository.network,
      Repository.subscribers
    FROM 
      Repository
    WHERE 
      Repository.uuid = ?
  ` )
  .get( 
    req.params.id
  );

  let details = await rp( {
    url: `https://api.github.com/repos/${record.full_name}`,
    method: 'GET',
    headers: {
      'User-Agent': 'IBM Developer'
    },    
    qs: {
      access_token: req.config.github.access_token
    },
    json: true
  } );

  record.updated_at = new Date().toISOString();
  record.description = details.description;
  record.is_fork = new Boolean( record.is_fork );
  record.pushed_at = new Date( details.pushed_at ).toISOString();
  record.size = details.size;
  record.stargazers = details.stargazers_count;
  record.watchers = details.watchers_count;
  record.forks = details.forks_count;
  record.issues = details.open_issues_count;
  record.network = details.network_count;
  record.subscribers = details.subscribers_count;

  let info = req.db.prepare( `
    UPDATE Repository
    SET 
      updated_at = ?,
      description = ?,
      pushed_at = ?,
      size = ?,
      stargazers = ?,
      watchers = ?,
      forks = ?,
      issues = ?,
      network = ?,
      subscribers = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.description,
    record.pushed_at,
    record.size,
    record.stargazers,
    record.watchers,
    record.forks,
    record.issues,
    record.network,
    record.subscribers,
    record.id
  );  

  res.json( record );    
} );

// Update directly
router.put( '/:id', ( req, res ) => {
  let record = {
    id: req.params.id,
    updated_at: new Date().toISOString(),
    repository: req.body.repository,
    name: req.body.name,
    full_name: req.body.full_name,
    description: req.body.description,
    is_fork: req.body.is_fork ? 1 : 0,
    started_at: req.body.started_at,
    pushed_at: req.body.pushed_at,
    size: req.body.size,
    stargazers: req.body.stargazers,
    watchers: req.body.watchers,
    forks: req.body.forks,
    issues: req.body.issues,
    network: req.body.network,
    subscribers: req.body.subscribers
  };

  let info = req.db.prepare( `
    UPDATE Repository
    SET 
      updated_at = ?,
      repository = ?,
      name = ?,
      full_name = ?,
      description = ?,
      is_fork = ?,
      started_at = ?,
      pushed_at = ?,
      size = ?,
      stargazers = ?,
      watchers = ?,
      forks = ?,
      issues = ?,
      network = ?,
      subscribers = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.repository,
    record.name,
    record.full_name,
    record.description,
    record.is_fork,
    record.started_at,
    record.pushed_at,
    record.size,
    record.stargazers,
    record.watchers,
    record.forks,
    record.issues,
    record.network,
    record.subscribers,
    record.id
  );

  record = req.db.prepare( `
    SELECT
      Repository.uuid AS "id",
      Repository.created_at, 
      Repository.updated_at,
      Repository.repository,
      Repository.name,
      Repository.full_name,
      Repository.description,
      Repository.is_fork,
      Repository.started_at,
      Repository.pushed_at,
      Repository.size,
      Repository.stargazers,
      Repository.watchers,
      Repository.forks,
      Repository.issues,
      Repository.network,
      Repository.subscribers
    FROM 
      Repository
    WHERE 
      Repository.uuid = ?
  ` )
  .get( 
    record.id
  );

  record.is_fork = new Boolean( record.is_fork );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Repository
    WHERE Repository.uuid = ?
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
