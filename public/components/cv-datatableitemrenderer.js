class DataTableItemRenderer extends HTMLElement {
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

      p {
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
      <p></p>
    `;

    this._label = null;

    this._shadowRoot = this.attachShadow( {mode: 'open'} );
    this._shadowRoot.appendChild( template.content.cloneNode( true ) );

    this.$renderer = this._shadowRoot.querySelector( 'p' );
  }    

  _render() {
    if( this._label === null ) {
      this.$renderer.innerHTML = '';
    } else {
      this.$renderer.innerHTML = this._label;
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

window.customElements.define( 'cv-datatableitemrenderer', DataTableItemRenderer );