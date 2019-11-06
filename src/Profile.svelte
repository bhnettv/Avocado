<script>
import Select from './Select.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

import { developer_description } from './developers.js';
import { developer_public } from './developers.js';

export let hidden = false;
export let disabled = false;

let publish = [
  {id: 0, label: 'No'}, 
  {id: 1, label: 'Yes'}
];
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
      label="Skills"
      placeholder="Skills"
      helper="Capable of delivering hands-on training with zero preparation"
      {disabled}/>
  </div>

  <div style="flex-grow: 1;">
    <TextArea
      label="Description/Bio"
      placeholder="Description"
      bind:value="{$developer_description}"
      {disabled}/>
  </div>

  <div>
    <Select 
      options="{publish}"
      dataField="id" 
      labelField="label" 
      inline="true" 
      label="Publish"
      bind:selected="{$developer_public}"
      {disabled}/>
  </div>

</form>
