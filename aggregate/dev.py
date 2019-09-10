from datetime import datetime, timezone

import configparser
import feedparser
import iso8601
import requests
import time

# Optional features
config = configparser.ConfigParser()
config.read( '../features.ini' )

api = 'http://localhost:8000/api'

# List of Dev accounts
req = requests.get( api + '/dev' )
devs = req.json()

for dev in devs:
  # Parse feed (RSS/ATOM)
  print( 'Load: ' + dev['id'] )
  feed = feedparser.parse( 'https://dev.to/feed/' + dev['user_name'] )

  # Look at each entry
  for entry in feed['entries']:

    # ISO published date
    published = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['published_parsed'] )

    # Formalize entity
    record = {
      'dev_id': dev['id'],
      'published_at': published,
      'guid': entry['id'],
      'link': entry['link'],
      'title': entry['title'],
      'summary': entry['summary'],
      'likes': 0,
      'reading': 0,
      'unicorn': 0,
      'keywords': None,
      'concepts': None,
      'entities': None
    }

    # Ignore empty entry
    if len( record['summary'].strip() ) == 0:
      continue

    # Check database
    req = requests.post( api + '/dev/post/guid', json = {
      'url': record['guid']
    } )
    matches = req.json()

    # Does not exist
    if matches == None:
      # Get reaction counts
      req = requests.post( api + '/dev/post/reactions', json = {
        'url': record['link']
      } )
      reactions = req.json()

      # Populate reactions
      record['likes'] = reactions['likes']
      record['reading'] = reactions['reading']
      record['unicorn'] = reactions['unicorn']      

      # Analyze content
      # Optional feature
      if config['WATSON'].getboolean( 'NLU' ) == True:
        req = requests.post( api + '/watson/nlu', json = {
          'url': record['link']
        } )
        nlu = req.json()
        
        record['keywords'] = None if len( nlu['keywords'] ) == 0 else nlu['keywords']
        record['concepts'] = None if len( nlu['concepts'] ) == 0 else nlu['concepts']
        record['entities'] = None if len( nlu['entities'] ) == 0 else nlu['entities']

      # Create post
      req = requests.post( api + '/dev/post', json = record )
      insert = req.json()

      print( 'Make: ' + insert['id'] )
    else:
      # How long since published
      published = iso8601.parse_date( matches['published_at'] ) 
      now = datetime.now( timezone.utc )
      duration = now - published
      days = duration.days

      # Only track for first 7-days
      # TODO: Check up in 30-day increments after
      if days < 7:
        # Load recent reactions
        req = requests.post( api + '/dev/post/reactions', json = {
          'url': matches['link']
        } )
        reactions = req.json()

        # Map differences
        matches['likes'] = reactions['likes']
        matches['reading'] = reactions['reading']
        matches['unicorn'] = reactions['unicorn']      

        # Update database
        req = requests.put( api + '/dev/post/id/' + matches['id'], json = matches )
        
        print( 'Edit: ' + matches['id'] )
      else:
        print( 'None: ' + matches['id'] )
