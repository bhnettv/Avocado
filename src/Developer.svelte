<script>
import { createEventDispatcher } from 'svelte';

import Avatar from './Avatar.svelte';
import Controls from './Controls.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

export let image = null;
export let name = '';
export let email = '';
export let labels = [];
export let skills = [];
export let description = '';

export let disabled = true;
export let visible = false;

const dispatch = createEventDispatcher();

function doCancel( evt ) {
  name = '';
  email = '';
  description = '';

  dispatch( 'cancel' );
}

function doSave( evt ) {
  dispatch( 'save', {
    image: image,
    name: name,
    email: email,
    labels: labels,
    skills: skills,
    description: description
  } );
}
</script>

<style>
div.icon {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px;
  height: 40px;
  min-width: 56px;
}

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
  margin-top: 16px;
}

div.line.last {
  flex-grow: 1;
}

form {
  display: none;
  flex-direction: column;
  flex-grow: 1;
  margin: 0;
  padding: 0;
}

.description {
  background-image: url( /img/description.svg );  
}

.display {
  display: flex;
}

.labels {
  background-image: url( /img/label-filled.svg );
}

.skills {
  background-image: url( /img/build.svg );
}
</style>

<form class:display="{visible}">

  <div class="line">
    <Avatar/>
    <div class="gap"></div>
    <TextInput 
      placeholder="Name" 
      disabled="{disabled}"
      bind:value="{name}"/>  
    <div class="gap"></div>
    <TextInput 
      placeholder="Email" 
      disabled="{disabled}"
      bind:value="{email}"/>
  </div>

  <div class="line">
    <div class="icon labels"></div>
    <div class="gap"></div>
    <TagInput placeholder="Labels" disabled="{disabled}"/>
  </div>  

  <div class="line">
    <div class="icon skills"></div>
    <div class="gap"></div>
    <TagInput placeholder="Skills" disabled="{disabled}"/>
  </div>  

  <div class="line last">
    <div class="icon description"></div>
    <div class="gap"></div>
    <TextArea 
      placeholder="Description"
      disabled="{disabled}"
      value="{description}"
      bind:value="{description}"/>  
  </div>    

  <Controls 
    on:cancel="{doCancel}"
    on:save="{doSave}"
    mode="{disabled === true ? 0 : 2}"/>

</form>
