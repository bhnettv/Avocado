const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {github: 'Test'} );
} );

// Read activity (events) for a given login
// Part of API surface due to authentication
router.get( '/activity/:login', async ( req, res ) => {
  let events = await rp( {
    url: `https://api.github.com/users/${req.params.login}/events/public`,
    headers: {
      'User-Agent': 'IBM Developer'
    },
    method: 'GET',
    qs: {
      access_token: req.config.github.access_token
    },
    json: true      
  } );

  res.json( events );
} );

// Read single GitHub account by ID
router.get( '/:id', ( req, res ) => {
  let github = req.db.prepare( `
    SELECT
      GitHub.uuid AS "id",
      GitHub.created_at, 
      GitHub.updated_at,
      Developer.uuid AS "developer_id",
      GitHub.login,
      GitHub.name,
      GitHub.name,
      GitHub.company,
      GitHub.blog,
      GitHub.location,
      GitHub.email,
      GitHub.hireable,
      GitHub.repositories,
      GitHub.gists,
      GitHub.followers,
      GitHub.following,
      GitHub.disk,
      GitHub.collaborators
    FROM 
      Developer, 
      GitHub
    WHERE 
      GitHub.developer_id = Developer.id AND
      GitHub.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( github === undefined ) {
    github = null;
  }

  res.json( github );
} );

// Read all GitHub accounts
router.get( '/', ( req, res ) => {
  let githubs = req.db.prepare( `
    SELECT
      GitHub.uuid AS "id",
      GitHub.created_at, 
      GitHub.updated_at,
      Developer.uuid AS "developer_id",
      GitHub.login,
      GitHub.name,
      GitHub.name,
      GitHub.company,
      GitHub.blog,
      GitHub.location,
      GitHub.email,
      GitHub.hireable,
      GitHub.repositories,
      GitHub.gists,
      GitHub.followers,
      GitHub.following,
      GitHub.disk,
      GitHub.collaborators
    FROM 
      Developer,
      GitHub
    WHERE GitHub.developer_id = Developer.id
    ORDER BY datetime( GitHub.updated_at ) DESC
  ` )
  .all();

  res.json( githubs );
} );

// Create
router.post( '/', async ( req, res ) => {
  let profile = await rp( {
    url: `https://api.github.com/users/${req.body.login}`,
    method: 'GET',
    headers: {
      'User-Agent': 'IBM Developer'
    },
    qs: {
      access_token: req.config.github.access_token
    },
    json: true
  } );

  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    login: profile.login,
    name: profile.name,
    company: profile.company,
    blog: profile.blog,
    location: profile.location,
    email: profile.email,
    hireable: profile.hireable === null ? 0 : 1,
    repositories: profile.public_repos,
    gists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    disk: !profile.disk_usage ? 0 : profile.disk_usage,
    collaborators: !profile.collaborators ? 0 : profile.collaborators
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
    INSERT INTO GitHub
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.login,
    record.name,
    record.company,
    record.blog,
    record.location,
    record.email,
    record.hireable,
    record.repositories,
    record.gists,
    record.followers,
    record.following,
    record.disk,
    record.collaborators
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    login: record.login,
    name: record.name,
    company: record.company,
    blog: record.blog,
    location: record.location,
    email: record.email,
    hireable: record.hireable,
    repositories: record.repositories,
    gists: record.gists,
    followers: record.followers,
    following: record.following,
    disk: record.disk,
    collaborators: record.collaborators
  } );
} );

// Update using API
router.patch( '/:id', async ( req, res ) => {
  let record = req.db.prepare( `
    SELECT
      GitHub.uuid AS "id",
      GitHub.created_at, 
      GitHub.updated_at,
      Developer.uuid AS "developer_id",
      GitHub.login,
      GitHub.name,
      GitHub.company,
      GitHub.blog,
      GitHub.location,
      GitHub.email,
      GitHub.hireable,
      GitHub.repositories,
      GitHub.gists,
      GitHub.followers,
      GitHub.following,
      GitHub.disk,
      GitHub.collaborators
    FROM 
      Developer, 
      GitHub
    WHERE 
      GitHub.developer_id = Developer.id AND
      GitHub.uuid = ?
  ` )
  .get( 
    req.params.id
  );

  let profile = await rp( {
    url: `https://api.github.com/users/${record.login}`,
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
  record.name = profile.name;
  record.company = profile.company;
  record.blog = profile.blog;
  record.location = profile.location;
  record.email = profile.email;
  record.hireable = profile.hireable === null ? 0 : 1;
  record.repositories = profile.public_repos;
  record.gists = profile.public_gists;
  record.followers = profile.followers;
  record.following = profile.following;
  record.disk = !profile.disk_usage ? 0 : profile.disk_usage;
  record.collaborators = !profile.collaborators ? 0 : profile.collaborators;

  let info = req.db.prepare( `
    UPDATE GitHub
    SET 
      updated_at = ?,
      name = ?,
      company = ?,
      blog = ?,
      location = ?,
      email = ?,
      hireable = ?,
      repositories = ?,
      gists = ?,
      followers = ?,
      following = ?,
      disk = ?,
      collaborators = ?
    WHERE login = ?
  ` )
  .run(
    record.updated_at,
    record.name,
    record.company,
    record.blog,
    record.location,
    record.email,
    record.hireable,
    record.repositories,
    record.gists,
    record.followers,
    record.following,
    record.disk,
    record.collaborators,
    record.login
  );  

  res.json( record );    
} );

// Update directly
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    login: req.body.login,
    name: req.body.name,
    company: req.body.company,
    blog: req.body.blog,
    location: req.body.location,
    email: req.body.email,
    hireable: req.body.hireable,
    repositories: req.body.repositories,
    gists: req.body.gists,
    followers: req.body.followers,
    following: req.body.following,
    disk: req.body.disk,
    collaborators: req.body.collaborators
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
    UPDATE GitHub
    SET 
      updated_at = ?,
      developer_id = ?,
      login = ?,
      name = ?,
      company = ?,
      blog = ?,
      location = ?,
      email = ?,
      hireable = ?,
      repositories = ?,
      gists = ?,
      followers = ?,
      following = ?,
      disk = ?,
      collaborators = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.login,
    record.name,
    record.company,
    record.blog,
    record.location,
    record.email,
    record.hireable,
    record.repositories,
    record.gists,
    record.followers,
    record.following,
    record.disk,
    record.collaborators,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      GitHub.uuid AS "id",
      GitHub.created_at, 
      GitHub.updated_at,
      Developer.uuid AS "developer_id",
      GitHub.login,
      GitHub.name,
      GitHub.name,
      GitHub.company,
      GitHub.blog,
      GitHub.location,
      GitHub.email,
      GitHub.hireable,
      GitHub.repositories,
      GitHub.gists,
      GitHub.followers,
      GitHub.following,
      GitHub.disk,
      GitHub.collaborators
    FROM 
      Developer, 
      GitHub
    WHERE 
      GitHub.developer_id = Developer.id AND
      GitHub.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM GitHub
    WHERE GitHub.uuid = ?
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
