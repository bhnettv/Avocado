
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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

    const globals = (typeof window !== 'undefined' ? window : global);
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

    /* src/IconButton.svelte generated by Svelte v3.12.1 */

    const file = "src/IconButton.svelte";

    function create_fragment(ctx) {
    	var button, t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			set_style(button, "background-image", "url( " + ctx.icon + " )");
    			attr_dev(button, "class", "svelte-cahyf5");
    			add_location(button, file, 22, 0, 386);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.icon) {
    				set_style(button, "background-image", "url( " + ctx.icon + " )");
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { label, icon } = $$props;

    	const writable_props = ['label', 'icon'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<IconButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    	};

    	$$self.$capture_state = () => {
    		return { label, icon };
    	};

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    	};

    	return { label, icon };
    }

    class IconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["label", "icon"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "IconButton", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<IconButton> was created without expected prop 'label'");
    		}
    		if (ctx.icon === undefined && !('icon' in props)) {
    			console.warn("<IconButton> was created without expected prop 'icon'");
    		}
    	}

    	get label() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Controls.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Controls.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	var iconbutton = new IconButton({
    		props: { label: "Edit", icon: "/img/edit.svg" },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			iconbutton.$$.fragment.c();
    			set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			attr_dev(div, "class", "svelte-1hwvttx");
    			add_location(div, file$1, 15, 0, 222);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(iconbutton, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.visible) {
    				set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(iconbutton);
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

    /* src/Details.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Details.svelte";

    function create_fragment$2(ctx) {
    	var div1, div0, button, t0, p, t1, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			t0 = space();
    			p = element("p");
    			t1 = text(ctx.summary);
    			t2 = space();

    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "svelte-19j4uhf");
    			toggle_class(button, "closed", !ctx.opened);
    			add_location(button, file$2, 55, 4, 913);
    			attr_dev(p, "class", "svelte-19j4uhf");
    			add_location(p, file$2, 59, 4, 1019);
    			attr_dev(div0, "class", "summary svelte-19j4uhf");
    			add_location(div0, file$2, 54, 2, 887);

    			attr_dev(div1, "class", "pane svelte-19j4uhf");
    			toggle_class(div1, "closed", !ctx.opened);
    			add_location(div1, file$2, 53, 0, 841);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.opened) {
    				toggle_class(button, "closed", !ctx.opened);
    			}

    			if (!current || changed.summary) {
    				set_data_dev(t1, ctx.summary);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["opened", "summary"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Details", options, id: create_fragment$2.name });
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

    /* src/Avatar.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/Avatar.svelte";

    function create_fragment$3(ctx) {
    	var button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-soz8oe");
    			add_location(button, file$3, 8, 0, 83);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    class Avatar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Avatar", options, id: create_fragment$3.name });
    	}
    }

    /* src/Input.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/Input.svelte";

    function create_fragment$4(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.value = ctx.value;
    			attr_dev(input, "class", "svelte-7v5vry");
    			add_location(input, file$4, 22, 0, 360);
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

    			if (changed.value) {
    				prop_dev(input, "value", ctx.value);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { placeholder = '', value = '' } = $$props;

    	const writable_props = ['placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Input> was created with unknown prop '${key}'`);
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

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment$4.name });
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextArea.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/TextArea.svelte";

    function create_fragment$5(ctx) {
    	var textarea;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "placeholder", ctx.placeholder);
    			textarea.value = ctx.value;
    			attr_dev(textarea, "class", "svelte-ax9hub");
    			add_location(textarea, file$5, 21, 0, 353);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.placeholder) {
    				attr_dev(textarea, "placeholder", ctx.placeholder);
    			}

    			if (changed.value) {
    				prop_dev(textarea, "value", ctx.value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(textarea);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { placeholder = '', value = '' } = $$props;

    	const writable_props = ['placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
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

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, ["placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$5.name });
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

    /* src/DeveloperForm.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/DeveloperForm.svelte";

    function create_fragment$6(ctx) {
    	var form, div2, t0, div0, t1, t2, div1, t3, t4, div5, div3, t5, div4, t6, t7, div8, div6, t8, div7, t9, t10, div11, div9, t11, div10, t12, current;

    	var avatar = new Avatar({ $$inline: true });

    	var input0 = new Input({
    		props: { placeholder: "Name", value: "Kevin Hoyt" },
    		$$inline: true
    	});

    	var input1 = new Input({
    		props: {
    		placeholder: "Email",
    		value: "krhoyt@us.ibm.com"
    	},
    		$$inline: true
    	});

    	var input2 = new Input({
    		props: { placeholder: "Labels" },
    		$$inline: true
    	});

    	var input3 = new Input({
    		props: { placeholder: "Skills" },
    		$$inline: true
    	});

    	var textarea = new TextArea({
    		props: { placeholder: "Biography" },
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
    			input0.$$.fragment.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			input1.$$.fragment.c();
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			input2.$$.fragment.c();
    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			t9 = space();
    			input3.$$.fragment.c();
    			t10 = space();
    			div11 = element("div");
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");
    			t12 = space();
    			textarea.$$.fragment.c();
    			attr_dev(div0, "class", "gap svelte-7tqmxe");
    			add_location(div0, file$6, 62, 4, 872);
    			attr_dev(div1, "class", "gap svelte-7tqmxe");
    			add_location(div1, file$6, 64, 4, 953);
    			attr_dev(div2, "class", "line svelte-7tqmxe");
    			add_location(div2, file$6, 60, 2, 835);
    			attr_dev(div3, "class", "icon labels svelte-7tqmxe");
    			add_location(div3, file$6, 69, 4, 1071);
    			attr_dev(div4, "class", "gap svelte-7tqmxe");
    			add_location(div4, file$6, 70, 4, 1107);
    			attr_dev(div5, "class", "line svelte-7tqmxe");
    			add_location(div5, file$6, 68, 2, 1048);
    			attr_dev(div6, "class", "icon skills svelte-7tqmxe");
    			add_location(div6, file$6, 75, 4, 1204);
    			attr_dev(div7, "class", "gap svelte-7tqmxe");
    			add_location(div7, file$6, 76, 4, 1240);
    			attr_dev(div8, "class", "line svelte-7tqmxe");
    			add_location(div8, file$6, 74, 2, 1181);
    			attr_dev(div9, "class", "icon bio svelte-7tqmxe");
    			add_location(div9, file$6, 81, 4, 1337);
    			attr_dev(div10, "class", "gap svelte-7tqmxe");
    			add_location(div10, file$6, 82, 4, 1370);
    			attr_dev(div11, "class", "line svelte-7tqmxe");
    			add_location(div11, file$6, 80, 2, 1314);
    			attr_dev(form, "class", "svelte-7tqmxe");
    			toggle_class(form, "display", ctx.visible);
    			add_location(form, file$6, 58, 0, 799);
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
    			mount_component(input0, div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(input1, div2, null);
    			append_dev(form, t4);
    			append_dev(form, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div5, t6);
    			mount_component(input2, div5, null);
    			append_dev(form, t7);
    			append_dev(form, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div8, t9);
    			mount_component(input3, div8, null);
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
    			if (changed.visible) {
    				toggle_class(form, "display", ctx.visible);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(input0.$$.fragment, local);

    			transition_in(input1.$$.fragment, local);

    			transition_in(input2.$$.fragment, local);

    			transition_in(input3.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(avatar);

    			destroy_component(input0);

    			destroy_component(input1);

    			destroy_component(input2);

    			destroy_component(input3);

    			destroy_component(textarea);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

    let { visible = false } = $$props;

    	const writable_props = ['visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DeveloperForm> was created with unknown prop '${key}'`);
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

    class DeveloperForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DeveloperForm", options, id: create_fragment$6.name });
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

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.developer = list[i];
    	return child_ctx;
    }

    // (79:0) {#each developers as developer}
    function create_each_block(ctx) {
    	var li, button, t0, p, t1_value = ctx.developer.name + "", t1, t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "svelte-kv77nl");
    			add_location(button, file$7, 80, 4, 1266);
    			attr_dev(p, "class", "svelte-kv77nl");
    			add_location(p, file$7, 81, 4, 1288);
    			attr_dev(li, "class", "svelte-kv77nl");
    			add_location(li, file$7, 79, 2, 1257);
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
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(79:0) {#each developers as developer}", ctx });
    	return block;
    }

    function create_fragment$7(ctx) {
    	var div, button, t0, h4, t2, ul;

    	let each_value = ctx.developers;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			attr_dev(button, "class", "svelte-kv77nl");
    			add_location(button, file$7, 73, 2, 1170);
    			attr_dev(h4, "class", "svelte-kv77nl");
    			add_location(h4, file$7, 74, 2, 1190);
    			attr_dev(div, "class", "svelte-kv77nl");
    			add_location(div, file$7, 72, 0, 1162);
    			attr_dev(ul, "class", "svelte-kv77nl");
    			add_location(ul, file$7, 76, 0, 1217);
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
    	let { developers = [] } = $$props;

    onMount( async () => {
      $$invalidate('developers', developers = await fetch( '/api/developer' )
      .then( ( response ) => response.json() ));
    } );

    	const writable_props = ['developers'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DeveloperList> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    	};

    	$$self.$capture_state = () => {
    		return { developers };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    	};

    	return { developers };
    }

    class DeveloperList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, ["developers"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DeveloperList", options, id: create_fragment$7.name });
    	}

    	get developers() {
    		throw new Error("<DeveloperList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set developers(value) {
    		throw new Error("<DeveloperList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LabelList.svelte generated by Svelte v3.12.1 */

    const file$8 = "src/LabelList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.label = list[i];
    	return child_ctx;
    }

    // (56:0) {#each labels as label}
    function create_each_block$1(ctx) {
    	var li, p0, t0_value = ctx.label.name + "", t0, t1, p1, t2_value = ctx.label.count + "", t2, t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p0, "class", "svelte-x4b6bw");
    			add_location(p0, file$8, 57, 4, 906);
    			attr_dev(p1, "class", "svelte-x4b6bw");
    			add_location(p1, file$8, 58, 4, 930);
    			attr_dev(li, "class", "svelte-x4b6bw");
    			add_location(li, file$8, 56, 2, 897);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, p0);
    			append_dev(p0, t0);
    			append_dev(li, t1);
    			append_dev(li, p1);
    			append_dev(p1, t2);
    			append_dev(li, t3);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.labels) && t0_value !== (t0_value = ctx.label.name + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.labels) && t2_value !== (t2_value = ctx.label.count + "")) {
    				set_data_dev(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(56:0) {#each labels as label}", ctx });
    	return block;
    }

    function create_fragment$8(ctx) {
    	var ul;

    	let each_value = ctx.labels;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "svelte-x4b6bw");
    			add_location(ul, file$8, 53, 0, 865);
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
    			if (changed.labels) {
    				each_value = ctx.labels;

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
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { labels = [] } = $$props;

    onMount( async () => {
      $$invalidate('labels', labels = await fetch( '/api/label' )
      .then( ( response ) => response.json() ));
    } );

    	const writable_props = ['labels'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LabelList> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('labels' in $$props) $$invalidate('labels', labels = $$props.labels);
    	};

    	$$self.$capture_state = () => {
    		return { labels };
    	};

    	$$self.$inject_state = $$props => {
    		if ('labels' in $$props) $$invalidate('labels', labels = $$props.labels);
    	};

    	return { labels };
    }

    class LabelList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, ["labels"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LabelList", options, id: create_fragment$8.name });
    	}

    	get labels() {
    		throw new Error("<LabelList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labels(value) {
    		throw new Error("<LabelList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Button.svelte generated by Svelte v3.12.1 */

    const file$9 = "src/Button.svelte";

    function create_fragment$9(ctx) {
    	var button, t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "class", "svelte-q8rhp5");
    			add_location(button, file$9, 18, 0, 268);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { label } = $$props;

    	const writable_props = ['label'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    	};

    	$$self.$capture_state = () => {
    		return { label };
    	};

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    	};

    	return { label };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, ["label"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment$9.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<Button> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$a = "src/Select.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (36:0) {#each options as option}
    function create_each_block$2(ctx) {
    	var option, t_value = ctx.option[ctx.label] + "", t, option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.option[ctx.value];
    			option.value = option.__value;
    			add_location(option, file$a, 36, 2, 728);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(36:0) {#each options as option}", ctx });
    	return block;
    }

    function create_fragment$a(ctx) {
    	var select;

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
    			attr_dev(select, "class", "svelte-1fpyb7s");
    			add_location(select, file$a, 33, 0, 690);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
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
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(select);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { value = 'id', label = 'name', options = [] } = $$props;

    	const writable_props = ['value', 'label', 'options'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    	};

    	$$self.$capture_state = () => {
    		return { value, label, options };
    	};

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    	};

    	return { value, label, options };
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, ["value", "label", "options"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$a.name });
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
    }

    /* src/Notes.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$b = "src/Notes.svelte";

    function create_fragment$b(ctx) {
    	var div2, form, div0, p0, t1, t2, t3, div1, t4, p1, current, dispose;

    	var select = new Select({
    		props: {
    		options: ctx.activity,
    		value: "id",
    		label: "name"
    	},
    		$$inline: true
    	});

    	var textarea = new TextArea({
    		props: { placeholder: "What's happening?" },
    		$$inline: true
    	});

    	var button = new Button({ props: { label: "Save" }, $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Activity:";
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
    			add_location(p0, file$b, 69, 6, 1201);
    			attr_dev(div0, "class", "activity svelte-3vm7ki");
    			add_location(div0, file$b, 68, 4, 1172);
    			attr_dev(div1, "class", "controls svelte-3vm7ki");
    			add_location(div1, file$b, 73, 4, 1348);
    			attr_dev(form, "class", "svelte-3vm7ki");
    			add_location(form, file$b, 67, 2, 1140);
    			attr_dev(p1, "class", "svelte-3vm7ki");
    			add_location(p1, file$b, 77, 2, 1427);
    			attr_dev(div2, "class", "panel svelte-3vm7ki");
    			set_style(div2, "display", (ctx.visible ? 'flex': 'none'));
    			add_location(div2, file$b, 66, 0, 1074);
    			dispose = listen_dev(form, "submit", doSave);
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
    			select.$set(select_changes);

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

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function doSave( evt ) {
    evt.preventDefault();
    evt.stopImmediatePropagation();

    console.log( 'Save' );
    }

    function instance$a($$self, $$props, $$invalidate) {
    	

    let { developer = null, visible = false } = $$props;

    let activity = [];

    onMount( async () => {
      $$invalidate('activity', activity = await fetch( '/api/activity' )
      .then( ( response ) => response.json() ));
    } );

    	const writable_props = ['developer', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Notes> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { developer, visible, activity };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    	};

    	return { developer, visible, activity };
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, ["developer", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$b.name });
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

    const file$c = "src/Search.svelte";

    function create_fragment$c(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-kf58ke");
    			add_location(input, file$c, 23, 0, 446);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, ["placeholder"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$c.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tabs.svelte generated by Svelte v3.12.1 */

    const file$d = "src/Tabs.svelte";

    function create_fragment$d(ctx) {
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
    			add_location(button0, file$d, 40, 2, 721);
    			attr_dev(button1, "data-index", "1");
    			attr_dev(button1, "class", "svelte-ygnrif");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$d, 44, 2, 840);
    			attr_dev(button2, "data-index", "2");
    			attr_dev(button2, "class", "svelte-ygnrif");
    			toggle_class(button2, "selected", ctx.selectedIndex === 2);
    			add_location(button2, file$d, 48, 2, 959);
    			attr_dev(div, "class", "svelte-ygnrif");
    			add_location(div, file$d, 39, 0, 713);

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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tabs", options, id: create_fragment$d.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Timeline.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Timeline.svelte";

    function create_fragment$e(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Timeline";
    			add_location(p, file$e, 16, 2, 172);
    			attr_dev(div, "class", "svelte-v4jhh2");
    			toggle_class(div, "display", ctx.visible);
    			add_location(div, file$e, 15, 0, 138);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$d, create_fragment$e, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timeline", options, id: create_fragment$e.name });
    	}

    	get visible() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DevelopersPanel.svelte generated by Svelte v3.12.1 */

    const file$f = "src/DevelopersPanel.svelte";

    // (50:4) <Details summary="Labels">
    function create_default_slot(ctx) {
    	var current;

    	var labellist = new LabelList({ $$inline: true });

    	const block = {
    		c: function create() {
    			labellist.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(labellist, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(labellist.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(labellist.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(labellist, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(50:4) <Details summary=\"Labels\">", ctx });
    	return block;
    }

    function create_fragment$f(ctx) {
    	var div1, aside0, div0, t0, t1, t2, t3, article, t4, t5, t6, t7, t8, aside1, current;

    	var search = new Search({ $$inline: true });

    	var iconbutton = new IconButton({
    		props: { label: "Add", icon: "/img/add.svg" },
    		$$inline: true
    	});

    	var developerlist = new DeveloperList({ $$inline: true });

    	var details = new Details({
    		props: {
    		summary: "Labels",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

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
    		props: { visible: ctx.selectedPanel === 2 ? true : false },
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
    			iconbutton.$$.fragment.c();
    			t1 = space();
    			developerlist.$$.fragment.c();
    			t2 = space();
    			details.$$.fragment.c();
    			t3 = space();
    			article = element("article");
    			tabs.$$.fragment.c();
    			t4 = space();
    			developerform.$$.fragment.c();
    			t5 = space();
    			timeline.$$.fragment.c();
    			t6 = space();
    			notes.$$.fragment.c();
    			t7 = space();
    			controls.$$.fragment.c();
    			t8 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-1ykw51j");
    			add_location(div0, file$f, 44, 4, 852);
    			attr_dev(aside0, "class", "svelte-1ykw51j");
    			add_location(aside0, file$f, 43, 2, 840);
    			attr_dev(article, "class", "svelte-1ykw51j");
    			add_location(article, file$f, 53, 2, 1051);
    			attr_dev(aside1, "class", "svelte-1ykw51j");
    			add_location(aside1, file$f, 60, 2, 1389);
    			attr_dev(div1, "class", "panel svelte-1ykw51j");
    			add_location(div1, file$f, 42, 0, 818);
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
    			mount_component(iconbutton, div0, null);
    			append_dev(aside0, t1);
    			mount_component(developerlist, aside0, null);
    			append_dev(aside0, t2);
    			mount_component(details, aside0, null);
    			append_dev(div1, t3);
    			append_dev(div1, article);
    			mount_component(tabs, article, null);
    			append_dev(article, t4);
    			mount_component(developerform, article, null);
    			append_dev(article, t5);
    			mount_component(timeline, article, null);
    			append_dev(article, t6);
    			mount_component(notes, article, null);
    			append_dev(article, t7);
    			mount_component(controls, article, null);
    			append_dev(div1, t8);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var details_changes = {};
    			if (changed.$$scope) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);

    			var developerform_changes = {};
    			if (changed.selectedPanel) developerform_changes.visible = ctx.selectedPanel === 0 ? true : false;
    			developerform.$set(developerform_changes);

    			var timeline_changes = {};
    			if (changed.selectedPanel) timeline_changes.visible = ctx.selectedPanel === 1 ? true : false;
    			timeline.$set(timeline_changes);

    			var notes_changes = {};
    			if (changed.selectedPanel) notes_changes.visible = ctx.selectedPanel === 2 ? true : false;
    			notes.$set(notes_changes);

    			var controls_changes = {};
    			if (changed.selectedPanel) controls_changes.visible = ctx.selectedPanel < 2 ? true : false;
    			controls.$set(controls_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			transition_in(iconbutton.$$.fragment, local);

    			transition_in(developerlist.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			transition_in(tabs.$$.fragment, local);

    			transition_in(developerform.$$.fragment, local);

    			transition_in(timeline.$$.fragment, local);

    			transition_in(notes.$$.fragment, local);

    			transition_in(controls.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			transition_out(iconbutton.$$.fragment, local);
    			transition_out(developerlist.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
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

    			destroy_component(iconbutton);

    			destroy_component(developerlist);

    			destroy_component(details);

    			destroy_component(tabs);

    			destroy_component(developerform);

    			destroy_component(timeline);

    			destroy_component(notes);

    			destroy_component(controls);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	

    let selectedPanel = 0;

    	const tab_handler = (evt) => $$invalidate('selectedPanel', selectedPanel = evt.detail);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('selectedPanel' in $$props) $$invalidate('selectedPanel', selectedPanel = $$props.selectedPanel);
    	};

    	return { selectedPanel, tab_handler };
    }

    class DevelopersPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$f, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DevelopersPanel", options, id: create_fragment$f.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$g = "src/Header.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(span, file$g, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$g, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$g, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$g, 35, 0, 439);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$g, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$g.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$h = "src/Switcher.svelte";

    function create_fragment$h(ctx) {
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
    			add_location(button0, file$h, 32, 2, 504);
    			attr_dev(button1, "class", "svelte-1tj6usy");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$h, 35, 2, 619);
    			attr_dev(div, "class", "svelte-1tj6usy");
    			add_location(div, file$h, 31, 0, 496);

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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$h, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$h.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$i(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$i, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$i.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
