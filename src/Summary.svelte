<script>
import { createEventDispatcher } from 'svelte';

import Map from './Map.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

import { organizations } from './developers.js';

import { developer_id } from './developers.js';
import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_description } from './developers.js';
import { developer_image } from './developers.js';
import { developer_organizations } from './developers.js';
import { developer_location } from './developers.js';
import { developer_latitude } from './developers.js';
import { developer_longitude } from './developers.js';
import { developer_public } from './developers.js';

const dispatch = createEventDispatcher();

export let hidden = false;
export let disabled = false;

function doInputChange( evt ) {
  fetch( `/api/developer/${$developer_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( {
      id: $developer_id,
      name: $developer_name.trim().length === 0 ? null : $developer_name,
      email: $developer_email.trim().length === 0 ? null : $developer_email,
      description: $developer_description.trim().length === 0 ? null : $developer_description,
      image: $developer_image.trim().length === 0 ? null : $developer_image,
      location: $developer_location.trim().length === 0 ? null : $developer_location,
      latitude: null,
      longitude: null,
      public: $developer_public
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_latitude = data.latitude;
    $developer_longitude = data.longitude;

    dispatch( 'change', data );
  } );
}

function doTagAdd( evt ) {
  doTagChange( evt.detail );
}

function doTagChange( item ) {
  fetch( `/api/developer/${$developer_id}/organization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( $developer_organizations )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_organizations = data.slice();
  } );
}

function doTagRemove( evt ) {
  doTagChange( evt.detail );
}
</script>

<style>
div {
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
}

div > div {
  width: 16px;
}

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 16px 16px 16px 16px;
}

form > div:last-of-type {
  flex-grow: 1;
  margin-bottom: 0;
}

.hidden {
  display: none;
}
</style>

<form class:hidden>

  <div>
    <TextInput 
      label="Full name" 
      placeholder="Full name" 
      bind:value="{$developer_name}"
      on:change="{doInputChange}"
      {disabled}/>
    <div></div>
    <TextInput 
      label="Email address" 
      placeholder="Email address" 
      bind:value="{$developer_email}"
      on:change="{doInputChange}"
      {disabled}/>
  </div>

  <div>
    <TextInput 
      label="Profile image" 
      placeholder="Profile image"
      helper="Full path to profile image, including HTTP/S"
      bind:value="{$developer_image}"
      on:change="{doInputChange}"
      {disabled}/>
  </div>

  <div>
    <TagInput
      data="{$organizations}"
      dataField="id"
      labelField="name"
      label="Organization"
      placeholder="Organization"
      helper="Company name and/or team nomenclature"
      bind:value="{$developer_organizations}"
      on:add="{doTagAdd}"
      on:remove="{doTagRemove}"
      {disabled}/>
  </div>

  <div>
    <TextInput
      label="Location"
      placeholder="Location"
      helper="As specific or general as is desired"
      bind:value="{$developer_location}"
      on:change="{doInputChange}"
      {disabled}/>
  </div>

  <div>
    <Map latitude="{$developer_latitude}" longitude="{$developer_longitude}"/>
  </div>

</form>
