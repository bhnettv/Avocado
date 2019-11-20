<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Search from './Search.svelte';

export let hidden = true;

let average_watchers = 0;
let average_stars = 0;
let average_forks = 0;
let average_issues = 0;
let filtered = [];
let median_watchers = 0;
let median_stars = 0;
let median_forks = 0;
let median_issues = 0;
let repositories = [];
let search = '';
let updated_at = undefined;

function filter() {
 let trimmed = search.trim().toLowerCase();

  if( trimmed.length === 0 ) {
    filtered = repositories.slice();
  } else {
    let matches = [];

    for( let a = 0; a < repositories.length; a++ ) {
      if( repositories[a].name.toLowerCase().indexOf( trimmed ) >= 0 ) {
        matches.push( repositories[a] );
      }
    }

    filtered = matches.slice();
  }  
}

function format( stamp ) {
  stamp = new Date( stamp );

  let month = stamp.getMonth().toString().padStart( 2, '0' );
  let date = stamp.getDate().toString().padStart( 2, '0' );

  return `${month}/${date}/${stamp.getFullYear()}`;
}

function formatLong( updated ) {
  let hours = [
    12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  ];
  let months = [
    'January',   'February', 'March',    'April', 
    'May',       'June',     'July',     'August', 
    'September', 'October',  'November', 'December'
  ];

  updated = new Date( updated );

  return `As of ${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()} at ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )} ${updated.getHours() > 11 ? 'PM' : 'AM'}`;
}

function median( values ) {
  let result = values[Math.floor( values.length / 2 )];

  if( ( values.length % 2 ) === 0 ) {
    const low = values.length / 2;
    const high = low + 1;
    result = ( values[low] + values[high] ) / 2;
  }

  return result;
}

function numeric( a, b ) {
  if( a > b ) return 1;
  if( a < b ) return -1;
  return 0;
}

function doSearch( evt ) {
  console.log( search );
}

onMount( async () => {
  fetch( '/api/repository' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    data.sort( ( a, b ) => {
      if( a.name < b.name ) return -1;
      if( a.name > b.name ) return 1;
      return 0;
    } );

    let sum = {
      watchers: 0,
      stars: 0,
      forks: 0,
      issues: 0
    };
    let statistics = {
      watchers: [],
      stars: [],
      forks: [],
      issues: []
    };    

    for( let d = 0; d < data.length; d++ ) {
      sum.watchers = sum.watchers + data[d].subscribers;
      sum.stars = sum.stars + data[d].stargazers;
      sum.forks = sum.forks + data[d].forks;
      sum.issues = sum.issues + data[d].issues;

      statistics.watchers.push( data[d].subscribers );
      statistics.stars.push( data[d].stargazers );
      statistics.forks.push( data[d].forks );
      statistics.issues.push( data[d].issues );        
    }

    average_watchers = Math.round( sum.watchers / data.length );
    average_stars = Math.round( sum.stars / data.length );
    average_forks = Math.round( sum.forks / data.length );
    average_issues = Math.round( sum.issues / data.length );

    statistics.watchers = statistics.watchers.sort( numeric );
    median_watchers = median( statistics.watchers );
    statistics.stars = statistics.stars.sort( numeric );  
    median_stars = median( statistics.stars );  
    statistics.forks = statistics.forks.sort( numeric );
    median_forks = median( statistics.forks );    
    statistics.issues = statistics.issues.sort( numeric );
    median_issues = median( statistics.issues );      

    repositories = data.slice( 0 );

    if( repositories.length > 0 ) {
      updated_at = formatLong( repositories[0].updated_at );
      filter();      
    }
  } );
} );
</script>

<style>
div.average {
  border-top: solid 1px #f4f4f4;  
}

div.list {
  background-color: #f4f4f4;  
  flex-basis: 0;
  flex-grow: 1;
  overflow-y: scroll;
}

div.panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

div.panel.hidden {
  display: none;
}

div.row {
  border-bottom: solid 1px #dcdcdc;
  border-top: solid 1px transparent;    
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

div.row:hover {
  background-color: #e5e5e5;
}

div.row p {
  color: #393939;
}

div.row p:first-of-type {
  flex-basis: 0;
  flex-grow: 1;
}

div.search {
  display: flex;
  flex-direction: row;
}

footer {
  background-color: #e0e0e0;  
  display: flex;
  flex-direction: column;
}

footer div {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

footer div > p:first-of-type {
  flex-basis: 0;
  flex-grow: 1;
}

footer p {
  font-weight: 600;
}

header {
  background-color: #e0e0e0;  
  display: flex;
  flex-direction: row;
}

header p {
  font-weight: 600;
}

p {
  background-position: center right 8px;
  background-repeat: no-repeat;
  background-size: 20px;  
  box-sizing: border-box;
  color: #161616;
  flex-basis: 0;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 48px;
  line-height: 48px;
  margin: 0;
  padding: 0 8px 0 8px;
}

header > p:hover {
  background-image: url( /img/swap.svg );
  background-color: #cacaca;
}

header > p:first-of-type {
  flex-basis: 0;
  flex-grow: 1;
}

p.average {
  background-color: yellow;
}

p.median {
  background-color: pink !important;
}

p.medium {
  min-width: 125px;
  width: 125px;
}

p.small {
  min-width: 100px;
  width: 100px;
}
</style>

<div class="panel" class:hidden>

  <div class="search">
    <Search bind:value="{search}" on:keyup="{filter}"/>
    <Button 
      icon="/img/add-white.svg" 
      disabledIcon="/img/add.svg" 
      disabled>Add</Button>
  </div>

  <header>
    <p>Name</p>
    <p class="medium">Created</p>
    <p class="medium">Pushed</p>
    <p class="small">Watchers</p>
    <p class="small">Stars</p>
    <p class="small">Forks</p>
    <p class="small">Issues</p>
  </header>

  <div class="list">

    {#each filtered as repository}
    
      <div class="row">
        <p>{repository.name}</p>
        <p class="medium">{format( repository.started_at )}</p>      
        <p class="medium">{format( repository.pushed_at )}</p>            
        <p 
          class="small" 
          class:average="{repository.subscribers < average_watchers ? true : false}"
          class:median="{repository.subscribers < median_watchers ? true : false}">{repository.subscribers}</p>
        <p 
          class="small" 
          class:average="{repository.stargazers < average_stars ? true : false}"
          class:median="{repository.stargazers < median_stars ? true : false}">{repository.stargazers}</p>
        <p 
          class="small" 
          class:average="{repository.forks < average_forks ? true : false}"
          class:median="{repository.forks < median_forks ? true : false}">{repository.forks}</p>
        <p class="small">{repository.issues}</p>
      </div>

    {/each}

  </div>

  <footer>
    <div class="median">
      <p>Showing {repositories.length} repositories</p>
      <p class="medium">Median</p>
      <p class="small">{median_watchers}</p>
      <p class="small">{median_stars}</p>
      <p class="small">{median_forks}</p>
      <p class="small">{median_issues}</p>
    </div>
    <div class="average">
      <p>{updated_at}</p>
      <p class="medium">Average</p>
      <p class="small">{average_watchers}</p>
      <p class="small">{average_stars}</p>
      <p class="small">{average_forks}</p>
      <p class="small">{average_issues}</p>    
    </div>
  </footer>

</div>
