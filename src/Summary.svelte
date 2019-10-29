<script>
import Map from './Map.svelte';
import TagInput from './TagInput.svelte';
import TextArea from './TextArea.svelte';
import TextInput from './TextInput.svelte';
</script>

<style>
div {
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
}

div > div {
  width: 16px;
}

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 24px 16px 24px 16px;
}

form > div:last-of-type {
  flex-grow: 1;
  margin-bottom: 0;
}
</style>

<form>

  <div>
    <TextInput label="Full name" placeholder="Full name"/>
    <div></div>
    <TextInput label="Email address" placeholder="Email address"/>
  </div>

  <div>
    <TextInput 
      label="Profile image" 
      placeholder="Profile image"
      helper="Full path to profile image, including HTTP/S"/>
  </div>

  <div>
    <TagInput
      label="Organization"
      placeholder="Organization"
      helper="Company name and/or team nomenclature"/>
  </div>

  <div>
    <TextInput
      label="Location"
      placeholder="Location"
      helper="As specific or general as is needed"/>
  </div>

  <div>
    <Map/>
  </div>

</form>
