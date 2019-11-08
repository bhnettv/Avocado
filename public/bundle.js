
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    const globals = (typeof window !== 'undefined' ? window : global);

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

    // (150:0) {:else}
    function create_else_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1swinel");
    			set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			toggle_class(button, "small", ctx.size === 'small' ? true : false);
    			add_location(button, file, 151, 0, 2403);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (!current || changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((!current || changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1swinel")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || changed.disabled || changed.disabledIcon || changed.icon) {
    				set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			}

    			if (!current || changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			}

    			if ((changed.kind || changed.size)) {
    				toggle_class(button, "small", ctx.size === 'small' ? true : false);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(150:0) {:else}", ctx });
    	return block;
    }

    // (137:0) {#if icon === null}
    function create_if_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1swinel");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			toggle_class(button, "small", ctx.size === 'small' ? true : false);
    			add_location(button, file, 138, 0, 2169);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (!current || changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((!current || changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1swinel")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			}

    			if ((changed.kind || changed.size)) {
    				toggle_class(button, "small", ctx.size === 'small' ? true : false);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(137:0) {#if icon === null}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.icon === null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { disabled = false, icon = null, disabledIcon = null, label = '', kind = 'primary', size = 'large', title = '', visible = true } = $$props;

    const dispatch = createEventDispatcher();

    function doClick( evt ) {
      dispatch( 'click', null );
    }

    	const writable_props = ['disabled', 'icon', 'disabledIcon', 'label', 'kind', 'size', 'title', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('disabledIcon' in $$props) $$invalidate('disabledIcon', disabledIcon = $$props.disabledIcon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, icon, disabledIcon, label, kind, size, title, visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('disabledIcon' in $$props) $$invalidate('disabledIcon', disabledIcon = $$props.disabledIcon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return {
    		disabled,
    		icon,
    		disabledIcon,
    		label,
    		kind,
    		size,
    		title,
    		visible,
    		doClick,
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["disabled", "icon", "disabledIcon", "label", "kind", "size", "title", "visible"]);
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

    	get disabledIcon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabledIcon(value) {
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

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Details.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Details.svelte";

    function create_fragment$1(ctx) {
    	var div1, div0, p, t0, t1, button, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(ctx.summary);
    			t1 = space();
    			button = element("button");
    			t2 = space();

    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "svelte-luq7pz");
    			add_location(p, file$1, 55, 4, 913);
    			attr_dev(button, "class", "svelte-luq7pz");
    			toggle_class(button, "closed", !ctx.opened);
    			add_location(button, file$1, 56, 4, 934);
    			attr_dev(div0, "class", "summary svelte-luq7pz");
    			add_location(div0, file$1, 54, 2, 887);

    			attr_dev(div1, "class", "pane svelte-luq7pz");
    			toggle_class(div1, "closed", !ctx.opened);
    			add_location(div1, file$1, 53, 0, 841);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.summary) {
    				set_data_dev(t0, ctx.summary);
    			}

    			if (changed.opened) {
    				toggle_class(button, "closed", !ctx.opened);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.opened) {
    				toggle_class(div1, "closed", !ctx.opened);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { opened = true, summary = 'Details' } = $$props;

    	const writable_props = ['opened', 'summary'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Details> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = (evt) => $$invalidate('opened', opened = !opened);

    	$$self.$set = $$props => {
    		if ('opened' in $$props) $$invalidate('opened', opened = $$props.opened);
    		if ('summary' in $$props) $$invalidate('summary', summary = $$props.summary);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { opened, summary };
    	};

    	$$self.$inject_state = $$props => {
    		if ('opened' in $$props) $$invalidate('opened', opened = $$props.opened);
    		if ('summary' in $$props) $$invalidate('summary', summary = $$props.summary);
    	};

    	return {
    		opened,
    		summary,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Details extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["opened", "summary"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Details", options, id: create_fragment$1.name });
    	}

    	get opened() {
    		throw new Error("<Details>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opened(value) {
    		throw new Error("<Details>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summary() {
    		throw new Error("<Details>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summary(value) {
    		throw new Error("<Details>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/List.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/List.svelte";

    const get_default_slot_changes = ({ item, data }) => ({ item: data });
    const get_default_slot_context = ({ item, data }) => ({ item: item });

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (57:2) {#each data as item, i}
    function create_each_block(ctx) {
    	var li, t, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();
    			t = space();

    			attr_dev(li, "class", "svelte-sroauh");
    			toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
    			add_location(li, file$2, 58, 4, 862);
    			dispose = listen_dev(li, "click", click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(li_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			append_dev(li, t);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (default_slot && default_slot.p && (changed.$$scope || changed.data)) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, get_default_slot_changes),
    					get_slot_context(default_slot_template, ctx, get_default_slot_context)
    				);
    			}

    			if (changed.selectedIndex) {
    				toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(57:2) {#each data as item, i}", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var ul, current;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "svelte-sroauh");
    			add_location(ul, file$2, 54, 0, 821);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedIndex || changed.$$scope || changed.data) {
    				each_value = ctx.data;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { data = [], selectedIndex = undefined, selectedItem = undefined } = $$props;

    const dispatch = createEventDispatcher();

    function doSelect( item, index ) { 
      $$invalidate('selectedItem', selectedItem = item);
      $$invalidate('selectedIndex', selectedIndex = index);

      dispatch( 'change', {
        item: selectedItem,
        index: selectedIndex
      } );
    }

    	const writable_props = ['data', 'selectedIndex', 'selectedItem'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = ({ item, i }) => doSelect( item, i );

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { data, selectedIndex, selectedItem };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    	};

    	return {
    		data,
    		selectedIndex,
    		selectedItem,
    		doSelect,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["data", "selectedIndex", "selectedItem"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "List", options, id: create_fragment$2.name });
    	}

    	get data() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedItem() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedItem(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ListCountItem.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/ListCountItem.svelte";

    function create_fragment$3(ctx) {
    	var p, t0, t1, span, t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(ctx.label);
    			t1 = space();
    			span = element("span");
    			t2 = text(ctx.count);
    			attr_dev(span, "class", "svelte-1kqfkdt");
    			add_location(span, file$3, 22, 11, 303);
    			attr_dev(p, "class", "svelte-1kqfkdt");
    			add_location(p, file$3, 22, 0, 292);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, span);
    			append_dev(span, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t0, ctx.label);
    			}

    			if (changed.count) {
    				set_data_dev(t2, ctx.count);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { count = 0, label = '' } = $$props;

    	const writable_props = ['count', 'label'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ListCountItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    	};

    	$$self.$capture_state = () => {
    		return { count, label };
    	};

    	$$self.$inject_state = $$props => {
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    	};

    	return { count, label };
    }

    class ListCountItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["count", "label"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListCountItem", options, id: create_fragment$3.name });
    	}

    	get count() {
    		throw new Error("<ListCountItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<ListCountItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<ListCountItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<ListCountItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ListRemoveItem.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/ListRemoveItem.svelte";

    function create_fragment$4(ctx) {
    	var div, p, t0, t1, button, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(ctx.label);
    			t1 = space();
    			button = element("button");
    			attr_dev(p, "class", "svelte-1ay92a1");
    			add_location(p, file$4, 45, 2, 699);
    			set_style(button, "display", (ctx.deletable ? 'initial' : 'none'));
    			attr_dev(button, "class", "svelte-1ay92a1");
    			add_location(button, file$4, 46, 2, 716);
    			attr_dev(div, "class", "svelte-1ay92a1");
    			add_location(div, file$4, 42, 0, 606);

    			dispose = [
    				listen_dev(button, "click", ctx.click_handler),
    				listen_dev(div, "mouseover", ctx.mouseover_handler),
    				listen_dev(div, "mouseout", ctx.mouseout_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t0, ctx.label);
    			}

    			if (changed.deletable) {
    				set_style(button, "display", (ctx.deletable ? 'initial' : 'none'));
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { label = '' } = $$props;

    let deletable = false;

    	const writable_props = ['label'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ListRemoveItem> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const mouseover_handler = () => $$invalidate('deletable', deletable = true);

    	const mouseout_handler = () => $$invalidate('deletable', deletable = false);

    	$$self.$set = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    	};

    	$$self.$capture_state = () => {
    		return { label, deletable };
    	};

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('deletable' in $$props) $$invalidate('deletable', deletable = $$props.deletable);
    	};

    	return {
    		label,
    		deletable,
    		click_handler,
    		mouseover_handler,
    		mouseout_handler
    	};
    }

    class ListRemoveItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["label"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListRemoveItem", options, id: create_fragment$4.name });
    	}

    	get label() {
    		throw new Error("<ListRemoveItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<ListRemoveItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/Select.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (115:2) {#if label !== undefined}
    function create_if_block_4(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-f9tcyz");
    			add_location(label_1, file$5, 115, 4, 2092);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_4.name, type: "if", source: "(115:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (119:2) {#if inline === false}
    function create_if_block_2(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.helper !== ctx.undefined) && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.helper !== ctx.undefined) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(119:2) {#if inline === false}", ctx });
    	return block;
    }

    // (120:4) {#if helper !== undefined}
    function create_if_block_3(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			attr_dev(p, "class", "svelte-f9tcyz");
    			add_location(p, file$5, 120, 6, 2236);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3.name, type: "if", source: "(120:4) {#if helper !== undefined}", ctx });
    	return block;
    }

    // (131:4) {#each options as option}
    function create_each_block$1(ctx) {
    	var option, t_value = ctx.option[ctx.labelField] + "", t, option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.option[ctx.dataField];
    			option.value = option.__value;
    			add_location(option, file$5, 131, 6, 2452);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.options || changed.labelField) && t_value !== (t_value = ctx.option[ctx.labelField] + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.options || changed.dataField) && option_value_value !== (option_value_value = ctx.option[ctx.dataField])) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(131:4) {#each options as option}", ctx });
    	return block;
    }

    // (136:2) {#if inline === true}
    function create_if_block$1(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.helper !== ctx.undefined) && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.helper !== ctx.undefined) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(136:2) {#if inline === true}", ctx });
    	return block;
    }

    // (137:4) {#if helper !== undefined}
    function create_if_block_1(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			attr_dev(p, "class", "svelte-f9tcyz");
    			add_location(p, file$5, 137, 6, 2608);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(137:4) {#if helper !== undefined}", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var div, t0, t1, select, t2, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_4(ctx);

    	var if_block1 = (ctx.inline === false) && create_if_block_2(ctx);

    	let each_value = ctx.options;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	var if_block2 = (ctx.inline === true) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block2) if_block2.c();
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			select.disabled = ctx.disabled;
    			attr_dev(select, "class", "svelte-f9tcyz");
    			toggle_class(select, "inline", ctx.inline);
    			toggle_class(select, "outline", ctx.inline === false ? true : false);
    			add_location(select, file$5, 124, 2, 2275);
    			attr_dev(div, "class", "svelte-f9tcyz");
    			toggle_class(div, "inline", ctx.inline);
    			toggle_class(div, "outline", ctx.inline === false ? true : false);
    			add_location(div, file$5, 112, 0, 1990);

    			dispose = [
    				listen_dev(select, "change", ctx.select_change_handler),
    				listen_dev(select, "change", ctx.change_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);

    			append_dev(div, t2);
    			if (if_block2) if_block2.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.inline === false) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.options || changed.dataField || changed.labelField) {
    				each_value = ctx.options;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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

    			if (changed.disabled) {
    				prop_dev(select, "disabled", ctx.disabled);
    			}

    			if (changed.inline) {
    				toggle_class(select, "inline", ctx.inline);
    				toggle_class(select, "outline", ctx.inline === false ? true : false);
    			}

    			if (ctx.inline === true) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (changed.inline) {
    				toggle_class(div, "inline", ctx.inline);
    				toggle_class(div, "outline", ctx.inline === false ? true : false);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			destroy_each(each_blocks, detaching);

    			if (if_block2) if_block2.d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { dataField = 'data', disabled = false, helper = undefined, inline = false, label = undefined, labelField = 'label', options = [], selected = null, value = 'id' } = $$props;

    	const writable_props = ['dataField', 'disabled', 'helper', 'inline', 'label', 'labelField', 'options', 'selected', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('options', options);
    		$$invalidate('dataField', dataField);
    	}

    	$$self.$set = $$props => {
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('inline' in $$props) $$invalidate('inline', inline = $$props.inline);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { dataField, disabled, helper, inline, label, labelField, options, selected, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('inline' in $$props) $$invalidate('inline', inline = $$props.inline);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		dataField,
    		disabled,
    		helper,
    		inline,
    		label,
    		labelField,
    		options,
    		selected,
    		value,
    		undefined,
    		change_handler,
    		select_change_handler
    	};
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["dataField", "disabled", "helper", "inline", "label", "labelField", "options", "selected", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$5.name });
    	}

    	get dataField() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataField(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
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

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Menu.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/Menu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (51:2) {#each options as item, i}
    function create_each_block$2(ctx) {
    	var li, button, t0_value = ctx.item[ctx.labelField] + "", t0, t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-sc289e");
    			add_location(button, file$6, 53, 6, 882);
    			attr_dev(li, "class", "svelte-sc289e");
    			toggle_class(li, "selected", ctx.index === ctx.i ? true : false);
    			add_location(li, file$6, 52, 4, 825);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.options || changed.labelField) && t0_value !== (t0_value = ctx.item[ctx.labelField] + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if (changed.index) {
    				toggle_class(li, "selected", ctx.index === ctx.i ? true : false);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(51:2) {#each options as item, i}", ctx });
    	return block;
    }

    function create_fragment$6(ctx) {
    	var ul;

    	let each_value = ctx.options;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			set_style(ul, "top", "" + ctx.top + "px");
    			attr_dev(ul, "class", "svelte-sc289e");
    			add_location(ul, file$6, 48, 0, 759);
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
    			if (changed.index || changed.options || changed.labelField) {
    				each_value = ctx.options;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.top) {
    				set_style(ul, "top", "" + ctx.top + "px");
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { index = -1, labelField = 'label', options = [], top = 0 } = $$props;

    	const writable_props = ['index', 'labelField', 'options', 'top'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('top' in $$props) $$invalidate('top', top = $$props.top);
    	};

    	$$self.$capture_state = () => {
    		return { index, labelField, options, top };
    	};

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('top' in $$props) $$invalidate('top', top = $$props.top);
    	};

    	return { index, labelField, options, top };
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["index", "labelField", "options", "top"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Menu", options, id: create_fragment$6.name });
    	}

    	get index() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tag.svelte generated by Svelte v3.12.1 */

    const file$7 = "src/Tag.svelte";

    function create_fragment$7(ctx) {
    	var div, p, t, button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");

    			if (default_slot) default_slot.c();
    			t = space();
    			button = element("button");

    			attr_dev(p, "class", "svelte-1vqvdip");
    			add_location(p, file$7, 46, 2, 774);
    			attr_dev(button, "type", "button");
    			set_style(button, "display", (ctx.disabled ? 'none' : 'initial'));
    			attr_dev(button, "class", "svelte-1vqvdip");
    			add_location(button, file$7, 47, 2, 797);
    			attr_dev(div, "class", "tag svelte-1vqvdip");
    			toggle_class(div, "disabled", ctx.disabled);
    			add_location(div, file$7, 45, 0, 726);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(p_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			append_dev(div, t);
    			append_dev(div, button);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.disabled) {
    				set_style(button, "display", (ctx.disabled ? 'none' : 'initial'));
    			}

    			if (changed.disabled) {
    				toggle_class(div, "disabled", ctx.disabled);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { disabled = false } = $$props;

    	const writable_props = ['disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tag> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { disabled };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	return {
    		disabled,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Tag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tag", options, id: create_fragment$7.name });
    	}

    	get disabled() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TagInput.svelte generated by Svelte v3.12.1 */
    const { Object: Object_1, console: console_1 } = globals;

    const file$8 = "src/TagInput.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = Object_1.create(ctx);
    	child_ctx.tag = list[i];
    	child_ctx.t = i;
    	return child_ctx;
    }

    // (286:2) {#if label !== undefined}
    function create_if_block_2$1(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-sznk6l");
    			add_location(label_1, file$8, 287, 4, 6039);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2$1.name, type: "if", source: "(286:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (292:2) {#if helper !== undefined}
    function create_if_block_1$1(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-sznk6l");
    			add_location(p, file$8, 293, 4, 6156);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(292:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    // (301:6) <Tag          {disabled}          on:click="{() => doRemove( tag[dataField], t )}">
    function create_default_slot(ctx) {
    	var t_value = ctx.tag[ctx.labelField] + "", t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.value || changed.labelField) && t_value !== (t_value = ctx.tag[ctx.labelField] + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(301:6) <Tag          {disabled}          on:click=\"{() => doRemove( tag[dataField], t )}\">", ctx });
    	return block;
    }

    // (300:4) {#each value as tag, t}
    function create_each_block$3(ctx) {
    	var current;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	var tag = new Tag({
    		props: {
    		disabled: ctx.disabled,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tag.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			tag.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(tag, target, anchor);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			var tag_changes = {};
    			if (changed.disabled) tag_changes.disabled = ctx.disabled;
    			if (changed.$$scope || changed.value || changed.labelField) tag_changes.$$scope = { changed, ctx };
    			tag.$set(tag_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(tag.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tag.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(tag, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$3.name, type: "each", source: "(300:4) {#each value as tag, t}", ctx });
    	return block;
    }

    // (316:2) {#if menu.length > 0}
    function create_if_block$2(ctx) {
    	var current;

    	var menu_1 = new Menu({
    		props: {
    		index: ctx.index,
    		options: ctx.menu,
    		top: ctx.height + 3,
    		labelField: "name"
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			menu_1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(menu_1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var menu_1_changes = {};
    			if (changed.index) menu_1_changes.index = ctx.index;
    			if (changed.menu) menu_1_changes.options = ctx.menu;
    			if (changed.height) menu_1_changes.top = ctx.height + 3;
    			menu_1.$set(menu_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(menu_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(menu_1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(316:2) {#if menu.length > 0}", ctx });
    	return block;
    }

    function create_fragment$8(ctx) {
    	var div1, t0, t1, div0, t2, input, t3, current, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_2$1(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block_1$1(ctx);

    	let each_value = ctx.value;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	var if_block2 = (ctx.menu.length > 0) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			input = element("input");
    			t3 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-sznk6l");
    			add_location(input, file$8, 305, 4, 6471);
    			attr_dev(div0, "class", "content svelte-sznk6l");
    			toggle_class(div0, "focus", ctx.focus);
    			toggle_class(div0, "disabled", ctx.disabled);
    			add_location(div0, file$8, 297, 2, 6234);
    			attr_dev(div1, "class", "control svelte-sznk6l");
    			add_location(div1, file$8, 283, 0, 5961);

    			dispose = [
    				listen_dev(input, "keyup", ctx.doKeyUp),
    				listen_dev(input, "focus", ctx.doFocus),
    				listen_dev(input, "blur", ctx.doBlur)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, input);
    			append_dev(div1, t3);
    			if (if_block2) if_block2.m(div1, null);
    			ctx.div1_binding(div1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.helper !== ctx.undefined) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.disabled || changed.value || changed.labelField) {
    				each_value = ctx.value;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t2);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}

    			if (!current || changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (changed.focus) {
    				toggle_class(div0, "focus", ctx.focus);
    			}

    			if (changed.disabled) {
    				toggle_class(div0, "disabled", ctx.disabled);
    			}

    			if (ctx.menu.length > 0) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			destroy_each(each_blocks, detaching);

    			if (if_block2) if_block2.d();
    			ctx.div1_binding(null);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

    let { characters = 3, data = [], dataField = 'data', disabled = false, helper = undefined, label = undefined, labelField = 'label', limit = 4, menu = [], placeholder = '', value = [] } = $$props;

    let control = undefined;
    let focus = false;
    let height = 0;
    let index = -1;

    const dispatch = createEventDispatcher();

    function doBlur() {
      $$invalidate('menu', menu = []);
      $$invalidate('focus', focus = false);
    }

    function doFocus( evt ) {
      $$invalidate('focus', focus = true);  
      $$invalidate('height', height = control.clientHeight);
    }

    function doKeyUp( evt ) {
      let item = null;

      // Enter
      if( evt.keyCode === 13 ) {
        // From menu
        if( index > -1 ) {
          item = Object.assign( {}, menu[index] );
          value.push( menu[index] );
          $$invalidate('focus', focus = true);
        } else {
          let found = false;
          let tags = [];

          // Multiples separated by comma
          if( evt.target.value.indexOf( ',' ) > 0 ) {
            tags = evt.target.value.split( ',' );
          } else {
            tags = [evt.target.value];
          }

          // Iterate provided value(s)
          for( let t = 0; t < tags.length; t++ ) {
            let exists = null;

            // Look in provided values
            for( let d = 0; d < data.length; d++ ) {
              if( data[d][labelField] === tags[t] ) {
                exists = data[d];
                break;

              }
            }

            // Use provided value if match
            if( exists !== null ) {
              item = Object.assign( {}, exists );
              value.push( exists );
            } else {
              // Check if already in list
              for( let v = 0; v < value.length; v++ ) {
                if( value[v] === tags[t].trim() ) {
                  found = true;
                  break;
                }
              }

              // Totally unique tag
              // Add to list with null ID
              if( !found ) {
                let tag = {id: null};
                tag[labelField] = tags[t];
                item = Object.assign( {}, tag );
                value.push( tag );
              }          
            }
          }      
        }

        // Update form field value
        // Clear value provided
        // Hide menu
        // Clear menu selection
        $$invalidate('value', value = value.slice( 0 ));
        evt.target.value = '';
        $$invalidate('menu', menu = []);
        $$invalidate('index', index = -1);

        // Announce change
        dispatch( 'add', item );
      }

      // Backspace and empty input
      if( evt.keyCode === 8 && evt.target.value.trim().length === 0 ) {
        evt.preventDefault();

        // List has values
        // User wants to delete from values
        if( value.length > 0 ) {
          // Get item to be removed
          let item = Object.assign( {}, value[value.length - 1] );

          value.pop();
          $$invalidate('value', value = value.slice( 0 ));

          // Announce change
          // Send item removed
          dispatch( 'remove', item );      
        }
      }

      // Down arrow
      if( evt.keyCode === 40 ) {
        // A menu is present
        // Move displayed focus
        if( menu.length > 0 ) {
          if( index === -1 ) {
            $$invalidate('focus', focus = false);        
            $$invalidate('index', index = 0);
          } else {
            if( index === ( menu.length - 1 ) ) {
              $$invalidate('index', index = 0);
            } else {
              $$invalidate('index', index = index + 1);
            }
          }      
        }
      }

      // Up arrow
      if( evt.keyCode === 38 ) {
        // A menu is present
        // Move displayed focus    
        if( menu.length > 0 ) {
          if( index === -1 ) {
            $$invalidate('focus', focus = false);          
            $$invalidate('index', index = menu.length - 1);
          } else {
            if( index === 0 ) {
              $$invalidate('index', index = menu.length - 1);
            } else {
              $$invalidate('index', index = index - 1);
            }
          }
        }
      }

      // Field has enough characters to display menu
      if( evt.target.value.trim().length >= characters ) {
        // Clear existing
        $$invalidate('menu', menu = []);

        // Build new menu
        // Case-insensitive
        for( let a = 0; a < data.length; a++ ) {
          if( data[a][labelField].toLowerCase().indexOf( evt.target.value.toLowerCase().trim() ) > -1 ) {
            let found = false;

            for( let b = 0; b < value.length; b++ ) {
              if( data[a][labelField].toLowerCase() === evt.target.value[b].toLowerCase() ) {
                found = true;
                break;
              }
            }

            if( !found ) {
              menu.push( data[a] );
            }
          }
        }

        // Trigger update
        // Limit to number of desired matches
        $$invalidate('menu', menu = menu.slice( 0, limit ));
      }
    }

    // Remove specific tag by mouse click
    function doRemove( id, index ) {
      let items = value.splice( index, 1 );
      $$invalidate('value', value = [...value]);

      // Announce change
      dispatch( 'remove', items[0] );  
    }

    	const writable_props = ['characters', 'data', 'dataField', 'disabled', 'helper', 'label', 'labelField', 'limit', 'menu', 'placeholder', 'value'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<TagInput> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ({ tag, t }) => doRemove( tag[dataField], t );

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('control', control = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('characters' in $$props) $$invalidate('characters', characters = $$props.characters);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    		if ('menu' in $$props) $$invalidate('menu', menu = $$props.menu);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { characters, data, dataField, disabled, helper, label, labelField, limit, menu, placeholder, value, control, focus, height, index };
    	};

    	$$self.$inject_state = $$props => {
    		if ('characters' in $$props) $$invalidate('characters', characters = $$props.characters);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    		if ('menu' in $$props) $$invalidate('menu', menu = $$props.menu);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('control' in $$props) $$invalidate('control', control = $$props.control);
    		if ('focus' in $$props) $$invalidate('focus', focus = $$props.focus);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	return {
    		characters,
    		data,
    		dataField,
    		disabled,
    		helper,
    		label,
    		labelField,
    		limit,
    		menu,
    		placeholder,
    		value,
    		control,
    		focus,
    		height,
    		index,
    		doBlur,
    		doFocus,
    		doKeyUp,
    		doRemove,
    		undefined,
    		click_handler,
    		div1_binding
    	};
    }

    class TagInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["characters", "data", "dataField", "disabled", "helper", "label", "labelField", "limit", "menu", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TagInput", options, id: create_fragment$8.name });
    	}

    	get characters() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set characters(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dataField() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataField(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limit() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limit(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get menu() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menu(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextArea.svelte generated by Svelte v3.12.1 */

    const file$9 = "src/TextArea.svelte";

    // (103:2) {#if label !== undefined}
    function create_if_block_1$2(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-jnr4n5");
    			add_location(label_1, file$9, 103, 4, 1820);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$2.name, type: "if", source: "(103:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (107:2) {#if helper !== undefined}
    function create_if_block$3(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-jnr4n5");
    			add_location(p, file$9, 107, 4, 1935);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(107:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    function create_fragment$9(ctx) {
    	var div, t0, t1, textarea, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$2(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			textarea = element("textarea");
    			textarea.disabled = ctx.disabled;
    			attr_dev(textarea, "placeholder", ctx.placeholder);
    			attr_dev(textarea, "class", "svelte-jnr4n5");
    			toggle_class(textarea, "collapse", ctx.collapse);
    			add_location(textarea, file$9, 110, 2, 2014);
    			attr_dev(div, "class", "svelte-jnr4n5");
    			add_location(div, file$9, 100, 0, 1781);

    			dispose = [
    				listen_dev(textarea, "input", ctx.textarea_input_handler),
    				listen_dev(textarea, "blur", ctx.doBlur),
    				listen_dev(textarea, "focus", ctx.doFocus)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, textarea);

    			set_input_value(textarea, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.helper !== ctx.undefined) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.value) set_input_value(textarea, ctx.value);

    			if (changed.disabled) {
    				prop_dev(textarea, "disabled", ctx.disabled);
    			}

    			if (changed.placeholder) {
    				attr_dev(textarea, "placeholder", ctx.placeholder);
    			}

    			if (changed.collapse) {
    				toggle_class(textarea, "collapse", ctx.collapse);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { collapse = false, disabled = false, helper = undefined, label = undefined, placeholder = '', value = '' } = $$props;

    const dispatch = createEventDispatcher();

    let original = undefined;

    function doBlur( evt ) {
      if( original !== evt.target.value.trim() ) {
        dispatch( 'change', {
          original: original,
          value: evt.target.value.trim()
        } );    
      }

      if( collapse ) {
        if( value.trim().length === 0 ) {
          evt.target.classList.add( 'collapse' );
        }
      }
    }

    function doFocus( evt ) {
      original = evt.target.value.trim();

      if( collapse ) {
        evt.target.classList.remove( 'collapse' );
      }
    }

    	const writable_props = ['collapse', 'disabled', 'helper', 'label', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('collapse' in $$props) $$invalidate('collapse', collapse = $$props.collapse);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { collapse, disabled, helper, label, placeholder, value, original };
    	};

    	$$self.$inject_state = $$props => {
    		if ('collapse' in $$props) $$invalidate('collapse', collapse = $$props.collapse);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('original' in $$props) original = $$props.original;
    	};

    	return {
    		collapse,
    		disabled,
    		helper,
    		label,
    		placeholder,
    		value,
    		doBlur,
    		doFocus,
    		undefined,
    		textarea_input_handler
    	};
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["collapse", "disabled", "helper", "label", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$9.name });
    	}

    	get collapse() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapse(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
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

    const file$a = "src/TextInput.svelte";

    // (85:2) {#if label !== undefined}
    function create_if_block_1$3(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-1f0s72f");
    			add_location(label_1, file$a, 85, 4, 1479);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$3.name, type: "if", source: "(85:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (89:2) {#if helper !== undefined}
    function create_if_block$4(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-1f0s72f");
    			add_location(p, file$a, 89, 4, 1594);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$4.name, type: "if", source: "(89:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    function create_fragment$a(ctx) {
    	var div, t0, t1, input, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$3(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-1f0s72f");
    			add_location(input, file$a, 92, 2, 1671);
    			attr_dev(div, "class", "svelte-1f0s72f");
    			add_location(div, file$a, 82, 0, 1440);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "blur", ctx.doBlur),
    				listen_dev(input, "focus", ctx.doFocus)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, input);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.helper !== ctx.undefined) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

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
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { disabled = false, label = undefined, helper = undefined, placeholder = 'Text input', value = '' } = $$props;

    const dispatch = createEventDispatcher();

    let original = undefined;

    function doBlur( evt ) {
      if( original !== evt.target.value.trim() ) {
        dispatch( 'change', {
          original: original,
          value: evt.target.value.trim()
        } );
      }
    }

    function doFocus( evt ) {
      original = evt.target.value.trim();
    }

    	const writable_props = ['disabled', 'label', 'helper', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, label, helper, placeholder, value, original };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('original' in $$props) original = $$props.original;
    	};

    	return {
    		disabled,
    		label,
    		helper,
    		placeholder,
    		value,
    		doBlur,
    		doFocus,
    		undefined,
    		input_input_handler
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["disabled", "label", "helper", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextInput", options, id: create_fragment$a.name });
    	}

    	get disabled() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const organizations = writable( [] );
    const skills = writable( [] );

    // Summary
    const developer_id = writable( null );
    const developer_name = writable( '' );
    const developer_email = writable( '' );
    const developer_image = writable( '' );
    const developer_organizations = writable( [] );
    const developer_location = writable( '' );
    const developer_latitude = writable( null );
    const developer_longitude = writable( null );
    const developer_skills = writable( [] );
    const developer_public = writable( false );
    const developer_description = writable( '' );

    // Notes
    const notes = writable( [] );

    /* src/Profile.svelte generated by Svelte v3.12.1 */
    const { console: console_1$1 } = globals;

    const file$b = "src/Profile.svelte";

    function create_fragment$b(ctx) {
    	var form, div0, t0, div1, t1, div2, updating_value, t2, div3, updating_value_1, t3, div4, updating_selected, current;

    	var taginput0 = new TagInput({
    		props: {
    		label: "Roles",
    		placeholder: "Roles",
    		helper: "Job functions regularly performed",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var taginput1 = new TagInput({
    		props: {
    		label: "Languages",
    		placeholder: "Languages",
    		helper: "Fluency for a technical presentation",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	function taginput2_value_binding(value) {
    		ctx.taginput2_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let taginput2_props = {
    		data: ctx.$skills,
    		dataField: "id",
    		labelField: "name",
    		label: "Skills",
    		placeholder: "Skills",
    		helper: "Capable of delivering hands-on training with zero preparation",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_skills !== void 0) {
    		taginput2_props.value = ctx.$developer_skills;
    	}
    	var taginput2 = new TagInput({ props: taginput2_props, $$inline: true });

    	binding_callbacks.push(() => bind(taginput2, 'value', taginput2_value_binding));

    	function textarea_value_binding(value_1) {
    		ctx.textarea_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let textarea_props = {
    		label: "Description/Bio",
    		placeholder: "Description",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_description !== void 0) {
    		textarea_props.value = ctx.$developer_description;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));
    	textarea.$on("change", ctx.doAreaChange);

    	function select_selected_binding(value_2) {
    		ctx.select_selected_binding.call(null, value_2);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		options: ctx.publish,
    		dataField: "id",
    		labelField: "label",
    		inline: "true",
    		label: "Publish",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_public !== void 0) {
    		select_props.selected = ctx.$developer_public;
    	}
    	var select = new Select({ props: select_props, $$inline: true });

    	binding_callbacks.push(() => bind(select, 'selected', select_selected_binding));
    	select.$on("change", ctx.doSelectChange);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			taginput0.$$.fragment.c();
    			t0 = space();
    			div1 = element("div");
    			taginput1.$$.fragment.c();
    			t1 = space();
    			div2 = element("div");
    			taginput2.$$.fragment.c();
    			t2 = space();
    			div3 = element("div");
    			textarea.$$.fragment.c();
    			t3 = space();
    			div4 = element("div");
    			select.$$.fragment.c();
    			attr_dev(div0, "class", "svelte-jesd26");
    			add_location(div0, file$b, 88, 2, 2235);
    			attr_dev(div1, "class", "svelte-jesd26");
    			add_location(div1, file$b, 96, 2, 2383);
    			attr_dev(div2, "class", "svelte-jesd26");
    			add_location(div2, file$b, 104, 2, 2542);
    			set_style(div3, "flex-grow", "1");
    			attr_dev(div3, "class", "svelte-jesd26");
    			add_location(div3, file$b, 116, 2, 2826);
    			attr_dev(div4, "class", "svelte-jesd26");
    			add_location(div4, file$b, 125, 2, 3038);
    			attr_dev(form, "class", "svelte-jesd26");
    			toggle_class(form, "hidden", ctx.hidden);
    			add_location(form, file$b, 86, 0, 2212);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			mount_component(taginput0, div0, null);
    			append_dev(form, t0);
    			append_dev(form, div1);
    			mount_component(taginput1, div1, null);
    			append_dev(form, t1);
    			append_dev(form, div2);
    			mount_component(taginput2, div2, null);
    			append_dev(form, t2);
    			append_dev(form, div3);
    			mount_component(textarea, div3, null);
    			append_dev(form, t3);
    			append_dev(form, div4);
    			mount_component(select, div4, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var taginput0_changes = {};
    			if (changed.disabled) taginput0_changes.disabled = ctx.disabled;
    			taginput0.$set(taginput0_changes);

    			var taginput1_changes = {};
    			if (changed.disabled) taginput1_changes.disabled = ctx.disabled;
    			taginput1.$set(taginput1_changes);

    			var taginput2_changes = {};
    			if (changed.$skills) taginput2_changes.data = ctx.$skills;
    			if (changed.disabled) taginput2_changes.disabled = ctx.disabled;
    			if (!updating_value && changed.$developer_skills) {
    				taginput2_changes.value = ctx.$developer_skills;
    			}
    			taginput2.$set(taginput2_changes);

    			var textarea_changes = {};
    			if (changed.disabled) textarea_changes.disabled = ctx.disabled;
    			if (!updating_value_1 && changed.$developer_description) {
    				textarea_changes.value = ctx.$developer_description;
    			}
    			textarea.$set(textarea_changes);

    			var select_changes = {};
    			if (changed.disabled) select_changes.disabled = ctx.disabled;
    			if (!updating_selected && changed.$developer_public) {
    				select_changes.selected = ctx.$developer_public;
    			}
    			select.$set(select_changes);

    			if (changed.hidden) {
    				toggle_class(form, "hidden", ctx.hidden);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(taginput0.$$.fragment, local);

    			transition_in(taginput1.$$.fragment, local);

    			transition_in(taginput2.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(select.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(taginput0.$$.fragment, local);
    			transition_out(taginput1.$$.fragment, local);
    			transition_out(taginput2.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(select.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(taginput0);

    			destroy_component(taginput1);

    			destroy_component(taginput2);

    			destroy_component(textarea);

    			destroy_component(select);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $developer_id, $developer_name, $developer_email, $developer_description, $developer_image, $developer_location, $developer_latitude, $developer_longitude, $developer_public, $skills, $developer_skills;

    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_description, 'developer_description');
    	component_subscribe($$self, developer_description, $$value => { $developer_description = $$value; $$invalidate('$developer_description', $developer_description); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(developer_location, 'developer_location');
    	component_subscribe($$self, developer_location, $$value => { $developer_location = $$value; $$invalidate('$developer_location', $developer_location); });
    	validate_store(developer_latitude, 'developer_latitude');
    	component_subscribe($$self, developer_latitude, $$value => { $developer_latitude = $$value; $$invalidate('$developer_latitude', $developer_latitude); });
    	validate_store(developer_longitude, 'developer_longitude');
    	component_subscribe($$self, developer_longitude, $$value => { $developer_longitude = $$value; $$invalidate('$developer_longitude', $developer_longitude); });
    	validate_store(developer_public, 'developer_public');
    	component_subscribe($$self, developer_public, $$value => { $developer_public = $$value; $$invalidate('$developer_public', $developer_public); });
    	validate_store(skills, 'skills');
    	component_subscribe($$self, skills, $$value => { $skills = $$value; $$invalidate('$skills', $skills); });
    	validate_store(developer_skills, 'developer_skills');
    	component_subscribe($$self, developer_skills, $$value => { $developer_skills = $$value; $$invalidate('$developer_skills', $developer_skills); });

    	

    let { hidden = false, disabled = false } = $$props;

    let publish = [
      {id: 0, label: 'No'}, 
      {id: 1, label: 'Yes'}
    ];

    function doAreaChange( evt ) {
      doDeveloperChange();
    }

    function doDeveloperChange( evt ) {
      fetch( `/api/developer/${$developer_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          id: $developer_id,
          name: $developer_name.trim().length === 0 ? null : $developer_name,
          email: $developer_email.trim().length === 0 ? null : $developer_email,
          description: $developer_description.trim().length === 0 ? null : $developer_description,
          image: $developer_image.trim().length === 0 ? null : $developer_image,
          location: $developer_location.trim().length === 0 ? null : $developer_location,
          latitude: $developer_latitude,
          longitude: $developer_longitude,
          public: $developer_public
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        console.log( data );
      } );
    }

    function doSelectChange( evt ) {
      doDeveloperChange();
    }

    	const writable_props = ['hidden', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	function taginput2_value_binding(value) {
    		$developer_skills = value;
    		developer_skills.set($developer_skills);
    	}

    	function textarea_value_binding(value_1) {
    		$developer_description = value_1;
    		developer_description.set($developer_description);
    	}

    	function select_selected_binding(value_2) {
    		$developer_public = value_2;
    		developer_public.set($developer_public);
    	}

    	$$self.$set = $$props => {
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hidden, disabled, publish, $developer_id, $developer_name, $developer_email, $developer_description, $developer_image, $developer_location, $developer_latitude, $developer_longitude, $developer_public, $skills, $developer_skills };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('publish' in $$props) $$invalidate('publish', publish = $$props.publish);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_description' in $$props) developer_description.set($developer_description);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$developer_location' in $$props) developer_location.set($developer_location);
    		if ('$developer_latitude' in $$props) developer_latitude.set($developer_latitude);
    		if ('$developer_longitude' in $$props) developer_longitude.set($developer_longitude);
    		if ('$developer_public' in $$props) developer_public.set($developer_public);
    		if ('$skills' in $$props) skills.set($skills);
    		if ('$developer_skills' in $$props) developer_skills.set($developer_skills);
    	};

    	return {
    		hidden,
    		disabled,
    		publish,
    		doAreaChange,
    		doSelectChange,
    		$developer_description,
    		$developer_public,
    		$skills,
    		$developer_skills,
    		taginput2_value_binding,
    		textarea_value_binding,
    		select_selected_binding
    	};
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["hidden", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Profile", options, id: create_fragment$b.name });
    	}

    	get hidden() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pagination.svelte generated by Svelte v3.12.1 */

    const file$c = "src/Pagination.svelte";

    function create_fragment$c(ctx) {
    	var div, t0, p, t1, t2, t3, t4, t5, t6, button0, t7, button1, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(ctx.index);
    			t2 = text(" of ");
    			t3 = text(ctx.length);
    			t4 = space();
    			t5 = text(ctx.noun);
    			t6 = space();
    			button0 = element("button");
    			t7 = space();
    			button1 = element("button");

    			attr_dev(p, "class", "svelte-1aazx0t");
    			add_location(p, file$c, 64, 2, 1032);
    			attr_dev(button0, "class", "previous svelte-1aazx0t");
    			add_location(button0, file$c, 65, 2, 1068);
    			attr_dev(button1, "class", "next svelte-1aazx0t");
    			add_location(button1, file$c, 66, 2, 1147);
    			attr_dev(div, "class", "svelte-1aazx0t");
    			add_location(div, file$c, 62, 0, 1008);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div, t6);
    			append_dev(div, button0);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.index) {
    				set_data_dev(t1, ctx.index);
    			}

    			if (!current || changed.length) {
    				set_data_dev(t3, ctx.length);
    			}

    			if (!current || changed.noun) {
    				set_data_dev(t5, ctx.noun);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { index = 1, length = 10, noun = 'items' } = $$props;

    const dispatch = createEventDispatcher();

    	const writable_props = ['index', 'length', 'noun'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = () => dispatch( 'previous' );

    	const click_handler_1 = () => dispatch( 'next' );

    	$$self.$set = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('length' in $$props) $$invalidate('length', length = $$props.length);
    		if ('noun' in $$props) $$invalidate('noun', noun = $$props.noun);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { index, length, noun };
    	};

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('length' in $$props) $$invalidate('length', length = $$props.length);
    		if ('noun' in $$props) $$invalidate('noun', noun = $$props.noun);
    	};

    	return {
    		index,
    		length,
    		noun,
    		dispatch,
    		click_handler,
    		click_handler_1,
    		$$slots,
    		$$scope
    	};
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["index", "length", "noun"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Pagination", options, id: create_fragment$c.name });
    	}

    	get index() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get length() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set length(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noun() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noun(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Notes.svelte generated by Svelte v3.12.1 */

    const file$d = "src/Notes.svelte";

    // (185:6) <Button          on:click="{doSave}"         icon="/img/save-white.svg"         disabledIcon="/img/save.svg"         disabled="{text.trim().length > 0 ? false : true}">
    function create_default_slot_1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(185:6) <Button          on:click=\"{doSave}\"         icon=\"/img/save-white.svg\"         disabledIcon=\"/img/save.svg\"         disabled=\"{text.trim().length > 0 ? false : true}\">", ctx });
    	return block;
    }

    // (208:2) {:else}
    function create_else_block$1(ctx) {
    	var div, p, t0, t1, t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("No notes available for ");
    			t1 = text(ctx.$developer_name);
    			t2 = text(".");
    			attr_dev(p, "class", "svelte-1wrwwnh");
    			add_location(p, file$d, 210, 6, 4585);
    			attr_dev(div, "class", "none svelte-1wrwwnh");
    			add_location(div, file$d, 209, 4, 4560);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$developer_name) {
    				set_data_dev(t1, ctx.$developer_name);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(208:2) {:else}", ctx });
    	return block;
    }

    // (193:2) {#if $notes.length > 0}
    function create_if_block$5(ctx) {
    	var div, p, t0_value = ctx.$notes[ctx.index].full_text + "", t0, t1, current;

    	var pagination = new Pagination({
    		props: {
    		index: ctx.index + 1,
    		length: ctx.$notes.length,
    		noun: "notes",
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	pagination.$on("previous", ctx.doPrevious);
    	pagination.$on("next", ctx.doNext);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			pagination.$$.fragment.c();
    			attr_dev(p, "class", "svelte-1wrwwnh");
    			add_location(p, file$d, 195, 6, 4185);
    			set_style(div, "flex-basis", "0");
    			set_style(div, "flex-grow", "50");
    			set_style(div, "padding", "16px");
    			add_location(div, file$d, 194, 4, 4120);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(pagination, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.$notes || changed.index) && t0_value !== (t0_value = ctx.$notes[ctx.index].full_text + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			var pagination_changes = {};
    			if (changed.index) pagination_changes.index = ctx.index + 1;
    			if (changed.$notes) pagination_changes.length = ctx.$notes.length;
    			if (changed.$$scope || changed.$notes || changed.index) pagination_changes.$$scope = { changed, ctx };
    			pagination.$set(pagination_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    				detach_dev(t1);
    			}

    			destroy_component(pagination, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$5.name, type: "if", source: "(193:2) {#if $notes.length > 0}", ctx });
    	return block;
    }

    // (198:4) <Pagination        on:previous="{doPrevious}"       on:next="{doNext}"       index="{index + 1}"        length="{$notes.length}"        noun="notes">
    function create_default_slot$1(ctx) {
    	var p0, t0_value = format( new ctx.Date( ctx.$notes[ctx.index].updated_at ) ) + "", t0, t1, p1, t2_value = ctx.$notes[ctx.index].activity_name + "", t2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			attr_dev(p0, "class", "pagination svelte-1wrwwnh");
    			add_location(p0, file$d, 203, 6, 4389);
    			attr_dev(p1, "class", "pagination svelte-1wrwwnh");
    			add_location(p1, file$d, 204, 6, 4470);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$notes || changed.index) && t0_value !== (t0_value = format( new ctx.Date( ctx.$notes[ctx.index].updated_at ) ) + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.$notes || changed.index) && t2_value !== (t2_value = ctx.$notes[ctx.index].activity_name + "")) {
    				set_data_dev(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p0);
    				detach_dev(t1);
    				detach_dev(p1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$1.name, type: "slot", source: "(198:4) <Pagination        on:previous=\"{doPrevious}\"       on:next=\"{doNext}\"       index=\"{index + 1}\"        length=\"{$notes.length}\"        noun=\"notes\">", ctx });
    	return block;
    }

    function create_fragment$d(ctx) {
    	var div2, form, div0, updating_selected, t0, updating_value, t1, div1, t2, current_block_type_index, if_block, current;

    	function select_selected_binding(value) {
    		ctx.select_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		label: "Activity",
    		helper: "Where did this take place?",
    		options: ctx.activity,
    		labelField: "name",
    		dataField: "id"
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

    	let textarea_props = {
    		label: "Note",
    		helper: "Description of the interaction",
    		placeholder: "What happened?"
    	};
    	if (ctx.text !== void 0) {
    		textarea_props.value = ctx.text;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	var button = new Button({
    		props: {
    		icon: "/img/save-white.svg",
    		disabledIcon: "/img/save.svg",
    		disabled: ctx.text.trim().length > 0 ? false : true,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.doSave);

    	var if_block_creators = [
    		create_if_block$5,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.$notes.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
    			div0 = element("div");
    			select.$$.fragment.c();
    			t0 = space();
    			textarea.$$.fragment.c();
    			t1 = space();
    			div1 = element("div");
    			button.$$.fragment.c();
    			t2 = space();
    			if_block.c();
    			attr_dev(div0, "class", "activity svelte-1wrwwnh");
    			add_location(div0, file$d, 169, 4, 3459);
    			attr_dev(div1, "class", "controls svelte-1wrwwnh");
    			add_location(div1, file$d, 183, 4, 3852);
    			attr_dev(form, "class", "svelte-1wrwwnh");
    			add_location(form, file$d, 168, 2, 3448);
    			attr_dev(div2, "class", "panel svelte-1wrwwnh");
    			toggle_class(div2, "hidden", ctx.hidden);
    			add_location(div2, file$d, 167, 0, 3413);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			mount_component(select, div0, null);
    			append_dev(form, t0);
    			mount_component(textarea, form, null);
    			append_dev(form, t1);
    			append_dev(form, div1);
    			mount_component(button, div1, null);
    			append_dev(div2, t2);
    			if_blocks[current_block_type_index].m(div2, null);
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
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div2, null);
    			}

    			if (changed.hidden) {
    				toggle_class(div2, "hidden", ctx.hidden);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div2);
    			}

    			destroy_component(select);

    			destroy_component(textarea);

    			destroy_component(button);

    			if_blocks[current_block_type_index].d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    function format( updated ) {
    let hours = [
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ];
    let months = [
      'Jan', 'Feb', 'Mar', 'Apr', 
      'May', 'Jun', 'Jul', 'Aug', 
      'Sep', 'Oct', 'Nov', 'Dec'
    ];
    let now = new Date();
    let result = null;

    if( now.getFullYear() !== updated.getFullYear()  ) {
      result = `${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()}`;
    } else {
      if( updated.getMonth() === now.getMonth() && updated.getDate() === now.getDate() ) {
        result = `${months[updated.getMonth()]} ${updated.getDate()} @ ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )}`;
      } else {
        result = `${months[updated.getMonth()]} ${updated.getDate()}`;
      }
    }

    return result;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $notes, $developer_id, $developer_name;

    	validate_store(notes, 'notes');
    	component_subscribe($$self, notes, $$value => { $notes = $$value; $$invalidate('$notes', $notes); });
    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });

    	

    let { hidden = false, disabled = false } = $$props;

    let activity = [];
    let activity_id = null;
    let index = 0;
    let text = '';

    onMount( async () => {
      $$invalidate('activity', activity = await fetch( '/api/activity' )
      .then( ( response ) => response.json() ));
      $$invalidate('activity_id', activity_id = activity[0].id);
    } );

    function doNext( evt ) {
      if( index === ( $notes.length - 1 ) ) {
        $$invalidate('index', index = 0);
      } else {
        $$invalidate('index', index = index + 1);
      }
    }

    function doPrevious( evt ) {
      if( index === 0 ) {
        $$invalidate('index', index = $notes.length - 1);
      } else {
        $$invalidate('index', index = index - 1);
      }
    }

    function doSave( evt ) {
      fetch( '/api/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          developer_id: $developer_id,
          activity_id: activity_id,
          full_text: text
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $notes.push( data );
        $notes.sort( ( a, b ) => {
          a = new Date( a.updated_at ).getTime();
          b = new Date( b.updated_at ).getTime();

          if( a < b ) return 1;
          if( a > b ) return -1;
          return 0;
        } );
        set_store_value(notes, $notes = $notes.slice());

        $$invalidate('index', index = 0);
        $$invalidate('text', text = '');
      } );
    }

    	const writable_props = ['hidden', 'disabled'];
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
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hidden, disabled, activity, activity_id, index, text, $notes, $developer_id, $developer_name };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    		if ('activity_id' in $$props) $$invalidate('activity_id', activity_id = $$props.activity_id);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('$notes' in $$props) notes.set($notes);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    	};

    	return {
    		hidden,
    		disabled,
    		activity,
    		activity_id,
    		index,
    		text,
    		doNext,
    		doPrevious,
    		doSave,
    		Date,
    		$notes,
    		$developer_name,
    		select_selected_binding,
    		textarea_value_binding
    	};
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, ["hidden", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$d.name });
    	}

    	get hidden() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Search.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Search.svelte";

    function create_fragment$e(ctx) {
    	var input, dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-1htj1fc");
    			add_location(input, file$e, 32, 0, 626);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "keyup", ctx.keyup_handler)
    			];
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
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { placeholder = 'Search', value = '' } = $$props;

    	const writable_props = ['placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

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

    	return {
    		placeholder,
    		value,
    		keyup_handler,
    		input_input_handler
    	};
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, ["placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$e.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Social.svelte generated by Svelte v3.12.1 */

    const file$f = "src/Social.svelte";

    // (92:4) <Button       icon="/img/add-white.svg"       disabledIcon="/img/add.svg"       disabled="{endpoint.trim().length > 0 ? false : true}"       size="small">
    function create_default_slot$2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Add");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$2.name, type: "slot", source: "(92:4) <Button       icon=\"/img/add-white.svg\"       disabledIcon=\"/img/add.svg\"       disabled=\"{endpoint.trim().length > 0 ? false : true}\"       size=\"small\">", ctx });
    	return block;
    }

    // (105:2) {:else}
    function create_else_block$2(ctx) {
    	var p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "List here.";
    			attr_dev(p, "class", "svelte-p888y0");
    			add_location(p, file$f, 106, 4, 2669);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$2.name, type: "else", source: "(105:2) {:else}", ctx });
    	return block;
    }

    // (99:2) {#if data.length === 0}
    function create_if_block$6(ctx) {
    	var div, p, t0, t1, t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("No social endpoints available for ");
    			t1 = text(ctx.$developer_name);
    			t2 = text(".");
    			attr_dev(p, "class", "svelte-p888y0");
    			add_location(p, file$f, 101, 6, 2582);
    			attr_dev(div, "class", "none svelte-p888y0");
    			add_location(div, file$f, 100, 4, 2557);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$developer_name) {
    				set_data_dev(t1, ctx.$developer_name);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$6.name, type: "if", source: "(99:2) {#if data.length === 0}", ctx });
    	return block;
    }

    function create_fragment$f(ctx) {
    	var div3, div2, updating_selected, t0, div0, t1, updating_value, t2, div1, t3, t4, current;

    	function select_selected_binding(value) {
    		ctx.select_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		label: "Channel",
    		labelField: "label",
    		options: ctx.endpoints,
    		dataField: "value"
    	};
    	if (ctx.source !== void 0) {
    		select_props.selected = ctx.source;
    	}
    	var select = new Select({ props: select_props, $$inline: true });

    	binding_callbacks.push(() => bind(select, 'selected', select_selected_binding));

    	function textinput_value_binding(value_1) {
    		ctx.textinput_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput_props = {
    		label: "Endpoint",
    		placeholder: ctx.source
    	};
    	if (ctx.endpoint !== void 0) {
    		textinput_props.value = ctx.endpoint;
    	}
    	var textinput = new TextInput({ props: textinput_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput, 'value', textinput_value_binding));

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		disabledIcon: "/img/add.svg",
    		disabled: ctx.endpoint.trim().length > 0 ? false : true,
    		size: "small",
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	function select_block_type(changed, ctx) {
    		if (ctx.data.length === 0) return create_if_block$6;
    		return create_else_block$2;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			select.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput.$$.fragment.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			button.$$.fragment.c();
    			t4 = space();
    			if_block.c();
    			attr_dev(div0, "class", "gap svelte-p888y0");
    			add_location(div0, file$f, 88, 4, 2212);
    			attr_dev(div1, "class", "gap svelte-p888y0");
    			add_location(div1, file$f, 90, 4, 2321);
    			attr_dev(div2, "class", "input svelte-p888y0");
    			add_location(div2, file$f, 81, 2, 2041);
    			attr_dev(div3, "class", "social svelte-p888y0");
    			toggle_class(div3, "hidden", ctx.hidden);
    			add_location(div3, file$f, 79, 0, 2004);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(select, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			mount_component(textinput, div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(button, div2, null);
    			append_dev(div3, t4);
    			if_block.m(div3, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var select_changes = {};
    			if (!updating_selected && changed.source) {
    				select_changes.selected = ctx.source;
    			}
    			select.$set(select_changes);

    			var textinput_changes = {};
    			if (changed.source) textinput_changes.placeholder = ctx.source;
    			if (!updating_value && changed.endpoint) {
    				textinput_changes.value = ctx.endpoint;
    			}
    			textinput.$set(textinput_changes);

    			var button_changes = {};
    			if (changed.endpoint) button_changes.disabled = ctx.endpoint.trim().length > 0 ? false : true;
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			}

    			if (changed.hidden) {
    				toggle_class(div3, "hidden", ctx.hidden);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);

    			transition_in(textinput.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(textinput.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div3);
    			}

    			destroy_component(select);

    			destroy_component(textinput);

    			destroy_component(button);

    			if_block.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $developer_name;

    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });

    	

    let { data = [], hidden = false, disabled = false } = $$props;

    let endpoint = '';
    let endpoints = [
      {label: 'Website', value: 'Including HTTP/S'},
      {label: 'Feed', value: 'RSS or ATOM, including HTTP/S'},
      {label: 'Dev.to', value: 'User name, after trailing slash of profile'},
      {label: 'Medium', value: 'User name, after the "@" symbol'},
      {label: 'YouTube', value: 'Channel ID, not user name'},
      {label: 'Twitter', value: 'User name, no "@" symbol'},
      {label: 'Stack Overflow', value: 'User ID, not user name'},
      {label: 'GitHub', value: 'User name, after trailing slash'},
      {label: 'Reddit', value: 'User name, as shown in posts'},
      {label: 'Instagram', value: 'Not yet implemented'}
    ];
    let source = 'Including HTTP/S';

    	const writable_props = ['data', 'hidden', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Social> was created with unknown prop '${key}'`);
    	});

    	function select_selected_binding(value) {
    		source = value;
    		$$invalidate('source', source);
    	}

    	function textinput_value_binding(value_1) {
    		endpoint = value_1;
    		$$invalidate('endpoint', endpoint);
    	}

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { data, hidden, disabled, endpoint, endpoints, source, $developer_name };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('endpoint' in $$props) $$invalidate('endpoint', endpoint = $$props.endpoint);
    		if ('endpoints' in $$props) $$invalidate('endpoints', endpoints = $$props.endpoints);
    		if ('source' in $$props) $$invalidate('source', source = $$props.source);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    	};

    	return {
    		data,
    		hidden,
    		disabled,
    		endpoint,
    		endpoints,
    		source,
    		$developer_name,
    		select_selected_binding,
    		textinput_value_binding
    	};
    }

    class Social extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, ["data", "hidden", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Social", options, id: create_fragment$f.name });
    	}

    	get data() {
    		throw new Error("<Social>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Social>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<Social>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Social>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Social>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Social>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Map.svelte generated by Svelte v3.12.1 */

    const file$g = "src/Map.svelte";

    function create_fragment$g(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-cowull");
    			add_location(div, file$g, 40, 0, 681);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			ctx.div_binding(div);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			ctx.div_binding(null);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { latitude = null, longitude = null, zoom = 11 } = $$props;

    let container = undefined;
    let map = undefined;
    let view = undefined;

    require( [
      'esri/Map',
      'esri/views/MapView'
    ], function( Map, MapView ) {
      map = new Map( {
        basemap: 'streets-navigation-vector'
      } );

      $$invalidate('view', view = new MapView( {
        container: container,
        map: map,
        center: [longitude, latitude],
        zoom: zoom
      } ));
      $$invalidate('view', view.ui.components = ['attribution'], view);
    } );

    	const writable_props = ['latitude', 'longitude', 'zoom'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('container', container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('latitude' in $$props) $$invalidate('latitude', latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate('longitude', longitude = $$props.longitude);
    		if ('zoom' in $$props) $$invalidate('zoom', zoom = $$props.zoom);
    	};

    	$$self.$capture_state = () => {
    		return { latitude, longitude, zoom, container, map, view };
    	};

    	$$self.$inject_state = $$props => {
    		if ('latitude' in $$props) $$invalidate('latitude', latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate('longitude', longitude = $$props.longitude);
    		if ('zoom' in $$props) $$invalidate('zoom', zoom = $$props.zoom);
    		if ('container' in $$props) $$invalidate('container', container = $$props.container);
    		if ('map' in $$props) map = $$props.map;
    		if ('view' in $$props) $$invalidate('view', view = $$props.view);
    	};

    	$$self.$$.update = ($$dirty = { view: 1, longitude: 1, latitude: 1 }) => {
    		if ($$dirty.view || $$dirty.longitude || $$dirty.latitude) { if( view !== undefined ) {
          view.goTo( [
            longitude === null ? -73.7182409 : longitude, 
            latitude === null ? 41.1135751 : latitude
          ] );
        } }
    	};

    	return {
    		latitude,
    		longitude,
    		zoom,
    		container,
    		div_binding
    	};
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, ["latitude", "longitude", "zoom"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Map", options, id: create_fragment$g.name });
    	}

    	get latitude() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set latitude(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get longitude() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set longitude(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Summary.svelte generated by Svelte v3.12.1 */

    const file$h = "src/Summary.svelte";

    function create_fragment$h(ctx) {
    	var form, div1, updating_value, t0, div0, t1, updating_value_1, t2, div2, updating_value_2, t3, div3, updating_value_3, t4, div4, updating_value_4, t5, div5, current;

    	function textinput0_value_binding(value) {
    		ctx.textinput0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput0_props = {
    		label: "Full name",
    		placeholder: "Full name",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_name !== void 0) {
    		textinput0_props.value = ctx.$developer_name;
    	}
    	var textinput0 = new TextInput({ props: textinput0_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput0, 'value', textinput0_value_binding));
    	textinput0.$on("change", ctx.doInputChange);

    	function textinput1_value_binding(value_1) {
    		ctx.textinput1_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let textinput1_props = {
    		label: "Email address",
    		placeholder: "Email address",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_email !== void 0) {
    		textinput1_props.value = ctx.$developer_email;
    	}
    	var textinput1 = new TextInput({ props: textinput1_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput1, 'value', textinput1_value_binding));
    	textinput1.$on("change", ctx.doInputChange);

    	function textinput2_value_binding(value_2) {
    		ctx.textinput2_value_binding.call(null, value_2);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let textinput2_props = {
    		label: "Profile image",
    		placeholder: "Profile image",
    		helper: "Full path to profile image, including HTTP/S",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_image !== void 0) {
    		textinput2_props.value = ctx.$developer_image;
    	}
    	var textinput2 = new TextInput({ props: textinput2_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput2, 'value', textinput2_value_binding));
    	textinput2.$on("change", ctx.doInputChange);

    	function taginput_value_binding(value_3) {
    		ctx.taginput_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let taginput_props = {
    		data: ctx.$organizations,
    		dataField: "id",
    		labelField: "name",
    		label: "Organization",
    		placeholder: "Organization",
    		helper: "Company name and/or team nomenclature",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_organizations !== void 0) {
    		taginput_props.value = ctx.$developer_organizations;
    	}
    	var taginput = new TagInput({ props: taginput_props, $$inline: true });

    	binding_callbacks.push(() => bind(taginput, 'value', taginput_value_binding));
    	taginput.$on("add", ctx.doTagAdd);
    	taginput.$on("remove", ctx.doTagRemove);

    	function textinput3_value_binding(value_4) {
    		ctx.textinput3_value_binding.call(null, value_4);
    		updating_value_4 = true;
    		add_flush_callback(() => updating_value_4 = false);
    	}

    	let textinput3_props = {
    		label: "Location",
    		placeholder: "Location",
    		helper: "As specific or general as is desired",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_location !== void 0) {
    		textinput3_props.value = ctx.$developer_location;
    	}
    	var textinput3 = new TextInput({ props: textinput3_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput3, 'value', textinput3_value_binding));
    	textinput3.$on("change", ctx.doInputChange);

    	var map = new Map$1({
    		props: {
    		latitude: ctx.$developer_latitude,
    		longitude: ctx.$developer_longitude
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			form = element("form");
    			div1 = element("div");
    			textinput0.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput1.$$.fragment.c();
    			t2 = space();
    			div2 = element("div");
    			textinput2.$$.fragment.c();
    			t3 = space();
    			div3 = element("div");
    			taginput.$$.fragment.c();
    			t4 = space();
    			div4 = element("div");
    			textinput3.$$.fragment.c();
    			t5 = space();
    			div5 = element("div");
    			map.$$.fragment.c();
    			attr_dev(div0, "class", "svelte-1c1qnk7");
    			add_location(div0, file$h, 113, 4, 2830);
    			attr_dev(div1, "class", "svelte-1c1qnk7");
    			add_location(div1, file$h, 106, 2, 2658);
    			attr_dev(div2, "class", "svelte-1c1qnk7");
    			add_location(div2, file$h, 122, 2, 3025);
    			attr_dev(div3, "class", "svelte-1c1qnk7");
    			add_location(div3, file$h, 132, 2, 3273);
    			attr_dev(div4, "class", "svelte-1c1qnk7");
    			add_location(div4, file$h, 146, 2, 3616);
    			attr_dev(div5, "class", "svelte-1c1qnk7");
    			add_location(div5, file$h, 156, 2, 3847);
    			attr_dev(form, "class", "svelte-1c1qnk7");
    			toggle_class(form, "hidden", ctx.hidden);
    			add_location(form, file$h, 104, 0, 2635);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div1);
    			mount_component(textinput0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(textinput1, div1, null);
    			append_dev(form, t2);
    			append_dev(form, div2);
    			mount_component(textinput2, div2, null);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			mount_component(taginput, div3, null);
    			append_dev(form, t4);
    			append_dev(form, div4);
    			mount_component(textinput3, div4, null);
    			append_dev(form, t5);
    			append_dev(form, div5);
    			mount_component(map, div5, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.disabled) textinput0_changes.disabled = ctx.disabled;
    			if (!updating_value && changed.$developer_name) {
    				textinput0_changes.value = ctx.$developer_name;
    			}
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.disabled) textinput1_changes.disabled = ctx.disabled;
    			if (!updating_value_1 && changed.$developer_email) {
    				textinput1_changes.value = ctx.$developer_email;
    			}
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (changed.disabled) textinput2_changes.disabled = ctx.disabled;
    			if (!updating_value_2 && changed.$developer_image) {
    				textinput2_changes.value = ctx.$developer_image;
    			}
    			textinput2.$set(textinput2_changes);

    			var taginput_changes = {};
    			if (changed.$organizations) taginput_changes.data = ctx.$organizations;
    			if (changed.disabled) taginput_changes.disabled = ctx.disabled;
    			if (!updating_value_3 && changed.$developer_organizations) {
    				taginput_changes.value = ctx.$developer_organizations;
    			}
    			taginput.$set(taginput_changes);

    			var textinput3_changes = {};
    			if (changed.disabled) textinput3_changes.disabled = ctx.disabled;
    			if (!updating_value_4 && changed.$developer_location) {
    				textinput3_changes.value = ctx.$developer_location;
    			}
    			textinput3.$set(textinput3_changes);

    			var map_changes = {};
    			if (changed.$developer_latitude) map_changes.latitude = ctx.$developer_latitude;
    			if (changed.$developer_longitude) map_changes.longitude = ctx.$developer_longitude;
    			map.$set(map_changes);

    			if (changed.hidden) {
    				toggle_class(form, "hidden", ctx.hidden);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(textinput2.$$.fragment, local);

    			transition_in(taginput.$$.fragment, local);

    			transition_in(textinput3.$$.fragment, local);

    			transition_in(map.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(taginput.$$.fragment, local);
    			transition_out(textinput3.$$.fragment, local);
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(textinput2);

    			destroy_component(taginput);

    			destroy_component(textinput3);

    			destroy_component(map);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $developer_id, $developer_name, $developer_email, $developer_description, $developer_image, $developer_location, $developer_latitude, $developer_longitude, $developer_public, $developer_organizations, $organizations;

    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_description, 'developer_description');
    	component_subscribe($$self, developer_description, $$value => { $developer_description = $$value; $$invalidate('$developer_description', $developer_description); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(developer_location, 'developer_location');
    	component_subscribe($$self, developer_location, $$value => { $developer_location = $$value; $$invalidate('$developer_location', $developer_location); });
    	validate_store(developer_latitude, 'developer_latitude');
    	component_subscribe($$self, developer_latitude, $$value => { $developer_latitude = $$value; $$invalidate('$developer_latitude', $developer_latitude); });
    	validate_store(developer_longitude, 'developer_longitude');
    	component_subscribe($$self, developer_longitude, $$value => { $developer_longitude = $$value; $$invalidate('$developer_longitude', $developer_longitude); });
    	validate_store(developer_public, 'developer_public');
    	component_subscribe($$self, developer_public, $$value => { $developer_public = $$value; $$invalidate('$developer_public', $developer_public); });
    	validate_store(developer_organizations, 'developer_organizations');
    	component_subscribe($$self, developer_organizations, $$value => { $developer_organizations = $$value; $$invalidate('$developer_organizations', $developer_organizations); });
    	validate_store(organizations, 'organizations');
    	component_subscribe($$self, organizations, $$value => { $organizations = $$value; $$invalidate('$organizations', $organizations); });

    	

    const dispatch = createEventDispatcher();

    let { hidden = false, disabled = false } = $$props;

    function doInputChange( evt ) {
      fetch( `/api/developer/${$developer_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          id: $developer_id,
          name: $developer_name.trim().length === 0 ? null : $developer_name,
          email: $developer_email.trim().length === 0 ? null : $developer_email,
          description: $developer_description.trim().length === 0 ? null : $developer_description,
          image: $developer_image.trim().length === 0 ? null : $developer_image,
          location: $developer_location.trim().length === 0 ? null : $developer_location,
          latitude: $developer_latitude,
          longitude: $developer_longitude,
          public: $developer_public
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(developer_latitude, $developer_latitude = data.latitude);
        set_store_value(developer_longitude, $developer_longitude = data.longitude);

        dispatch( 'change', data );
      } );
    }

    function doTagAdd( evt ) {
      doTagChange( evt.detail );
    }

    function doTagChange( item ) {
      fetch( `/api/developer/${$developer_id}/organization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( $developer_organizations )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(developer_organizations, $developer_organizations = data.slice());
      } );
    }

    function doTagRemove( evt ) {
      doTagChange( evt.detail );
    }

    	const writable_props = ['hidden', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	function textinput0_value_binding(value) {
    		$developer_name = value;
    		developer_name.set($developer_name);
    	}

    	function textinput1_value_binding(value_1) {
    		$developer_email = value_1;
    		developer_email.set($developer_email);
    	}

    	function textinput2_value_binding(value_2) {
    		$developer_image = value_2;
    		developer_image.set($developer_image);
    	}

    	function taginput_value_binding(value_3) {
    		$developer_organizations = value_3;
    		developer_organizations.set($developer_organizations);
    	}

    	function textinput3_value_binding(value_4) {
    		$developer_location = value_4;
    		developer_location.set($developer_location);
    	}

    	$$self.$set = $$props => {
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hidden, disabled, $developer_id, $developer_name, $developer_email, $developer_description, $developer_image, $developer_location, $developer_latitude, $developer_longitude, $developer_public, $developer_organizations, $organizations };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hidden' in $$props) $$invalidate('hidden', hidden = $$props.hidden);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_description' in $$props) developer_description.set($developer_description);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$developer_location' in $$props) developer_location.set($developer_location);
    		if ('$developer_latitude' in $$props) developer_latitude.set($developer_latitude);
    		if ('$developer_longitude' in $$props) developer_longitude.set($developer_longitude);
    		if ('$developer_public' in $$props) developer_public.set($developer_public);
    		if ('$developer_organizations' in $$props) developer_organizations.set($developer_organizations);
    		if ('$organizations' in $$props) organizations.set($organizations);
    	};

    	return {
    		hidden,
    		disabled,
    		doInputChange,
    		doTagAdd,
    		doTagRemove,
    		$developer_name,
    		$developer_email,
    		$developer_image,
    		$developer_location,
    		$developer_latitude,
    		$developer_longitude,
    		$developer_organizations,
    		$organizations,
    		textinput0_value_binding,
    		textinput1_value_binding,
    		textinput2_value_binding,
    		taginput_value_binding,
    		textinput3_value_binding
    	};
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["hidden", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Summary", options, id: create_fragment$h.name });
    	}

    	get hidden() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tab.svelte generated by Svelte v3.12.1 */

    const file$i = "src/Tab.svelte";

    function create_fragment$i(ctx) {
    	var button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			button.disabled = ctx.disabled;
    			attr_dev(button, "class", "svelte-1ka61mn");
    			toggle_class(button, "selected", ctx.selected);
    			add_location(button, file$i, 45, 0, 801);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.selected) {
    				toggle_class(button, "selected", ctx.selected);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { disabled = false, selected = false } = $$props;

    	const writable_props = ['disabled', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		disabled,
    		selected,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, ["disabled", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tab", options, id: create_fragment$i.name });
    	}

    	get disabled() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TabBar.svelte generated by Svelte v3.12.1 */

    const file$j = "src/TabBar.svelte";

    function create_fragment$j(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr_dev(div, "class", "svelte-1v24ktc");
    			add_location(div, file$j, 7, 0, 66);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$j.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { $$slots, $$scope };
    }

    class TabBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TabBar", options, id: create_fragment$j.name });
    	}
    }

    /* src/Developers.svelte generated by Svelte v3.12.1 */

    const file$k = "src/Developers.svelte";

    // (286:6) <Button         on:click="{doAddClick}"         icon="/img/add-white.svg"         disabledIcon="/img/add.svg"         disabled="{add}">
    function create_default_slot_8(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Add");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8.name, type: "slot", source: "(286:6) <Button         on:click=\"{doAddClick}\"         icon=\"/img/add-white.svg\"         disabledIcon=\"/img/add.svg\"         disabled=\"{add}\">", ctx });
    	return block;
    }

    // (295:4) <List        bind:selectedIndex="{index}"       on:change="{doDeveloperClick}"       data="{filtered}"        let:item="{developer}">
    function create_default_slot_7(ctx) {
    	var current;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	var listremoveitem = new ListRemoveItem({
    		props: { label: ctx.developer.name },
    		$$inline: true
    	});
    	listremoveitem.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			listremoveitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listremoveitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			var listremoveitem_changes = {};
    			if (changed.developer) listremoveitem_changes.label = ctx.developer.name;
    			listremoveitem.$set(listremoveitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listremoveitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listremoveitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listremoveitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7.name, type: "slot", source: "(295:4) <List        bind:selectedIndex=\"{index}\"       on:change=\"{doDeveloperClick}\"       data=\"{filtered}\"        let:item=\"{developer}\">", ctx });
    	return block;
    }

    // (308:6) <List          data="{$organizations}"          let:item="{organization}">
    function create_default_slot_6(ctx) {
    	var current;

    	var listcountitem = new ListCountItem({
    		props: {
    		label: ctx.organization.name,
    		count: ctx.organization.count
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			listcountitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listcountitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var listcountitem_changes = {};
    			if (changed.organization) listcountitem_changes.label = ctx.organization.name;
    			if (changed.organization) listcountitem_changes.count = ctx.organization.count;
    			listcountitem.$set(listcountitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listcountitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listcountitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listcountitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6.name, type: "slot", source: "(308:6) <List          data=\"{$organizations}\"          let:item=\"{organization}\">", ctx });
    	return block;
    }

    // (307:4) <Details summary="Organizations">
    function create_default_slot_5(ctx) {
    	var current;

    	var list = new List({
    		props: {
    		data: ctx.$organizations,
    		$$slots: {
    		default: [create_default_slot_6, ({ item: organization }) => ({ organization })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			list.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var list_changes = {};
    			if (changed.$organizations) list_changes.data = ctx.$organizations;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			list.$set(list_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(307:4) <Details summary=\"Organizations\">", ctx });
    	return block;
    }

    // (324:6) <Tab          on:click="{() => tab = 0}"         selected="{tab === 0 ? true : false}">
    function create_default_slot_4(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Summary");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(324:6) <Tab          on:click=\"{() => tab = 0}\"         selected=\"{tab === 0 ? true : false}\">", ctx });
    	return block;
    }

    // (327:6) <Tab          on:click="{() => tab = 1}"               selected="{tab === 1 ? true : false}">
    function create_default_slot_3(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Profile");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(327:6) <Tab          on:click=\"{() => tab = 1}\"               selected=\"{tab === 1 ? true : false}\">", ctx });
    	return block;
    }

    // (330:6) <Tab          on:click="{() => tab = 2}"               selected="{tab === 2 ? true : false}">
    function create_default_slot_2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Social");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(330:6) <Tab          on:click=\"{() => tab = 2}\"               selected=\"{tab === 2 ? true : false}\">", ctx });
    	return block;
    }

    // (333:6) <Tab          on:click="{() => tab = 3}"               selected="{tab === 3 ? true : false}">
    function create_default_slot_1$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Notes");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$1.name, type: "slot", source: "(333:6) <Tab          on:click=\"{() => tab = 3}\"               selected=\"{tab === 3 ? true : false}\">", ctx });
    	return block;
    }

    // (323:4) <TabBar>
    function create_default_slot$3(ctx) {
    	var t0, t1, t2, current;

    	var tab0 = new Tab({
    		props: {
    		selected: ctx.tab === 0 ? true : false,
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab0.$on("click", ctx.click_handler_1);

    	var tab1 = new Tab({
    		props: {
    		selected: ctx.tab === 1 ? true : false,
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab1.$on("click", ctx.click_handler_2);

    	var tab2 = new Tab({
    		props: {
    		selected: ctx.tab === 2 ? true : false,
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab2.$on("click", ctx.click_handler_3);

    	var tab3 = new Tab({
    		props: {
    		selected: ctx.tab === 3 ? true : false,
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab3.$on("click", ctx.click_handler_4);

    	const block = {
    		c: function create() {
    			tab0.$$.fragment.c();
    			t0 = space();
    			tab1.$$.fragment.c();
    			t1 = space();
    			tab2.$$.fragment.c();
    			t2 = space();
    			tab3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(tab3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tab0_changes = {};
    			if (changed.tab) tab0_changes.selected = ctx.tab === 0 ? true : false;
    			if (changed.$$scope) tab0_changes.$$scope = { changed, ctx };
    			tab0.$set(tab0_changes);

    			var tab1_changes = {};
    			if (changed.tab) tab1_changes.selected = ctx.tab === 1 ? true : false;
    			if (changed.$$scope) tab1_changes.$$scope = { changed, ctx };
    			tab1.$set(tab1_changes);

    			var tab2_changes = {};
    			if (changed.tab) tab2_changes.selected = ctx.tab === 2 ? true : false;
    			if (changed.$$scope) tab2_changes.$$scope = { changed, ctx };
    			tab2.$set(tab2_changes);

    			var tab3_changes = {};
    			if (changed.tab) tab3_changes.selected = ctx.tab === 3 ? true : false;
    			if (changed.$$scope) tab3_changes.$$scope = { changed, ctx };
    			tab3.$set(tab3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);

    			transition_in(tab1.$$.fragment, local);

    			transition_in(tab2.$$.fragment, local);

    			transition_in(tab3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			transition_out(tab3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(tab1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(tab2, detaching);

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(tab3, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$3.name, type: "slot", source: "(323:4) <TabBar>", ctx });
    	return block;
    }

    function create_fragment$k(ctx) {
    	var div1, aside0, div0, updating_value, t0, t1, h4, t3, updating_selectedIndex, t4, t5, article, t6, t7, t8, t9, t10, aside1, current;

    	function search_1_value_binding(value) {
    		ctx.search_1_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let search_1_props = {};
    	if (ctx.search !== void 0) {
    		search_1_props.value = ctx.search;
    	}
    	var search_1 = new Search({ props: search_1_props, $$inline: true });

    	binding_callbacks.push(() => bind(search_1, 'value', search_1_value_binding));
    	search_1.$on("keyup", ctx.filter);

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		disabledIcon: "/img/add.svg",
    		disabled: add,
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.doAddClick);

    	function list_selectedIndex_binding(value_1) {
    		ctx.list_selectedIndex_binding.call(null, value_1);
    		updating_selectedIndex = true;
    		add_flush_callback(() => updating_selectedIndex = false);
    	}

    	let list_props = {
    		data: ctx.filtered,
    		$$slots: {
    		default: [create_default_slot_7, ({ item: developer }) => ({ developer })]
    	},
    		$$scope: { ctx }
    	};
    	if (ctx.index !== void 0) {
    		list_props.selectedIndex = ctx.index;
    	}
    	var list = new List({ props: list_props, $$inline: true });

    	binding_callbacks.push(() => bind(list, 'selectedIndex', list_selectedIndex_binding));
    	list.$on("change", ctx.doDeveloperClick);

    	var details = new Details({
    		props: {
    		summary: "Organizations",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var tabbar = new TabBar({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var summary = new Summary({
    		props: { hidden: ctx.tab === 0 ? false : true },
    		$$inline: true
    	});
    	summary.$on("change", ctx.doDeveloperChange);

    	var profile = new Profile({
    		props: { hidden: ctx.tab === 1 ? false : true },
    		$$inline: true
    	});

    	var social = new Social({
    		props: { hidden: ctx.tab === 2 ? false : true },
    		$$inline: true
    	});

    	var notes_1 = new Notes({
    		props: { hidden: ctx.tab === 3 ? false : true },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			aside0 = element("aside");
    			div0 = element("div");
    			search_1.$$.fragment.c();
    			t0 = space();
    			button.$$.fragment.c();
    			t1 = space();
    			h4 = element("h4");
    			h4.textContent = "Developers";
    			t3 = space();
    			list.$$.fragment.c();
    			t4 = space();
    			details.$$.fragment.c();
    			t5 = space();
    			article = element("article");
    			tabbar.$$.fragment.c();
    			t6 = space();
    			summary.$$.fragment.c();
    			t7 = space();
    			profile.$$.fragment.c();
    			t8 = space();
    			social.$$.fragment.c();
    			t9 = space();
    			notes_1.$$.fragment.c();
    			t10 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-3i9eli");
    			add_location(div0, file$k, 283, 4, 6981);
    			attr_dev(h4, "class", "svelte-3i9eli");
    			add_location(h4, file$k, 293, 4, 7258);
    			attr_dev(aside0, "class", "svelte-3i9eli");
    			add_location(aside0, file$k, 280, 2, 6948);
    			attr_dev(article, "class", "svelte-3i9eli");
    			add_location(article, file$k, 319, 2, 7886);
    			attr_dev(aside1, "class", "svelte-3i9eli");
    			add_location(aside1, file$k, 350, 2, 8760);
    			attr_dev(div1, "class", "panel svelte-3i9eli");
    			add_location(div1, file$k, 277, 0, 6903);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, aside0);
    			append_dev(aside0, div0);
    			mount_component(search_1, div0, null);
    			append_dev(div0, t0);
    			mount_component(button, div0, null);
    			append_dev(aside0, t1);
    			append_dev(aside0, h4);
    			append_dev(aside0, t3);
    			mount_component(list, aside0, null);
    			append_dev(aside0, t4);
    			mount_component(details, aside0, null);
    			append_dev(div1, t5);
    			append_dev(div1, article);
    			mount_component(tabbar, article, null);
    			append_dev(article, t6);
    			mount_component(summary, article, null);
    			append_dev(article, t7);
    			mount_component(profile, article, null);
    			append_dev(article, t8);
    			mount_component(social, article, null);
    			append_dev(article, t9);
    			mount_component(notes_1, article, null);
    			append_dev(div1, t10);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var search_1_changes = {};
    			if (!updating_value && changed.search) {
    				search_1_changes.value = ctx.search;
    			}
    			search_1.$set(search_1_changes);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			var list_changes = {};
    			if (changed.filtered) list_changes.data = ctx.filtered;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			if (!updating_selectedIndex && changed.index) {
    				list_changes.selectedIndex = ctx.index;
    			}
    			list.$set(list_changes);

    			var details_changes = {};
    			if (changed.$$scope || changed.$organizations) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);

    			var tabbar_changes = {};
    			if (changed.$$scope || changed.tab) tabbar_changes.$$scope = { changed, ctx };
    			tabbar.$set(tabbar_changes);

    			var summary_changes = {};
    			if (changed.tab) summary_changes.hidden = ctx.tab === 0 ? false : true;
    			summary.$set(summary_changes);

    			var profile_changes = {};
    			if (changed.tab) profile_changes.hidden = ctx.tab === 1 ? false : true;
    			profile.$set(profile_changes);

    			var social_changes = {};
    			if (changed.tab) social_changes.hidden = ctx.tab === 2 ? false : true;
    			social.$set(social_changes);

    			var notes_1_changes = {};
    			if (changed.tab) notes_1_changes.hidden = ctx.tab === 3 ? false : true;
    			notes_1.$set(notes_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search_1.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(list.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			transition_in(tabbar.$$.fragment, local);

    			transition_in(summary.$$.fragment, local);

    			transition_in(profile.$$.fragment, local);

    			transition_in(social.$$.fragment, local);

    			transition_in(notes_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search_1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
    			transition_out(tabbar.$$.fragment, local);
    			transition_out(summary.$$.fragment, local);
    			transition_out(profile.$$.fragment, local);
    			transition_out(social.$$.fragment, local);
    			transition_out(notes_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(search_1);

    			destroy_component(button);

    			destroy_component(list);

    			destroy_component(details);

    			destroy_component(tabbar);

    			destroy_component(summary);

    			destroy_component(profile);

    			destroy_component(social);

    			destroy_component(notes_1);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$k.name, type: "component", source: "", ctx });
    	return block;
    }

    let add = false;

    let enabled = 0;

    function instance$k($$self, $$props, $$invalidate) {
    	let $developer_id, $developer_name, $developer_email, $developer_image, $developer_organizations, $developer_location, $developer_latitude, $developer_longitude, $developer_description, $developer_public, $notes, $organizations, $skills;

    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(developer_organizations, 'developer_organizations');
    	component_subscribe($$self, developer_organizations, $$value => { $developer_organizations = $$value; $$invalidate('$developer_organizations', $developer_organizations); });
    	validate_store(developer_location, 'developer_location');
    	component_subscribe($$self, developer_location, $$value => { $developer_location = $$value; $$invalidate('$developer_location', $developer_location); });
    	validate_store(developer_latitude, 'developer_latitude');
    	component_subscribe($$self, developer_latitude, $$value => { $developer_latitude = $$value; $$invalidate('$developer_latitude', $developer_latitude); });
    	validate_store(developer_longitude, 'developer_longitude');
    	component_subscribe($$self, developer_longitude, $$value => { $developer_longitude = $$value; $$invalidate('$developer_longitude', $developer_longitude); });
    	validate_store(developer_description, 'developer_description');
    	component_subscribe($$self, developer_description, $$value => { $developer_description = $$value; $$invalidate('$developer_description', $developer_description); });
    	validate_store(developer_public, 'developer_public');
    	component_subscribe($$self, developer_public, $$value => { $developer_public = $$value; $$invalidate('$developer_public', $developer_public); });
    	validate_store(notes, 'notes');
    	component_subscribe($$self, notes, $$value => { $notes = $$value; $$invalidate('$notes', $notes); });
    	validate_store(organizations, 'organizations');
    	component_subscribe($$self, organizations, $$value => { $organizations = $$value; $$invalidate('$organizations', $organizations); });
    	validate_store(skills, 'skills');
    	component_subscribe($$self, skills, $$value => { $skills = $$value; $$invalidate('$skills', $skills); });

    	
    let developers = [];
    let filtered = [];
    let index = 0;
    let search = '';
    let tab = 0;

    // Filter developer list on search term
    function filter() {
      let trimmed = search.trim().toLowerCase();

      if( trimmed.length === 0 ) {
        $$invalidate('filtered', filtered = developers.slice());
      } else {
        let matches = [];

        for( let a = 0; a < developers.length; a++ ) {
          if( developers[a].name.toLowerCase().indexOf( trimmed ) >= 0 ) {
            matches.push( developers[a] );
          }
        }

        $$invalidate('filtered', filtered = matches.slice());
      }
    }

    // Add clicked
    function doAddClick( evt ) {
      fetch( '/api/developer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          id: null,
          name: 'New Developer',
          email: null,
          description: null,
          image: null,
          location: null,
          latitude: null,
          longitude: null,
          public: 0
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $$invalidate('tab', tab = 0);

        set_store_value(developer_id, $developer_id = data.id);
        set_store_value(developer_name, $developer_name = data.name);
        set_store_value(developer_email, $developer_email = '');
        set_store_value(developer_image, $developer_image = '');
        set_store_value(developer_organizations, $developer_organizations = []);
        set_store_value(developer_location, $developer_location = '');
        set_store_value(developer_latitude, $developer_latitude = null);
        set_store_value(developer_longitude, $developer_longitude = null);
        set_store_value(developer_description, $developer_description = '');
        set_store_value(developer_public, $developer_public = data.public);

        developers.push( Object.assign( {}, data ) );
        developers.sort( ( a, b ) => {
          if( a.name > b.name ) return 1;
          if( a.name < b.name ) return -1;
          return 0;
        } );

        filter();

        for( let f = 0; f < filtered.length; f++ ) {
          if( filtered[f].id === $developer_id ) {
            $$invalidate('index', index = f);
            break;
          }
        }
      } );
    }

    function doDeveloperClick( evt ) {
      fetch( `/api/developer/${evt.detail.item.id}` )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        console.log( data );
        set_store_value(developer_id, $developer_id = data.id);
        set_store_value(developer_name, $developer_name = data.name === null ? '' : data.name);
        set_store_value(developer_email, $developer_email = data.email === null ? '' : data.email);
        set_store_value(developer_image, $developer_image = data.image === null ? '' : data.image);
        set_store_value(developer_location, $developer_location = data.location === null ? '' : data.location);
        set_store_value(developer_latitude, $developer_latitude = data.latitude);
        set_store_value(developer_longitude, $developer_longitude = data.longitude);
        set_store_value(developer_description, $developer_description = data.description === null ? '' : data.description);
        set_store_value(developer_public, $developer_public = data.public);
      } );

      fetch( `/api/developer/${evt.detail.item.id}/organization` )
      .then( ( response ) => response.json() )
      .then( ( data ) => { 
        set_store_value(developer_organizations, $developer_organizations = data.slice());
      } );

      fetch( `/api/note/developer/${evt.detail.item.id}` )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(notes, $notes = data.slice());
      } );
    }

    function doDeveloperChange( evt ) {
      for( let d = 0; d < developers.length; d++ ) {
        if( developers[d].id === evt.detail.id ) {
          developers[d] = Object.assign( {}, evt.detail );
          break;
        }
      }

      developers.sort( ( a, b ) => {
        if( a.name > b.name ) return 1;
        if( a.name < b.name ) return -1;
        return 0;
      } );  

      filter();

      for( let f = 0; f < filtered.length; f++ ) {
        if( filtered[f].id === evt.detail.id ) {
          $$invalidate('index', index = f);
          break;
        }
      }
    }

    function doDeveloperRemove( evt ) {

      // Remove from database
      fetch( `/api/developer/${evt.id}`, {
        method: 'DELETE'
      } )
      .then( ( response ) => response.json() )
      .then( async ( data ) => {
        // Remove from list of developers
        for( let a = 0; a < developers.length; a++ ) {
          if( developers[a].id === data.id ) {
            developers.splice( a, 1 );
            break;
          }
        }

        // In order to reset list
        filter();

        // Force reselect
        // index = later;
      } ); 
    }

    // Load external data
    onMount( async () => {
      fetch( '/api/developer' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        developers = data.slice();

        set_store_value(developer_id, $developer_id = data[0].id);
        set_store_value(developer_name, $developer_name = data[0].name === null ? '' : data[0].name);
        set_store_value(developer_email, $developer_email = data[0].email === null ? '' : data[0].email);
        set_store_value(developer_image, $developer_image = data[0].image === null ? '' : data[0].image);
        set_store_value(developer_location, $developer_location = data[0].location === null ? '' : data[0].location);
        set_store_value(developer_latitude, $developer_latitude = data[0].latitude);
        set_store_value(developer_longitude, $developer_longitude = data[0].longitude);
        set_store_value(developer_description, $developer_description = data[0].description === null ? '' : data[0].description);
        set_store_value(developer_public, $developer_public = data[0].public);

        filter();    

        fetch( `/api/note/developer/${$developer_id}` )
        .then( ( response ) => response.json() )
        .then( ( data ) => {
          set_store_value(notes, $notes = data.slice());
        } );

        fetch( `/api/developer/${$developer_id}/organization` )
        .then( ( response ) => response.json() )
        .then( ( data ) => { 
          set_store_value(developer_organizations, $developer_organizations = data.slice());
        } );
      } );

      fetch( '/api/organization' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(organizations, $organizations = data.slice());
      } );

      fetch( '/api/skill' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(skills, $skills = data.slice());
      } ); 
    } );

    	function search_1_value_binding(value) {
    		search = value;
    		$$invalidate('search', search);
    	}

    	const click_handler = ({ developer }) => doDeveloperRemove( developer );

    	function list_selectedIndex_binding(value_1) {
    		index = value_1;
    		$$invalidate('index', index);
    	}

    	const click_handler_1 = () => $$invalidate('tab', tab = 0);

    	const click_handler_2 = () => $$invalidate('tab', tab = 1);

    	const click_handler_3 = () => $$invalidate('tab', tab = 2);

    	const click_handler_4 = () => $$invalidate('tab', tab = 3);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('add' in $$props) $$invalidate('add', add = $$props.add);
    		if ('developers' in $$props) developers = $$props.developers;
    		if ('enabled' in $$props) enabled = $$props.enabled;
    		if ('filtered' in $$props) $$invalidate('filtered', filtered = $$props.filtered);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('search' in $$props) $$invalidate('search', search = $$props.search);
    		if ('tab' in $$props) $$invalidate('tab', tab = $$props.tab);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$developer_organizations' in $$props) developer_organizations.set($developer_organizations);
    		if ('$developer_location' in $$props) developer_location.set($developer_location);
    		if ('$developer_latitude' in $$props) developer_latitude.set($developer_latitude);
    		if ('$developer_longitude' in $$props) developer_longitude.set($developer_longitude);
    		if ('$developer_description' in $$props) developer_description.set($developer_description);
    		if ('$developer_public' in $$props) developer_public.set($developer_public);
    		if ('$notes' in $$props) notes.set($notes);
    		if ('$organizations' in $$props) organizations.set($organizations);
    		if ('$skills' in $$props) skills.set($skills);
    	};

    	return {
    		filtered,
    		index,
    		search,
    		tab,
    		filter,
    		doAddClick,
    		doDeveloperClick,
    		doDeveloperChange,
    		doDeveloperRemove,
    		$organizations,
    		search_1_value_binding,
    		click_handler,
    		list_selectedIndex_binding,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	};
    }

    class Developers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Developers", options, id: create_fragment$k.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$l = "src/Header.svelte";

    function create_fragment$l(ctx) {
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
    			add_location(span, file$l, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$l, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$l, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$l, 35, 0, 439);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$l.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$l.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Repositories.svelte generated by Svelte v3.12.1 */

    const file$m = "src/Repositories.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.repo = list[i];
    	return child_ctx;
    }

    // (246:4) <Button icon="/img/add-white.svg">
    function create_default_slot$4(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Add");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$4.name, type: "slot", source: "(246:4) <Button icon=\"/img/add-white.svg\">", ctx });
    	return block;
    }

    // (261:4) {#each repositories as repo}
    function create_each_block$4(ctx) {
    	var div, p0, t0_value = ctx.repo.name + "", t0, t1, p1, t2_value = format$1( ctx.repo.started_at ) + "", t2, t3, p2, t4_value = format$1( ctx.repo.pushed_at ) + "", t4, t5, p3, t6_value = ctx.repo.subscribers + "", t6, t7, p4, t8_value = ctx.repo.stargazers + "", t8, t9, p5, t10_value = ctx.repo.forks + "", t10, t11, p6, t12_value = ctx.repo.issues + "", t12, t13;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			p3 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			p4 = element("p");
    			t8 = text(t8_value);
    			t9 = space();
    			p5 = element("p");
    			t10 = text(t10_value);
    			t11 = space();
    			p6 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			attr_dev(p0, "class", "svelte-6djnri");
    			add_location(p0, file$m, 263, 8, 5417);
    			attr_dev(p1, "class", "medium svelte-6djnri");
    			add_location(p1, file$m, 264, 8, 5444);
    			attr_dev(p2, "class", "medium svelte-6djnri");
    			add_location(p2, file$m, 265, 8, 5508);
    			attr_dev(p3, "class", "small svelte-6djnri");
    			toggle_class(p3, "average", ctx.repo.subscribers < ctx.average_watchers ? true : false);
    			toggle_class(p3, "median", ctx.repo.subscribers < ctx.median_watchers ? true : false);
    			add_location(p3, file$m, 266, 8, 5577);
    			attr_dev(p4, "class", "small svelte-6djnri");
    			toggle_class(p4, "average", ctx.repo.stargazers < ctx.average_stars ? true : false);
    			toggle_class(p4, "median", ctx.repo.stargazers < ctx.median_stars ? true : false);
    			add_location(p4, file$m, 270, 8, 5793);
    			attr_dev(p5, "class", "small svelte-6djnri");
    			toggle_class(p5, "average", ctx.repo.forks < ctx.average_forks ? true : false);
    			toggle_class(p5, "median", ctx.repo.forks < ctx.median_forks ? true : false);
    			add_location(p5, file$m, 274, 8, 6000);
    			attr_dev(p6, "class", "small svelte-6djnri");
    			add_location(p6, file$m, 278, 8, 6192);
    			attr_dev(div, "class", "row svelte-6djnri");
    			add_location(div, file$m, 262, 6, 5391);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(div, t3);
    			append_dev(div, p2);
    			append_dev(p2, t4);
    			append_dev(div, t5);
    			append_dev(div, p3);
    			append_dev(p3, t6);
    			append_dev(div, t7);
    			append_dev(div, p4);
    			append_dev(p4, t8);
    			append_dev(div, t9);
    			append_dev(div, p5);
    			append_dev(p5, t10);
    			append_dev(div, t11);
    			append_dev(div, p6);
    			append_dev(p6, t12);
    			append_dev(div, t13);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.repositories) && t0_value !== (t0_value = ctx.repo.name + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.repositories) && t2_value !== (t2_value = format$1( ctx.repo.started_at ) + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((changed.repositories) && t4_value !== (t4_value = format$1( ctx.repo.pushed_at ) + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((changed.repositories) && t6_value !== (t6_value = ctx.repo.subscribers + "")) {
    				set_data_dev(t6, t6_value);
    			}

    			if ((changed.repositories || changed.average_watchers)) {
    				toggle_class(p3, "average", ctx.repo.subscribers < ctx.average_watchers ? true : false);
    			}

    			if ((changed.repositories || changed.median_watchers)) {
    				toggle_class(p3, "median", ctx.repo.subscribers < ctx.median_watchers ? true : false);
    			}

    			if ((changed.repositories) && t8_value !== (t8_value = ctx.repo.stargazers + "")) {
    				set_data_dev(t8, t8_value);
    			}

    			if ((changed.repositories || changed.average_stars)) {
    				toggle_class(p4, "average", ctx.repo.stargazers < ctx.average_stars ? true : false);
    			}

    			if ((changed.repositories || changed.median_stars)) {
    				toggle_class(p4, "median", ctx.repo.stargazers < ctx.median_stars ? true : false);
    			}

    			if ((changed.repositories) && t10_value !== (t10_value = ctx.repo.forks + "")) {
    				set_data_dev(t10, t10_value);
    			}

    			if ((changed.repositories || changed.average_forks)) {
    				toggle_class(p5, "average", ctx.repo.forks < ctx.average_forks ? true : false);
    			}

    			if ((changed.repositories || changed.median_forks)) {
    				toggle_class(p5, "median", ctx.repo.forks < ctx.median_forks ? true : false);
    			}

    			if ((changed.repositories) && t12_value !== (t12_value = ctx.repo.issues + "")) {
    				set_data_dev(t12, t12_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$4.name, type: "each", source: "(261:4) {#each repositories as repo}", ctx });
    	return block;
    }

    function create_fragment$m(ctx) {
    	var div4, div0, updating_value, t0, t1, header, p0, t3, p1, t5, p2, t7, p3, t9, p4, t11, p5, t13, p6, t15, div1, t16, footer, div2, p7, t17, t18_value = ctx.repositories.length + "", t18, t19, t20, p8, t22, p9, t23, t24, p10, t25, t26, p11, t27, t28, p12, t29, t30, div3, p13, t31, t32, p14, t34, p15, t35, t36, p16, t37, t38, p17, t39, t40, p18, t41, current;

    	function search_1_value_binding(value) {
    		ctx.search_1_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let search_1_props = {};
    	if (ctx.search !== void 0) {
    		search_1_props.value = ctx.search;
    	}
    	var search_1 = new Search({ props: search_1_props, $$inline: true });

    	binding_callbacks.push(() => bind(search_1, 'value', search_1_value_binding));

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	let each_value = ctx.repositories;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			search_1.$$.fragment.c();
    			t0 = space();
    			button.$$.fragment.c();
    			t1 = space();
    			header = element("header");
    			p0 = element("p");
    			p0.textContent = "Name";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Created";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Pushed";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Watchers";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "Stars";
    			t11 = space();
    			p5 = element("p");
    			p5.textContent = "Forks";
    			t13 = space();
    			p6 = element("p");
    			p6.textContent = "Issues";
    			t15 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t16 = space();
    			footer = element("footer");
    			div2 = element("div");
    			p7 = element("p");
    			t17 = text("Showing ");
    			t18 = text(t18_value);
    			t19 = text(" repositories");
    			t20 = space();
    			p8 = element("p");
    			p8.textContent = "Median";
    			t22 = space();
    			p9 = element("p");
    			t23 = text(ctx.median_watchers);
    			t24 = space();
    			p10 = element("p");
    			t25 = text(ctx.median_stars);
    			t26 = space();
    			p11 = element("p");
    			t27 = text(ctx.median_forks);
    			t28 = space();
    			p12 = element("p");
    			t29 = text(ctx.median_issues);
    			t30 = space();
    			div3 = element("div");
    			p13 = element("p");
    			t31 = text(ctx.updated_at);
    			t32 = space();
    			p14 = element("p");
    			p14.textContent = "Average";
    			t34 = space();
    			p15 = element("p");
    			t35 = text(ctx.average_watchers);
    			t36 = space();
    			p16 = element("p");
    			t37 = text(ctx.average_stars);
    			t38 = space();
    			p17 = element("p");
    			t39 = text(ctx.average_forks);
    			t40 = space();
    			p18 = element("p");
    			t41 = text(ctx.average_issues);
    			attr_dev(div0, "class", "search svelte-6djnri");
    			add_location(div0, file$m, 243, 2, 4972);
    			attr_dev(p0, "class", "svelte-6djnri");
    			add_location(p0, file$m, 249, 4, 5105);
    			attr_dev(p1, "class", "medium svelte-6djnri");
    			add_location(p1, file$m, 250, 4, 5121);
    			attr_dev(p2, "class", "medium svelte-6djnri");
    			add_location(p2, file$m, 251, 4, 5155);
    			attr_dev(p3, "class", "small svelte-6djnri");
    			add_location(p3, file$m, 252, 4, 5188);
    			attr_dev(p4, "class", "small svelte-6djnri");
    			add_location(p4, file$m, 253, 4, 5222);
    			attr_dev(p5, "class", "small svelte-6djnri");
    			add_location(p5, file$m, 254, 4, 5253);
    			attr_dev(p6, "class", "small svelte-6djnri");
    			add_location(p6, file$m, 255, 4, 5284);
    			attr_dev(header, "class", "svelte-6djnri");
    			add_location(header, file$m, 248, 2, 5092);
    			attr_dev(div1, "class", "list svelte-6djnri");
    			add_location(div1, file$m, 258, 2, 5327);
    			attr_dev(p7, "class", "svelte-6djnri");
    			add_location(p7, file$m, 287, 6, 6306);
    			attr_dev(p8, "class", "medium svelte-6djnri");
    			add_location(p8, file$m, 288, 6, 6362);
    			attr_dev(p9, "class", "small svelte-6djnri");
    			add_location(p9, file$m, 289, 6, 6397);
    			attr_dev(p10, "class", "small svelte-6djnri");
    			add_location(p10, file$m, 290, 6, 6442);
    			attr_dev(p11, "class", "small svelte-6djnri");
    			add_location(p11, file$m, 291, 6, 6484);
    			attr_dev(p12, "class", "small svelte-6djnri");
    			add_location(p12, file$m, 292, 6, 6526);
    			attr_dev(div2, "class", "median svelte-6djnri");
    			add_location(div2, file$m, 286, 4, 6279);
    			attr_dev(p13, "class", "svelte-6djnri");
    			add_location(p13, file$m, 295, 6, 6606);
    			attr_dev(p14, "class", "medium svelte-6djnri");
    			add_location(p14, file$m, 296, 6, 6632);
    			attr_dev(p15, "class", "small svelte-6djnri");
    			add_location(p15, file$m, 297, 6, 6668);
    			attr_dev(p16, "class", "small svelte-6djnri");
    			add_location(p16, file$m, 298, 6, 6714);
    			attr_dev(p17, "class", "small svelte-6djnri");
    			add_location(p17, file$m, 299, 6, 6757);
    			attr_dev(p18, "class", "small svelte-6djnri");
    			add_location(p18, file$m, 300, 6, 6800);
    			attr_dev(div3, "class", "average svelte-6djnri");
    			add_location(div3, file$m, 294, 4, 6578);
    			attr_dev(footer, "class", "svelte-6djnri");
    			add_location(footer, file$m, 285, 2, 6266);
    			attr_dev(div4, "class", "panel svelte-6djnri");
    			add_location(div4, file$m, 241, 0, 4949);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(search_1, div0, null);
    			append_dev(div0, t0);
    			mount_component(button, div0, null);
    			append_dev(div4, t1);
    			append_dev(div4, header);
    			append_dev(header, p0);
    			append_dev(header, t3);
    			append_dev(header, p1);
    			append_dev(header, t5);
    			append_dev(header, p2);
    			append_dev(header, t7);
    			append_dev(header, p3);
    			append_dev(header, t9);
    			append_dev(header, p4);
    			append_dev(header, t11);
    			append_dev(header, p5);
    			append_dev(header, t13);
    			append_dev(header, p6);
    			append_dev(div4, t15);
    			append_dev(div4, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t16);
    			append_dev(div4, footer);
    			append_dev(footer, div2);
    			append_dev(div2, p7);
    			append_dev(p7, t17);
    			append_dev(p7, t18);
    			append_dev(p7, t19);
    			append_dev(div2, t20);
    			append_dev(div2, p8);
    			append_dev(div2, t22);
    			append_dev(div2, p9);
    			append_dev(p9, t23);
    			append_dev(div2, t24);
    			append_dev(div2, p10);
    			append_dev(p10, t25);
    			append_dev(div2, t26);
    			append_dev(div2, p11);
    			append_dev(p11, t27);
    			append_dev(div2, t28);
    			append_dev(div2, p12);
    			append_dev(p12, t29);
    			append_dev(footer, t30);
    			append_dev(footer, div3);
    			append_dev(div3, p13);
    			append_dev(p13, t31);
    			append_dev(div3, t32);
    			append_dev(div3, p14);
    			append_dev(div3, t34);
    			append_dev(div3, p15);
    			append_dev(p15, t35);
    			append_dev(div3, t36);
    			append_dev(div3, p16);
    			append_dev(p16, t37);
    			append_dev(div3, t38);
    			append_dev(div3, p17);
    			append_dev(p17, t39);
    			append_dev(div3, t40);
    			append_dev(div3, p18);
    			append_dev(p18, t41);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var search_1_changes = {};
    			if (!updating_value && changed.search) {
    				search_1_changes.value = ctx.search;
    			}
    			search_1.$set(search_1_changes);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			if (changed.repositories || changed.average_forks || changed.median_forks || changed.average_stars || changed.median_stars || changed.average_watchers || changed.median_watchers || changed.format) {
    				each_value = ctx.repositories;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if ((!current || changed.repositories) && t18_value !== (t18_value = ctx.repositories.length + "")) {
    				set_data_dev(t18, t18_value);
    			}

    			if (!current || changed.median_watchers) {
    				set_data_dev(t23, ctx.median_watchers);
    			}

    			if (!current || changed.median_stars) {
    				set_data_dev(t25, ctx.median_stars);
    			}

    			if (!current || changed.median_forks) {
    				set_data_dev(t27, ctx.median_forks);
    			}

    			if (!current || changed.median_issues) {
    				set_data_dev(t29, ctx.median_issues);
    			}

    			if (!current || changed.updated_at) {
    				set_data_dev(t31, ctx.updated_at);
    			}

    			if (!current || changed.average_watchers) {
    				set_data_dev(t35, ctx.average_watchers);
    			}

    			if (!current || changed.average_stars) {
    				set_data_dev(t37, ctx.average_stars);
    			}

    			if (!current || changed.average_forks) {
    				set_data_dev(t39, ctx.average_forks);
    			}

    			if (!current || changed.average_issues) {
    				set_data_dev(t41, ctx.average_issues);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search_1.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search_1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div4);
    			}

    			destroy_component(search_1);

    			destroy_component(button);

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$m.name, type: "component", source: "", ctx });
    	return block;
    }

    function format$1( stamp ) {
    stamp = new Date( stamp );

    let month = stamp.getMonth().toString().padStart( 2, '0' );
    let date = stamp.getDate().toString().padStart( 2, '0' );

    return `${month}/${date}/${stamp.getFullYear()}`;
    }

    function formatLong( updated ) {
    let hours = [
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ];
    let months = [
      'January',   'February', 'March',    'April', 
      'May',       'June',     'July',     'August', 
      'September', 'October',  'November', 'December'
    ];

    updated = new Date( updated );

    return `As of ${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()} at ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )} ${updated.getHours() > 11 ? 'PM' : 'AM'}`;
    }

    function median( values ) {
    let result = values[Math.floor( values.length / 2 )];

    if( ( values.length % 2 ) === 0 ) {
      const low = values.length / 2;
      const high = low + 1;
      result = ( values[low] + values[high] ) / 2;
    }

    return result;
    }

    function numeric( a, b ) {
    if( a > b ) return 1;
    if( a < b ) return -1;
    return 0;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	

    let average_watchers = 0;
    let average_stars = 0;
    let average_forks = 0;
    let average_issues = 0;
    let median_watchers = 0;
    let median_stars = 0;
    let median_forks = 0;
    let median_issues = 0;
    let repositories = [];
    let search = '';
    let updated_at = undefined;

    onMount( async () => {
      fetch( '/api/repository' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        data.sort( ( a, b ) => {
          if( a.name < b.name ) return -1;
          if( a.name > b.name ) return 1;
          return 0;
        } );

        let sum = {
          watchers: 0,
          stars: 0,
          forks: 0,
          issues: 0
        };
        let statistics = {
          watchers: [],
          stars: [],
          forks: [],
          issues: []
        };    

        for( let d = 0; d < data.length; d++ ) {
          sum.watchers = sum.watchers + data[d].subscribers;
          sum.stars = sum.stars + data[d].stargazers;
          sum.forks = sum.forks + data[d].forks;
          sum.issues = sum.issues + data[d].issues;

          statistics.watchers.push( data[d].subscribers );
          statistics.stars.push( data[d].stargazers );
          statistics.forks.push( data[d].forks );
          statistics.issues.push( data[d].issues );        
        }

        $$invalidate('average_watchers', average_watchers = Math.round( sum.watchers / data.length ));
        $$invalidate('average_stars', average_stars = Math.round( sum.stars / data.length ));
        $$invalidate('average_forks', average_forks = Math.round( sum.forks / data.length ));
        $$invalidate('average_issues', average_issues = Math.round( sum.issues / data.length ));

        statistics.watchers = statistics.watchers.sort( numeric );
        $$invalidate('median_watchers', median_watchers = median( statistics.watchers ));
        statistics.stars = statistics.stars.sort( numeric );  
        $$invalidate('median_stars', median_stars = median( statistics.stars ));  
        statistics.forks = statistics.forks.sort( numeric );
        $$invalidate('median_forks', median_forks = median( statistics.forks ));    
        statistics.issues = statistics.issues.sort( numeric );
        $$invalidate('median_issues', median_issues = median( statistics.issues ));      

        $$invalidate('repositories', repositories = data.slice( 0 ));

        $$invalidate('updated_at', updated_at = formatLong( repositories[0].updated_at ));
      } );
    } );

    	function search_1_value_binding(value) {
    		search = value;
    		$$invalidate('search', search);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('average_watchers' in $$props) $$invalidate('average_watchers', average_watchers = $$props.average_watchers);
    		if ('average_stars' in $$props) $$invalidate('average_stars', average_stars = $$props.average_stars);
    		if ('average_forks' in $$props) $$invalidate('average_forks', average_forks = $$props.average_forks);
    		if ('average_issues' in $$props) $$invalidate('average_issues', average_issues = $$props.average_issues);
    		if ('median_watchers' in $$props) $$invalidate('median_watchers', median_watchers = $$props.median_watchers);
    		if ('median_stars' in $$props) $$invalidate('median_stars', median_stars = $$props.median_stars);
    		if ('median_forks' in $$props) $$invalidate('median_forks', median_forks = $$props.median_forks);
    		if ('median_issues' in $$props) $$invalidate('median_issues', median_issues = $$props.median_issues);
    		if ('repositories' in $$props) $$invalidate('repositories', repositories = $$props.repositories);
    		if ('search' in $$props) $$invalidate('search', search = $$props.search);
    		if ('updated_at' in $$props) $$invalidate('updated_at', updated_at = $$props.updated_at);
    	};

    	return {
    		average_watchers,
    		average_stars,
    		average_forks,
    		average_issues,
    		median_watchers,
    		median_stars,
    		median_forks,
    		median_issues,
    		repositories,
    		search,
    		updated_at,
    		search_1_value_binding
    	};
    }

    class Repositories extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Repositories", options, id: create_fragment$m.name });
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$n = "src/Switcher.svelte";

    function create_fragment$n(ctx) {
    	var div, button0, t_1, button1, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Developers";
    			t_1 = space();
    			button1 = element("button");
    			button1.textContent = "Repositories";
    			attr_dev(button0, "class", "svelte-z8cxbi");
    			toggle_class(button0, "selected", ctx.index === 0);
    			add_location(button0, file$n, 43, 2, 672);
    			attr_dev(button1, "class", "svelte-z8cxbi");
    			toggle_class(button1, "selected", ctx.index === 1);
    			add_location(button1, file$n, 46, 2, 771);
    			attr_dev(div, "class", "svelte-z8cxbi");
    			add_location(div, file$n, 42, 0, 664);

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
    			if (changed.index) {
    				toggle_class(button0, "selected", ctx.index === 0);
    				toggle_class(button1, "selected", ctx.index === 1);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$n.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { index = 0 } = $$props;

    	const writable_props = ['index'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate('index', index = 0);

    	const click_handler_1 = () => $$invalidate('index', index = 1);

    	$$self.$set = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { index };
    	};

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	return { index, click_handler, click_handler_1 };
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, ["index"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$n.name });
    	}

    	get index() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$o(ctx) {
    	var t0, updating_index, t1, t2, current;

    	var header = new Header({ $$inline: true });

    	function switcher_index_binding(value) {
    		ctx.switcher_index_binding.call(null, value);
    		updating_index = true;
    		add_flush_callback(() => updating_index = false);
    	}

    	let switcher_props = {};
    	if (ctx.panel !== void 0) {
    		switcher_props.index = ctx.panel;
    	}
    	var switcher = new Switcher({ props: switcher_props, $$inline: true });

    	binding_callbacks.push(() => bind(switcher, 'index', switcher_index_binding));

    	var developers = new Developers({
    		props: { style: "display: " + (ctx.panel === 0 ? 'flex' : 'none') + ";" },
    		$$inline: true
    	});

    	var repositories = new Repositories({
    		props: { style: "display: " + (ctx.panel === 1 ? 'flex' : 'none') + ";" },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			switcher.$$.fragment.c();
    			t1 = space();
    			developers.$$.fragment.c();
    			t2 = space();
    			repositories.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(switcher, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(developers, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(repositories, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switcher_changes = {};
    			if (!updating_index && changed.panel) {
    				switcher_changes.index = ctx.panel;
    			}
    			switcher.$set(switcher_changes);

    			var developers_changes = {};
    			if (changed.panel) developers_changes.style = "display: " + (ctx.panel === 0 ? 'flex' : 'none') + ";";
    			developers.$set(developers_changes);

    			var repositories_changes = {};
    			if (changed.panel) repositories_changes.style = "display: " + (ctx.panel === 1 ? 'flex' : 'none') + ";";
    			repositories.$set(repositories_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(switcher.$$.fragment, local);

    			transition_in(developers.$$.fragment, local);

    			transition_in(repositories.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(switcher.$$.fragment, local);
    			transition_out(developers.$$.fragment, local);
    			transition_out(repositories.$$.fragment, local);
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

    			destroy_component(developers, detaching);

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(repositories, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$o.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	

    let panel = 0;

    	function switcher_index_binding(value) {
    		panel = value;
    		$$invalidate('panel', panel);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('panel' in $$props) $$invalidate('panel', panel = $$props.panel);
    	};

    	return { panel, switcher_index_binding };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$o.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
