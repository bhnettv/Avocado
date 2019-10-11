<script>
import { onMount } from 'svelte';

export let developers = [];

onMount( async () => {
  developers = await fetch( '/api/developer' )
  .then( ( response ) => response.json() );
} );
</script>

<style>
div.photo {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 16px;
  height: 32px;
  margin: 8px 0 0 16px;
  padding: 0;
  width: 32px;
}

h4 {
  background-color: #dcdcdc;
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  height: 48px;
  line-height: 48px;
  margin: 0;
  padding: 0 16px 0 16px;  
}

li {
  border-bottom: solid 1px transparent;
  border-top: solid 1px transparent;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 8px;  
}

ul {
  flex-basis: 0;
  flex-grow: 1;
  margin: 0;
  padding: 0;
  overflow-y: scroll;
}
</style>

<h4>Developers</h4>
<ul>

{#each developers as developer}
  <li>
    <div class="photo" style="background-image: url( {developer.image} );"></div>
    <p>{developer.name}</p>
  </li>
{/each}

</ul>
