<script>
import Avatar from './Avatar.svelte';
import Tag from './Tag.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';

export let disabled = true;
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
    <TextInput 
      placeholder="Name" 
      value="Kevin Hoyt" 
      disabled="{disabled}"/>  
    <div class="gap"></div>
    <TextInput 
      placeholder="Email" 
      value="krhoyt@us.ibm.com" 
      disabled="{disabled}"/>
  </div>

  <div class="line">
    <div class="icon labels"></div>
    <div class="gap"></div>
    <Tag placeholder="Labels" value="{['IBM', 'Advocate']}"/>
  </div>  

  <div class="line">
    <div class="icon skills"></div>
    <div class="gap"></div>
    <Tag placeholder="Skills" value="{['HTML', 'CSS', 'JavaScript', 'SQL', 'Python', 'IoT']}"/>
  </div>  

  <div class="line">
    <div class="icon bio"></div>
    <div class="gap"></div>
    <TextArea 
      placeholder="Description"
      disabled="{disabled}"
      value="This guy works at IBM."/>  
  </div>    

</form>
