Consumer off-the-shelf (COTS) developer relations tooling.

Install

    # Python 3+
    # Node.js 12+
    pip install -r requirements.txt
    npm install

Configure

- ESRI ArcGIS key
- Google YouTube API key
- Twitter key
- Twitter secret
- Stack Apps application key
- GitHub access token
- IBM Watson NLU key (optional)
- IBM Watson Video key (optional)

Start

    npm run start

Manage

    http://localhost:3000

Populate

- Add some developers
- Add endpoints for each developer
  - Blog
  - Dev.to
  - Medium
  - YouTube
  - Twitter
  - Stack Overflow
  - GitHub
  - Reddit (beta)
- Add some repositories to monitor
  - Code samples
  - SDKs
  - Open source projects

Aggregate

    python blog.py
    python dev.py
    python medium.py
    python youtube.py
    python twitter.py
    python so.py
    python github.py
    python reddit.py
    python repository.py

Pieces-Parts

- SQLite data storage (file)
- Node.js/Express API surface
- Swagger/OAS API documentation
- Python content aggregators
- Svelte web application
- Watson image classification
- Watson language understanding
- ArcGIS mapping on the client
- ArcGIS geocoding on the server
