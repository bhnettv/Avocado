<script>
import Button from './Button.svelte';
import Select from './Select.svelte';
import TextInput from './TextInput.svelte';

import { endpoint_website } from './developers.js';
import { endpoint_rss } from './developers.js';
import { endpoint_devto } from './developers.js';
import { endpoint_medium } from './developers.js';
import { endpoint_youtube } from './developers.js';
import { endpoint_twitter } from './developers.js';
import { endpoint_so } from './developers.js';
import { endpoint_github } from './developers.js';
import { endpoint_reddit } from './developers.js';

export let hidden = false;
export let disabled = false;

let endpoint = '';
let endpoints = [
  {label: 'Website', value: 'Including HTTP/S'},
  {label: 'Feed', value: 'RSS or ATOM, including HTTP/S'},
  {label: 'Dev.to', value: 'User name, after trailing slash of profile'},
  {label: 'Medium', value: 'User name, after the "@" symbol'},
  {label: 'YouTube', value: 'Channel ID, not user name'},
  {label: 'Twitter', value: 'User name, no "@" symbol'},
  {label: 'Stack Overflow', value: 'User ID, not user name'},
  {label: 'GitHub', value: 'User name, after trailing slash'},
  {label: 'Reddit', value: 'User name, as shown in posts'},
  {label: 'Instagram', value: 'Not yet implemented'}
];
let source = 'Including HTTP/S';
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
      disabled="{endpoint.trim().length > 0 ? false : true}">Add</Button>
  </div>

</div>
