<script>
import TextInput from './TextInput.svelte';

import { social_index } from './developers.js';
import { tab_index } from './developers.js';
import { endpoint_website } from './developers.js';
import { endpoint_rss } from './developers.js';
import { endpoint_devto } from './developers.js';
import { endpoint_medium } from './developers.js';
import { endpoint_youtube } from './developers.js';
import { endpoint_twitter } from './developers.js';
import { endpoint_so } from './developers.js';
import { endpoint_github } from './developers.js';
import { endpoint_reddit } from './developers.js';
</script>

<style>
div.block {
  flex-basis: 0;  
  flex-grow: 1; 
  margin: 0; 
  padding: 0; 
}

div.endpoints {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 21px 16px 0 16px;
  padding: 0;
}

div.gap {
  min-width: 32px;
}

div.line {
  display: flex;
  flex-direction: row;
  margin: 0 0 16px 0;
  padding: 0;
}
</style>

<div 
  class="endpoints" 
  style="display: {( $tab_index === 1 && $social_index === 0 ) ? 'flex' : 'none'};">

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
    <div class="block"></div> 
  </div>        

</div>
