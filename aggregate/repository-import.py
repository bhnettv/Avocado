import requests

api = 'http://localhost:3000/api'

# List of repositories
req = requests.get( 'https://s3.us.cloud-object-storage.appdomain.cloud/cartographerstorage/patterns.json' )
patterns = req.json()

for pattern in patterns['patterns']:
  # Make sure on public GitHub
  # GitHub Enterprise requires different access token
  GITHUB = 'https://github.com/'
  start = pattern['repo'].find( GITHUB )
  
  if start == 0:
    start = start + len( GITHUB )
    full_name = pattern['repo'][start:]

    # Look for trailing slash
    # Do not want
    # Seems to be intermittent
    if full_name[len( full_name ) - 1:] == '/':
      full_name = full_name[0:len( full_name ) - 1]

    # Pattern in subfolder
    # Not repository proper
    # Cannot be tracked
    if full_name.find( '/master/' ) > 0:
      continue

    print( full_name )

    # Get details and save to database
    req = requests.post( api + '/repository', json = {
      'full_name': full_name
    } )
    repo = req.json()

    print( 'Make: ' + repo['id'] )
