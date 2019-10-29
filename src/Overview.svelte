<script>
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

import { tab_index } from './developers.js';
import { overview_disabled } from './developers.js';
import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_image } from './developers.js';
import { developer_labels } from './developers.js';
import { developer_skills } from './developers.js';
import { developer_description } from './developers.js';
import { skill_list } from './developers.js';
import { label_list } from './developers.js';
</script>

<style>
div.gap {
  min-width: 16px;
}

div.line {
  display: flex;
  flex-direction: row;
  margin: 0 16px 16px 16px;
  padding: 0;
}

div.line:first-of-type {
  margin-top: 21px;
}

div.line.last {
  flex-grow: 1;
  padding-bottom: 8px;
}

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 0;
  padding: 0;
}
</style>

<form style="display: {$tab_index === 0 ? 'flex' : 'none'};">

  <div class="line">
    <TextInput 
      label="Full name"
      placeholder="Full name" 
      disabled="{$overview_disabled}"
      bind:value="{$developer_name}"/>  
    <div class="gap"></div>
    <TextInput 
      label="Email address"
      placeholder="Email address" 
      disabled="{$overview_disabled}"
      bind:value="{$developer_email}"/>
  </div>

  <div class="line">
    <TextInput 
      label="Profile image"
      placeholder="Profile image"
      helper="Full path to profile image, including HTTP/S" 
      disabled="{$overview_disabled}"
      bind:value="{$developer_image}"/>
  </div>  

  <div class="line">
    <TagInput 
      data="{$label_list}"
      labelField="name"
      label="Labels"
      placeholder="Labels" 
      disabled="{$overview_disabled}" 
      bind:value="{$developer_labels}"/>
  </div>  

  <div class="line">
    <TagInput 
      data="{$skill_list}"
      labelField="name"
      label="Skills"
      placeholder="Skills" 
      disabled="{$overview_disabled}"
      bind:value="{$developer_skills}"/>
  </div>  

  <div class="line last">
    <TextArea 
      label="Description/Bio"
      placeholder="Description"
      disabled="{$overview_disabled}"
      bind:value="{$developer_description}"/>  
  </div>    

</form>
