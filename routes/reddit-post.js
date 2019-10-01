const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {
  res.json( {reddit_post: 'Test'} );
} );

// Read single post by ID
router.get( '/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      RedditPost.uuid AS "id",
      RedditPost.created_at,
      RedditPost.updated_at,
      Reddit.uuid AS "reddit_id",
      RedditPost.published_at,
      RedditPost.guid,
      RedditPost.author,
      RedditPost.title,
      RedditPost.body,
      RedditPost.comments,
      RedditPost.score,
      RedditPost.ups,
      RedditPost.downs,
      RedditPost.parent,
      RedditPost.subreddit,
      RedditPost.owner,
      RedditPost.link
    FROM
      Reddit,
      RedditPost
    WHERE
      RedditPost.reddit_id = Reddit.id AND
      RedditPost.uuid = ?
  ` )
  .get(
    req.params.id
  );

  if( post === undefined ) {
    post = null;
  }

  res.json( post );
} );

// Read single post by GUID
// Technically Reddit post ID
router.get( '/guid/:id', ( req, res ) => {
  let post = req.db.prepare( `
    SELECT
      RedditPost.uuid AS "id",
      RedditPost.created_at,
      RedditPost.updated_at,
      Reddit.uuid AS "reddit_id",
      RedditPost.published_at,
      RedditPost.guid,
      RedditPost.author,
      RedditPost.title,
      RedditPost.body,
      RedditPost.comments,
      RedditPost.score,
      RedditPost.ups,
      RedditPost.downs,
      RedditPost.parent,
      RedditPost.subreddit,
      RedditPost.owner,
      RedditPost.link
    FROM
      Reddit,
      RedditPost
    WHERE
      RedditPost.reddit_id = Reddit.id AND
      RedditPost.guid = ?
  ` )
  .get(
    req.params.id
  );

  if( post === undefined ) {
    post = null;
  }

  res.json( post );
} );

// Read all posts
router.get( '/', ( req, res ) => {
  let posts = req.db.prepare( `
    SELECT
      RedditPost.uuid AS "id",
      RedditPost.created_at,
      RedditPost.updated_at,
      Reddit.uuid AS "reddit_id",
      RedditPost.published_at,
      RedditPost.guid,
      RedditPost.author,
      RedditPost.title,
      RedditPost.body,
      RedditPost.comments,
      RedditPost.score,
      RedditPost.ups,
      RedditPost.downs,
      RedditPost.parent,
      RedditPost.subreddit,
      RedditPost.owner,
      RedditPost.link
    FROM
      Reddit,
      RedditPost
    WHERE RedditPost.reddit_id = Reddit.id
    ORDER BY RedditPost.published_at DESC
  ` )
  .all();

  res.json( posts );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reddit_uuid: req.body.reddit_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    author: req.body.author,
    title: req.body.title,
    body: req.body.body,
    comments: req.body.comments,
    score: req.body.score,
    ups: req.body.ups,
    downs: req.body.downs,
    parent: req.body.parent,
    subreddit: req.body.subreddit,
    owner: req.body.owner,
    link: req.body.link
  };

  let reddit = req.db.prepare( `
    SELECT Reddit.id
    FROM Reddit
    WHERE Reddit.uuid = ?
  ` )
  .get(
    record.reddit_uuid
  );
  record.reddit_id = reddit.id;

  let info = req.db.prepare( `
    INSERT INTO RedditPost
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.reddit_id,
    record.published_at,
    record.guid,
    record.author,
    record.title,
    record.body,
    record.comments,
    record.score,
    record.ups,
    record.downs,
    record.parent,
    record.subreddit,
    record.owner,
    record.link
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    reddit_id: record.reddit_uuid,
    published_at: record.published_at,
    guid: record.guid,
    author: record.author,
    title: record.title,
    body: record.body,
    comments: record.comments,
    score: record.score,
    ups: record.ups,
    downs: record.downs,
    parent: record.parent,
    subreddit: record.subreddit,
    owner: record.owner,
    link: record.link
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    reddit_uuid: req.body.reddit_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    author: req.body.author,
    title: req.body.title,
    body: req.body.body,
    comments: req.body.comments,
    score: req.body.score,
    ups: req.body.ups,
    downs: req.body.downs,
    parent: req.body.parent,
    subreddit: req.body.subreddit,
    owner: req.body.owner,
    link: req.body.link
  };

  let reddit = req.db.prepare( `
    SELECT Reddit.id
    FROM Reddit
    WHERE Reddit.uuid = ?
  ` )
  .get(
    record.reddit_uuid
  );
  record.reddit_id = reddit.id;

  let info = req.db.prepare( `
    UPDATE RedditPost
    SET
      updated_at = ?,
      reddit_id = ?,
      published_at = ?,
      guid = ?,
      author = ?,
      title = ?,
      body = ?,
      comments = ?,
      score = ?,
      ups = ?,
      downs = ?,
      parent = ?,
      subreddit = ?,
      owner = ?,
      link = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.reddit_id,
    record.published_at,
    record.guid,
    record.author,
    record.title,
    record.body,
    record.comments,
    record.score,
    record.ups,
    record.downs,
    record.parent,
    record.subreddit,
    record.owner,
    record.link,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      RedditPost.uuid AS "id",
      RedditPost.created_at,
      RedditPost.updated_at,
      Reddit.uuid AS "reddit_id",
      RedditPost.published_at,
      RedditPost.guid,
      RedditPost.author,
      RedditPost.title,
      RedditPost.body,
      RedditPost.comments,
      RedditPost.score,
      RedditPost.ups,
      RedditPost.downs,
      RedditPost.parent,
      RedditPost.subreddit,
      RedditPost.owner,
      RedditPost.link
    FROM
      Reddit,
      RedditPost
    WHERE
      RedditPost.reddit_id = Reddit.id AND
      RedditPost.uuid = ?
  ` )
  .get(
    record.uuid
  );

  res.json( record );
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM RedditPost
    WHERE RedditPost.uuid = ?
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
