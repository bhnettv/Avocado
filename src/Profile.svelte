<script>
import Select from './Select.svelte';
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

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 24px 16px 24px 16px;
}

form > div:last-of-type {
  justify-content: flex-end;
  margin-bottom: 0;
}
</style>

<form>

  <div>
    <TagInput 
      label="Roles" 
      placeholder="Roles"
      helper="Job functions regularly performed"/>
  </div>

  <div>
    <TagInput 
      label="Languages" 
      placeholder="Languages"
      helper="Fluency for a technical presentation"/>
  </div>

  <div>
    <TagInput
      label="Skills"
      placeholder="Skills"
      helper="Capable of delivering hands-on training with zero preparation"/>
  </div>

  <div style="flex-grow: 1;">
    <TextArea
      label="Description/Bio"
      placeholder="Description"/>
  </div>

  <div>
    <Select/>
  </div>

</form>
