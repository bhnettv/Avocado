<script>
import TextInput from './TextInput.svelte';

export let mode = 0;
</script>

<style>
div.endpoints {
  display: flex;
  flex-direction: column;
  margin: 16px;
  padding: 0;
}

div.icon {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px;
  height: 40px;
  min-width: 40px;
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

.dev {
  background-image: url( /img/dev-to.svg );  
}

.github {
  background-image: url( /img/github.svg );
}

.medium {
  background-image: url( /img/medium.svg );  
}

.rss {
  background-image: url( /img/rss.svg );
}

.so {
  background-image: url( /img/so.svg );
}

.twitter {
  background-image: url( /img/twitter.svg );
}

.web {
  background-image: url( /img/language.svg );
}

.youtube {
  background-image: url( /img/youtube.svg );
}
</style>

{#if mode === 0}

<div class="list">Social list</div>

{/if}

{#if mode === 1}

<div class="endpoints">

  <div class="line">
    <div class="icon web"></div>
    <TextInput 
      placeholder="Website" 
      message="Including HTTP/S"/>
    <div class="gap"></div>       
    <div class="icon rss"></div>    
    <TextInput 
      placeholder="Feed"
      message="RSS or ATOM, including HTTP/S"/>      
  </div>  

  <div class="line">
    <div class="icon dev"></div>
    <TextInput 
      placeholder="Dev.to"
      message="User name, after trailing slash of profile"/>
    <div class="gap"></div>  
    <div class="icon medium"></div>
    <TextInput 
      placeholder="Medium"
      message="User name, after the &quot;@&quot; symbol"/>      
  </div>

  <div class="line">
    <div class="icon youtube"></div>
    <TextInput 
      placeholder="YouTube"
      message="Channel ID, not user name"/>    
    <div class="gap"></div> 
    <div class="icon twitter"></div>    
    <TextInput 
      placeholder="Twitter"
      message="User name, no &quot;@&quot; symbol"/>      
  </div>     

  <div class="line">
    <div class="icon so"></div>
    <TextInput 
      placeholder="StackOverflow"
      message="User ID, not user name"/>
    <div class="gap"></div> 
    <div class="icon github"></div>    
    <TextInput 
      placeholder="GitHub"
      message="User name, after trailing slash"/>      
  </div>       

</div>

{/if}
