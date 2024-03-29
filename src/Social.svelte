<script>
import Button from './Button.svelte';
import List from './List.svelte';
import ListSocialItem from './ListSocialItem.svelte';
import Select from './Select.svelte';
import TextInput from './TextInput.svelte';

import { developer_id } from './developers.js';
import { developer_name } from './developers.js';
import { social } from './developers.js';

export let hidden = false;
export let disabled = false;

let channels = [
  {label: 'Website', value: 'Including HTTP/S', entity: 'website', field: 'url'},
  {label: 'Blog', value: 'RSS or ATOM, including HTTP/S', entity: 'blog', field: 'url'},
  {label: 'Dev.to', value: 'User name, after trailing slash of profile', entity: 'dev', field: 'user_name'},
  {label: 'Medium', value: 'User name, after the "@" symbol', entity: 'medium', field: 'user_name'},
  {label: 'YouTube', value: 'Channel ID, not user name', entity: 'youtube', field: 'channel'},
  {label: 'Twitter', value: 'User name, no "@" symbol', entity: 'twitter', field: 'screen_name'},
  {label: 'Stack Overflow', value: 'User ID, not user name', entity: 'so', field: 'user'},
  {label: 'GitHub', value: 'User name, after trailing slash', entity: 'github', field: 'login'},
  {label: 'Reddit', value: 'User name, as shown in posts', entity: 'reddit', field: 'name'},
  {label: 'Instagram', value: 'Not yet implemented'}
];
let endpoint = '';
let helper = 'Including HTTP/S';

function doChannelAdd( evt ) {
  let index = -1;

  for( let c = 0; c < channels.length; c++ ) {
    if( channels[c].value === helper ) {
      index = c;
      break;
    }
  }

  let body = {developer_id: $developer_id};
  body[channels[index].field] = endpoint;

  fetch( `/api/${channels[index].entity}`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( body )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    endpoint = '';

    $social.push( {
      id: data.id,
      channel: channels[index].label,
      endpoint: data[channels[index].field],
      developer_id: data.developer_id,
      entity: channels[index].entity
    } );
    $social.sort( ( a, b ) => {
      if( a.channel > b.channel ) return 1;
      if( a.channel < b.channel ) return -1;
      return 0;
    } );
    $social = $social.slice();
  } );
}

function doEndpoint( item ) {
  let result = null;

  if( item.entity === 'blog' ) result = item.url;
  if( item.entity === 'dev' ) result = item.user_name;  
  if( item.entity === 'github' ) result = item.login;  
  if( item.entity === 'medium' ) result = item.user_name;  
  if( item.entity === 'reddit' ) result = item.name;  
  if( item.entity === 'stackoverflow' ) result = item.user;  
  if( item.entity === 'twitter' ) result = item.screen_name;
  if( item.entity === 'website' ) result = item.url;
  if( item.entity === 'youtube' ) result = item.channel;    

  return result;
}

function doRemoveSocial( entity, id ) {
  fetch( `/api/${entity}/${id}`, {
    method: 'DELETE'
  } );

  for( let s = 0; s < $social.length; s++ ) { 
    if( $social[s].id === id ) {
      $social.splice( s, 1 );
      break;
    }
  }

  $social = $social.slice();  
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
      options="{channels}" 
      bind:selected="{helper}"
      dataField="value"/>
    <div class="gap"></div>
    <TextInput label="Endpoint" placeholder="{helper}" bind:value="{endpoint}"/>
    <div class="gap"></div>
    <Button
      icon="/img/add-white.svg"
      disabledIcon="/img/add.svg"
      disabled="{endpoint.trim().length > 0 ? false : true}"
      size="small"
      on:click="{doChannelAdd}">Add</Button>
  </div>

  {#if $social.length === 0}

    <div class="none">
      <p>No social endpoints available for {$developer_name}.</p>
    </div>

  {:else}

    <List 
      selectable="{false}"    
      data="{$social}" 
      let:item="{item}">
      <ListSocialItem 
        id="{item.id}"
        channel="{item.channel}" 
        endpoint="{item.endpoint}"
        on:click="{() => doRemoveSocial( item.entity, item.id )}"/>
    </List>

  {/if}

</div>
