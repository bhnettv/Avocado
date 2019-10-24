<script>
import TextInput from './TextInput.svelte';

import { social_index } from './stores.js';
import { tab_index } from './stores.js';

let web;
let rss;
let dev;
let medium;
let youtube;
let twitter;
let so;
let github;
</script>

<style>
div.endpoints {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 24px 16px 0 16px;
  padding: 0;
}

div.gap {
  min-width: 32px;
}

div.line {
  display: flex;
  flex-direction: row;
  margin: 0 0 24px 0;
  padding: 0;
}
</style>

<div 
  class="endpoints" 
  style="display: {( $tab_index === 1 && $social_index === 0 ) ? 'flex' : 'none'};">

  <div class="line">
    <TextInput 
      label="Website"
      bind:value="{web}"
      placeholder="Website" 
      helper="Including HTTP/S"/>
    <div class="gap"></div>       
    <TextInput 
      label="Feed"
      bind:value="{rss}"
      placeholder="Feed"
      helper="RSS or ATOM, including HTTP/S"/>      
  </div>  

  <div class="line">
    <TextInput 
      label="Dev.to"
      bind:value="{dev}"
      placeholder="Dev.to"
      helper="User name, after trailing slash of profile"/>
    <div class="gap"></div>  
    <TextInput 
      label="Medium"
      bind:value="{medium}"
      placeholder="Medium"
      helper="User name, after the &quot;@&quot; symbol"/>      
  </div>

  <div class="line">
    <TextInput 
      label="YouTube"
      bind:value="{youtube}"
      placeholder="YouTube"
      helper="Channel ID, not user name"/>    
    <div class="gap"></div> 
    <TextInput 
      label="Twitter"
      bind:value="{twitter}"
      placeholder="Twitter"
      helper="User name, no &quot;@&quot; symbol"/>      
  </div>     

  <div class="line">
    <TextInput 
      label="Stack Overflow"
      bind:value="{so}"
      placeholder="Stack Overflow"
      helper="User ID, not user name"/>
    <div class="gap"></div> 
    <TextInput 
      label="GitHub"
      bind:value="{github}"
      placeholder="GitHub"
      helper="User name, after trailing slash"/>      
  </div>       

   <div class="line">
    <TextInput 
      label="Reddit"
      bind:value="{so}"
      placeholder="Reddit"
      helper="User name, as shown in posts"/>
    <div class="gap"></div>
    <div style="flex-grow: 1; margin: 0; padding: 0; flex-basis: 0;"></div> 
  </div>        

</div>
