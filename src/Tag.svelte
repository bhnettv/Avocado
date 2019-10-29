<script>
export let disabled = false;

function doRemove( evt ) {

}
</script>

<style>
button {
  background: none;
  background-image: url( /img/close-white.svg );
  background-position: center;
  background-repeat: no-repeat;
  background-size: 14px;
  border: none;
  cursor: pointer;
  height: 20px;
  margin: 2px 2px 0 3px;
  outline: none;
  padding: 0;
  width: 20px;
}

div {
  background-color: #393939;
  border-radius: 12px;
  display: inline-flex;  
  height: 24px;
  margin: 8px 8px 0 0;
  padding: 0 0 0 8px; 
}

p {
  color: #ffffff;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;  
  line-height: 24px;
  margin: 0;
  padding: 0;
}

.disabled {
  cursor: not-allowed;
  padding: 0 9px 0 8px;
}
</style>

<div class="tag" class:disabled="{disabled}">
  <p><slot></slot></p>
  <button 
    type="button" 
    on:click="{doRemove}" 
    style="display: {disabled ? 'none' : 'initial'};"></button>
</div>
