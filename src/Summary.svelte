<script>
import Map from './Map.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

import { organizations } from './developers.js';

import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_image } from './developers.js';
import { developer_organizations } from './developers.js';
import { developer_location } from './developers.js';
import { developer_latitude } from './developers.js';
import { developer_longitude } from './developers.js';

export let hidden = false;
export let disabled = false;
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
      {disabled}/>
    <div></div>
    <TextInput 
      label="Email address" 
      placeholder="Email address" 
      bind:value="{$developer_email}"
      {disabled}/>
  </div>

  <div>
    <TextInput 
      label="Profile image" 
      placeholder="Profile image"
      helper="Full path to profile image, including HTTP/S"
      bind:value="{$developer_image}"
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
      {disabled}/>
  </div>

  <div>
    <TextInput
      label="Location"
      placeholder="Location"
      helper="As specific or general as is desired"
      bind:value="{$developer_location}"
      {disabled}/>
  </div>

  <div>
    <Map latitude="{$developer_latitude}" longitude="{$developer_longitude}"/>
  </div>

</form>
