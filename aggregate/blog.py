import base64
import configparser
import feedparser
import requests
import time

# Optional features
config = configparser.ConfigParser()
config.read( '../features.ini' )

api = 'http://localhost:8000/api'

# List of blogs
req = requests.get( api + '/blog' )
blogs = req.json()

for blog in blogs:
  # Parse feed (RSS/ATOM)
  print( 'Load: ' + blog['id'] )
  feed = feedparser.parse( blog['feed'] )

  # Look at each entry
  for entry in feed['entries']:
    # Categories
    categories = None

    if 'tags' in entry:
      categories = []

      for tag in entry['tags']:
        categories.append( tag.term )

      categories = ','.join( categories )

    # ISO published date
    # Not all feed use published field
    # Some use updated field
    if 'published_parsed' in entry:
      published = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['published_parsed'] )
    else:
      published = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['updated_parsed'] )

    # Formalize entity
    record = {
      'blog_id': blog['id'],
      'published_at': published,
      'guid': entry['id'],
      'link': entry['link'],
      'title': entry['title'],
      'summary': entry['summary'],
      'views': 0,
      'category': categories,
      'keywords': None,
      'concepts': None,
      'entities': None
    }

    # Check database
    encoded = base64.urlsafe_b64encode( record['guid'].encode( 'utf-8' ) )
    req = requests.get( api + '/blog/post/guid/' + str( encoded, 'utf-8' ) )
    matches = req.json()

    # Does not exist
    if matches == None:
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
      req = requests.post( api + '/blog/post', json = record )
      insert = req.json()

      # Extract unique images
      # Once per presence in content
      # Not in the database
      encoded = base64.urlsafe_b64encode( record['link'].encode( 'utf-8' ) ) 
      req = requests.get( api + '/utility/images', params = {
        'url': str( encoded, 'utf-8' )
      } )
      images = req.json()

      for image in images:
        record = {
          'url': image,
          'keywords': None
        }

        # Analyze image
        # Optional feature
        if config['WATSON'].getboolean( 'Vision' ) == True:
          req = requests.post( api + '/watson/recognition', json = {
            'url': record['url']
          } )
          vision = req.json()
          
          record['keywords'] = None if len( vision['keywords'] ) == 0 else vision['keywords']

        # Create media record
        req = requests.post( api + '/media', json = record )
        media = req.json()

        # Associate with post
        req = requests.post( api + '/blog/post/' + insert['id'] + '/media/' + media['id'] )
        associate = req.json()

      print( 'Make: ' + insert['id'] )
    else:
      print( 'None: ' + matches['id'] )
