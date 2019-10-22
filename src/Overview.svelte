<script>
import Avatar from './Avatar.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

export let disabled = true;

let description = '';
let email = '';
let image = '';
let labels = [];
let name = '';
let skills = [];
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
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 0;
  padding: 0;
}

.description {
  background-image: url( /img/description.svg );  
}

.labels {
  background-image: url( /img/label-filled.svg );
}

.skills {
  background-image: url( /img/build.svg );
}
</style>

<form>

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
    <TagInput 
      placeholder="Labels" 
      disabled="{disabled}" 
      bind:value="{labels}"/>
  </div>  

  <div class="line">
    <div class="icon skills"></div>
    <div class="gap"></div>
    <TagInput 
      placeholder="Skills" 
      disabled="{disabled}"
      bind:value="{skills}"/>
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

</form>
