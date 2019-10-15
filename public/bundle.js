
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Button.svelte generated by Svelte v3.12.1 */

    const file = "src/Button.svelte";

    // (79:0) {:else}
    function create_else_block(ctx) {
    	var button, t, button_class_value, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1v30vg5");
    			set_style(button, "background-image", "url( " + ctx.icon + " )");
    			add_location(button, file, 80, 0, 1311);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1v30vg5")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (changed.icon) {
    				set_style(button, "background-image", "url( " + ctx.icon + " )");
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(79:0) {:else}", ctx });
    	return block;
    }

    // (70:0) {#if icon === null}
    function create_if_block(ctx) {
    	var button, t, button_class_value, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1v30vg5");
    			add_location(button, file, 71, 0, 1187);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1v30vg5")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(70:0) {#if icon === null}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.icon === null) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { disabled = false, icon = null, label = '', kind = 'primary', title = '' } = $$props;

    const dispatch = createEventDispatcher();

    function doClick( evt ) {
      dispatch( 'click', null );
    }

    	const writable_props = ['disabled', 'icon', 'label', 'kind', 'title'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, icon, label, kind, title };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    	};

    	return {
    		disabled,
    		icon,
    		label,
    		kind,
    		title,
    		doClick
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["disabled", "icon", "label", "kind", "title"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment.name });
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get kind() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Controls.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Controls.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	var button = new Button({
    		props: { label: "Edit", icon: "/img/edit.svg" },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button.$$.fragment.c();
    			set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			attr_dev(div, "class", "svelte-1hwvttx");
    			add_location(div, file$1, 15, 0, 214);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.visible) {
    				set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(button);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { visible = true } = $$props;

    	const writable_props = ['visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { visible };
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Controls", options, id: create_fragment$1.name });
    	}

    	get visible() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Avatar.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Avatar.svelte";

    function create_fragment$2(ctx) {
    	var button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-soz8oe");
    			add_location(button, file$2, 8, 0, 83);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    class Avatar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Avatar", options, id: create_fragment$2.name });
    	}
    }

    /* src/Tag.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/Tag.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	return child_ctx;
    }

    // (56:0) {#each value as tag}
    function create_each_block(ctx) {
    	var li, p, t0_value = ctx.tag + "", t0, t1, button, t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			t2 = space();
    			attr_dev(p, "class", "svelte-1falb4e");
    			add_location(p, file$3, 58, 4, 903);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1falb4e");
    			add_location(button, file$3, 59, 4, 920);
    			attr_dev(li, "class", "svelte-1falb4e");
    			add_location(li, file$3, 57, 2, 894);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, p);
    			append_dev(p, t0);
    			append_dev(li, t1);
    			append_dev(li, button);
    			append_dev(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.value) && t0_value !== (t0_value = ctx.tag + "")) {
    				set_data_dev(t0, t0_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(56:0) {#each value as tag}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var ul;

    	let each_value = ctx.value;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "svelte-1falb4e");
    			add_location(ul, file$3, 53, 0, 864);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) {
    				each_value = ctx.value;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { placeholder = '', value = [] } = $$props;

    	const writable_props = ['placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tag> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return { placeholder, value };
    }

    class Tag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tag", options, id: create_fragment$3.name });
    	}

    	get placeholder() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextArea.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/TextArea.svelte";

    function create_fragment$4(ctx) {
    	var textarea, dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.disabled = ctx.disabled;
    			attr_dev(textarea, "placeholder", ctx.placeholder);
    			attr_dev(textarea, "class", "svelte-o1jkx");
    			add_location(textarea, file$4, 36, 0, 648);
    			dispose = listen_dev(textarea, "input", ctx.textarea_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);

    			set_input_value(textarea, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(textarea, ctx.value);

    			if (changed.disabled) {
    				prop_dev(textarea, "disabled", ctx.disabled);
    			}

    			if (changed.placeholder) {
    				attr_dev(textarea, "placeholder", ctx.placeholder);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(textarea);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { disabled = false, placeholder = '', value = '' } = $$props;

    	const writable_props = ['disabled', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		placeholder,
    		value,
    		textarea_input_handler
    	};
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["disabled", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$4.name });
    	}

    	get disabled() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextInput.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/TextInput.svelte";

    function create_fragment$5(ctx) {
    	var input, dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-18nvst2");
    			add_location(input, file$5, 36, 0, 628);
    			dispose = listen_dev(input, "input", ctx.input_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { disabled = false, placeholder = '', value = '' } = $$props;

    	const writable_props = ['disabled', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		placeholder,
    		value,
    		input_input_handler
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, ["disabled", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextInput", options, id: create_fragment$5.name });
    	}

    	get disabled() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DeveloperForm.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/DeveloperForm.svelte";

    function create_fragment$6(ctx) {
    	var form, div2, t0, div0, t1, t2, div1, t3, t4, div5, div3, t5, div4, t6, t7, div8, div6, t8, div7, t9, t10, div11, div9, t11, div10, t12, current;

    	var avatar = new Avatar({ $$inline: true });

    	var textinput0 = new TextInput({
    		props: {
    		placeholder: "Name",
    		value: "Kevin Hoyt",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var textinput1 = new TextInput({
    		props: {
    		placeholder: "Email",
    		value: "krhoyt@us.ibm.com",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var tag0 = new Tag({
    		props: {
    		placeholder: "Labels",
    		value: ['IBM', 'Advocate']
    	},
    		$$inline: true
    	});

    	var tag1 = new Tag({
    		props: {
    		placeholder: "Skills",
    		value: ['HTML', 'CSS', 'JavaScript', 'SQL', 'Python', 'IoT']
    	},
    		$$inline: true
    	});

    	var textarea = new TextArea({
    		props: {
    		placeholder: "Description",
    		disabled: ctx.disabled,
    		value: "This guy works at IBM."
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			form = element("form");
    			div2 = element("div");
    			avatar.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput0.$$.fragment.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			textinput1.$$.fragment.c();
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			tag0.$$.fragment.c();
    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			t9 = space();
    			tag1.$$.fragment.c();
    			t10 = space();
    			div11 = element("div");
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");
    			t12 = space();
    			textarea.$$.fragment.c();
    			attr_dev(div0, "class", "gap svelte-7tqmxe");
    			add_location(div0, file$6, 64, 4, 940);
    			attr_dev(div1, "class", "gap svelte-7tqmxe");
    			add_location(div1, file$6, 69, 4, 1068);
    			attr_dev(div2, "class", "line svelte-7tqmxe");
    			add_location(div2, file$6, 62, 2, 903);
    			attr_dev(div3, "class", "icon labels svelte-7tqmxe");
    			add_location(div3, file$6, 77, 4, 1233);
    			attr_dev(div4, "class", "gap svelte-7tqmxe");
    			add_location(div4, file$6, 78, 4, 1269);
    			attr_dev(div5, "class", "line svelte-7tqmxe");
    			add_location(div5, file$6, 76, 2, 1210);
    			attr_dev(div6, "class", "icon skills svelte-7tqmxe");
    			add_location(div6, file$6, 83, 4, 1392);
    			attr_dev(div7, "class", "gap svelte-7tqmxe");
    			add_location(div7, file$6, 84, 4, 1428);
    			attr_dev(div8, "class", "line svelte-7tqmxe");
    			add_location(div8, file$6, 82, 2, 1369);
    			attr_dev(div9, "class", "icon bio svelte-7tqmxe");
    			add_location(div9, file$6, 89, 4, 1585);
    			attr_dev(div10, "class", "gap svelte-7tqmxe");
    			add_location(div10, file$6, 90, 4, 1618);
    			attr_dev(div11, "class", "line svelte-7tqmxe");
    			add_location(div11, file$6, 88, 2, 1562);
    			attr_dev(form, "class", "svelte-7tqmxe");
    			toggle_class(form, "display", ctx.visible);
    			add_location(form, file$6, 60, 0, 867);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div2);
    			mount_component(avatar, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			mount_component(textinput0, div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(textinput1, div2, null);
    			append_dev(form, t4);
    			append_dev(form, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div5, t6);
    			mount_component(tag0, div5, null);
    			append_dev(form, t7);
    			append_dev(form, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div8, t9);
    			mount_component(tag1, div8, null);
    			append_dev(form, t10);
    			append_dev(form, div11);
    			append_dev(div11, div9);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			append_dev(div11, t12);
    			mount_component(textarea, div11, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.disabled) textinput0_changes.disabled = ctx.disabled;
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.disabled) textinput1_changes.disabled = ctx.disabled;
    			textinput1.$set(textinput1_changes);

    			var textarea_changes = {};
    			if (changed.disabled) textarea_changes.disabled = ctx.disabled;
    			textarea.$set(textarea_changes);

    			if (changed.visible) {
    				toggle_class(form, "display", ctx.visible);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(tag0.$$.fragment, local);

    			transition_in(tag1.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(tag0.$$.fragment, local);
    			transition_out(tag1.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(avatar);

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(tag0);

    			destroy_component(tag1);

    			destroy_component(textarea);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

    let { disabled = true, visible = false } = $$props;

    	const writable_props = ['disabled', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DeveloperForm> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { disabled, visible };
    }

    class DeveloperForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["disabled", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DeveloperForm", options, id: create_fragment$6.name });
    	}

    	get disabled() {
    		throw new Error("<DeveloperForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<DeveloperForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<DeveloperForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<DeveloperForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DeveloperList.svelte generated by Svelte v3.12.1 */

    const file$7 = "src/DeveloperList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.developer = list[i];
    	return child_ctx;
    }

    // (97:0) {#each developers as developer}
    function create_each_block$1(ctx) {
    	var li, button, t0, p, t1_value = ctx.developer.name + "", t1, t2, li_data_id_value, dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "svelte-1xmfnyb");
    			add_location(button, file$7, 99, 4, 1601);
    			attr_dev(p, "class", "svelte-1xmfnyb");
    			add_location(p, file$7, 100, 4, 1623);
    			attr_dev(li, "data-id", li_data_id_value = ctx.developer.id);
    			attr_dev(li, "class", "svelte-1xmfnyb");
    			add_location(li, file$7, 98, 2, 1545);
    			dispose = listen_dev(li, "click", ctx.doSelect);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(li, t0);
    			append_dev(li, p);
    			append_dev(p, t1);
    			append_dev(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.developers) && t1_value !== (t1_value = ctx.developer.name + "")) {
    				set_data_dev(t1, t1_value);
    			}

    			if ((changed.developers) && li_data_id_value !== (li_data_id_value = ctx.developer.id)) {
    				attr_dev(li, "data-id", li_data_id_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(97:0) {#each developers as developer}", ctx });
    	return block;
    }

    function create_fragment$7(ctx) {
    	var div, button, t0, h4, t2, ul;

    	let each_value = ctx.developers;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = space();
    			h4 = element("h4");
    			h4.textContent = "Developers";
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(button, "class", "svelte-1xmfnyb");
    			add_location(button, file$7, 90, 2, 1456);
    			attr_dev(h4, "class", "svelte-1xmfnyb");
    			add_location(h4, file$7, 91, 2, 1476);
    			attr_dev(div, "class", "svelte-1xmfnyb");
    			add_location(div, file$7, 89, 0, 1448);
    			attr_dev(ul, "class", "svelte-1xmfnyb");
    			add_location(ul, file$7, 94, 0, 1504);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t0);
    			append_dev(div, h4);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.developers) {
    				each_value = ctx.developers;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    				detach_dev(t2);
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { developers = [], selected = null } = $$props;

    const dispatch = createEventDispatcher();

    function doSelect( evt ) {
      let id = evt.target.getAttribute( 'data-id' );

      for( let d = 0; d < developers.length; d++ ) {
        if( developers[d].id === id ) {
          $$invalidate('selected', selected = developers[d]);
          break;
        }
      }

      dispatch( 'change', {
        selectedItem: selected
      } );
    }

    	const writable_props = ['developers', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DeveloperList> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { developers, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return { developers, selected, doSelect };
    }

    class DeveloperList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, ["developers", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DeveloperList", options, id: create_fragment$7.name });
    	}

    	get developers() {
    		throw new Error("<DeveloperList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set developers(value) {
    		throw new Error("<DeveloperList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<DeveloperList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<DeveloperList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$8 = "src/Select.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (48:0) {#each options as option}
    function create_each_block$2(ctx) {
    	var option, t_value = ctx.option[ctx.label] + "", t, option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.option[ctx.value];
    			option.value = option.__value;
    			add_location(option, file$8, 48, 2, 952);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.options || changed.label) && t_value !== (t_value = ctx.option[ctx.label] + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.options || changed.value) && option_value_value !== (option_value_value = ctx.option[ctx.value])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(option);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(48:0) {#each options as option}", ctx });
    	return block;
    }

    function create_fragment$8(ctx) {
    	var select, dispose;

    	let each_value = ctx.options;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr_dev(select, "class", "svelte-lm9cgx");
    			add_location(select, file$8, 45, 0, 890);
    			dispose = listen_dev(select, "change", ctx.select_change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
    		},

    		p: function update(changed, ctx) {
    			if (changed.options || changed.value || changed.label) {
    				each_value = ctx.options;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) select_option(select, ctx.selected);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(select);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { value = 'id', label = 'name', options = [], selected = null } = $$props;

    	const writable_props = ['value', 'label', 'options', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('options', options);
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { value, label, options, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		value,
    		label,
    		options,
    		selected,
    		select_change_handler
    	};
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, ["value", "label", "options", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$8.name });
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Notes.svelte generated by Svelte v3.12.1 */

    const file$9 = "src/Notes.svelte";

    function create_fragment$9(ctx) {
    	var div2, form, div0, p0, t1, updating_selected, t2, updating_value, t3, div1, t4, p1, current;

    	function select_selected_binding(value) {
    		ctx.select_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		options: ctx.activity,
    		value: "id",
    		label: "name"
    	};
    	if (ctx.activity_id !== void 0) {
    		select_props.selected = ctx.activity_id;
    	}
    	var select = new Select({ props: select_props, $$inline: true });

    	binding_callbacks.push(() => bind(select, 'selected', select_selected_binding));

    	function textarea_value_binding(value_1) {
    		ctx.textarea_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textarea_props = { placeholder: "What happened?" };
    	if (ctx.text !== void 0) {
    		textarea_props.value = ctx.text;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	var button = new Button({
    		props: { label: "Save", disabled: ctx.text.trim().length > 0 ? false : true },
    		$$inline: true
    	});
    	button.$on("click", ctx.doSave);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Where:";
    			t1 = space();
    			select.$$.fragment.c();
    			t2 = space();
    			textarea.$$.fragment.c();
    			t3 = space();
    			div1 = element("div");
    			button.$$.fragment.c();
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Notes";
    			attr_dev(p0, "class", "svelte-3vm7ki");
    			add_location(p0, file$9, 83, 6, 1502);
    			attr_dev(div0, "class", "activity svelte-3vm7ki");
    			add_location(div0, file$9, 82, 4, 1473);
    			attr_dev(div1, "class", "controls svelte-3vm7ki");
    			add_location(div1, file$9, 87, 4, 1693);
    			attr_dev(form, "class", "svelte-3vm7ki");
    			add_location(form, file$9, 81, 2, 1462);
    			attr_dev(p1, "class", "svelte-3vm7ki");
    			add_location(p1, file$9, 94, 2, 1877);
    			attr_dev(div2, "class", "panel svelte-3vm7ki");
    			set_style(div2, "display", (ctx.visible ? 'flex': 'none'));
    			add_location(div2, file$9, 80, 0, 1396);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			mount_component(select, div0, null);
    			append_dev(form, t2);
    			mount_component(textarea, form, null);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			mount_component(button, div1, null);
    			append_dev(div2, t4);
    			append_dev(div2, p1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var select_changes = {};
    			if (changed.activity) select_changes.options = ctx.activity;
    			if (!updating_selected && changed.activity_id) {
    				select_changes.selected = ctx.activity_id;
    			}
    			select.$set(select_changes);

    			var textarea_changes = {};
    			if (!updating_value && changed.text) {
    				textarea_changes.value = ctx.text;
    			}
    			textarea.$set(textarea_changes);

    			var button_changes = {};
    			if (changed.text) button_changes.disabled = ctx.text.trim().length > 0 ? false : true;
    			button.$set(button_changes);

    			if (!current || changed.visible) {
    				set_style(div2, "display", (ctx.visible ? 'flex': 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div2);
    			}

    			destroy_component(select);

    			destroy_component(textarea);

    			destroy_component(button);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

    let { developer = null, visible = false } = $$props;

    let activity = [];
    let activity_id = null;
    let text = '';

    onMount( async () => {
      $$invalidate('activity', activity = await fetch( '/api/activity' )
      .then( ( response ) => response.json() ));
      $$invalidate('activity_id', activity_id = activity[0].id);
    } );

    function doSave( evt ) {
      fetch( '/api/developer/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          developer_id: developer.id,
          activity_id: activity_id,
          full_text: text
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $$invalidate('text', text = '');
      } );
    }

    	const writable_props = ['developer', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Notes> was created with unknown prop '${key}'`);
    	});

    	function select_selected_binding(value) {
    		activity_id = value;
    		$$invalidate('activity_id', activity_id);
    	}

    	function textarea_value_binding(value_1) {
    		text = value_1;
    		$$invalidate('text', text);
    	}

    	$$self.$set = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { developer, visible, activity, activity_id, text };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    		if ('activity_id' in $$props) $$invalidate('activity_id', activity_id = $$props.activity_id);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return {
    		developer,
    		visible,
    		activity,
    		activity_id,
    		text,
    		doSave,
    		select_selected_binding,
    		textarea_value_binding
    	};
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, ["developer", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$9.name });
    	}

    	get developer() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set developer(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Search.svelte generated by Svelte v3.12.1 */

    const file$a = "src/Search.svelte";

    function create_fragment$a(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-kf58ke");
    			add_location(input, file$a, 23, 0, 446);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { placeholder = 'Search' } = $$props;

    	const writable_props = ['placeholder'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => {
    		return { placeholder };
    	};

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    	};

    	return { placeholder };
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, ["placeholder"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$a.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tabs.svelte generated by Svelte v3.12.1 */

    const file$b = "src/Tabs.svelte";

    function create_fragment$b(ctx) {
    	var div, button0, t1, button1, t3, button2, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Overview";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Social";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Notes";
    			attr_dev(button0, "data-index", "0");
    			attr_dev(button0, "class", "svelte-ygnrif");
    			toggle_class(button0, "selected", ctx.selectedIndex === 0);
    			add_location(button0, file$b, 40, 2, 721);
    			attr_dev(button1, "data-index", "1");
    			attr_dev(button1, "class", "svelte-ygnrif");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$b, 44, 2, 840);
    			attr_dev(button2, "data-index", "2");
    			attr_dev(button2, "class", "svelte-ygnrif");
    			toggle_class(button2, "selected", ctx.selectedIndex === 2);
    			add_location(button2, file$b, 48, 2, 959);
    			attr_dev(div, "class", "svelte-ygnrif");
    			add_location(div, file$b, 39, 0, 713);

    			dispose = [
    				listen_dev(button0, "click", ctx.doTabClick),
    				listen_dev(button1, "click", ctx.doTabClick),
    				listen_dev(button2, "click", ctx.doTabClick)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedIndex) {
    				toggle_class(button0, "selected", ctx.selectedIndex === 0);
    				toggle_class(button1, "selected", ctx.selectedIndex === 1);
    				toggle_class(button2, "selected", ctx.selectedIndex === 2);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { selectedIndex = 0 } = $$props;

    const dispatch = createEventDispatcher();

    function doTabClick( evt ) {
      $$invalidate('selectedIndex', selectedIndex = parseInt( evt.target.getAttribute( 'data-index' ) ));
      dispatch( 'tab', selectedIndex );
    }

    	const writable_props = ['selectedIndex'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	$$self.$capture_state = () => {
    		return { selectedIndex };
    	};

    	$$self.$inject_state = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	return { selectedIndex, doTabClick };
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tabs", options, id: create_fragment$b.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Timeline.svelte generated by Svelte v3.12.1 */

    const file$c = "src/Timeline.svelte";

    function create_fragment$c(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Timeline";
    			add_location(p, file$c, 16, 2, 172);
    			attr_dev(div, "class", "svelte-v4jhh2");
    			toggle_class(div, "display", ctx.visible);
    			add_location(div, file$c, 15, 0, 138);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},

    		p: function update(changed, ctx) {
    			if (changed.visible) {
    				toggle_class(div, "display", ctx.visible);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { visible = false } = $$props;

    	const writable_props = ['visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { visible };
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timeline", options, id: create_fragment$c.name });
    	}

    	get visible() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DevelopersPanel.svelte generated by Svelte v3.12.1 */

    const file$d = "src/DevelopersPanel.svelte";

    function create_fragment$d(ctx) {
    	var div1, aside0, div0, t0, t1, t2, article, t3, t4, t5, t6, t7, aside1, current;

    	var search = new Search({ $$inline: true });

    	var button = new Button({
    		props: { label: "Add", icon: "/img/add.svg" },
    		$$inline: true
    	});
    	button.$on("click", doAdd);

    	var developerlist = new DeveloperList({
    		props: { developers: ctx.developers },
    		$$inline: true
    	});
    	developerlist.$on("change", ctx.doDeveloperChange);

    	var tabs = new Tabs({ $$inline: true });
    	tabs.$on("tab", ctx.tab_handler);

    	var developerform = new DeveloperForm({
    		props: { visible: ctx.selectedPanel === 0 ? true : false },
    		$$inline: true
    	});

    	var timeline = new Timeline({
    		props: { visible: ctx.selectedPanel === 1 ? true : false },
    		$$inline: true
    	});

    	var notes = new Notes({
    		props: {
    		developer: ctx.selectedDeveloper,
    		visible: ctx.selectedPanel === 2 ? true : false
    	},
    		$$inline: true
    	});

    	var controls = new Controls({
    		props: { visible: ctx.selectedPanel < 2 ? true : false },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			aside0 = element("aside");
    			div0 = element("div");
    			search.$$.fragment.c();
    			t0 = space();
    			button.$$.fragment.c();
    			t1 = space();
    			developerlist.$$.fragment.c();
    			t2 = space();
    			article = element("article");
    			tabs.$$.fragment.c();
    			t3 = space();
    			developerform.$$.fragment.c();
    			t4 = space();
    			timeline.$$.fragment.c();
    			t5 = space();
    			notes.$$.fragment.c();
    			t6 = space();
    			controls.$$.fragment.c();
    			t7 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-1ykw51j");
    			add_location(div0, file$d, 65, 4, 1301);
    			attr_dev(aside0, "class", "svelte-1ykw51j");
    			add_location(aside0, file$d, 64, 2, 1289);
    			attr_dev(article, "class", "svelte-1ykw51j");
    			add_location(article, file$d, 76, 2, 1608);
    			attr_dev(aside1, "class", "svelte-1ykw51j");
    			add_location(aside1, file$d, 85, 2, 1992);
    			attr_dev(div1, "class", "panel svelte-1ykw51j");
    			add_location(div1, file$d, 63, 0, 1267);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, aside0);
    			append_dev(aside0, div0);
    			mount_component(search, div0, null);
    			append_dev(div0, t0);
    			mount_component(button, div0, null);
    			append_dev(aside0, t1);
    			mount_component(developerlist, aside0, null);
    			append_dev(div1, t2);
    			append_dev(div1, article);
    			mount_component(tabs, article, null);
    			append_dev(article, t3);
    			mount_component(developerform, article, null);
    			append_dev(article, t4);
    			mount_component(timeline, article, null);
    			append_dev(article, t5);
    			mount_component(notes, article, null);
    			append_dev(article, t6);
    			mount_component(controls, article, null);
    			append_dev(div1, t7);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var developerlist_changes = {};
    			if (changed.developers) developerlist_changes.developers = ctx.developers;
    			developerlist.$set(developerlist_changes);

    			var developerform_changes = {};
    			if (changed.selectedPanel) developerform_changes.visible = ctx.selectedPanel === 0 ? true : false;
    			developerform.$set(developerform_changes);

    			var timeline_changes = {};
    			if (changed.selectedPanel) timeline_changes.visible = ctx.selectedPanel === 1 ? true : false;
    			timeline.$set(timeline_changes);

    			var notes_changes = {};
    			if (changed.selectedDeveloper) notes_changes.developer = ctx.selectedDeveloper;
    			if (changed.selectedPanel) notes_changes.visible = ctx.selectedPanel === 2 ? true : false;
    			notes.$set(notes_changes);

    			var controls_changes = {};
    			if (changed.selectedPanel) controls_changes.visible = ctx.selectedPanel < 2 ? true : false;
    			controls.$set(controls_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(developerlist.$$.fragment, local);

    			transition_in(tabs.$$.fragment, local);

    			transition_in(developerform.$$.fragment, local);

    			transition_in(timeline.$$.fragment, local);

    			transition_in(notes.$$.fragment, local);

    			transition_in(controls.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(developerlist.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			transition_out(developerform.$$.fragment, local);
    			transition_out(timeline.$$.fragment, local);
    			transition_out(notes.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(search);

    			destroy_component(button);

    			destroy_component(developerlist);

    			destroy_component(tabs);

    			destroy_component(developerform);

    			destroy_component(timeline);

    			destroy_component(notes);

    			destroy_component(controls);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    function doAdd( evt ) {
    console.log( 'Add developer.' );
    }

    function instance$c($$self, $$props, $$invalidate) {
    	

    let developers = [];
    let labels = [];
    let selectedDeveloper = null;
    let selectedPanel = 0;

    onMount( async () => {
      $$invalidate('developers', developers = await fetch( '/api/developer' )
      .then( ( response ) => response.json() ));

      labels = await fetch( '/api/label' )
      .then( ( response ) => response.json() );  
    } );

    function doDeveloperChange( evt ) {
      $$invalidate('selectedDeveloper', selectedDeveloper = evt.detail.selectedItem);
    }

    	const tab_handler = (evt) => $$invalidate('selectedPanel', selectedPanel = evt.detail);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    		if ('labels' in $$props) labels = $$props.labels;
    		if ('selectedDeveloper' in $$props) $$invalidate('selectedDeveloper', selectedDeveloper = $$props.selectedDeveloper);
    		if ('selectedPanel' in $$props) $$invalidate('selectedPanel', selectedPanel = $$props.selectedPanel);
    	};

    	return {
    		developers,
    		selectedDeveloper,
    		selectedPanel,
    		doDeveloperChange,
    		tab_handler
    	};
    }

    class DevelopersPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DevelopersPanel", options, id: create_fragment$d.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Header.svelte";

    function create_fragment$e(ctx) {
    	var div, p0, t0, span, t2, p1, t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("Avocado ");
    			span = element("span");
    			span.textContent = "Developer Relations";
    			t2 = space();
    			p1 = element("p");
    			t3 = text(ctx.version);
    			attr_dev(span, "class", "svelte-13teco");
    			add_location(span, file$e, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$e, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$e, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$e, 35, 0, 439);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.version) {
    				set_data_dev(t3, ctx.version);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { version = '2019.10.21' } = $$props;

    	const writable_props = ['version'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('version' in $$props) $$invalidate('version', version = $$props.version);
    	};

    	$$self.$capture_state = () => {
    		return { version };
    	};

    	$$self.$inject_state = $$props => {
    		if ('version' in $$props) $$invalidate('version', version = $$props.version);
    	};

    	return { version };
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$e, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$e.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$f = "src/Switcher.svelte";

    function create_fragment$f(ctx) {
    	var div, button0, t_1, button1, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Developers";
    			t_1 = space();
    			button1 = element("button");
    			button1.textContent = "Repositories";
    			attr_dev(button0, "class", "svelte-1tj6usy");
    			toggle_class(button0, "selected", ctx.selectedIndex === 0);
    			add_location(button0, file$f, 32, 2, 504);
    			attr_dev(button1, "class", "svelte-1tj6usy");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$f, 35, 2, 619);
    			attr_dev(div, "class", "svelte-1tj6usy");
    			add_location(div, file$f, 31, 0, 496);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t_1);
    			append_dev(div, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedIndex) {
    				toggle_class(button0, "selected", ctx.selectedIndex === 0);
    				toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { selectedIndex = 0 } = $$props;

    	const writable_props = ['selectedIndex'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate('selectedIndex', selectedIndex = 0);

    	const click_handler_1 = () => $$invalidate('selectedIndex', selectedIndex = 1);

    	$$self.$set = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	$$self.$capture_state = () => {
    		return { selectedIndex };
    	};

    	$$self.$inject_state = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	return {
    		selectedIndex,
    		click_handler,
    		click_handler_1
    	};
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$f, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$f.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$g(ctx) {
    	var t0, t1, current;

    	var header = new Header({ $$inline: true });

    	var switcher = new Switcher({ $$inline: true });

    	var developerspanel = new DevelopersPanel({ $$inline: true });

    	const block = {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			switcher.$$.fragment.c();
    			t1 = space();
    			developerspanel.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(switcher, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(developerspanel, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(switcher.$$.fragment, local);

    			transition_in(developerspanel.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(switcher.$$.fragment, local);
    			transition_out(developerspanel.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(header, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(switcher, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(developerspanel, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$g, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$g.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
