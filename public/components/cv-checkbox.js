class CheckBox extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement( 'template' );
    template.innerHTML = `
      <style>
      button {
        background: none;
        background-image: url( /img/check-outline.svg );
        background-position: right 7px center;
        background-repeat: no-repeat;
        background-size: 20px;
        border: none;
        height: 100%;
        margin: 0;
        outline: none;
        padding: 0;
        width: 100%;
      }

      .selected {
        background-image: url( /img/check-box.svg );        
      }
      </style>
      <button></button>
    `;

    this._label = null;
    this._selected = false;

    this._shadowRoot = this.attachShadow( {mode: 'open'} );
    this._shadowRoot.appendChild( template.content.cloneNode( true ) );

    this.$button = this._shadowRoot.querySelector( 'button' );
    this.$button.addEventListener( 'click', ( evt ) => this.doButtonClick( evt ) );
  }

  doButtonClick( evt ) {
    this.selected = !this.selected;
  }

  _render() {
    if( this._label === null ) {
      this.$button.innerHTML = '';      
      this.$button.classList.remove( 'labeled' );
    } else {
      this.$button.classList.add( 'labeled' );
      this.$button.innerHTML = this._label;
    }

    if( this._selected === true ) {
      this.$button.classList.add( 'selected' );
    } else {
      this.$button.classList.remove( 'selected' );
    }
  }

  static get observedAttributes() {
    return [
      'label',
      'selected'
    ];
  }  

  attributeChangedCallback( attrName, oldVal, newVal ) {
    switch( attrName ) {
      case 'label':
        this.label = newVal;
        break;              
      case 'selected':
        this.selected = newVal === 'true' ? true : false;
        break;
    }
  }  

  get label() {
    return this._label;
  }

  set label( value ) {
    this._labelF = value;
    this._render();
  }

  get selected() {
    return this._selected;
  }

  set selected( value ) {
    this._selected = value;
    this._render();
  }
}

window.customElements.define( 'cv-checkbox', CheckBox );
