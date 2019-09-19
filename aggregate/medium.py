from datetime import datetime, timezone

import base64
import configparser
import feedparser
import iso8601
import requests
import time

import utility

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
    # Start by getting account page
    req = requests.get( 'https://medium.com/@' + medium['user_name'] )

    FOLLOWING = 'followingCount":'
    FOLLOWED = 'followerCount":'

    # Parse following
    start = req.text.find( FOLLOWING ) + len( FOLLOWING )
    end = req.text.find( ',', start )
    medium['following'] = int( req.text[start:end] )
  
    # Parse followed by
    start = req.text.find( FOLLOWED ) + len( FOLLOWED )
    end = req.text.find( ',', start )
    medium['followed_by'] = int( req.text[start:end] )

    # Update account in database
    req = requests.put( api + '/medium/' + medium['id'], json = medium )
    info = req.json()

    print( 'Acct: ' + info['id'] )    

  # Parse feed (RSS/ATOM)
  print( 'Load: ' + medium['id'] )
  feed = feedparser.parse( 'https://medium.com/feed/@' + medium['user_name'] )

  # Look at each entry
  for entry in feed['entries']:
    # Medium includes comments as feed items
    # Comments will not have category tags
    # Disregard comments
    # TODO: Store in separate table?
    if 'tags' not in entry:
      print( 'Said: ' + entry['link'][0:36] )
      continue

    # Article not on Medium proper
    if entry['link'].find( 'medium.com' ) < 0:
      print( 'Nope: ' + entry['link'][0:36] )
      continue

    # Formalize entity
    record = {
      'medium_id': medium['id'],
      'published_at': None,
      'guid': entry['id'],
      'link': entry['link'],
      'title': entry['title'],
      'summary': entry['summary'],
      'claps': 0,
      'category': [],
      'keywords': [],
      'concepts': [],
      'entities': []
    }

    # Categories
    if 'tags' in entry:
      for tag in entry['tags']:
        record['category'].append( tag.term )

    # ISO published date
    record['published_at'] = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['published_parsed'] )

    # Check database
    encoded = base64.urlsafe_b64encode( record['guid'].encode( 'utf-8' ) )
    req = requests.get( api + '/medium/post/guid/' + str( encoded, 'utf-8' ) )        
    matches = req.json()

    # How to find claps value
    CLAPS = 'clapCount":'

    # Does not exist
    if matches == None:
      # Get claps count
      # Start by getting article page
      req = requests.get( record['link'] )

      # Parse claps value
      start = req.text.find( CLAPS ) + len( CLAPS )
      end = req.text.find( ',', start )
      part = req.text[start:end]

      # Populate claps
      record['claps'] = int( part )

      # Analyze content
      # Optional feature
      if config['WATSON'].getboolean( 'Language' ) == True:
        encoded = base64.urlsafe_b64encode( record['link'].encode( 'utf-8' ) )
        req = requests.get( api + '/watson/language/' + str( encoded, 'utf-8' ) )
        language = req.json()
        
        record['keywords'] = language['keywords']
        record['concepts'] = language['concepts']
        record['entities'] = language['entities']

      # Create post
      req = requests.post( api + '/medium/post', json = record )
      insert = req.json()

      # Extract unique images
      # Analyze if needed
      # Store new images 
      # Make associations with post
      utility.unique_images( 
        insert['link'], 
        'medium', 
        insert['id'], 
        config['WATSON'].getboolean( 'Vision' ) 
      )      

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
        # Start by getting article page
        req = requests.get( record['link'] )

        start = req.text.find( CLAPS ) + len( CLAPS )
        end = req.text.find( ',', start )
        part = req.text[start:end]

        # Update claps
        matches['claps'] = int( part )

        # Update database
        req = requests.put( api + '/medium/post/' + matches['id'], json = matches )
        
        print( 'Edit: ' + matches['id'] )
      else:
        print( 'None: ' + matches['id'] )
