<script>
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

export let hide = false;
export let disabled = false;
</script>

<style>
div.endpoints {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 16px 16px 0 16px;
  padding: 0;
}

div.gap {
  min-width: 16px;
}

div.line {
  display: flex;
  flex-direction: row;
  margin: 0 0 16px 0;
  padding: 0;
}

div.endpoints.hide {
  display: none;
}
</style>

<div class="endpoints" class:hide>

  <div class="line">
    <TextInput 
      label="Website"
      bind:value="{$endpoint_website}"
      placeholder="Website" 
      helper="Including HTTP/S"/>
    <div class="gap"></div>       
    <TextInput 
      label="Feed"
      bind:value="{$endpoint_rss}"
      placeholder="Feed"
      helper="RSS or ATOM, including HTTP/S"/>      
  </div>  

  <div class="line">
    <TextInput 
      label="Dev.to"
      bind:value="{$endpoint_devto}"
      placeholder="Dev.to"
      helper="User name, after trailing slash of profile"/>
    <div class="gap"></div>  
    <TextInput 
      label="Medium"
      bind:value="{$endpoint_medium}"
      placeholder="Medium"
      helper="User name, after the &quot;@&quot; symbol"/>      
  </div>

  <div class="line">
    <TextInput 
      label="YouTube"
      bind:value="{$endpoint_youtube}"
      placeholder="YouTube"
      helper="Channel ID, not user name"/>    
    <div class="gap"></div> 
    <TextInput 
      label="Twitter"
      bind:value="{$endpoint_twitter}"
      placeholder="Twitter"
      helper="User name, no &quot;@&quot; symbol"/>      
  </div>     

  <div class="line">
    <TextInput 
      label="Stack Overflow"
      bind:value="{$endpoint_so}"
      placeholder="Stack Overflow"
      helper="User ID, not user name"/>
    <div class="gap"></div> 
    <TextInput 
      label="GitHub"
      bind:value="{$endpoint_github}"
      placeholder="GitHub"
      helper="User name, after trailing slash"/>      
  </div>       

   <div class="line">
    <TextInput 
      label="Reddit"
      bind:value="{$endpoint_reddit}"
      placeholder="Reddit"
      helper="User name, as shown in posts"/>
    <div class="gap"></div>
    <TextInput 
      disabled="true"
      label="Instagram"
      placeholder="Instagram"
      helper="Not yet implemented"/>
  </div>        

</div>
