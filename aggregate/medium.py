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

# List of Medium accounts
req = requests.get( api + '/medium' )
mediums = req.json()

for medium in mediums:
  # How long since updated
  updated = iso8601.parse_date( medium['updated_at'] ) 
  now = datetime.now( timezone.utc )
  duration = now - updated
  days = duration.days

  # Update account statistics
  # If not updated in some time
  if days > 7:
    # Get latest account statistics
    req = requests.post( api + '/medium/statistics', json = {
      'user_name': medium['user_name']
    } )
    statistics = req.json()

    # Update statistics
    medium['following'] = statistics['following']
    medium['followed_by'] = statistics['followed_by']

    # Update account in database
    req = requests.put( api + '/medium/id/' + medium['id'], json = medium )
    info = req.json()

    print( 'Acct: ' + info['id'] )    

  # Parse feed (RSS/ATOM)
  print( 'Load: ' + medium['id'] )
  feed = feedparser.parse( 'https://medium.com/feed/@' + medium['user_name'] )

  # Look at each entry
  for entry in feed['entries']:

    # ISO published date
    published = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['published_parsed'] )

    # Formalize entity
    record = {
      'medium_id': medium['id'],
      'published_at': published,
      'guid': entry['id'],
      'link': entry['link'],
      'title': entry['title'],
      'summary': entry['summary'],
      'claps': 0,
      'category': None,
      'keywords': None,
      'concepts': None,
      'entities': None
    }

    # Check database
    req = requests.post( api + '/medium/post/guid', json = {
      'url': record['guid']
    } )
    matches = req.json()

    # Does not exist
    if matches == None:
      # Get claps count
      req = requests.post( api + '/medium/post/claps', json = {
        'url': record['link']
      } )
      reactions = req.json()

      # Populate claps
      record['claps'] = reactions['claps']

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
      req = requests.post( api + '/medium/post', json = record )
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
        # Load current claps
        req = requests.post( api + '/medium/post/claps', json = {
          'url': matches['link']
        } )
        reactions = req.json()

        # Map differences
        matches['claps'] = reactions['claps']

        # Update database
        req = requests.put( api + '/medium/post/id/' + matches['id'], json = matches )
        
        print( 'Edit: ' + matches['id'] )
      else:
        print( 'None: ' + matches['id'] )
