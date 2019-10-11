<script>
import Avatar from './Avatar.svelte';
import Input from './Input.svelte';
import TextArea from './TextArea.svelte';

export let visible = false;
</script>

<style>
div.icon {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px;
  height: 40px;
  width: 56px;
}

div.gap {
  width: 16px;
}

div.line {
  display: flex;
  flex-direction: row;
  margin: 0 0 16px 0;
  padding: 0;
}

div.line:last-of-type {
  flex-grow: 1;
  margin: 0;
}

form {
  display: none;
  flex-direction: column;
  flex-grow: 1;
  margin: 0;
  padding: 16px;
}

.bio {
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
    <Input placeholder="Name" value="Kevin Hoyt"/>  
    <div class="gap"></div>
    <Input placeholder="Email" value="krhoyt@us.ibm.com"/>
  </div>

  <div class="line">
    <div class="icon labels"></div>
    <div class="gap"></div>
    <Input placeholder="Labels"/>  
  </div>  

  <div class="line">
    <div class="icon skills"></div>
    <div class="gap"></div>
    <Input placeholder="Skills"/>  
  </div>  

  <div class="line">
    <div class="icon bio"></div>
    <div class="gap"></div>
    <TextArea placeholder="Biography"/>  
  </div>    

</form>
