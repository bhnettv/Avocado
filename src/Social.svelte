<script>
import Button from './Button.svelte';
import Select from './Select.svelte';
import TextInput from './TextInput.svelte';

import { developer_id } from './developers.js';
import { developer_name } from './developers.js';

export let data = [];
export let hidden = false;
export let disabled = false;

let endpoint = '';
let endpoints = [
  {label: 'Website', value: 'Including HTTP/S', entity: 'website', field: 'url'},
  {label: 'Feed', value: 'RSS or ATOM, including HTTP/S', entity: 'blog', field: 'url'},
  {label: 'Dev.to', value: 'User name, after trailing slash of profile', entity: 'dev', field: 'user_name'},
  {label: 'Medium', value: 'User name, after the "@" symbol', entity: 'medium', field: 'user_name'},
  {label: 'YouTube', value: 'Channel ID, not user name', entity: 'youtube', field: 'channel'},
  {label: 'Twitter', value: 'User name, no "@" symbol', entity: 'twitter', field: 'screen_name'},
  {label: 'Stack Overflow', value: 'User ID, not user name', entity: 'so', field: 'user'},
  {label: 'GitHub', value: 'User name, after trailing slash', entity: 'github', field: 'login'},
  {label: 'Reddit', value: 'User name, as shown in posts', entity: 'reddit', field: 'name'},
  {label: 'Instagram', value: 'Not yet implemented'}
];
let source = 'Including HTTP/S';

function doChannelAdd( evt ) {
  let index = -1;

  for( let e = 0; e < endpoints.length; e++ ) {
    if( endpoints[e].value === source ) {
      index = e;
      break;
    }
  }

  let body = {developer_id: $developer_id};
  body[endpoints[index].field] = endpoint;

  fetch( `/api/${endpoints[index].entity}`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( body )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    endpoint = '';

    console.log( data );
  } );
}
</script>

<style>
div.gap {
  min-width: 16px;
}

div.input {
  align-items: flex-end;
  border-bottom: solid 1px #e0e0e0;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0 16px 16px 16px;
}

div.none {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}

div.social {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 16px 0 0 0;
  padding: 0;
}

div.social.hidden {
  display: none;
}

p {
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px; 
  margin: 0 0 8px 0;
  padding: 0;   
}
</style>

<div class="social" class:hidden>

  <div class="input">
    <Select 
      label="Channel" 
      labelField="label"
      options="{endpoints}" 
      bind:selected="{source}"
      dataField="value"/>
    <div class="gap"></div>
    <TextInput label="Endpoint" placeholder="{source}" bind:value="{endpoint}"/>
    <div class="gap"></div>
    <Button
      icon="/img/add-white.svg"
      disabledIcon="/img/add.svg"
      disabled="{endpoint.trim().length > 0 ? false : true}"
      size="small"
      on:click="{doChannelAdd}">Add</Button>
  </div>

  {#if data.length === 0}

    <div class="none">
      <p>No social endpoints available for {$developer_name}.</p>
    </div>

  {:else}

    <p>List here.</p>

  {/if}

</div>
