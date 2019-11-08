<script>
import Select from './Select.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

import { skills } from './developers.js';

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

import { developer_skills } from './developers.js';

export let hidden = false;
export let disabled = false;

let publish = [
  {id: 0, label: 'No'}, 
  {id: 1, label: 'Yes'}
];

function doAreaChange( evt ) {
  doDeveloperChange( evt );
}

function doDeveloperChange( evt ) {
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
      latitude: $developer_latitude,
      longitude: $developer_longitude,
      public: $developer_public
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    console.log( data );
  } );
}

function doSelectChange( evt ) {
  doDeveloperChange( evt );
}
</script>

<style>
div {
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
}

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 16px 16px 16px 16px;
}

form > div:last-of-type {
  justify-content: flex-end;
  margin-bottom: 0;
}

.hidden {
  display: none;
}
</style>

<form class:hidden>

  <div>
    <TagInput 
      label="Roles" 
      placeholder="Roles"
      helper="Job functions regularly performed"
      {disabled}/>
  </div>

  <div>
    <TagInput 
      label="Languages" 
      placeholder="Languages"
      helper="Fluency for a technical presentation"
      {disabled}/>
  </div>

  <div>
    <TagInput
      data="{$skills}"
      dataField="id"
      labelField="name"
      label="Skills"
      placeholder="Skills"
      helper="Capable of delivering hands-on training with zero preparation"
      bind:value="{$developer_skills}"
      {disabled}/> 
  </div>

  <div style="flex-grow: 1;">
    <TextArea
      label="Description/Bio"
      placeholder="Description"
      bind:value="{$developer_description}"
      on:change="{doAreaChange}"
      {disabled}/>
  </div>

  <div>
    <Select 
      options="{publish}"
      dataField="id" 
      labelField="label" 
      inline="true" 
      label="Publish"
      on:change="{doSelectChange}"
      bind:selected="{$developer_public}"
      {disabled}/>
  </div>

</form>
