
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

    function create_fragment(ctx) {
    	var button, t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "class", "svelte-tj3iwd");
    			toggle_class(button, "icon", ctx.icon === null ? false : true);
    			add_location(button, file, 26, 0, 444);
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
    				toggle_class(button, "icon", ctx.icon === null ? false : true);
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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
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

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["label", "icon"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<Button> was created without expected prop 'label'");
    		}
    		if (ctx.icon === undefined && !('icon' in props)) {
    			console.warn("<Button> was created without expected prop 'icon'");
    		}
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Details.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Details.svelte";

    function create_fragment$1(ctx) {
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
    			attr_dev(button, "class", "svelte-634ga0");
    			toggle_class(button, "closed", !ctx.opened);
    			add_location(button, file$1, 54, 4, 895);
    			attr_dev(p, "class", "svelte-634ga0");
    			add_location(p, file$1, 58, 4, 1001);
    			attr_dev(div0, "class", "summary svelte-634ga0");
    			add_location(div0, file$1, 53, 2, 869);

    			attr_dev(div1, "class", "pane svelte-634ga0");
    			toggle_class(div1, "closed", !ctx.opened);
    			add_location(div1, file$1, 52, 0, 823);
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

    /* src/DeveloperList.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/DeveloperList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.developer = list[i];
    	return child_ctx;
    }

    // (67:0) {#each developers as developer}
    function create_each_block(ctx) {
    	var li, div, t0, p, t1_value = ctx.developer.name + "", t1, t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(div, "class", "photo svelte-ifhm3q");
    			set_style(div, "background-image", "url( " + ctx.developer.image + " )");
    			add_location(div, file$2, 68, 4, 1112);
    			attr_dev(p, "class", "svelte-ifhm3q");
    			add_location(p, file$2, 69, 4, 1194);
    			attr_dev(li, "class", "svelte-ifhm3q");
    			add_location(li, file$2, 67, 2, 1103);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(li, t0);
    			append_dev(li, p);
    			append_dev(p, t1);
    			append_dev(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.developers) {
    				set_style(div, "background-image", "url( " + ctx.developer.image + " )");
    			}

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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(67:0) {#each developers as developer}", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var h4, t_1, ul;

    	let each_value = ctx.developers;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Developers";
    			t_1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(h4, "class", "svelte-ifhm3q");
    			add_location(h4, file$2, 63, 0, 1043);
    			attr_dev(ul, "class", "svelte-ifhm3q");
    			add_location(ul, file$2, 64, 0, 1063);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t_1, anchor);
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
    				detach_dev(h4);
    				detach_dev(t_1);
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["developers"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DeveloperList", options, id: create_fragment$2.name });
    	}

    	get developers() {
    		throw new Error("<DeveloperList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set developers(value) {
    		throw new Error("<DeveloperList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LabelList.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/LabelList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.label = list[i];
    	return child_ctx;
    }

    // (52:0) {#each labels as label}
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
    			attr_dev(p0, "class", "svelte-1ifwa59");
    			add_location(p0, file$3, 53, 4, 867);
    			attr_dev(p1, "class", "svelte-1ifwa59");
    			add_location(p1, file$3, 54, 4, 891);
    			attr_dev(li, "class", "svelte-1ifwa59");
    			add_location(li, file$3, 52, 2, 858);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(52:0) {#each labels as label}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
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
    			attr_dev(ul, "class", "svelte-1ifwa59");
    			add_location(ul, file$3, 49, 0, 826);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["labels"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LabelList", options, id: create_fragment$3.name });
    	}

    	get labels() {
    		throw new Error("<LabelList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labels(value) {
    		throw new Error("<LabelList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Search.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/Search.svelte";

    function create_fragment$4(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-kf58ke");
    			add_location(input, file$4, 23, 0, 446);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["placeholder"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$4.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DevelopersPanel.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/DevelopersPanel.svelte";

    // (41:4) <Details summary="Labels">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(41:4) <Details summary=\"Labels\">", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var div1, aside0, div0, t0, t1, t2, t3, article, t4, aside1, current;

    	var search = new Search({ $$inline: true });

    	var button = new Button({
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
    			details.$$.fragment.c();
    			t3 = space();
    			article = element("article");
    			t4 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-wdp3n5");
    			add_location(div0, file$5, 35, 4, 571);
    			attr_dev(aside0, "class", "svelte-wdp3n5");
    			add_location(aside0, file$5, 34, 2, 559);
    			attr_dev(article, "class", "svelte-wdp3n5");
    			add_location(article, file$5, 44, 2, 766);
    			attr_dev(aside1, "class", "svelte-wdp3n5");
    			add_location(aside1, file$5, 45, 2, 788);
    			attr_dev(div1, "class", "panel svelte-wdp3n5");
    			add_location(div1, file$5, 33, 0, 537);
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
    			append_dev(aside0, t2);
    			mount_component(details, aside0, null);
    			append_dev(div1, t3);
    			append_dev(div1, article);
    			append_dev(div1, t4);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var details_changes = {};
    			if (changed.$$scope) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(developerlist.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(developerlist.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(search);

    			destroy_component(button);

    			destroy_component(developerlist);

    			destroy_component(details);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    class DevelopersPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DevelopersPanel", options, id: create_fragment$5.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/Header.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(span, file$6, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$6, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$6, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$6, 35, 0, 439);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$6.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$7 = "src/Switcher.svelte";

    function create_fragment$7(ctx) {
    	var div, button0, t1, button1, t3, button2, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Developers";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Repositories";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Tracking";
    			attr_dev(button0, "class", "svelte-18k7bg1");
    			toggle_class(button0, "selected", ctx.selectedIndex === 0);
    			add_location(button0, file$7, 32, 2, 504);
    			attr_dev(button1, "class", "svelte-18k7bg1");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$7, 35, 2, 619);
    			attr_dev(button2, "class", "svelte-18k7bg1");
    			toggle_class(button2, "selected", ctx.selectedIndex === 2);
    			add_location(button2, file$7, 38, 2, 736);
    			attr_dev(div, "class", "svelte-18k7bg1");
    			add_location(div, file$7, 31, 0, 496);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1),
    				listen_dev(button2, "click", ctx.click_handler_2)
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { selectedIndex = 0 } = $$props;

    	const writable_props = ['selectedIndex'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate('selectedIndex', selectedIndex = 0);

    	const click_handler_1 = () => $$invalidate('selectedIndex', selectedIndex = 1);

    	const click_handler_2 = () => $$invalidate('selectedIndex', selectedIndex = 2);

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
    		click_handler_1,
    		click_handler_2
    	};
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$7.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$8(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$8.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
