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
  # No feed URL
  # No problem
  if blog['feed'] == None:
    continue

  # Parse feed (RSS/ATOM)
  print( 'Load: ' + blog['id'] )
  feed = feedparser.parse( blog['feed'] )

  # Look at each entry
  for entry in feed['entries']:
    # Formalize entity
    record = {
      'blog_id': blog['id'],
      'published_at': None,
      'guid': entry['id'],
      'link': entry['link'],
      'title': entry['title'],
      'summary': entry['summary'],
      'views': 0,
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
    # Not all feed use published field
    # Some use updated field
    if 'published_parsed' in entry:
      record['published_at'] = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['published_parsed'] )
    else:
      record['published_at'] = time.strftime( '%Y-%m-%dT%H:%M:%SZ', entry['updated_parsed'] )        

    # Check database
    encoded = base64.urlsafe_b64encode( record['guid'].encode( 'utf-8' ) )
    req = requests.get( api + '/blog/post/guid/' + str( encoded, 'utf-8' ) )
    match = req.json()

    # Does not exist
    if match == None:
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
      req = requests.post( api + '/blog/post', json = record )
      insert = req.json()

      # Extract unique images
      # Once per presence in content
      encoded = base64.urlsafe_b64encode( record['link'].encode( 'utf-8' ) ) 
      req = requests.get( api + '/utility/images/' + str( encoded, 'utf-8' ) )
      images = req.json()

      for image in images:
        record = {
          'url': image,
          'keywords': None
        }

        # Check if image exists in the database
        encoded = base64.urlsafe_b64encode( record['url'].encode( 'utf-8' ) ) 
        req = requests.get( api + '/media/url/' + str( encoded, 'utf-8' ) )
        media = req.json()

        if media == None:
          # Analyze image
          # Optional feature
          if config['WATSON'].getboolean( 'Vision' ) == True:
            encoded = base64.urlsafe_b64encode( record['url'].encode( 'utf-8' ) )           
            req = requests.get( api + '/watson/vision/' + str( encoded, 'utf-8' ) )
            record['keywords'] = req.json()

          # Create media records
          req = requests.post( api + '/media', json = record )
          media = req.json()

        # Associate with post
        req = requests.post( api + '/blog/post/' + insert['id'] + '/media', json = {
          'media_id': media['id']
        } )
        associate = req.json()

      print( 'Make: ' + insert['id'] )
    else:
      print( 'None: ' + match['id'] )
