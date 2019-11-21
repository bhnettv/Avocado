<script>
// import moment from 'moment-twitter';

export let title = null;
export let body = null;
export let published = null;
export let forward = null;
export let mark = null;
export let other = null;
export let type = null;

function doShorten( text ) {
  if( text.length > 280 ) {
    text = text.trim().substring( 0, 280 );
    let end = text.lastIndexOf( '.' ) + 1;
    text = text.substring( 0, end );
  }
  
  return text;
}
</script>

<style>
p.content {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 4px 16px 0 0;
  padding: 0;
}

p.ratings {
  background: none;
  background-position: center left;
  background-repeat: no-repeat;
  background-size: 18px 21px;
  color: #a8a8a8;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  padding: 0 0 0 22px;  
}

p.stamp {
  color: #a8a8a8;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 8px 16px 0 0;
  padding: 0;
}

p.title {
  color: #393939;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin: 8px 8px 0 0;
  padding: 0;  
  overflow: hidden;
}

p.ratings.accepted {
  background-image: url( /img/accepted.svg );  
}

p.ratings.favorite {
  background-image: url( /img/favorite.svg );  
  margin-left: 16px;
}

p.ratings.repeat {
  background-image: url( /img/repeat.svg );  
}

p.ratings.score {
  background-image: url( /img/star.svg );  
  margin-left: 16px;  
}

p.ratings.views {
  background-image: url( /img/views.svg );  
  margin-left: 16px;  
}

div.channel {
  background: none;
  background-color: #393939;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px 20px;
  border-radius: 36px;
  height: 36px;
  min-height: 36px;
  min-width: 36px;
  margin: 8px 8px 8px 8px;
  width: 36px;
}

div.channel.blog {
  background-color: #d67a35;
  background-image: url( /img/blog.svg );  
}

div.channel.dev {
  background-image: url( /img/dev-to.svg );  
  background-size: 28px;
}

div.channel.github {
  background-image: url( /img/github.svg );  
  background-size: 26px;
}

div.channel.medium {
  background-image: url( /img/medium.svg );  
  background-size: 28px;
}

div.channel.so {
  background-color: #d67a35;
  background-image: url( /img/so.svg );  
  background-size: 16px;
}

div.channel.twitter {
  background-color: #4ca0ec;
  background-image: url( /img/twitter.svg );  
  background-size: 16px;
}

div.details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

div.tile {
  background-color: white;
  display: flex;
  flex-direction: row;
  max-width: 300px;
}
</style>

<div class="tile">
  <div 
    class="channel" 
    class:blog="{type === 'blog' ? true : false}"
    class:dev="{type === 'dev' ? true : false}"
    class:github="{type === 'github' ? true : false}"    
    class:medium="{type === 'medium' ? true : false}"
    class:so="{type === 'so' ? true : false}"
    class:twitter="{type === 'twitter' ? true : false}">
  </div>
  <div class="details">
    <div class="tile">
      {#if title !== null}
        <p class="title">{title}</p>
      {:else}
        <p class="title"></p>
      {/if}
      <!-- <p class="stamp">{moment( moment() - moment( published ) ).twitterShort()}</p> -->
      <p class="stamp">1d</p>
    </div>
    {#if body !== null}
      <p class="content">{doShorten( body )}</p>
    {/if}
    <div class="tile" style="display: flex; flex-direction: row; margin-bottom: 8px; margin-top: 8px;">            
      {#if type === 'dev'}
        <p class="ratings favorite" style="margin-left: 0;">{forward}</p>
        <p class="ratings views">{mark}</p>
        <p class="ratings score">{other}</p>      
      {/if}
      {#if type === 'medium'}
        <p class="ratings score">{forward}</p>      
      {/if}
      {#if type === 'so'}
        <p class="ratings accepted">{forward}</p>
        <p class="ratings score">{mark}</p>
        <p class="ratings views">{other}</p>      
      {/if} 
      {#if type === 'twitter'}     
        <p class="ratings repeat">{forward}</p>
        <p class="ratings favorite">{mark}</p>      
      {/if}
      {#if type === 'youtube'}
        <p class="ratings views">{forward}</p>
        <p class="ratings score">{mark}</p>      
      {/if}
    </div>
  </div>
</div>
