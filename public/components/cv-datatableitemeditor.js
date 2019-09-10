class DataTableItemEditor extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement( 'template' );
    template.innerHTML = `
      <style>
      :host {
        display: flex;
        flex-basis: 0;
        flex-direction: row;
        flex-grow: 1;
      }

      input {
        background: none;
        background-color: white;
        border: none;
        color: #171717;
        flex-basis: 0;
        flex-grow: 1;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 14px;
        font-weight: 400;
        height: 47px;
        line-height: 48px;
        margin: 0;
        padding: 0 0 0 8px;
      }
      </style>
      <input>
    `;

    this._label = null;

    this._shadowRoot = this.attachShadow( {mode: 'open'} );
    this._shadowRoot.appendChild( template.content.cloneNode( true ) );

    this.$editor = this._shadowRoot.querySelector( 'input' );
    this.$editor.addEventListener( 'keypress', ( evt ) => this.doEditorChange( evt ) );
  }    

  focus() {
    this.$editor.focus();
  }

  doEditorChange( evt ) {
    if( evt.keyCode === 13 ) {
      evt.preventDefault();

      this._label = this.$editor.value.trim();      
      this.blur();
    } else {
      this._label = this.$editor.value;
    }
  }

  _render() {
    if( this._label === null ) {
      this.$editor.value = '';
    } else {
      this.$editor.value = this._label;
    }
  }

  get label() {
    return this._label;
  }

  set label( value ) {
    this._label = value.trim();
    this._render();
  }
}

window.customElements.define( 'cv-datatableitemeditor', DataTableItemEditor );
