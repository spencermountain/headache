
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    /* spencermountain/spacetime 6.6.0 Apache 2.0 */
    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var fns = createCommonjsModule(function (module, exports) {
      //git:blame @JuliasCaesar https://www.timeanddate.com/date/leapyear.html
      exports.isLeapYear = function (year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
      }; // unsurprisingly-nasty `typeof date` call


      exports.isDate = function (d) {
        return Object.prototype.toString.call(d) === '[object Date]' && !isNaN(d.valueOf());
      };

      exports.isArray = function (input) {
        return Object.prototype.toString.call(input) === '[object Array]';
      };

      exports.isObject = function (input) {
        return Object.prototype.toString.call(input) === '[object Object]';
      };

      exports.zeroPad = function (str) {
        var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var pad = '0';
        str = str + '';
        return str.length >= len ? str : new Array(len - str.length + 1).join(pad) + str;
      };

      exports.titleCase = function (str) {
        if (!str) {
          return '';
        }

        return str[0].toUpperCase() + str.substr(1);
      };

      exports.ordinal = function (i) {
        var j = i % 10;
        var k = i % 100;

        if (j === 1 && k !== 11) {
          return i + 'st';
        }

        if (j === 2 && k !== 12) {
          return i + 'nd';
        }

        if (j === 3 && k !== 13) {
          return i + 'rd';
        }

        return i + 'th';
      }; //strip 'st' off '1st'..


      exports.toCardinal = function (str) {
        str = String(str);
        str = str.replace(/([0-9])(st|nd|rd|th)$/i, '$1');
        return parseInt(str, 10);
      }; //used mostly for cleanup of unit names, like 'months'


      exports.normalize = function () {
        var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        str = str.toLowerCase().trim();
        str = str.replace(/ies$/, 'y'); //'centuries'

        str = str.replace(/s$/, '');
        str = str.replace(/-/g, '');

        if (str === 'day') {
          return 'date';
        }

        return str;
      };

      exports.getEpoch = function (tmp) {
        //support epoch
        if (typeof tmp === 'number') {
          return tmp;
        } //suport date objects


        if (exports.isDate(tmp)) {
          return tmp.getTime();
        }

        if (tmp.epoch) {
          return tmp.epoch;
        }

        return null;
      }; //make sure this input is a spacetime obj


      exports.beADate = function (d, s) {
        if (exports.isObject(d) === false) {
          return s.clone().set(d);
        }

        return d;
      };

      exports.formatTimezone = function (offset) {
        var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        var absOffset = Math.abs(offset);
        var sign = offset > 0 ? '+' : '-';
        return "".concat(sign).concat(exports.zeroPad(absOffset)).concat(delimiter, "00");
      };
    });
    var fns_1 = fns.isLeapYear;
    var fns_2 = fns.isDate;
    var fns_3 = fns.isArray;
    var fns_4 = fns.isObject;
    var fns_5 = fns.zeroPad;
    var fns_6 = fns.titleCase;
    var fns_7 = fns.ordinal;
    var fns_8 = fns.toCardinal;
    var fns_9 = fns.normalize;
    var fns_10 = fns.getEpoch;
    var fns_11 = fns.beADate;
    var fns_12 = fns.formatTimezone;

    var zeroPad = fns.zeroPad;

    var serialize = function serialize(d) {
      return zeroPad(d.getMonth() + 1) + '/' + zeroPad(d.getDate()) + ':' + zeroPad(d.getHours());
    }; // a timezone will begin with a specific offset in january
    // then some will switch to something else between november-march


    var shouldChange = function shouldChange(epoch, start, end, defaultOffset) {
      //note: this has a cray order-of-operations issue
      //we can't get the date, without knowing the timezone, and vice-versa
      //it's possible that we can miss a dst-change by a few hours.
      var d = new Date(epoch); //(try to mediate this a little?)

      var bias = d.getTimezoneOffset() || 0;
      var shift = bias + defaultOffset * 60; //in minutes

      shift = shift * 60 * 1000; //in ms

      d = new Date(epoch + shift);
      var current = serialize(d); //eg. is it after ~november?

      if (current >= start) {
        //eg. is it before ~march~ too?
        if (current < end) {
          return true;
        }
      }

      return false;
    };

    var summerTime = shouldChange;

    // it reproduces some things in ./index.js, but speeds up spacetime considerably

    var quickOffset = function quickOffset(s) {
      var zones = s.timezones;
      var obj = zones[s.tz];

      if (obj === undefined) {
        console.warn("Warning: couldn't find timezone " + s.tz);
        return 0;
      }

      if (obj.dst === undefined) {
        return obj.offset;
      } //get our two possible offsets


      var jul = obj.offset;
      var dec = obj.offset + 1; // assume it's the same for now

      if (obj.hem === 'n') {
        dec = jul - 1;
      }

      var split = obj.dst.split('->');
      var inSummer = summerTime(s.epoch, split[0], split[1], jul);

      if (inSummer === true) {
        return jul;
      }

      return dec;
    };

    var quick = quickOffset;

    var _build = {
    	"9|s": "2/dili,2/jayapura",
    	"9|n": "2/chita,2/khandyga,2/pyongyang,2/seoul,2/tokyo,11/palau",
    	"9.5|s|04/05:03->10/04:02": "4/adelaide,4/broken_hill,4/south,4/yancowinna",
    	"9.5|s": "4/darwin,4/north",
    	"8|s": "12/casey,2/kuala_lumpur,2/makassar,2/singapore,4/perth,4/west",
    	"8|n|03/25:03->09/29:23": "2/ulan_bator",
    	"8|n": "2/brunei,2/choibalsan,2/chongqing,2/chungking,2/harbin,2/hong_kong,2/irkutsk,2/kuching,2/macao,2/macau,2/manila,2/shanghai,2/taipei,2/ujung_pandang,2/ulaanbaatar",
    	"8.75|s": "4/eucla",
    	"7|s": "12/davis,2/jakarta,9/christmas",
    	"7|n": "2/bangkok,2/barnaul,2/ho_chi_minh,2/hovd,2/krasnoyarsk,2/novokuznetsk,2/novosibirsk,2/phnom_penh,2/pontianak,2/saigon,2/tomsk,2/vientiane",
    	"6|s": "12/vostok",
    	"6|n": "2/almaty,2/bishkek,2/dacca,2/dhaka,2/kashgar,2/omsk,2/qyzylorda,2/thimbu,2/thimphu,2/urumqi,9/chagos",
    	"6.5|n": "2/rangoon,2/yangon,9/cocos",
    	"5|s": "12/mawson,9/kerguelen",
    	"5|n": "2/aqtau,2/aqtobe,2/ashgabat,2/ashkhabad,2/atyrau,2/baku,2/dushanbe,2/karachi,2/oral,2/samarkand,2/tashkent,2/yekaterinburg,9/maldives",
    	"5.75|n": "2/kathmandu,2/katmandu",
    	"5.5|n": "2/calcutta,2/colombo,2/kolkata",
    	"4|s": "9/reunion",
    	"4|n": "2/dubai,2/muscat,2/tbilisi,2/yerevan,8/astrakhan,8/samara,8/saratov,8/ulyanovsk,8/volgograd,2/volgograd,9/mahe,9/mauritius",
    	"4.5|n|03/21:00->09/20:24": "2/tehran",
    	"4.5|n": "2/kabul",
    	"3|s": "12/syowa,9/antananarivo",
    	"3|n|03/29:03->10/25:04": "2/famagusta,2/nicosia,8/athens,8/bucharest,8/helsinki,8/kiev,8/mariehamn,8/nicosia,8/riga,8/sofia,8/tallinn,8/uzhgorod,8/vilnius,8/zaporozhye",
    	"3|n|03/29:02->10/25:03": "8/chisinau,8/tiraspol",
    	"3|n|03/29:00->10/24:24": "2/beirut",
    	"3|n|03/27:02->10/25:02": "2/jerusalem,2/tel_aviv",
    	"3|n|03/27:00->10/31:01": "2/gaza,2/hebron",
    	"3|n|03/27:00->10/30:01": "2/amman",
    	"3|n|03/27:00->10/29:24": "2/damascus",
    	"3|n": "0/addis_ababa,0/asmara,0/asmera,0/dar_es_salaam,0/djibouti,0/juba,0/kampala,0/mogadishu,0/nairobi,2/aden,2/baghdad,2/bahrain,2/istanbul,2/kuwait,2/qatar,2/riyadh,8/istanbul,8/kirov,8/minsk,8/moscow,8/simferopol,9/comoro,9/mayotte",
    	"2|s|03/29:02->10/25:02": "12/troll",
    	"2|s": "0/gaborone,0/harare,0/johannesburg,0/lubumbashi,0/lusaka,0/maputo,0/maseru,0/mbabane",
    	"2|n|03/29:02->10/25:03": "0/ceuta,arctic/longyearbyen,3/jan_mayen,8/amsterdam,8/andorra,8/belgrade,8/berlin,8/bratislava,8/brussels,8/budapest,8/busingen,8/copenhagen,8/gibraltar,8/ljubljana,8/luxembourg,8/madrid,8/malta,8/monaco,8/oslo,8/paris,8/podgorica,8/prague,8/rome,8/san_marino,8/sarajevo,8/skopje,8/stockholm,8/tirane,8/vaduz,8/vatican,8/vienna,8/warsaw,8/zagreb,8/zurich",
    	"2|n": "0/blantyre,0/bujumbura,0/cairo,0/khartoum,0/kigali,0/tripoli,8/kaliningrad",
    	"1|s|04/02:01->09/03:03": "0/windhoek",
    	"1|s": "0/kinshasa,0/luanda",
    	"1|n|04/19:03->05/31:02": "0/casablanca,0/el_aaiun",
    	"1|n|03/29:01->10/25:02": "3/canary,3/faeroe,3/faroe,3/madeira,8/belfast,8/dublin,8/guernsey,8/isle_of_man,8/jersey,8/lisbon,8/london",
    	"1|n": "0/algiers,0/bangui,0/brazzaville,0/douala,0/lagos,0/libreville,0/malabo,0/ndjamena,0/niamey,0/porto-novo,0/tunis",
    	"14|n": "11/kiritimati",
    	"13|s|04/05:04->09/27:03": "11/apia",
    	"13|s|01/15:02->11/05:03": "11/tongatapu",
    	"13|n": "11/enderbury,11/fakaofo",
    	"12|s|04/05:03->09/27:02": "12/mcmurdo,12/south_pole,11/auckland",
    	"12|s|01/12:03->11/08:02": "11/fiji",
    	"12|n": "2/anadyr,2/kamchatka,2/srednekolymsk,11/funafuti,11/kwajalein,11/majuro,11/nauru,11/tarawa,11/wake,11/wallis",
    	"12.75|s|04/05:03->04/05:02": "11/chatham",
    	"11|s": "12/macquarie,11/bougainville",
    	"11|n": "2/magadan,2/sakhalin,11/efate,11/guadalcanal,11/kosrae,11/noumea,11/pohnpei,11/ponape",
    	"11.5|n|04/05:03->10/04:02": "11/norfolk",
    	"10|s|04/05:03->10/04:02": "4/act,4/canberra,4/currie,4/hobart,4/melbourne,4/nsw,4/sydney,4/tasmania,4/victoria",
    	"10|s": "12/dumontdurville,4/brisbane,4/lindeman,4/queensland",
    	"10|n": "2/ust-nera,2/vladivostok,2/yakutsk,11/chuuk,11/guam,11/port_moresby,11/saipan,11/truk,11/yap",
    	"10.5|s|04/05:01->10/04:02": "4/lhi,4/lord_howe",
    	"0|n|03/29:00->10/25:01": "1/scoresbysund,3/azores",
    	"0|n": "0/abidjan,0/accra,0/bamako,0/banjul,0/bissau,0/conakry,0/dakar,0/freetown,0/lome,0/monrovia,0/nouakchott,0/ouagadougou,0/sao_tome,0/timbuktu,1/danmarkshavn,3/reykjavik,3/st_helena,13/gmt,13/gmt+0,13/gmt-0,13/gmt0,13/greenwich,13/utc,13/universal,13/zulu",
    	"-9|n|03/08:02->11/01:02": "1/adak,1/atka",
    	"-9|n": "11/gambier",
    	"-9.5|n": "11/marquesas",
    	"-8|n|03/08:02->11/01:02": "1/anchorage,1/juneau,1/metlakatla,1/nome,1/sitka,1/yakutat",
    	"-8|n": "11/pitcairn",
    	"-7|n|03/08:02->11/01:02": "1/dawson,1/ensenada,1/los_angeles,1/santa_isabel,1/tijuana,1/vancouver,1/whitehorse,6/pacific,6/yukon,10/bajanorte",
    	"-7|n": "1/creston,1/dawson_creek,1/hermosillo,1/phoenix",
    	"-6|s|04/04:22->09/05:22": "7/easterisland,11/easter",
    	"-6|n|04/05:02->10/25:02": "1/chihuahua,1/mazatlan,10/bajasur",
    	"-6|n|03/08:02->11/01:02": "1/boise,1/cambridge_bay,1/denver,1/edmonton,1/inuvik,1/ojinaga,1/shiprock,1/yellowknife,6/mountain",
    	"-6|n": "1/belize,1/costa_rica,1/el_salvador,1/guatemala,1/managua,1/regina,1/swift_current,1/tegucigalpa,6/east-saskatchewan,6/saskatchewan,11/galapagos",
    	"-5|s": "1/lima,1/rio_branco,5/acre",
    	"-5|n|04/05:02->10/25:02": "1/bahia_banderas,1/merida,1/mexico_city,1/monterrey,10/general",
    	"-5|n|03/12:03->11/05:01": "1/north_dakota",
    	"-5|n|03/08:02->11/01:02": "1/chicago,1/knox_in,1/matamoros,1/menominee,1/rainy_river,1/rankin_inlet,1/resolute,1/winnipeg,6/central",
    	"-5|n": "1/atikokan,1/bogota,1/cancun,1/cayman,1/coral_harbour,1/eirunepe,1/guayaquil,1/jamaica,1/panama,1/porto_acre",
    	"-4|s|05/13:23->08/13:01": "12/palmer",
    	"-4|s|04/04:24->09/06:00": "1/santiago,7/continental",
    	"-4|s|03/21:24->10/04:00": "1/asuncion",
    	"-4|s|02/16:24->11/03:00": "1/campo_grande,1/cuiaba",
    	"-4|s": "1/la_paz,1/manaus,5/west",
    	"-4|n|03/12:03->11/05:01": "1/indiana,1/kentucky",
    	"-4|n|03/08:02->11/01:02": "1/detroit,1/fort_wayne,1/grand_turk,1/indianapolis,1/iqaluit,1/louisville,1/montreal,1/nassau,1/new_york,1/nipigon,1/pangnirtung,1/port-au-prince,1/thunder_bay,1/toronto,6/eastern",
    	"-4|n|03/08:00->11/01:01": "1/havana",
    	"-4|n": "1/anguilla,1/antigua,1/aruba,1/barbados,1/blanc-sablon,1/boa_vista,1/caracas,1/curacao,1/dominica,1/grenada,1/guadeloupe,1/guyana,1/kralendijk,1/lower_princes,1/marigot,1/martinique,1/montserrat,1/port_of_spain,1/porto_velho,1/puerto_rico,1/santo_domingo,1/st_barthelemy,1/st_kitts,1/st_lucia,1/st_thomas,1/st_vincent,1/tortola,1/virgin",
    	"-3|s": "1/argentina,1/buenos_aires,1/cordoba,1/fortaleza,1/montevideo,1/punta_arenas,1/sao_paulo,12/rothera,3/stanley,5/east",
    	"-3|n|03/08:02->11/01:02": "1/glace_bay,1/goose_bay,1/halifax,1/moncton,1/thule,3/bermuda,6/atlantic",
    	"-3|n": "1/araguaina,1/bahia,1/belem,1/catamarca,1/cayenne,1/jujuy,1/maceio,1/mendoza,1/paramaribo,1/recife,1/rosario,1/santarem",
    	"-2|s": "5/denoronha",
    	"-2|n|03/28:22->10/24:23": "1/godthab",
    	"-2|n|03/08:02->11/01:02": "1/miquelon",
    	"-2|n": "1/noronha,3/south_georgia",
    	"-2.5|n|03/08:02->11/01:02": "1/st_johns,6/newfoundland",
    	"-1|n": "3/cape_verde",
    	"-11|n": "11/midway,11/niue,11/pago_pago,11/samoa",
    	"-10|n": "11/honolulu,11/johnston,11/rarotonga,11/tahiti"
    };

    var _build$1 = /*#__PURE__*/Object.freeze({
    	__proto__: null,
    	'default': _build
    });

    //prefixes for iana names..
    var _prefixes = ['africa', 'america', 'asia', 'atlantic', 'australia', 'brazil', 'canada', 'chile', 'europe', 'indian', 'mexico', 'pacific', 'antarctica', 'etc'];

    var data = getCjsExportFromNamespace(_build$1);

    var all = {};
    Object.keys(data).forEach(function (k) {
      var split = k.split('|');
      var obj = {
        offset: Number(split[0]),
        hem: split[1]
      };

      if (split[2]) {
        obj.dst = split[2];
      }

      var names = data[k].split(',');
      names.forEach(function (str) {
        str = str.replace(/(^[0-9]+)\//, function (before, num) {
          num = Number(num);
          return _prefixes[num] + '/';
        });
        all[str] = obj;
      });
    });
    all['utc'] = {
      offset: 0,
      hem: 'n' //(sorry)

    }; //add etc/gmt+n

    for (var i = -14; i <= 14; i += 0.5) {
      var num = i;

      if (num > 0) {
        num = '+' + num;
      }

      var name = 'etc/gmt' + num;
      all[name] = {
        offset: i * -1,
        //they're negative!
        hem: 'n' //(sorry)

      };
      name = 'utc/gmt' + num; //this one too, why not.

      all[name] = {
        offset: i * -1,
        hem: 'n'
      };
    } // console.log(all)
    // console.log(Object.keys(all).length)


    var unpack = all;

    //find the implicit iana code for this machine.
    //safely query the Intl object
    //based on - https://bitbucket.org/pellepim/jstimezonedetect/src
    var fallbackTZ = 'utc'; //
    //this Intl object is not supported often, yet

    var safeIntl = function safeIntl() {
      if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
        return null;
      }

      var format = Intl.DateTimeFormat();

      if (typeof format === 'undefined' || typeof format.resolvedOptions === 'undefined') {
        return null;
      }

      var timezone = format.resolvedOptions().timeZone;

      if (!timezone) {
        return null;
      }

      return timezone.toLowerCase();
    };

    var guessTz = function guessTz() {
      var timezone = safeIntl();

      if (timezone === null) {
        return fallbackTZ;
      }

      return timezone;
    }; //do it once per computer


    var guessTz_1 = guessTz;

    var isOffset = /(\-?[0-9]+)h(rs)?/i;
    var isNumber = /(\-?[0-9]+)/;
    var utcOffset = /utc([\-+]?[0-9]+)/i;
    var gmtOffset = /gmt([\-+]?[0-9]+)/i;

    var toIana = function toIana(num) {
      num = Number(num);

      if (num > -13 && num < 13) {
        num = num * -1; //it's opposite!

        num = (num > 0 ? '+' : '') + num; //add plus sign

        return 'etc/gmt' + num;
      }

      return null;
    };

    var parseOffset = function parseOffset(tz) {
      // '+5hrs'
      var m = tz.match(isOffset);

      if (m !== null) {
        return toIana(m[1]);
      } // 'utc+5'


      m = tz.match(utcOffset);

      if (m !== null) {
        return toIana(m[1]);
      } // 'GMT-5' (not opposite)


      m = tz.match(gmtOffset);

      if (m !== null) {
        var num = Number(m[1]) * -1;
        return toIana(num);
      } // '+5'


      m = tz.match(isNumber);

      if (m !== null) {
        return toIana(m[1]);
      }

      return null;
    };

    var parseOffset_1 = parseOffset;

    var local = guessTz_1(); //add all the city names by themselves

    var cities = Object.keys(unpack).reduce(function (h, k) {
      var city = k.split('/')[1] || '';
      city = city.replace(/_/g, ' ');
      h[city] = k;
      return h;
    }, {}); //try to match these against iana form

    var normalize = function normalize(tz) {
      tz = tz.replace(/ time/g, '');
      tz = tz.replace(/ (standard|daylight|summer)/g, '');
      tz = tz.replace(/\b(east|west|north|south)ern/g, '$1');
      tz = tz.replace(/\b(africa|america|australia)n/g, '$1');
      tz = tz.replace(/\beuropean/g, 'europe');
      tz = tz.replace(/\islands/g, 'island');
      return tz;
    }; // try our best to reconcile the timzone to this given string


    var lookupTz = function lookupTz(str, zones) {
      if (!str) {
        return local;
      }

      var tz = str.trim();
      var split = str.split('/'); //support long timezones like 'America/Argentina/Rio_Gallegos'

      if (split.length > 2 && zones.hasOwnProperty(tz) === false) {
        tz = split[0] + '/' + split[1];
      }

      tz = tz.toLowerCase();

      if (zones.hasOwnProperty(tz) === true) {
        return tz;
      } //lookup more loosely..


      tz = normalize(tz);

      if (zones.hasOwnProperty(tz) === true) {
        return tz;
      } //try city-names


      if (cities.hasOwnProperty(tz) === true) {
        return cities[tz];
      } // //try to parse '-5h'


      if (/[0-9]/.test(tz) === true) {
        var id = parseOffset_1(tz);

        if (id) {
          return id;
        }
      }

      throw new Error("Spacetime: Cannot find timezone named: '" + str + "'. Please enter an IANA timezone id.");
    };

    var find = lookupTz;

    var o = {
      millisecond: 1
    };
    o.second = 1000;
    o.minute = 60000;
    o.hour = 3.6e6; // dst is supported post-hoc

    o.day = 8.64e7; //

    o.date = o.day;
    o.month = 8.64e7 * 29.5; //(average)

    o.week = 6.048e8;
    o.year = 3.154e10; // leap-years are supported post-hoc
    //add plurals

    Object.keys(o).forEach(function (k) {
      o[k + 's'] = o[k];
    });
    var milliseconds = o;

    var walk = function walk(s, n, fn, unit, previous) {
      var current = s.d[fn]();

      if (current === n) {
        return; //already there
      }

      var startUnit = previous === null ? null : s.d[previous]();
      var original = s.epoch; //try to get it as close as we can

      var diff = n - current;
      s.epoch += milliseconds[unit] * diff; //DST edge-case: if we are going many days, be a little conservative

      if (unit === 'day' && Math.abs(diff) > 28) {
        //but don't push it over a month
        if (n < 28) {
          s.epoch += milliseconds.hour;
        }
      } //repair it if we've gone too far or something
      //(go by half-steps, just in case)


      var halfStep = milliseconds[unit] / 2;

      while (s.d[fn]() < n) {
        s.epoch += halfStep;
      }

      while (s.d[fn]() > n) {
        s.epoch -= halfStep;
      } //oops, did we change previous unit? revert it.


      if (previous !== null && startUnit !== s.d[previous]()) {
        // console.warn('spacetime warning: missed setting ' + unit)
        s.epoch = original; // i mean, but make it close...

        s.epoch += milliseconds[unit] * diff * 0.89; // i guess?
      }
    }; //find the desired date by a increment/check while loop


    var units = {
      year: {
        valid: function valid(n) {
          return n > -4000 && n < 4000;
        },
        walkTo: function walkTo(s, n) {
          return walk(s, n, 'getFullYear', 'year', null);
        }
      },
      month: {
        valid: function valid(n) {
          return n >= 0 && n <= 11;
        },
        walkTo: function walkTo(s, n) {
          var d = s.d;
          var current = d.getMonth();
          var original = s.epoch;
          var startUnit = d.getFullYear();

          if (current === n) {
            return;
          } //try to get it as close as we can..


          var diff = n - current;
          s.epoch += milliseconds.day * (diff * 28); //special case
          //oops, did we change the year? revert it.

          if (startUnit !== s.d.getFullYear()) {
            s.epoch = original;
          } //incriment by day


          while (s.d.getMonth() < n) {
            s.epoch += milliseconds.day;
          }

          while (s.d.getMonth() > n) {
            s.epoch -= milliseconds.day;
          }
        }
      },
      date: {
        valid: function valid(n) {
          return n > 0 && n <= 31;
        },
        walkTo: function walkTo(s, n) {
          return walk(s, n, 'getDate', 'day', 'getMonth');
        }
      },
      hour: {
        valid: function valid(n) {
          return n >= 0 && n < 24;
        },
        walkTo: function walkTo(s, n) {
          return walk(s, n, 'getHours', 'hour', 'getDate');
        }
      },
      minute: {
        valid: function valid(n) {
          return n >= 0 && n < 60;
        },
        walkTo: function walkTo(s, n) {
          return walk(s, n, 'getMinutes', 'minute', 'getHours');
        }
      },
      second: {
        valid: function valid(n) {
          return n >= 0 && n < 60;
        },
        walkTo: function walkTo(s, n) {
          //do this one directly
          s.epoch = s.seconds(n).epoch;
        }
      },
      millisecond: {
        valid: function valid(n) {
          return n >= 0 && n < 1000;
        },
        walkTo: function walkTo(s, n) {
          //do this one directly
          s.epoch = s.milliseconds(n).epoch;
        }
      }
    };

    var walkTo = function walkTo(s, wants) {
      var keys = Object.keys(units);
      var old = s.clone();

      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var n = wants[k];

        if (n === undefined) {
          n = old[k]();
        }

        if (typeof n === 'string') {
          n = parseInt(n, 10);
        } //make-sure it's valid


        if (!units[k].valid(n)) {
          s.epoch = null;

          if (s.silent === false) {
            console.warn('invalid ' + k + ': ' + n);
          }

          return;
        } // console.log(k, n)


        units[k].walkTo(s, n);
      }

      return;
    };

    var walk_1 = walkTo;

    var shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec'];
    var longMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    function buildMapping() {
      var obj = {
        sep: 8 //support this format

      };

      for (var i = 0; i < shortMonths.length; i++) {
        obj[shortMonths[i]] = i;
      }

      for (var _i = 0; _i < longMonths.length; _i++) {
        obj[longMonths[_i]] = _i;
      }

      return obj;
    }

    var months = {
      "short": function short() {
        return shortMonths;
      },
      "long": function long() {
        return longMonths;
      },
      mapping: function mapping() {
        return buildMapping();
      },
      set: function set(i18n) {
        shortMonths = i18n["short"] || shortMonths;
        longMonths = i18n["long"] || longMonths;
      }
    };

    //pull-apart ISO offsets, like "+0100"
    var parseOffset$1 = function parseOffset(s, offset) {
      if (!offset) {
        return s;
      } //this is a fancy-move


      if (offset === 'Z') {
        offset = '+0000';
      } // according to ISO8601, tz could be hh:mm, hhmm or hh
      // so need few more steps before the calculation.


      var num = 0; // for (+-)hh:mm

      if (/^[\+-]?[0-9]{2}:[0-9]{2}$/.test(offset)) {
        //support "+01:00"
        if (/:00/.test(offset) === true) {
          offset = offset.replace(/:00/, '');
        } //support "+01:30"


        if (/:30/.test(offset) === true) {
          offset = offset.replace(/:30/, '.5');
        }
      } // for (+-)hhmm


      if (/^[\+-]?[0-9]{4}$/.test(offset)) {
        offset = offset.replace(/30$/, '.5');
      }

      num = parseFloat(offset); //divide by 100 or 10 - , "+0100", "+01"

      if (Math.abs(num) > 100) {
        num = num / 100;
      } //okay, try to match it to a utc timezone
      //remember - this is opposite! a -5 offset maps to Etc/GMT+5  ¯\_(:/)_/¯
      //https://askubuntu.com/questions/519550/why-is-the-8-timezone-called-gmt-8-in-the-filesystem


      num *= -1;

      if (num >= 0) {
        num = '+' + num;
      }

      var tz = 'etc/gmt' + num;
      var zones = s.timezones;

      if (zones[tz]) {
        // log a warning if we're over-writing a given timezone?
        // console.log('changing timezone to: ' + tz)
        s.tz = tz;
      }

      return s;
    };

    var parseOffset_1$1 = parseOffset$1;

    var parseTime = function parseTime(s) {
      var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      str = str.replace(/^\s+/, '').toLowerCase(); //trim
      //formal time formats - 04:30.23

      var arr = str.match(/([0-9]{1,2}):([0-9]{1,2}):?([0-9]{1,2})?[:\.]?([0-9]{1,4})?/);

      if (arr !== null) {
        //validate it a little
        var h = Number(arr[1]);

        if (h < 0 || h > 24) {
          return s.startOf('day');
        }

        var m = Number(arr[2]); //don't accept '5:3pm'

        if (arr[2].length < 2 || m < 0 || m > 59) {
          return s.startOf('day');
        }

        s = s.hour(h);
        s = s.minute(m);
        s = s.seconds(arr[3] || 0);
        s = s.millisecond(arr[4] || 0); //parse-out am/pm

        var ampm = str.match(/[\b0-9](am|pm)\b/);

        if (ampm !== null && ampm[1]) {
          s = s.ampm(ampm[1]);
        }

        return s;
      } //try an informal form - 5pm (no minutes)


      arr = str.match(/([0-9]+) ?(am|pm)/);

      if (arr !== null && arr[1]) {
        var _h = Number(arr[1]); //validate it a little..


        if (_h > 12 || _h < 1) {
          return s.startOf('day');
        }

        s = s.hour(arr[1] || 0);
        s = s.ampm(arr[2]);
        s = s.startOf('hour');
        return s;
      } //no time info found, use start-of-day


      s = s.startOf('day');
      return s;
    };

    var parseTime_1 = parseTime;

    var monthLengths = [31, // January - 31 days
    28, // February - 28 days in a common year and 29 days in leap years
    31, // March - 31 days
    30, // April - 30 days
    31, // May - 31 days
    30, // June - 30 days
    31, // July - 31 days
    31, // August - 31 days
    30, // September - 30 days
    31, // October - 31 days
    30, // November - 30 days
    31 // December - 31 days
    ];
    var monthLengths_1 = monthLengths; // 28 - feb

    var isLeapYear = fns.isLeapYear; //given a month, return whether day number exists in it

    var hasDate = function hasDate(obj) {
      //invalid values
      if (monthLengths_1.hasOwnProperty(obj.month) !== true) {
        return false;
      } //support leap-year in february


      if (obj.month === 1) {
        if (isLeapYear(obj.year) && obj.date <= 29) {
          return true;
        } else {
          return obj.date <= 28;
        }
      } //is this date too-big for this month?


      var max = monthLengths_1[obj.month] || 0;

      if (obj.date <= max) {
        return true;
      }

      return false;
    };

    var hasDate_1 = hasDate;

    var months$1 = months.mapping();

    var parseYear = function parseYear() {
      var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var today = arguments.length > 1 ? arguments[1] : undefined;
      var year = parseInt(str.trim(), 10); // use a given year from options.today

      if (!year && today) {
        year = today.year;
      } // fallback to this year


      year = year || new Date().getFullYear();
      return year;
    };

    var strFmt = [//iso-this 1998-05-30T22:00:00:000Z, iso-that 2017-04-03T08:00:00-0700
    {
      reg: /^(\-?0?0?[0-9]{3,4})-([0-9]{1,2})-([0-9]{1,2})[T| ]([0-9.:]+)(Z|[0-9\-\+:]+)?$/,
      parse: function parse(s, arr, givenTz, options) {
        var month = parseInt(arr[2], 10) - 1;
        var obj = {
          year: arr[1],
          month: month,
          date: arr[3]
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        parseOffset_1$1(s, arr[5]);
        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //iso "2015-03-25" or "2015/03/25" or "2015/03/25 12:26:14 PM"
    {
      reg: /^([0-9]{4})[\-\/]([0-9]{1,2})[\-\/]([0-9]{1,2}),?( [0-9]{1,2}:[0-9]{2}:?[0-9]{0,2}? ?(am|pm|gmt))?$/i,
      parse: function parse(s, arr) {
        var obj = {
          year: arr[1],
          month: parseInt(arr[2], 10) - 1,
          date: parseInt(arr[3], 10)
        };

        if (obj.month >= 12) {
          //support yyyy/dd/mm (weird, but ok)
          obj.date = parseInt(arr[2], 10);
          obj.month = parseInt(arr[3], 10) - 1;
        }

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //mm/dd/yyyy - uk/canada "6/28/2019, 12:26:14 PM"
    {
      reg: /^([0-9]{1,2})[\-\/]([0-9]{1,2})[\-\/]?([0-9]{4})?,?( [0-9]{1,2}:[0-9]{2}:?[0-9]{0,2}? ?(am|pm|gmt))?$/i,
      parse: function parse(s, arr) {
        var month = parseInt(arr[1], 10) - 1;
        var date = parseInt(arr[2], 10); //support dd/mm/yyy

        if (s.british || month >= 12) {
          date = parseInt(arr[1], 10);
          month = parseInt(arr[2], 10) - 1;
        }

        var year = arr[3] || new Date().getFullYear();
        var obj = {
          year: year,
          month: month,
          date: date
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //common british format - "25-feb-2015"
    {
      reg: /^([0-9]{1,2})[\-\/]([a-z]+)[\-\/]?([0-9]{4})?$/i,
      parse: function parse(s, arr) {
        var month = months$1[arr[2].toLowerCase()];
        var year = parseYear(arr[3], s._today);
        var obj = {
          year: year,
          month: month,
          date: fns.toCardinal(arr[1] || '')
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //Long "Mar 25 2015"
    //February 22, 2017 15:30:00
    {
      reg: /^([a-z]+) ([0-9]{1,2}(?:st|nd|rd|th)?),?( [0-9]{4})?( ([0-9:]+( ?am| ?pm| ?gmt)?))?$/i,
      parse: function parse(s, arr) {
        var month = months$1[arr[1].toLowerCase()];
        var year = parseYear(arr[3], s._today);
        var obj = {
          year: year,
          month: month,
          date: fns.toCardinal(arr[2] || '')
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //February 2017 (implied date)
    {
      reg: /^([a-z]+) ([0-9]{4})$/i,
      parse: function parse(s, arr) {
        var month = months$1[arr[1].toLowerCase()];
        var year = parseYear(arr[2], s._today);
        var obj = {
          year: year,
          month: month,
          date: s._today.date || 1
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, //Long "25 Mar 2015"
    {
      reg: /^([0-9]{1,2}(?:st|nd|rd|th)?) ([a-z]+),?( [0-9]{4})?,? ?([0-9]{1,2}:[0-9]{2}:?[0-9]{0,2}? ?(am|pm|gmt))?$/i,
      parse: function parse(s, arr) {
        var month = months$1[arr[2].toLowerCase()];

        if (!month) {
          return null;
        }

        var year = parseYear(arr[3], s._today);
        var obj = {
          year: year,
          month: month,
          date: fns.toCardinal(arr[1])
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s, arr[4]);
        return s;
      }
    }, {
      // '200bc'
      reg: /^[0-9,]+ ?b\.?c\.?$/i,
      parse: function parse(s, arr) {
        var str = arr[0] || ''; //make negative-year

        str = str.replace(/^([0-9,]+) ?b\.?c\.?$/i, '-$1'); //remove commas

        str = str.replace(/,/g, '');
        var year = parseInt(str.trim(), 10);
        var d = new Date();
        var obj = {
          year: year,
          month: d.getMonth(),
          date: d.getDate()
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s);
        return s;
      }
    }, {
      // '200ad'
      reg: /^[0-9,]+ ?(a\.?d\.?|c\.?e\.?)$/i,
      parse: function parse(s, arr) {
        var str = arr[0] || ''; //remove commas

        str = str.replace(/,/g, '');
        var year = parseInt(str.trim(), 10);
        var d = new Date();
        var obj = {
          year: year,
          month: d.getMonth(),
          date: d.getDate()
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s);
        return s;
      }
    }, {
      // '1992'
      reg: /^[0-9]{4}( ?a\.?d\.?)?$/i,
      parse: function parse(s, arr) {
        var today = s._today;
        var year = parseYear(arr[0], today);
        var d = new Date(); // using today's date, but a new month is awkward.

        if (today.month && !today.date) {
          today.date = 1;
        }

        var obj = {
          year: year,
          month: today.month || d.getMonth(),
          date: today.date || d.getDate()
        };

        if (hasDate_1(obj) === false) {
          s.epoch = null;
          return s;
        }

        walk_1(s, obj);
        s = parseTime_1(s);
        return s;
      }
    }];
    var strParse = strFmt;

    var dates = {
      now: function now(s) {
        s.epoch = Date.now();
        return s;
      },
      tonight: function tonight(s) {
        s.epoch = Date.now();
        s = s.hour(18);
        return s;
      },
      today: function today(s) {
        s.epoch = Date.now();
        return s;
      },
      tomorrow: function tomorrow(s) {
        s.epoch = Date.now();
        s = s.add(1, 'day');
        s = s.startOf('day');
        return s;
      },
      yesterday: function yesterday(s) {
        s.epoch = Date.now();
        s = s.subtract(1, 'day');
        s = s.startOf('day');
        return s;
      },
      christmas: function christmas(s) {
        var year = new Date().getFullYear();
        s = s.set([year, 11, 25, 18, 0, 0]); // Dec 25

        return s;
      },
      'new years': function newYears(s) {
        var year = new Date().getFullYear();
        s = s.set([year, 11, 31, 18, 0, 0]); // Dec 31

        return s;
      }
    };
    dates['new years eve'] = dates['new years'];
    var namedDates = dates;

    //  -  can't use built-in js parser ;(
    //=========================================
    // ISO Date	  "2015-03-25"
    // Short Date	"03/25/2015" or "2015/03/25"
    // Long Date	"Mar 25 2015" or "25 Mar 2015"
    // Full Date	"Wednesday March 25 2015"
    //=========================================
    //-- also -
    // if the given epoch is really small, they've probably given seconds and not milliseconds
    // anything below this number is likely (but not necessarily) a mistaken input.
    // this may seem like an arbitrary number, but it's 'within jan 1970'
    // this is only really ambiguous until 2054 or so

    var minimumEpoch = 2500000000;
    var defaults = {
      year: new Date().getFullYear(),
      month: 0,
      date: 1
    }; //support [2016, 03, 01] format

    var handleArray = function handleArray(s, arr, today) {
      var order = ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'];

      for (var i = 0; i < order.length; i++) {
        var num = arr[i] || today[order[i]] || defaults[order[i]] || 0;
        s = s[order[i]](num);
      }

      return s;
    }; //support {year:2016, month:3} format


    var handleObject = function handleObject(s, obj, today) {
      obj = Object.assign({}, defaults, today, obj);
      var keys = Object.keys(obj);

      for (var i = 0; i < keys.length; i++) {
        var unit = keys[i]; //make sure we have this method

        if (s[unit] === undefined || typeof s[unit] !== 'function') {
          continue;
        } //make sure the value is a number


        if (obj[unit] === null || obj[unit] === undefined || obj[unit] === '') {
          continue;
        }

        var num = obj[unit] || today[unit] || defaults[unit] || 0;
        s = s[unit](num);
      }

      return s;
    }; //find the epoch from different input styles


    var parseInput = function parseInput(s, input, givenTz) {
      var today = s._today || defaults; //if we've been given a epoch number, it's easy

      if (typeof input === 'number') {
        if (input > 0 && input < minimumEpoch && s.silent === false) {
          console.warn('  - Warning: You are setting the date to January 1970.');
          console.warn('       -   did input seconds instead of milliseconds?');
        }

        s.epoch = input;
        return s;
      } //set tmp time


      s.epoch = Date.now();

      if (input === null || input === undefined) {
        return s; //k, we're good.
      } //support input of Date() object


      if (fns.isDate(input) === true) {
        s.epoch = input.getTime();
        return s;
      } //support [2016, 03, 01] format


      if (fns.isArray(input) === true) {
        s = handleArray(s, input, today);
        return s;
      } //support {year:2016, month:3} format


      if (fns.isObject(input) === true) {
        //support spacetime object as input
        if (input.epoch) {
          s.epoch = input.epoch;
          s.tz = input.tz;
          return s;
        }

        s = handleObject(s, input, today);
        return s;
      } //input as a string..


      if (typeof input !== 'string') {
        return s;
      } //little cleanup..


      input = input.replace(/\b(mon|tues|wed|wednes|thu|thurs|fri|sat|satur|sun)(day)?\b/i, '');
      input = input.replace(/,/g, '');
      input = input.replace(/ +/g, ' ').trim(); //try some known-words, like 'now'

      if (namedDates.hasOwnProperty(input) === true) {
        s = namedDates[input](s);
        return s;
      } //try each text-parse template, use the first good result


      for (var i = 0; i < strParse.length; i++) {
        var m = input.match(strParse[i].reg);

        if (m) {
          var res = strParse[i].parse(s, m, givenTz);

          if (res !== null) {
            return res;
          }
        }
      }

      if (s.silent === false) {
        console.warn("Warning: couldn't parse date-string: '" + input + "'");
      }

      s.epoch = null;
      return s;
    };

    var input = parseInput;

    var shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var longDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var days = {
      "short": function short() {
        return shortDays;
      },
      "long": function long() {
        return longDays;
      },
      set: function set(i18n) {
        shortDays = i18n["short"] || shortDays;
        longDays = i18n["long"] || longDays;
      }
    };

    // it's kind of nuts how involved this is
    // "+01:00", "+0100", or simply "+01"

    var isoOffset = function isoOffset(s) {
      var offset = s.timezone().current.offset;
      var isNegative = offset < 0;
      var minute = '00'; //handle 5.5 → '5:30'

      if (Math.abs(offset % 1) === 0.5) {
        minute = '30';

        if (offset >= 0) {
          offset = Math.floor(offset);
        } else {
          offset = Math.ceil(offset);
        }
      }

      if (isNegative) {
        //handle negative sign
        offset *= -1;
        offset = fns.zeroPad(offset, 2);
        offset = '-' + offset;
      } else {
        offset = fns.zeroPad(offset, 2);
        offset = '+' + offset;
      }

      offset = offset + ':' + minute; //'Z' means 00

      if (offset === '+00:00') {
        offset = 'Z';
      }

      return offset;
    };

    var _offset = isoOffset;

    var format = {
      day: function day(s) {
        return fns.titleCase(s.dayName());
      },
      'day-short': function dayShort(s) {
        return fns.titleCase(days["short"]()[s.day()]);
      },
      'day-number': function dayNumber(s) {
        return s.day();
      },
      'day-ordinal': function dayOrdinal(s) {
        return fns.ordinal(s.day());
      },
      'day-pad': function dayPad(s) {
        return fns.zeroPad(s.day());
      },
      date: function date(s) {
        return s.date();
      },
      'date-ordinal': function dateOrdinal(s) {
        return fns.ordinal(s.date());
      },
      'date-pad': function datePad(s) {
        return fns.zeroPad(s.date());
      },
      month: function month(s) {
        return fns.titleCase(s.monthName());
      },
      'month-short': function monthShort(s) {
        return fns.titleCase(months["short"]()[s.month()]);
      },
      'month-number': function monthNumber(s) {
        return s.month();
      },
      'month-ordinal': function monthOrdinal(s) {
        return fns.ordinal(s.month());
      },
      'month-pad': function monthPad(s) {
        return fns.zeroPad(s.month());
      },
      'iso-month': function isoMonth(s) {
        return fns.zeroPad(s.month() + 1);
      },
      //1-based months
      year: function year(s) {
        var year = s.year();

        if (year > 0) {
          return year;
        }

        year = Math.abs(year);
        return year + ' BC';
      },
      'year-short': function yearShort(s) {
        var year = s.year();

        if (year > 0) {
          return "'".concat(String(s.year()).substr(2, 4));
        }

        year = Math.abs(year);
        return year + ' BC';
      },
      'iso-year': function isoYear(s) {
        var year = s.year();
        var isNegative = year < 0;
        var str = fns.zeroPad(Math.abs(year), 4); //0-padded

        if (isNegative) {
          //negative years are for some reason 6-digits ('-00008')
          str = fns.zeroPad(str, 6);
          str = '-' + str;
        }

        return str;
      },
      time: function time(s) {
        return s.time();
      },
      'time-24': function time24(s) {
        return "".concat(s.hour24(), ":").concat(fns.zeroPad(s.minute()));
      },
      hour: function hour(s) {
        return s.hour12();
      },
      'hour-pad': function hourPad(s) {
        return fns.zeroPad(s.hour12());
      },
      'hour-24': function hour24(s) {
        return s.hour24();
      },
      'hour-24-pad': function hour24Pad(s) {
        return fns.zeroPad(s.hour24());
      },
      minute: function minute(s) {
        return s.minute();
      },
      'minute-pad': function minutePad(s) {
        return fns.zeroPad(s.minute());
      },
      second: function second(s) {
        return s.second();
      },
      'second-pad': function secondPad(s) {
        return fns.zeroPad(s.second());
      },
      ampm: function ampm(s) {
        return s.ampm();
      },
      quarter: function quarter(s) {
        return 'Q' + s.quarter();
      },
      season: function season(s) {
        return s.season();
      },
      era: function era(s) {
        return s.era();
      },
      json: function json(s) {
        return s.json();
      },
      timezone: function timezone(s) {
        return s.timezone().name;
      },
      offset: function offset(s) {
        return _offset(s);
      },
      numeric: function numeric(s) {
        return "".concat(s.year(), "/").concat(fns.zeroPad(s.month() + 1), "/").concat(fns.zeroPad(s.date()));
      },
      // yyyy/mm/dd
      'numeric-us': function numericUs(s) {
        return "".concat(fns.zeroPad(s.month() + 1), "/").concat(fns.zeroPad(s.date()), "/").concat(s.year());
      },
      // mm/dd/yyyy
      'numeric-uk': function numericUk(s) {
        return "".concat(fns.zeroPad(s.date()), "/").concat(fns.zeroPad(s.month() + 1), "/").concat(s.year());
      },
      //dd/mm/yyyy
      'mm/dd': function mmDd(s) {
        return "".concat(fns.zeroPad(s.month() + 1), "/").concat(fns.zeroPad(s.date()));
      },
      //mm/dd
      // ... https://en.wikipedia.org/wiki/ISO_8601 ;(((
      iso: function iso(s) {
        var year = s.format('iso-year');
        var month = fns.zeroPad(s.month() + 1); //1-based months

        var date = fns.zeroPad(s.date());
        var hour = fns.zeroPad(s.h24());
        var minute = fns.zeroPad(s.minute());
        var second = fns.zeroPad(s.second());
        var ms = fns.zeroPad(s.millisecond(), 3);
        var offset = _offset(s);
        return "".concat(year, "-").concat(month, "-").concat(date, "T").concat(hour, ":").concat(minute, ":").concat(second, ".").concat(ms).concat(offset); //2018-03-09T08:50:00.000-05:00
      },
      'iso-short': function isoShort(s) {
        var month = fns.zeroPad(s.month() + 1); //1-based months

        var date = fns.zeroPad(s.date());
        return "".concat(s.year(), "-").concat(month, "-").concat(date); //2017-02-15
      },
      'iso-utc': function isoUtc(s) {
        return new Date(s.epoch).toISOString(); //2017-03-08T19:45:28.367Z
      },
      //i made these up
      nice: function nice(s) {
        return "".concat(months["short"]()[s.month()], " ").concat(fns.ordinal(s.date()), ", ").concat(s.time());
      },
      'nice-year': function niceYear(s) {
        return "".concat(months["short"]()[s.month()], " ").concat(fns.ordinal(s.date()), ", ").concat(s.year());
      },
      'nice-day': function niceDay(s) {
        return "".concat(days["short"]()[s.day()], " ").concat(fns.titleCase(months["short"]()[s.month()]), " ").concat(fns.ordinal(s.date()));
      },
      'nice-full': function niceFull(s) {
        return "".concat(s.dayName(), " ").concat(fns.titleCase(s.monthName()), " ").concat(fns.ordinal(s.date()), ", ").concat(s.time());
      }
    }; //aliases

    var aliases = {
      'day-name': 'day',
      'month-name': 'month',
      'iso 8601': 'iso',
      'time-h24': 'time-24',
      'time-12': 'time',
      'time-h12': 'time',
      tz: 'timezone',
      'day-num': 'day-number',
      'month-num': 'month-number',
      'month-iso': 'iso-month',
      'year-iso': 'iso-year',
      'nice-short': 'nice',
      mdy: 'numeric-us',
      dmy: 'numeric-uk',
      ymd: 'numeric',
      'yyyy/mm/dd': 'numeric',
      'mm/dd/yyyy': 'numeric-us',
      'dd/mm/yyyy': 'numeric-us',
      'little-endian': 'numeric-uk',
      'big-endian': 'numeric',
      'day-nice': 'nice-day'
    };
    Object.keys(aliases).forEach(function (k) {
      return format[k] = format[aliases[k]];
    });

    var printFormat = function printFormat(s) {
      var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      //don't print anything if it's an invalid date
      if (s.isValid() !== true) {
        return '';
      } //support .format('month')


      if (format.hasOwnProperty(str)) {
        var out = format[str](s) || '';

        if (str !== 'json') {
          out = String(out);

          if (str !== 'ampm') {
            out = fns.titleCase(out);
          }
        }

        return out;
      } //support '{hour}:{minute}' notation


      if (str.indexOf('{') !== -1) {
        var sections = /\{(.+?)\}/g;
        str = str.replace(sections, function (_, fmt) {
          fmt = fmt.toLowerCase().trim();

          if (format.hasOwnProperty(fmt)) {
            return String(format[fmt](s) || '');
          }

          return '';
        });
        return str;
      }

      return s.format('iso-short');
    };

    var format_1 = printFormat;

    var pad = fns.zeroPad;
    var formatTimezone = fns.formatTimezone; //parse this insane unix-time-templating thing, from the 19th century
    //http://unicode.org/reports/tr35/tr35-25.html#Date_Format_Patterns
    //time-symbols we support

    var mapping = {
      G: function G(s) {
        return s.era();
      },
      GG: function GG(s) {
        return s.era();
      },
      GGG: function GGG(s) {
        return s.era();
      },
      GGGG: function GGGG(s) {
        return s.era() === 'AD' ? 'Anno Domini' : 'Before Christ';
      },
      //year
      y: function y(s) {
        return s.year();
      },
      yy: function yy(s) {
        //last two chars
        return parseInt(String(s.year()).substr(2, 4), 10);
      },
      yyy: function yyy(s) {
        return s.year();
      },
      yyyy: function yyyy(s) {
        return s.year();
      },
      yyyyy: function yyyyy(s) {
        return '0' + s.year();
      },
      // u: (s) => {},//extended non-gregorian years
      //quarter
      Q: function Q(s) {
        return s.quarter();
      },
      QQ: function QQ(s) {
        return s.quarter();
      },
      QQQ: function QQQ(s) {
        return s.quarter();
      },
      QQQQ: function QQQQ(s) {
        return s.quarter();
      },
      //month
      M: function M(s) {
        return s.month() + 1;
      },
      MM: function MM(s) {
        return pad(s.month() + 1);
      },
      MMM: function MMM(s) {
        return s.format('month-short');
      },
      MMMM: function MMMM(s) {
        return s.format('month');
      },
      //week
      w: function w(s) {
        return s.week();
      },
      ww: function ww(s) {
        return pad(s.week());
      },
      //week of month
      // W: (s) => s.week(),
      //date of month
      d: function d(s) {
        return s.date();
      },
      dd: function dd(s) {
        return pad(s.date());
      },
      //date of year
      D: function D(s) {
        return s.dayOfYear();
      },
      DD: function DD(s) {
        return pad(s.dayOfYear());
      },
      DDD: function DDD(s) {
        return pad(s.dayOfYear(), 3);
      },
      // F: (s) => {},//date of week in month
      // g: (s) => {},//modified julian day
      //day
      E: function E(s) {
        return s.format('day-short');
      },
      EE: function EE(s) {
        return s.format('day-short');
      },
      EEE: function EEE(s) {
        return s.format('day-short');
      },
      EEEE: function EEEE(s) {
        return s.format('day');
      },
      EEEEE: function EEEEE(s) {
        return s.format('day')[0];
      },
      e: function e(s) {
        return s.day();
      },
      ee: function ee(s) {
        return s.day();
      },
      eee: function eee(s) {
        return s.format('day-short');
      },
      eeee: function eeee(s) {
        return s.format('day');
      },
      eeeee: function eeeee(s) {
        return s.format('day')[0];
      },
      //am/pm
      a: function a(s) {
        return s.ampm().toUpperCase();
      },
      aa: function aa(s) {
        return s.ampm().toUpperCase();
      },
      aaa: function aaa(s) {
        return s.ampm().toUpperCase();
      },
      aaaa: function aaaa(s) {
        return s.ampm().toUpperCase();
      },
      //hour
      h: function h(s) {
        return s.h12();
      },
      hh: function hh(s) {
        return pad(s.h12());
      },
      H: function H(s) {
        return s.hour();
      },
      HH: function HH(s) {
        return pad(s.hour());
      },
      // j: (s) => {},//weird hour format
      m: function m(s) {
        return s.minute();
      },
      mm: function mm(s) {
        return pad(s.minute());
      },
      s: function s(_s) {
        return _s.second();
      },
      ss: function ss(s) {
        return pad(s.second());
      },
      //milliseconds in the day
      A: function A(s) {
        return s.epoch - s.startOf('day').epoch;
      },
      //timezone
      z: function z(s) {
        return s.timezone().name;
      },
      zz: function zz(s) {
        return s.timezone().name;
      },
      zzz: function zzz(s) {
        return s.timezone().name;
      },
      zzzz: function zzzz(s) {
        return s.timezone().name;
      },
      Z: function Z(s) {
        return formatTimezone(s.timezone().current.offset);
      },
      ZZ: function ZZ(s) {
        return formatTimezone(s.timezone().current.offset);
      },
      ZZZ: function ZZZ(s) {
        return formatTimezone(s.timezone().current.offset);
      },
      ZZZZ: function ZZZZ(s) {
        return formatTimezone(s.timezone().current.offset, ':');
      }
    };

    var addAlias = function addAlias(_char, to, n) {
      var name = _char;
      var toName = to;

      for (var i = 0; i < n; i += 1) {
        mapping[name] = mapping[toName];
        name += _char;
        toName += to;
      }
    };

    addAlias('q', 'Q', 4);
    addAlias('L', 'M', 4);
    addAlias('Y', 'y', 4);
    addAlias('c', 'e', 4);
    addAlias('k', 'H', 2);
    addAlias('K', 'h', 2);
    addAlias('S', 's', 2);
    addAlias('v', 'z', 4);
    addAlias('V', 'Z', 4);

    var unixFmt = function unixFmt(s, str) {
      var chars = str.split(''); //combine consecutive chars, like 'yyyy' as one.

      var arr = [chars[0]];
      var quoteOn = false;

      for (var i = 1; i < chars.length; i += 1) {
        //support quoted substrings
        if (chars[i] === "'") {
          quoteOn = !quoteOn; //support '', meaning one tick

          if (quoteOn === true && chars[i + 1] && chars[i + 1] === "'") {
            quoteOn = true;
          } else {
            continue;
          }
        } //merge it with the last one


        if (quoteOn === true || chars[i] === arr[arr.length - 1][0]) {
          arr[arr.length - 1] += chars[i];
        } else {
          arr.push(chars[i]);
        }
      }

      return arr.reduce(function (txt, c) {
        if (mapping[c] !== undefined) {
          txt += mapping[c](s) || '';
        } else {
          txt += c;
        }

        return txt;
      }, '');
    };

    var unixFmt_1 = unixFmt;

    var units$1 = ['year', 'season', 'quarter', 'month', 'week', 'day', 'quarterHour', 'hour', 'minute'];

    var doUnit = function doUnit(s, k) {
      var start = s.clone().startOf(k);
      var end = s.clone().endOf(k);
      var duration = end.epoch - start.epoch;
      var percent = (s.epoch - start.epoch) / duration;
      return parseFloat(percent.toFixed(2));
    }; //how far it is along, from 0-1


    var progress = function progress(s, unit) {
      if (unit) {
        unit = fns.normalize(unit);
        return doUnit(s, unit);
      }

      var obj = {};
      units$1.forEach(function (k) {
        obj[k] = doUnit(s, k);
      });
      return obj;
    };

    var progress_1 = progress;

    var nearest = function nearest(s, unit) {
      //how far have we gone?
      var prog = s.progress();
      unit = fns.normalize(unit); //fix camel-case for this one

      if (unit === 'quarterhour') {
        unit = 'quarterHour';
      }

      if (prog[unit] !== undefined) {
        // go forward one?
        if (prog[unit] > 0.5) {
          s = s.add(1, unit);
        } // go to start


        s = s.startOf(unit);
      } else if (s.silent === false) {
        console.warn("no known unit '" + unit + "'");
      }

      return s;
    };

    var nearest_1 = nearest;

    //increment until dates are the same
    var climb = function climb(a, b, unit) {
      var i = 0;
      a = a.clone();

      while (a.isBefore(b)) {
        //do proper, expensive increment to catch all-the-tricks
        a = a.add(1, unit);
        i += 1;
      } //oops, we went too-far..


      if (a.isAfter(b, unit)) {
        i -= 1;
      }

      return i;
    }; // do a thurough +=1 on the unit, until they match
    // for speed-reasons, only used on day, month, week.


    var diffOne = function diffOne(a, b, unit) {
      if (a.isBefore(b)) {
        return climb(a, b, unit);
      } else {
        return climb(b, a, unit) * -1; //reverse it
      }
    };

    var one = diffOne;

    // 2020 - 2019 may be 1 year, or 0 years
    // - '1 year difference' means 366 days during a leap year

    var fastYear = function fastYear(a, b) {
      var years = b.year() - a.year(); // should we decrement it by 1?

      a = a.year(b.year());

      if (a.isAfter(b)) {
        years -= 1;
      }

      return years;
    }; // use a waterfall-method for computing a diff of any 'pre-knowable' units
    // compute years, then compute months, etc..
    // ... then ms-math for any very-small units


    var diff = function diff(a, b) {
      // an hour is always the same # of milliseconds
      // so these units can be 'pre-calculated'
      var msDiff = b.epoch - a.epoch;
      var obj = {
        milliseconds: msDiff,
        seconds: parseInt(msDiff / 1000, 10)
      };
      obj.minutes = parseInt(obj.seconds / 60, 10);
      obj.hours = parseInt(obj.minutes / 60, 10); //do the year

      var tmp = a.clone();
      obj.years = fastYear(tmp, b);
      tmp = a.add(obj.years, 'year'); //there's always 12 months in a year...

      obj.months = obj.years * 12;
      tmp = a.add(obj.months, 'month');
      obj.months += one(tmp, b, 'month'); // there's always atleast 52 weeks in a year..
      // (month * 4) isn't as close

      obj.weeks = obj.years * 52;
      tmp = a.add(obj.weeks, 'week');
      obj.weeks += one(tmp, b, 'week'); // there's always atleast 7 days in a week

      obj.days = obj.weeks * 7;
      tmp = a.add(obj.days, 'day');
      obj.days += one(tmp, b, 'day');
      return obj;
    };

    var waterfall = diff;

    var reverseDiff = function reverseDiff(obj) {
      Object.keys(obj).forEach(function (k) {
        obj[k] *= -1;
      });
      return obj;
    }; // this method counts a total # of each unit, between a, b.
    // '1 month' means 28 days in february
    // '1 year' means 366 days in a leap year


    var main = function main(a, b, unit) {
      b = fns.beADate(b, a); //reverse values, if necessary

      var reversed = false;

      if (a.isAfter(b)) {
        var tmp = a;
        a = b;
        b = tmp;
        reversed = true;
      } //compute them all (i know!)


      var obj = waterfall(a, b);

      if (reversed) {
        obj = reverseDiff(obj);
      } //return just the requested unit


      if (unit) {
        //make sure it's plural-form
        unit = fns.normalize(unit);

        if (/s$/.test(unit) !== true) {
          unit += 's';
        }

        if (unit === 'dates') {
          unit = 'days';
        }

        return obj[unit];
      }

      return obj;
    };

    var diff$1 = main;

    //our conceptual 'break-points' for each unit

    var qualifiers = {
      months: {
        almost: 10,
        over: 4
      },
      days: {
        almost: 25,
        over: 10
      },
      hours: {
        almost: 20,
        over: 8
      },
      minutes: {
        almost: 50,
        over: 20
      },
      seconds: {
        almost: 50,
        over: 20
      }
    }; //get number of hours/minutes... between the two dates

    function getDiff(a, b) {
      var isBefore = a.isBefore(b);
      var later = isBefore ? b : a;
      var earlier = isBefore ? a : b;
      earlier = earlier.clone();
      var diff = {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
      Object.keys(diff).forEach(function (unit) {
        if (earlier.isSame(later, unit)) {
          return;
        }

        var max = earlier.diff(later, unit);
        earlier = earlier.add(max, unit);
        diff[unit] = max;
      }); //reverse it, if necessary

      if (isBefore) {
        Object.keys(diff).forEach(function (u) {
          if (diff[u] !== 0) {
            diff[u] *= -1;
          }
        });
      }

      return diff;
    } // Expects a plural unit arg


    function pluralize(value, unit) {
      if (value === 1) {
        unit = unit.slice(0, -1);
      }

      return value + ' ' + unit;
    } //create the human-readable diff between the two dates


    var since = function since(start, end) {
      end = fns.beADate(end, start);
      var diff = getDiff(start, end);
      var isNow = Object.keys(diff).every(function (u) {
        return !diff[u];
      });

      if (isNow === true) {
        return {
          diff: diff,
          rounded: 'now',
          qualified: 'now',
          precise: 'now'
        };
      }

      var rounded;
      var qualified;
      var precise;
      var englishValues = []; //go through each value and create its text-representation

      Object.keys(diff).forEach(function (unit, i, units) {
        var value = Math.abs(diff[unit]);

        if (value === 0) {
          return;
        }

        var englishValue = pluralize(value, unit);
        englishValues.push(englishValue);

        if (!rounded) {
          rounded = qualified = englishValue;

          if (i > 4) {
            return;
          } //is it a 'almost' something, etc?


          var nextUnit = units[i + 1];
          var nextValue = Math.abs(diff[nextUnit]);

          if (nextValue > qualifiers[nextUnit].almost) {
            rounded = pluralize(value + 1, unit);
            qualified = 'almost ' + rounded;
          } else if (nextValue > qualifiers[nextUnit].over) qualified = 'over ' + englishValue;
        }
      }); //make them into a string

      precise = englishValues.splice(0, 2).join(', '); //handle before/after logic

      if (start.isAfter(end) === true) {
        rounded += ' ago';
        qualified += ' ago';
        precise += ' ago';
      } else {
        rounded = 'in ' + rounded;
        qualified = 'in ' + qualified;
        precise = 'in ' + precise;
      }

      return {
        diff: diff,
        rounded: rounded,
        qualified: qualified,
        precise: precise
      };
    };

    var since_1 = since;

    //https://www.timeanddate.com/calendar/aboutseasons.html
    // Spring - from March 1 to May 31;
    // Summer - from June 1 to August 31;
    // Fall (autumn) - from September 1 to November 30; and,
    // Winter - from December 1 to February 28 (February 29 in a leap year).
    var seasons = {
      north: [['spring', 2, 1], //spring march 1
      ['summer', 5, 1], //june 1
      ['fall', 8, 1], //sept 1
      ['autumn', 8, 1], //sept 1
      ['winter', 11, 1] //dec 1
      ],
      south: [['fall', 2, 1], //march 1
      ['autumn', 2, 1], //march 1
      ['winter', 5, 1], //june 1
      ['spring', 8, 1], //sept 1
      ['summer', 11, 1] //dec 1
      ]
    };

    var quarters = [null, [0, 1], //jan 1
    [3, 1], //apr 1
    [6, 1], //july 1
    [9, 1] //oct 1
    ];

    var units$2 = {
      minute: function minute(s) {
        walk_1(s, {
          second: 0,
          millisecond: 0
        });
        return s;
      },
      quarterhour: function quarterhour(s) {
        var minute = s.minutes();

        if (minute >= 45) {
          s = s.minutes(45);
        } else if (minute >= 30) {
          s = s.minutes(30);
        } else if (minute >= 15) {
          s = s.minutes(15);
        } else {
          s = s.minutes(0);
        }

        walk_1(s, {
          second: 0,
          millisecond: 0
        });
        return s;
      },
      hour: function hour(s) {
        walk_1(s, {
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s;
      },
      day: function day(s) {
        walk_1(s, {
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s;
      },
      week: function week(s) {
        var original = s.clone();
        s = s.day(s._weekStart); //monday

        if (s.isAfter(original)) {
          s = s.subtract(1, 'week');
        }

        walk_1(s, {
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s;
      },
      month: function month(s) {
        walk_1(s, {
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s;
      },
      quarter: function quarter(s) {
        var q = s.quarter();

        if (quarters[q]) {
          walk_1(s, {
            month: quarters[q][0],
            date: quarters[q][1],
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
          });
        }

        return s;
      },
      season: function season(s) {
        var current = s.season();
        var hem = 'north';

        if (s.hemisphere() === 'South') {
          hem = 'south';
        }

        for (var i = 0; i < seasons[hem].length; i++) {
          if (seasons[hem][i][0] === current) {
            //winter goes between years
            var year = s.year();

            if (current === 'winter' && s.month() < 3) {
              year -= 1;
            }

            walk_1(s, {
              year: year,
              month: seasons[hem][i][1],
              date: seasons[hem][i][2],
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0
            });
            return s;
          }
        }

        return s;
      },
      year: function year(s) {
        walk_1(s, {
          month: 0,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s;
      },
      decade: function decade(s) {
        s = s.startOf('year');
        var year = s.year();
        var decade = parseInt(year / 10, 10) * 10;
        s = s.year(decade);
        return s;
      },
      century: function century(s) {
        s = s.startOf('year');
        var year = s.year(); // near 0AD goes '-1 | +1'

        var decade = parseInt(year / 100, 10) * 100;
        s = s.year(decade);
        return s;
      }
    };
    units$2.date = units$2.day;

    var startOf = function startOf(a, unit) {
      var s = a.clone();
      unit = fns.normalize(unit);

      if (units$2[unit]) {
        return units$2[unit](s);
      }

      if (unit === 'summer' || unit === 'winter') {
        s = s.season(unit);
        return units$2.season(s);
      }

      return s;
    }; //piggy-backs off startOf


    var endOf = function endOf(a, unit) {
      var s = a.clone();
      unit = fns.normalize(unit);

      if (units$2[unit]) {
        s = units$2[unit](s);
        s = s.add(1, unit);
        s = s.subtract(1, 'milliseconds');
        return s;
      }

      return s;
    };

    var startOf_1 = {
      startOf: startOf,
      endOf: endOf
    };

    var isDay = function isDay(unit) {
      if (days["short"]().find(function (s) {
        return s === unit;
      })) {
        return true;
      }

      if (days["long"]().find(function (s) {
        return s === unit;
      })) {
        return true;
      }

      return false;
    }; // return a list of the weeks/months/days between a -> b
    // returns spacetime objects in the timezone of the input


    var every = function every(start) {
      var unit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var end = arguments.length > 2 ? arguments[2] : undefined;

      if (!unit || !end) {
        return [];
      } //cleanup unit param


      unit = fns.normalize(unit); //cleanup to param

      end = start.clone().set(end); //swap them, if they're backwards

      if (start.isAfter(end)) {
        var tmp = start;
        start = end;
        end = tmp;
      } //support 'every wednesday'


      var d = start.clone();

      if (isDay(unit)) {
        d = d.next(unit);
        unit = 'week';
      } else {
        d = d.next(unit);
      } //okay, actually start doing it


      var result = [];

      while (d.isBefore(end)) {
        result.push(d);
        d = d.add(1, unit);
      }

      return result;
    };

    var every_1 = every;

    var parseDst = function parseDst(dst) {
      if (!dst) {
        return [];
      }

      return dst.split('->');
    };

    var titleCase = function titleCase(str) {
      str = str[0].toUpperCase() + str.substr(1);
      str = str.replace(/\/gmt/, '/GMT');
      str = str.replace(/[\/_]([a-z])/gi, function (s) {
        return s.toUpperCase();
      });
      return str;
    }; //get metadata about this timezone


    var timezone = function timezone(s) {
      var zones = s.timezones;
      var tz = s.tz;

      if (zones.hasOwnProperty(tz) === false) {
        tz = find(s.tz, zones);
      }

      if (tz === null) {
        if (s.silent === false) {
          console.warn("Warn: could not find given or local timezone - '" + s.tz + "'");
        }

        return {
          current: {
            epochShift: 0
          }
        };
      }

      var found = zones[tz];
      var result = {
        name: titleCase(tz),
        hasDst: Boolean(found.dst),
        default_offset: found.offset,
        //do north-hemisphere version as default (sorry!)
        hemisphere: found.hem === 's' ? 'South' : 'North',
        current: {}
      };

      if (result.hasDst) {
        var arr = parseDst(found.dst);
        result.change = {
          start: arr[0],
          back: arr[1]
        };
      } //find the offsets for summer/winter times
      //(these variable names are north-centric)


      var summer = found.offset; // (july)

      var winter = summer; // (january) assume it's the same for now

      if (result.hasDst === true) {
        if (result.hemisphere === 'North') {
          winter = summer - 1;
        } else {
          //southern hemisphere
          winter = found.offset + 1;
        }
      } //find out which offset to use right now
      //use 'summer' time july-time


      if (result.hasDst === false) {
        result.current.offset = summer;
        result.current.isDST = false;
      } else if (summerTime(s.epoch, result.change.start, result.change.back, summer) === true) {
        result.current.offset = summer;
        result.current.isDST = result.hemisphere === 'North'; //dst 'on' in winter in north
      } else {
        //use 'winter' january-time
        result.current.offset = winter;
        result.current.isDST = result.hemisphere === 'South'; //dst 'on' in summer in south
      }

      return result;
    };

    var timezone_1 = timezone;

    var units$3 = ['century', 'decade', 'year', 'month', 'date', 'day', 'hour', 'minute', 'second', 'millisecond']; //the spacetime instance methods (also, the API)

    var methods = {
      set: function set(input$1, tz) {
        var s = this.clone();
        s = input(s, input$1, null);

        if (tz) {
          this.tz = find(tz);
        }

        return s;
      },
      timezone: function timezone() {
        return timezone_1(this);
      },
      isDST: function isDST() {
        return timezone_1(this).current.isDST;
      },
      hasDST: function hasDST() {
        return timezone_1(this).hasDst;
      },
      offset: function offset() {
        return timezone_1(this).current.offset * 60;
      },
      hemisphere: function hemisphere() {
        return timezone_1(this).hemisphere;
      },
      format: function format(fmt) {
        return format_1(this, fmt);
      },
      unixFmt: function unixFmt(fmt) {
        return unixFmt_1(this, fmt);
      },
      startOf: function startOf(unit) {
        return startOf_1.startOf(this, unit);
      },
      endOf: function endOf(unit) {
        return startOf_1.endOf(this, unit);
      },
      leapYear: function leapYear() {
        var year = this.year();
        return fns.isLeapYear(year);
      },
      progress: function progress(unit) {
        return progress_1(this, unit);
      },
      nearest: function nearest(unit) {
        return nearest_1(this, unit);
      },
      diff: function diff(d, unit) {
        return diff$1(this, d, unit);
      },
      since: function since(d) {
        if (!d) {
          d = this.clone().set();
        }

        return since_1(this, d);
      },
      next: function next(unit) {
        var s = this.add(1, unit);
        return s.startOf(unit);
      },
      //the start of the previous year/week/century
      last: function last(unit) {
        var s = this.subtract(1, unit);
        return s.startOf(unit);
      },
      isValid: function isValid() {
        //null/undefined epochs
        if (!this.epoch && this.epoch !== 0) {
          return false;
        }

        return !isNaN(this.d.getTime());
      },
      //travel to this timezone
      "goto": function goto(tz) {
        var s = this.clone();
        s.tz = find(tz, s.timezones); //science!

        return s;
      },
      //get each week/month/day between a -> b
      every: function every(unit, to) {
        return every_1(this, unit, to);
      },
      isAwake: function isAwake() {
        var hour = this.hour(); //10pm -> 8am

        if (hour < 8 || hour > 22) {
          return false;
        }

        return true;
      },
      isAsleep: function isAsleep() {
        return !this.isAwake();
      },
      //pretty-printing
      log: function log() {
        console.log('');
        console.log(format_1(this, 'nice-short'));
        return this;
      },
      logYear: function logYear() {
        console.log('');
        console.log(format_1(this, 'full-short'));
        return this;
      },
      json: function json() {
        var _this = this;

        return units$3.reduce(function (h, unit) {
          h[unit] = _this[unit]();
          return h;
        }, {});
      },
      debug: function debug() {
        var tz = this.timezone();
        var date = this.format('MM') + ' ' + this.format('date-ordinal') + ' ' + this.year();
        date += '\n     - ' + this.format('time');
        console.log('\n\n', date + '\n     - ' + tz.name + ' (' + tz.current.offset + ')');
        return this;
      },
      //alias of 'since' but opposite - like moment.js
      from: function from(d) {
        d = this.clone().set(d);
        return d.since(this);
      },
      fromNow: function fromNow() {
        var d = this.clone().set(Date.now());
        return d.since(this);
      },
      weekStart: function weekStart(input) {
        //accept a number directly
        if (typeof input === 'number') {
          this._weekStart = input;
          return this;
        }

        if (typeof input === 'string') {
          // accept 'wednesday'
          input = input.toLowerCase().trim();
          var num = days["short"]().indexOf(input);

          if (num === -1) {
            num = days["long"]().indexOf(input);
          }

          if (num === -1) {
            num = 1; //go back to default
          }

          this._weekStart = num;
        } else {
          console.warn('Spacetime Error: Cannot understand .weekStart() input:', input);
        }

        return this;
      }
    }; // aliases

    methods.inDST = methods.isDST;
    methods.round = methods.nearest;
    methods.each = methods.every;
    var methods_1 = methods;

    //these methods wrap around them.

    var validate = function validate(n) {
      //handle number as a string
      if (typeof n === 'string') {
        n = parseInt(n, 10);
      }

      return n;
    };

    var order = ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond']; //reduce hostile micro-changes when moving dates by millisecond

    var confirm = function confirm(s, tmp, unit) {
      var n = order.indexOf(unit);
      var arr = order.slice(n, order.length);

      for (var i = 0; i < arr.length; i++) {
        var want = tmp[arr[i]]();
        s[arr[i]](want);
      }

      return s;
    };

    var set = {
      milliseconds: function milliseconds(s, n) {
        n = validate(n);
        var current = s.millisecond();
        var diff = current - n; //milliseconds to shift by

        return s.epoch - diff;
      },
      seconds: function seconds(s, n) {
        n = validate(n);
        var diff = s.second() - n;
        var shift = diff * milliseconds.second;
        return s.epoch - shift;
      },
      minutes: function minutes(s, n) {
        n = validate(n);
        var old = s.clone();
        var diff = s.minute() - n;
        var shift = diff * milliseconds.minute;
        s.epoch -= shift;
        confirm(s, old, 'second');
        return s.epoch;
      },
      hours: function hours(s, n) {
        n = validate(n);

        if (n >= 24) {
          n = 24;
        } else if (n < 0) {
          n = 0;
        }

        var old = s.clone();
        var diff = s.hour() - n;
        var shift = diff * milliseconds.hour;
        s.epoch -= shift;
        walk_1(s, {
          hour: n
        });
        confirm(s, old, 'minute');
        return s.epoch;
      },
      //support setting time by '4:25pm' - this isn't very-well developed..
      time: function time(s, str) {
        var m = str.match(/([0-9]{1,2}):([0-9]{1,2})(am|pm)?/);

        if (!m) {
          //fallback to support just '2am'
          m = str.match(/([0-9]{1,2})(am|pm)/);

          if (!m) {
            return s.epoch;
          }

          m.splice(2, 0, '0'); //add implicit 0 minutes
        }

        var h24 = false;
        var hour = parseInt(m[1], 10);
        var minute = parseInt(m[2], 10);

        if (hour > 12) {
          h24 = true;
        } //make the hour into proper 24h time


        if (h24 === false) {
          if (m[3] === 'am' && hour === 12) {
            //12am is midnight
            hour = 0;
          }

          if (m[3] === 'pm' && hour < 12) {
            //12pm is noon
            hour += 12;
          }
        }

        s = s.hour(hour);
        s = s.minute(minute);
        s = s.second(0);
        s = s.millisecond(0);
        return s.epoch;
      },
      date: function date(s, n) {
        n = validate(n); //avoid setting february 31st

        if (n > 28) {
          var max = monthLengths_1[s.month()];

          if (n > max) {
            n = max;
          }
        } //avoid setting < 0


        if (n <= 0) {
          n = 1;
        }

        walk_1(s, {
          date: n
        });
        return s.epoch;
      },
      //this one's tricky
      month: function month(s, n) {
        if (typeof n === 'string') {
          n = months.mapping()[n.toLowerCase()];
        }

        n = validate(n); //don't go past december

        if (n >= 12) {
          n = 11;
        }

        if (n <= 0) {
          n = 0;
        }

        var date = s.date(); //there's no 30th of february, etc.

        if (date > monthLengths_1[n]) {
          //make it as close as we can..
          date = monthLengths_1[n];
        }

        walk_1(s, {
          month: n,
          date: date
        });
        return s.epoch;
      },
      year: function year(s, n) {
        n = validate(n);
        walk_1(s, {
          year: n
        });
        return s.epoch;
      },
      dayOfYear: function dayOfYear(s, n) {
        n = validate(n);
        var old = s.clone();
        n -= 1; //days are 1-based

        if (n <= 0) {
          n = 0;
        } else if (n >= 365) {
          n = 364;
        }

        s = s.startOf('year');
        s = s.add(n, 'day');
        confirm(s, old, 'hour');
        return s.epoch;
      }
    };

    var methods$1 = {
      millisecond: function millisecond(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.milliseconds(s, num);
          return s;
        }

        return this.d.getMilliseconds();
      },
      second: function second(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.seconds(s, num);
          return s;
        }

        return this.d.getSeconds();
      },
      minute: function minute(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.minutes(s, num);
          return s;
        }

        return this.d.getMinutes();
      },
      hour: function hour(num) {
        var d = this.d;

        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.hours(s, num);
          return s;
        }

        return d.getHours();
      },
      //'3:30' is 3.5
      hourFloat: function hourFloat(num) {
        if (num !== undefined) {
          var s = this.clone();

          var _minute = num % 1;

          _minute = _minute * 60;

          var _hour = parseInt(num, 10);

          s.epoch = set.hours(s, _hour);
          s.epoch = set.minutes(s, _minute);
          return s;
        }

        var d = this.d;
        var hour = d.getHours();
        var minute = d.getMinutes();
        minute = minute / 60;
        return hour + minute;
      },
      // hour in 12h format
      hour12: function hour12(str) {
        var d = this.d;

        if (str !== undefined) {
          var s = this.clone();
          str = '' + str;
          var m = str.match(/^([0-9]+)(am|pm)$/);

          if (m) {
            var hour = parseInt(m[1], 10);

            if (m[2] === 'pm') {
              hour += 12;
            }

            s.epoch = set.hours(s, hour);
          }

          return s;
        } //get the hour


        var hour12 = d.getHours();

        if (hour12 > 12) {
          hour12 = hour12 - 12;
        }

        if (hour12 === 0) {
          hour12 = 12;
        }

        return hour12;
      },
      //some ambiguity here with 12/24h
      time: function time(str) {
        if (str !== undefined) {
          var s = this.clone();
          s.epoch = set.time(s, str);
          return s;
        }

        return "".concat(this.h12(), ":").concat(fns.zeroPad(this.minute())).concat(this.ampm());
      },
      // either 'am' or 'pm'
      ampm: function ampm(input) {
        var which = 'am';
        var hour = this.hour();

        if (hour >= 12) {
          which = 'pm';
        }

        if (typeof input !== 'string') {
          return which;
        } //okay, we're doing a setter


        var s = this.clone();
        input = input.toLowerCase().trim(); //ampm should never change the day
        // - so use `.hour(n)` instead of `.minus(12,'hour')`

        if (hour >= 12 && input === 'am') {
          //noon is 12pm
          hour -= 12;
          return s.hour(hour);
        }

        if (hour < 12 && input === 'pm') {
          hour += 12;
          return s.hour(hour);
        }

        return s;
      },
      //some hard-coded times of day, like 'noon'
      dayTime: function dayTime(str) {
        if (str !== undefined) {
          var times = {
            morning: '7:00am',
            breakfast: '7:00am',
            noon: '12:00am',
            lunch: '12:00pm',
            afternoon: '2:00pm',
            evening: '6:00pm',
            dinner: '6:00pm',
            night: '11:00pm',
            midnight: '23:59pm'
          };
          var s = this.clone();
          str = str || '';
          str = str.toLowerCase();

          if (times.hasOwnProperty(str) === true) {
            s = s.time(times[str]);
          }

          return s;
        }

        var h = this.hour();

        if (h < 6) {
          return 'night';
        }

        if (h < 12) {
          //until noon
          return 'morning';
        }

        if (h < 17) {
          //until 5pm
          return 'afternoon';
        }

        if (h < 22) {
          //until 10pm
          return 'evening';
        }

        return 'night';
      },
      //parse a proper iso string
      iso: function iso(num) {
        if (num !== undefined) {
          return this.set(num);
        }

        return this.format('iso');
      }
    };
    var _01Time = methods$1;

    var methods$2 = {
      // # day in the month
      date: function date(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.date(s, num);
          return s;
        }

        return this.d.getDate();
      },
      //like 'wednesday' (hard!)
      day: function day(input) {
        if (input === undefined) {
          return this.d.getDay();
        }

        var original = this.clone();
        var want = input; // accept 'wednesday'

        if (typeof input === 'string') {
          input = input.toLowerCase();
          want = days["short"]().indexOf(input);

          if (want === -1) {
            want = days["long"]().indexOf(input);
          }
        } //move approx


        var day = this.d.getDay();
        var diff = day - want;
        var s = this.subtract(diff * 24, 'hours'); //tighten it back up

        walk_1(s, {
          hour: original.hour(),
          minute: original.minute(),
          second: original.second()
        });
        return s;
      },
      //these are helpful name-wrappers
      dayName: function dayName(input) {
        if (input === undefined) {
          return days["long"]()[this.day()];
        }

        var s = this.clone();
        s = s.day(input);
        return s;
      },
      //either name or number
      month: function month(input) {
        if (input !== undefined) {
          var s = this.clone();
          s.epoch = set.month(s, input);
          return s;
        }

        return this.d.getMonth();
      }
    };
    var _02Date = methods$2;

    var clearMinutes = function clearMinutes(s) {
      s = s.minute(0);
      s = s.second(0);
      s = s.millisecond(1);
      return s;
    };

    var methods$3 = {
      // day 0-366
      dayOfYear: function dayOfYear(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.dayOfYear(s, num);
          return s;
        } //days since newyears - jan 1st is 1, jan 2nd is 2...


        var sum = 0;
        var month = this.d.getMonth();
        var tmp; //count the num days in each month

        for (var i = 1; i <= month; i++) {
          tmp = new Date();
          tmp.setDate(1);
          tmp.setFullYear(this.d.getFullYear()); //the year matters, because leap-years

          tmp.setHours(1);
          tmp.setMinutes(1);
          tmp.setMonth(i);
          tmp.setHours(-2); //the last day of the month

          sum += tmp.getDate();
        }

        return sum + this.d.getDate();
      },
      //since the start of the year
      week: function week(num) {
        // week-setter
        if (num !== undefined) {
          var s = this.clone();
          s = s.month(0);
          s = s.date(1);
          s = s.day('monday');
          s = clearMinutes(s); //don't go into last-year

          if (s.monthName() === 'december') {
            s = s.add(1, 'week');
          }

          num -= 1; //1-based

          s = s.add(num, 'weeks');
          return s;
        } //find-out which week it is


        var tmp = this.clone();
        tmp = tmp.month(0);
        tmp = tmp.date(1);
        tmp = clearMinutes(tmp);
        tmp = tmp.day('monday'); //don't go into last-year

        if (tmp.monthName() === 'december') {
          tmp = tmp.add(1, 'week');
        } // is first monday the 1st?


        var toAdd = 1;

        if (tmp.date() === 1) {
          toAdd = 0;
        }

        tmp = tmp.minus(1, 'second');
        var thisOne = this.epoch; //if the week technically hasn't started yet

        if (tmp.epoch > thisOne) {
          return 1;
        } //speed it up, if we can


        var i = 0;
        var skipWeeks = this.month() * 4;
        tmp.epoch += milliseconds.week * skipWeeks;
        i += skipWeeks;

        for (; i < 52; i++) {
          if (tmp.epoch > thisOne) {
            return i + toAdd;
          }

          tmp = tmp.add(1, 'week');
        }

        return 52;
      },
      //'january'
      monthName: function monthName(input) {
        if (input === undefined) {
          return months["long"]()[this.month()];
        }

        var s = this.clone();
        s = s.month(input);
        return s;
      },
      //q1, q2, q3, q4
      quarter: function quarter(num) {
        if (num !== undefined) {
          if (typeof num === 'string') {
            num = num.replace(/^q/i, '');
            num = parseInt(num, 10);
          }

          if (quarters[num]) {
            var s = this.clone();
            var _month = quarters[num][0];
            s = s.month(_month);
            s = s.date(1);
            s = s.startOf('day');
            return s;
          }
        }

        var month = this.d.getMonth();

        for (var i = 1; i < quarters.length; i++) {
          if (month < quarters[i][0]) {
            return i - 1;
          }
        }

        return 4;
      },
      //spring, summer, winter, fall
      season: function season(input) {
        var hem = 'north';

        if (this.hemisphere() === 'South') {
          hem = 'south';
        }

        if (input !== undefined) {
          var s = this.clone();

          for (var i = 0; i < seasons[hem].length; i++) {
            if (input === seasons[hem][i][0]) {
              s = s.month(seasons[hem][i][1]);
              s = s.date(1);
              s = s.startOf('day');
            }
          }

          return s;
        }

        var month = this.d.getMonth();

        for (var _i = 0; _i < seasons[hem].length - 1; _i++) {
          if (month >= seasons[hem][_i][1] && month < seasons[hem][_i + 1][1]) {
            return seasons[hem][_i][0];
          }
        }

        return 'winter';
      },
      //the year number
      year: function year(num) {
        if (num !== undefined) {
          var s = this.clone();
          s.epoch = set.year(s, num);
          return s;
        }

        return this.d.getFullYear();
      },
      //bc/ad years
      era: function era(str) {
        if (str !== undefined) {
          var s = this.clone();
          str = str.toLowerCase(); //TODO: there is no year-0AD i think. may have off-by-1 error here

          var year = s.d.getFullYear(); //make '1992' into 1992bc..

          if (str === 'bc' && year > 0) {
            s.epoch = set.year(s, year * -1);
          } //make '1992bc' into '1992'


          if (str === 'ad' && year < 0) {
            s.epoch = set.year(s, year * -1);
          }

          return s;
        }

        if (this.d.getFullYear() < 0) {
          return 'BC';
        }

        return 'AD';
      },
      // 2019 -> 2010
      decade: function decade(input) {
        if (input !== undefined) {
          input = String(input);
          input = input.replace(/([0-9])'?s$/, '$1'); //1950's

          input = input.replace(/([0-9])(th|rd|st|nd)/, '$1'); //fix ordinals

          if (!input) {
            console.warn('Spacetime: Invalid decade input');
            return this;
          } // assume 20th century?? for '70s'.


          if (input.length === 2 && /[0-9][0-9]/.test(input)) {
            input = '19' + input;
          }

          var year = Number(input);

          if (isNaN(year)) {
            return this;
          } // round it down to the decade


          year = Math.floor(year / 10) * 10;
          return this.year(year); //.startOf('decade')
        }

        return this.startOf('decade').year();
      },
      // 1950 -> 19+1
      century: function century(input) {
        if (input !== undefined) {
          if (typeof input === 'string') {
            input = input.replace(/([0-9])(th|rd|st|nd)/, '$1'); //fix ordinals

            input = input.replace(/([0-9]+) ?(b\.?c\.?|a\.?d\.?)/i, function (a, b, c) {
              if (c.match(/b\.?c\.?/i)) {
                b = '-' + b;
              }

              return b;
            });
            input = input.replace(/c$/, ''); //20thC
          }

          var year = Number(input);

          if (isNaN(input)) {
            console.warn('Spacetime: Invalid century input');
            return this;
          } // there is no century 0


          if (year === 0) {
            year = 1;
          }

          if (year >= 0) {
            year = (year - 1) * 100;
          } else {
            year = (year + 1) * 100;
          }

          return this.year(year);
        } // century getter


        var num = this.startOf('century').year();
        num = Math.floor(num / 100);

        if (num < 0) {
          return num - 1;
        }

        return num + 1;
      },
      // 2019 -> 2+1
      millenium: function millenium(input) {
        if (input !== undefined) {
          if (typeof input === 'string') {
            input = input.replace(/([0-9])(th|rd|st|nd)/, '$1'); //fix ordinals

            input = Number(input);

            if (isNaN(input)) {
              console.warn('Spacetime: Invalid millenium input');
              return this;
            }
          }

          if (input > 0) {
            input -= 1;
          }

          var year = input * 1000; // there is no year 0

          if (year === 0) {
            year = 1;
          }

          return this.year(year);
        } // get the current millenium


        var num = Math.floor(this.year() / 1000);

        if (num >= 0) {
          num += 1;
        }

        return num;
      }
    };
    var _03Year = methods$3;

    var methods$4 = Object.assign({}, _01Time, _02Date, _03Year); //aliases

    methods$4.milliseconds = methods$4.millisecond;
    methods$4.seconds = methods$4.second;
    methods$4.minutes = methods$4.minute;
    methods$4.hours = methods$4.hour;
    methods$4.hour24 = methods$4.hour;
    methods$4.h12 = methods$4.hour12;
    methods$4.h24 = methods$4.hour24;
    methods$4.days = methods$4.day;

    var addMethods = function addMethods(Space) {
      //hook the methods into prototype
      Object.keys(methods$4).forEach(function (k) {
        Space.prototype[k] = methods$4[k];
      });
    };

    var query = addMethods;

    var isLeapYear$1 = fns.isLeapYear;

    var getMonthLength = function getMonthLength(month, year) {
      if (month === 1 && isLeapYear$1(year)) {
        return 29;
      }

      return monthLengths_1[month];
    }; //month is the one thing we 'model/compute'
    //- because ms-shifting can be off by enough


    var rollMonth = function rollMonth(want, old) {
      //increment year
      if (want.month > 0) {
        var years = parseInt(want.month / 12, 10);
        want.year = old.year() + years;
        want.month = want.month % 12;
      } else if (want.month < 0) {
        //decrement year
        var _years = Math.floor(Math.abs(want.month) / 13, 10);

        _years = Math.abs(_years) + 1;
        want.year = old.year() - _years; //ignore extras

        want.month = want.month % 12;
        want.month = want.month + 12;

        if (want.month === 12) {
          want.month = 0;
        }
      }

      return want;
    };

    var rollDaysDown = function rollDaysDown(want, old, sum) {
      want.year = old.year();
      want.month = old.month();
      var date = old.date();
      want.date = date - Math.abs(sum);

      while (want.date < 1) {
        want.month -= 1;

        if (want.month < 0) {
          want.month = 11;
          want.year -= 1;
        }

        var max = getMonthLength(want.month, want.year);
        want.date += max;
      }

      return want;
    }; // briefly support day=33 (this does not need to be perfect.)


    var rollDaysUp = function rollDaysUp(want, old, sum) {
      var year = old.year();
      var month = old.month();
      var max = getMonthLength(month, year);

      while (sum > max) {
        sum -= max;
        month += 1;

        if (month >= 12) {
          month -= 12;
          year += 1;
        }

        max = getMonthLength(month, year);
      }

      want.month = month;
      want.date = sum;
      return want;
    };

    var _model = {
      months: rollMonth,
      days: rollDaysUp,
      daysBack: rollDaysDown
    };

    // but briefly:
    // millisecond-math, and some post-processing covers most-things
    // we 'model' the calendar here only a little bit
    // and that usually works-out...

    var order$1 = ['millisecond', 'second', 'minute', 'hour', 'date', 'month'];
    var keep = {
      second: order$1.slice(0, 1),
      minute: order$1.slice(0, 2),
      quarterhour: order$1.slice(0, 2),
      hour: order$1.slice(0, 3),
      date: order$1.slice(0, 4),
      month: order$1.slice(0, 4),
      quarter: order$1.slice(0, 4),
      season: order$1.slice(0, 4),
      year: order$1,
      decade: order$1,
      century: order$1
    };
    keep.week = keep.hour;
    keep.season = keep.date;
    keep.quarter = keep.date; // Units need to be dst adjuested

    var dstAwareUnits = {
      year: true,
      quarter: true,
      season: true,
      month: true,
      week: true,
      day: true
    };
    var keepDate = {
      month: true,
      quarter: true,
      season: true,
      year: true
    };

    var addMethods$1 = function addMethods(SpaceTime) {
      SpaceTime.prototype.add = function (num, unit) {
        var s = this.clone();

        if (!unit || num === 0) {
          return s; //don't bother
        }

        var old = this.clone();
        unit = fns.normalize(unit); //move forward by the estimated milliseconds (rough)

        if (milliseconds[unit]) {
          s.epoch += milliseconds[unit] * num;
        } else if (unit === 'week') {
          s.epoch += milliseconds.day * (num * 7);
        } else if (unit === 'quarter' || unit === 'season') {
          s.epoch += milliseconds.month * (num * 4);
        } else if (unit === 'season') {
          s.epoch += milliseconds.month * (num * 4);
        } else if (unit === 'quarterhour') {
          s.epoch += milliseconds.minute * 15 * num;
        } //now ensure our milliseconds/etc are in-line


        var want = {};

        if (keep[unit]) {
          keep[unit].forEach(function (u) {
            want[u] = old[u]();
          });
        }

        if (dstAwareUnits[unit]) {
          var diff = old.timezone().current.offset - s.timezone().current.offset;
          s.epoch += diff * 3600 * 1000;
        } //ensure month/year has ticked-over


        if (unit === 'month') {
          want.month = old.month() + num; //month is the one unit we 'model' directly

          want = _model.months(want, old);
        } //support coercing a week, too


        if (unit === 'week') {
          var sum = old.date() + num * 7;

          if (sum <= 28 && sum > 1) {
            want.date = sum;
          }
        } //support 25-hour day-changes on dst-changes
        else if (unit === 'date') {
            if (num < 0) {
              want = _model.daysBack(want, old, num);
            } else {
              //specify a naive date number, if it's easy to do...
              var _sum = old.date() + num; // ok, model this one too


              want = _model.days(want, old, _sum);
            } //manually punt it if we haven't moved at all..


            if (num !== 0 && old.isSame(s, 'day')) {
              want.date = old.date() + num;
            }
          } //ensure year has changed (leap-years)
          else if (unit === 'year' && s.year() === old.year()) {
              s.epoch += milliseconds.week;
            } //these are easier
            else if (unit === 'decade') {
                want.year = s.year() + 10;
              } else if (unit === 'century') {
                want.year = s.year() + 100;
              } //keep current date, unless the month doesn't have it.


        if (keepDate[unit]) {
          var max = monthLengths_1[want.month];
          want.date = old.date();

          if (want.date > max) {
            want.date = max;
          }
        }

        walk_1(s, want);
        return s;
      }; //subtract is only add *-1


      SpaceTime.prototype.subtract = function (num, unit) {
        var s = this.clone();
        return s.add(num * -1, unit);
      }; //add aliases


      SpaceTime.prototype.minus = SpaceTime.prototype.subtract;
      SpaceTime.prototype.plus = SpaceTime.prototype.add;
    };

    var add = addMethods$1;

    //make a string, for easy comparison between dates
    var print = {
      millisecond: function millisecond(s) {
        return s.epoch;
      },
      second: function second(s) {
        return [s.year(), s.month(), s.date(), s.hour(), s.minute(), s.second()].join('-');
      },
      minute: function minute(s) {
        return [s.year(), s.month(), s.date(), s.hour(), s.minute()].join('-');
      },
      hour: function hour(s) {
        return [s.year(), s.month(), s.date(), s.hour()].join('-');
      },
      day: function day(s) {
        return [s.year(), s.month(), s.date()].join('-');
      },
      week: function week(s) {
        return [s.year(), s.week()].join('-');
      },
      month: function month(s) {
        return [s.year(), s.month()].join('-');
      },
      quarter: function quarter(s) {
        return [s.year(), s.quarter()].join('-');
      },
      year: function year(s) {
        return s.year();
      }
    };
    print.date = print.day;

    var addMethods$2 = function addMethods(SpaceTime) {
      SpaceTime.prototype.isSame = function (b, unit) {
        var a = this;

        if (!unit) {
          return null;
        }

        if (typeof b === 'string' || typeof b === 'number') {
          b = new SpaceTime(b, this.timezone.name);
        } //support 'seconds' aswell as 'second'


        unit = unit.replace(/s$/, '');

        if (print[unit]) {
          return print[unit](a) === print[unit](b);
        }

        return null;
      };
    };

    var same = addMethods$2;

    var addMethods$3 = function addMethods(SpaceTime) {
      var methods = {
        isAfter: function isAfter(d) {
          d = fns.beADate(d, this);
          var epoch = fns.getEpoch(d);

          if (epoch === null) {
            return null;
          }

          return this.epoch > epoch;
        },
        isBefore: function isBefore(d) {
          d = fns.beADate(d, this);
          var epoch = fns.getEpoch(d);

          if (epoch === null) {
            return null;
          }

          return this.epoch < epoch;
        },
        isEqual: function isEqual(d) {
          d = fns.beADate(d, this);
          var epoch = fns.getEpoch(d);

          if (epoch === null) {
            return null;
          }

          return this.epoch === epoch;
        },
        isBetween: function isBetween(start, end) {
          var isInclusive = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
          start = fns.beADate(start, this);
          end = fns.beADate(end, this);
          var startEpoch = fns.getEpoch(start);

          if (startEpoch === null) {
            return null;
          }

          var endEpoch = fns.getEpoch(end);

          if (endEpoch === null) {
            return null;
          }

          if (isInclusive) {
            return this.isBetween(start, end) || this.isEqual(start) || this.isEqual(end);
          }

          return startEpoch < this.epoch && this.epoch < endEpoch;
        }
      }; //hook them into proto

      Object.keys(methods).forEach(function (k) {
        SpaceTime.prototype[k] = methods[k];
      });
    };

    var compare = addMethods$3;

    var addMethods$4 = function addMethods(SpaceTime) {
      var methods = {
        i18n: function i18n(data) {
          //change the day names
          if (fns.isObject(data.days)) {
            days.set(data.days);
          } //change the month names


          if (fns.isObject(data.months)) {
            months.set(data.months);
          }
        }
      }; //hook them into proto

      Object.keys(methods).forEach(function (k) {
        SpaceTime.prototype[k] = methods[k];
      });
    };

    var i18n = addMethods$4;

    var timezones = unpack; //fake timezone-support, for fakers (es5 class)

    var SpaceTime = function SpaceTime(input$1, tz) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      //the holy moment
      this.epoch = null; //the shift for the given timezone

      this.tz = find(tz, timezones); //whether to output warnings to console

      this.silent = options.silent || true; // favour british interpretation of 02/02/2018, etc

      this.british = options.dmy || options.british; //does the week start on sunday, or monday:

      this._weekStart = 1; //default to monday

      if (options.weekStart !== undefined) {
        this._weekStart = options.weekStart;
      } // the reference today date object, (for testing)


      this._today = {};

      if (options.today !== undefined) {
        this._today = options.today;
      } //add getter/setters


      Object.defineProperty(this, 'd', {
        //return a js date object
        get: function get() {
          var offset = quick(this); //every computer is somewhere- get this computer's built-in offset

          var bias = new Date(this.epoch).getTimezoneOffset() || 0; //movement

          var shift = bias + offset * 60; //in minutes

          shift = shift * 60 * 1000; //in ms
          //remove this computer's offset

          var epoch = this.epoch + shift;
          var d = new Date(epoch);
          return d;
        }
      }); //add this data on the object, to allow adding new timezones

      Object.defineProperty(this, 'timezones', {
        get: function get() {
          return timezones;
        },
        set: function set(obj) {
          timezones = obj;
          return obj;
        }
      }); //parse the various formats

      var tmp = input(this, input$1, tz);
      this.epoch = tmp.epoch;
    }; //(add instance methods to prototype)


    Object.keys(methods_1).forEach(function (k) {
      SpaceTime.prototype[k] = methods_1[k];
    }); // ¯\_(ツ)_/¯

    SpaceTime.prototype.clone = function () {
      return new SpaceTime(this.epoch, this.tz, {
        silent: this.silent,
        weekStart: this._weekStart,
        today: this._today
      });
    }; //return native date object at the same epoch


    SpaceTime.prototype.toLocalDate = function () {
      return new Date(this.epoch);
    }; //append more methods


    query(SpaceTime);
    add(SpaceTime);
    same(SpaceTime);
    compare(SpaceTime);
    i18n(SpaceTime);
    var spacetime = SpaceTime;

    var whereIts = function whereIts(a, b) {
      var start = new spacetime(null);
      var end = new spacetime(null);
      start = start.time(a); //if b is undefined, use as 'within one hour'

      if (b) {
        end = end.time(b);
      } else {
        end = start.add(59, 'minutes');
      }

      var startHour = start.hour();
      var endHour = end.hour();
      var tzs = Object.keys(start.timezones).filter(function (tz) {
        if (tz.indexOf('/') === -1) {
          return false;
        }

        var m = new spacetime(null, tz);
        var hour = m.hour(); //do 'calendar-compare' not real-time-compare

        if (hour >= startHour && hour <= endHour) {
          //test minutes too, if applicable
          if (hour === startHour && m.minute() < start.minute()) {
            return false;
          }

          if (hour === endHour && m.minute() > end.minute()) {
            return false;
          }

          return true;
        }

        return false;
      });
      return tzs;
    };

    var whereIts_1 = whereIts;

    var _version = '6.6.0';

    var main$1 = function main(input, tz, options) {
      return new spacetime(input, tz, options);
    }; // set all properties of a given 'today' object


    var setToday = function setToday(s) {
      var today = s._today || {};
      Object.keys(today).forEach(function (k) {
        s = s[k](today[k]);
      });
      return s;
    }; //some helper functions on the main method


    main$1.now = function (tz, options) {
      var s = new spacetime(new Date().getTime(), tz, options);
      s = setToday(s);
      return s;
    };

    main$1.today = function (tz, options) {
      var s = new spacetime(new Date().getTime(), tz, options);
      s = setToday(s);
      return s.startOf('day');
    };

    main$1.tomorrow = function (tz, options) {
      var s = new spacetime(new Date().getTime(), tz, options);
      s = setToday(s);
      return s.add(1, 'day').startOf('day');
    };

    main$1.yesterday = function (tz, options) {
      var s = new spacetime(new Date().getTime(), tz, options);
      s = setToday(s);
      return s.subtract(1, 'day').startOf('day');
    };

    main$1.extend = function (obj) {
      Object.keys(obj).forEach(function (k) {
        spacetime.prototype[k] = obj[k];
      });
      return this;
    }; //find tz by time


    main$1.whereIts = whereIts_1;
    main$1.version = _version; //aliases:

    main$1.plugin = main$1.extend;
    var src = main$1;

    const topk = function (arr) {
      let obj = {};
      arr.forEach((a) => {
        obj[a] = obj[a] || 0;
        obj[a] += 1;
      });
      let res = Object.keys(obj).map((k) => [k, obj[k]]);
      return res.sort((a, b) => (a[1] > b[1] ? -1 : 0)).reverse()
    };

    var colors = [
      '#6699cc', //blue:
      '#6accb2', //green:
      '#e1e6b3', //yellow:
      '#cc7066', //red:
      '#F2C0BB', //pink:
      '#705E5C', //brown:
      '#cc8a66', //orange:
      '#d8b3e6', //purple:
      '#335799', //navy:
      '#7f9c6c', //olive:
      '#735873', //fuscia:
      '#e6d7b3', //beige:
      '#8C8C88', //slate:
      '#9c896c', //suede:
      '#603a39', //burnt:
      '#50617A', //sea:
      '#2D85A8', //sky:
      '#303b50', //night:
      '#914045', //rouge:
      '#838B91', //grey:
      '#C4ABAB', //mud:
      '#275291', //royal:
      '#cc6966', //cherry:
      '#e6b3bc', //tulip:
      '#D68881', //rose:
      '#AB5850', //fire:
      '#72697D', //greyblue:
      '#8BA3A2', //greygreen:
      '#978BA3', //greypurple:
      '#6D5685', //burn:

      // slategrey: '#bfb0b3',
      // light: '#a3a5a5',
      // lighter: '#d7d5d2',
      // fudge: '#4d4d4d',
      // lightgrey: '#949a9e',
      // white: '#fbfbfb',
      // dimgrey: '#606c74',
      // softblack: '#463D4F',
      // dark: '#443d3d',
      // black: '#333333',
    ];

    let u = window.localStorage.getItem('user') || '';
    let user = writable(u);
    let p = window.localStorage.getItem('pass') || '';
    let pass = writable(p);

    let data$1 = writable({
      _id: u,
      dates: {},
    });

    let date = writable(src.today());

    let parsed = derived(data$1, ($data) => {
      let days = {};
      let tags = [];
      Object.keys($data.dates || {}).forEach((k) => {
        let txt = $data.dates[k];
        txt.split(/\n/).forEach((line) => {
          line = line.trim();
          let found = line.match(/^\.(\w+)/);
          if (found) {
            days[k] = days[k] || [];
            days[k].push(found[1]);
            tags.push(found[1]);
          }
        });
      });
      let tagColors = {};
      tags = topk(tags).map((a, i) => {
        let c = colors[i] || 'steelblue';
        tagColors[a[0]] = c;
        return {
          tag: a[0],
          count: a[1],
          color: c,
        }
      });

      return {
        days: days,
        tags: tags,
        colors: tagColors,
      }
    });

    function debounce(func, wait, immediate) {
      let timeout;
      return function () {
        let context = this,
          args = arguments;
        let later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      }
    }

    /* src/user/DayPick.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/user/DayPick.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (87:6) {#each Array(weekNum) as _, i}
    function create_each_block(ctx) {
    	let div;
    	let section0;
    	let t1;
    	let section1;
    	let t3;
    	let section2;
    	let t5;
    	let section3;
    	let t7;
    	let section4;
    	let t9;
    	let section5;
    	let t11;
    	let section6;
    	let t13;

    	const block = {
    		c: function create() {
    			div = element("div");
    			section0 = element("section");
    			section0.textContent = "monday";
    			t1 = space();
    			section1 = element("section");
    			section1.textContent = "tuesday";
    			t3 = space();
    			section2 = element("section");
    			section2.textContent = "wednesday";
    			t5 = space();
    			section3 = element("section");
    			section3.textContent = "thursday";
    			t7 = space();
    			section4 = element("section");
    			section4.textContent = "friday";
    			t9 = space();
    			section5 = element("section");
    			section5.textContent = "saturday";
    			t11 = space();
    			section6 = element("section");
    			section6.textContent = "sunday";
    			t13 = space();
    			attr_dev(section0, "class", "svelte-w9izv6");
    			add_location(section0, file, 88, 10, 2015);
    			attr_dev(section1, "class", "svelte-w9izv6");
    			add_location(section1, file, 89, 10, 2051);
    			attr_dev(section2, "class", "svelte-w9izv6");
    			add_location(section2, file, 90, 10, 2088);
    			attr_dev(section3, "class", "svelte-w9izv6");
    			add_location(section3, file, 91, 10, 2127);
    			attr_dev(section4, "class", "svelte-w9izv6");
    			add_location(section4, file, 92, 10, 2165);
    			attr_dev(section5, "class", "svelte-w9izv6");
    			add_location(section5, file, 93, 10, 2201);
    			attr_dev(section6, "class", "svelte-w9izv6");
    			add_location(section6, file, 94, 10, 2239);
    			attr_dev(div, "class", "week svelte-w9izv6");
    			add_location(div, file, 87, 8, 1986);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, section0);
    			append_dev(div, t1);
    			append_dev(div, section1);
    			append_dev(div, t3);
    			append_dev(div, section2);
    			append_dev(div, t5);
    			append_dev(div, section3);
    			append_dev(div, t7);
    			append_dev(div, section4);
    			append_dev(div, t9);
    			append_dev(div, section5);
    			append_dev(div, t11);
    			append_dev(div, section6);
    			append_dev(div, t13);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(87:6) {#each Array(weekNum) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value = Array(weekNum);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row grid svelte-w9izv6");
    			set_style(div0, "width", weekNum * (w - 1) + "px");
    			add_location(div0, file, 85, 4, 1882);
    			attr_dev(div1, "class", "container shadow svelte-w9izv6");
    			add_location(div1, file, 84, 2, 1811);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file, 82, 0, 1687);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div1_binding*/ ctx[8](div1);

    			if (!mounted) {
    				dispose = listen_dev(
    					div1,
    					"scroll",
    					function () {
    						if (is_function(/*onScroll*/ ctx[1])) /*onScroll*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			/*div1_binding*/ ctx[8](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const h = 75;
    const w = 300;
    const weekNum = 4;

    function instance($$self, $$props, $$invalidate) {
    	let { date = null } = $$props; //thursday
    	date = src(date);
    	let el;
    	let topLeft = date.clone().startOf("week").minus(weekNum - 1, "weeks");

    	// set our indexes
    	let days = {
    		Monday: 0,
    		Tuesday: 1,
    		Wednesday: 2,
    		Thursday: 3,
    		Friday: 4,
    		Saturday: 5,
    		Sunday: 6
    	};

    	let dayArr = Object.keys(days);
    	let yIndex = days[date.format("day")];
    	let xIndex = weekNum - 1;

    	let onScroll = () => {
    		
    	};

    	onMount(() => {
    		$$invalidate(0, el.scrollTop = yIndex * h, el);
    		$$invalidate(0, el.scrollLeft = xIndex * w, el);
    		console.log("mount");

    		$$invalidate(1, onScroll = debounce(
    			function (e) {
    				yIndex = Math.round(el.scrollTop / h);
    				xIndex = Math.round(el.scrollLeft / w);
    				console.log("scrolled");
    				console.log(xIndex);
    				$$invalidate(2, date = topLeft.day(dayArr[yIndex]));
    				$$invalidate(2, date = date.add(xIndex, "weeks"));
    			},
    			300
    		));
    	});

    	const writable_props = ["date"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<DayPick> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DayPick", $$slots, []);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		spacetime: src,
    		debounce,
    		date,
    		h,
    		w,
    		weekNum,
    		el,
    		topLeft,
    		days,
    		dayArr,
    		yIndex,
    		xIndex,
    		onScroll
    	});

    	$$self.$inject_state = $$props => {
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    		if ("el" in $$props) $$invalidate(0, el = $$props.el);
    		if ("topLeft" in $$props) topLeft = $$props.topLeft;
    		if ("days" in $$props) days = $$props.days;
    		if ("dayArr" in $$props) dayArr = $$props.dayArr;
    		if ("yIndex" in $$props) yIndex = $$props.yIndex;
    		if ("xIndex" in $$props) xIndex = $$props.xIndex;
    		if ("onScroll" in $$props) $$invalidate(1, onScroll = $$props.onScroll);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [el, onScroll, date, yIndex, xIndex, topLeft, days, dayArr, div1_binding];
    }

    class DayPick extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { date: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DayPick",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get date() {
    		throw new Error("<DayPick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<DayPick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function resize({ target }) {
      target.style.height = '1px';
      target.style.height = +target.scrollHeight + 'px';
    }
    function resizable(el) {
      resize({ target: el });
      el.style.overflow = 'hidden';
      el.addEventListener('input', resize);

      return {
        destroy: () => el.removeEventListener('input', resize),
      }
    }

    /* src/user/Input.svelte generated by Svelte v3.23.0 */
    const file$1 = "src/user/Input.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let t0_value = src(/*$date*/ ctx[2]).format("{day-short} {month} {date}") + "";
    	let t0;
    	let t1;
    	let div2;
    	let textarea;
    	let t2;
    	let div1;
    	let updating_date;
    	let current;
    	let mounted;
    	let dispose;

    	function daypick_date_binding(value) {
    		/*daypick_date_binding*/ ctx[9].call(null, value);
    	}

    	let daypick_props = {};

    	if (/*$date*/ ctx[2] !== void 0) {
    		daypick_props.date = /*$date*/ ctx[2];
    	}

    	const daypick = new DayPick({ props: daypick_props, $$inline: true });
    	binding_callbacks.push(() => bind(daypick, "date", daypick_date_binding));

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			div1 = element("div");
    			create_component(daypick.$$.fragment);
    			attr_dev(div0, "class", "f1");
    			set_style(div0, "text-align", "left");
    			add_location(div0, file$1, 67, 0, 1352);
    			attr_dev(textarea, "class", "note svelte-19jyfmd");
    			attr_dev(textarea, "spellcheck", "false");
    			attr_dev(textarea, "resizable", "false");
    			add_location(textarea, file$1, 69, 2, 1485);
    			attr_dev(div1, "class", "picker svelte-19jyfmd");
    			add_location(div1, file$1, 76, 2, 1640);
    			attr_dev(div2, "class", "container row svelte-19jyfmd");
    			add_location(div2, file$1, 68, 0, 1455);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*$data*/ ctx[3].dates[/*fmt*/ ctx[0]]);
    			/*textarea_binding*/ ctx[8](textarea);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(daypick, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[7]),
    					listen_dev(textarea, "input", /*didChange*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$date*/ 4) && t0_value !== (t0_value = src(/*$date*/ ctx[2]).format("{day-short} {month} {date}") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$data, fmt*/ 9) {
    				set_input_value(textarea, /*$data*/ ctx[3].dates[/*fmt*/ ctx[0]]);
    			}

    			const daypick_changes = {};

    			if (!updating_date && dirty & /*$date*/ 4) {
    				updating_date = true;
    				daypick_changes.date = /*$date*/ ctx[2];
    				add_flush_callback(() => updating_date = false);
    			}

    			daypick.$set(daypick_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(daypick.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(daypick.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			/*textarea_binding*/ ctx[8](null);
    			destroy_component(daypick);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $date;
    	let $data;
    	validate_store(date, "date");
    	component_subscribe($$self, date, $$value => $$invalidate(2, $date = $$value));
    	validate_store(data$1, "data");
    	component_subscribe($$self, data$1, $$value => $$invalidate(3, $data = $$value));

    	let { write = () => {
    		
    	} } = $$props;

    	let value = "empty";
    	let fmt = $date.format("iso-short");

    	// make it resizable
    	let el = null;

    	onMount(() => {
    		// resizable(el)
    		el.focus();
    	});

    	// when the date changes
    	date.subscribe(d => {
    		$$invalidate(0, fmt = $date.format("iso-short"));
    		value = $data.dates[fmt];
    	});

    	// when the dataset changes
    	data$1.subscribe(val => {
    		if (val && val.dates) {
    			value = val.dates[fmt];
    		} else {
    			value = "";
    		}
    	});

    	// send update to server
    	const didChange = debounce(
    		e => {
    			data$1.update(val => {
    				val.dates = val.dates || {};
    				val.dates[fmt] = value;

    				if (value === "") {
    					delete val.dates[fmt];
    				}

    				write();
    				return val;
    			});
    		},
    		750
    	);

    	const writable_props = ["write"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Input", $$slots, []);

    	function textarea_input_handler() {
    		$data.dates[fmt] = this.value;
    		data$1.set($data);
    		$$invalidate(0, fmt);
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, el = $$value);
    		});
    	}

    	function daypick_date_binding(value) {
    		$date = value;
    		date.set($date);
    	}

    	$$self.$set = $$props => {
    		if ("write" in $$props) $$invalidate(5, write = $$props.write);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		data: data$1,
    		date,
    		debounce,
    		DayPick,
    		spacetime: src,
    		resizable,
    		write,
    		value,
    		fmt,
    		el,
    		didChange,
    		$date,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("write" in $$props) $$invalidate(5, write = $$props.write);
    		if ("value" in $$props) value = $$props.value;
    		if ("fmt" in $$props) $$invalidate(0, fmt = $$props.fmt);
    		if ("el" in $$props) $$invalidate(1, el = $$props.el);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		fmt,
    		el,
    		$date,
    		$data,
    		didChange,
    		write,
    		value,
    		textarea_input_handler,
    		textarea_binding,
    		daypick_date_binding
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { write: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get write() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set write(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule$1(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace$1 (n) {
    	return n && n['default'] || n;
    }

    var fns$1 = createCommonjsModule$1(function (module, exports) {
    //git:blame @JuliasCaesar https://www.timeanddate.com/date/leapyear.html
    exports.isLeapYear = year => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    // unsurprisingly-nasty `typeof date` call
    exports.isDate = d => Object.prototype.toString.call(d) === '[object Date]' && !isNaN(d.valueOf());
    exports.isArray = input => Object.prototype.toString.call(input) === '[object Array]';
    exports.isObject = input => Object.prototype.toString.call(input) === '[object Object]';

    exports.zeroPad = (str, len = 2) => {
      let pad = '0';
      str = str + '';
      return str.length >= len ? str : new Array(len - str.length + 1).join(pad) + str
    };

    exports.titleCase = str => {
      if (!str) {
        return ''
      }
      return str[0].toUpperCase() + str.substr(1)
    };

    exports.ordinal = i => {
      let j = i % 10;
      let k = i % 100;
      if (j === 1 && k !== 11) {
        return i + 'st'
      }
      if (j === 2 && k !== 12) {
        return i + 'nd'
      }
      if (j === 3 && k !== 13) {
        return i + 'rd'
      }
      return i + 'th'
    };

    //strip 'st' off '1st'..
    exports.toCardinal = str => {
      str = String(str);
      str = str.replace(/([0-9])(st|nd|rd|th)$/i, '$1');
      return parseInt(str, 10)
    };

    //used mostly for cleanup of unit names, like 'months'
    exports.normalize = (str = '') => {
      str = str.toLowerCase().trim();
      str = str.replace(/ies$/, 'y'); //'centuries'
      str = str.replace(/s$/, '');
      str = str.replace(/-/g, '');
      if (str === 'day') {
        return 'date'
      }
      return str
    };

    exports.getEpoch = tmp => {
      //support epoch
      if (typeof tmp === 'number') {
        return tmp
      }
      //suport date objects
      if (exports.isDate(tmp)) {
        return tmp.getTime()
      }
      if (tmp.epoch) {
        return tmp.epoch
      }
      return null
    };

    //make sure this input is a spacetime obj
    exports.beADate = (d, s) => {
      if (exports.isObject(d) === false) {
        return s.clone().set(d)
      }
      return d
    };

    exports.formatTimezone = (offset, delimiter = '') => {
      const absOffset = Math.abs(offset);
      const sign = offset > 0 ? '+' : '-';
      return `${sign}${exports.zeroPad(absOffset)}${delimiter}00`
    };
    });
    var fns_1$1 = fns$1.isLeapYear;
    var fns_2$1 = fns$1.isDate;
    var fns_3$1 = fns$1.isArray;
    var fns_4$1 = fns$1.isObject;
    var fns_5$1 = fns$1.zeroPad;
    var fns_6$1 = fns$1.titleCase;
    var fns_7$1 = fns$1.ordinal;
    var fns_8$1 = fns$1.toCardinal;
    var fns_9$1 = fns$1.normalize;
    var fns_10$1 = fns$1.getEpoch;
    var fns_11$1 = fns$1.beADate;
    var fns_12$1 = fns$1.formatTimezone;

    const zeroPad$1 = fns$1.zeroPad;

    const toString = d =>
      zeroPad$1(d.getMonth() + 1) + '/' + zeroPad$1(d.getDate()) + ':' + zeroPad$1(d.getHours());

    // a timezone will begin with a specific offset in january
    // then some will switch to something else between november-march
    const shouldChange$1 = (epoch, start, end, defaultOffset) => {
      //note: this has a cray order-of-operations issue
      //we can't get the date, without knowing the timezone, and vice-versa
      //it's possible that we can miss a dst-change by a few hours.
      let d = new Date(epoch);
      //(try to mediate this a little?)
      let bias = d.getTimezoneOffset() || 0;
      let shift = bias + defaultOffset * 60; //in minutes
      shift = shift * 60 * 1000; //in ms
      d = new Date(epoch + shift);

      let current = toString(d);
      //eg. is it after ~november?
      if (current >= start) {
        //eg. is it before ~march~ too?
        if (current < end) {
          return true
        }
      }
      return false
    };
    var summerTime$1 = shouldChange$1;

    // this method avoids having to do a full dst-calculation on every operation
    // it reproduces some things in ./index.js, but speeds up spacetime considerably
    const quickOffset$1 = s => {
      let zones = s.timezones;
      let obj = zones[s.tz];
      if (obj === undefined) {
        console.warn("Warning: couldn't find timezone " + s.tz);
        return 0
      }
      if (obj.dst === undefined) {
        return obj.offset
      }

      //get our two possible offsets
      let jul = obj.offset;
      let dec = obj.offset + 1; // assume it's the same for now
      if (obj.hem === 'n') {
        dec = jul - 1;
      }
      let split = obj.dst.split('->');
      let inSummer = summerTime$1(s.epoch, split[0], split[1], jul);
      if (inSummer === true) {
        return jul
      }
      return dec
    };
    var quick$1 = quickOffset$1;

    var _build$2 = {
    	"9|s": "2/dili,2/jayapura",
    	"9|n": "2/chita,2/khandyga,2/pyongyang,2/seoul,2/tokyo,11/palau",
    	"9.5|s|04/07:03->10/06:02": "4/adelaide,4/broken_hill,4/south,4/yancowinna",
    	"9.5|s": "4/darwin,4/north",
    	"8|s": "12/casey,2/kuala_lumpur,2/makassar,2/singapore,4/perth,4/west",
    	"8|n|03/25:03->09/29:23": "2/ulan_bator",
    	"8|n": "2/brunei,2/choibalsan,2/chongqing,2/chungking,2/harbin,2/hong_kong,2/irkutsk,2/kuching,2/macao,2/macau,2/manila,2/shanghai,2/taipei,2/ujung_pandang,2/ulaanbaatar",
    	"8.75|s": "4/eucla",
    	"7|s": "12/davis,2/jakarta,9/christmas",
    	"7|n": "2/bangkok,2/barnaul,2/ho_chi_minh,2/hovd,2/krasnoyarsk,2/novokuznetsk,2/novosibirsk,2/phnom_penh,2/pontianak,2/saigon,2/tomsk,2/vientiane",
    	"6|s": "12/vostok",
    	"6|n": "2/almaty,2/bishkek,2/dacca,2/dhaka,2/kashgar,2/omsk,2/qyzylorda,2/thimbu,2/thimphu,2/urumqi,9/chagos",
    	"6.5|n": "2/rangoon,9/cocos",
    	"5|s": "12/mawson,9/kerguelen",
    	"5|n": "2/aqtau,2/aqtobe,2/ashgabat,2/ashkhabad,2/atyrau,2/baku,2/dushanbe,2/karachi,2/oral,2/samarkand,2/tashkent,2/yekaterinburg,9/maldives",
    	"5.75|n": "2/kathmandu,2/katmandu",
    	"5.5|n": "2/calcutta,2/colombo,2/kolkata",
    	"4|s": "9/reunion",
    	"4|n": "2/dubai,2/muscat,2/tbilisi,2/yerevan,8/astrakhan,8/samara,8/saratov,8/ulyanovsk,8/volgograd,2/volgograd,9/mahe,9/mauritius",
    	"4.5|n|03/22:00->09/21:24": "2/tehran",
    	"4.5|n": "2/kabul",
    	"3|s": "12/syowa,9/antananarivo",
    	"3|n|03/31:03->10/27:04": "2/nicosia,8/athens,8/bucharest,8/helsinki,8/kiev,8/mariehamn,8/nicosia,8/riga,8/sofia,8/tallinn,8/uzhgorod,8/vilnius,8/zaporozhye",
    	"3|n|03/31:02->10/27:03": "8/chisinau,8/tiraspol",
    	"3|n|03/31:00->10/26:24": "2/beirut",
    	"3|n|03/29:02->10/27:02": "2/jerusalem,2/tel_aviv",
    	"3|n|03/29:00->10/26:01": "2/gaza,2/hebron",
    	"3|n|03/29:00->10/25:01": "2/amman",
    	"3|n|03/29:00->10/24:24": "2/damascus",
    	"3|n": "0/addis_ababa,0/asmara,0/asmera,0/dar_es_salaam,0/djibouti,0/juba,0/kampala,0/mogadishu,0/nairobi,2/aden,2/baghdad,2/bahrain,2/istanbul,2/kuwait,2/qatar,2/riyadh,8/istanbul,8/kirov,8/minsk,8/moscow,8/simferopol,9/comoro,9/mayotte",
    	"2|s|03/31:02->10/27:02": "12/troll",
    	"2|s": "0/gaborone,0/harare,0/johannesburg,0/lubumbashi,0/lusaka,0/maputo,0/maseru,0/mbabane",
    	"2|n|03/31:02->10/27:03": "0/ceuta,arctic/longyearbyen,3/jan_mayen,8/amsterdam,8/andorra,8/belgrade,8/berlin,8/bratislava,8/brussels,8/budapest,8/busingen,8/copenhagen,8/gibraltar,8/ljubljana,8/luxembourg,8/madrid,8/malta,8/monaco,8/oslo,8/paris,8/podgorica,8/prague,8/rome,8/san_marino,8/sarajevo,8/skopje,8/stockholm,8/tirane,8/vaduz,8/vatican,8/vienna,8/warsaw,8/zagreb,8/zurich",
    	"2|n": "0/blantyre,0/bujumbura,0/cairo,0/khartoum,0/kigali,0/tripoli,8/kaliningrad",
    	"1|s|04/02:01->09/03:03": "0/windhoek",
    	"1|s": "0/kinshasa,0/luanda",
    	"1|n|05/05:03->06/09:02": "0/casablanca,0/el_aaiun",
    	"1|n|03/31:01->10/27:02": "3/canary,3/faeroe,3/faroe,3/madeira,8/belfast,8/dublin,8/guernsey,8/isle_of_man,8/jersey,8/lisbon,8/london",
    	"1|n": "0/algiers,0/bangui,0/brazzaville,0/douala,0/lagos,0/libreville,0/malabo,0/ndjamena,0/niamey,0/porto-novo,0/tunis",
    	"14|n": "11/kiritimati",
    	"13|s|04/07:04->09/29:03": "11/apia",
    	"13|s|01/15:02->11/05:03": "11/tongatapu",
    	"13|n": "11/enderbury,11/fakaofo",
    	"12|s|04/07:03->09/29:02": "12/mcmurdo,12/south_pole,11/auckland",
    	"12|s|01/13:03->11/03:02": "11/fiji",
    	"12|n": "2/anadyr,2/kamchatka,2/srednekolymsk,11/funafuti,11/kwajalein,11/majuro,11/nauru,11/tarawa,11/wake,11/wallis",
    	"12.75|s|04/07:03->04/07:02": "11/chatham",
    	"11|s": "12/macquarie,11/bougainville",
    	"11|n": "2/magadan,2/sakhalin,11/efate,11/guadalcanal,11/kosrae,11/noumea,11/pohnpei,11/ponape",
    	"11.5|n": "11/norfolk",
    	"10|s|04/07:03->10/06:02": "4/act,4/canberra,4/currie,4/hobart,4/melbourne,4/nsw,4/sydney,4/tasmania,4/victoria",
    	"10|s": "12/dumontdurville,4/brisbane,4/lindeman,4/queensland",
    	"10|n": "2/ust-nera,2/vladivostok,2/yakutsk,11/chuuk,11/guam,11/port_moresby,11/saipan,11/truk,11/yap",
    	"10.5|s|04/07:01->10/06:02": "4/lhi,4/lord_howe",
    	"0|n|03/31:00->10/27:01": "1/scoresbysund,3/azores",
    	"0|n": "0/abidjan,0/accra,0/bamako,0/banjul,0/bissau,0/conakry,0/dakar,0/freetown,0/lome,0/monrovia,0/nouakchott,0/ouagadougou,0/sao_tome,0/timbuktu,1/danmarkshavn,3/reykjavik,3/st_helena,13/gmt,13/gmt+0,13/gmt-0,13/gmt0,13/greenwich,13/utc,13/universal,13/zulu",
    	"-9|n|03/10:02->11/03:02": "1/adak,1/atka",
    	"-9|n": "11/gambier",
    	"-9.5|n": "11/marquesas",
    	"-8|n|03/10:02->11/03:02": "1/anchorage,1/juneau,1/metlakatla,1/nome,1/sitka,1/yakutat",
    	"-8|n": "11/pitcairn",
    	"-7|n|03/10:02->11/03:02": "1/dawson,1/ensenada,1/los_angeles,1/santa_isabel,1/tijuana,1/vancouver,1/whitehorse,6/pacific,6/yukon,10/bajanorte",
    	"-7|n": "1/creston,1/dawson_creek,1/hermosillo,1/phoenix",
    	"-6|s|04/06:22->09/07:22": "7/easterisland,11/easter",
    	"-6|n|04/07:02->10/27:02": "1/chihuahua,1/mazatlan,10/bajasur",
    	"-6|n|03/10:02->11/03:02": "1/boise,1/cambridge_bay,1/denver,1/edmonton,1/inuvik,1/ojinaga,1/shiprock,1/yellowknife,6/mountain",
    	"-6|n": "1/belize,1/costa_rica,1/el_salvador,1/guatemala,1/managua,1/regina,1/swift_current,1/tegucigalpa,6/east-saskatchewan,6/saskatchewan,11/galapagos",
    	"-5|s": "1/lima,1/rio_branco,5/acre",
    	"-5|n|04/07:02->10/27:02": "1/bahia_banderas,1/merida,1/mexico_city,1/monterrey,10/general",
    	"-5|n|03/12:03->11/05:01": "1/north_dakota",
    	"-5|n|03/10:02->11/03:02": "1/chicago,1/knox_in,1/matamoros,1/menominee,1/rainy_river,1/rankin_inlet,1/resolute,1/winnipeg,6/central",
    	"-5|n": "1/atikokan,1/bogota,1/cancun,1/cayman,1/coral_harbour,1/eirunepe,1/guayaquil,1/jamaica,1/panama,1/porto_acre",
    	"-4|s|05/13:23->08/13:01": "12/palmer",
    	"-4|s|04/06:24->09/08:00": "1/santiago,7/continental",
    	"-4|s|03/23:24->10/06:00": "1/asuncion",
    	"-4|s|02/16:24->11/03:00": "1/campo_grande,1/cuiaba",
    	"-4|s": "1/la_paz,1/manaus,5/west",
    	"-4|n|03/12:03->11/05:01": "1/indiana,1/kentucky",
    	"-4|n|03/10:02->11/03:02": "1/detroit,1/fort_wayne,1/grand_turk,1/indianapolis,1/iqaluit,1/louisville,1/montreal,1/nassau,1/new_york,1/nipigon,1/pangnirtung,1/port-au-prince,1/thunder_bay,1/toronto,6/eastern",
    	"-4|n|03/10:00->11/03:01": "1/havana",
    	"-4|n": "1/anguilla,1/antigua,1/aruba,1/barbados,1/blanc-sablon,1/boa_vista,1/caracas,1/curacao,1/dominica,1/grenada,1/guadeloupe,1/guyana,1/kralendijk,1/lower_princes,1/marigot,1/martinique,1/montserrat,1/port_of_spain,1/porto_velho,1/puerto_rico,1/santo_domingo,1/st_barthelemy,1/st_kitts,1/st_lucia,1/st_thomas,1/st_vincent,1/tortola,1/virgin",
    	"-3|s|02/16:24->11/03:00": "1/sao_paulo,5/east",
    	"-3|s": "1/argentina,1/buenos_aires,1/cordoba,1/fortaleza,1/montevideo,1/punta_arenas,12/rothera,3/stanley",
    	"-3|n|03/10:02->11/03:02": "1/glace_bay,1/goose_bay,1/halifax,1/moncton,1/thule,3/bermuda,6/atlantic",
    	"-3|n": "1/araguaina,1/bahia,1/belem,1/catamarca,1/cayenne,1/jujuy,1/maceio,1/mendoza,1/paramaribo,1/recife,1/rosario,1/santarem",
    	"-2|s": "5/denoronha",
    	"-2|n|03/30:22->10/26:23": "1/godthab",
    	"-2|n|03/10:02->11/03:02": "1/miquelon",
    	"-2|n": "1/noronha,3/south_georgia",
    	"-2.5|n|03/10:02->11/03:02": "1/st_johns,6/newfoundland",
    	"-1|n": "3/cape_verde",
    	"-11|n": "11/midway,11/niue,11/pago_pago,11/samoa",
    	"-10|n": "11/honolulu,11/johnston,11/rarotonga,11/tahiti"
    };

    var _build$1$1 = /*#__PURE__*/Object.freeze({
    	'default': _build$2
    });

    //prefixes for iana names..
    var _prefixes$1 = [
      'africa',
      'america',
      'asia',
      'atlantic',
      'australia',
      'brazil',
      'canada',
      'chile',
      'europe',
      'indian',
      'mexico',
      'pacific',
      'antarctica',
      'etc'
    ];

    var data$2 = getCjsExportFromNamespace$1(_build$1$1);

    let all$1 = {};
    Object.keys(data$2).forEach(k => {
      let split = k.split('|');
      let obj = {
        offset: Number(split[0]),
        hem: split[1]
      };
      if (split[2]) {
        obj.dst = split[2];
      }
      let names = data$2[k].split(',');
      names.forEach(str => {
        str = str.replace(/(^[0-9]+)\//, (before, num) => {
          num = Number(num);
          return _prefixes$1[num] + '/'
        });
        all$1[str] = obj;
      });
    });

    all$1['utc'] = {
      offset: 0,
      hem: 'n' //(sorry)
    };

    //add etc/gmt+n
    for (let i = -14; i <= 14; i += 0.5) {
      let num = i;
      if (num > 0) {
        num = '+' + num;
      }
      let name = 'etc/gmt' + num;
      all$1[name] = {
        offset: i * -1, //they're negative!
        hem: 'n' //(sorry)
      };
      name = 'utc/gmt' + num; //this one too, why not.
      all$1[name] = {
        offset: i * -1,
        hem: 'n'
      };
    }
    // console.log(all)

    // console.log(Object.keys(all).length)
    var unpack$1 = all$1;

    //find the implicit iana code for this machine.
    //safely query the Intl object
    //based on - https://bitbucket.org/pellepim/jstimezonedetect/src
    const fallbackTZ$1 = 'utc'; //

    //this Intl object is not supported often, yet
    const safeIntl$1 = () => {
      if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
        return null
      }
      let format = Intl.DateTimeFormat();
      if (typeof format === 'undefined' || typeof format.resolvedOptions === 'undefined') {
        return null
      }
      let timezone = format.resolvedOptions().timeZone;
      if (!timezone) {
        return null
      }
      return timezone.toLowerCase()
    };

    const guessTz$1 = () => {
      let timezone = safeIntl$1();
      if (timezone === null) {
        return fallbackTZ$1
      }
      return timezone
    };
    //do it once per computer
    var guessTz_1$1 = guessTz$1;

    const isOffset$1 = /(\-?[0-9]+)h(rs)?/i;
    const isNumber$1 = /(\-?[0-9]+)/;
    const utcOffset$1 = /utc([\-+]?[0-9]+)/i;
    const gmtOffset$1 = /gmt([\-+]?[0-9]+)/i;

    const toIana$1 = function(num) {
      num = Number(num);
      if (num > -13 && num < 13) {
        num = num * -1; //it's opposite!
        num = (num > 0 ? '+' : '') + num; //add plus sign
        return 'etc/gmt' + num
      }
      return null
    };

    const parseOffset$2 = function(tz) {
      // '+5hrs'
      let m = tz.match(isOffset$1);
      if (m !== null) {
        return toIana$1(m[1])
      }
      // 'utc+5'
      m = tz.match(utcOffset$1);
      if (m !== null) {
        return toIana$1(m[1])
      }
      // 'GMT-5' (not opposite)
      m = tz.match(gmtOffset$1);
      if (m !== null) {
        let num = Number(m[1]) * -1;
        return toIana$1(num)
      }
      // '+5'
      m = tz.match(isNumber$1);
      if (m !== null) {
        return toIana$1(m[1])
      }
      return null
    };
    var parseOffset_1$2 = parseOffset$2;

    const local$1 = guessTz_1$1();

    //add all the city names by themselves
    const cities$1 = Object.keys(unpack$1).reduce((h, k) => {
      let city = k.split('/')[1] || '';
      city = city.replace(/_/g, ' ');
      h[city] = k;
      return h
    }, {});

    //try to match these against iana form
    const normalize$1 = tz => {
      tz = tz.replace(/ time/g, '');
      tz = tz.replace(/ (standard|daylight|summer)/g, '');
      tz = tz.replace(/\b(east|west|north|south)ern/g, '$1');
      tz = tz.replace(/\b(africa|america|australia)n/g, '$1');
      tz = tz.replace(/\beuropean/g, 'europe');
      tz = tz.replace(/\islands/g, 'island');
      return tz
    };

    // try our best to reconcile the timzone to this given string
    const lookupTz$1 = (str, zones) => {
      if (!str) {
        return local$1
      }
      let tz = str.trim();
      let split = str.split('/');
      //support long timezones like 'America/Argentina/Rio_Gallegos'
      if (split.length > 2 && zones.hasOwnProperty(tz) === false) {
        tz = split[0] + '/' + split[1];
      }
      tz = tz.toLowerCase();
      if (zones.hasOwnProperty(tz) === true) {
        return tz
      }
      //lookup more loosely..
      tz = normalize$1(tz);
      if (zones.hasOwnProperty(tz) === true) {
        return tz
      }
      //try city-names
      if (cities$1.hasOwnProperty(tz) === true) {
        return cities$1[tz]
      }
      // //try to parse '-5h'
      if (/[0-9]/.test(tz) === true) {
        let id = parseOffset_1$2(tz);
        if (id) {
          return id
        }
      }

      throw new Error(
        "Spacetime: Cannot find timezone named: '" + str + "'. Please enter an IANA timezone id."
      )
    };
    var find$1 = lookupTz$1;

    let o$1 = {
      millisecond: 1
    };
    o$1.second = 1000;
    o$1.minute = 60000;
    o$1.hour = 3.6e6; // dst is supported post-hoc
    o$1.day = 8.64e7; //
    o$1.date = o$1.day;
    o$1.month = 8.64e7 * 29.5; //(average)
    o$1.week = 6.048e8;
    o$1.year = 3.154e10; // leap-years are supported post-hoc
    //add plurals
    Object.keys(o$1).forEach(k => {
      o$1[k + 's'] = o$1[k];
    });
    var milliseconds$1 = o$1;

    //basically, step-forward/backward until js Date object says we're there.
    const walk$1 = (s, n, fn, unit, previous) => {
      let current = s.d[fn]();
      if (current === n) {
        return //already there
      }
      let startUnit = previous === null ? null : s.d[previous]();
      let original = s.epoch;
      //try to get it as close as we can
      let diff = n - current;
      s.epoch += milliseconds$1[unit] * diff;

      //DST edge-case: if we are going many days, be a little conservative
      if (unit === 'day' && Math.abs(diff) > 28) {
        //but don't push it over a month
        if (n < 28) {
          s.epoch += milliseconds$1.hour;
        }
      }
      //repair it if we've gone too far or something
      //(go by half-steps, just in case)
      const halfStep = milliseconds$1[unit] / 2;
      while (s.d[fn]() < n) {
        s.epoch += halfStep;
      }
      while (s.d[fn]() > n) {
        s.epoch -= halfStep;
      }
      //oops, did we change previous unit? revert it.
      if (previous !== null && startUnit !== s.d[previous]()) {
        // console.warn('spacetime warning: missed setting ' + unit)
        s.epoch = original;
        // i mean, but make it close...
        s.epoch += milliseconds$1[unit] * diff * 0.97; // i guess?
      }
    };
    //find the desired date by a increment/check while loop
    const units$4 = {
      year: {
        valid: n => n > -4000 && n < 4000,
        walkTo: (s, n) => walk$1(s, n, 'getFullYear', 'year', null)
      },
      month: {
        valid: n => n >= 0 && n <= 11,
        walkTo: (s, n) => {
          let d = s.d;
          let current = d.getMonth();
          let original = s.epoch;
          let startUnit = d.getYear();
          if (current === n) {
            return
          }
          //try to get it as close as we can..
          let diff = n - current;
          s.epoch += milliseconds$1.day * (diff * 28); //special case
          //oops, did we change the year? revert it.
          if (startUnit !== s.d.getYear()) {
            s.epoch = original;
          }
          //incriment by day
          while (s.d.getMonth() < n) {
            s.epoch += milliseconds$1.day;
          }
          while (s.d.getMonth() > n) {
            s.epoch -= milliseconds$1.day;
          }
        }
      },
      date: {
        valid: n => n > 0 && n <= 31,
        walkTo: (s, n) => walk$1(s, n, 'getDate', 'day', 'getMonth')
      },
      hour: {
        valid: n => n >= 0 && n < 24,
        walkTo: (s, n) => walk$1(s, n, 'getHours', 'hour', 'getDate')
      },
      minute: {
        valid: n => n >= 0 && n < 60,
        walkTo: (s, n) => walk$1(s, n, 'getMinutes', 'minute', 'getHours')
      },
      second: {
        valid: n => n >= 0 && n < 60,
        walkTo: (s, n) => {
          //do this one directly
          s.epoch = s.seconds(n).epoch;
        }
      },
      millisecond: {
        valid: n => n >= 0 && n < 1000,
        walkTo: (s, n) => {
          //do this one directly
          s.epoch = s.milliseconds(n).epoch;
        }
      }
    };

    const walkTo$1 = (s, wants) => {
      let keys = Object.keys(units$4);
      let old = s.clone();
      for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        let n = wants[k];
        if (n === undefined) {
          n = old[k]();
        }
        if (typeof n === 'string') {
          n = parseInt(n, 10);
        }
        //make-sure it's valid
        if (!units$4[k].valid(n)) {
          s.epoch = null;
          if (s.silent === false) {
            console.warn('invalid ' + k + ': ' + n);
          }
          return
        }
        // console.log(k, n)
        units$4[k].walkTo(s, n);
      }
      return
    };

    var walk_1$1 = walkTo$1;

    let shortMonths$1 = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sept',
      'oct',
      'nov',
      'dec'
    ];
    let longMonths$1 = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december'
    ];

    function buildMapping$1() {
      const obj = {
        sep: 8 //support this format
      };
      for (let i = 0; i < shortMonths$1.length; i++) {
        obj[shortMonths$1[i]] = i;
      }
      for (let i = 0; i < longMonths$1.length; i++) {
        obj[longMonths$1[i]] = i;
      }
      return obj
    }

    var months$2 = {
      short: () => shortMonths$1,
      long: () => longMonths$1,
      mapping: () => buildMapping$1(),
      set: i18n => {
        shortMonths$1 = i18n.short || shortMonths$1;
        longMonths$1 = i18n.long || longMonths$1;
      }
    };

    //pull-apart ISO offsets, like "+0100"
    const parseOffset$1$1 = (s, offset) => {
      if (!offset) {
        return s
      }
      //this is a fancy-move
      if (offset === 'Z') {
        offset = '+0000';
      }

      // according to ISO8601, tz could be hh:mm, hhmm or hh
      // so need few more steps before the calculation.
      let num = 0;

      // for (+-)hh:mm
      if (/^[\+-]?[0-9]{2}:[0-9]{2}$/.test(offset)) {
        //support "+01:00"
        if (/:00/.test(offset) === true) {
          offset = offset.replace(/:00/, '');
        }
        //support "+01:30"
        if (/:30/.test(offset) === true) {
          offset = offset.replace(/:30/, '.5');
        }
      }

      // for (+-)hhmm
      if (/^[\+-]?[0-9]{4}$/.test(offset)) {
        offset = offset.replace(/30$/, '.5');
      }

      num = parseFloat(offset);

      //divide by 100 or 10 - , "+0100", "+01"
      if (Math.abs(num) > 100) {
        num = num / 100;
      }
      //okay, try to match it to a utc timezone
      //remember - this is opposite! a -5 offset maps to Etc/GMT+5  ¯\_(:/)_/¯
      //https://askubuntu.com/questions/519550/why-is-the-8-timezone-called-gmt-8-in-the-filesystem
      num *= -1;

      if (num >= 0) {
        num = '+' + num;
      }
      let tz = 'etc/gmt' + num;
      let zones = s.timezones;

      if (zones[tz]) {
        // log a warning if we're over-writing a given timezone?
        // console.log('changing timezone to: ' + tz)
        s.tz = tz;
      }
      return s
    };
    var parseOffset_1$1$1 = parseOffset$1$1;

    const parseTime$1 = (s, str = '') => {
      str = str.replace(/^\s+/, '').toLowerCase(); //trim
      //formal time formats - 04:30.23
      let arr = str.match(/([0-9]{1,2}):([0-9]{1,2}):?([0-9]{1,2})?[:\.]?([0-9]{1,4})?/);
      if (arr !== null) {
        //validate it a little
        let h = Number(arr[1]);
        if (h < 0 || h > 24) {
          return s.startOf('day')
        }
        let m = Number(arr[2]); //don't accept '5:3pm'
        if (arr[2].length < 2 || m < 0 || m > 59) {
          return s.startOf('day')
        }
        s = s.hour(h);
        s = s.minute(m);
        s = s.seconds(arr[3] || 0);
        s = s.millisecond(arr[4] || 0);
        //parse-out am/pm
        let ampm = str.match(/[\b0-9](am|pm)\b/);
        if (ampm !== null && ampm[1]) {
          s = s.ampm(ampm[1]);
        }
        return s
      }
      //try an informal form - 5pm (no minutes)
      arr = str.match(/([0-9]+) ?(am|pm)/);
      if (arr !== null && arr[1]) {
        let h = Number(arr[1]);
        //validate it a little..
        if (h > 12 || h < 1) {
          return s.startOf('day')
        }
        s = s.hour(arr[1] || 0);
        s = s.ampm(arr[2]);
        s = s.startOf('hour');
        return s
      }
      //no time info found, use start-of-day
      s = s.startOf('day');
      return s
    };
    var parseTime_1$1 = parseTime$1;

    const monthLengths$1 = [
      31, // January - 31 days
      28, // February - 28 days in a common year and 29 days in leap years
      31, // March - 31 days
      30, // April - 30 days
      31, // May - 31 days
      30, // June - 30 days
      31, // July - 31 days
      31, // August - 31 days
      30, // September - 30 days
      31, // October - 31 days
      30, // November - 30 days
      31 // December - 31 days
    ];
    var monthLengths_1$1 = monthLengths$1;

    const isLeapYear$2 = fns$1.isLeapYear;

    //given a month, return whether day number exists in it
    const hasDate$1 = obj => {
      //invalid values
      if (monthLengths_1$1.hasOwnProperty(obj.month) !== true) {
        return false
      }
      //support leap-year in february
      if (obj.month === 1) {
        if (isLeapYear$2(obj.year) && obj.date <= 29) {
          return true
        } else {
          return obj.date <= 28
        }
      }
      //is this date too-big for this month?
      let max = monthLengths_1$1[obj.month] || 0;
      if (obj.date <= max) {
        return true
      }
      return false
    };
    var hasDate_1$1 = hasDate$1;

    const months$1$1 = months$2.mapping();





    const parseYear$1 = (str = '') => {
      //support '18 -> 2018
      // str = str.replace(/^'([0-9]{2})/, '20$1')
      // str = str.replace('([0-9]+) ?b\.?c\.?$', '-$1')
      let year = parseInt(str.trim(), 10);
      year = year || new Date().getFullYear();
      return year
    };

    const strFmt$1 = [
      //iso-this 1998-05-30T22:00:00:000Z, iso-that 2017-04-03T08:00:00-0700
      {
        reg: /^(\-?0?0?[0-9]{3,4})-([0-9]{1,2})-([0-9]{1,2})[T| ]([0-9.:]+)(Z|[0-9\-\+:]+)?$/,
        parse: (s, arr, givenTz, options) => {
          let month = parseInt(arr[2], 10) - 1;
          let obj = {
            year: arr[1],
            month,
            date: arr[3]
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          parseOffset_1$1$1(s, arr[5]);
          walk_1$1(s, obj);
          s = parseTime_1$1(s, arr[4]);
          return s
        }
      },
      //iso "2015-03-25" or "2015/03/25" //0-based-months!
      {
        reg: /^([0-9]{4})[\-\/]([0-9]{1,2})[\-\/]([0-9]{1,2})$/,
        parse: (s, arr) => {
          let obj = {
            year: arr[1],
            month: parseInt(arr[2], 10) - 1,
            date: parseInt(arr[3], 10)
          };
          if (obj.month >= 12) {
            //support yyyy/dd/mm (weird, but ok)
            obj.date = parseInt(arr[2], 10);
            obj.month = parseInt(arr[3], 10) - 1;
          }
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s);
          return s
        }
      },
      //short - uk "03/25/2015"  //0-based-months!
      {
        reg: /^([0-9]{1,2})[\-\/]([0-9]{1,2})[\-\/]?([0-9]{4})?$/,
        parse: (s, arr) => {
          let month = parseInt(arr[1], 10) - 1;
          let date = parseInt(arr[2], 10);
          if (month >= 12) {
            //support yyyy/dd/mm (weird, but ok)
            month = parseInt(arr[2], 10) - 1;
            date = parseInt(arr[1], 10);
          }
          let year = arr[3] || new Date().getFullYear();
          let obj = {
            year,
            month,
            date
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s);
          return s
        }
      },
      //Long "Mar 25 2015"
      //February 22, 2017 15:30:00
      {
        reg: /^([a-z]+) ([0-9]{1,2}(?:st|nd|rd|th)?),?( [0-9]{4})?( ([0-9:]+( ?am| ?pm)?))?$/i,
        parse: (s, arr) => {
          let month = months$1$1[arr[1].toLowerCase()];
          let year = parseYear$1(arr[3]);
          let obj = {
            year,
            month,
            date: fns$1.toCardinal(arr[2] || '')
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s, arr[4]);
          return s
        }
      },
      //February 2017 (implied date)
      {
        reg: /^([a-z]+) ([0-9]{4})$/i,
        parse: (s, arr) => {
          let month = months$1$1[arr[1].toLowerCase()];
          let year = parseYear$1(arr[2]);
          let obj = {
            year,
            month,
            date: 1
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s, arr[4]);
          return s
        }
      },
      //Long "25 Mar 2015"
      {
        reg: /^([0-9]{1,2}(?:st|nd|rd|th)?) ([a-z]+),?( [0-9]{4})?$/i,
        parse: (s, arr) => {
          let month = months$1$1[arr[2].toLowerCase()];
          let year = parseYear$1(arr[3]);
          let obj = {
            year,
            month,
            date: fns$1.toCardinal(arr[1])
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s);
          return s
        }
      },
      {
        // '1992'
        reg: /^[0-9]{4}$/i,
        parse: (s, arr) => {
          let year = parseYear$1(arr[0]);
          let d = new Date();
          let obj = {
            year,
            month: d.getMonth(),
            date: d.getDate()
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s);
          return s
        }
      },
      {
        // '200bc'
        reg: /^[0-9,]+ ?b\.?c\.?$/i,
        parse: (s, arr) => {
          let str = arr[0] || '';
          //make negative-year
          str = str.replace(/^([0-9,]+) ?b\.?c\.?$/i, '-$1');
          //remove commas
          str = str.replace(/,/g, '');
          let year = parseInt(str.trim(), 10);
          let d = new Date();
          let obj = {
            year,
            month: d.getMonth(),
            date: d.getDate()
          };
          if (hasDate_1$1(obj) === false) {
            s.epoch = null;
            return s
          }
          walk_1$1(s, obj);
          s = parseTime_1$1(s);
          return s
        }
      }
    ];

    var strParse$1 = strFmt$1;

    const dates$1 = {
      now: s => {
        s.epoch = Date.now();
        return s
      },
      tonight: s => {
        s.epoch = Date.now();
        s = s.hour(18);
        return s
      },
      today: s => {
        s.epoch = Date.now();
        return s
      },
      tomorrow: s => {
        s.epoch = Date.now();
        s = s.add(1, 'day');
        s = s.startOf('day');
        return s
      },
      yesterday: s => {
        s.epoch = Date.now();
        s = s.subtract(1, 'day');
        s = s.startOf('day');
        return s
      },
      christmas: s => {
        let year = new Date().getFullYear();
        s = s.set([year, 11, 25, 18, 0, 0]); // Dec 25
        return s
      },
      'new years': s => {
        let year = new Date().getFullYear();
        s = s.set([year, 11, 31, 18, 0, 0]); // Dec 31
        return s
      }
    };
    dates$1['new years eve'] = dates$1['new years'];
    var namedDates$1 = dates$1;

    //we have to actually parse these inputs ourselves
    //  -  can't use built-in js parser ;(
    //=========================================
    // ISO Date	  "2015-03-25"
    // Short Date	"03/25/2015" or "2015/03/25"
    // Long Date	"Mar 25 2015" or "25 Mar 2015"
    // Full Date	"Wednesday March 25 2015"
    //=========================================

    //-- also -
    // if the given epoch is really small, they've probably given seconds and not milliseconds
    // anything below this number is likely (but not necessarily) a mistaken input.
    // this may seem like an arbitrary number, but it's 'within jan 1970'
    // this is only really ambiguous until 2054 or so
    const minimumEpoch$1 = 2500000000;

    const defaults$1 = {
      year: new Date().getFullYear(),
      month: 0,
      date: 1
    };

    //support [2016, 03, 01] format
    const handleArray$1 = (s, arr) => {
      let order = ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'];
      for (let i = 0; i < order.length; i++) {
        let num = arr[i] || defaults$1[order[i]] || 0;
        s = s[order[i]](num);
      }
      return s
    };
    //support {year:2016, month:3} format
    const handleObject$1 = (s, obj) => {
      obj = Object.assign({}, defaults$1, obj);
      let keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        let unit = keys[i];
        //make sure we have this method
        if (s[unit] === undefined || typeof s[unit] !== 'function') {
          continue
        }
        //make sure the value is a number
        if (obj[unit] === null || obj[unit] === undefined || obj[unit] === '') {
          continue
        }
        let num = obj[unit] || defaults$1[unit] || 0;
        s = s[unit](num);
      }
      return s
    };

    //find the epoch from different input styles
    const parseInput$1 = (s, input, givenTz) => {
      //if we've been given a epoch number, it's easy
      if (typeof input === 'number') {
        if (input > 0 && input < minimumEpoch$1 && s.silent === false) {
          console.warn('  - Warning: You are setting the date to January 1970.');
          console.warn('       -   did input seconds instead of milliseconds?');
        }
        s.epoch = input;
        return s
      }
      //set tmp time
      s.epoch = Date.now();
      if (input === null || input === undefined) {
        return s //k, we're good.
      }
      //support input of Date() object
      if (fns$1.isDate(input) === true) {
        s.epoch = input.getTime();
        return s
      }
      //support [2016, 03, 01] format
      if (fns$1.isArray(input) === true) {
        s = handleArray$1(s, input);
        return s
      }
      //support {year:2016, month:3} format
      if (fns$1.isObject(input) === true) {
        //support spacetime object as input
        if (input.epoch) {
          s.epoch = input.epoch;
          s.tz = input.tz;
          return s
        }
        s = handleObject$1(s, input);
        return s
      }
      //input as a string..
      if (typeof input !== 'string') {
        return s
      }
      //little cleanup..
      input = input.replace(/\b(mon|tues|wed|wednes|thu|thurs|fri|sat|satur|sun)(day)?\b/i, '');
      input = input.replace(/,/g, '');
      input = input.replace(/ +/g, ' ').trim();
      //try some known-words, like 'now'
      if (namedDates$1.hasOwnProperty(input) === true) {
        s = namedDates$1[input](s);
        return s
      }
      //try each text-parse template, use the first good result
      for (let i = 0; i < strParse$1.length; i++) {
        let m = input.match(strParse$1[i].reg);
        if (m) {
          s = strParse$1[i].parse(s, m, givenTz);
          return s
        }
      }
      if (s.silent === false) {
        console.warn("Warning: couldn't parse date-string: '" + input + "'");
      }
      s.epoch = null;
      return s
    };
    var input$1 = parseInput$1;

    let shortDays$1 = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let longDays$1 = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    var days$1 = {
      short: () => shortDays$1,
      long: () => longDays$1,
      set: i18n => {
        shortDays$1 = i18n.short || shortDays$1;
        longDays$1 = i18n.long || longDays$1;
      }
    };

    // create the timezone offset part of an iso timestamp
    // it's kind of nuts how involved this is
    // "+01:00", "+0100", or simply "+01"
    const isoOffset$1 = s => {
      let offset = s.timezone().current.offset;
      const isNegative = offset < 0;
      let minute = '00';
      //handle 5.5 → '5:30'
      if (Math.abs(offset % 1) === 0.5) {
        minute = '30';
        if (offset >= 0) {
          offset = Math.floor(offset);
        } else {
          offset = Math.ceil(offset);
        }
      }
      if (isNegative) {
        //handle negative sign
        offset *= -1;
        offset = fns$1.zeroPad(offset, 2);
        offset = '-' + offset;
      } else {
        offset = fns$1.zeroPad(offset, 2);
        offset = '+' + offset;
      }
      offset = offset + ':' + minute;
      //'Z' means 00
      if (offset === '+00:00') {
        offset = 'Z';
      }
      return offset
    };

    var _offset$1 = isoOffset$1;

    const format$1 = {
      day: s => fns$1.titleCase(s.dayName()),
      'day-short': s => fns$1.titleCase(days$1.short()[s.day()]),
      'day-number': s => s.day(),
      'day-ordinal': s => fns$1.ordinal(s.day()),
      'day-pad': s => fns$1.zeroPad(s.day()),

      date: s => s.date(),
      'date-ordinal': s => fns$1.ordinal(s.date()),
      'date-pad': s => fns$1.zeroPad(s.date()),

      month: s => fns$1.titleCase(s.monthName()),
      'month-short': s => fns$1.titleCase(months$2.short()[s.month()]),
      'month-number': s => s.month(),
      'month-ordinal': s => fns$1.ordinal(s.month()),
      'month-pad': s => fns$1.zeroPad(s.month()),
      'iso-month': s => fns$1.zeroPad(s.month() + 1), //1-based months

      year: s => {
        let year = s.year();
        if (year > 0) {
          return year
        }
        year = Math.abs(year);
        return year + ' BC'
      },
      'year-short': s => {
        let year = s.year();
        if (year > 0) {
          return `'${String(s.year()).substr(2, 4)}`
        }
        year = Math.abs(year);
        return year + ' BC'
      },
      'iso-year': s => {
        let year = s.year();
        let isNegative = year < 0;
        let str = fns$1.zeroPad(Math.abs(year), 4); //0-padded
        if (isNegative) {
          //negative years are for some reason 6-digits ('-00008')
          str = fns$1.zeroPad(str, 6);
          str = '-' + str;
        }
        return str
      },

      time: s => s.time(),
      'time-24': s => `${s.hour24()}:${fns$1.zeroPad(s.minute())}`,
      hour: s => s.hour12(),
      'hour-pad': s => fns$1.zeroPad(s.hour12()),
      'hour-24': s => s.hour24(),
      'hour-24-pad': s => fns$1.zeroPad(s.hour24()),

      minute: s => s.minute(),
      'minute-pad': s => fns$1.zeroPad(s.minute()),
      second: s => s.second(),
      'second-pad': s => fns$1.zeroPad(s.second()),

      ampm: s => s.ampm(),
      quarter: s => 'Q' + s.quarter(),
      season: s => s.season(),
      era: s => s.era(),
      timezone: s => s.timezone().name,
      offset: s => _offset$1(s),

      numeric: s => `${s.year()}/${fns$1.zeroPad(s.month() + 1)}/${fns$1.zeroPad(s.date())}`, // yyyy/mm/dd
      'numeric-us': s => `${fns$1.zeroPad(s.month() + 1)}/${fns$1.zeroPad(s.date())}/${s.year()}`, // mm/dd/yyyy
      'numeric-uk': s => `${fns$1.zeroPad(s.date())}/${fns$1.zeroPad(s.month() + 1)}/${s.year()}`, //dd/mm/yyyy
      'mm/dd': s => `${fns$1.zeroPad(s.month() + 1)}/${fns$1.zeroPad(s.date())}`, //mm/dd

      // ... https://en.wikipedia.org/wiki/ISO_8601 ;(((
      iso: s => {
        let year = s.format('iso-year');
        let month = fns$1.zeroPad(s.month() + 1); //1-based months
        let date = fns$1.zeroPad(s.date());
        let hour = fns$1.zeroPad(s.h24());
        let minute = fns$1.zeroPad(s.minute());
        let second = fns$1.zeroPad(s.second());
        let ms = fns$1.zeroPad(s.millisecond(), 3);
        let offset = _offset$1(s);
        return `${year}-${month}-${date}T${hour}:${minute}:${second}.${ms}${offset}` //2018-03-09T08:50:00.000-05:00
      },
      'iso-short': s => {
        let month = fns$1.zeroPad(s.month() + 1); //1-based months
        let date = fns$1.zeroPad(s.date());
        return `${s.year()}-${month}-${date}` //2017-02-15
      },
      'iso-utc': s => {
        return new Date(s.epoch).toISOString() //2017-03-08T19:45:28.367Z
      },

      //i made these up
      nice: s => `${months$2.short()[s.month()]} ${fns$1.ordinal(s.date())}, ${s.time()}`,
      'nice-year': s => `${months$2.short()[s.month()]} ${fns$1.ordinal(s.date())}, ${s.year()}`,
      'nice-day': s =>
        `${days$1.short()[s.day()]} ${fns$1.titleCase(months$2.short()[s.month()])} ${fns$1.ordinal(s.date())}`,
      'nice-full': s =>
        `${s.dayName()} ${fns$1.titleCase(s.monthName())} ${fns$1.ordinal(s.date())}, ${s.time()}`
    };
    //aliases
    const aliases$1 = {
      'day-name': 'day',
      'month-name': 'month',
      'iso 8601': 'iso',
      'time-h24': 'time-24',
      'time-12': 'time',
      'time-h12': 'time',
      tz: 'timezone',
      'day-num': 'day-number',
      'month-num': 'month-number',
      'month-iso': 'iso-month',
      'year-iso': 'iso-year',
      'nice-short': 'nice',
      mdy: 'numeric-us',
      dmy: 'numeric-uk',
      ymd: 'numeric',
      'yyyy/mm/dd': 'numeric',
      'mm/dd/yyyy': 'numeric-us',
      'dd/mm/yyyy': 'numeric-us',
      'little-endian': 'numeric-uk',
      'big-endian': 'numeric',
      'day-nice': 'nice-day'
    };
    Object.keys(aliases$1).forEach(k => (format$1[k] = format$1[aliases$1[k]]));

    const printFormat$1 = (s, str = '') => {
      //don't print anything if it's an invalid date
      if (s.isValid() !== true) {
        return ''
      }
      //support .format('month')
      if (format$1.hasOwnProperty(str)) {
        let out = String(format$1[str](s) || '');
        if (str !== 'ampm') {
          out = fns$1.titleCase(out);
        }
        return out
      }
      //support '{hour}:{minute}' notation
      if (str.indexOf('{') !== -1) {
        let sections = /\{(.+?)\}/g;
        str = str.replace(sections, (_, fmt) => {
          fmt = fmt.toLowerCase().trim();
          if (format$1.hasOwnProperty(fmt)) {
            return String(format$1[fmt](s) || '')
          }
          return ''
        });
        return str
      }

      return s.format('iso-short')
    };
    var format_1$1 = printFormat$1;

    const pad$1 = fns$1.zeroPad;
    const formatTimezone$1 = fns$1.formatTimezone;
    //parse this insane unix-time-templating thing, from the 19th century
    //http://unicode.org/reports/tr35/tr35-25.html#Date_Format_Patterns

    //time-symbols we support
    const mapping$1 = {
      G: s => s.era(),
      GG: s => s.era(),
      GGG: s => s.era(),
      GGGG: s => (s.era() === 'AD' ? 'Anno Domini' : 'Before Christ'),
      //year
      y: s => s.year(),
      yy: s => {
        //last two chars
        return parseInt(String(s.year()).substr(2, 4), 10)
      },
      yyy: s => s.year(),
      yyyy: s => s.year(),
      yyyyy: s => '0' + s.year(),
      // u: (s) => {},//extended non-gregorian years

      //quarter
      Q: s => s.quarter(),
      QQ: s => s.quarter(),
      QQQ: s => s.quarter(),
      QQQQ: s => s.quarter(),

      //month
      M: s => s.month() + 1,
      MM: s => pad$1(s.month() + 1),
      MMM: s => s.format('month-short'),
      MMMM: s => s.format('month'),

      //week
      w: s => s.week(),
      ww: s => pad$1(s.week()),
      //week of month
      // W: (s) => s.week(),

      //date of month
      d: s => s.date(),
      dd: s => pad$1(s.date()),
      //date of year
      D: s => s.dayOfYear(),
      DD: s => pad$1(s.dayOfYear()),
      DDD: s => pad$1(s.dayOfYear(), 3),

      // F: (s) => {},//date of week in month
      // g: (s) => {},//modified julian day

      //day
      E: s => s.format('day-short'),
      EE: s => s.format('day-short'),
      EEE: s => s.format('day-short'),
      EEEE: s => s.format('day'),
      EEEEE: s => s.format('day')[0],
      e: s => s.day(),
      ee: s => s.day(),
      eee: s => s.format('day-short'),
      eeee: s => s.format('day'),
      eeeee: s => s.format('day')[0],

      //am/pm
      a: s => s.ampm().toUpperCase(),
      aa: s => s.ampm().toUpperCase(),
      aaa: s => s.ampm().toUpperCase(),
      aaaa: s => s.ampm().toUpperCase(),

      //hour
      h: s => s.h12(),
      hh: s => pad$1(s.h12()),
      H: s => s.hour(),
      HH: s => pad$1(s.hour()),
      // j: (s) => {},//weird hour format

      m: s => s.minute(),
      mm: s => pad$1(s.minute()),
      s: s => s.second(),
      ss: s => pad$1(s.second()),
      //milliseconds in the day
      A: s => s.epoch - s.startOf('day').epoch,
      //timezone
      z: s => s.timezone().name,
      zz: s => s.timezone().name,
      zzz: s => s.timezone().name,
      zzzz: s => s.timezone().name,
      Z: s => formatTimezone$1(s.timezone().current.offset),
      ZZ: s => formatTimezone$1(s.timezone().current.offset),
      ZZZ: s => formatTimezone$1(s.timezone().current.offset),
      ZZZZ: s => formatTimezone$1(s.timezone().current.offset, ':')
    };

    const addAlias$1 = (char, to, n) => {
      let name = char;
      let toName = to;
      for (let i = 0; i < n; i += 1) {
        mapping$1[name] = mapping$1[toName];
        name += char;
        toName += to;
      }
    };
    addAlias$1('q', 'Q', 4);
    addAlias$1('L', 'M', 4);
    addAlias$1('Y', 'y', 4);
    addAlias$1('c', 'e', 4);
    addAlias$1('k', 'H', 2);
    addAlias$1('K', 'h', 2);
    addAlias$1('S', 's', 2);
    addAlias$1('v', 'z', 4);
    addAlias$1('V', 'Z', 4);

    const unixFmt$1 = (s, str) => {
      let chars = str.split('');
      //combine consecutive chars, like 'yyyy' as one.
      let arr = [chars[0]];
      let quoteOn = false;
      for (let i = 1; i < chars.length; i += 1) {
        //support quoted substrings
        if (chars[i] === `'`) {
          quoteOn = !quoteOn;
          //support '', meaning one tick
          if (quoteOn === true && chars[i + 1] && chars[i + 1] === "'") {
            quoteOn = true;
          } else {
            continue
          }
        }
        //merge it with the last one
        if (quoteOn === true || chars[i] === arr[arr.length - 1][0]) {
          arr[arr.length - 1] += chars[i];
        } else {
          arr.push(chars[i]);
        }
      }
      return arr.reduce((txt, c) => {
        if (mapping$1[c] !== undefined) {
          txt += mapping$1[c](s) || '';
        } else {
          txt += c;
        }
        return txt
      }, '')
    };
    var unixFmt_1$1 = unixFmt$1;

    const units$1$1 = ['year', 'season', 'quarter', 'month', 'week', 'day', 'quarterHour', 'hour', 'minute'];

    const doUnit$1 = function(s, k) {
      let start = s.clone().startOf(k);
      let end = s.clone().endOf(k);
      let duration = end.epoch - start.epoch;
      let percent = (s.epoch - start.epoch) / duration;
      return parseFloat(percent.toFixed(2))
    };

    //how far it is along, from 0-1
    const progress$1 = (s, unit) => {
      if (unit) {
        unit = fns$1.normalize(unit);
        return doUnit$1(s, unit)
      }
      let obj = {};
      units$1$1.forEach(k => {
        obj[k] = doUnit$1(s, k);
      });
      return obj
    };

    var progress_1$1 = progress$1;

    //round to either current, or +1 of this unit
    const nearest$1 = (s, unit) => {
      //how far have we gone?
      let prog = s.progress();
      unit = fns$1.normalize(unit);
      //fix camel-case for this one
      if (unit === 'quarterhour') {
        unit = 'quarterHour';
      }
      if (prog[unit] !== undefined) {
        // go forward one?
        if (prog[unit] > 0.5) {
          s = s.add(1, unit);
        }
        // go to start
        s = s.startOf(unit);
      } else if (s.silent === false) {
        console.warn("no known unit '" + unit + "'");
      }
      return s
    };
    var nearest_1$1 = nearest$1;

    //increment until dates are the same
    const climb$1 = (a, b, unit) => {
      let i = 0;
      a = a.clone();
      while (a.isBefore(b)) {
        //do proper, expensive increment to catch all-the-tricks
        a = a.add(1, unit);
        i += 1;
      }
      //oops, we went too-far..
      if (a.isAfter(b, unit)) {
        i -= 1;
      }
      return i
    };

    // do a thurough +=1 on the unit, until they match
    // for speed-reasons, only used on day, month, week.
    const diffOne$1 = (a, b, unit) => {
      if (a.isBefore(b)) {
        return climb$1(a, b, unit)
      } else {
        return climb$1(b, a, unit) * -1 //reverse it
      }
    };

    var one$1 = diffOne$1;

    // don't do anything too fancy here.
    // 2020 - 2019 may be 1 year, or 0 years
    // - '1 year difference' means 366 days during a leap year
    const fastYear$1 = (a, b) => {
      let years = b.year() - a.year();
      // should we decrement it by 1?
      a = a.year(b.year());
      if (a.isAfter(b)) {
        years -= 1;
      }
      return years
    };

    // use a waterfall-method for computing a diff of any 'pre-knowable' units
    // compute years, then compute months, etc..
    // ... then ms-math for any very-small units
    const diff$2 = function(a, b) {
      // an hour is always the same # of milliseconds
      // so these units can be 'pre-calculated'
      let msDiff = b.epoch - a.epoch;
      let obj = {
        milliseconds: msDiff,
        seconds: parseInt(msDiff / 1000, 10)
      };
      obj.minutes = parseInt(obj.seconds / 60, 10);
      obj.hours = parseInt(obj.minutes / 60, 10);

      //do the year
      let tmp = a.clone();
      obj.years = fastYear$1(tmp, b);
      tmp = a.add(obj.years, 'year');

      //there's always 12 months in a year...
      obj.months = obj.years * 12;
      tmp = a.add(obj.months, 'month');
      obj.months += one$1(tmp, b, 'month');

      // there's always atleast 52 weeks in a year..
      // (month * 4) isn't as close
      obj.weeks = obj.years * 52;
      tmp = a.add(obj.weeks, 'week');
      obj.weeks += one$1(tmp, b, 'week');

      // there's always atleast 7 days in a week
      obj.days = obj.weeks * 7;
      tmp = a.add(obj.days, 'day');
      obj.days += one$1(tmp, b, 'day');

      return obj
    };
    var waterfall$1 = diff$2;

    const reverseDiff$1 = function(obj) {
      Object.keys(obj).forEach(k => {
        obj[k] *= -1;
      });
      return obj
    };

    // this method counts a total # of each unit, between a, b.
    // '1 month' means 28 days in february
    // '1 year' means 366 days in a leap year
    const main$2 = function(a, b, unit) {
      b = fns$1.beADate(b, a);
      //reverse values, if necessary
      let reversed = false;
      if (a.isAfter(b)) {
        let tmp = a;
        a = b;
        b = tmp;
        reversed = true;
      }
      //compute them all (i know!)
      let obj = waterfall$1(a, b);
      if (reversed) {
        obj = reverseDiff$1(obj);
      }
      //return just the requested unit
      if (unit) {
        //make sure it's plural-form
        unit = fns$1.normalize(unit);
        if (/s$/.test(unit) !== true) {
          unit += 's';
        }
        if (unit === 'dates') {
          unit = 'days';
        }
        return obj[unit]
      }
      return obj
    };

    var diff$1$1 = main$2;

    //by spencermountain + Shaun Grady

    //our conceptual 'break-points' for each unit
    const qualifiers$1 = {
      months: {
        almost: 10,
        over: 4
      },
      days: {
        almost: 25,
        over: 10
      },
      hours: {
        almost: 20,
        over: 8
      },
      minutes: {
        almost: 50,
        over: 20
      },
      seconds: {
        almost: 50,
        over: 20
      }
    };

    //get number of hours/minutes... between the two dates
    function getDiff$1(a, b) {
      const isBefore = a.isBefore(b);
      const later = isBefore ? b : a;
      let earlier = isBefore ? a : b;
      earlier = earlier.clone();
      const diff = {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
      Object.keys(diff).forEach(unit => {
        if (earlier.isSame(later, unit)) {
          return
        }
        let max = earlier.diff(later, unit);
        earlier = earlier.add(max, unit);
        diff[unit] = max;
      });

      //reverse it, if necessary
      if (isBefore) {
        Object.keys(diff).forEach(u => {
          if (diff[u] !== 0) {
            diff[u] *= -1;
          }
        });
      }
      return diff
    }

    // Expects a plural unit arg
    function pluralize$1(value, unit) {
      if (value === 1) {
        unit = unit.slice(0, -1);
      }
      return value + ' ' + unit
    }

    //create the human-readable diff between the two dates
    const since$1 = (start, end) => {
      end = fns$1.beADate(end, start);
      const diff = getDiff$1(start, end);
      const isNow = Object.keys(diff).every(u => !diff[u]);
      if (isNow === true) {
        return {
          diff,
          rounded: 'now',
          qualified: 'now',
          precise: 'now'
        }
      }
      let rounded;
      let qualified;
      let precise;
      let englishValues = [];

      //go through each value and create its text-representation
      Object.keys(diff).forEach((unit, i, units) => {
        const value = Math.abs(diff[unit]);
        if (value === 0) {
          return
        }
        const englishValue = pluralize$1(value, unit);
        englishValues.push(englishValue);
        if (!rounded) {
          rounded = qualified = englishValue;
          if (i > 4) {
            return
          }
          //is it a 'almost' something, etc?
          const nextUnit = units[i + 1];
          const nextValue = Math.abs(diff[nextUnit]);
          if (nextValue > qualifiers$1[nextUnit].almost) {
            rounded = pluralize$1(value + 1, unit);
            qualified = 'almost ' + rounded;
          } else if (nextValue > qualifiers$1[nextUnit].over) qualified = 'over ' + englishValue;
        }
      });
      //make them into a string
      precise = englishValues.splice(0, 2).join(', ');
      //handle before/after logic
      if (start.isAfter(end) === true) {
        rounded += ' ago';
        qualified += ' ago';
        precise += ' ago';
      } else {
        rounded = 'in ' + rounded;
        qualified = 'in ' + qualified;
        precise = 'in ' + precise;
      }
      return {
        diff,
        rounded,
        qualified,
        precise
      }
    };

    var since_1$1 = since$1;

    //https://www.timeanddate.com/calendar/aboutseasons.html
    // Spring - from March 1 to May 31;
    // Summer - from June 1 to August 31;
    // Fall (autumn) - from September 1 to November 30; and,
    // Winter - from December 1 to February 28 (February 29 in a leap year).
    var seasons$1 = {
      north: [
        ['spring', 2, 1], //spring march 1
        ['summer', 5, 1], //june 1
        ['fall', 8, 1], //sept 1
        ['autumn', 8, 1], //sept 1
        ['winter', 11, 1] //dec 1
      ],
      south: [
        ['fall', 2, 1], //march 1
        ['autumn', 2, 1], //march 1
        ['winter', 5, 1], //june 1
        ['spring', 8, 1], //sept 1
        ['summer', 11, 1] //dec 1
      ]
    };

    var quarters$1 = [
      null,
      [0, 1], //jan 1
      [3, 1], //apr 1
      [6, 1], //july 1
      [9, 1] //oct 1
    ];

    const units$2$1 = {
      minute: s => {
        walk_1$1(s, {
          second: 0,
          millisecond: 0
        });
        return s
      },
      quarterhour: s => {
        let minute = s.minutes();
        if (minute >= 45) {
          s = s.minutes(45);
        } else if (minute >= 30) {
          s = s.minutes(30);
        } else if (minute >= 15) {
          s = s.minutes(15);
        } else {
          s = s.minutes(0);
        }
        walk_1$1(s, {
          second: 0,
          millisecond: 0
        });
        return s
      },
      hour: s => {
        walk_1$1(s, {
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s
      },
      day: s => {
        walk_1$1(s, {
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s
      },
      week: s => {
        let original = s.clone();
        s = s.day(s._weekStart); //monday
        if (s.isAfter(original)) {
          s = s.subtract(1, 'week');
        }
        walk_1$1(s, {
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s
      },
      month: s => {
        walk_1$1(s, {
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s
      },
      quarter: s => {
        let q = s.quarter();
        if (quarters$1[q]) {
          walk_1$1(s, {
            month: quarters$1[q][0],
            date: quarters$1[q][1],
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
          });
        }
        return s
      },
      season: s => {
        let current = s.season();
        let hem = 'north';
        if (s.hemisphere() === 'South') {
          hem = 'south';
        }
        for (let i = 0; i < seasons$1[hem].length; i++) {
          if (seasons$1[hem][i][0] === current) {
            //winter goes between years
            let year = s.year();
            if (current === 'winter' && s.month() < 3) {
              year -= 1;
            }
            walk_1$1(s, {
              year,
              month: seasons$1[hem][i][1],
              date: seasons$1[hem][i][2],
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0
            });
            return s
          }
        }
        return s
      },
      year: s => {
        walk_1$1(s, {
          month: 0,
          date: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        return s
      },
      decade: s => {
        s = s.startOf('year');
        let year = s.year();
        let decade = parseInt(year / 10, 10) * 10;
        s = s.year(decade);
        return s
      },
      century: s => {
        s = s.startOf('year');
        let year = s.year();
        let decade = parseInt(year / 100, 10) * 100;
        s = s.year(decade);
        return s
      }
    };
    units$2$1.date = units$2$1.day;

    const startOf$1 = (a, unit) => {
      let s = a.clone();
      unit = fns$1.normalize(unit);
      if (units$2$1[unit]) {
        return units$2$1[unit](s)
      }
      if (unit === 'summer' || unit === 'winter') {
        s = s.season(unit);
        return units$2$1.season(s)
      }
      return s
    };

    //piggy-backs off startOf
    const endOf$1 = (a, unit) => {
      let s = a.clone();
      unit = fns$1.normalize(unit);
      if (units$2$1[unit]) {
        s = units$2$1[unit](s);
        s = s.add(1, unit);
        s = s.subtract(1, 'milliseconds');
        return s
      }
      return s
    };
    var startOf_1$1 = {
      startOf: startOf$1,
      endOf: endOf$1
    };

    //is it 'wednesday'?
    const isDay$1 = function(unit) {
      if (days$1.short().find(s => s === unit)) {
        return true
      }
      if (days$1.long().find(s => s === unit)) {
        return true
      }
      return false
    };

    // return a list of the weeks/months/days between a -> b
    // returns spacetime objects in the timezone of the input
    const every$1 = function(start, unit = '', end) {
      if (!unit || !end) {
        return []
      }
      //cleanup unit param
      unit = fns$1.normalize(unit);
      //cleanup to param
      end = start.clone().set(end);
      //swap them, if they're backwards
      if (start.isAfter(end)) {
        let tmp = start;
        start = end;
        end = tmp;
      }

      //support 'every wednesday'
      let d = start.clone();
      if (isDay$1(unit)) {
        d = d.next(unit);
        unit = 'week';
      } else {
        d = d.next(unit);
      }
      //okay, actually start doing it
      let result = [];
      while (d.isBefore(end)) {
        result.push(d);
        d = d.add(1, unit);
      }
      return result
    };
    var every_1$1 = every$1;

    const parseDst$1 = dst => {
      if (!dst) {
        return []
      }
      return dst.split('->')
    };

    const titleCase$1 = str => {
      str = str[0].toUpperCase() + str.substr(1);
      str = str.replace(/\/gmt/, '/GMT');
      str = str.replace(/[\/_]([a-z])/gi, s => {
        return s.toUpperCase()
      });
      return str
    };

    //get metadata about this timezone
    const timezone$1 = s => {
      let zones = s.timezones;
      let tz = s.tz;
      if (zones.hasOwnProperty(tz) === false) {
        tz = find$1(s.tz, zones);
      }
      if (tz === null) {
        if (s.silent === false) {
          console.warn("Warn: could not find given or local timezone - '" + s.tz + "'");
        }
        return {
          current: {
            epochShift: 0
          }
        }
      }
      let found = zones[tz];
      let result = {
        name: titleCase$1(tz),
        hasDst: Boolean(found.dst),
        default_offset: found.offset,
        //do north-hemisphere version as default (sorry!)
        hemisphere: found.hem === 's' ? 'South' : 'North',
        current: {}
      };

      if (result.hasDst) {
        let arr = parseDst$1(found.dst);
        result.change = {
          start: arr[0],
          back: arr[1]
        };
      }
      //find the offsets for summer/winter times
      //(these variable names are north-centric)
      let summer = found.offset; // (july)
      let winter = summer; // (january) assume it's the same for now
      if (result.hasDst === true) {
        if (result.hemisphere === 'North') {
          winter = summer - 1;
        } else {
          //southern hemisphere
          winter = found.offset + 1;
        }
      }

      //find out which offset to use right now
      //use 'summer' time july-time
      if (result.hasDst === false) {
        result.current.offset = summer;
        result.current.isDST = false;
      } else if (summerTime$1(s.epoch, result.change.start, result.change.back, summer) === true) {
        result.current.offset = summer;
        result.current.isDST = result.hemisphere === 'North'; //dst 'on' in winter in north
      } else {
        //use 'winter' january-time
        result.current.offset = winter;
        result.current.isDST = result.hemisphere === 'South'; //dst 'on' in summer in south
      }
      return result
    };
    var timezone_1$1 = timezone$1;

    //the spacetime instance methods (also, the API)
    const methods$5 = {
      set: function(input$1$1, tz) {
        let s = this.clone();
        s = input$1(s, input$1$1);
        if (tz) {
          this.tz = find$1(tz);
        }
        return s
      },
      timezone: function() {
        return timezone_1$1(this)
      },
      isDST: function() {
        return timezone_1$1(this).current.isDST
      },
      hasDST: function() {
        return timezone_1$1(this).hasDst
      },
      offset: function() {
        return timezone_1$1(this).current.offset * 60
      },
      hemisphere: function() {
        return timezone_1$1(this).hemisphere
      },
      format: function(fmt) {
        return format_1$1(this, fmt)
      },
      unixFmt: function(fmt) {
        return unixFmt_1$1(this, fmt)
      },
      startOf: function(unit) {
        return startOf_1$1.startOf(this, unit)
      },
      endOf: function(unit) {
        return startOf_1$1.endOf(this, unit)
      },
      leapYear: function() {
        let year = this.year();
        return fns$1.isLeapYear(year)
      },
      progress: function(unit) {
        return progress_1$1(this, unit)
      },
      nearest: function(unit) {
        return nearest_1$1(this, unit)
      },
      diff: function(d, unit) {
        return diff$1$1(this, d, unit)
      },
      since: function(d) {
        if (!d) {
          d = this.clone().set();
        }
        return since_1$1(this, d)
      },
      next: function(unit) {
        let s = this.add(1, unit);
        return s.startOf(unit)
      },
      //the start of the previous year/week/century
      last: function(unit) {
        let s = this.subtract(1, unit);
        return s.startOf(unit)
      },
      isValid: function() {
        //null/undefined epochs
        if (!this.epoch && this.epoch !== 0) {
          return false
        }
        return !isNaN(this.d.getTime())
      },
      //travel to this timezone
      goto: function(tz) {
        let s = this.clone();
        s.tz = find$1(tz, s.timezones); //science!
        return s
      },
      //get each week/month/day between a -> b
      every: function(unit, to) {
        return every_1$1(this, unit, to)
      },
      isAwake: function() {
        let hour = this.hour();
        //10pm -> 8am
        if (hour < 8 || hour > 22) {
          return false
        }
        return true
      },
      isAsleep: function() {
        return !this.isAwake()
      },
      //pretty-printing
      log: function() {
        console.log('');
        console.log(format_1$1(this, 'nice-short'));
        return this
      },
      logYear: function() {
        console.log('');
        console.log(format_1$1(this, 'full-short'));
        return this
      },
      debug: function() {
        let tz = this.timezone();
        let date = this.format('MM') + ' ' + this.format('date-ordinal') + ' ' + this.year();
        date += '\n     - ' + this.format('time');
        console.log('\n\n', date + '\n     - ' + tz.name + ' (' + tz.current.offset + ')');
        return this
      },
      //alias of 'since' but opposite - like moment.js
      from: function(d) {
        d = this.clone().set(d);
        return d.since(this)
      },
      fromNow: function() {
        let d = this.clone().set(Date.now());
        return d.since(this)
      },
      weekStart: function(input) {
        //accept a number directly
        if (typeof input === 'number') {
          this._weekStart = input;
          return this
        }
        if (typeof input === 'string') {
          // accept 'wednesday'
          input = input.toLowerCase().trim();
          let num = days$1.short().indexOf(input);
          if (num === -1) {
            num = days$1.long().indexOf(input);
          }
          if (num === -1) {
            num = 1; //go back to default
          }
          this._weekStart = num;
        } else {
          console.warn('Spacetime Error: Cannot understand .weekStart() input:', input);
        }
        return this
      }
    };
    // aliases
    methods$5.inDST = methods$5.isDST;
    methods$5.round = methods$5.nearest;
    methods$5.each = methods$5.every;
    var methods_1$1 = methods$5;

    // javascript setX methods like setDate() can't be used because of the local bias
    //these methods wrap around them.





    const validate$1 = n => {
      //handle number as a string
      if (typeof n === 'string') {
        n = parseInt(n, 10);
      }
      return n
    };

    const order$2 = ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'];

    //reduce hostile micro-changes when moving dates by millisecond
    const confirm$1 = (s, tmp, unit) => {
      let n = order$2.indexOf(unit);
      let arr = order$2.slice(n, order$2.length);
      for (let i = 0; i < arr.length; i++) {
        let want = tmp[arr[i]]();
        s[arr[i]](want);
      }
      return s
    };

    var set$1 = {
      milliseconds: (s, n) => {
        n = validate$1(n);
        let current = s.millisecond();
        let diff = current - n; //milliseconds to shift by
        return s.epoch - diff
      },

      seconds: (s, n) => {
        n = validate$1(n);
        let diff = s.second() - n;
        let shift = diff * milliseconds$1.second;
        return s.epoch - shift
      },

      minutes: (s, n) => {
        n = validate$1(n);
        let old = s.clone();
        let diff = s.minute() - n;
        let shift = diff * milliseconds$1.minute;
        s.epoch -= shift;
        confirm$1(s, old, 'second');
        return s.epoch
      },

      hours: (s, n) => {
        n = validate$1(n);
        if (n >= 24) {
          n = 24;
        } else if (n < 0) {
          n = 0;
        }
        let old = s.clone();
        let diff = s.hour() - n;
        let shift = diff * milliseconds$1.hour;
        s.epoch -= shift;
        walk_1$1(s, {
          hour: n
        });
        confirm$1(s, old, 'minute');
        return s.epoch
      },

      //support setting time by '4:25pm' - this isn't very-well developed..
      time: (s, str) => {
        let m = str.match(/([0-9]{1,2}):([0-9]{1,2})(am|pm)?/);
        if (!m) {
          //fallback to support just '2am'
          m = str.match(/([0-9]{1,2})(am|pm)/);
          if (!m) {
            return s.epoch
          }
          m.splice(2, 0, '0'); //add implicit 0 minutes
        }
        let h24 = false;
        let hour = parseInt(m[1], 10);
        let minute = parseInt(m[2], 10);
        if (hour > 12) {
          h24 = true;
        }
        //make the hour into proper 24h time
        if (h24 === false) {
          if (m[3] === 'am' && hour === 12) {
            //12am is midnight
            hour = 0;
          }
          if (m[3] === 'pm' && hour < 12) {
            //12pm is noon
            hour += 12;
          }
        }
        s = s.hour(hour);
        s = s.minute(minute);
        s = s.second(0);
        s = s.millisecond(0);
        return s.epoch
      },

      date: (s, n) => {
        n = validate$1(n);
        //avoid setting february 31st
        if (n > 28) {
          const max = monthLengths_1$1[s.month()];
          if (n > max) {
            n = max;
          }
        }
        //avoid setting < 0
        if (n <= 0) {
          n = 1;
        }
        walk_1$1(s, {
          date: n
        });
        return s.epoch
      },

      //this one's tricky
      month: (s, n) => {
        if (typeof n === 'string') {
          n = months$2.mapping()[n.toLowerCase()];
        }
        n = validate$1(n);
        //don't go past december
        if (n >= 12) {
          n = 11;
        }
        if (n <= 0) {
          n = 0;
        }

        let date = s.date();
        //there's no 30th of february, etc.
        if (date > monthLengths_1$1[n]) {
          //make it as close as we can..
          date = monthLengths_1$1[n];
        }
        walk_1$1(s, {
          month: n,
          date
        });
        return s.epoch
      },

      year: (s, n) => {
        n = validate$1(n);
        walk_1$1(s, {
          year: n
        });
        return s.epoch
      },

      dayOfYear: (s, n) => {
        n = validate$1(n);
        let old = s.clone();
        n -= 1; //days are 1-based
        if (n <= 0) {
          n = 0;
        } else if (n >= 365) {
          n = 364;
        }
        s = s.startOf('year');
        s = s.add(n, 'day');
        confirm$1(s, old, 'hour');
        return s.epoch
      }
    };

    const methods$1$1 = {
      millisecond: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.milliseconds(s, num);
          return s
        }
        return this.d.getMilliseconds()
      },
      second: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.seconds(s, num);
          return s
        }
        return this.d.getSeconds()
      },
      minute: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.minutes(s, num);
          return s
        }
        return this.d.getMinutes()
      },
      hour: function(num) {
        let d = this.d;
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.hours(s, num);
          return s
        }
        return d.getHours()
      },

      //'3:30' is 3.5
      hourFloat: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          let minute = num % 1;
          minute = minute * 60;
          let hour = parseInt(num, 10);
          s.epoch = set$1.hours(s, hour);
          s.epoch = set$1.minutes(s, minute);
          return s
        }
        let d = this.d;
        let hour = d.getHours();
        let minute = d.getMinutes();
        minute = minute / 60;
        return hour + minute
      },

      // hour in 12h format
      hour12: function(str) {
        let d = this.d;
        if (str !== undefined) {
          let s = this.clone();
          str = '' + str;
          let m = str.match(/^([0-9]+)(am|pm)$/);
          if (m) {
            let hour = parseInt(m[1], 10);
            if (m[2] === 'pm') {
              hour += 12;
            }
            s.epoch = set$1.hours(s, hour);
          }
          return s
        }
        //get the hour
        let hour12 = d.getHours();
        if (hour12 > 12) {
          hour12 = hour12 - 12;
        }
        if (hour12 === 0) {
          hour12 = 12;
        }
        return hour12
      },

      //some ambiguity here with 12/24h
      time: function(str) {
        if (str !== undefined) {
          let s = this.clone();
          s.epoch = set$1.time(s, str);
          return s
        }
        return `${this.h12()}:${fns$1.zeroPad(this.minute())}${this.ampm()}`
      },

      // either 'am' or 'pm'
      ampm: function(input) {
        let which = 'am';
        let hour = this.hour();
        if (hour >= 12) {
          which = 'pm';
        }
        if (typeof input !== 'string') {
          return which
        }
        //okay, we're doing a setter
        let s = this.clone();
        input = input.toLowerCase().trim();
        //ampm should never change the day
        // - so use `.hour(n)` instead of `.minus(12,'hour')`
        if (hour >= 12 && input === 'am') {
          //noon is 12pm
          hour -= 12;
          return s.hour(hour)
        }
        if (hour < 12 && input === 'pm') {
          hour += 12;
          return s.hour(hour)
        }
        return s
      },

      //some hard-coded times of day, like 'noon'
      dayTime: function(str) {
        if (str !== undefined) {
          const times = {
            morning: '7:00am',
            breakfast: '7:00am',
            noon: '12:00am',
            lunch: '12:00pm',
            afternoon: '2:00pm',
            evening: '6:00pm',
            dinner: '6:00pm',
            night: '11:00pm',
            midnight: '23:59pm'
          };
          let s = this.clone();
          str = str || '';
          str = str.toLowerCase();
          if (times.hasOwnProperty(str) === true) {
            s = s.time(times[str]);
          }
          return s
        }
        let h = this.hour();
        if (h < 6) {
          return 'night'
        }
        if (h < 12) {
          //until noon
          return 'morning'
        }
        if (h < 17) {
          //until 5pm
          return 'afternoon'
        }
        if (h < 22) {
          //until 10pm
          return 'evening'
        }
        return 'night'
      },

      //parse a proper iso string
      iso: function(num) {
        if (num !== undefined) {
          return this.set(num)
        }
        return this.format('iso')
      }
    };
    var _01Time$1 = methods$1$1;

    const methods$2$1 = {
      // # day in the month
      date: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.date(s, num);
          return s
        }
        return this.d.getDate()
      },

      //like 'wednesday' (hard!)
      day: function(input) {
        if (input === undefined) {
          return this.d.getDay()
        }
        let original = this.clone();
        let want = input;
        // accept 'wednesday'
        if (typeof input === 'string') {
          input = input.toLowerCase();
          want = days$1.short().indexOf(input);
          if (want === -1) {
            want = days$1.long().indexOf(input);
          }
        }
        //move approx
        let day = this.d.getDay();
        let diff = day - want;
        let s = this.subtract(diff * 24, 'hours');
        //tighten it back up
        walk_1$1(s, {
          hour: original.hour(),
          minute: original.minute(),
          second: original.second()
        });
        return s
      },

      //these are helpful name-wrappers
      dayName: function(input) {
        if (input === undefined) {
          return days$1.long()[this.day()]
        }
        let s = this.clone();
        s = s.day(input);
        return s
      },

      //either name or number
      month: function(input) {
        if (input !== undefined) {
          let s = this.clone();
          s.epoch = set$1.month(s, input);
          return s
        }
        return this.d.getMonth()
      }
    };
    var _02Date$1 = methods$2$1;

    const clearMinutes$1 = s => {
      s = s.minute(0);
      s = s.second(0);
      s = s.millisecond(1);
      return s
    };

    const methods$3$1 = {
      // day 0-366
      dayOfYear: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.dayOfYear(s, num);
          return s
        }
        //days since newyears - jan 1st is 1, jan 2nd is 2...
        let sum = 0;
        let month = this.d.getMonth();
        let tmp;
        //count the num days in each month
        for (let i = 1; i <= month; i++) {
          tmp = new Date();
          tmp.setDate(1);
          tmp.setYear(this.d.getFullYear()); //the year matters, because leap-years
          tmp.setHours(1);
          tmp.setMinutes(1);
          tmp.setMonth(i);
          tmp.setHours(-2); //the last day of the month
          sum += tmp.getDate();
        }
        return sum + this.d.getDate()
      },

      //since the start of the year
      week: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s = s.month(0);
          s = s.date(1);
          s = s.day('monday');
          s = clearMinutes$1(s);
          //don't go into last-year
          if (s.monthName() === 'december') {
            s = s.add(1, 'week');
          }
          num -= 1; //1-based
          s = s.add(num, 'weeks');
          return s
        }
        //find-out which week it is
        let tmp = this.clone();
        tmp = tmp.month(0);
        tmp = tmp.date(1);
        tmp = clearMinutes$1(tmp);
        tmp = tmp.day('monday');
        //don't go into last-year
        if (tmp.monthName() === 'december') {
          tmp = tmp.add(1, 'week');
        }
        const thisOne = this.epoch;
        //if the week technically hasn't started yet
        if (tmp.epoch > thisOne) {
          return 1
        }
        //speed it up, if we can
        let i = 0;
        let skipWeeks = this.month() * 4;
        tmp.epoch += milliseconds$1.week * skipWeeks;
        i += skipWeeks;
        for (; i < 52; i++) {
          if (tmp.epoch > thisOne) {
            return i
          }
          tmp = tmp.add(1, 'week');
        }
        return 52
      },

      //'january'
      monthName: function(input) {
        if (input === undefined) {
          return months$2.long()[this.month()]
        }
        let s = this.clone();
        s = s.month(input);
        return s
      },

      //q1, q2, q3, q4
      quarter: function(num) {
        if (num !== undefined) {
          if (typeof num === 'string') {
            num = num.replace(/^q/i, '');
            num = parseInt(num, 10);
          }
          if (quarters$1[num]) {
            let s = this.clone();
            let month = quarters$1[num][0];
            s = s.month(month);
            s = s.date(1);
            s = s.startOf('day');
            return s
          }
        }
        let month = this.d.getMonth();
        for (let i = 1; i < quarters$1.length; i++) {
          if (month < quarters$1[i][0]) {
            return i - 1
          }
        }
        return 4
      },

      //spring, summer, winter, fall
      season: function(input) {
        let hem = 'north';
        if (this.hemisphere() === 'South') {
          hem = 'south';
        }
        if (input !== undefined) {
          let s = this.clone();
          for (let i = 0; i < seasons$1[hem].length; i++) {
            if (input === seasons$1[hem][i][0]) {
              s = s.month(seasons$1[hem][i][1]);
              s = s.date(1);
              s = s.startOf('day');
            }
          }
          return s
        }
        let month = this.d.getMonth();
        for (let i = 0; i < seasons$1[hem].length - 1; i++) {
          if (month >= seasons$1[hem][i][1] && month < seasons$1[hem][i + 1][1]) {
            return seasons$1[hem][i][0]
          }
        }
        return 'winter'
      },

      //the year number
      year: function(num) {
        if (num !== undefined) {
          let s = this.clone();
          s.epoch = set$1.year(s, num);
          return s
        }
        return this.d.getFullYear()
      },

      //bc/ad years
      era: function(str) {
        if (str !== undefined) {
          let s = this.clone();
          str = str.toLowerCase();
          //TODO: there is no year-0AD i think. may have off-by-1 error here
          let year = s.d.getFullYear();
          //make '1992' into 1992bc..
          if (str === 'bc' && year > 0) {
            s.epoch = set$1.year(s, year * -1);
          }
          //make '1992bc' into '1992'
          if (str === 'ad' && year < 0) {
            s.epoch = set$1.year(s, year * -1);
          }
          return s
        }
        if (this.d.getFullYear() < 0) {
          return 'BC'
        }
        return 'AD'
      }
    };
    var _03Year$1 = methods$3$1;

    const methods$4$1 = Object.assign({}, _01Time$1, _02Date$1, _03Year$1);

    //aliases
    methods$4$1.milliseconds = methods$4$1.millisecond;
    methods$4$1.seconds = methods$4$1.second;
    methods$4$1.minutes = methods$4$1.minute;
    methods$4$1.hours = methods$4$1.hour;
    methods$4$1.hour24 = methods$4$1.hour;
    methods$4$1.h12 = methods$4$1.hour12;
    methods$4$1.h24 = methods$4$1.hour24;
    methods$4$1.days = methods$4$1.day;

    const addMethods$5 = Space => {
      //hook the methods into prototype
      Object.keys(methods$4$1).forEach(k => {
        Space.prototype[k] = methods$4$1[k];
      });
    };

    var query$1 = addMethods$5;

    const order$1$1 = ['millisecond', 'second', 'minute', 'hour', 'date', 'month'];
    let keep$1 = {
      second: order$1$1.slice(0, 1),
      minute: order$1$1.slice(0, 2),
      quarterhour: order$1$1.slice(0, 2),
      hour: order$1$1.slice(0, 3),
      date: order$1$1.slice(0, 4),
      month: order$1$1.slice(0, 4),
      quarter: order$1$1.slice(0, 4),
      season: order$1$1.slice(0, 4),
      year: order$1$1,
      decade: order$1$1,
      century: order$1$1
    };
    keep$1.week = keep$1.hour;
    keep$1.season = keep$1.date;
    keep$1.quarter = keep$1.date;

    // Units need to be dst adjuested
    const dstAwareUnits$1 = {
      year: true,
      quarter: true,
      season: true,
      month: true,
      week: true,
      day: true
    };

    const keepDate$1 = {
      month: true,
      quarter: true,
      season: true,
      year: true
    };
    //month is the only thing we 'model/compute'
    //- because ms-shifting can be off by enough
    const rollMonth$1 = (want, old) => {
      //increment year
      if (want.month > 0) {
        let years = parseInt(want.month / 12, 10);
        want.year = old.year() + years;
        want.month = want.month % 12;
      } else if (want.month < 0) {
        //decrement year
        let years = Math.floor(Math.abs(want.month) / 13, 10);
        years = Math.abs(years) + 1;
        want.year = old.year() - years;
        //ignore extras
        want.month = want.month % 12;
        want.month = want.month + 12;
        if (want.month === 12) {
          want.month = 0;
        }
      }
      return want
    };

    const addMethods$1$1 = SpaceTime => {
      SpaceTime.prototype.add = function(num, unit) {
        let s = this.clone();
        if (!unit || num === 0) {
          return s //don't bother
        }
        let old = this.clone();
        unit = fns$1.normalize(unit);
        //move forward by the estimated milliseconds (rough)
        if (milliseconds$1[unit]) {
          s.epoch += milliseconds$1[unit] * num;
        } else if (unit === 'week') {
          s.epoch += milliseconds$1.day * (num * 7);
        } else if (unit === 'quarter' || unit === 'season') {
          s.epoch += milliseconds$1.month * (num * 4);
        } else if (unit === 'season') {
          s.epoch += milliseconds$1.month * (num * 4);
        } else if (unit === 'quarterhour') {
          s.epoch += milliseconds$1.minute * 15 * num;
        }
        //now ensure our milliseconds/etc are in-line
        let want = {};
        if (keep$1[unit]) {
          keep$1[unit].forEach(u => {
            want[u] = old[u]();
          });
        }

        if (dstAwareUnits$1[unit]) {
          const diff = old.timezone().current.offset - s.timezone().current.offset;
          s.epoch += diff * 3600 * 1000;
        }

        //ensure month/year has ticked-over
        if (unit === 'month') {
          want.month = old.month() + num;
          //month is the one unit we 'model' directly
          want = rollMonth$1(want, old);
        }
        //support coercing a week, too
        if (unit === 'week') {
          let sum = old.date() + num * 7;
          if (sum <= 28 && sum > 1) {
            want.date = sum;
          }
        }
        //support 25-hour day-changes on dst-changes
        else if (unit === 'date') {
          //specify a naive date number, if it's easy to do...
          let sum = old.date() + num;
          if (sum <= 28 && sum > 1) {
            want.date = sum;
          }
          //or if we haven't moved at all..
          else if (num !== 0 && old.isSame(s, 'day')) {
            want.date = old.date() + num;
          }
        }
        //ensure year has changed (leap-years)
        else if (unit === 'year' && s.year() === old.year()) {
          s.epoch += milliseconds$1.week;
        }
        //these are easier
        else if (unit === 'decade') {
          want.year = s.year() + 10;
        } else if (unit === 'century') {
          want.year = s.year() + 100;
        }
        //keep current date, unless the month doesn't have it.
        if (keepDate$1[unit]) {
          let max = monthLengths_1$1[want.month];
          want.date = old.date();
          if (want.date > max) {
            want.date = max;
          }
        }
        walk_1$1(s, want);
        return s
      };

      //subtract is only add *-1
      SpaceTime.prototype.subtract = function(num, unit) {
        let s = this.clone();
        return s.add(num * -1, unit)
      };
      //add aliases
      SpaceTime.prototype.minus = SpaceTime.prototype.subtract;
      SpaceTime.prototype.plus = SpaceTime.prototype.add;
    };

    var add$1 = addMethods$1$1;

    //make a string, for easy comparison between dates
    const print$1 = {
      millisecond: s => {
        return s.epoch
      },
      second: s => {
        return [s.year(), s.month(), s.date(), s.hour(), s.minute(), s.second()].join('-')
      },
      minute: s => {
        return [s.year(), s.month(), s.date(), s.hour(), s.minute()].join('-')
      },
      hour: s => {
        return [s.year(), s.month(), s.date(), s.hour()].join('-')
      },
      day: s => {
        return [s.year(), s.month(), s.date()].join('-')
      },
      week: s => {
        return [s.year(), s.week()].join('-')
      },
      month: s => {
        return [s.year(), s.month()].join('-')
      },
      quarter: s => {
        return [s.year(), s.quarter()].join('-')
      },
      year: s => {
        return s.year()
      }
    };
    print$1.date = print$1.day;

    const addMethods$2$1 = SpaceTime => {
      SpaceTime.prototype.isSame = function(b, unit) {
        let a = this;
        if (!unit) {
          return null
        }
        if (typeof b === 'string' || typeof b === 'number') {
          b = new SpaceTime(b, this.timezone.name);
        }
        //support 'seconds' aswell as 'second'
        unit = unit.replace(/s$/, '');

        if (print$1[unit]) {
          return print$1[unit](a) === print$1[unit](b)
        }
        return null
      };
    };

    var same$1 = addMethods$2$1;

    const addMethods$3$1 = SpaceTime => {
      const methods = {
        isAfter: function(d) {
          d = fns$1.beADate(d, this);
          let epoch = fns$1.getEpoch(d);
          if (epoch === null) {
            return null
          }
          return this.epoch > epoch
        },
        isBefore: function(d) {
          d = fns$1.beADate(d, this);
          let epoch = fns$1.getEpoch(d);
          if (epoch === null) {
            return null
          }
          return this.epoch < epoch
        },
        isEqual: function(d) {
          d = fns$1.beADate(d, this);
          let epoch = fns$1.getEpoch(d);
          if (epoch === null) {
            return null
          }
          return this.epoch === epoch
        },
        isBetween: function(start, end) {
          start = fns$1.beADate(start, this);
          end = fns$1.beADate(end, this);
          let startEpoch = fns$1.getEpoch(start);
          if (startEpoch === null) {
            return null
          }
          let endEpoch = fns$1.getEpoch(end);
          if (endEpoch === null) {
            return null
          }
          return startEpoch < this.epoch && this.epoch < endEpoch
        }
      };

      //hook them into proto
      Object.keys(methods).forEach(k => {
        SpaceTime.prototype[k] = methods[k];
      });
    };

    var compare$1 = addMethods$3$1;

    const addMethods$4$1 = SpaceTime => {
      const methods = {
        i18n: data => {
          //change the day names
          if (fns$1.isObject(data.days)) {
            days$1.set(data.days);
          }
          //change the month names
          if (fns$1.isObject(data.months)) {
            months$2.set(data.months);
          }
        }
      };

      //hook them into proto
      Object.keys(methods).forEach(k => {
        SpaceTime.prototype[k] = methods[k];
      });
    };

    var i18n$1 = addMethods$4$1;

    let timezones$1 = unpack$1;

    //fake timezone-support, for fakers (es5 class)
    const SpaceTime$1 = function(input$1$1, tz, options = {}) {
      //the holy moment
      this.epoch = null;
      //the shift for the given timezone
      this.tz = find$1(tz, timezones$1);
      //whether to output warnings to console
      this.silent = options.silent || true;

      //does the week start on sunday, or monday:
      this._weekStart = 1; //default to monday
      if (options.weekStart !== undefined) {
        this._weekStart = options.weekStart;
      }
      //add getter/setters
      Object.defineProperty(this, 'd', {
        //return a js date object
        get: function() {
          let offset = quick$1(this);
          //every computer is somewhere- get this computer's built-in offset
          let bias = new Date(this.epoch).getTimezoneOffset() || 0;
          //movement
          let shift = bias + offset * 60; //in minutes
          shift = shift * 60 * 1000; //in ms
          //remove this computer's offset
          let epoch = this.epoch + shift;
          let d = new Date(epoch);
          return d
        }
      });
      //add this data on the object, to allow adding new timezones
      Object.defineProperty(this, 'timezones', {
        get: () => timezones$1,
        set: obj => {
          timezones$1 = obj;
          return obj
        }
      });
      //parse the various formats
      if (input$1$1 !== undefined || input$1$1 === null) {
        let tmp = input$1(this, input$1$1, tz);
        this.epoch = tmp.epoch;
      }
    };

    //(add instance methods to prototype)
    Object.keys(methods_1$1).forEach(k => {
      SpaceTime$1.prototype[k] = methods_1$1[k];
    });

    // ¯\_(ツ)_/¯
    SpaceTime$1.prototype.clone = function() {
      return new SpaceTime$1(this.epoch, this.tz, {
        silent: this.silent,
        weekStart: this._weekStart
      })
    };

    //append more methods
    query$1(SpaceTime$1);
    add$1(SpaceTime$1);
    same$1(SpaceTime$1);
    compare$1(SpaceTime$1);
    i18n$1(SpaceTime$1);

    var spacetime$1 = SpaceTime$1;

    // const timezones = require('../data');

    const whereIts$1 = (a, b) => {
      let start = new spacetime$1(null);
      let end = new spacetime$1(null);
      start = start.time(a);
      //if b is undefined, use as 'within one hour'
      if (b) {
        end = end.time(b);
      } else {
        end = start.add(59, 'minutes');
      }

      let startHour = start.hour();
      let endHour = end.hour();
      let tzs = Object.keys(start.timezones).filter(tz => {
        if (tz.indexOf('/') === -1) {
          return false
        }
        let m = new spacetime$1(null, tz);
        let hour = m.hour();
        //do 'calendar-compare' not real-time-compare
        if (hour >= startHour && hour <= endHour) {
          //test minutes too, if applicable
          if (hour === startHour && m.minute() < start.minute()) {
            return false
          }
          if (hour === endHour && m.minute() > end.minute()) {
            return false
          }
          return true
        }
        return false
      });
      return tzs
    };
    var whereIts_1$1 = whereIts$1;

    var _version$1 = '6.1.0';

    const main$1$1 = (input, tz, options) => new spacetime$1(input, tz, options);

    //some helper functions on the main method
    main$1$1.now = (tz, options) => new spacetime$1(new Date().getTime(), tz, options);
    main$1$1.today = (tz, options) => {
      let s = new spacetime$1(new Date().getTime(), tz, options);
      return s.startOf('day')
    };
    main$1$1.tomorrow = (tz, options) => {
      let s = new spacetime$1(new Date().getTime(), tz, options);
      return s.add(1, 'day').startOf('day')
    };
    main$1$1.yesterday = (tz, options) => {
      let s = new spacetime$1(new Date().getTime(), tz, options);
      return s.subtract(1, 'day').startOf('day')
    };
    main$1$1.extend = function(obj) {
      Object.keys(obj).forEach(k => {
        spacetime$1.prototype[k] = obj[k];
      });
      return this
    };
    //find tz by time
    main$1$1.whereIts = whereIts_1$1;
    main$1$1.version = _version$1;

    //aliases:
    main$1$1.plugin = main$1$1.extend;
    var src$1 = main$1$1;

    /* Users/spencer/mountain/somehow-calendar/src/Calendar.svelte generated by Svelte v3.23.0 */
    const file$2 = "Users/spencer/mountain/somehow-calendar/src/Calendar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (35:2) {#each months as month}
    function create_each_block$1(ctx) {
    	let current;

    	const month = new Month({
    			props: {
    				month: /*month*/ ctx[5],
    				width: /*width*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(month.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(month, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const month_changes = {};
    			if (dirty & /*width*/ 2) month_changes.width = /*width*/ ctx[1];
    			month.$set(month_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(month.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(month.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(month, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(35:2) {#each months as month}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	let each_value = /*months*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div0 = element("div");
    			add_location(div0, file$2, 37, 2, 823);
    			attr_dev(div1, "class", "svelte-1v7kh5n");
    			toggle_class(div1, "col", /*align*/ ctx[0] === "col");
    			toggle_class(div1, "row", /*align*/ ctx[0] === "row");
    			add_location(div1, file$2, 33, 0, 684);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*months, width*/ 6) {
    				each_value = /*months*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*align*/ 1) {
    				toggle_class(div1, "col", /*align*/ ctx[0] === "col");
    			}

    			if (dirty & /*align*/ 1) {
    				toggle_class(div1, "row", /*align*/ ctx[0] === "row");
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
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { start = "" } = $$props;
    	let { end = "" } = $$props;
    	let { align = "row" } = $$props;
    	let { width = "100%" } = $$props;
    	start = src$1(start);
    	end = src$1(end || null);
    	let months = start.every("month", end);
    	const writable_props = ["start", "end", "align", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calendar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Calendar", $$slots, []);

    	$$self.$set = $$props => {
    		if ("start" in $$props) $$invalidate(3, start = $$props.start);
    		if ("end" in $$props) $$invalidate(4, end = $$props.end);
    		if ("align" in $$props) $$invalidate(0, align = $$props.align);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		spacetime: src$1,
    		Month,
    		start,
    		end,
    		align,
    		width,
    		months
    	});

    	$$self.$inject_state = $$props => {
    		if ("start" in $$props) $$invalidate(3, start = $$props.start);
    		if ("end" in $$props) $$invalidate(4, end = $$props.end);
    		if ("align" in $$props) $$invalidate(0, align = $$props.align);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("months" in $$props) $$invalidate(2, months = $$props.months);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [align, width, months, start, end];
    }

    class Calendar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { start: 3, end: 4, align: 0, width: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calendar",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get start() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* Users/spencer/mountain/somehow-calendar/src/Day.svelte generated by Svelte v3.23.0 */

    const file$3 = "Users/spencer/mountain/somehow-calendar/src/Day.svelte";

    function create_fragment$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$3, 8, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Day> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Day", $$slots, []);
    	return [];
    }

    class Day extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Day",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* Users/spencer/mountain/somehow-calendar/src/Month.svelte generated by Svelte v3.23.0 */
    const file$4 = "Users/spencer/mountain/somehow-calendar/src/Month.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (90:8) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = `${" "}`;
    			attr_dev(div, "class", "day noday square svelte-2n6xi8");
    			add_location(div, file$4, 90, 10, 2054);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(90:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:8) {#if d.isSame(month, 'month')}
    function create_if_block(ctx) {
    	let div;
    	let div_title_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "day square svelte-2n6xi8");
    			attr_dev(div, "title", div_title_value = /*d*/ ctx[9].format());
    			toggle_class(div, "weekend", /*d*/ ctx[9].isWeekend());
    			toggle_class(div, "today", /*d*/ ctx[9].isToday());
    			add_location(div, file$4, 82, 10, 1823);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*weeks*/ 4 && div_title_value !== (div_title_value = /*d*/ ctx[9].format())) {
    				attr_dev(div, "title", div_title_value);
    			}

    			if (dirty & /*weeks*/ 4) {
    				toggle_class(div, "weekend", /*d*/ ctx[9].isWeekend());
    			}

    			if (dirty & /*weeks*/ 4) {
    				toggle_class(div, "today", /*d*/ ctx[9].isToday());
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(82:8) {#if d.isSame(month, 'month')}",
    		ctx
    	});

    	return block;
    }

    // (81:6) {#each w as d}
    function create_each_block_1(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*weeks, month*/ 5) show_if = !!/*d*/ ctx[9].isSame(/*month*/ ctx[0], "month");
    		if (show_if) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(81:6) {#each w as d}",
    		ctx
    	});

    	return block;
    }

    // (79:2) {#each weeks as w}
    function create_each_block$2(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*w*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "week svelte-2n6xi8");
    			add_location(div, file$4, 79, 4, 1734);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*weeks, month*/ 5) {
    				each_value_1 = /*w*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(79:2) {#each weeks as w}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*month*/ ctx[0].format("month") + "";
    	let t0;
    	let t1;
    	let each_value = /*weeks*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "monthName svelte-2n6xi8");
    			add_location(div0, file$4, 77, 2, 1656);
    			attr_dev(div1, "class", "month svelte-2n6xi8");
    			set_style(div1, "width", /*width*/ ctx[1]);
    			add_location(div1, file$4, 76, 0, 1611);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*month*/ 1 && t0_value !== (t0_value = /*month*/ ctx[0].format("month") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*weeks, month*/ 5) {
    				each_value = /*weeks*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*width*/ 2) {
    				set_style(div1, "width", /*width*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { month = "" } = $$props;
    	let { width = "100%" } = $$props;
    	let today = src$1.now();
    	month = src$1(month);
    	let start = month.startOf("month").startOf("week").minus(1, "second");
    	let end = month.endOf("month").endOf("week");
    	let weeks = start.every("week", end);

    	weeks = weeks.map(d => {
    		let end = d.endOf("week").add(1, "second");
    		return d.every("day", end);
    	});

    	src$1.extend({
    		isWeekend() {
    			let day = this.day();
    			return day === 0 || day === 1;
    		},
    		isToday() {
    			return this.isSame(today, "day");
    		}
    	});

    	const writable_props = ["month", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Month> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Month", $$slots, []);

    	$$self.$set = $$props => {
    		if ("month" in $$props) $$invalidate(0, month = $$props.month);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		spacetime: src$1,
    		month,
    		width,
    		today,
    		start,
    		end,
    		weeks
    	});

    	$$self.$inject_state = $$props => {
    		if ("month" in $$props) $$invalidate(0, month = $$props.month);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("today" in $$props) today = $$props.today;
    		if ("start" in $$props) start = $$props.start;
    		if ("end" in $$props) end = $$props.end;
    		if ("weeks" in $$props) $$invalidate(2, weeks = $$props.weeks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [month, width, weeks];
    }

    class Month extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { month: 0, width: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Month",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get month() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set month(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/user/output/Output.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src/user/output/Output.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (41:4) {#each $parsed.tags.slice(0, 10) as tag}
    function create_each_block_1$1(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1_value = /*tag*/ ctx[4].tag + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "class", "square svelte-1wzsd0u");
    			set_style(span, "background-color", /*tag*/ ctx[4].color);
    			add_location(span, file$5, 42, 8, 870);
    			add_location(div, file$5, 41, 6, 856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$parsed*/ 1) {
    				set_style(span, "background-color", /*tag*/ ctx[4].color);
    			}

    			if (dirty & /*$parsed*/ 1 && t1_value !== (t1_value = /*tag*/ ctx[4].tag + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(41:4) {#each $parsed.tags.slice(0, 10) as tag}",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#each Object.keys($parsed.days) as k}
    function create_each_block$3(ctx) {
    	let current;

    	const day = new Day({
    			props: {
    				date: /*k*/ ctx[1],
    				color: /*$parsed*/ ctx[0].colors[/*$parsed*/ ctx[0].days[/*k*/ ctx[1]][0]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(day.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(day, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const day_changes = {};
    			if (dirty & /*$parsed*/ 1) day_changes.date = /*k*/ ctx[1];
    			if (dirty & /*$parsed*/ 1) day_changes.color = /*$parsed*/ ctx[0].colors[/*$parsed*/ ctx[0].days[/*k*/ ctx[1]][0]];
    			day.$set(day_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(day.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(day.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(day, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(51:4) {#each Object.keys($parsed.days) as k}",
    		ctx
    	});

    	return block;
    }

    // (50:2) <Calendar start="jan 1 2020" end="today" align="row" width="10rem">
    function create_default_slot(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*$parsed*/ ctx[0].days);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, $parsed*/ 1) {
    				each_value = Object.keys(/*$parsed*/ ctx[0].days);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(50:2) <Calendar start=\\\"jan 1 2020\\\" end=\\\"today\\\" align=\\\"row\\\" width=\\\"10rem\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let current;
    	let each_value_1 = /*$parsed*/ ctx[0].tags.slice(0, 10);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const calendar = new Calendar({
    			props: {
    				start: "jan 1 2020",
    				end: "today",
    				align: "row",
    				width: "10rem",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			t0 = text("-->\n  \n  ");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			create_component(calendar.$$.fragment);
    			attr_dev(div0, "class", "row m1 nowrap");
    			add_location(div0, file$5, 39, 2, 777);
    			attr_dev(div1, "class", "g2 div svelte-1wzsd0u");
    			add_location(div1, file$5, 48, 2, 986);
    			attr_dev(div2, "class", "container svelte-1wzsd0u");
    			add_location(div2, file$5, 33, 0, 575);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t0);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t2);
    			mount_component(calendar, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$parsed*/ 1) {
    				each_value_1 = /*$parsed*/ ctx[0].tags.slice(0, 10);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			const calendar_changes = {};

    			if (dirty & /*$$scope, $parsed*/ 129) {
    				calendar_changes.$$scope = { dirty, ctx };
    			}

    			calendar.$set(calendar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calendar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calendar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(calendar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $parsed;
    	validate_store(parsed, "parsed");
    	component_subscribe($$self, parsed, $$value => $$invalidate(0, $parsed = $$value));
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Output", $$slots, []);
    	$$self.$capture_state = () => ({ Calendar, Day, parsed, $parsed });
    	return [$parsed];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/user/Scroll.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$2 } = globals;
    const file$6 = "src/user/Scroll.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (46:4) {#each Object.keys($data.dates) as d}
    function create_each_block$4(ctx) {
    	let div1;
    	let div0;
    	let t0_value = src(/*d*/ ctx[3]).format("{day-short} {month-short} {date}") + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[2](/*d*/ ctx[3], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div0, "class", "left blue ulred f1");
    			add_location(div0, file$6, 47, 8, 1036);
    			attr_dev(div1, "class", "col note shadow svelte-157yqck");
    			add_location(div1, file$6, 46, 6, 958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$data*/ 1 && t0_value !== (t0_value = src(/*d*/ ctx[3]).format("{day-short} {month-short} {date}") + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(46:4) {#each Object.keys($data.dates) as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let t0_value = Object.keys(/*$data*/ ctx[0].dates).length + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let each_value = Object.keys(/*$data*/ ctx[0].dates);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(" notes:");
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "f1 counter svelte-157yqck");
    			add_location(div0, file$6, 43, 2, 816);
    			attr_dev(div1, "class", "scroll svelte-157yqck");
    			add_location(div1, file$6, 44, 2, 889);
    			attr_dev(div2, "id", "scroll");
    			attr_dev(div2, "class", "svelte-157yqck");
    			add_location(div2, file$6, 42, 0, 796);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$data*/ 1 && t0_value !== (t0_value = Object.keys(/*$data*/ ctx[0].dates).length + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$date, spacetime, Object, $data*/ 3) {
    				each_value = Object.keys(/*$data*/ ctx[0].dates);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $data;
    	let $date;
    	validate_store(data$1, "data");
    	component_subscribe($$self, data$1, $$value => $$invalidate(0, $data = $$value));
    	validate_store(date, "date");
    	component_subscribe($$self, date, $$value => $$invalidate(1, $date = $$value));
    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Scroll> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Scroll", $$slots, []);
    	const click_handler = d => set_store_value(date, $date = src(d));
    	$$self.$capture_state = () => ({ data: data$1, date, spacetime: src, $data, $date });
    	return [$data, $date, click_handler];
    }

    class Scroll extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scroll",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* components/Vertical.svelte generated by Svelte v3.23.0 */

    const file$7 = "components/Vertical.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (34:2) {#each sections as section}
    function create_each_block$5(ctx) {
    	let section;
    	let div;
    	let t0_value = /*section*/ ctx[1] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "svelte-rh6fib");
    			add_location(div, file$7, 35, 6, 770);
    			attr_dev(section, "class", "svelte-rh6fib");
    			add_location(section, file$7, 34, 4, 754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, t0);
    			append_dev(section, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sections*/ 1 && t0_value !== (t0_value = /*section*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(34:2) {#each sections as section}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_value = /*sections*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "slider svelte-rh6fib");
    			add_location(div, file$7, 32, 0, 699);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sections*/ 1) {
    				each_value = /*sections*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { sections = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] } = $$props;
    	const writable_props = ["sections"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Vertical> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Vertical", $$slots, []);

    	$$self.$set = $$props => {
    		if ("sections" in $$props) $$invalidate(0, sections = $$props.sections);
    	};

    	$$self.$capture_state = () => ({ sections });

    	$$self.$inject_state = $$props => {
    		if ("sections" in $$props) $$invalidate(0, sections = $$props.sections);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sections];
    }

    class Vertical extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { sections: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vertical",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get sections() {
    		throw new Error("<Vertical>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sections(value) {
    		throw new Error("<Vertical>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    window.global = window;
    let db = new PouchDB('http://34.86.136.15:5984/headache'); //eslint-disable-line

    const read = async function (id) {
      try {
        return await db.get(id)
      } catch (e) {
        console.log(e);
        alert(`username ${id} not found`); //eslint-disable-line
        return null
      }
    };

    // 'upsert'
    const write = async function (obj) {
      if (!obj._id) {
        console.warn('object needs a _id');
        // alert('username not found') //eslint-disable-line
        return {}
      }
      let doc = {};
      let latest = null;
      try {
        doc = await db.get(obj._id);
        latest = doc._rev;
        console.log('updating date');
      } catch (e) {
        console.log('inserting new date');
      }
      obj = Object.assign(doc, obj);
      obj._rev = latest;
      let res = await db.put(obj);
      return res
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule$2(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var require$$0 = {};

    var core = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory();
    	}
    }(commonjsGlobal, function () {

    	/*globals window, global, require*/

    	/**
    	 * CryptoJS core components.
    	 */
    	var CryptoJS = CryptoJS || (function (Math, undefined$1) {

    	    var crypto;

    	    // Native crypto from window (Browser)
    	    if (typeof window !== 'undefined' && window.crypto) {
    	        crypto = window.crypto;
    	    }

    	    // Native (experimental IE 11) crypto from window (Browser)
    	    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
    	        crypto = window.msCrypto;
    	    }

    	    // Native crypto from global (NodeJS)
    	    if (!crypto && typeof commonjsGlobal !== 'undefined' && commonjsGlobal.crypto) {
    	        crypto = commonjsGlobal.crypto;
    	    }

    	    // Native crypto import via require (NodeJS)
    	    if (!crypto && typeof commonjsRequire === 'function') {
    	        try {
    	            crypto = require$$0;
    	        } catch (err) {}
    	    }

    	    /*
    	     * Cryptographically secure pseudorandom number generator
    	     *
    	     * As Math.random() is cryptographically not safe to use
    	     */
    	    var cryptoSecureRandomInt = function () {
    	        if (crypto) {
    	            // Use getRandomValues method (Browser)
    	            if (typeof crypto.getRandomValues === 'function') {
    	                try {
    	                    return crypto.getRandomValues(new Uint32Array(1))[0];
    	                } catch (err) {}
    	            }

    	            // Use randomBytes method (NodeJS)
    	            if (typeof crypto.randomBytes === 'function') {
    	                try {
    	                    return crypto.randomBytes(4).readInt32LE();
    	                } catch (err) {}
    	            }
    	        }

    	        throw new Error('Native crypto module could not be used to get secure random number.');
    	    };

    	    /*
    	     * Local polyfill of Object.create

    	     */
    	    var create = Object.create || (function () {
    	        function F() {}

    	        return function (obj) {
    	            var subtype;

    	            F.prototype = obj;

    	            subtype = new F();

    	            F.prototype = null;

    	            return subtype;
    	        };
    	    }());

    	    /**
    	     * CryptoJS namespace.
    	     */
    	    var C = {};

    	    /**
    	     * Library namespace.
    	     */
    	    var C_lib = C.lib = {};

    	    /**
    	     * Base object for prototypal inheritance.
    	     */
    	    var Base = C_lib.Base = (function () {


    	        return {
    	            /**
    	             * Creates a new object that inherits from this object.
    	             *
    	             * @param {Object} overrides Properties to copy into the new object.
    	             *
    	             * @return {Object} The new object.
    	             *
    	             * @static
    	             *
    	             * @example
    	             *
    	             *     var MyType = CryptoJS.lib.Base.extend({
    	             *         field: 'value',
    	             *
    	             *         method: function () {
    	             *         }
    	             *     });
    	             */
    	            extend: function (overrides) {
    	                // Spawn
    	                var subtype = create(this);

    	                // Augment
    	                if (overrides) {
    	                    subtype.mixIn(overrides);
    	                }

    	                // Create default initializer
    	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
    	                    subtype.init = function () {
    	                        subtype.$super.init.apply(this, arguments);
    	                    };
    	                }

    	                // Initializer's prototype is the subtype object
    	                subtype.init.prototype = subtype;

    	                // Reference supertype
    	                subtype.$super = this;

    	                return subtype;
    	            },

    	            /**
    	             * Extends this object and runs the init method.
    	             * Arguments to create() will be passed to init().
    	             *
    	             * @return {Object} The new object.
    	             *
    	             * @static
    	             *
    	             * @example
    	             *
    	             *     var instance = MyType.create();
    	             */
    	            create: function () {
    	                var instance = this.extend();
    	                instance.init.apply(instance, arguments);

    	                return instance;
    	            },

    	            /**
    	             * Initializes a newly created object.
    	             * Override this method to add some logic when your objects are created.
    	             *
    	             * @example
    	             *
    	             *     var MyType = CryptoJS.lib.Base.extend({
    	             *         init: function () {
    	             *             // ...
    	             *         }
    	             *     });
    	             */
    	            init: function () {
    	            },

    	            /**
    	             * Copies properties into this object.
    	             *
    	             * @param {Object} properties The properties to mix in.
    	             *
    	             * @example
    	             *
    	             *     MyType.mixIn({
    	             *         field: 'value'
    	             *     });
    	             */
    	            mixIn: function (properties) {
    	                for (var propertyName in properties) {
    	                    if (properties.hasOwnProperty(propertyName)) {
    	                        this[propertyName] = properties[propertyName];
    	                    }
    	                }

    	                // IE won't copy toString using the loop above
    	                if (properties.hasOwnProperty('toString')) {
    	                    this.toString = properties.toString;
    	                }
    	            },

    	            /**
    	             * Creates a copy of this object.
    	             *
    	             * @return {Object} The clone.
    	             *
    	             * @example
    	             *
    	             *     var clone = instance.clone();
    	             */
    	            clone: function () {
    	                return this.init.prototype.extend(this);
    	            }
    	        };
    	    }());

    	    /**
    	     * An array of 32-bit words.
    	     *
    	     * @property {Array} words The array of 32-bit words.
    	     * @property {number} sigBytes The number of significant bytes in this word array.
    	     */
    	    var WordArray = C_lib.WordArray = Base.extend({
    	        /**
    	         * Initializes a newly created word array.
    	         *
    	         * @param {Array} words (Optional) An array of 32-bit words.
    	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.lib.WordArray.create();
    	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
    	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
    	         */
    	        init: function (words, sigBytes) {
    	            words = this.words = words || [];

    	            if (sigBytes != undefined$1) {
    	                this.sigBytes = sigBytes;
    	            } else {
    	                this.sigBytes = words.length * 4;
    	            }
    	        },

    	        /**
    	         * Converts this word array to a string.
    	         *
    	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
    	         *
    	         * @return {string} The stringified word array.
    	         *
    	         * @example
    	         *
    	         *     var string = wordArray + '';
    	         *     var string = wordArray.toString();
    	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
    	         */
    	        toString: function (encoder) {
    	            return (encoder || Hex).stringify(this);
    	        },

    	        /**
    	         * Concatenates a word array to this word array.
    	         *
    	         * @param {WordArray} wordArray The word array to append.
    	         *
    	         * @return {WordArray} This word array.
    	         *
    	         * @example
    	         *
    	         *     wordArray1.concat(wordArray2);
    	         */
    	        concat: function (wordArray) {
    	            // Shortcuts
    	            var thisWords = this.words;
    	            var thatWords = wordArray.words;
    	            var thisSigBytes = this.sigBytes;
    	            var thatSigBytes = wordArray.sigBytes;

    	            // Clamp excess bits
    	            this.clamp();

    	            // Concat
    	            if (thisSigBytes % 4) {
    	                // Copy one byte at a time
    	                for (var i = 0; i < thatSigBytes; i++) {
    	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
    	                }
    	            } else {
    	                // Copy one word at a time
    	                for (var i = 0; i < thatSigBytes; i += 4) {
    	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
    	                }
    	            }
    	            this.sigBytes += thatSigBytes;

    	            // Chainable
    	            return this;
    	        },

    	        /**
    	         * Removes insignificant bits.
    	         *
    	         * @example
    	         *
    	         *     wordArray.clamp();
    	         */
    	        clamp: function () {
    	            // Shortcuts
    	            var words = this.words;
    	            var sigBytes = this.sigBytes;

    	            // Clamp
    	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
    	            words.length = Math.ceil(sigBytes / 4);
    	        },

    	        /**
    	         * Creates a copy of this word array.
    	         *
    	         * @return {WordArray} The clone.
    	         *
    	         * @example
    	         *
    	         *     var clone = wordArray.clone();
    	         */
    	        clone: function () {
    	            var clone = Base.clone.call(this);
    	            clone.words = this.words.slice(0);

    	            return clone;
    	        },

    	        /**
    	         * Creates a word array filled with random bytes.
    	         *
    	         * @param {number} nBytes The number of random bytes to generate.
    	         *
    	         * @return {WordArray} The random word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
    	         */
    	        random: function (nBytes) {
    	            var words = [];

    	            for (var i = 0; i < nBytes; i += 4) {
    	                words.push(cryptoSecureRandomInt());
    	            }

    	            return new WordArray.init(words, nBytes);
    	        }
    	    });

    	    /**
    	     * Encoder namespace.
    	     */
    	    var C_enc = C.enc = {};

    	    /**
    	     * Hex encoding strategy.
    	     */
    	    var Hex = C_enc.Hex = {
    	        /**
    	         * Converts a word array to a hex string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The hex string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            // Shortcuts
    	            var words = wordArray.words;
    	            var sigBytes = wordArray.sigBytes;

    	            // Convert
    	            var hexChars = [];
    	            for (var i = 0; i < sigBytes; i++) {
    	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    	                hexChars.push((bite >>> 4).toString(16));
    	                hexChars.push((bite & 0x0f).toString(16));
    	            }

    	            return hexChars.join('');
    	        },

    	        /**
    	         * Converts a hex string to a word array.
    	         *
    	         * @param {string} hexStr The hex string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
    	         */
    	        parse: function (hexStr) {
    	            // Shortcut
    	            var hexStrLength = hexStr.length;

    	            // Convert
    	            var words = [];
    	            for (var i = 0; i < hexStrLength; i += 2) {
    	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
    	            }

    	            return new WordArray.init(words, hexStrLength / 2);
    	        }
    	    };

    	    /**
    	     * Latin1 encoding strategy.
    	     */
    	    var Latin1 = C_enc.Latin1 = {
    	        /**
    	         * Converts a word array to a Latin1 string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The Latin1 string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            // Shortcuts
    	            var words = wordArray.words;
    	            var sigBytes = wordArray.sigBytes;

    	            // Convert
    	            var latin1Chars = [];
    	            for (var i = 0; i < sigBytes; i++) {
    	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    	                latin1Chars.push(String.fromCharCode(bite));
    	            }

    	            return latin1Chars.join('');
    	        },

    	        /**
    	         * Converts a Latin1 string to a word array.
    	         *
    	         * @param {string} latin1Str The Latin1 string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
    	         */
    	        parse: function (latin1Str) {
    	            // Shortcut
    	            var latin1StrLength = latin1Str.length;

    	            // Convert
    	            var words = [];
    	            for (var i = 0; i < latin1StrLength; i++) {
    	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    	            }

    	            return new WordArray.init(words, latin1StrLength);
    	        }
    	    };

    	    /**
    	     * UTF-8 encoding strategy.
    	     */
    	    var Utf8 = C_enc.Utf8 = {
    	        /**
    	         * Converts a word array to a UTF-8 string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The UTF-8 string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            try {
    	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
    	            } catch (e) {
    	                throw new Error('Malformed UTF-8 data');
    	            }
    	        },

    	        /**
    	         * Converts a UTF-8 string to a word array.
    	         *
    	         * @param {string} utf8Str The UTF-8 string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
    	         */
    	        parse: function (utf8Str) {
    	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
    	        }
    	    };

    	    /**
    	     * Abstract buffered block algorithm template.
    	     *
    	     * The property blockSize must be implemented in a concrete subtype.
    	     *
    	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
    	     */
    	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
    	        /**
    	         * Resets this block algorithm's data buffer to its initial state.
    	         *
    	         * @example
    	         *
    	         *     bufferedBlockAlgorithm.reset();
    	         */
    	        reset: function () {
    	            // Initial values
    	            this._data = new WordArray.init();
    	            this._nDataBytes = 0;
    	        },

    	        /**
    	         * Adds new data to this block algorithm's buffer.
    	         *
    	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
    	         *
    	         * @example
    	         *
    	         *     bufferedBlockAlgorithm._append('data');
    	         *     bufferedBlockAlgorithm._append(wordArray);
    	         */
    	        _append: function (data) {
    	            // Convert string to WordArray, else assume WordArray already
    	            if (typeof data == 'string') {
    	                data = Utf8.parse(data);
    	            }

    	            // Append
    	            this._data.concat(data);
    	            this._nDataBytes += data.sigBytes;
    	        },

    	        /**
    	         * Processes available data blocks.
    	         *
    	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
    	         *
    	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
    	         *
    	         * @return {WordArray} The processed data.
    	         *
    	         * @example
    	         *
    	         *     var processedData = bufferedBlockAlgorithm._process();
    	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
    	         */
    	        _process: function (doFlush) {
    	            var processedWords;

    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;
    	            var dataSigBytes = data.sigBytes;
    	            var blockSize = this.blockSize;
    	            var blockSizeBytes = blockSize * 4;

    	            // Count blocks ready
    	            var nBlocksReady = dataSigBytes / blockSizeBytes;
    	            if (doFlush) {
    	                // Round up to include partial blocks
    	                nBlocksReady = Math.ceil(nBlocksReady);
    	            } else {
    	                // Round down to include only full blocks,
    	                // less the number of blocks that must remain in the buffer
    	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    	            }

    	            // Count words ready
    	            var nWordsReady = nBlocksReady * blockSize;

    	            // Count bytes ready
    	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

    	            // Process blocks
    	            if (nWordsReady) {
    	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
    	                    // Perform concrete-algorithm logic
    	                    this._doProcessBlock(dataWords, offset);
    	                }

    	                // Remove processed words
    	                processedWords = dataWords.splice(0, nWordsReady);
    	                data.sigBytes -= nBytesReady;
    	            }

    	            // Return processed words
    	            return new WordArray.init(processedWords, nBytesReady);
    	        },

    	        /**
    	         * Creates a copy of this object.
    	         *
    	         * @return {Object} The clone.
    	         *
    	         * @example
    	         *
    	         *     var clone = bufferedBlockAlgorithm.clone();
    	         */
    	        clone: function () {
    	            var clone = Base.clone.call(this);
    	            clone._data = this._data.clone();

    	            return clone;
    	        },

    	        _minBufferSize: 0
    	    });

    	    /**
    	     * Abstract hasher template.
    	     *
    	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
    	     */
    	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
    	        /**
    	         * Configuration options.
    	         */
    	        cfg: Base.extend(),

    	        /**
    	         * Initializes a newly created hasher.
    	         *
    	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
    	         *
    	         * @example
    	         *
    	         *     var hasher = CryptoJS.algo.SHA256.create();
    	         */
    	        init: function (cfg) {
    	            // Apply config defaults
    	            this.cfg = this.cfg.extend(cfg);

    	            // Set initial values
    	            this.reset();
    	        },

    	        /**
    	         * Resets this hasher to its initial state.
    	         *
    	         * @example
    	         *
    	         *     hasher.reset();
    	         */
    	        reset: function () {
    	            // Reset data buffer
    	            BufferedBlockAlgorithm.reset.call(this);

    	            // Perform concrete-hasher logic
    	            this._doReset();
    	        },

    	        /**
    	         * Updates this hasher with a message.
    	         *
    	         * @param {WordArray|string} messageUpdate The message to append.
    	         *
    	         * @return {Hasher} This hasher.
    	         *
    	         * @example
    	         *
    	         *     hasher.update('message');
    	         *     hasher.update(wordArray);
    	         */
    	        update: function (messageUpdate) {
    	            // Append
    	            this._append(messageUpdate);

    	            // Update the hash
    	            this._process();

    	            // Chainable
    	            return this;
    	        },

    	        /**
    	         * Finalizes the hash computation.
    	         * Note that the finalize operation is effectively a destructive, read-once operation.
    	         *
    	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
    	         *
    	         * @return {WordArray} The hash.
    	         *
    	         * @example
    	         *
    	         *     var hash = hasher.finalize();
    	         *     var hash = hasher.finalize('message');
    	         *     var hash = hasher.finalize(wordArray);
    	         */
    	        finalize: function (messageUpdate) {
    	            // Final message update
    	            if (messageUpdate) {
    	                this._append(messageUpdate);
    	            }

    	            // Perform concrete-hasher logic
    	            var hash = this._doFinalize();

    	            return hash;
    	        },

    	        blockSize: 512/32,

    	        /**
    	         * Creates a shortcut function to a hasher's object interface.
    	         *
    	         * @param {Hasher} hasher The hasher to create a helper for.
    	         *
    	         * @return {Function} The shortcut function.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
    	         */
    	        _createHelper: function (hasher) {
    	            return function (message, cfg) {
    	                return new hasher.init(cfg).finalize(message);
    	            };
    	        },

    	        /**
    	         * Creates a shortcut function to the HMAC's object interface.
    	         *
    	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
    	         *
    	         * @return {Function} The shortcut function.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
    	         */
    	        _createHmacHelper: function (hasher) {
    	            return function (message, key) {
    	                return new C_algo.HMAC.init(hasher, key).finalize(message);
    	            };
    	        }
    	    });

    	    /**
    	     * Algorithm namespace.
    	     */
    	    var C_algo = C.algo = {};

    	    return C;
    	}(Math));


    	return CryptoJS;

    }));
    });

    var x64Core = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function (undefined$1) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Base = C_lib.Base;
    	    var X32WordArray = C_lib.WordArray;

    	    /**
    	     * x64 namespace.
    	     */
    	    var C_x64 = C.x64 = {};

    	    /**
    	     * A 64-bit word.
    	     */
    	    var X64Word = C_x64.Word = Base.extend({
    	        /**
    	         * Initializes a newly created 64-bit word.
    	         *
    	         * @param {number} high The high 32 bits.
    	         * @param {number} low The low 32 bits.
    	         *
    	         * @example
    	         *
    	         *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
    	         */
    	        init: function (high, low) {
    	            this.high = high;
    	            this.low = low;
    	        }

    	        /**
    	         * Bitwise NOTs this word.
    	         *
    	         * @return {X64Word} A new x64-Word object after negating.
    	         *
    	         * @example
    	         *
    	         *     var negated = x64Word.not();
    	         */
    	        // not: function () {
    	            // var high = ~this.high;
    	            // var low = ~this.low;

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Bitwise ANDs this word with the passed word.
    	         *
    	         * @param {X64Word} word The x64-Word to AND with this word.
    	         *
    	         * @return {X64Word} A new x64-Word object after ANDing.
    	         *
    	         * @example
    	         *
    	         *     var anded = x64Word.and(anotherX64Word);
    	         */
    	        // and: function (word) {
    	            // var high = this.high & word.high;
    	            // var low = this.low & word.low;

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Bitwise ORs this word with the passed word.
    	         *
    	         * @param {X64Word} word The x64-Word to OR with this word.
    	         *
    	         * @return {X64Word} A new x64-Word object after ORing.
    	         *
    	         * @example
    	         *
    	         *     var ored = x64Word.or(anotherX64Word);
    	         */
    	        // or: function (word) {
    	            // var high = this.high | word.high;
    	            // var low = this.low | word.low;

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Bitwise XORs this word with the passed word.
    	         *
    	         * @param {X64Word} word The x64-Word to XOR with this word.
    	         *
    	         * @return {X64Word} A new x64-Word object after XORing.
    	         *
    	         * @example
    	         *
    	         *     var xored = x64Word.xor(anotherX64Word);
    	         */
    	        // xor: function (word) {
    	            // var high = this.high ^ word.high;
    	            // var low = this.low ^ word.low;

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Shifts this word n bits to the left.
    	         *
    	         * @param {number} n The number of bits to shift.
    	         *
    	         * @return {X64Word} A new x64-Word object after shifting.
    	         *
    	         * @example
    	         *
    	         *     var shifted = x64Word.shiftL(25);
    	         */
    	        // shiftL: function (n) {
    	            // if (n < 32) {
    	                // var high = (this.high << n) | (this.low >>> (32 - n));
    	                // var low = this.low << n;
    	            // } else {
    	                // var high = this.low << (n - 32);
    	                // var low = 0;
    	            // }

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Shifts this word n bits to the right.
    	         *
    	         * @param {number} n The number of bits to shift.
    	         *
    	         * @return {X64Word} A new x64-Word object after shifting.
    	         *
    	         * @example
    	         *
    	         *     var shifted = x64Word.shiftR(7);
    	         */
    	        // shiftR: function (n) {
    	            // if (n < 32) {
    	                // var low = (this.low >>> n) | (this.high << (32 - n));
    	                // var high = this.high >>> n;
    	            // } else {
    	                // var low = this.high >>> (n - 32);
    	                // var high = 0;
    	            // }

    	            // return X64Word.create(high, low);
    	        // },

    	        /**
    	         * Rotates this word n bits to the left.
    	         *
    	         * @param {number} n The number of bits to rotate.
    	         *
    	         * @return {X64Word} A new x64-Word object after rotating.
    	         *
    	         * @example
    	         *
    	         *     var rotated = x64Word.rotL(25);
    	         */
    	        // rotL: function (n) {
    	            // return this.shiftL(n).or(this.shiftR(64 - n));
    	        // },

    	        /**
    	         * Rotates this word n bits to the right.
    	         *
    	         * @param {number} n The number of bits to rotate.
    	         *
    	         * @return {X64Word} A new x64-Word object after rotating.
    	         *
    	         * @example
    	         *
    	         *     var rotated = x64Word.rotR(7);
    	         */
    	        // rotR: function (n) {
    	            // return this.shiftR(n).or(this.shiftL(64 - n));
    	        // },

    	        /**
    	         * Adds this word with the passed word.
    	         *
    	         * @param {X64Word} word The x64-Word to add with this word.
    	         *
    	         * @return {X64Word} A new x64-Word object after adding.
    	         *
    	         * @example
    	         *
    	         *     var added = x64Word.add(anotherX64Word);
    	         */
    	        // add: function (word) {
    	            // var low = (this.low + word.low) | 0;
    	            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
    	            // var high = (this.high + word.high + carry) | 0;

    	            // return X64Word.create(high, low);
    	        // }
    	    });

    	    /**
    	     * An array of 64-bit words.
    	     *
    	     * @property {Array} words The array of CryptoJS.x64.Word objects.
    	     * @property {number} sigBytes The number of significant bytes in this word array.
    	     */
    	    var X64WordArray = C_x64.WordArray = Base.extend({
    	        /**
    	         * Initializes a newly created word array.
    	         *
    	         * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
    	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.x64.WordArray.create();
    	         *
    	         *     var wordArray = CryptoJS.x64.WordArray.create([
    	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
    	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
    	         *     ]);
    	         *
    	         *     var wordArray = CryptoJS.x64.WordArray.create([
    	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
    	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
    	         *     ], 10);
    	         */
    	        init: function (words, sigBytes) {
    	            words = this.words = words || [];

    	            if (sigBytes != undefined$1) {
    	                this.sigBytes = sigBytes;
    	            } else {
    	                this.sigBytes = words.length * 8;
    	            }
    	        },

    	        /**
    	         * Converts this 64-bit word array to a 32-bit word array.
    	         *
    	         * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
    	         *
    	         * @example
    	         *
    	         *     var x32WordArray = x64WordArray.toX32();
    	         */
    	        toX32: function () {
    	            // Shortcuts
    	            var x64Words = this.words;
    	            var x64WordsLength = x64Words.length;

    	            // Convert
    	            var x32Words = [];
    	            for (var i = 0; i < x64WordsLength; i++) {
    	                var x64Word = x64Words[i];
    	                x32Words.push(x64Word.high);
    	                x32Words.push(x64Word.low);
    	            }

    	            return X32WordArray.create(x32Words, this.sigBytes);
    	        },

    	        /**
    	         * Creates a copy of this word array.
    	         *
    	         * @return {X64WordArray} The clone.
    	         *
    	         * @example
    	         *
    	         *     var clone = x64WordArray.clone();
    	         */
    	        clone: function () {
    	            var clone = Base.clone.call(this);

    	            // Clone "words" array
    	            var words = clone.words = this.words.slice(0);

    	            // Clone each X64Word object
    	            var wordsLength = words.length;
    	            for (var i = 0; i < wordsLength; i++) {
    	                words[i] = words[i].clone();
    	            }

    	            return clone;
    	        }
    	    });
    	}());


    	return CryptoJS;

    }));
    });

    var libTypedarrays = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Check if typed arrays are supported
    	    if (typeof ArrayBuffer != 'function') {
    	        return;
    	    }

    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;

    	    // Reference original init
    	    var superInit = WordArray.init;

    	    // Augment WordArray.init to handle typed arrays
    	    var subInit = WordArray.init = function (typedArray) {
    	        // Convert buffers to uint8
    	        if (typedArray instanceof ArrayBuffer) {
    	            typedArray = new Uint8Array(typedArray);
    	        }

    	        // Convert other array views to uint8
    	        if (
    	            typedArray instanceof Int8Array ||
    	            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
    	            typedArray instanceof Int16Array ||
    	            typedArray instanceof Uint16Array ||
    	            typedArray instanceof Int32Array ||
    	            typedArray instanceof Uint32Array ||
    	            typedArray instanceof Float32Array ||
    	            typedArray instanceof Float64Array
    	        ) {
    	            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    	        }

    	        // Handle Uint8Array
    	        if (typedArray instanceof Uint8Array) {
    	            // Shortcut
    	            var typedArrayByteLength = typedArray.byteLength;

    	            // Extract bytes
    	            var words = [];
    	            for (var i = 0; i < typedArrayByteLength; i++) {
    	                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
    	            }

    	            // Initialize this word array
    	            superInit.call(this, words, typedArrayByteLength);
    	        } else {
    	            // Else call normal init
    	            superInit.apply(this, arguments);
    	        }
    	    };

    	    subInit.prototype = WordArray;
    	}());


    	return CryptoJS.lib.WordArray;

    }));
    });

    var encUtf16 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var C_enc = C.enc;

    	    /**
    	     * UTF-16 BE encoding strategy.
    	     */
    	    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
    	        /**
    	         * Converts a word array to a UTF-16 BE string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The UTF-16 BE string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            // Shortcuts
    	            var words = wordArray.words;
    	            var sigBytes = wordArray.sigBytes;

    	            // Convert
    	            var utf16Chars = [];
    	            for (var i = 0; i < sigBytes; i += 2) {
    	                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
    	                utf16Chars.push(String.fromCharCode(codePoint));
    	            }

    	            return utf16Chars.join('');
    	        },

    	        /**
    	         * Converts a UTF-16 BE string to a word array.
    	         *
    	         * @param {string} utf16Str The UTF-16 BE string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
    	         */
    	        parse: function (utf16Str) {
    	            // Shortcut
    	            var utf16StrLength = utf16Str.length;

    	            // Convert
    	            var words = [];
    	            for (var i = 0; i < utf16StrLength; i++) {
    	                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
    	            }

    	            return WordArray.create(words, utf16StrLength * 2);
    	        }
    	    };

    	    /**
    	     * UTF-16 LE encoding strategy.
    	     */
    	    C_enc.Utf16LE = {
    	        /**
    	         * Converts a word array to a UTF-16 LE string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The UTF-16 LE string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            // Shortcuts
    	            var words = wordArray.words;
    	            var sigBytes = wordArray.sigBytes;

    	            // Convert
    	            var utf16Chars = [];
    	            for (var i = 0; i < sigBytes; i += 2) {
    	                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
    	                utf16Chars.push(String.fromCharCode(codePoint));
    	            }

    	            return utf16Chars.join('');
    	        },

    	        /**
    	         * Converts a UTF-16 LE string to a word array.
    	         *
    	         * @param {string} utf16Str The UTF-16 LE string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
    	         */
    	        parse: function (utf16Str) {
    	            // Shortcut
    	            var utf16StrLength = utf16Str.length;

    	            // Convert
    	            var words = [];
    	            for (var i = 0; i < utf16StrLength; i++) {
    	                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
    	            }

    	            return WordArray.create(words, utf16StrLength * 2);
    	        }
    	    };

    	    function swapEndian(word) {
    	        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
    	    }
    	}());


    	return CryptoJS.enc.Utf16;

    }));
    });

    var encBase64 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var C_enc = C.enc;

    	    /**
    	     * Base64 encoding strategy.
    	     */
    	    var Base64 = C_enc.Base64 = {
    	        /**
    	         * Converts a word array to a Base64 string.
    	         *
    	         * @param {WordArray} wordArray The word array.
    	         *
    	         * @return {string} The Base64 string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
    	         */
    	        stringify: function (wordArray) {
    	            // Shortcuts
    	            var words = wordArray.words;
    	            var sigBytes = wordArray.sigBytes;
    	            var map = this._map;

    	            // Clamp excess bits
    	            wordArray.clamp();

    	            // Convert
    	            var base64Chars = [];
    	            for (var i = 0; i < sigBytes; i += 3) {
    	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
    	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
    	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

    	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
    	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
    	                }
    	            }

    	            // Add padding
    	            var paddingChar = map.charAt(64);
    	            if (paddingChar) {
    	                while (base64Chars.length % 4) {
    	                    base64Chars.push(paddingChar);
    	                }
    	            }

    	            return base64Chars.join('');
    	        },

    	        /**
    	         * Converts a Base64 string to a word array.
    	         *
    	         * @param {string} base64Str The Base64 string.
    	         *
    	         * @return {WordArray} The word array.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
    	         */
    	        parse: function (base64Str) {
    	            // Shortcuts
    	            var base64StrLength = base64Str.length;
    	            var map = this._map;
    	            var reverseMap = this._reverseMap;

    	            if (!reverseMap) {
    	                    reverseMap = this._reverseMap = [];
    	                    for (var j = 0; j < map.length; j++) {
    	                        reverseMap[map.charCodeAt(j)] = j;
    	                    }
    	            }

    	            // Ignore padding
    	            var paddingChar = map.charAt(64);
    	            if (paddingChar) {
    	                var paddingIndex = base64Str.indexOf(paddingChar);
    	                if (paddingIndex !== -1) {
    	                    base64StrLength = paddingIndex;
    	                }
    	            }

    	            // Convert
    	            return parseLoop(base64Str, base64StrLength, reverseMap);

    	        },

    	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    	    };

    	    function parseLoop(base64Str, base64StrLength, reverseMap) {
    	      var words = [];
    	      var nBytes = 0;
    	      for (var i = 0; i < base64StrLength; i++) {
    	          if (i % 4) {
    	              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
    	              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
    	              var bitsCombined = bits1 | bits2;
    	              words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
    	              nBytes++;
    	          }
    	      }
    	      return WordArray.create(words, nBytes);
    	    }
    	}());


    	return CryptoJS.enc.Base64;

    }));
    });

    var md5 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function (Math) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var Hasher = C_lib.Hasher;
    	    var C_algo = C.algo;

    	    // Constants table
    	    var T = [];

    	    // Compute constants
    	    (function () {
    	        for (var i = 0; i < 64; i++) {
    	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
    	        }
    	    }());

    	    /**
    	     * MD5 hash algorithm.
    	     */
    	    var MD5 = C_algo.MD5 = Hasher.extend({
    	        _doReset: function () {
    	            this._hash = new WordArray.init([
    	                0x67452301, 0xefcdab89,
    	                0x98badcfe, 0x10325476
    	            ]);
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Swap endian
    	            for (var i = 0; i < 16; i++) {
    	                // Shortcuts
    	                var offset_i = offset + i;
    	                var M_offset_i = M[offset_i];

    	                M[offset_i] = (
    	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
    	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
    	                );
    	            }

    	            // Shortcuts
    	            var H = this._hash.words;

    	            var M_offset_0  = M[offset + 0];
    	            var M_offset_1  = M[offset + 1];
    	            var M_offset_2  = M[offset + 2];
    	            var M_offset_3  = M[offset + 3];
    	            var M_offset_4  = M[offset + 4];
    	            var M_offset_5  = M[offset + 5];
    	            var M_offset_6  = M[offset + 6];
    	            var M_offset_7  = M[offset + 7];
    	            var M_offset_8  = M[offset + 8];
    	            var M_offset_9  = M[offset + 9];
    	            var M_offset_10 = M[offset + 10];
    	            var M_offset_11 = M[offset + 11];
    	            var M_offset_12 = M[offset + 12];
    	            var M_offset_13 = M[offset + 13];
    	            var M_offset_14 = M[offset + 14];
    	            var M_offset_15 = M[offset + 15];

    	            // Working varialbes
    	            var a = H[0];
    	            var b = H[1];
    	            var c = H[2];
    	            var d = H[3];

    	            // Computation
    	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
    	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
    	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
    	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
    	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
    	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
    	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
    	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
    	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
    	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
    	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
    	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
    	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
    	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
    	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
    	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

    	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
    	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
    	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
    	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
    	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
    	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
    	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
    	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
    	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
    	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
    	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
    	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
    	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
    	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
    	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
    	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

    	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
    	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
    	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
    	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
    	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
    	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
    	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
    	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
    	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
    	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
    	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
    	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
    	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
    	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
    	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
    	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

    	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
    	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
    	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
    	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
    	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
    	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
    	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
    	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
    	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
    	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
    	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
    	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
    	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
    	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
    	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
    	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

    	            // Intermediate hash value
    	            H[0] = (H[0] + a) | 0;
    	            H[1] = (H[1] + b) | 0;
    	            H[2] = (H[2] + c) | 0;
    	            H[3] = (H[3] + d) | 0;
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;

    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

    	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
    	            var nBitsTotalL = nBitsTotal;
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
    	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
    	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
    	            );
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
    	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
    	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
    	            );

    	            data.sigBytes = (dataWords.length + 1) * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Shortcuts
    	            var hash = this._hash;
    	            var H = hash.words;

    	            // Swap endian
    	            for (var i = 0; i < 4; i++) {
    	                // Shortcut
    	                var H_i = H[i];

    	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
    	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
    	            }

    	            // Return final computed hash
    	            return hash;
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);
    	            clone._hash = this._hash.clone();

    	            return clone;
    	        }
    	    });

    	    function FF(a, b, c, d, x, s, t) {
    	        var n = a + ((b & c) | (~b & d)) + x + t;
    	        return ((n << s) | (n >>> (32 - s))) + b;
    	    }

    	    function GG(a, b, c, d, x, s, t) {
    	        var n = a + ((b & d) | (c & ~d)) + x + t;
    	        return ((n << s) | (n >>> (32 - s))) + b;
    	    }

    	    function HH(a, b, c, d, x, s, t) {
    	        var n = a + (b ^ c ^ d) + x + t;
    	        return ((n << s) | (n >>> (32 - s))) + b;
    	    }

    	    function II(a, b, c, d, x, s, t) {
    	        var n = a + (c ^ (b | ~d)) + x + t;
    	        return ((n << s) | (n >>> (32 - s))) + b;
    	    }

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.MD5('message');
    	     *     var hash = CryptoJS.MD5(wordArray);
    	     */
    	    C.MD5 = Hasher._createHelper(MD5);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacMD5(message, key);
    	     */
    	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
    	}(Math));


    	return CryptoJS.MD5;

    }));
    });

    var sha1 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var Hasher = C_lib.Hasher;
    	    var C_algo = C.algo;

    	    // Reusable object
    	    var W = [];

    	    /**
    	     * SHA-1 hash algorithm.
    	     */
    	    var SHA1 = C_algo.SHA1 = Hasher.extend({
    	        _doReset: function () {
    	            this._hash = new WordArray.init([
    	                0x67452301, 0xefcdab89,
    	                0x98badcfe, 0x10325476,
    	                0xc3d2e1f0
    	            ]);
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcut
    	            var H = this._hash.words;

    	            // Working variables
    	            var a = H[0];
    	            var b = H[1];
    	            var c = H[2];
    	            var d = H[3];
    	            var e = H[4];

    	            // Computation
    	            for (var i = 0; i < 80; i++) {
    	                if (i < 16) {
    	                    W[i] = M[offset + i] | 0;
    	                } else {
    	                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
    	                    W[i] = (n << 1) | (n >>> 31);
    	                }

    	                var t = ((a << 5) | (a >>> 27)) + e + W[i];
    	                if (i < 20) {
    	                    t += ((b & c) | (~b & d)) + 0x5a827999;
    	                } else if (i < 40) {
    	                    t += (b ^ c ^ d) + 0x6ed9eba1;
    	                } else if (i < 60) {
    	                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
    	                } else /* if (i < 80) */ {
    	                    t += (b ^ c ^ d) - 0x359d3e2a;
    	                }

    	                e = d;
    	                d = c;
    	                c = (b << 30) | (b >>> 2);
    	                b = a;
    	                a = t;
    	            }

    	            // Intermediate hash value
    	            H[0] = (H[0] + a) | 0;
    	            H[1] = (H[1] + b) | 0;
    	            H[2] = (H[2] + c) | 0;
    	            H[3] = (H[3] + d) | 0;
    	            H[4] = (H[4] + e) | 0;
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;

    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
    	            data.sigBytes = dataWords.length * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Return final computed hash
    	            return this._hash;
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);
    	            clone._hash = this._hash.clone();

    	            return clone;
    	        }
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA1('message');
    	     *     var hash = CryptoJS.SHA1(wordArray);
    	     */
    	    C.SHA1 = Hasher._createHelper(SHA1);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA1(message, key);
    	     */
    	    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
    	}());


    	return CryptoJS.SHA1;

    }));
    });

    var sha256 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function (Math) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var Hasher = C_lib.Hasher;
    	    var C_algo = C.algo;

    	    // Initialization and round constants tables
    	    var H = [];
    	    var K = [];

    	    // Compute constants
    	    (function () {
    	        function isPrime(n) {
    	            var sqrtN = Math.sqrt(n);
    	            for (var factor = 2; factor <= sqrtN; factor++) {
    	                if (!(n % factor)) {
    	                    return false;
    	                }
    	            }

    	            return true;
    	        }

    	        function getFractionalBits(n) {
    	            return ((n - (n | 0)) * 0x100000000) | 0;
    	        }

    	        var n = 2;
    	        var nPrime = 0;
    	        while (nPrime < 64) {
    	            if (isPrime(n)) {
    	                if (nPrime < 8) {
    	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
    	                }
    	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

    	                nPrime++;
    	            }

    	            n++;
    	        }
    	    }());

    	    // Reusable object
    	    var W = [];

    	    /**
    	     * SHA-256 hash algorithm.
    	     */
    	    var SHA256 = C_algo.SHA256 = Hasher.extend({
    	        _doReset: function () {
    	            this._hash = new WordArray.init(H.slice(0));
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcut
    	            var H = this._hash.words;

    	            // Working variables
    	            var a = H[0];
    	            var b = H[1];
    	            var c = H[2];
    	            var d = H[3];
    	            var e = H[4];
    	            var f = H[5];
    	            var g = H[6];
    	            var h = H[7];

    	            // Computation
    	            for (var i = 0; i < 64; i++) {
    	                if (i < 16) {
    	                    W[i] = M[offset + i] | 0;
    	                } else {
    	                    var gamma0x = W[i - 15];
    	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
    	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
    	                                   (gamma0x >>> 3);

    	                    var gamma1x = W[i - 2];
    	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
    	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
    	                                   (gamma1x >>> 10);

    	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
    	                }

    	                var ch  = (e & f) ^ (~e & g);
    	                var maj = (a & b) ^ (a & c) ^ (b & c);

    	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
    	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

    	                var t1 = h + sigma1 + ch + K[i] + W[i];
    	                var t2 = sigma0 + maj;

    	                h = g;
    	                g = f;
    	                f = e;
    	                e = (d + t1) | 0;
    	                d = c;
    	                c = b;
    	                b = a;
    	                a = (t1 + t2) | 0;
    	            }

    	            // Intermediate hash value
    	            H[0] = (H[0] + a) | 0;
    	            H[1] = (H[1] + b) | 0;
    	            H[2] = (H[2] + c) | 0;
    	            H[3] = (H[3] + d) | 0;
    	            H[4] = (H[4] + e) | 0;
    	            H[5] = (H[5] + f) | 0;
    	            H[6] = (H[6] + g) | 0;
    	            H[7] = (H[7] + h) | 0;
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;

    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
    	            data.sigBytes = dataWords.length * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Return final computed hash
    	            return this._hash;
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);
    	            clone._hash = this._hash.clone();

    	            return clone;
    	        }
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA256('message');
    	     *     var hash = CryptoJS.SHA256(wordArray);
    	     */
    	    C.SHA256 = Hasher._createHelper(SHA256);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA256(message, key);
    	     */
    	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
    	}(Math));


    	return CryptoJS.SHA256;

    }));
    });

    var sha224 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, sha256);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var C_algo = C.algo;
    	    var SHA256 = C_algo.SHA256;

    	    /**
    	     * SHA-224 hash algorithm.
    	     */
    	    var SHA224 = C_algo.SHA224 = SHA256.extend({
    	        _doReset: function () {
    	            this._hash = new WordArray.init([
    	                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
    	                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
    	            ]);
    	        },

    	        _doFinalize: function () {
    	            var hash = SHA256._doFinalize.call(this);

    	            hash.sigBytes -= 4;

    	            return hash;
    	        }
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA224('message');
    	     *     var hash = CryptoJS.SHA224(wordArray);
    	     */
    	    C.SHA224 = SHA256._createHelper(SHA224);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA224(message, key);
    	     */
    	    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
    	}());


    	return CryptoJS.SHA224;

    }));
    });

    var sha512 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, x64Core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Hasher = C_lib.Hasher;
    	    var C_x64 = C.x64;
    	    var X64Word = C_x64.Word;
    	    var X64WordArray = C_x64.WordArray;
    	    var C_algo = C.algo;

    	    function X64Word_create() {
    	        return X64Word.create.apply(X64Word, arguments);
    	    }

    	    // Constants
    	    var K = [
    	        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
    	        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
    	        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
    	        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
    	        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
    	        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
    	        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
    	        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
    	        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
    	        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
    	        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
    	        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
    	        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
    	        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
    	        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
    	        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
    	        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
    	        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
    	        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
    	        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
    	        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
    	        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
    	        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
    	        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
    	        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
    	        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
    	        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
    	        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
    	        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
    	        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
    	        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
    	        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
    	        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
    	        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
    	        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
    	        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
    	        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
    	        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
    	        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
    	        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
    	    ];

    	    // Reusable objects
    	    var W = [];
    	    (function () {
    	        for (var i = 0; i < 80; i++) {
    	            W[i] = X64Word_create();
    	        }
    	    }());

    	    /**
    	     * SHA-512 hash algorithm.
    	     */
    	    var SHA512 = C_algo.SHA512 = Hasher.extend({
    	        _doReset: function () {
    	            this._hash = new X64WordArray.init([
    	                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
    	                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
    	                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
    	                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
    	            ]);
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcuts
    	            var H = this._hash.words;

    	            var H0 = H[0];
    	            var H1 = H[1];
    	            var H2 = H[2];
    	            var H3 = H[3];
    	            var H4 = H[4];
    	            var H5 = H[5];
    	            var H6 = H[6];
    	            var H7 = H[7];

    	            var H0h = H0.high;
    	            var H0l = H0.low;
    	            var H1h = H1.high;
    	            var H1l = H1.low;
    	            var H2h = H2.high;
    	            var H2l = H2.low;
    	            var H3h = H3.high;
    	            var H3l = H3.low;
    	            var H4h = H4.high;
    	            var H4l = H4.low;
    	            var H5h = H5.high;
    	            var H5l = H5.low;
    	            var H6h = H6.high;
    	            var H6l = H6.low;
    	            var H7h = H7.high;
    	            var H7l = H7.low;

    	            // Working variables
    	            var ah = H0h;
    	            var al = H0l;
    	            var bh = H1h;
    	            var bl = H1l;
    	            var ch = H2h;
    	            var cl = H2l;
    	            var dh = H3h;
    	            var dl = H3l;
    	            var eh = H4h;
    	            var el = H4l;
    	            var fh = H5h;
    	            var fl = H5l;
    	            var gh = H6h;
    	            var gl = H6l;
    	            var hh = H7h;
    	            var hl = H7l;

    	            // Rounds
    	            for (var i = 0; i < 80; i++) {
    	                var Wil;
    	                var Wih;

    	                // Shortcut
    	                var Wi = W[i];

    	                // Extend message
    	                if (i < 16) {
    	                    Wih = Wi.high = M[offset + i * 2]     | 0;
    	                    Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
    	                } else {
    	                    // Gamma0
    	                    var gamma0x  = W[i - 15];
    	                    var gamma0xh = gamma0x.high;
    	                    var gamma0xl = gamma0x.low;
    	                    var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
    	                    var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

    	                    // Gamma1
    	                    var gamma1x  = W[i - 2];
    	                    var gamma1xh = gamma1x.high;
    	                    var gamma1xl = gamma1x.low;
    	                    var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
    	                    var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

    	                    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    	                    var Wi7  = W[i - 7];
    	                    var Wi7h = Wi7.high;
    	                    var Wi7l = Wi7.low;

    	                    var Wi16  = W[i - 16];
    	                    var Wi16h = Wi16.high;
    	                    var Wi16l = Wi16.low;

    	                    Wil = gamma0l + Wi7l;
    	                    Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
    	                    Wil = Wil + gamma1l;
    	                    Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
    	                    Wil = Wil + Wi16l;
    	                    Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

    	                    Wi.high = Wih;
    	                    Wi.low  = Wil;
    	                }

    	                var chh  = (eh & fh) ^ (~eh & gh);
    	                var chl  = (el & fl) ^ (~el & gl);
    	                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
    	                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

    	                var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
    	                var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
    	                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
    	                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

    	                // t1 = h + sigma1 + ch + K[i] + W[i]
    	                var Ki  = K[i];
    	                var Kih = Ki.high;
    	                var Kil = Ki.low;

    	                var t1l = hl + sigma1l;
    	                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
    	                var t1l = t1l + chl;
    	                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
    	                var t1l = t1l + Kil;
    	                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
    	                var t1l = t1l + Wil;
    	                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

    	                // t2 = sigma0 + maj
    	                var t2l = sigma0l + majl;
    	                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

    	                // Update working variables
    	                hh = gh;
    	                hl = gl;
    	                gh = fh;
    	                gl = fl;
    	                fh = eh;
    	                fl = el;
    	                el = (dl + t1l) | 0;
    	                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
    	                dh = ch;
    	                dl = cl;
    	                ch = bh;
    	                cl = bl;
    	                bh = ah;
    	                bl = al;
    	                al = (t1l + t2l) | 0;
    	                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
    	            }

    	            // Intermediate hash value
    	            H0l = H0.low  = (H0l + al);
    	            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
    	            H1l = H1.low  = (H1l + bl);
    	            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
    	            H2l = H2.low  = (H2l + cl);
    	            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
    	            H3l = H3.low  = (H3l + dl);
    	            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
    	            H4l = H4.low  = (H4l + el);
    	            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
    	            H5l = H5.low  = (H5l + fl);
    	            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
    	            H6l = H6.low  = (H6l + gl);
    	            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
    	            H7l = H7.low  = (H7l + hl);
    	            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;

    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
    	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
    	            data.sigBytes = dataWords.length * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Convert hash to 32-bit word array before returning
    	            var hash = this._hash.toX32();

    	            // Return final computed hash
    	            return hash;
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);
    	            clone._hash = this._hash.clone();

    	            return clone;
    	        },

    	        blockSize: 1024/32
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA512('message');
    	     *     var hash = CryptoJS.SHA512(wordArray);
    	     */
    	    C.SHA512 = Hasher._createHelper(SHA512);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA512(message, key);
    	     */
    	    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
    	}());


    	return CryptoJS.SHA512;

    }));
    });

    var sha384 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, x64Core, sha512);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_x64 = C.x64;
    	    var X64Word = C_x64.Word;
    	    var X64WordArray = C_x64.WordArray;
    	    var C_algo = C.algo;
    	    var SHA512 = C_algo.SHA512;

    	    /**
    	     * SHA-384 hash algorithm.
    	     */
    	    var SHA384 = C_algo.SHA384 = SHA512.extend({
    	        _doReset: function () {
    	            this._hash = new X64WordArray.init([
    	                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
    	                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
    	                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
    	                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
    	            ]);
    	        },

    	        _doFinalize: function () {
    	            var hash = SHA512._doFinalize.call(this);

    	            hash.sigBytes -= 16;

    	            return hash;
    	        }
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA384('message');
    	     *     var hash = CryptoJS.SHA384(wordArray);
    	     */
    	    C.SHA384 = SHA512._createHelper(SHA384);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA384(message, key);
    	     */
    	    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
    	}());


    	return CryptoJS.SHA384;

    }));
    });

    var sha3 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, x64Core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function (Math) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var Hasher = C_lib.Hasher;
    	    var C_x64 = C.x64;
    	    var X64Word = C_x64.Word;
    	    var C_algo = C.algo;

    	    // Constants tables
    	    var RHO_OFFSETS = [];
    	    var PI_INDEXES  = [];
    	    var ROUND_CONSTANTS = [];

    	    // Compute Constants
    	    (function () {
    	        // Compute rho offset constants
    	        var x = 1, y = 0;
    	        for (var t = 0; t < 24; t++) {
    	            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

    	            var newX = y % 5;
    	            var newY = (2 * x + 3 * y) % 5;
    	            x = newX;
    	            y = newY;
    	        }

    	        // Compute pi index constants
    	        for (var x = 0; x < 5; x++) {
    	            for (var y = 0; y < 5; y++) {
    	                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
    	            }
    	        }

    	        // Compute round constants
    	        var LFSR = 0x01;
    	        for (var i = 0; i < 24; i++) {
    	            var roundConstantMsw = 0;
    	            var roundConstantLsw = 0;

    	            for (var j = 0; j < 7; j++) {
    	                if (LFSR & 0x01) {
    	                    var bitPosition = (1 << j) - 1;
    	                    if (bitPosition < 32) {
    	                        roundConstantLsw ^= 1 << bitPosition;
    	                    } else /* if (bitPosition >= 32) */ {
    	                        roundConstantMsw ^= 1 << (bitPosition - 32);
    	                    }
    	                }

    	                // Compute next LFSR
    	                if (LFSR & 0x80) {
    	                    // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
    	                    LFSR = (LFSR << 1) ^ 0x71;
    	                } else {
    	                    LFSR <<= 1;
    	                }
    	            }

    	            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
    	        }
    	    }());

    	    // Reusable objects for temporary values
    	    var T = [];
    	    (function () {
    	        for (var i = 0; i < 25; i++) {
    	            T[i] = X64Word.create();
    	        }
    	    }());

    	    /**
    	     * SHA-3 hash algorithm.
    	     */
    	    var SHA3 = C_algo.SHA3 = Hasher.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {number} outputLength
    	         *   The desired number of bits in the output hash.
    	         *   Only values permitted are: 224, 256, 384, 512.
    	         *   Default: 512
    	         */
    	        cfg: Hasher.cfg.extend({
    	            outputLength: 512
    	        }),

    	        _doReset: function () {
    	            var state = this._state = [];
    	            for (var i = 0; i < 25; i++) {
    	                state[i] = new X64Word.init();
    	            }

    	            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcuts
    	            var state = this._state;
    	            var nBlockSizeLanes = this.blockSize / 2;

    	            // Absorb
    	            for (var i = 0; i < nBlockSizeLanes; i++) {
    	                // Shortcuts
    	                var M2i  = M[offset + 2 * i];
    	                var M2i1 = M[offset + 2 * i + 1];

    	                // Swap endian
    	                M2i = (
    	                    (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
    	                    (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
    	                );
    	                M2i1 = (
    	                    (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
    	                    (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
    	                );

    	                // Absorb message into state
    	                var lane = state[i];
    	                lane.high ^= M2i1;
    	                lane.low  ^= M2i;
    	            }

    	            // Rounds
    	            for (var round = 0; round < 24; round++) {
    	                // Theta
    	                for (var x = 0; x < 5; x++) {
    	                    // Mix column lanes
    	                    var tMsw = 0, tLsw = 0;
    	                    for (var y = 0; y < 5; y++) {
    	                        var lane = state[x + 5 * y];
    	                        tMsw ^= lane.high;
    	                        tLsw ^= lane.low;
    	                    }

    	                    // Temporary values
    	                    var Tx = T[x];
    	                    Tx.high = tMsw;
    	                    Tx.low  = tLsw;
    	                }
    	                for (var x = 0; x < 5; x++) {
    	                    // Shortcuts
    	                    var Tx4 = T[(x + 4) % 5];
    	                    var Tx1 = T[(x + 1) % 5];
    	                    var Tx1Msw = Tx1.high;
    	                    var Tx1Lsw = Tx1.low;

    	                    // Mix surrounding columns
    	                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
    	                    var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
    	                    for (var y = 0; y < 5; y++) {
    	                        var lane = state[x + 5 * y];
    	                        lane.high ^= tMsw;
    	                        lane.low  ^= tLsw;
    	                    }
    	                }

    	                // Rho Pi
    	                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
    	                    var tMsw;
    	                    var tLsw;

    	                    // Shortcuts
    	                    var lane = state[laneIndex];
    	                    var laneMsw = lane.high;
    	                    var laneLsw = lane.low;
    	                    var rhoOffset = RHO_OFFSETS[laneIndex];

    	                    // Rotate lanes
    	                    if (rhoOffset < 32) {
    	                        tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
    	                        tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
    	                    } else /* if (rhoOffset >= 32) */ {
    	                        tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
    	                        tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
    	                    }

    	                    // Transpose lanes
    	                    var TPiLane = T[PI_INDEXES[laneIndex]];
    	                    TPiLane.high = tMsw;
    	                    TPiLane.low  = tLsw;
    	                }

    	                // Rho pi at x = y = 0
    	                var T0 = T[0];
    	                var state0 = state[0];
    	                T0.high = state0.high;
    	                T0.low  = state0.low;

    	                // Chi
    	                for (var x = 0; x < 5; x++) {
    	                    for (var y = 0; y < 5; y++) {
    	                        // Shortcuts
    	                        var laneIndex = x + 5 * y;
    	                        var lane = state[laneIndex];
    	                        var TLane = T[laneIndex];
    	                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
    	                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

    	                        // Mix rows
    	                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
    	                        lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
    	                    }
    	                }

    	                // Iota
    	                var lane = state[0];
    	                var roundConstant = ROUND_CONSTANTS[round];
    	                lane.high ^= roundConstant.high;
    	                lane.low  ^= roundConstant.low;
    	            }
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;
    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;
    	            var blockSizeBits = this.blockSize * 32;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
    	            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
    	            data.sigBytes = dataWords.length * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Shortcuts
    	            var state = this._state;
    	            var outputLengthBytes = this.cfg.outputLength / 8;
    	            var outputLengthLanes = outputLengthBytes / 8;

    	            // Squeeze
    	            var hashWords = [];
    	            for (var i = 0; i < outputLengthLanes; i++) {
    	                // Shortcuts
    	                var lane = state[i];
    	                var laneMsw = lane.high;
    	                var laneLsw = lane.low;

    	                // Swap endian
    	                laneMsw = (
    	                    (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
    	                    (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
    	                );
    	                laneLsw = (
    	                    (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
    	                    (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
    	                );

    	                // Squeeze state to retrieve hash
    	                hashWords.push(laneLsw);
    	                hashWords.push(laneMsw);
    	            }

    	            // Return final computed hash
    	            return new WordArray.init(hashWords, outputLengthBytes);
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);

    	            var state = clone._state = this._state.slice(0);
    	            for (var i = 0; i < 25; i++) {
    	                state[i] = state[i].clone();
    	            }

    	            return clone;
    	        }
    	    });

    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.SHA3('message');
    	     *     var hash = CryptoJS.SHA3(wordArray);
    	     */
    	    C.SHA3 = Hasher._createHelper(SHA3);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacSHA3(message, key);
    	     */
    	    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
    	}(Math));


    	return CryptoJS.SHA3;

    }));
    });

    var ripemd160 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/** @preserve
    	(c) 2012 by Cédric Mesnil. All rights reserved.

    	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

    	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    	*/

    	(function (Math) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var Hasher = C_lib.Hasher;
    	    var C_algo = C.algo;

    	    // Constants table
    	    var _zl = WordArray.create([
    	        0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
    	        7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
    	        3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
    	        1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
    	        4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
    	    var _zr = WordArray.create([
    	        5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
    	        6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
    	        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
    	        8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
    	        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
    	    var _sl = WordArray.create([
    	         11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
    	        7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
    	        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
    	          11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
    	        9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
    	    var _sr = WordArray.create([
    	        8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
    	        9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
    	        9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
    	        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
    	        8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);

    	    var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
    	    var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

    	    /**
    	     * RIPEMD160 hash algorithm.
    	     */
    	    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
    	        _doReset: function () {
    	            this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
    	        },

    	        _doProcessBlock: function (M, offset) {

    	            // Swap endian
    	            for (var i = 0; i < 16; i++) {
    	                // Shortcuts
    	                var offset_i = offset + i;
    	                var M_offset_i = M[offset_i];

    	                // Swap
    	                M[offset_i] = (
    	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
    	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
    	                );
    	            }
    	            // Shortcut
    	            var H  = this._hash.words;
    	            var hl = _hl.words;
    	            var hr = _hr.words;
    	            var zl = _zl.words;
    	            var zr = _zr.words;
    	            var sl = _sl.words;
    	            var sr = _sr.words;

    	            // Working variables
    	            var al, bl, cl, dl, el;
    	            var ar, br, cr, dr, er;

    	            ar = al = H[0];
    	            br = bl = H[1];
    	            cr = cl = H[2];
    	            dr = dl = H[3];
    	            er = el = H[4];
    	            // Computation
    	            var t;
    	            for (var i = 0; i < 80; i += 1) {
    	                t = (al +  M[offset+zl[i]])|0;
    	                if (i<16){
    		            t +=  f1(bl,cl,dl) + hl[0];
    	                } else if (i<32) {
    		            t +=  f2(bl,cl,dl) + hl[1];
    	                } else if (i<48) {
    		            t +=  f3(bl,cl,dl) + hl[2];
    	                } else if (i<64) {
    		            t +=  f4(bl,cl,dl) + hl[3];
    	                } else {// if (i<80) {
    		            t +=  f5(bl,cl,dl) + hl[4];
    	                }
    	                t = t|0;
    	                t =  rotl(t,sl[i]);
    	                t = (t+el)|0;
    	                al = el;
    	                el = dl;
    	                dl = rotl(cl, 10);
    	                cl = bl;
    	                bl = t;

    	                t = (ar + M[offset+zr[i]])|0;
    	                if (i<16){
    		            t +=  f5(br,cr,dr) + hr[0];
    	                } else if (i<32) {
    		            t +=  f4(br,cr,dr) + hr[1];
    	                } else if (i<48) {
    		            t +=  f3(br,cr,dr) + hr[2];
    	                } else if (i<64) {
    		            t +=  f2(br,cr,dr) + hr[3];
    	                } else {// if (i<80) {
    		            t +=  f1(br,cr,dr) + hr[4];
    	                }
    	                t = t|0;
    	                t =  rotl(t,sr[i]) ;
    	                t = (t+er)|0;
    	                ar = er;
    	                er = dr;
    	                dr = rotl(cr, 10);
    	                cr = br;
    	                br = t;
    	            }
    	            // Intermediate hash value
    	            t    = (H[1] + cl + dr)|0;
    	            H[1] = (H[2] + dl + er)|0;
    	            H[2] = (H[3] + el + ar)|0;
    	            H[3] = (H[4] + al + br)|0;
    	            H[4] = (H[0] + bl + cr)|0;
    	            H[0] =  t;
    	        },

    	        _doFinalize: function () {
    	            // Shortcuts
    	            var data = this._data;
    	            var dataWords = data.words;

    	            var nBitsTotal = this._nDataBytes * 8;
    	            var nBitsLeft = data.sigBytes * 8;

    	            // Add padding
    	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
    	                (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
    	                (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
    	            );
    	            data.sigBytes = (dataWords.length + 1) * 4;

    	            // Hash final blocks
    	            this._process();

    	            // Shortcuts
    	            var hash = this._hash;
    	            var H = hash.words;

    	            // Swap endian
    	            for (var i = 0; i < 5; i++) {
    	                // Shortcut
    	                var H_i = H[i];

    	                // Swap
    	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
    	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
    	            }

    	            // Return final computed hash
    	            return hash;
    	        },

    	        clone: function () {
    	            var clone = Hasher.clone.call(this);
    	            clone._hash = this._hash.clone();

    	            return clone;
    	        }
    	    });


    	    function f1(x, y, z) {
    	        return ((x) ^ (y) ^ (z));

    	    }

    	    function f2(x, y, z) {
    	        return (((x)&(y)) | ((~x)&(z)));
    	    }

    	    function f3(x, y, z) {
    	        return (((x) | (~(y))) ^ (z));
    	    }

    	    function f4(x, y, z) {
    	        return (((x) & (z)) | ((y)&(~(z))));
    	    }

    	    function f5(x, y, z) {
    	        return ((x) ^ ((y) |(~(z))));

    	    }

    	    function rotl(x,n) {
    	        return (x<<n) | (x>>>(32-n));
    	    }


    	    /**
    	     * Shortcut function to the hasher's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     *
    	     * @return {WordArray} The hash.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hash = CryptoJS.RIPEMD160('message');
    	     *     var hash = CryptoJS.RIPEMD160(wordArray);
    	     */
    	    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

    	    /**
    	     * Shortcut function to the HMAC's object interface.
    	     *
    	     * @param {WordArray|string} message The message to hash.
    	     * @param {WordArray|string} key The secret key.
    	     *
    	     * @return {WordArray} The HMAC.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
    	     */
    	    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
    	}());


    	return CryptoJS.RIPEMD160;

    }));
    });

    var hmac = createCommonjsModule$2(function (module, exports) {
    (function (root, factory) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Base = C_lib.Base;
    	    var C_enc = C.enc;
    	    var Utf8 = C_enc.Utf8;
    	    var C_algo = C.algo;

    	    /**
    	     * HMAC algorithm.
    	     */
    	    var HMAC = C_algo.HMAC = Base.extend({
    	        /**
    	         * Initializes a newly created HMAC.
    	         *
    	         * @param {Hasher} hasher The hash algorithm to use.
    	         * @param {WordArray|string} key The secret key.
    	         *
    	         * @example
    	         *
    	         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
    	         */
    	        init: function (hasher, key) {
    	            // Init hasher
    	            hasher = this._hasher = new hasher.init();

    	            // Convert string to WordArray, else assume WordArray already
    	            if (typeof key == 'string') {
    	                key = Utf8.parse(key);
    	            }

    	            // Shortcuts
    	            var hasherBlockSize = hasher.blockSize;
    	            var hasherBlockSizeBytes = hasherBlockSize * 4;

    	            // Allow arbitrary length keys
    	            if (key.sigBytes > hasherBlockSizeBytes) {
    	                key = hasher.finalize(key);
    	            }

    	            // Clamp excess bits
    	            key.clamp();

    	            // Clone key for inner and outer pads
    	            var oKey = this._oKey = key.clone();
    	            var iKey = this._iKey = key.clone();

    	            // Shortcuts
    	            var oKeyWords = oKey.words;
    	            var iKeyWords = iKey.words;

    	            // XOR keys with pad constants
    	            for (var i = 0; i < hasherBlockSize; i++) {
    	                oKeyWords[i] ^= 0x5c5c5c5c;
    	                iKeyWords[i] ^= 0x36363636;
    	            }
    	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

    	            // Set initial values
    	            this.reset();
    	        },

    	        /**
    	         * Resets this HMAC to its initial state.
    	         *
    	         * @example
    	         *
    	         *     hmacHasher.reset();
    	         */
    	        reset: function () {
    	            // Shortcut
    	            var hasher = this._hasher;

    	            // Reset
    	            hasher.reset();
    	            hasher.update(this._iKey);
    	        },

    	        /**
    	         * Updates this HMAC with a message.
    	         *
    	         * @param {WordArray|string} messageUpdate The message to append.
    	         *
    	         * @return {HMAC} This HMAC instance.
    	         *
    	         * @example
    	         *
    	         *     hmacHasher.update('message');
    	         *     hmacHasher.update(wordArray);
    	         */
    	        update: function (messageUpdate) {
    	            this._hasher.update(messageUpdate);

    	            // Chainable
    	            return this;
    	        },

    	        /**
    	         * Finalizes the HMAC computation.
    	         * Note that the finalize operation is effectively a destructive, read-once operation.
    	         *
    	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
    	         *
    	         * @return {WordArray} The HMAC.
    	         *
    	         * @example
    	         *
    	         *     var hmac = hmacHasher.finalize();
    	         *     var hmac = hmacHasher.finalize('message');
    	         *     var hmac = hmacHasher.finalize(wordArray);
    	         */
    	        finalize: function (messageUpdate) {
    	            // Shortcut
    	            var hasher = this._hasher;

    	            // Compute HMAC
    	            var innerHash = hasher.finalize(messageUpdate);
    	            hasher.reset();
    	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

    	            return hmac;
    	        }
    	    });
    	}());


    }));
    });

    var pbkdf2 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, sha1, hmac);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Base = C_lib.Base;
    	    var WordArray = C_lib.WordArray;
    	    var C_algo = C.algo;
    	    var SHA1 = C_algo.SHA1;
    	    var HMAC = C_algo.HMAC;

    	    /**
    	     * Password-Based Key Derivation Function 2 algorithm.
    	     */
    	    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
    	         * @property {Hasher} hasher The hasher to use. Default: SHA1
    	         * @property {number} iterations The number of iterations to perform. Default: 1
    	         */
    	        cfg: Base.extend({
    	            keySize: 128/32,
    	            hasher: SHA1,
    	            iterations: 1
    	        }),

    	        /**
    	         * Initializes a newly created key derivation function.
    	         *
    	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
    	         *
    	         * @example
    	         *
    	         *     var kdf = CryptoJS.algo.PBKDF2.create();
    	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
    	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
    	         */
    	        init: function (cfg) {
    	            this.cfg = this.cfg.extend(cfg);
    	        },

    	        /**
    	         * Computes the Password-Based Key Derivation Function 2.
    	         *
    	         * @param {WordArray|string} password The password.
    	         * @param {WordArray|string} salt A salt.
    	         *
    	         * @return {WordArray} The derived key.
    	         *
    	         * @example
    	         *
    	         *     var key = kdf.compute(password, salt);
    	         */
    	        compute: function (password, salt) {
    	            // Shortcut
    	            var cfg = this.cfg;

    	            // Init HMAC
    	            var hmac = HMAC.create(cfg.hasher, password);

    	            // Initial values
    	            var derivedKey = WordArray.create();
    	            var blockIndex = WordArray.create([0x00000001]);

    	            // Shortcuts
    	            var derivedKeyWords = derivedKey.words;
    	            var blockIndexWords = blockIndex.words;
    	            var keySize = cfg.keySize;
    	            var iterations = cfg.iterations;

    	            // Generate key
    	            while (derivedKeyWords.length < keySize) {
    	                var block = hmac.update(salt).finalize(blockIndex);
    	                hmac.reset();

    	                // Shortcuts
    	                var blockWords = block.words;
    	                var blockWordsLength = blockWords.length;

    	                // Iterations
    	                var intermediate = block;
    	                for (var i = 1; i < iterations; i++) {
    	                    intermediate = hmac.finalize(intermediate);
    	                    hmac.reset();

    	                    // Shortcut
    	                    var intermediateWords = intermediate.words;

    	                    // XOR intermediate with block
    	                    for (var j = 0; j < blockWordsLength; j++) {
    	                        blockWords[j] ^= intermediateWords[j];
    	                    }
    	                }

    	                derivedKey.concat(block);
    	                blockIndexWords[0]++;
    	            }
    	            derivedKey.sigBytes = keySize * 4;

    	            return derivedKey;
    	        }
    	    });

    	    /**
    	     * Computes the Password-Based Key Derivation Function 2.
    	     *
    	     * @param {WordArray|string} password The password.
    	     * @param {WordArray|string} salt A salt.
    	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
    	     *
    	     * @return {WordArray} The derived key.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var key = CryptoJS.PBKDF2(password, salt);
    	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
    	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
    	     */
    	    C.PBKDF2 = function (password, salt, cfg) {
    	        return PBKDF2.create(cfg).compute(password, salt);
    	    };
    	}());


    	return CryptoJS.PBKDF2;

    }));
    });

    var evpkdf = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, sha1, hmac);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Base = C_lib.Base;
    	    var WordArray = C_lib.WordArray;
    	    var C_algo = C.algo;
    	    var MD5 = C_algo.MD5;

    	    /**
    	     * This key derivation function is meant to conform with EVP_BytesToKey.
    	     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
    	     */
    	    var EvpKDF = C_algo.EvpKDF = Base.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
    	         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
    	         * @property {number} iterations The number of iterations to perform. Default: 1
    	         */
    	        cfg: Base.extend({
    	            keySize: 128/32,
    	            hasher: MD5,
    	            iterations: 1
    	        }),

    	        /**
    	         * Initializes a newly created key derivation function.
    	         *
    	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
    	         *
    	         * @example
    	         *
    	         *     var kdf = CryptoJS.algo.EvpKDF.create();
    	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
    	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
    	         */
    	        init: function (cfg) {
    	            this.cfg = this.cfg.extend(cfg);
    	        },

    	        /**
    	         * Derives a key from a password.
    	         *
    	         * @param {WordArray|string} password The password.
    	         * @param {WordArray|string} salt A salt.
    	         *
    	         * @return {WordArray} The derived key.
    	         *
    	         * @example
    	         *
    	         *     var key = kdf.compute(password, salt);
    	         */
    	        compute: function (password, salt) {
    	            var block;

    	            // Shortcut
    	            var cfg = this.cfg;

    	            // Init hasher
    	            var hasher = cfg.hasher.create();

    	            // Initial values
    	            var derivedKey = WordArray.create();

    	            // Shortcuts
    	            var derivedKeyWords = derivedKey.words;
    	            var keySize = cfg.keySize;
    	            var iterations = cfg.iterations;

    	            // Generate key
    	            while (derivedKeyWords.length < keySize) {
    	                if (block) {
    	                    hasher.update(block);
    	                }
    	                block = hasher.update(password).finalize(salt);
    	                hasher.reset();

    	                // Iterations
    	                for (var i = 1; i < iterations; i++) {
    	                    block = hasher.finalize(block);
    	                    hasher.reset();
    	                }

    	                derivedKey.concat(block);
    	            }
    	            derivedKey.sigBytes = keySize * 4;

    	            return derivedKey;
    	        }
    	    });

    	    /**
    	     * Derives a key from a password.
    	     *
    	     * @param {WordArray|string} password The password.
    	     * @param {WordArray|string} salt A salt.
    	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
    	     *
    	     * @return {WordArray} The derived key.
    	     *
    	     * @static
    	     *
    	     * @example
    	     *
    	     *     var key = CryptoJS.EvpKDF(password, salt);
    	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
    	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
    	     */
    	    C.EvpKDF = function (password, salt, cfg) {
    	        return EvpKDF.create(cfg).compute(password, salt);
    	    };
    	}());


    	return CryptoJS.EvpKDF;

    }));
    });

    var cipherCore = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, evpkdf);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Cipher core components.
    	 */
    	CryptoJS.lib.Cipher || (function (undefined$1) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var Base = C_lib.Base;
    	    var WordArray = C_lib.WordArray;
    	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
    	    var C_enc = C.enc;
    	    var Utf8 = C_enc.Utf8;
    	    var Base64 = C_enc.Base64;
    	    var C_algo = C.algo;
    	    var EvpKDF = C_algo.EvpKDF;

    	    /**
    	     * Abstract base cipher template.
    	     *
    	     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
    	     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
    	     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
    	     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
    	     */
    	    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {WordArray} iv The IV to use for this operation.
    	         */
    	        cfg: Base.extend(),

    	        /**
    	         * Creates this cipher in encryption mode.
    	         *
    	         * @param {WordArray} key The key.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {Cipher} A cipher instance.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
    	         */
    	        createEncryptor: function (key, cfg) {
    	            return this.create(this._ENC_XFORM_MODE, key, cfg);
    	        },

    	        /**
    	         * Creates this cipher in decryption mode.
    	         *
    	         * @param {WordArray} key The key.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {Cipher} A cipher instance.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
    	         */
    	        createDecryptor: function (key, cfg) {
    	            return this.create(this._DEC_XFORM_MODE, key, cfg);
    	        },

    	        /**
    	         * Initializes a newly created cipher.
    	         *
    	         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
    	         * @param {WordArray} key The key.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @example
    	         *
    	         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
    	         */
    	        init: function (xformMode, key, cfg) {
    	            // Apply config defaults
    	            this.cfg = this.cfg.extend(cfg);

    	            // Store transform mode and key
    	            this._xformMode = xformMode;
    	            this._key = key;

    	            // Set initial values
    	            this.reset();
    	        },

    	        /**
    	         * Resets this cipher to its initial state.
    	         *
    	         * @example
    	         *
    	         *     cipher.reset();
    	         */
    	        reset: function () {
    	            // Reset data buffer
    	            BufferedBlockAlgorithm.reset.call(this);

    	            // Perform concrete-cipher logic
    	            this._doReset();
    	        },

    	        /**
    	         * Adds data to be encrypted or decrypted.
    	         *
    	         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
    	         *
    	         * @return {WordArray} The data after processing.
    	         *
    	         * @example
    	         *
    	         *     var encrypted = cipher.process('data');
    	         *     var encrypted = cipher.process(wordArray);
    	         */
    	        process: function (dataUpdate) {
    	            // Append
    	            this._append(dataUpdate);

    	            // Process available blocks
    	            return this._process();
    	        },

    	        /**
    	         * Finalizes the encryption or decryption process.
    	         * Note that the finalize operation is effectively a destructive, read-once operation.
    	         *
    	         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
    	         *
    	         * @return {WordArray} The data after final processing.
    	         *
    	         * @example
    	         *
    	         *     var encrypted = cipher.finalize();
    	         *     var encrypted = cipher.finalize('data');
    	         *     var encrypted = cipher.finalize(wordArray);
    	         */
    	        finalize: function (dataUpdate) {
    	            // Final data update
    	            if (dataUpdate) {
    	                this._append(dataUpdate);
    	            }

    	            // Perform concrete-cipher logic
    	            var finalProcessedData = this._doFinalize();

    	            return finalProcessedData;
    	        },

    	        keySize: 128/32,

    	        ivSize: 128/32,

    	        _ENC_XFORM_MODE: 1,

    	        _DEC_XFORM_MODE: 2,

    	        /**
    	         * Creates shortcut functions to a cipher's object interface.
    	         *
    	         * @param {Cipher} cipher The cipher to create a helper for.
    	         *
    	         * @return {Object} An object with encrypt and decrypt shortcut functions.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
    	         */
    	        _createHelper: (function () {
    	            function selectCipherStrategy(key) {
    	                if (typeof key == 'string') {
    	                    return PasswordBasedCipher;
    	                } else {
    	                    return SerializableCipher;
    	                }
    	            }

    	            return function (cipher) {
    	                return {
    	                    encrypt: function (message, key, cfg) {
    	                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
    	                    },

    	                    decrypt: function (ciphertext, key, cfg) {
    	                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
    	                    }
    	                };
    	            };
    	        }())
    	    });

    	    /**
    	     * Abstract base stream cipher template.
    	     *
    	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
    	     */
    	    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
    	        _doFinalize: function () {
    	            // Process partial blocks
    	            var finalProcessedBlocks = this._process(!!'flush');

    	            return finalProcessedBlocks;
    	        },

    	        blockSize: 1
    	    });

    	    /**
    	     * Mode namespace.
    	     */
    	    var C_mode = C.mode = {};

    	    /**
    	     * Abstract base block cipher mode template.
    	     */
    	    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
    	        /**
    	         * Creates this mode for encryption.
    	         *
    	         * @param {Cipher} cipher A block cipher instance.
    	         * @param {Array} iv The IV words.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
    	         */
    	        createEncryptor: function (cipher, iv) {
    	            return this.Encryptor.create(cipher, iv);
    	        },

    	        /**
    	         * Creates this mode for decryption.
    	         *
    	         * @param {Cipher} cipher A block cipher instance.
    	         * @param {Array} iv The IV words.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
    	         */
    	        createDecryptor: function (cipher, iv) {
    	            return this.Decryptor.create(cipher, iv);
    	        },

    	        /**
    	         * Initializes a newly created mode.
    	         *
    	         * @param {Cipher} cipher A block cipher instance.
    	         * @param {Array} iv The IV words.
    	         *
    	         * @example
    	         *
    	         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
    	         */
    	        init: function (cipher, iv) {
    	            this._cipher = cipher;
    	            this._iv = iv;
    	        }
    	    });

    	    /**
    	     * Cipher Block Chaining mode.
    	     */
    	    var CBC = C_mode.CBC = (function () {
    	        /**
    	         * Abstract base CBC mode.
    	         */
    	        var CBC = BlockCipherMode.extend();

    	        /**
    	         * CBC encryptor.
    	         */
    	        CBC.Encryptor = CBC.extend({
    	            /**
    	             * Processes the data block at offset.
    	             *
    	             * @param {Array} words The data words to operate on.
    	             * @param {number} offset The offset where the block starts.
    	             *
    	             * @example
    	             *
    	             *     mode.processBlock(data.words, offset);
    	             */
    	            processBlock: function (words, offset) {
    	                // Shortcuts
    	                var cipher = this._cipher;
    	                var blockSize = cipher.blockSize;

    	                // XOR and encrypt
    	                xorBlock.call(this, words, offset, blockSize);
    	                cipher.encryptBlock(words, offset);

    	                // Remember this block to use with next block
    	                this._prevBlock = words.slice(offset, offset + blockSize);
    	            }
    	        });

    	        /**
    	         * CBC decryptor.
    	         */
    	        CBC.Decryptor = CBC.extend({
    	            /**
    	             * Processes the data block at offset.
    	             *
    	             * @param {Array} words The data words to operate on.
    	             * @param {number} offset The offset where the block starts.
    	             *
    	             * @example
    	             *
    	             *     mode.processBlock(data.words, offset);
    	             */
    	            processBlock: function (words, offset) {
    	                // Shortcuts
    	                var cipher = this._cipher;
    	                var blockSize = cipher.blockSize;

    	                // Remember this block to use with next block
    	                var thisBlock = words.slice(offset, offset + blockSize);

    	                // Decrypt and XOR
    	                cipher.decryptBlock(words, offset);
    	                xorBlock.call(this, words, offset, blockSize);

    	                // This block becomes the previous block
    	                this._prevBlock = thisBlock;
    	            }
    	        });

    	        function xorBlock(words, offset, blockSize) {
    	            var block;

    	            // Shortcut
    	            var iv = this._iv;

    	            // Choose mixing block
    	            if (iv) {
    	                block = iv;

    	                // Remove IV for subsequent blocks
    	                this._iv = undefined$1;
    	            } else {
    	                block = this._prevBlock;
    	            }

    	            // XOR blocks
    	            for (var i = 0; i < blockSize; i++) {
    	                words[offset + i] ^= block[i];
    	            }
    	        }

    	        return CBC;
    	    }());

    	    /**
    	     * Padding namespace.
    	     */
    	    var C_pad = C.pad = {};

    	    /**
    	     * PKCS #5/7 padding strategy.
    	     */
    	    var Pkcs7 = C_pad.Pkcs7 = {
    	        /**
    	         * Pads data using the algorithm defined in PKCS #5/7.
    	         *
    	         * @param {WordArray} data The data to pad.
    	         * @param {number} blockSize The multiple that the data should be padded to.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
    	         */
    	        pad: function (data, blockSize) {
    	            // Shortcut
    	            var blockSizeBytes = blockSize * 4;

    	            // Count padding bytes
    	            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

    	            // Create padding word
    	            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

    	            // Create padding
    	            var paddingWords = [];
    	            for (var i = 0; i < nPaddingBytes; i += 4) {
    	                paddingWords.push(paddingWord);
    	            }
    	            var padding = WordArray.create(paddingWords, nPaddingBytes);

    	            // Add padding
    	            data.concat(padding);
    	        },

    	        /**
    	         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
    	         *
    	         * @param {WordArray} data The data to unpad.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
    	         */
    	        unpad: function (data) {
    	            // Get number of padding bytes from last byte
    	            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

    	            // Remove padding
    	            data.sigBytes -= nPaddingBytes;
    	        }
    	    };

    	    /**
    	     * Abstract base block cipher template.
    	     *
    	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
    	     */
    	    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {Mode} mode The block mode to use. Default: CBC
    	         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
    	         */
    	        cfg: Cipher.cfg.extend({
    	            mode: CBC,
    	            padding: Pkcs7
    	        }),

    	        reset: function () {
    	            var modeCreator;

    	            // Reset cipher
    	            Cipher.reset.call(this);

    	            // Shortcuts
    	            var cfg = this.cfg;
    	            var iv = cfg.iv;
    	            var mode = cfg.mode;

    	            // Reset block mode
    	            if (this._xformMode == this._ENC_XFORM_MODE) {
    	                modeCreator = mode.createEncryptor;
    	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
    	                modeCreator = mode.createDecryptor;
    	                // Keep at least one block in the buffer for unpadding
    	                this._minBufferSize = 1;
    	            }

    	            if (this._mode && this._mode.__creator == modeCreator) {
    	                this._mode.init(this, iv && iv.words);
    	            } else {
    	                this._mode = modeCreator.call(mode, this, iv && iv.words);
    	                this._mode.__creator = modeCreator;
    	            }
    	        },

    	        _doProcessBlock: function (words, offset) {
    	            this._mode.processBlock(words, offset);
    	        },

    	        _doFinalize: function () {
    	            var finalProcessedBlocks;

    	            // Shortcut
    	            var padding = this.cfg.padding;

    	            // Finalize
    	            if (this._xformMode == this._ENC_XFORM_MODE) {
    	                // Pad data
    	                padding.pad(this._data, this.blockSize);

    	                // Process final blocks
    	                finalProcessedBlocks = this._process(!!'flush');
    	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
    	                // Process final blocks
    	                finalProcessedBlocks = this._process(!!'flush');

    	                // Unpad data
    	                padding.unpad(finalProcessedBlocks);
    	            }

    	            return finalProcessedBlocks;
    	        },

    	        blockSize: 128/32
    	    });

    	    /**
    	     * A collection of cipher parameters.
    	     *
    	     * @property {WordArray} ciphertext The raw ciphertext.
    	     * @property {WordArray} key The key to this ciphertext.
    	     * @property {WordArray} iv The IV used in the ciphering operation.
    	     * @property {WordArray} salt The salt used with a key derivation function.
    	     * @property {Cipher} algorithm The cipher algorithm.
    	     * @property {Mode} mode The block mode used in the ciphering operation.
    	     * @property {Padding} padding The padding scheme used in the ciphering operation.
    	     * @property {number} blockSize The block size of the cipher.
    	     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
    	     */
    	    var CipherParams = C_lib.CipherParams = Base.extend({
    	        /**
    	         * Initializes a newly created cipher params object.
    	         *
    	         * @param {Object} cipherParams An object with any of the possible cipher parameters.
    	         *
    	         * @example
    	         *
    	         *     var cipherParams = CryptoJS.lib.CipherParams.create({
    	         *         ciphertext: ciphertextWordArray,
    	         *         key: keyWordArray,
    	         *         iv: ivWordArray,
    	         *         salt: saltWordArray,
    	         *         algorithm: CryptoJS.algo.AES,
    	         *         mode: CryptoJS.mode.CBC,
    	         *         padding: CryptoJS.pad.PKCS7,
    	         *         blockSize: 4,
    	         *         formatter: CryptoJS.format.OpenSSL
    	         *     });
    	         */
    	        init: function (cipherParams) {
    	            this.mixIn(cipherParams);
    	        },

    	        /**
    	         * Converts this cipher params object to a string.
    	         *
    	         * @param {Format} formatter (Optional) The formatting strategy to use.
    	         *
    	         * @return {string} The stringified cipher params.
    	         *
    	         * @throws Error If neither the formatter nor the default formatter is set.
    	         *
    	         * @example
    	         *
    	         *     var string = cipherParams + '';
    	         *     var string = cipherParams.toString();
    	         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
    	         */
    	        toString: function (formatter) {
    	            return (formatter || this.formatter).stringify(this);
    	        }
    	    });

    	    /**
    	     * Format namespace.
    	     */
    	    var C_format = C.format = {};

    	    /**
    	     * OpenSSL formatting strategy.
    	     */
    	    var OpenSSLFormatter = C_format.OpenSSL = {
    	        /**
    	         * Converts a cipher params object to an OpenSSL-compatible string.
    	         *
    	         * @param {CipherParams} cipherParams The cipher params object.
    	         *
    	         * @return {string} The OpenSSL-compatible string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
    	         */
    	        stringify: function (cipherParams) {
    	            var wordArray;

    	            // Shortcuts
    	            var ciphertext = cipherParams.ciphertext;
    	            var salt = cipherParams.salt;

    	            // Format
    	            if (salt) {
    	                wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
    	            } else {
    	                wordArray = ciphertext;
    	            }

    	            return wordArray.toString(Base64);
    	        },

    	        /**
    	         * Converts an OpenSSL-compatible string to a cipher params object.
    	         *
    	         * @param {string} openSSLStr The OpenSSL-compatible string.
    	         *
    	         * @return {CipherParams} The cipher params object.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
    	         */
    	        parse: function (openSSLStr) {
    	            var salt;

    	            // Parse base64
    	            var ciphertext = Base64.parse(openSSLStr);

    	            // Shortcut
    	            var ciphertextWords = ciphertext.words;

    	            // Test for salt
    	            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
    	                // Extract salt
    	                salt = WordArray.create(ciphertextWords.slice(2, 4));

    	                // Remove salt from ciphertext
    	                ciphertextWords.splice(0, 4);
    	                ciphertext.sigBytes -= 16;
    	            }

    	            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
    	        }
    	    };

    	    /**
    	     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
    	     */
    	    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
    	         */
    	        cfg: Base.extend({
    	            format: OpenSSLFormatter
    	        }),

    	        /**
    	         * Encrypts a message.
    	         *
    	         * @param {Cipher} cipher The cipher algorithm to use.
    	         * @param {WordArray|string} message The message to encrypt.
    	         * @param {WordArray} key The key.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {CipherParams} A cipher params object.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
    	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
    	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
    	         */
    	        encrypt: function (cipher, message, key, cfg) {
    	            // Apply config defaults
    	            cfg = this.cfg.extend(cfg);

    	            // Encrypt
    	            var encryptor = cipher.createEncryptor(key, cfg);
    	            var ciphertext = encryptor.finalize(message);

    	            // Shortcut
    	            var cipherCfg = encryptor.cfg;

    	            // Create and return serializable cipher params
    	            return CipherParams.create({
    	                ciphertext: ciphertext,
    	                key: key,
    	                iv: cipherCfg.iv,
    	                algorithm: cipher,
    	                mode: cipherCfg.mode,
    	                padding: cipherCfg.padding,
    	                blockSize: cipher.blockSize,
    	                formatter: cfg.format
    	            });
    	        },

    	        /**
    	         * Decrypts serialized ciphertext.
    	         *
    	         * @param {Cipher} cipher The cipher algorithm to use.
    	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
    	         * @param {WordArray} key The key.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {WordArray} The plaintext.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
    	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
    	         */
    	        decrypt: function (cipher, ciphertext, key, cfg) {
    	            // Apply config defaults
    	            cfg = this.cfg.extend(cfg);

    	            // Convert string to CipherParams
    	            ciphertext = this._parse(ciphertext, cfg.format);

    	            // Decrypt
    	            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

    	            return plaintext;
    	        },

    	        /**
    	         * Converts serialized ciphertext to CipherParams,
    	         * else assumed CipherParams already and returns ciphertext unchanged.
    	         *
    	         * @param {CipherParams|string} ciphertext The ciphertext.
    	         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
    	         *
    	         * @return {CipherParams} The unserialized ciphertext.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
    	         */
    	        _parse: function (ciphertext, format) {
    	            if (typeof ciphertext == 'string') {
    	                return format.parse(ciphertext, this);
    	            } else {
    	                return ciphertext;
    	            }
    	        }
    	    });

    	    /**
    	     * Key derivation function namespace.
    	     */
    	    var C_kdf = C.kdf = {};

    	    /**
    	     * OpenSSL key derivation function.
    	     */
    	    var OpenSSLKdf = C_kdf.OpenSSL = {
    	        /**
    	         * Derives a key and IV from a password.
    	         *
    	         * @param {string} password The password to derive from.
    	         * @param {number} keySize The size in words of the key to generate.
    	         * @param {number} ivSize The size in words of the IV to generate.
    	         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
    	         *
    	         * @return {CipherParams} A cipher params object with the key, IV, and salt.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
    	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
    	         */
    	        execute: function (password, keySize, ivSize, salt) {
    	            // Generate random salt
    	            if (!salt) {
    	                salt = WordArray.random(64/8);
    	            }

    	            // Derive key and IV
    	            var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

    	            // Separate key and IV
    	            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
    	            key.sigBytes = keySize * 4;

    	            // Return params
    	            return CipherParams.create({ key: key, iv: iv, salt: salt });
    	        }
    	    };

    	    /**
    	     * A serializable cipher wrapper that derives the key from a password,
    	     * and returns ciphertext as a serializable cipher params object.
    	     */
    	    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
    	         */
    	        cfg: SerializableCipher.cfg.extend({
    	            kdf: OpenSSLKdf
    	        }),

    	        /**
    	         * Encrypts a message using a password.
    	         *
    	         * @param {Cipher} cipher The cipher algorithm to use.
    	         * @param {WordArray|string} message The message to encrypt.
    	         * @param {string} password The password.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {CipherParams} A cipher params object.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
    	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
    	         */
    	        encrypt: function (cipher, message, password, cfg) {
    	            // Apply config defaults
    	            cfg = this.cfg.extend(cfg);

    	            // Derive key and other params
    	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

    	            // Add IV to config
    	            cfg.iv = derivedParams.iv;

    	            // Encrypt
    	            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

    	            // Mix in derived params
    	            ciphertext.mixIn(derivedParams);

    	            return ciphertext;
    	        },

    	        /**
    	         * Decrypts serialized ciphertext using a password.
    	         *
    	         * @param {Cipher} cipher The cipher algorithm to use.
    	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
    	         * @param {string} password The password.
    	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
    	         *
    	         * @return {WordArray} The plaintext.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
    	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
    	         */
    	        decrypt: function (cipher, ciphertext, password, cfg) {
    	            // Apply config defaults
    	            cfg = this.cfg.extend(cfg);

    	            // Convert string to CipherParams
    	            ciphertext = this._parse(ciphertext, cfg.format);

    	            // Derive key and other params
    	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

    	            // Add IV to config
    	            cfg.iv = derivedParams.iv;

    	            // Decrypt
    	            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

    	            return plaintext;
    	        }
    	    });
    	}());


    }));
    });

    var modeCfb = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Cipher Feedback block mode.
    	 */
    	CryptoJS.mode.CFB = (function () {
    	    var CFB = CryptoJS.lib.BlockCipherMode.extend();

    	    CFB.Encryptor = CFB.extend({
    	        processBlock: function (words, offset) {
    	            // Shortcuts
    	            var cipher = this._cipher;
    	            var blockSize = cipher.blockSize;

    	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

    	            // Remember this block to use with next block
    	            this._prevBlock = words.slice(offset, offset + blockSize);
    	        }
    	    });

    	    CFB.Decryptor = CFB.extend({
    	        processBlock: function (words, offset) {
    	            // Shortcuts
    	            var cipher = this._cipher;
    	            var blockSize = cipher.blockSize;

    	            // Remember this block to use with next block
    	            var thisBlock = words.slice(offset, offset + blockSize);

    	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

    	            // This block becomes the previous block
    	            this._prevBlock = thisBlock;
    	        }
    	    });

    	    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
    	        var keystream;

    	        // Shortcut
    	        var iv = this._iv;

    	        // Generate keystream
    	        if (iv) {
    	            keystream = iv.slice(0);

    	            // Remove IV for subsequent blocks
    	            this._iv = undefined;
    	        } else {
    	            keystream = this._prevBlock;
    	        }
    	        cipher.encryptBlock(keystream, 0);

    	        // Encrypt
    	        for (var i = 0; i < blockSize; i++) {
    	            words[offset + i] ^= keystream[i];
    	        }
    	    }

    	    return CFB;
    	}());


    	return CryptoJS.mode.CFB;

    }));
    });

    var modeCtr = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Counter block mode.
    	 */
    	CryptoJS.mode.CTR = (function () {
    	    var CTR = CryptoJS.lib.BlockCipherMode.extend();

    	    var Encryptor = CTR.Encryptor = CTR.extend({
    	        processBlock: function (words, offset) {
    	            // Shortcuts
    	            var cipher = this._cipher;
    	            var blockSize = cipher.blockSize;
    	            var iv = this._iv;
    	            var counter = this._counter;

    	            // Generate keystream
    	            if (iv) {
    	                counter = this._counter = iv.slice(0);

    	                // Remove IV for subsequent blocks
    	                this._iv = undefined;
    	            }
    	            var keystream = counter.slice(0);
    	            cipher.encryptBlock(keystream, 0);

    	            // Increment counter
    	            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0;

    	            // Encrypt
    	            for (var i = 0; i < blockSize; i++) {
    	                words[offset + i] ^= keystream[i];
    	            }
    	        }
    	    });

    	    CTR.Decryptor = Encryptor;

    	    return CTR;
    	}());


    	return CryptoJS.mode.CTR;

    }));
    });

    var modeCtrGladman = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/** @preserve
    	 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
    	 * derived from CryptoJS.mode.CTR
    	 * Jan Hruby jhruby.web@gmail.com
    	 */
    	CryptoJS.mode.CTRGladman = (function () {
    	    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

    		function incWord(word)
    		{
    			if (((word >> 24) & 0xff) === 0xff) { //overflow
    			var b1 = (word >> 16)&0xff;
    			var b2 = (word >> 8)&0xff;
    			var b3 = word & 0xff;

    			if (b1 === 0xff) // overflow b1
    			{
    			b1 = 0;
    			if (b2 === 0xff)
    			{
    				b2 = 0;
    				if (b3 === 0xff)
    				{
    					b3 = 0;
    				}
    				else
    				{
    					++b3;
    				}
    			}
    			else
    			{
    				++b2;
    			}
    			}
    			else
    			{
    			++b1;
    			}

    			word = 0;
    			word += (b1 << 16);
    			word += (b2 << 8);
    			word += b3;
    			}
    			else
    			{
    			word += (0x01 << 24);
    			}
    			return word;
    		}

    		function incCounter(counter)
    		{
    			if ((counter[0] = incWord(counter[0])) === 0)
    			{
    				// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
    				counter[1] = incWord(counter[1]);
    			}
    			return counter;
    		}

    	    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
    	        processBlock: function (words, offset) {
    	            // Shortcuts
    	            var cipher = this._cipher;
    	            var blockSize = cipher.blockSize;
    	            var iv = this._iv;
    	            var counter = this._counter;

    	            // Generate keystream
    	            if (iv) {
    	                counter = this._counter = iv.slice(0);

    	                // Remove IV for subsequent blocks
    	                this._iv = undefined;
    	            }

    				incCounter(counter);

    				var keystream = counter.slice(0);
    	            cipher.encryptBlock(keystream, 0);

    	            // Encrypt
    	            for (var i = 0; i < blockSize; i++) {
    	                words[offset + i] ^= keystream[i];
    	            }
    	        }
    	    });

    	    CTRGladman.Decryptor = Encryptor;

    	    return CTRGladman;
    	}());




    	return CryptoJS.mode.CTRGladman;

    }));
    });

    var modeOfb = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Output Feedback block mode.
    	 */
    	CryptoJS.mode.OFB = (function () {
    	    var OFB = CryptoJS.lib.BlockCipherMode.extend();

    	    var Encryptor = OFB.Encryptor = OFB.extend({
    	        processBlock: function (words, offset) {
    	            // Shortcuts
    	            var cipher = this._cipher;
    	            var blockSize = cipher.blockSize;
    	            var iv = this._iv;
    	            var keystream = this._keystream;

    	            // Generate keystream
    	            if (iv) {
    	                keystream = this._keystream = iv.slice(0);

    	                // Remove IV for subsequent blocks
    	                this._iv = undefined;
    	            }
    	            cipher.encryptBlock(keystream, 0);

    	            // Encrypt
    	            for (var i = 0; i < blockSize; i++) {
    	                words[offset + i] ^= keystream[i];
    	            }
    	        }
    	    });

    	    OFB.Decryptor = Encryptor;

    	    return OFB;
    	}());


    	return CryptoJS.mode.OFB;

    }));
    });

    var modeEcb = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Electronic Codebook block mode.
    	 */
    	CryptoJS.mode.ECB = (function () {
    	    var ECB = CryptoJS.lib.BlockCipherMode.extend();

    	    ECB.Encryptor = ECB.extend({
    	        processBlock: function (words, offset) {
    	            this._cipher.encryptBlock(words, offset);
    	        }
    	    });

    	    ECB.Decryptor = ECB.extend({
    	        processBlock: function (words, offset) {
    	            this._cipher.decryptBlock(words, offset);
    	        }
    	    });

    	    return ECB;
    	}());


    	return CryptoJS.mode.ECB;

    }));
    });

    var padAnsix923 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * ANSI X.923 padding strategy.
    	 */
    	CryptoJS.pad.AnsiX923 = {
    	    pad: function (data, blockSize) {
    	        // Shortcuts
    	        var dataSigBytes = data.sigBytes;
    	        var blockSizeBytes = blockSize * 4;

    	        // Count padding bytes
    	        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

    	        // Compute last byte position
    	        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

    	        // Pad
    	        data.clamp();
    	        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
    	        data.sigBytes += nPaddingBytes;
    	    },

    	    unpad: function (data) {
    	        // Get number of padding bytes from last byte
    	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

    	        // Remove padding
    	        data.sigBytes -= nPaddingBytes;
    	    }
    	};


    	return CryptoJS.pad.Ansix923;

    }));
    });

    var padIso10126 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * ISO 10126 padding strategy.
    	 */
    	CryptoJS.pad.Iso10126 = {
    	    pad: function (data, blockSize) {
    	        // Shortcut
    	        var blockSizeBytes = blockSize * 4;

    	        // Count padding bytes
    	        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

    	        // Pad
    	        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
    	             concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
    	    },

    	    unpad: function (data) {
    	        // Get number of padding bytes from last byte
    	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

    	        // Remove padding
    	        data.sigBytes -= nPaddingBytes;
    	    }
    	};


    	return CryptoJS.pad.Iso10126;

    }));
    });

    var padIso97971 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * ISO/IEC 9797-1 Padding Method 2.
    	 */
    	CryptoJS.pad.Iso97971 = {
    	    pad: function (data, blockSize) {
    	        // Add 0x80 byte
    	        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

    	        // Zero pad the rest
    	        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
    	    },

    	    unpad: function (data) {
    	        // Remove zero padding
    	        CryptoJS.pad.ZeroPadding.unpad(data);

    	        // Remove one more byte -- the 0x80 byte
    	        data.sigBytes--;
    	    }
    	};


    	return CryptoJS.pad.Iso97971;

    }));
    });

    var padZeropadding = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * Zero padding strategy.
    	 */
    	CryptoJS.pad.ZeroPadding = {
    	    pad: function (data, blockSize) {
    	        // Shortcut
    	        var blockSizeBytes = blockSize * 4;

    	        // Pad
    	        data.clamp();
    	        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
    	    },

    	    unpad: function (data) {
    	        // Shortcut
    	        var dataWords = data.words;

    	        // Unpad
    	        var i = data.sigBytes - 1;
    	        for (var i = data.sigBytes - 1; i >= 0; i--) {
    	            if (((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
    	                data.sigBytes = i + 1;
    	                break;
    	            }
    	        }
    	    }
    	};


    	return CryptoJS.pad.ZeroPadding;

    }));
    });

    var padNopadding = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	/**
    	 * A noop padding strategy.
    	 */
    	CryptoJS.pad.NoPadding = {
    	    pad: function () {
    	    },

    	    unpad: function () {
    	    }
    	};


    	return CryptoJS.pad.NoPadding;

    }));
    });

    var formatHex = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function (undefined$1) {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var CipherParams = C_lib.CipherParams;
    	    var C_enc = C.enc;
    	    var Hex = C_enc.Hex;
    	    var C_format = C.format;

    	    var HexFormatter = C_format.Hex = {
    	        /**
    	         * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
    	         *
    	         * @param {CipherParams} cipherParams The cipher params object.
    	         *
    	         * @return {string} The hexadecimally encoded string.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
    	         */
    	        stringify: function (cipherParams) {
    	            return cipherParams.ciphertext.toString(Hex);
    	        },

    	        /**
    	         * Converts a hexadecimally encoded ciphertext string to a cipher params object.
    	         *
    	         * @param {string} input The hexadecimally encoded string.
    	         *
    	         * @return {CipherParams} The cipher params object.
    	         *
    	         * @static
    	         *
    	         * @example
    	         *
    	         *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
    	         */
    	        parse: function (input) {
    	            var ciphertext = Hex.parse(input);
    	            return CipherParams.create({ ciphertext: ciphertext });
    	        }
    	    };
    	}());


    	return CryptoJS.format.Hex;

    }));
    });

    var aes = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, encBase64, md5, evpkdf, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var BlockCipher = C_lib.BlockCipher;
    	    var C_algo = C.algo;

    	    // Lookup tables
    	    var SBOX = [];
    	    var INV_SBOX = [];
    	    var SUB_MIX_0 = [];
    	    var SUB_MIX_1 = [];
    	    var SUB_MIX_2 = [];
    	    var SUB_MIX_3 = [];
    	    var INV_SUB_MIX_0 = [];
    	    var INV_SUB_MIX_1 = [];
    	    var INV_SUB_MIX_2 = [];
    	    var INV_SUB_MIX_3 = [];

    	    // Compute lookup tables
    	    (function () {
    	        // Compute double table
    	        var d = [];
    	        for (var i = 0; i < 256; i++) {
    	            if (i < 128) {
    	                d[i] = i << 1;
    	            } else {
    	                d[i] = (i << 1) ^ 0x11b;
    	            }
    	        }

    	        // Walk GF(2^8)
    	        var x = 0;
    	        var xi = 0;
    	        for (var i = 0; i < 256; i++) {
    	            // Compute sbox
    	            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
    	            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
    	            SBOX[x] = sx;
    	            INV_SBOX[sx] = x;

    	            // Compute multiplication
    	            var x2 = d[x];
    	            var x4 = d[x2];
    	            var x8 = d[x4];

    	            // Compute sub bytes, mix columns tables
    	            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
    	            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
    	            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
    	            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
    	            SUB_MIX_3[x] = t;

    	            // Compute inv sub bytes, inv mix columns tables
    	            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
    	            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
    	            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
    	            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
    	            INV_SUB_MIX_3[sx] = t;

    	            // Compute next counter
    	            if (!x) {
    	                x = xi = 1;
    	            } else {
    	                x = x2 ^ d[d[d[x8 ^ x2]]];
    	                xi ^= d[d[xi]];
    	            }
    	        }
    	    }());

    	    // Precomputed Rcon lookup
    	    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

    	    /**
    	     * AES block cipher algorithm.
    	     */
    	    var AES = C_algo.AES = BlockCipher.extend({
    	        _doReset: function () {
    	            var t;

    	            // Skip reset of nRounds has been set before and key did not change
    	            if (this._nRounds && this._keyPriorReset === this._key) {
    	                return;
    	            }

    	            // Shortcuts
    	            var key = this._keyPriorReset = this._key;
    	            var keyWords = key.words;
    	            var keySize = key.sigBytes / 4;

    	            // Compute number of rounds
    	            var nRounds = this._nRounds = keySize + 6;

    	            // Compute number of key schedule rows
    	            var ksRows = (nRounds + 1) * 4;

    	            // Compute key schedule
    	            var keySchedule = this._keySchedule = [];
    	            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
    	                if (ksRow < keySize) {
    	                    keySchedule[ksRow] = keyWords[ksRow];
    	                } else {
    	                    t = keySchedule[ksRow - 1];

    	                    if (!(ksRow % keySize)) {
    	                        // Rot word
    	                        t = (t << 8) | (t >>> 24);

    	                        // Sub word
    	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

    	                        // Mix Rcon
    	                        t ^= RCON[(ksRow / keySize) | 0] << 24;
    	                    } else if (keySize > 6 && ksRow % keySize == 4) {
    	                        // Sub word
    	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
    	                    }

    	                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
    	                }
    	            }

    	            // Compute inv key schedule
    	            var invKeySchedule = this._invKeySchedule = [];
    	            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
    	                var ksRow = ksRows - invKsRow;

    	                if (invKsRow % 4) {
    	                    var t = keySchedule[ksRow];
    	                } else {
    	                    var t = keySchedule[ksRow - 4];
    	                }

    	                if (invKsRow < 4 || ksRow <= 4) {
    	                    invKeySchedule[invKsRow] = t;
    	                } else {
    	                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
    	                                               INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
    	                }
    	            }
    	        },

    	        encryptBlock: function (M, offset) {
    	            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
    	        },

    	        decryptBlock: function (M, offset) {
    	            // Swap 2nd and 4th rows
    	            var t = M[offset + 1];
    	            M[offset + 1] = M[offset + 3];
    	            M[offset + 3] = t;

    	            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

    	            // Inv swap 2nd and 4th rows
    	            var t = M[offset + 1];
    	            M[offset + 1] = M[offset + 3];
    	            M[offset + 3] = t;
    	        },

    	        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
    	            // Shortcut
    	            var nRounds = this._nRounds;

    	            // Get input, add round key
    	            var s0 = M[offset]     ^ keySchedule[0];
    	            var s1 = M[offset + 1] ^ keySchedule[1];
    	            var s2 = M[offset + 2] ^ keySchedule[2];
    	            var s3 = M[offset + 3] ^ keySchedule[3];

    	            // Key schedule row counter
    	            var ksRow = 4;

    	            // Rounds
    	            for (var round = 1; round < nRounds; round++) {
    	                // Shift rows, sub bytes, mix columns, add round key
    	                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
    	                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
    	                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
    	                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

    	                // Update state
    	                s0 = t0;
    	                s1 = t1;
    	                s2 = t2;
    	                s3 = t3;
    	            }

    	            // Shift rows, sub bytes, add round key
    	            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
    	            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
    	            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
    	            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

    	            // Set output
    	            M[offset]     = t0;
    	            M[offset + 1] = t1;
    	            M[offset + 2] = t2;
    	            M[offset + 3] = t3;
    	        },

    	        keySize: 256/32
    	    });

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
    	     */
    	    C.AES = BlockCipher._createHelper(AES);
    	}());


    	return CryptoJS.AES;

    }));
    });

    var tripledes = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, encBase64, md5, evpkdf, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var WordArray = C_lib.WordArray;
    	    var BlockCipher = C_lib.BlockCipher;
    	    var C_algo = C.algo;

    	    // Permuted Choice 1 constants
    	    var PC1 = [
    	        57, 49, 41, 33, 25, 17, 9,  1,
    	        58, 50, 42, 34, 26, 18, 10, 2,
    	        59, 51, 43, 35, 27, 19, 11, 3,
    	        60, 52, 44, 36, 63, 55, 47, 39,
    	        31, 23, 15, 7,  62, 54, 46, 38,
    	        30, 22, 14, 6,  61, 53, 45, 37,
    	        29, 21, 13, 5,  28, 20, 12, 4
    	    ];

    	    // Permuted Choice 2 constants
    	    var PC2 = [
    	        14, 17, 11, 24, 1,  5,
    	        3,  28, 15, 6,  21, 10,
    	        23, 19, 12, 4,  26, 8,
    	        16, 7,  27, 20, 13, 2,
    	        41, 52, 31, 37, 47, 55,
    	        30, 40, 51, 45, 33, 48,
    	        44, 49, 39, 56, 34, 53,
    	        46, 42, 50, 36, 29, 32
    	    ];

    	    // Cumulative bit shift constants
    	    var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

    	    // SBOXes and round permutation constants
    	    var SBOX_P = [
    	        {
    	            0x0: 0x808200,
    	            0x10000000: 0x8000,
    	            0x20000000: 0x808002,
    	            0x30000000: 0x2,
    	            0x40000000: 0x200,
    	            0x50000000: 0x808202,
    	            0x60000000: 0x800202,
    	            0x70000000: 0x800000,
    	            0x80000000: 0x202,
    	            0x90000000: 0x800200,
    	            0xa0000000: 0x8200,
    	            0xb0000000: 0x808000,
    	            0xc0000000: 0x8002,
    	            0xd0000000: 0x800002,
    	            0xe0000000: 0x0,
    	            0xf0000000: 0x8202,
    	            0x8000000: 0x0,
    	            0x18000000: 0x808202,
    	            0x28000000: 0x8202,
    	            0x38000000: 0x8000,
    	            0x48000000: 0x808200,
    	            0x58000000: 0x200,
    	            0x68000000: 0x808002,
    	            0x78000000: 0x2,
    	            0x88000000: 0x800200,
    	            0x98000000: 0x8200,
    	            0xa8000000: 0x808000,
    	            0xb8000000: 0x800202,
    	            0xc8000000: 0x800002,
    	            0xd8000000: 0x8002,
    	            0xe8000000: 0x202,
    	            0xf8000000: 0x800000,
    	            0x1: 0x8000,
    	            0x10000001: 0x2,
    	            0x20000001: 0x808200,
    	            0x30000001: 0x800000,
    	            0x40000001: 0x808002,
    	            0x50000001: 0x8200,
    	            0x60000001: 0x200,
    	            0x70000001: 0x800202,
    	            0x80000001: 0x808202,
    	            0x90000001: 0x808000,
    	            0xa0000001: 0x800002,
    	            0xb0000001: 0x8202,
    	            0xc0000001: 0x202,
    	            0xd0000001: 0x800200,
    	            0xe0000001: 0x8002,
    	            0xf0000001: 0x0,
    	            0x8000001: 0x808202,
    	            0x18000001: 0x808000,
    	            0x28000001: 0x800000,
    	            0x38000001: 0x200,
    	            0x48000001: 0x8000,
    	            0x58000001: 0x800002,
    	            0x68000001: 0x2,
    	            0x78000001: 0x8202,
    	            0x88000001: 0x8002,
    	            0x98000001: 0x800202,
    	            0xa8000001: 0x202,
    	            0xb8000001: 0x808200,
    	            0xc8000001: 0x800200,
    	            0xd8000001: 0x0,
    	            0xe8000001: 0x8200,
    	            0xf8000001: 0x808002
    	        },
    	        {
    	            0x0: 0x40084010,
    	            0x1000000: 0x4000,
    	            0x2000000: 0x80000,
    	            0x3000000: 0x40080010,
    	            0x4000000: 0x40000010,
    	            0x5000000: 0x40084000,
    	            0x6000000: 0x40004000,
    	            0x7000000: 0x10,
    	            0x8000000: 0x84000,
    	            0x9000000: 0x40004010,
    	            0xa000000: 0x40000000,
    	            0xb000000: 0x84010,
    	            0xc000000: 0x80010,
    	            0xd000000: 0x0,
    	            0xe000000: 0x4010,
    	            0xf000000: 0x40080000,
    	            0x800000: 0x40004000,
    	            0x1800000: 0x84010,
    	            0x2800000: 0x10,
    	            0x3800000: 0x40004010,
    	            0x4800000: 0x40084010,
    	            0x5800000: 0x40000000,
    	            0x6800000: 0x80000,
    	            0x7800000: 0x40080010,
    	            0x8800000: 0x80010,
    	            0x9800000: 0x0,
    	            0xa800000: 0x4000,
    	            0xb800000: 0x40080000,
    	            0xc800000: 0x40000010,
    	            0xd800000: 0x84000,
    	            0xe800000: 0x40084000,
    	            0xf800000: 0x4010,
    	            0x10000000: 0x0,
    	            0x11000000: 0x40080010,
    	            0x12000000: 0x40004010,
    	            0x13000000: 0x40084000,
    	            0x14000000: 0x40080000,
    	            0x15000000: 0x10,
    	            0x16000000: 0x84010,
    	            0x17000000: 0x4000,
    	            0x18000000: 0x4010,
    	            0x19000000: 0x80000,
    	            0x1a000000: 0x80010,
    	            0x1b000000: 0x40000010,
    	            0x1c000000: 0x84000,
    	            0x1d000000: 0x40004000,
    	            0x1e000000: 0x40000000,
    	            0x1f000000: 0x40084010,
    	            0x10800000: 0x84010,
    	            0x11800000: 0x80000,
    	            0x12800000: 0x40080000,
    	            0x13800000: 0x4000,
    	            0x14800000: 0x40004000,
    	            0x15800000: 0x40084010,
    	            0x16800000: 0x10,
    	            0x17800000: 0x40000000,
    	            0x18800000: 0x40084000,
    	            0x19800000: 0x40000010,
    	            0x1a800000: 0x40004010,
    	            0x1b800000: 0x80010,
    	            0x1c800000: 0x0,
    	            0x1d800000: 0x4010,
    	            0x1e800000: 0x40080010,
    	            0x1f800000: 0x84000
    	        },
    	        {
    	            0x0: 0x104,
    	            0x100000: 0x0,
    	            0x200000: 0x4000100,
    	            0x300000: 0x10104,
    	            0x400000: 0x10004,
    	            0x500000: 0x4000004,
    	            0x600000: 0x4010104,
    	            0x700000: 0x4010000,
    	            0x800000: 0x4000000,
    	            0x900000: 0x4010100,
    	            0xa00000: 0x10100,
    	            0xb00000: 0x4010004,
    	            0xc00000: 0x4000104,
    	            0xd00000: 0x10000,
    	            0xe00000: 0x4,
    	            0xf00000: 0x100,
    	            0x80000: 0x4010100,
    	            0x180000: 0x4010004,
    	            0x280000: 0x0,
    	            0x380000: 0x4000100,
    	            0x480000: 0x4000004,
    	            0x580000: 0x10000,
    	            0x680000: 0x10004,
    	            0x780000: 0x104,
    	            0x880000: 0x4,
    	            0x980000: 0x100,
    	            0xa80000: 0x4010000,
    	            0xb80000: 0x10104,
    	            0xc80000: 0x10100,
    	            0xd80000: 0x4000104,
    	            0xe80000: 0x4010104,
    	            0xf80000: 0x4000000,
    	            0x1000000: 0x4010100,
    	            0x1100000: 0x10004,
    	            0x1200000: 0x10000,
    	            0x1300000: 0x4000100,
    	            0x1400000: 0x100,
    	            0x1500000: 0x4010104,
    	            0x1600000: 0x4000004,
    	            0x1700000: 0x0,
    	            0x1800000: 0x4000104,
    	            0x1900000: 0x4000000,
    	            0x1a00000: 0x4,
    	            0x1b00000: 0x10100,
    	            0x1c00000: 0x4010000,
    	            0x1d00000: 0x104,
    	            0x1e00000: 0x10104,
    	            0x1f00000: 0x4010004,
    	            0x1080000: 0x4000000,
    	            0x1180000: 0x104,
    	            0x1280000: 0x4010100,
    	            0x1380000: 0x0,
    	            0x1480000: 0x10004,
    	            0x1580000: 0x4000100,
    	            0x1680000: 0x100,
    	            0x1780000: 0x4010004,
    	            0x1880000: 0x10000,
    	            0x1980000: 0x4010104,
    	            0x1a80000: 0x10104,
    	            0x1b80000: 0x4000004,
    	            0x1c80000: 0x4000104,
    	            0x1d80000: 0x4010000,
    	            0x1e80000: 0x4,
    	            0x1f80000: 0x10100
    	        },
    	        {
    	            0x0: 0x80401000,
    	            0x10000: 0x80001040,
    	            0x20000: 0x401040,
    	            0x30000: 0x80400000,
    	            0x40000: 0x0,
    	            0x50000: 0x401000,
    	            0x60000: 0x80000040,
    	            0x70000: 0x400040,
    	            0x80000: 0x80000000,
    	            0x90000: 0x400000,
    	            0xa0000: 0x40,
    	            0xb0000: 0x80001000,
    	            0xc0000: 0x80400040,
    	            0xd0000: 0x1040,
    	            0xe0000: 0x1000,
    	            0xf0000: 0x80401040,
    	            0x8000: 0x80001040,
    	            0x18000: 0x40,
    	            0x28000: 0x80400040,
    	            0x38000: 0x80001000,
    	            0x48000: 0x401000,
    	            0x58000: 0x80401040,
    	            0x68000: 0x0,
    	            0x78000: 0x80400000,
    	            0x88000: 0x1000,
    	            0x98000: 0x80401000,
    	            0xa8000: 0x400000,
    	            0xb8000: 0x1040,
    	            0xc8000: 0x80000000,
    	            0xd8000: 0x400040,
    	            0xe8000: 0x401040,
    	            0xf8000: 0x80000040,
    	            0x100000: 0x400040,
    	            0x110000: 0x401000,
    	            0x120000: 0x80000040,
    	            0x130000: 0x0,
    	            0x140000: 0x1040,
    	            0x150000: 0x80400040,
    	            0x160000: 0x80401000,
    	            0x170000: 0x80001040,
    	            0x180000: 0x80401040,
    	            0x190000: 0x80000000,
    	            0x1a0000: 0x80400000,
    	            0x1b0000: 0x401040,
    	            0x1c0000: 0x80001000,
    	            0x1d0000: 0x400000,
    	            0x1e0000: 0x40,
    	            0x1f0000: 0x1000,
    	            0x108000: 0x80400000,
    	            0x118000: 0x80401040,
    	            0x128000: 0x0,
    	            0x138000: 0x401000,
    	            0x148000: 0x400040,
    	            0x158000: 0x80000000,
    	            0x168000: 0x80001040,
    	            0x178000: 0x40,
    	            0x188000: 0x80000040,
    	            0x198000: 0x1000,
    	            0x1a8000: 0x80001000,
    	            0x1b8000: 0x80400040,
    	            0x1c8000: 0x1040,
    	            0x1d8000: 0x80401000,
    	            0x1e8000: 0x400000,
    	            0x1f8000: 0x401040
    	        },
    	        {
    	            0x0: 0x80,
    	            0x1000: 0x1040000,
    	            0x2000: 0x40000,
    	            0x3000: 0x20000000,
    	            0x4000: 0x20040080,
    	            0x5000: 0x1000080,
    	            0x6000: 0x21000080,
    	            0x7000: 0x40080,
    	            0x8000: 0x1000000,
    	            0x9000: 0x20040000,
    	            0xa000: 0x20000080,
    	            0xb000: 0x21040080,
    	            0xc000: 0x21040000,
    	            0xd000: 0x0,
    	            0xe000: 0x1040080,
    	            0xf000: 0x21000000,
    	            0x800: 0x1040080,
    	            0x1800: 0x21000080,
    	            0x2800: 0x80,
    	            0x3800: 0x1040000,
    	            0x4800: 0x40000,
    	            0x5800: 0x20040080,
    	            0x6800: 0x21040000,
    	            0x7800: 0x20000000,
    	            0x8800: 0x20040000,
    	            0x9800: 0x0,
    	            0xa800: 0x21040080,
    	            0xb800: 0x1000080,
    	            0xc800: 0x20000080,
    	            0xd800: 0x21000000,
    	            0xe800: 0x1000000,
    	            0xf800: 0x40080,
    	            0x10000: 0x40000,
    	            0x11000: 0x80,
    	            0x12000: 0x20000000,
    	            0x13000: 0x21000080,
    	            0x14000: 0x1000080,
    	            0x15000: 0x21040000,
    	            0x16000: 0x20040080,
    	            0x17000: 0x1000000,
    	            0x18000: 0x21040080,
    	            0x19000: 0x21000000,
    	            0x1a000: 0x1040000,
    	            0x1b000: 0x20040000,
    	            0x1c000: 0x40080,
    	            0x1d000: 0x20000080,
    	            0x1e000: 0x0,
    	            0x1f000: 0x1040080,
    	            0x10800: 0x21000080,
    	            0x11800: 0x1000000,
    	            0x12800: 0x1040000,
    	            0x13800: 0x20040080,
    	            0x14800: 0x20000000,
    	            0x15800: 0x1040080,
    	            0x16800: 0x80,
    	            0x17800: 0x21040000,
    	            0x18800: 0x40080,
    	            0x19800: 0x21040080,
    	            0x1a800: 0x0,
    	            0x1b800: 0x21000000,
    	            0x1c800: 0x1000080,
    	            0x1d800: 0x40000,
    	            0x1e800: 0x20040000,
    	            0x1f800: 0x20000080
    	        },
    	        {
    	            0x0: 0x10000008,
    	            0x100: 0x2000,
    	            0x200: 0x10200000,
    	            0x300: 0x10202008,
    	            0x400: 0x10002000,
    	            0x500: 0x200000,
    	            0x600: 0x200008,
    	            0x700: 0x10000000,
    	            0x800: 0x0,
    	            0x900: 0x10002008,
    	            0xa00: 0x202000,
    	            0xb00: 0x8,
    	            0xc00: 0x10200008,
    	            0xd00: 0x202008,
    	            0xe00: 0x2008,
    	            0xf00: 0x10202000,
    	            0x80: 0x10200000,
    	            0x180: 0x10202008,
    	            0x280: 0x8,
    	            0x380: 0x200000,
    	            0x480: 0x202008,
    	            0x580: 0x10000008,
    	            0x680: 0x10002000,
    	            0x780: 0x2008,
    	            0x880: 0x200008,
    	            0x980: 0x2000,
    	            0xa80: 0x10002008,
    	            0xb80: 0x10200008,
    	            0xc80: 0x0,
    	            0xd80: 0x10202000,
    	            0xe80: 0x202000,
    	            0xf80: 0x10000000,
    	            0x1000: 0x10002000,
    	            0x1100: 0x10200008,
    	            0x1200: 0x10202008,
    	            0x1300: 0x2008,
    	            0x1400: 0x200000,
    	            0x1500: 0x10000000,
    	            0x1600: 0x10000008,
    	            0x1700: 0x202000,
    	            0x1800: 0x202008,
    	            0x1900: 0x0,
    	            0x1a00: 0x8,
    	            0x1b00: 0x10200000,
    	            0x1c00: 0x2000,
    	            0x1d00: 0x10002008,
    	            0x1e00: 0x10202000,
    	            0x1f00: 0x200008,
    	            0x1080: 0x8,
    	            0x1180: 0x202000,
    	            0x1280: 0x200000,
    	            0x1380: 0x10000008,
    	            0x1480: 0x10002000,
    	            0x1580: 0x2008,
    	            0x1680: 0x10202008,
    	            0x1780: 0x10200000,
    	            0x1880: 0x10202000,
    	            0x1980: 0x10200008,
    	            0x1a80: 0x2000,
    	            0x1b80: 0x202008,
    	            0x1c80: 0x200008,
    	            0x1d80: 0x0,
    	            0x1e80: 0x10000000,
    	            0x1f80: 0x10002008
    	        },
    	        {
    	            0x0: 0x100000,
    	            0x10: 0x2000401,
    	            0x20: 0x400,
    	            0x30: 0x100401,
    	            0x40: 0x2100401,
    	            0x50: 0x0,
    	            0x60: 0x1,
    	            0x70: 0x2100001,
    	            0x80: 0x2000400,
    	            0x90: 0x100001,
    	            0xa0: 0x2000001,
    	            0xb0: 0x2100400,
    	            0xc0: 0x2100000,
    	            0xd0: 0x401,
    	            0xe0: 0x100400,
    	            0xf0: 0x2000000,
    	            0x8: 0x2100001,
    	            0x18: 0x0,
    	            0x28: 0x2000401,
    	            0x38: 0x2100400,
    	            0x48: 0x100000,
    	            0x58: 0x2000001,
    	            0x68: 0x2000000,
    	            0x78: 0x401,
    	            0x88: 0x100401,
    	            0x98: 0x2000400,
    	            0xa8: 0x2100000,
    	            0xb8: 0x100001,
    	            0xc8: 0x400,
    	            0xd8: 0x2100401,
    	            0xe8: 0x1,
    	            0xf8: 0x100400,
    	            0x100: 0x2000000,
    	            0x110: 0x100000,
    	            0x120: 0x2000401,
    	            0x130: 0x2100001,
    	            0x140: 0x100001,
    	            0x150: 0x2000400,
    	            0x160: 0x2100400,
    	            0x170: 0x100401,
    	            0x180: 0x401,
    	            0x190: 0x2100401,
    	            0x1a0: 0x100400,
    	            0x1b0: 0x1,
    	            0x1c0: 0x0,
    	            0x1d0: 0x2100000,
    	            0x1e0: 0x2000001,
    	            0x1f0: 0x400,
    	            0x108: 0x100400,
    	            0x118: 0x2000401,
    	            0x128: 0x2100001,
    	            0x138: 0x1,
    	            0x148: 0x2000000,
    	            0x158: 0x100000,
    	            0x168: 0x401,
    	            0x178: 0x2100400,
    	            0x188: 0x2000001,
    	            0x198: 0x2100000,
    	            0x1a8: 0x0,
    	            0x1b8: 0x2100401,
    	            0x1c8: 0x100401,
    	            0x1d8: 0x400,
    	            0x1e8: 0x2000400,
    	            0x1f8: 0x100001
    	        },
    	        {
    	            0x0: 0x8000820,
    	            0x1: 0x20000,
    	            0x2: 0x8000000,
    	            0x3: 0x20,
    	            0x4: 0x20020,
    	            0x5: 0x8020820,
    	            0x6: 0x8020800,
    	            0x7: 0x800,
    	            0x8: 0x8020000,
    	            0x9: 0x8000800,
    	            0xa: 0x20800,
    	            0xb: 0x8020020,
    	            0xc: 0x820,
    	            0xd: 0x0,
    	            0xe: 0x8000020,
    	            0xf: 0x20820,
    	            0x80000000: 0x800,
    	            0x80000001: 0x8020820,
    	            0x80000002: 0x8000820,
    	            0x80000003: 0x8000000,
    	            0x80000004: 0x8020000,
    	            0x80000005: 0x20800,
    	            0x80000006: 0x20820,
    	            0x80000007: 0x20,
    	            0x80000008: 0x8000020,
    	            0x80000009: 0x820,
    	            0x8000000a: 0x20020,
    	            0x8000000b: 0x8020800,
    	            0x8000000c: 0x0,
    	            0x8000000d: 0x8020020,
    	            0x8000000e: 0x8000800,
    	            0x8000000f: 0x20000,
    	            0x10: 0x20820,
    	            0x11: 0x8020800,
    	            0x12: 0x20,
    	            0x13: 0x800,
    	            0x14: 0x8000800,
    	            0x15: 0x8000020,
    	            0x16: 0x8020020,
    	            0x17: 0x20000,
    	            0x18: 0x0,
    	            0x19: 0x20020,
    	            0x1a: 0x8020000,
    	            0x1b: 0x8000820,
    	            0x1c: 0x8020820,
    	            0x1d: 0x20800,
    	            0x1e: 0x820,
    	            0x1f: 0x8000000,
    	            0x80000010: 0x20000,
    	            0x80000011: 0x800,
    	            0x80000012: 0x8020020,
    	            0x80000013: 0x20820,
    	            0x80000014: 0x20,
    	            0x80000015: 0x8020000,
    	            0x80000016: 0x8000000,
    	            0x80000017: 0x8000820,
    	            0x80000018: 0x8020820,
    	            0x80000019: 0x8000020,
    	            0x8000001a: 0x8000800,
    	            0x8000001b: 0x0,
    	            0x8000001c: 0x20800,
    	            0x8000001d: 0x820,
    	            0x8000001e: 0x20020,
    	            0x8000001f: 0x8020800
    	        }
    	    ];

    	    // Masks that select the SBOX input
    	    var SBOX_MASK = [
    	        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
    	        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
    	    ];

    	    /**
    	     * DES block cipher algorithm.
    	     */
    	    var DES = C_algo.DES = BlockCipher.extend({
    	        _doReset: function () {
    	            // Shortcuts
    	            var key = this._key;
    	            var keyWords = key.words;

    	            // Select 56 bits according to PC1
    	            var keyBits = [];
    	            for (var i = 0; i < 56; i++) {
    	                var keyBitPos = PC1[i] - 1;
    	                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
    	            }

    	            // Assemble 16 subkeys
    	            var subKeys = this._subKeys = [];
    	            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
    	                // Create subkey
    	                var subKey = subKeys[nSubKey] = [];

    	                // Shortcut
    	                var bitShift = BIT_SHIFTS[nSubKey];

    	                // Select 48 bits according to PC2
    	                for (var i = 0; i < 24; i++) {
    	                    // Select from the left 28 key bits
    	                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

    	                    // Select from the right 28 key bits
    	                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
    	                }

    	                // Since each subkey is applied to an expanded 32-bit input,
    	                // the subkey can be broken into 8 values scaled to 32-bits,
    	                // which allows the key to be used without expansion
    	                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
    	                for (var i = 1; i < 7; i++) {
    	                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
    	                }
    	                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
    	            }

    	            // Compute inverse subkeys
    	            var invSubKeys = this._invSubKeys = [];
    	            for (var i = 0; i < 16; i++) {
    	                invSubKeys[i] = subKeys[15 - i];
    	            }
    	        },

    	        encryptBlock: function (M, offset) {
    	            this._doCryptBlock(M, offset, this._subKeys);
    	        },

    	        decryptBlock: function (M, offset) {
    	            this._doCryptBlock(M, offset, this._invSubKeys);
    	        },

    	        _doCryptBlock: function (M, offset, subKeys) {
    	            // Get input
    	            this._lBlock = M[offset];
    	            this._rBlock = M[offset + 1];

    	            // Initial permutation
    	            exchangeLR.call(this, 4,  0x0f0f0f0f);
    	            exchangeLR.call(this, 16, 0x0000ffff);
    	            exchangeRL.call(this, 2,  0x33333333);
    	            exchangeRL.call(this, 8,  0x00ff00ff);
    	            exchangeLR.call(this, 1,  0x55555555);

    	            // Rounds
    	            for (var round = 0; round < 16; round++) {
    	                // Shortcuts
    	                var subKey = subKeys[round];
    	                var lBlock = this._lBlock;
    	                var rBlock = this._rBlock;

    	                // Feistel function
    	                var f = 0;
    	                for (var i = 0; i < 8; i++) {
    	                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
    	                }
    	                this._lBlock = rBlock;
    	                this._rBlock = lBlock ^ f;
    	            }

    	            // Undo swap from last round
    	            var t = this._lBlock;
    	            this._lBlock = this._rBlock;
    	            this._rBlock = t;

    	            // Final permutation
    	            exchangeLR.call(this, 1,  0x55555555);
    	            exchangeRL.call(this, 8,  0x00ff00ff);
    	            exchangeRL.call(this, 2,  0x33333333);
    	            exchangeLR.call(this, 16, 0x0000ffff);
    	            exchangeLR.call(this, 4,  0x0f0f0f0f);

    	            // Set output
    	            M[offset] = this._lBlock;
    	            M[offset + 1] = this._rBlock;
    	        },

    	        keySize: 64/32,

    	        ivSize: 64/32,

    	        blockSize: 64/32
    	    });

    	    // Swap bits across the left and right words
    	    function exchangeLR(offset, mask) {
    	        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
    	        this._rBlock ^= t;
    	        this._lBlock ^= t << offset;
    	    }

    	    function exchangeRL(offset, mask) {
    	        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
    	        this._lBlock ^= t;
    	        this._rBlock ^= t << offset;
    	    }

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
    	     */
    	    C.DES = BlockCipher._createHelper(DES);

    	    /**
    	     * Triple-DES block cipher algorithm.
    	     */
    	    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
    	        _doReset: function () {
    	            // Shortcuts
    	            var key = this._key;
    	            var keyWords = key.words;
    	            // Make sure the key length is valid (64, 128 or >= 192 bit)
    	            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
    	                throw new Error('Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.');
    	            }

    	            // Extend the key according to the keying options defined in 3DES standard
    	            var key1 = keyWords.slice(0, 2);
    	            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
    	            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);

    	            // Create DES instances
    	            this._des1 = DES.createEncryptor(WordArray.create(key1));
    	            this._des2 = DES.createEncryptor(WordArray.create(key2));
    	            this._des3 = DES.createEncryptor(WordArray.create(key3));
    	        },

    	        encryptBlock: function (M, offset) {
    	            this._des1.encryptBlock(M, offset);
    	            this._des2.decryptBlock(M, offset);
    	            this._des3.encryptBlock(M, offset);
    	        },

    	        decryptBlock: function (M, offset) {
    	            this._des3.decryptBlock(M, offset);
    	            this._des2.encryptBlock(M, offset);
    	            this._des1.decryptBlock(M, offset);
    	        },

    	        keySize: 192/32,

    	        ivSize: 64/32,

    	        blockSize: 64/32
    	    });

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
    	     */
    	    C.TripleDES = BlockCipher._createHelper(TripleDES);
    	}());


    	return CryptoJS.TripleDES;

    }));
    });

    var rc4 = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, encBase64, md5, evpkdf, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var StreamCipher = C_lib.StreamCipher;
    	    var C_algo = C.algo;

    	    /**
    	     * RC4 stream cipher algorithm.
    	     */
    	    var RC4 = C_algo.RC4 = StreamCipher.extend({
    	        _doReset: function () {
    	            // Shortcuts
    	            var key = this._key;
    	            var keyWords = key.words;
    	            var keySigBytes = key.sigBytes;

    	            // Init sbox
    	            var S = this._S = [];
    	            for (var i = 0; i < 256; i++) {
    	                S[i] = i;
    	            }

    	            // Key setup
    	            for (var i = 0, j = 0; i < 256; i++) {
    	                var keyByteIndex = i % keySigBytes;
    	                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

    	                j = (j + S[i] + keyByte) % 256;

    	                // Swap
    	                var t = S[i];
    	                S[i] = S[j];
    	                S[j] = t;
    	            }

    	            // Counters
    	            this._i = this._j = 0;
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            M[offset] ^= generateKeystreamWord.call(this);
    	        },

    	        keySize: 256/32,

    	        ivSize: 0
    	    });

    	    function generateKeystreamWord() {
    	        // Shortcuts
    	        var S = this._S;
    	        var i = this._i;
    	        var j = this._j;

    	        // Generate keystream word
    	        var keystreamWord = 0;
    	        for (var n = 0; n < 4; n++) {
    	            i = (i + 1) % 256;
    	            j = (j + S[i]) % 256;

    	            // Swap
    	            var t = S[i];
    	            S[i] = S[j];
    	            S[j] = t;

    	            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
    	        }

    	        // Update counters
    	        this._i = i;
    	        this._j = j;

    	        return keystreamWord;
    	    }

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
    	     */
    	    C.RC4 = StreamCipher._createHelper(RC4);

    	    /**
    	     * Modified RC4 stream cipher algorithm.
    	     */
    	    var RC4Drop = C_algo.RC4Drop = RC4.extend({
    	        /**
    	         * Configuration options.
    	         *
    	         * @property {number} drop The number of keystream words to drop. Default 192
    	         */
    	        cfg: RC4.cfg.extend({
    	            drop: 192
    	        }),

    	        _doReset: function () {
    	            RC4._doReset.call(this);

    	            // Drop
    	            for (var i = this.cfg.drop; i > 0; i--) {
    	                generateKeystreamWord.call(this);
    	            }
    	        }
    	    });

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
    	     */
    	    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
    	}());


    	return CryptoJS.RC4;

    }));
    });

    var rabbit = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, encBase64, md5, evpkdf, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var StreamCipher = C_lib.StreamCipher;
    	    var C_algo = C.algo;

    	    // Reusable objects
    	    var S  = [];
    	    var C_ = [];
    	    var G  = [];

    	    /**
    	     * Rabbit stream cipher algorithm
    	     */
    	    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
    	        _doReset: function () {
    	            // Shortcuts
    	            var K = this._key.words;
    	            var iv = this.cfg.iv;

    	            // Swap endian
    	            for (var i = 0; i < 4; i++) {
    	                K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
    	                       (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
    	            }

    	            // Generate initial state values
    	            var X = this._X = [
    	                K[0], (K[3] << 16) | (K[2] >>> 16),
    	                K[1], (K[0] << 16) | (K[3] >>> 16),
    	                K[2], (K[1] << 16) | (K[0] >>> 16),
    	                K[3], (K[2] << 16) | (K[1] >>> 16)
    	            ];

    	            // Generate initial counter values
    	            var C = this._C = [
    	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
    	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
    	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
    	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
    	            ];

    	            // Carry bit
    	            this._b = 0;

    	            // Iterate the system four times
    	            for (var i = 0; i < 4; i++) {
    	                nextState.call(this);
    	            }

    	            // Modify the counters
    	            for (var i = 0; i < 8; i++) {
    	                C[i] ^= X[(i + 4) & 7];
    	            }

    	            // IV setup
    	            if (iv) {
    	                // Shortcuts
    	                var IV = iv.words;
    	                var IV_0 = IV[0];
    	                var IV_1 = IV[1];

    	                // Generate four subvectors
    	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
    	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
    	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
    	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

    	                // Modify counter values
    	                C[0] ^= i0;
    	                C[1] ^= i1;
    	                C[2] ^= i2;
    	                C[3] ^= i3;
    	                C[4] ^= i0;
    	                C[5] ^= i1;
    	                C[6] ^= i2;
    	                C[7] ^= i3;

    	                // Iterate the system four times
    	                for (var i = 0; i < 4; i++) {
    	                    nextState.call(this);
    	                }
    	            }
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcut
    	            var X = this._X;

    	            // Iterate the system
    	            nextState.call(this);

    	            // Generate four keystream words
    	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
    	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
    	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
    	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

    	            for (var i = 0; i < 4; i++) {
    	                // Swap endian
    	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
    	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

    	                // Encrypt
    	                M[offset + i] ^= S[i];
    	            }
    	        },

    	        blockSize: 128/32,

    	        ivSize: 64/32
    	    });

    	    function nextState() {
    	        // Shortcuts
    	        var X = this._X;
    	        var C = this._C;

    	        // Save old counter values
    	        for (var i = 0; i < 8; i++) {
    	            C_[i] = C[i];
    	        }

    	        // Calculate new counter values
    	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
    	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
    	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
    	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
    	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
    	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
    	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
    	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
    	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

    	        // Calculate the g-values
    	        for (var i = 0; i < 8; i++) {
    	            var gx = X[i] + C[i];

    	            // Construct high and low argument for squaring
    	            var ga = gx & 0xffff;
    	            var gb = gx >>> 16;

    	            // Calculate high and low result of squaring
    	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
    	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

    	            // High XOR low
    	            G[i] = gh ^ gl;
    	        }

    	        // Calculate new state values
    	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
    	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
    	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
    	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
    	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
    	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
    	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
    	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
    	    }

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
    	     */
    	    C.Rabbit = StreamCipher._createHelper(Rabbit);
    	}());


    	return CryptoJS.Rabbit;

    }));
    });

    var rabbitLegacy = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, encBase64, md5, evpkdf, cipherCore);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	(function () {
    	    // Shortcuts
    	    var C = CryptoJS;
    	    var C_lib = C.lib;
    	    var StreamCipher = C_lib.StreamCipher;
    	    var C_algo = C.algo;

    	    // Reusable objects
    	    var S  = [];
    	    var C_ = [];
    	    var G  = [];

    	    /**
    	     * Rabbit stream cipher algorithm.
    	     *
    	     * This is a legacy version that neglected to convert the key to little-endian.
    	     * This error doesn't affect the cipher's security,
    	     * but it does affect its compatibility with other implementations.
    	     */
    	    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
    	        _doReset: function () {
    	            // Shortcuts
    	            var K = this._key.words;
    	            var iv = this.cfg.iv;

    	            // Generate initial state values
    	            var X = this._X = [
    	                K[0], (K[3] << 16) | (K[2] >>> 16),
    	                K[1], (K[0] << 16) | (K[3] >>> 16),
    	                K[2], (K[1] << 16) | (K[0] >>> 16),
    	                K[3], (K[2] << 16) | (K[1] >>> 16)
    	            ];

    	            // Generate initial counter values
    	            var C = this._C = [
    	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
    	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
    	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
    	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
    	            ];

    	            // Carry bit
    	            this._b = 0;

    	            // Iterate the system four times
    	            for (var i = 0; i < 4; i++) {
    	                nextState.call(this);
    	            }

    	            // Modify the counters
    	            for (var i = 0; i < 8; i++) {
    	                C[i] ^= X[(i + 4) & 7];
    	            }

    	            // IV setup
    	            if (iv) {
    	                // Shortcuts
    	                var IV = iv.words;
    	                var IV_0 = IV[0];
    	                var IV_1 = IV[1];

    	                // Generate four subvectors
    	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
    	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
    	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
    	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

    	                // Modify counter values
    	                C[0] ^= i0;
    	                C[1] ^= i1;
    	                C[2] ^= i2;
    	                C[3] ^= i3;
    	                C[4] ^= i0;
    	                C[5] ^= i1;
    	                C[6] ^= i2;
    	                C[7] ^= i3;

    	                // Iterate the system four times
    	                for (var i = 0; i < 4; i++) {
    	                    nextState.call(this);
    	                }
    	            }
    	        },

    	        _doProcessBlock: function (M, offset) {
    	            // Shortcut
    	            var X = this._X;

    	            // Iterate the system
    	            nextState.call(this);

    	            // Generate four keystream words
    	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
    	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
    	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
    	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

    	            for (var i = 0; i < 4; i++) {
    	                // Swap endian
    	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
    	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

    	                // Encrypt
    	                M[offset + i] ^= S[i];
    	            }
    	        },

    	        blockSize: 128/32,

    	        ivSize: 64/32
    	    });

    	    function nextState() {
    	        // Shortcuts
    	        var X = this._X;
    	        var C = this._C;

    	        // Save old counter values
    	        for (var i = 0; i < 8; i++) {
    	            C_[i] = C[i];
    	        }

    	        // Calculate new counter values
    	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
    	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
    	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
    	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
    	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
    	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
    	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
    	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
    	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

    	        // Calculate the g-values
    	        for (var i = 0; i < 8; i++) {
    	            var gx = X[i] + C[i];

    	            // Construct high and low argument for squaring
    	            var ga = gx & 0xffff;
    	            var gb = gx >>> 16;

    	            // Calculate high and low result of squaring
    	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
    	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

    	            // High XOR low
    	            G[i] = gh ^ gl;
    	        }

    	        // Calculate new state values
    	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
    	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
    	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
    	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
    	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
    	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
    	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
    	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
    	    }

    	    /**
    	     * Shortcut functions to the cipher's object interface.
    	     *
    	     * @example
    	     *
    	     *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
    	     *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
    	     */
    	    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
    	}());


    	return CryptoJS.RabbitLegacy;

    }));
    });

    var cryptoJs = createCommonjsModule$2(function (module, exports) {
    (function (root, factory, undef) {
    	{
    		// CommonJS
    		module.exports = exports = factory(core, x64Core, libTypedarrays, encUtf16, encBase64, md5, sha1, sha256, sha224, sha512, sha384, sha3, ripemd160, hmac, pbkdf2, evpkdf, cipherCore, modeCfb, modeCtr, modeCtrGladman, modeOfb, modeEcb, padAnsix923, padIso10126, padIso97971, padZeropadding, padNopadding, formatHex, aes, tripledes, rc4, rabbit, rabbitLegacy);
    	}
    }(commonjsGlobal, function (CryptoJS) {

    	return CryptoJS;

    }));
    });

    // Encrypt
    const encrypt = function (str, pass) {
      return cryptoJs.AES.encrypt(str, pass).toString()
    };

    // Decrypt
    const decrypt = function (str, pass) {
      var bytes = cryptoJs.AES.decrypt(str, pass);
      var text = bytes.toString(cryptoJs.enc.Utf8);
      return text
    };

    const validate$2 = function (obj) {
      obj = Object.assign({}, obj);
      obj.dates = obj.dates || {};
      obj.dates = Object.assign({}, obj.dates);
      return obj
    };

    const encryptObj = function (obj, pass) {
      obj = validate$2(obj);
      Object.keys(obj.dates).forEach((k) => {
        obj.dates[k] = encrypt(obj.dates[k], pass);
      });
      return obj
    };
    const decryptObj = function (obj, pass) {
      console.log(pass);
      obj = validate$2(obj);
      Object.keys(obj.dates).forEach((k) => {
        obj.dates[k] = decrypt(obj.dates[k], pass);
      });
      return obj
    };

    // fetch all data for username, and decrypt it
    const getUser = function (user, pass) {
      return read(user).then((doc) => {
        doc = decryptObj(doc, pass);
        return doc
      })
    };

    const saveUser = function (obj, pass) {
      let tmp = Object.assign({}, obj);
      tmp = encryptObj(tmp, pass);
      write(tmp);
    };

    /* src/user/User.svelte generated by Svelte v3.23.0 */
    const file$8 = "src/user/User.svelte";

    function create_fragment$8(ctx) {
    	let div3;
    	let div2;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let t2;
    	let div5;
    	let div4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const scroll = new Scroll({ $$inline: true });

    	const input = new Input({
    			props: { write: /*writeNow*/ ctx[1] },
    			$$inline: true
    		});

    	const output = new Output({ $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			create_component(scroll.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(input.$$.fragment);
    			t1 = space();
    			create_component(output.$$.fragment);
    			t2 = space();
    			div5 = element("div");
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "logout";
    			attr_dev(div0, "class", "toprow svelte-1sexs41");
    			add_location(div0, file$8, 66, 6, 1323);
    			attr_dev(div1, "class", "col middle svelte-1sexs41");
    			add_location(div1, file$8, 65, 4, 1292);
    			attr_dev(div2, "class", "row container svelte-1sexs41");
    			add_location(div2, file$8, 60, 2, 1201);
    			attr_dev(div3, "class", "page svelte-1sexs41");
    			add_location(div3, file$8, 59, 0, 1180);
    			attr_dev(button, "class", "button rounded svelte-1sexs41");
    			add_location(button, file$8, 78, 4, 1548);
    			attr_dev(div4, "class", "row row-right svelte-1sexs41");
    			add_location(div4, file$8, 77, 2, 1516);
    			attr_dev(div5, "class", "footer svelte-1sexs41");
    			add_location(div5, file$8, 76, 0, 1493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(scroll, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(input, div0, null);
    			append_dev(div1, t1);
    			mount_component(output, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*logout*/ ctx[0])) /*logout*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scroll.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scroll.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(scroll);
    			destroy_component(input);
    			destroy_component(output);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $user;
    	let $pass;
    	let $data;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(2, $user = $$value));
    	validate_store(pass, "pass");
    	component_subscribe($$self, pass, $$value => $$invalidate(3, $pass = $$value));
    	validate_store(data$1, "data");
    	component_subscribe($$self, data$1, $$value => $$invalidate(4, $data = $$value));
    	let { logout } = $$props;

    	// listen for username changes
    	user.subscribe(val => {
    		getUser($user, $pass).then(doc => {
    			set_store_value(data$1, $data = doc);
    		});
    	});

    	const writeNow = function () {
    		saveUser($data, $pass);
    	};

    	const writable_props = ["logout"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("User", $$slots, []);

    	$$self.$set = $$props => {
    		if ("logout" in $$props) $$invalidate(0, logout = $$props.logout);
    	};

    	$$self.$capture_state = () => ({
    		Input,
    		Output,
    		Scroll,
    		DayPick,
    		Vertical,
    		logout,
    		getUser,
    		saveUser,
    		data: data$1,
    		date,
    		user,
    		pass,
    		writeNow,
    		$user,
    		$pass,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("logout" in $$props) $$invalidate(0, logout = $$props.logout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [logout, writeNow];
    }

    class User extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { logout: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*logout*/ ctx[0] === undefined && !("logout" in props)) {
    			console.warn("<User> was created without expected prop 'logout'");
    		}
    	}

    	get logout() {
    		throw new Error("<User>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logout(value) {
    		throw new Error("<User>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Login.svelte generated by Svelte v3.23.0 */
    const file$9 = "src/Login.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let t2;
    	let form;
    	let input0;
    	let t3;
    	let input1;
    	let t4;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("headache\n    ");
    			span = element("span");
    			span.textContent = "📉";
    			t2 = space();
    			form = element("form");
    			input0 = element("input");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "login";
    			attr_dev(span, "class", "f3");
    			add_location(span, file$9, 28, 4, 500);
    			attr_dev(div0, "class", "row nowrap");
    			add_location(div0, file$9, 26, 2, 458);
    			attr_dev(input0, "class", "input m1 rounded");
    			attr_dev(input0, "placeholder", "username");
    			add_location(input0, file$9, 31, 4, 561);
    			attr_dev(input1, "class", "input m1 rounded");
    			attr_dev(input1, "placeholder", "password");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$9, 32, 4, 644);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "button rounded f2 shadow svelte-14tyox9");
    			add_location(button, file$9, 33, 4, 743);
    			attr_dev(form, "class", "col");
    			add_location(form, file$9, 30, 2, 538);
    			attr_dev(div1, "class", "main container svelte-14tyox9");
    			add_location(div1, file$9, 25, 0, 427);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, span);
    			append_dev(div1, t2);
    			append_dev(div1, form);
    			append_dev(form, input0);
    			set_input_value(input0, /*tmpUser*/ ctx[0]);
    			append_dev(form, t3);
    			append_dev(form, input1);
    			set_input_value(input1, /*tmpPass*/ ctx[1]);
    			append_dev(form, t4);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(button, "submit", prevent_default(/*handleSubmit*/ ctx[2]), false, true, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tmpUser*/ 1 && input0.value !== /*tmpUser*/ ctx[0]) {
    				set_input_value(input0, /*tmpUser*/ ctx[0]);
    			}

    			if (dirty & /*tmpPass*/ 2 && input1.value !== /*tmpPass*/ ctx[1]) {
    				set_input_value(input1, /*tmpPass*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $user;
    	let $pass;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(3, $user = $$value));
    	validate_store(pass, "pass");
    	component_subscribe($$self, pass, $$value => $$invalidate(4, $pass = $$value));
    	let tmpUser = $user;
    	let tmpPass = $pass;

    	const handleSubmit = function (e) {
    		set_store_value(user, $user = tmpUser);
    		set_store_value(pass, $pass = tmpPass);
    		localStorage.setItem("user", tmpUser);
    		localStorage.setItem("pass", tmpPass);
    		e.preventDefault();
    		return false;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	function input0_input_handler() {
    		tmpUser = this.value;
    		$$invalidate(0, tmpUser);
    	}

    	function input1_input_handler() {
    		tmpPass = this.value;
    		$$invalidate(1, tmpPass);
    	}

    	$$self.$capture_state = () => ({
    		user,
    		pass,
    		data: data$1,
    		tmpUser,
    		tmpPass,
    		handleSubmit,
    		$user,
    		$pass
    	});

    	$$self.$inject_state = $$props => {
    		if ("tmpUser" in $$props) $$invalidate(0, tmpUser = $$props.tmpUser);
    		if ("tmpPass" in $$props) $$invalidate(1, tmpPass = $$props.tmpPass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tmpUser,
    		tmpPass,
    		handleSubmit,
    		$user,
    		$pass,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    function debounce$1(func, wait, immediate) {
      let timeout;
      return function () {
        let context = this,
          args = arguments;
        let later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      }
    }

    /* components/DayPick/DayPick.svelte generated by Svelte v3.23.0 */
    const file$a = "components/DayPick/DayPick.svelte";

    function create_fragment$a(ctx) {
    	let div9;
    	let div8;
    	let div7;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let div6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			div0.textContent = "monday";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "tuesday";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "wednesday";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "thursday";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "friday";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "saturday";
    			t11 = space();
    			div6 = element("div");
    			div6.textContent = "sunday";
    			attr_dev(div0, "class", "day svelte-1knkt2r");
    			add_location(div0, file$a, 56, 6, 1291);
    			attr_dev(div1, "class", "day svelte-1knkt2r");
    			add_location(div1, file$a, 57, 6, 1327);
    			attr_dev(div2, "class", "day svelte-1knkt2r");
    			add_location(div2, file$a, 58, 6, 1364);
    			attr_dev(div3, "class", "day svelte-1knkt2r");
    			add_location(div3, file$a, 59, 6, 1403);
    			attr_dev(div4, "class", "day svelte-1knkt2r");
    			add_location(div4, file$a, 60, 6, 1441);
    			attr_dev(div5, "class", "day svelte-1knkt2r");
    			add_location(div5, file$a, 61, 6, 1477);
    			attr_dev(div6, "class", "day svelte-1knkt2r");
    			add_location(div6, file$a, 62, 6, 1515);
    			attr_dev(div7, "class", "row grid svelte-1knkt2r");
    			add_location(div7, file$a, 55, 4, 1253);
    			attr_dev(div8, "class", "container shadow svelte-1knkt2r");
    			add_location(div8, file$a, 54, 2, 1182);
    			attr_dev(div9, "class", "col");
    			add_location(div9, file$a, 53, 0, 1162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div7, t1);
    			append_dev(div7, div1);
    			append_dev(div7, t3);
    			append_dev(div7, div2);
    			append_dev(div7, t5);
    			append_dev(div7, div3);
    			append_dev(div7, t7);
    			append_dev(div7, div4);
    			append_dev(div7, t9);
    			append_dev(div7, div5);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			/*div8_binding*/ ctx[6](div8);

    			if (!mounted) {
    				dispose = listen_dev(
    					div8,
    					"scroll",
    					function () {
    						if (is_function(/*onScroll*/ ctx[1])) /*onScroll*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			/*div8_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const h$1 = 75;
    const w$1 = 300;

    function instance$a($$self, $$props, $$invalidate) {
    	let { callback = () => {
    		
    	} } = $$props;

    	let { date = null } = $$props; //thursday
    	date = src(date);
    	let el;
    	let topLeft = date.clone().startOf("week");
    	let xIndex = date.day() - 1;

    	let onScroll = () => {
    		
    	};

    	onMount(() => {
    		$$invalidate(0, el.scrollLeft = xIndex * w$1, el);

    		$$invalidate(1, onScroll = debounce$1(
    			function (e) {
    				xIndex = Math.round(el.scrollLeft / w$1);
    				$$invalidate(2, date = topLeft.add(xIndex, "days"));
    				callback(date);
    			},
    			300
    		));
    	});

    	const writable_props = ["callback", "date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DayPick> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DayPick", $$slots, []);

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("callback" in $$props) $$invalidate(3, callback = $$props.callback);
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		spacetime: src,
    		debounce: debounce$1,
    		callback,
    		date,
    		h: h$1,
    		w: w$1,
    		el,
    		topLeft,
    		xIndex,
    		onScroll
    	});

    	$$self.$inject_state = $$props => {
    		if ("callback" in $$props) $$invalidate(3, callback = $$props.callback);
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    		if ("el" in $$props) $$invalidate(0, el = $$props.el);
    		if ("topLeft" in $$props) topLeft = $$props.topLeft;
    		if ("xIndex" in $$props) xIndex = $$props.xIndex;
    		if ("onScroll" in $$props) $$invalidate(1, onScroll = $$props.onScroll);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [el, onScroll, date, callback, xIndex, topLeft, div8_binding];
    }

    class DayPick$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { callback: 3, date: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DayPick",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get callback() {
    		throw new Error("<DayPick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<DayPick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<DayPick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<DayPick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var lib = createCommonjsModule$2(function (module, exports) {
    // CodeMirror, copyright (c) by Marijn Haverbeke and others
    // Distributed under an MIT license: https://codemirror.net/LICENSE

    // This is CodeMirror (https://codemirror.net), a code editor
    // implemented in JavaScript on top of the browser's DOM.
    //
    // You can find some technical background for some of the code below
    // at http://marijnhaverbeke.nl/blog/#cm-internals .

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, (function () {
      // Kludges for bugs and behavior differences that can't be feature
      // detected are enabled based on userAgent etc sniffing.
      var userAgent = navigator.userAgent;
      var platform = navigator.platform;

      var gecko = /gecko\/\d/i.test(userAgent);
      var ie_upto10 = /MSIE \d/.test(userAgent);
      var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
      var edge = /Edge\/(\d+)/.exec(userAgent);
      var ie = ie_upto10 || ie_11up || edge;
      var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
      var webkit = !edge && /WebKit\//.test(userAgent);
      var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
      var chrome = !edge && /Chrome\//.test(userAgent);
      var presto = /Opera\//.test(userAgent);
      var safari = /Apple Computer/.test(navigator.vendor);
      var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
      var phantom = /PhantomJS/.test(userAgent);

      var ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
      var android = /Android/.test(userAgent);
      // This is woefully incomplete. Suggestions for alternative methods welcome.
      var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
      var mac = ios || /Mac/.test(platform);
      var chromeOS = /\bCrOS\b/.test(userAgent);
      var windows = /win/i.test(platform);

      var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
      if (presto_version) { presto_version = Number(presto_version[1]); }
      if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
      // Some browsers use the wrong event properties to signal cmd/ctrl on OS X
      var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
      var captureRightClick = gecko || (ie && ie_version >= 9);

      function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*") }

      var rmClass = function(node, cls) {
        var current = node.className;
        var match = classTest(cls).exec(current);
        if (match) {
          var after = current.slice(match.index + match[0].length);
          node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
        }
      };

      function removeChildren(e) {
        for (var count = e.childNodes.length; count > 0; --count)
          { e.removeChild(e.firstChild); }
        return e
      }

      function removeChildrenAndAdd(parent, e) {
        return removeChildren(parent).appendChild(e)
      }

      function elt(tag, content, className, style) {
        var e = document.createElement(tag);
        if (className) { e.className = className; }
        if (style) { e.style.cssText = style; }
        if (typeof content == "string") { e.appendChild(document.createTextNode(content)); }
        else if (content) { for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]); } }
        return e
      }
      // wrapper for elt, which removes the elt from the accessibility tree
      function eltP(tag, content, className, style) {
        var e = elt(tag, content, className, style);
        e.setAttribute("role", "presentation");
        return e
      }

      var range;
      if (document.createRange) { range = function(node, start, end, endNode) {
        var r = document.createRange();
        r.setEnd(endNode || node, end);
        r.setStart(node, start);
        return r
      }; }
      else { range = function(node, start, end) {
        var r = document.body.createTextRange();
        try { r.moveToElementText(node.parentNode); }
        catch(e) { return r }
        r.collapse(true);
        r.moveEnd("character", end);
        r.moveStart("character", start);
        return r
      }; }

      function contains(parent, child) {
        if (child.nodeType == 3) // Android browser always returns false when child is a textnode
          { child = child.parentNode; }
        if (parent.contains)
          { return parent.contains(child) }
        do {
          if (child.nodeType == 11) { child = child.host; }
          if (child == parent) { return true }
        } while (child = child.parentNode)
      }

      function activeElt() {
        // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
        // IE < 10 will throw when accessed while the page is loading or in an iframe.
        // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
        var activeElement;
        try {
          activeElement = document.activeElement;
        } catch(e) {
          activeElement = document.body || null;
        }
        while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
          { activeElement = activeElement.shadowRoot.activeElement; }
        return activeElement
      }

      function addClass(node, cls) {
        var current = node.className;
        if (!classTest(cls).test(current)) { node.className += (current ? " " : "") + cls; }
      }
      function joinClasses(a, b) {
        var as = a.split(" ");
        for (var i = 0; i < as.length; i++)
          { if (as[i] && !classTest(as[i]).test(b)) { b += " " + as[i]; } }
        return b
      }

      var selectInput = function(node) { node.select(); };
      if (ios) // Mobile Safari apparently has a bug where select() is broken.
        { selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length; }; }
      else if (ie) // Suppress mysterious IE10 errors
        { selectInput = function(node) { try { node.select(); } catch(_e) {} }; }

      function bind(f) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function(){return f.apply(null, args)}
      }

      function copyObj(obj, target, overwrite) {
        if (!target) { target = {}; }
        for (var prop in obj)
          { if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
            { target[prop] = obj[prop]; } }
        return target
      }

      // Counts the column offset in a string, taking tabs into account.
      // Used mostly to find indentation.
      function countColumn(string, end, tabSize, startIndex, startValue) {
        if (end == null) {
          end = string.search(/[^\s\u00a0]/);
          if (end == -1) { end = string.length; }
        }
        for (var i = startIndex || 0, n = startValue || 0;;) {
          var nextTab = string.indexOf("\t", i);
          if (nextTab < 0 || nextTab >= end)
            { return n + (end - i) }
          n += nextTab - i;
          n += tabSize - (n % tabSize);
          i = nextTab + 1;
        }
      }

      var Delayed = function() {
        this.id = null;
        this.f = null;
        this.time = 0;
        this.handler = bind(this.onTimeout, this);
      };
      Delayed.prototype.onTimeout = function (self) {
        self.id = 0;
        if (self.time <= +new Date) {
          self.f();
        } else {
          setTimeout(self.handler, self.time - +new Date);
        }
      };
      Delayed.prototype.set = function (ms, f) {
        this.f = f;
        var time = +new Date + ms;
        if (!this.id || time < this.time) {
          clearTimeout(this.id);
          this.id = setTimeout(this.handler, ms);
          this.time = time;
        }
      };

      function indexOf(array, elt) {
        for (var i = 0; i < array.length; ++i)
          { if (array[i] == elt) { return i } }
        return -1
      }

      // Number of pixels added to scroller and sizer to hide scrollbar
      var scrollerGap = 30;

      // Returned or thrown by various protocols to signal 'I'm not
      // handling this'.
      var Pass = {toString: function(){return "CodeMirror.Pass"}};

      // Reused option objects for setSelection & friends
      var sel_dontScroll = {scroll: false}, sel_mouse = {origin: "*mouse"}, sel_move = {origin: "+move"};

      // The inverse of countColumn -- find the offset that corresponds to
      // a particular column.
      function findColumn(string, goal, tabSize) {
        for (var pos = 0, col = 0;;) {
          var nextTab = string.indexOf("\t", pos);
          if (nextTab == -1) { nextTab = string.length; }
          var skipped = nextTab - pos;
          if (nextTab == string.length || col + skipped >= goal)
            { return pos + Math.min(skipped, goal - col) }
          col += nextTab - pos;
          col += tabSize - (col % tabSize);
          pos = nextTab + 1;
          if (col >= goal) { return pos }
        }
      }

      var spaceStrs = [""];
      function spaceStr(n) {
        while (spaceStrs.length <= n)
          { spaceStrs.push(lst(spaceStrs) + " "); }
        return spaceStrs[n]
      }

      function lst(arr) { return arr[arr.length-1] }

      function map(array, f) {
        var out = [];
        for (var i = 0; i < array.length; i++) { out[i] = f(array[i], i); }
        return out
      }

      function insertSorted(array, value, score) {
        var pos = 0, priority = score(value);
        while (pos < array.length && score(array[pos]) <= priority) { pos++; }
        array.splice(pos, 0, value);
      }

      function nothing() {}

      function createObj(base, props) {
        var inst;
        if (Object.create) {
          inst = Object.create(base);
        } else {
          nothing.prototype = base;
          inst = new nothing();
        }
        if (props) { copyObj(props, inst); }
        return inst
      }

      var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
      function isWordCharBasic(ch) {
        return /\w/.test(ch) || ch > "\x80" &&
          (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
      }
      function isWordChar(ch, helper) {
        if (!helper) { return isWordCharBasic(ch) }
        if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) { return true }
        return helper.test(ch)
      }

      function isEmpty(obj) {
        for (var n in obj) { if (obj.hasOwnProperty(n) && obj[n]) { return false } }
        return true
      }

      // Extending unicode characters. A series of a non-extending char +
      // any number of extending chars is treated as a single unit as far
      // as editing and measuring is concerned. This is not fully correct,
      // since some scripts/fonts/browsers also treat other configurations
      // of code points as a group.
      var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
      function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

      // Returns a number from the range [`0`; `str.length`] unless `pos` is outside that range.
      function skipExtendingChars(str, pos, dir) {
        while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) { pos += dir; }
        return pos
      }

      // Returns the value from the range [`from`; `to`] that satisfies
      // `pred` and is closest to `from`. Assumes that at least `to`
      // satisfies `pred`. Supports `from` being greater than `to`.
      function findFirst(pred, from, to) {
        // At any point we are certain `to` satisfies `pred`, don't know
        // whether `from` does.
        var dir = from > to ? -1 : 1;
        for (;;) {
          if (from == to) { return from }
          var midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
          if (mid == from) { return pred(mid) ? from : to }
          if (pred(mid)) { to = mid; }
          else { from = mid + dir; }
        }
      }

      // BIDI HELPERS

      function iterateBidiSections(order, from, to, f) {
        if (!order) { return f(from, to, "ltr", 0) }
        var found = false;
        for (var i = 0; i < order.length; ++i) {
          var part = order[i];
          if (part.from < to && part.to > from || from == to && part.to == from) {
            f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i);
            found = true;
          }
        }
        if (!found) { f(from, to, "ltr"); }
      }

      var bidiOther = null;
      function getBidiPartAt(order, ch, sticky) {
        var found;
        bidiOther = null;
        for (var i = 0; i < order.length; ++i) {
          var cur = order[i];
          if (cur.from < ch && cur.to > ch) { return i }
          if (cur.to == ch) {
            if (cur.from != cur.to && sticky == "before") { found = i; }
            else { bidiOther = i; }
          }
          if (cur.from == ch) {
            if (cur.from != cur.to && sticky != "before") { found = i; }
            else { bidiOther = i; }
          }
        }
        return found != null ? found : bidiOther
      }

      // Bidirectional ordering algorithm
      // See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
      // that this (partially) implements.

      // One-char codes used for character types:
      // L (L):   Left-to-Right
      // R (R):   Right-to-Left
      // r (AL):  Right-to-Left Arabic
      // 1 (EN):  European Number
      // + (ES):  European Number Separator
      // % (ET):  European Number Terminator
      // n (AN):  Arabic Number
      // , (CS):  Common Number Separator
      // m (NSM): Non-Spacing Mark
      // b (BN):  Boundary Neutral
      // s (B):   Paragraph Separator
      // t (S):   Segment Separator
      // w (WS):  Whitespace
      // N (ON):  Other Neutrals

      // Returns null if characters are ordered as they appear
      // (left-to-right), or an array of sections ({from, to, level}
      // objects) in the order in which they occur visually.
      var bidiOrdering = (function() {
        // Character types for codepoints 0 to 0xff
        var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
        // Character types for codepoints 0x600 to 0x6f9
        var arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";
        function charType(code) {
          if (code <= 0xf7) { return lowTypes.charAt(code) }
          else if (0x590 <= code && code <= 0x5f4) { return "R" }
          else if (0x600 <= code && code <= 0x6f9) { return arabicTypes.charAt(code - 0x600) }
          else if (0x6ee <= code && code <= 0x8ac) { return "r" }
          else if (0x2000 <= code && code <= 0x200b) { return "w" }
          else if (code == 0x200c) { return "b" }
          else { return "L" }
        }

        var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
        var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;

        function BidiSpan(level, from, to) {
          this.level = level;
          this.from = from; this.to = to;
        }

        return function(str, direction) {
          var outerType = direction == "ltr" ? "L" : "R";

          if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) { return false }
          var len = str.length, types = [];
          for (var i = 0; i < len; ++i)
            { types.push(charType(str.charCodeAt(i))); }

          // W1. Examine each non-spacing mark (NSM) in the level run, and
          // change the type of the NSM to the type of the previous
          // character. If the NSM is at the start of the level run, it will
          // get the type of sor.
          for (var i$1 = 0, prev = outerType; i$1 < len; ++i$1) {
            var type = types[i$1];
            if (type == "m") { types[i$1] = prev; }
            else { prev = type; }
          }

          // W2. Search backwards from each instance of a European number
          // until the first strong type (R, L, AL, or sor) is found. If an
          // AL is found, change the type of the European number to Arabic
          // number.
          // W3. Change all ALs to R.
          for (var i$2 = 0, cur = outerType; i$2 < len; ++i$2) {
            var type$1 = types[i$2];
            if (type$1 == "1" && cur == "r") { types[i$2] = "n"; }
            else if (isStrong.test(type$1)) { cur = type$1; if (type$1 == "r") { types[i$2] = "R"; } }
          }

          // W4. A single European separator between two European numbers
          // changes to a European number. A single common separator between
          // two numbers of the same type changes to that type.
          for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
            var type$2 = types[i$3];
            if (type$2 == "+" && prev$1 == "1" && types[i$3+1] == "1") { types[i$3] = "1"; }
            else if (type$2 == "," && prev$1 == types[i$3+1] &&
                     (prev$1 == "1" || prev$1 == "n")) { types[i$3] = prev$1; }
            prev$1 = type$2;
          }

          // W5. A sequence of European terminators adjacent to European
          // numbers changes to all European numbers.
          // W6. Otherwise, separators and terminators change to Other
          // Neutral.
          for (var i$4 = 0; i$4 < len; ++i$4) {
            var type$3 = types[i$4];
            if (type$3 == ",") { types[i$4] = "N"; }
            else if (type$3 == "%") {
              var end = (void 0);
              for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {}
              var replace = (i$4 && types[i$4-1] == "!") || (end < len && types[end] == "1") ? "1" : "N";
              for (var j = i$4; j < end; ++j) { types[j] = replace; }
              i$4 = end - 1;
            }
          }

          // W7. Search backwards from each instance of a European number
          // until the first strong type (R, L, or sor) is found. If an L is
          // found, then change the type of the European number to L.
          for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
            var type$4 = types[i$5];
            if (cur$1 == "L" && type$4 == "1") { types[i$5] = "L"; }
            else if (isStrong.test(type$4)) { cur$1 = type$4; }
          }

          // N1. A sequence of neutrals takes the direction of the
          // surrounding strong text if the text on both sides has the same
          // direction. European and Arabic numbers act as if they were R in
          // terms of their influence on neutrals. Start-of-level-run (sor)
          // and end-of-level-run (eor) are used at level run boundaries.
          // N2. Any remaining neutrals take the embedding direction.
          for (var i$6 = 0; i$6 < len; ++i$6) {
            if (isNeutral.test(types[i$6])) {
              var end$1 = (void 0);
              for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {}
              var before = (i$6 ? types[i$6-1] : outerType) == "L";
              var after = (end$1 < len ? types[end$1] : outerType) == "L";
              var replace$1 = before == after ? (before ? "L" : "R") : outerType;
              for (var j$1 = i$6; j$1 < end$1; ++j$1) { types[j$1] = replace$1; }
              i$6 = end$1 - 1;
            }
          }

          // Here we depart from the documented algorithm, in order to avoid
          // building up an actual levels array. Since there are only three
          // levels (0, 1, 2) in an implementation that doesn't take
          // explicit embedding into account, we can build up the order on
          // the fly, without following the level-based algorithm.
          var order = [], m;
          for (var i$7 = 0; i$7 < len;) {
            if (countsAsLeft.test(types[i$7])) {
              var start = i$7;
              for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
              order.push(new BidiSpan(0, start, i$7));
            } else {
              var pos = i$7, at = order.length;
              for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
              for (var j$2 = pos; j$2 < i$7;) {
                if (countsAsNum.test(types[j$2])) {
                  if (pos < j$2) { order.splice(at, 0, new BidiSpan(1, pos, j$2)); }
                  var nstart = j$2;
                  for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
                  order.splice(at, 0, new BidiSpan(2, nstart, j$2));
                  pos = j$2;
                } else { ++j$2; }
              }
              if (pos < i$7) { order.splice(at, 0, new BidiSpan(1, pos, i$7)); }
            }
          }
          if (direction == "ltr") {
            if (order[0].level == 1 && (m = str.match(/^\s+/))) {
              order[0].from = m[0].length;
              order.unshift(new BidiSpan(0, 0, m[0].length));
            }
            if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
              lst(order).to -= m[0].length;
              order.push(new BidiSpan(0, len - m[0].length, len));
            }
          }

          return direction == "rtl" ? order.reverse() : order
        }
      })();

      // Get the bidi ordering for the given line (and cache it). Returns
      // false for lines that are fully left-to-right, and an array of
      // BidiSpan objects otherwise.
      function getOrder(line, direction) {
        var order = line.order;
        if (order == null) { order = line.order = bidiOrdering(line.text, direction); }
        return order
      }

      // EVENT HANDLING

      // Lightweight event framework. on/off also work on DOM nodes,
      // registering native DOM handlers.

      var noHandlers = [];

      var on = function(emitter, type, f) {
        if (emitter.addEventListener) {
          emitter.addEventListener(type, f, false);
        } else if (emitter.attachEvent) {
          emitter.attachEvent("on" + type, f);
        } else {
          var map$$1 = emitter._handlers || (emitter._handlers = {});
          map$$1[type] = (map$$1[type] || noHandlers).concat(f);
        }
      };

      function getHandlers(emitter, type) {
        return emitter._handlers && emitter._handlers[type] || noHandlers
      }

      function off(emitter, type, f) {
        if (emitter.removeEventListener) {
          emitter.removeEventListener(type, f, false);
        } else if (emitter.detachEvent) {
          emitter.detachEvent("on" + type, f);
        } else {
          var map$$1 = emitter._handlers, arr = map$$1 && map$$1[type];
          if (arr) {
            var index = indexOf(arr, f);
            if (index > -1)
              { map$$1[type] = arr.slice(0, index).concat(arr.slice(index + 1)); }
          }
        }
      }

      function signal(emitter, type /*, values...*/) {
        var handlers = getHandlers(emitter, type);
        if (!handlers.length) { return }
        var args = Array.prototype.slice.call(arguments, 2);
        for (var i = 0; i < handlers.length; ++i) { handlers[i].apply(null, args); }
      }

      // The DOM events that CodeMirror handles can be overridden by
      // registering a (non-DOM) handler on the editor for the event name,
      // and preventDefault-ing the event in that handler.
      function signalDOMEvent(cm, e, override) {
        if (typeof e == "string")
          { e = {type: e, preventDefault: function() { this.defaultPrevented = true; }}; }
        signal(cm, override || e.type, cm, e);
        return e_defaultPrevented(e) || e.codemirrorIgnore
      }

      function signalCursorActivity(cm) {
        var arr = cm._handlers && cm._handlers.cursorActivity;
        if (!arr) { return }
        var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
        for (var i = 0; i < arr.length; ++i) { if (indexOf(set, arr[i]) == -1)
          { set.push(arr[i]); } }
      }

      function hasHandler(emitter, type) {
        return getHandlers(emitter, type).length > 0
      }

      // Add on and off methods to a constructor's prototype, to make
      // registering events on such objects more convenient.
      function eventMixin(ctor) {
        ctor.prototype.on = function(type, f) {on(this, type, f);};
        ctor.prototype.off = function(type, f) {off(this, type, f);};
      }

      // Due to the fact that we still support jurassic IE versions, some
      // compatibility wrappers are needed.

      function e_preventDefault(e) {
        if (e.preventDefault) { e.preventDefault(); }
        else { e.returnValue = false; }
      }
      function e_stopPropagation(e) {
        if (e.stopPropagation) { e.stopPropagation(); }
        else { e.cancelBubble = true; }
      }
      function e_defaultPrevented(e) {
        return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false
      }
      function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}

      function e_target(e) {return e.target || e.srcElement}
      function e_button(e) {
        var b = e.which;
        if (b == null) {
          if (e.button & 1) { b = 1; }
          else if (e.button & 2) { b = 3; }
          else if (e.button & 4) { b = 2; }
        }
        if (mac && e.ctrlKey && b == 1) { b = 3; }
        return b
      }

      // Detect drag-and-drop
      var dragAndDrop = function() {
        // There is *some* kind of drag-and-drop support in IE6-8, but I
        // couldn't get it to work yet.
        if (ie && ie_version < 9) { return false }
        var div = elt('div');
        return "draggable" in div || "dragDrop" in div
      }();

      var zwspSupported;
      function zeroWidthElement(measure) {
        if (zwspSupported == null) {
          var test = elt("span", "\u200b");
          removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
          if (measure.firstChild.offsetHeight != 0)
            { zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8); }
        }
        var node = zwspSupported ? elt("span", "\u200b") :
          elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
        node.setAttribute("cm-text", "");
        return node
      }

      // Feature-detect IE's crummy client rect reporting for bidi text
      var badBidiRects;
      function hasBadBidiRects(measure) {
        if (badBidiRects != null) { return badBidiRects }
        var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"));
        var r0 = range(txt, 0, 1).getBoundingClientRect();
        var r1 = range(txt, 1, 2).getBoundingClientRect();
        removeChildren(measure);
        if (!r0 || r0.left == r0.right) { return false } // Safari returns null in some cases (#2780)
        return badBidiRects = (r1.right - r0.right < 3)
      }

      // See if "".split is the broken IE version, if so, provide an
      // alternative way to split lines.
      var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function (string) {
        var pos = 0, result = [], l = string.length;
        while (pos <= l) {
          var nl = string.indexOf("\n", pos);
          if (nl == -1) { nl = string.length; }
          var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
          var rt = line.indexOf("\r");
          if (rt != -1) {
            result.push(line.slice(0, rt));
            pos += rt + 1;
          } else {
            result.push(line);
            pos = nl + 1;
          }
        }
        return result
      } : function (string) { return string.split(/\r\n?|\n/); };

      var hasSelection = window.getSelection ? function (te) {
        try { return te.selectionStart != te.selectionEnd }
        catch(e) { return false }
      } : function (te) {
        var range$$1;
        try {range$$1 = te.ownerDocument.selection.createRange();}
        catch(e) {}
        if (!range$$1 || range$$1.parentElement() != te) { return false }
        return range$$1.compareEndPoints("StartToEnd", range$$1) != 0
      };

      var hasCopyEvent = (function () {
        var e = elt("div");
        if ("oncopy" in e) { return true }
        e.setAttribute("oncopy", "return;");
        return typeof e.oncopy == "function"
      })();

      var badZoomedRects = null;
      function hasBadZoomedRects(measure) {
        if (badZoomedRects != null) { return badZoomedRects }
        var node = removeChildrenAndAdd(measure, elt("span", "x"));
        var normal = node.getBoundingClientRect();
        var fromRange = range(node, 0, 1).getBoundingClientRect();
        return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1
      }

      // Known modes, by name and by MIME
      var modes = {}, mimeModes = {};

      // Extra arguments are stored as the mode's dependencies, which is
      // used by (legacy) mechanisms like loadmode.js to automatically
      // load a mode. (Preferred mechanism is the require/define calls.)
      function defineMode(name, mode) {
        if (arguments.length > 2)
          { mode.dependencies = Array.prototype.slice.call(arguments, 2); }
        modes[name] = mode;
      }

      function defineMIME(mime, spec) {
        mimeModes[mime] = spec;
      }

      // Given a MIME type, a {name, ...options} config object, or a name
      // string, return a mode config object.
      function resolveMode(spec) {
        if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
          spec = mimeModes[spec];
        } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
          var found = mimeModes[spec.name];
          if (typeof found == "string") { found = {name: found}; }
          spec = createObj(found, spec);
          spec.name = found.name;
        } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
          return resolveMode("application/xml")
        } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
          return resolveMode("application/json")
        }
        if (typeof spec == "string") { return {name: spec} }
        else { return spec || {name: "null"} }
      }

      // Given a mode spec (anything that resolveMode accepts), find and
      // initialize an actual mode object.
      function getMode(options, spec) {
        spec = resolveMode(spec);
        var mfactory = modes[spec.name];
        if (!mfactory) { return getMode(options, "text/plain") }
        var modeObj = mfactory(options, spec);
        if (modeExtensions.hasOwnProperty(spec.name)) {
          var exts = modeExtensions[spec.name];
          for (var prop in exts) {
            if (!exts.hasOwnProperty(prop)) { continue }
            if (modeObj.hasOwnProperty(prop)) { modeObj["_" + prop] = modeObj[prop]; }
            modeObj[prop] = exts[prop];
          }
        }
        modeObj.name = spec.name;
        if (spec.helperType) { modeObj.helperType = spec.helperType; }
        if (spec.modeProps) { for (var prop$1 in spec.modeProps)
          { modeObj[prop$1] = spec.modeProps[prop$1]; } }

        return modeObj
      }

      // This can be used to attach properties to mode objects from
      // outside the actual mode definition.
      var modeExtensions = {};
      function extendMode(mode, properties) {
        var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
        copyObj(properties, exts);
      }

      function copyState(mode, state) {
        if (state === true) { return state }
        if (mode.copyState) { return mode.copyState(state) }
        var nstate = {};
        for (var n in state) {
          var val = state[n];
          if (val instanceof Array) { val = val.concat([]); }
          nstate[n] = val;
        }
        return nstate
      }

      // Given a mode and a state (for that mode), find the inner mode and
      // state at the position that the state refers to.
      function innerMode(mode, state) {
        var info;
        while (mode.innerMode) {
          info = mode.innerMode(state);
          if (!info || info.mode == mode) { break }
          state = info.state;
          mode = info.mode;
        }
        return info || {mode: mode, state: state}
      }

      function startState(mode, a1, a2) {
        return mode.startState ? mode.startState(a1, a2) : true
      }

      // STRING STREAM

      // Fed to the mode parsers, provides helper functions to make
      // parsers more succinct.

      var StringStream = function(string, tabSize, lineOracle) {
        this.pos = this.start = 0;
        this.string = string;
        this.tabSize = tabSize || 8;
        this.lastColumnPos = this.lastColumnValue = 0;
        this.lineStart = 0;
        this.lineOracle = lineOracle;
      };

      StringStream.prototype.eol = function () {return this.pos >= this.string.length};
      StringStream.prototype.sol = function () {return this.pos == this.lineStart};
      StringStream.prototype.peek = function () {return this.string.charAt(this.pos) || undefined};
      StringStream.prototype.next = function () {
        if (this.pos < this.string.length)
          { return this.string.charAt(this.pos++) }
      };
      StringStream.prototype.eat = function (match) {
        var ch = this.string.charAt(this.pos);
        var ok;
        if (typeof match == "string") { ok = ch == match; }
        else { ok = ch && (match.test ? match.test(ch) : match(ch)); }
        if (ok) {++this.pos; return ch}
      };
      StringStream.prototype.eatWhile = function (match) {
        var start = this.pos;
        while (this.eat(match)){}
        return this.pos > start
      };
      StringStream.prototype.eatSpace = function () {
          var this$1 = this;

        var start = this.pos;
        while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) { ++this$1.pos; }
        return this.pos > start
      };
      StringStream.prototype.skipToEnd = function () {this.pos = this.string.length;};
      StringStream.prototype.skipTo = function (ch) {
        var found = this.string.indexOf(ch, this.pos);
        if (found > -1) {this.pos = found; return true}
      };
      StringStream.prototype.backUp = function (n) {this.pos -= n;};
      StringStream.prototype.column = function () {
        if (this.lastColumnPos < this.start) {
          this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
          this.lastColumnPos = this.start;
        }
        return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
      };
      StringStream.prototype.indentation = function () {
        return countColumn(this.string, null, this.tabSize) -
          (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
      };
      StringStream.prototype.match = function (pattern, consume, caseInsensitive) {
        if (typeof pattern == "string") {
          var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; };
          var substr = this.string.substr(this.pos, pattern.length);
          if (cased(substr) == cased(pattern)) {
            if (consume !== false) { this.pos += pattern.length; }
            return true
          }
        } else {
          var match = this.string.slice(this.pos).match(pattern);
          if (match && match.index > 0) { return null }
          if (match && consume !== false) { this.pos += match[0].length; }
          return match
        }
      };
      StringStream.prototype.current = function (){return this.string.slice(this.start, this.pos)};
      StringStream.prototype.hideFirstChars = function (n, inner) {
        this.lineStart += n;
        try { return inner() }
        finally { this.lineStart -= n; }
      };
      StringStream.prototype.lookAhead = function (n) {
        var oracle = this.lineOracle;
        return oracle && oracle.lookAhead(n)
      };
      StringStream.prototype.baseToken = function () {
        var oracle = this.lineOracle;
        return oracle && oracle.baseToken(this.pos)
      };

      // Find the line object corresponding to the given line number.
      function getLine(doc, n) {
        n -= doc.first;
        if (n < 0 || n >= doc.size) { throw new Error("There is no line " + (n + doc.first) + " in the document.") }
        var chunk = doc;
        while (!chunk.lines) {
          for (var i = 0;; ++i) {
            var child = chunk.children[i], sz = child.chunkSize();
            if (n < sz) { chunk = child; break }
            n -= sz;
          }
        }
        return chunk.lines[n]
      }

      // Get the part of a document between two positions, as an array of
      // strings.
      function getBetween(doc, start, end) {
        var out = [], n = start.line;
        doc.iter(start.line, end.line + 1, function (line) {
          var text = line.text;
          if (n == end.line) { text = text.slice(0, end.ch); }
          if (n == start.line) { text = text.slice(start.ch); }
          out.push(text);
          ++n;
        });
        return out
      }
      // Get the lines between from and to, as array of strings.
      function getLines(doc, from, to) {
        var out = [];
        doc.iter(from, to, function (line) { out.push(line.text); }); // iter aborts when callback returns truthy value
        return out
      }

      // Update the height of a line, propagating the height change
      // upwards to parent nodes.
      function updateLineHeight(line, height) {
        var diff = height - line.height;
        if (diff) { for (var n = line; n; n = n.parent) { n.height += diff; } }
      }

      // Given a line object, find its line number by walking up through
      // its parent links.
      function lineNo(line) {
        if (line.parent == null) { return null }
        var cur = line.parent, no = indexOf(cur.lines, line);
        for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
          for (var i = 0;; ++i) {
            if (chunk.children[i] == cur) { break }
            no += chunk.children[i].chunkSize();
          }
        }
        return no + cur.first
      }

      // Find the line at the given vertical position, using the height
      // information in the document tree.
      function lineAtHeight(chunk, h) {
        var n = chunk.first;
        outer: do {
          for (var i$1 = 0; i$1 < chunk.children.length; ++i$1) {
            var child = chunk.children[i$1], ch = child.height;
            if (h < ch) { chunk = child; continue outer }
            h -= ch;
            n += child.chunkSize();
          }
          return n
        } while (!chunk.lines)
        var i = 0;
        for (; i < chunk.lines.length; ++i) {
          var line = chunk.lines[i], lh = line.height;
          if (h < lh) { break }
          h -= lh;
        }
        return n + i
      }

      function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size}

      function lineNumberFor(options, i) {
        return String(options.lineNumberFormatter(i + options.firstLineNumber))
      }

      // A Pos instance represents a position within the text.
      function Pos(line, ch, sticky) {
        if ( sticky === void 0 ) sticky = null;

        if (!(this instanceof Pos)) { return new Pos(line, ch, sticky) }
        this.line = line;
        this.ch = ch;
        this.sticky = sticky;
      }

      // Compare two positions, return 0 if they are the same, a negative
      // number when a is less, and a positive number otherwise.
      function cmp(a, b) { return a.line - b.line || a.ch - b.ch }

      function equalCursorPos(a, b) { return a.sticky == b.sticky && cmp(a, b) == 0 }

      function copyPos(x) {return Pos(x.line, x.ch)}
      function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
      function minPos(a, b) { return cmp(a, b) < 0 ? a : b }

      // Most of the external API clips given positions to make sure they
      // actually exist within the document.
      function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1))}
      function clipPos(doc, pos) {
        if (pos.line < doc.first) { return Pos(doc.first, 0) }
        var last = doc.first + doc.size - 1;
        if (pos.line > last) { return Pos(last, getLine(doc, last).text.length) }
        return clipToLen(pos, getLine(doc, pos.line).text.length)
      }
      function clipToLen(pos, linelen) {
        var ch = pos.ch;
        if (ch == null || ch > linelen) { return Pos(pos.line, linelen) }
        else if (ch < 0) { return Pos(pos.line, 0) }
        else { return pos }
      }
      function clipPosArray(doc, array) {
        var out = [];
        for (var i = 0; i < array.length; i++) { out[i] = clipPos(doc, array[i]); }
        return out
      }

      var SavedContext = function(state, lookAhead) {
        this.state = state;
        this.lookAhead = lookAhead;
      };

      var Context = function(doc, state, line, lookAhead) {
        this.state = state;
        this.doc = doc;
        this.line = line;
        this.maxLookAhead = lookAhead || 0;
        this.baseTokens = null;
        this.baseTokenPos = 1;
      };

      Context.prototype.lookAhead = function (n) {
        var line = this.doc.getLine(this.line + n);
        if (line != null && n > this.maxLookAhead) { this.maxLookAhead = n; }
        return line
      };

      Context.prototype.baseToken = function (n) {
          var this$1 = this;

        if (!this.baseTokens) { return null }
        while (this.baseTokens[this.baseTokenPos] <= n)
          { this$1.baseTokenPos += 2; }
        var type = this.baseTokens[this.baseTokenPos + 1];
        return {type: type && type.replace(/( |^)overlay .*/, ""),
                size: this.baseTokens[this.baseTokenPos] - n}
      };

      Context.prototype.nextLine = function () {
        this.line++;
        if (this.maxLookAhead > 0) { this.maxLookAhead--; }
      };

      Context.fromSaved = function (doc, saved, line) {
        if (saved instanceof SavedContext)
          { return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead) }
        else
          { return new Context(doc, copyState(doc.mode, saved), line) }
      };

      Context.prototype.save = function (copy) {
        var state = copy !== false ? copyState(this.doc.mode, this.state) : this.state;
        return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state
      };


      // Compute a style array (an array starting with a mode generation
      // -- for invalidation -- followed by pairs of end positions and
      // style strings), which is used to highlight the tokens on the
      // line.
      function highlightLine(cm, line, context, forceToEnd) {
        // A styles array always starts with a number identifying the
        // mode/overlays that it is based on (for easy invalidation).
        var st = [cm.state.modeGen], lineClasses = {};
        // Compute the base array of styles
        runMode(cm, line.text, cm.doc.mode, context, function (end, style) { return st.push(end, style); },
                lineClasses, forceToEnd);
        var state = context.state;

        // Run overlays, adjust style array.
        var loop = function ( o ) {
          context.baseTokens = st;
          var overlay = cm.state.overlays[o], i = 1, at = 0;
          context.state = true;
          runMode(cm, line.text, overlay.mode, context, function (end, style) {
            var start = i;
            // Ensure there's a token end at the current position, and that i points at it
            while (at < end) {
              var i_end = st[i];
              if (i_end > end)
                { st.splice(i, 1, end, st[i+1], i_end); }
              i += 2;
              at = Math.min(end, i_end);
            }
            if (!style) { return }
            if (overlay.opaque) {
              st.splice(start, i - start, end, "overlay " + style);
              i = start + 2;
            } else {
              for (; start < i; start += 2) {
                var cur = st[start+1];
                st[start+1] = (cur ? cur + " " : "") + "overlay " + style;
              }
            }
          }, lineClasses);
          context.state = state;
          context.baseTokens = null;
          context.baseTokenPos = 1;
        };

        for (var o = 0; o < cm.state.overlays.length; ++o) loop( o );

        return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
      }

      function getLineStyles(cm, line, updateFrontier) {
        if (!line.styles || line.styles[0] != cm.state.modeGen) {
          var context = getContextBefore(cm, lineNo(line));
          var resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state);
          var result = highlightLine(cm, line, context);
          if (resetState) { context.state = resetState; }
          line.stateAfter = context.save(!resetState);
          line.styles = result.styles;
          if (result.classes) { line.styleClasses = result.classes; }
          else if (line.styleClasses) { line.styleClasses = null; }
          if (updateFrontier === cm.doc.highlightFrontier)
            { cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier); }
        }
        return line.styles
      }

      function getContextBefore(cm, n, precise) {
        var doc = cm.doc, display = cm.display;
        if (!doc.mode.startState) { return new Context(doc, true, n) }
        var start = findStartLine(cm, n, precise);
        var saved = start > doc.first && getLine(doc, start - 1).stateAfter;
        var context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, startState(doc.mode), start);

        doc.iter(start, n, function (line) {
          processLine(cm, line.text, context);
          var pos = context.line;
          line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
          context.nextLine();
        });
        if (precise) { doc.modeFrontier = context.line; }
        return context
      }

      // Lightweight form of highlight -- proceed over this line and
      // update state, but don't save a style array. Used for lines that
      // aren't currently visible.
      function processLine(cm, text, context, startAt) {
        var mode = cm.doc.mode;
        var stream = new StringStream(text, cm.options.tabSize, context);
        stream.start = stream.pos = startAt || 0;
        if (text == "") { callBlankLine(mode, context.state); }
        while (!stream.eol()) {
          readToken(mode, stream, context.state);
          stream.start = stream.pos;
        }
      }

      function callBlankLine(mode, state) {
        if (mode.blankLine) { return mode.blankLine(state) }
        if (!mode.innerMode) { return }
        var inner = innerMode(mode, state);
        if (inner.mode.blankLine) { return inner.mode.blankLine(inner.state) }
      }

      function readToken(mode, stream, state, inner) {
        for (var i = 0; i < 10; i++) {
          if (inner) { inner[0] = innerMode(mode, state).mode; }
          var style = mode.token(stream, state);
          if (stream.pos > stream.start) { return style }
        }
        throw new Error("Mode " + mode.name + " failed to advance stream.")
      }

      var Token = function(stream, type, state) {
        this.start = stream.start; this.end = stream.pos;
        this.string = stream.current();
        this.type = type || null;
        this.state = state;
      };

      // Utility for getTokenAt and getLineTokens
      function takeToken(cm, pos, precise, asArray) {
        var doc = cm.doc, mode = doc.mode, style;
        pos = clipPos(doc, pos);
        var line = getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise);
        var stream = new StringStream(line.text, cm.options.tabSize, context), tokens;
        if (asArray) { tokens = []; }
        while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
          stream.start = stream.pos;
          style = readToken(mode, stream, context.state);
          if (asArray) { tokens.push(new Token(stream, style, copyState(doc.mode, context.state))); }
        }
        return asArray ? tokens : new Token(stream, style, context.state)
      }

      function extractLineClasses(type, output) {
        if (type) { for (;;) {
          var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
          if (!lineClass) { break }
          type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
          var prop = lineClass[1] ? "bgClass" : "textClass";
          if (output[prop] == null)
            { output[prop] = lineClass[2]; }
          else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
            { output[prop] += " " + lineClass[2]; }
        } }
        return type
      }

      // Run the given mode's parser over a line, calling f for each token.
      function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
        var flattenSpans = mode.flattenSpans;
        if (flattenSpans == null) { flattenSpans = cm.options.flattenSpans; }
        var curStart = 0, curStyle = null;
        var stream = new StringStream(text, cm.options.tabSize, context), style;
        var inner = cm.options.addModeClass && [null];
        if (text == "") { extractLineClasses(callBlankLine(mode, context.state), lineClasses); }
        while (!stream.eol()) {
          if (stream.pos > cm.options.maxHighlightLength) {
            flattenSpans = false;
            if (forceToEnd) { processLine(cm, text, context, stream.pos); }
            stream.pos = text.length;
            style = null;
          } else {
            style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
          }
          if (inner) {
            var mName = inner[0].name;
            if (mName) { style = "m-" + (style ? mName + " " + style : mName); }
          }
          if (!flattenSpans || curStyle != style) {
            while (curStart < stream.start) {
              curStart = Math.min(stream.start, curStart + 5000);
              f(curStart, curStyle);
            }
            curStyle = style;
          }
          stream.start = stream.pos;
        }
        while (curStart < stream.pos) {
          // Webkit seems to refuse to render text nodes longer than 57444
          // characters, and returns inaccurate measurements in nodes
          // starting around 5000 chars.
          var pos = Math.min(stream.pos, curStart + 5000);
          f(pos, curStyle);
          curStart = pos;
        }
      }

      // Finds the line to start with when starting a parse. Tries to
      // find a line with a stateAfter, so that it can start with a
      // valid state. If that fails, it returns the line with the
      // smallest indentation, which tends to need the least context to
      // parse correctly.
      function findStartLine(cm, n, precise) {
        var minindent, minline, doc = cm.doc;
        var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);
        for (var search = n; search > lim; --search) {
          if (search <= doc.first) { return doc.first }
          var line = getLine(doc, search - 1), after = line.stateAfter;
          if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier))
            { return search }
          var indented = countColumn(line.text, null, cm.options.tabSize);
          if (minline == null || minindent > indented) {
            minline = search - 1;
            minindent = indented;
          }
        }
        return minline
      }

      function retreatFrontier(doc, n) {
        doc.modeFrontier = Math.min(doc.modeFrontier, n);
        if (doc.highlightFrontier < n - 10) { return }
        var start = doc.first;
        for (var line = n - 1; line > start; line--) {
          var saved = getLine(doc, line).stateAfter;
          // change is on 3
          // state on line 1 looked ahead 2 -- so saw 3
          // test 1 + 2 < 3 should cover this
          if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
            start = line + 1;
            break
          }
        }
        doc.highlightFrontier = Math.min(doc.highlightFrontier, start);
      }

      // Optimize some code when these features are not used.
      var sawReadOnlySpans = false, sawCollapsedSpans = false;

      function seeReadOnlySpans() {
        sawReadOnlySpans = true;
      }

      function seeCollapsedSpans() {
        sawCollapsedSpans = true;
      }

      // TEXTMARKER SPANS

      function MarkedSpan(marker, from, to) {
        this.marker = marker;
        this.from = from; this.to = to;
      }

      // Search an array of spans for a span matching the given marker.
      function getMarkedSpanFor(spans, marker) {
        if (spans) { for (var i = 0; i < spans.length; ++i) {
          var span = spans[i];
          if (span.marker == marker) { return span }
        } }
      }
      // Remove a span from an array, returning undefined if no spans are
      // left (we don't store arrays for lines without spans).
      function removeMarkedSpan(spans, span) {
        var r;
        for (var i = 0; i < spans.length; ++i)
          { if (spans[i] != span) { (r || (r = [])).push(spans[i]); } }
        return r
      }
      // Add a span to a line.
      function addMarkedSpan(line, span) {
        line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
        span.marker.attachLine(line);
      }

      // Used for the algorithm that adjusts markers for a change in the
      // document. These functions cut an array of spans at a given
      // character position, returning an array of remaining chunks (or
      // undefined if nothing remains).
      function markedSpansBefore(old, startCh, isInsert) {
        var nw;
        if (old) { for (var i = 0; i < old.length; ++i) {
          var span = old[i], marker = span.marker;
          var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
          if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
            var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh)
            ;(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
          }
        } }
        return nw
      }
      function markedSpansAfter(old, endCh, isInsert) {
        var nw;
        if (old) { for (var i = 0; i < old.length; ++i) {
          var span = old[i], marker = span.marker;
          var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
          if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
            var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh)
            ;(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
                                                  span.to == null ? null : span.to - endCh));
          }
        } }
        return nw
      }

      // Given a change object, compute the new set of marker spans that
      // cover the line in which the change took place. Removes spans
      // entirely within the change, reconnects spans belonging to the
      // same marker that appear on both sides of the change, and cuts off
      // spans partially within the change. Returns an array of span
      // arrays with one element for each line in (after) the change.
      function stretchSpansOverChange(doc, change) {
        if (change.full) { return null }
        var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
        var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
        if (!oldFirst && !oldLast) { return null }

        var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0;
        // Get the spans that 'stick out' on both sides
        var first = markedSpansBefore(oldFirst, startCh, isInsert);
        var last = markedSpansAfter(oldLast, endCh, isInsert);

        // Next, merge those two ends
        var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
        if (first) {
          // Fix up .to properties of first
          for (var i = 0; i < first.length; ++i) {
            var span = first[i];
            if (span.to == null) {
              var found = getMarkedSpanFor(last, span.marker);
              if (!found) { span.to = startCh; }
              else if (sameLine) { span.to = found.to == null ? null : found.to + offset; }
            }
          }
        }
        if (last) {
          // Fix up .from in last (or move them into first in case of sameLine)
          for (var i$1 = 0; i$1 < last.length; ++i$1) {
            var span$1 = last[i$1];
            if (span$1.to != null) { span$1.to += offset; }
            if (span$1.from == null) {
              var found$1 = getMarkedSpanFor(first, span$1.marker);
              if (!found$1) {
                span$1.from = offset;
                if (sameLine) { (first || (first = [])).push(span$1); }
              }
            } else {
              span$1.from += offset;
              if (sameLine) { (first || (first = [])).push(span$1); }
            }
          }
        }
        // Make sure we didn't create any zero-length spans
        if (first) { first = clearEmptySpans(first); }
        if (last && last != first) { last = clearEmptySpans(last); }

        var newMarkers = [first];
        if (!sameLine) {
          // Fill gap with whole-line-spans
          var gap = change.text.length - 2, gapMarkers;
          if (gap > 0 && first)
            { for (var i$2 = 0; i$2 < first.length; ++i$2)
              { if (first[i$2].to == null)
                { (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$2].marker, null, null)); } } }
          for (var i$3 = 0; i$3 < gap; ++i$3)
            { newMarkers.push(gapMarkers); }
          newMarkers.push(last);
        }
        return newMarkers
      }

      // Remove spans that are empty and don't have a clearWhenEmpty
      // option of false.
      function clearEmptySpans(spans) {
        for (var i = 0; i < spans.length; ++i) {
          var span = spans[i];
          if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
            { spans.splice(i--, 1); }
        }
        if (!spans.length) { return null }
        return spans
      }

      // Used to 'clip' out readOnly ranges when making a change.
      function removeReadOnlyRanges(doc, from, to) {
        var markers = null;
        doc.iter(from.line, to.line + 1, function (line) {
          if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
            var mark = line.markedSpans[i].marker;
            if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
              { (markers || (markers = [])).push(mark); }
          } }
        });
        if (!markers) { return null }
        var parts = [{from: from, to: to}];
        for (var i = 0; i < markers.length; ++i) {
          var mk = markers[i], m = mk.find(0);
          for (var j = 0; j < parts.length; ++j) {
            var p = parts[j];
            if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) { continue }
            var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to);
            if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
              { newParts.push({from: p.from, to: m.from}); }
            if (dto > 0 || !mk.inclusiveRight && !dto)
              { newParts.push({from: m.to, to: p.to}); }
            parts.splice.apply(parts, newParts);
            j += newParts.length - 3;
          }
        }
        return parts
      }

      // Connect or disconnect spans from a line.
      function detachMarkedSpans(line) {
        var spans = line.markedSpans;
        if (!spans) { return }
        for (var i = 0; i < spans.length; ++i)
          { spans[i].marker.detachLine(line); }
        line.markedSpans = null;
      }
      function attachMarkedSpans(line, spans) {
        if (!spans) { return }
        for (var i = 0; i < spans.length; ++i)
          { spans[i].marker.attachLine(line); }
        line.markedSpans = spans;
      }

      // Helpers used when computing which overlapping collapsed span
      // counts as the larger one.
      function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0 }
      function extraRight(marker) { return marker.inclusiveRight ? 1 : 0 }

      // Returns a number indicating which of two overlapping collapsed
      // spans is larger (and thus includes the other). Falls back to
      // comparing ids when the spans cover exactly the same range.
      function compareCollapsedMarkers(a, b) {
        var lenDiff = a.lines.length - b.lines.length;
        if (lenDiff != 0) { return lenDiff }
        var aPos = a.find(), bPos = b.find();
        var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
        if (fromCmp) { return -fromCmp }
        var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
        if (toCmp) { return toCmp }
        return b.id - a.id
      }

      // Find out whether a line ends or starts in a collapsed span. If
      // so, return the marker for that span.
      function collapsedSpanAtSide(line, start) {
        var sps = sawCollapsedSpans && line.markedSpans, found;
        if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
          sp = sps[i];
          if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
              (!found || compareCollapsedMarkers(found, sp.marker) < 0))
            { found = sp.marker; }
        } }
        return found
      }
      function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true) }
      function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false) }

      function collapsedSpanAround(line, ch) {
        var sps = sawCollapsedSpans && line.markedSpans, found;
        if (sps) { for (var i = 0; i < sps.length; ++i) {
          var sp = sps[i];
          if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) &&
              (!found || compareCollapsedMarkers(found, sp.marker) < 0)) { found = sp.marker; }
        } }
        return found
      }

      // Test whether there exists a collapsed span that partially
      // overlaps (covers the start or end, but not both) of a new span.
      // Such overlap is not allowed.
      function conflictingCollapsedRange(doc, lineNo$$1, from, to, marker) {
        var line = getLine(doc, lineNo$$1);
        var sps = sawCollapsedSpans && line.markedSpans;
        if (sps) { for (var i = 0; i < sps.length; ++i) {
          var sp = sps[i];
          if (!sp.marker.collapsed) { continue }
          var found = sp.marker.find(0);
          var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
          var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
          if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) { continue }
          if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) ||
              fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0))
            { return true }
        } }
      }

      // A visual line is a line as drawn on the screen. Folding, for
      // example, can cause multiple logical lines to appear on the same
      // visual line. This finds the start of the visual line that the
      // given line is part of (usually that is the line itself).
      function visualLine(line) {
        var merged;
        while (merged = collapsedSpanAtStart(line))
          { line = merged.find(-1, true).line; }
        return line
      }

      function visualLineEnd(line) {
        var merged;
        while (merged = collapsedSpanAtEnd(line))
          { line = merged.find(1, true).line; }
        return line
      }

      // Returns an array of logical lines that continue the visual line
      // started by the argument, or undefined if there are no such lines.
      function visualLineContinued(line) {
        var merged, lines;
        while (merged = collapsedSpanAtEnd(line)) {
          line = merged.find(1, true).line
          ;(lines || (lines = [])).push(line);
        }
        return lines
      }

      // Get the line number of the start of the visual line that the
      // given line number is part of.
      function visualLineNo(doc, lineN) {
        var line = getLine(doc, lineN), vis = visualLine(line);
        if (line == vis) { return lineN }
        return lineNo(vis)
      }

      // Get the line number of the start of the next visual line after
      // the given line.
      function visualLineEndNo(doc, lineN) {
        if (lineN > doc.lastLine()) { return lineN }
        var line = getLine(doc, lineN), merged;
        if (!lineIsHidden(doc, line)) { return lineN }
        while (merged = collapsedSpanAtEnd(line))
          { line = merged.find(1, true).line; }
        return lineNo(line) + 1
      }

      // Compute whether a line is hidden. Lines count as hidden when they
      // are part of a visual line that starts with another line, or when
      // they are entirely covered by collapsed, non-widget span.
      function lineIsHidden(doc, line) {
        var sps = sawCollapsedSpans && line.markedSpans;
        if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
          sp = sps[i];
          if (!sp.marker.collapsed) { continue }
          if (sp.from == null) { return true }
          if (sp.marker.widgetNode) { continue }
          if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
            { return true }
        } }
      }
      function lineIsHiddenInner(doc, line, span) {
        if (span.to == null) {
          var end = span.marker.find(1, true);
          return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker))
        }
        if (span.marker.inclusiveRight && span.to == line.text.length)
          { return true }
        for (var sp = (void 0), i = 0; i < line.markedSpans.length; ++i) {
          sp = line.markedSpans[i];
          if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
              (sp.to == null || sp.to != span.from) &&
              (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
              lineIsHiddenInner(doc, line, sp)) { return true }
        }
      }

      // Find the height above the given line.
      function heightAtLine(lineObj) {
        lineObj = visualLine(lineObj);

        var h = 0, chunk = lineObj.parent;
        for (var i = 0; i < chunk.lines.length; ++i) {
          var line = chunk.lines[i];
          if (line == lineObj) { break }
          else { h += line.height; }
        }
        for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
          for (var i$1 = 0; i$1 < p.children.length; ++i$1) {
            var cur = p.children[i$1];
            if (cur == chunk) { break }
            else { h += cur.height; }
          }
        }
        return h
      }

      // Compute the character length of a line, taking into account
      // collapsed ranges (see markText) that might hide parts, and join
      // other lines onto it.
      function lineLength(line) {
        if (line.height == 0) { return 0 }
        var len = line.text.length, merged, cur = line;
        while (merged = collapsedSpanAtStart(cur)) {
          var found = merged.find(0, true);
          cur = found.from.line;
          len += found.from.ch - found.to.ch;
        }
        cur = line;
        while (merged = collapsedSpanAtEnd(cur)) {
          var found$1 = merged.find(0, true);
          len -= cur.text.length - found$1.from.ch;
          cur = found$1.to.line;
          len += cur.text.length - found$1.to.ch;
        }
        return len
      }

      // Find the longest line in the document.
      function findMaxLine(cm) {
        var d = cm.display, doc = cm.doc;
        d.maxLine = getLine(doc, doc.first);
        d.maxLineLength = lineLength(d.maxLine);
        d.maxLineChanged = true;
        doc.iter(function (line) {
          var len = lineLength(line);
          if (len > d.maxLineLength) {
            d.maxLineLength = len;
            d.maxLine = line;
          }
        });
      }

      // LINE DATA STRUCTURE

      // Line objects. These hold state related to a line, including
      // highlighting info (the styles array).
      var Line = function(text, markedSpans, estimateHeight) {
        this.text = text;
        attachMarkedSpans(this, markedSpans);
        this.height = estimateHeight ? estimateHeight(this) : 1;
      };

      Line.prototype.lineNo = function () { return lineNo(this) };
      eventMixin(Line);

      // Change the content (text, markers) of a line. Automatically
      // invalidates cached information and tries to re-estimate the
      // line's height.
      function updateLine(line, text, markedSpans, estimateHeight) {
        line.text = text;
        if (line.stateAfter) { line.stateAfter = null; }
        if (line.styles) { line.styles = null; }
        if (line.order != null) { line.order = null; }
        detachMarkedSpans(line);
        attachMarkedSpans(line, markedSpans);
        var estHeight = estimateHeight ? estimateHeight(line) : 1;
        if (estHeight != line.height) { updateLineHeight(line, estHeight); }
      }

      // Detach a line from the document tree and its markers.
      function cleanUpLine(line) {
        line.parent = null;
        detachMarkedSpans(line);
      }

      // Convert a style as returned by a mode (either null, or a string
      // containing one or more styles) to a CSS style. This is cached,
      // and also looks for line-wide styles.
      var styleToClassCache = {}, styleToClassCacheWithMode = {};
      function interpretTokenStyle(style, options) {
        if (!style || /^\s*$/.test(style)) { return null }
        var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
        return cache[style] ||
          (cache[style] = style.replace(/\S+/g, "cm-$&"))
      }

      // Render the DOM representation of the text of a line. Also builds
      // up a 'line map', which points at the DOM nodes that represent
      // specific stretches of text, and is used by the measuring code.
      // The returned object contains the DOM node, this map, and
      // information about line-wide styles that were set by the mode.
      function buildLineContent(cm, lineView) {
        // The padding-right forces the element to have a 'border', which
        // is needed on Webkit to be able to get line-level bounding
        // rectangles for it (in measureChar).
        var content = eltP("span", null, null, webkit ? "padding-right: .1px" : null);
        var builder = {pre: eltP("pre", [content], "CodeMirror-line"), content: content,
                       col: 0, pos: 0, cm: cm,
                       trailingSpace: false,
                       splitSpaces: cm.getOption("lineWrapping")};
        lineView.measure = {};

        // Iterate over the logical lines that make up this visual line.
        for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
          var line = i ? lineView.rest[i - 1] : lineView.line, order = (void 0);
          builder.pos = 0;
          builder.addToken = buildToken;
          // Optionally wire in some hacks into the token-rendering
          // algorithm, to deal with browser quirks.
          if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction)))
            { builder.addToken = buildTokenBadBidi(builder.addToken, order); }
          builder.map = [];
          var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
          insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
          if (line.styleClasses) {
            if (line.styleClasses.bgClass)
              { builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || ""); }
            if (line.styleClasses.textClass)
              { builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || ""); }
          }

          // Ensure at least a single node is present, for measuring.
          if (builder.map.length == 0)
            { builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure))); }

          // Store the map and a cache object for the current logical line
          if (i == 0) {
            lineView.measure.map = builder.map;
            lineView.measure.cache = {};
          } else {
      (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map)
            ;(lineView.measure.caches || (lineView.measure.caches = [])).push({});
          }
        }

        // See issue #2901
        if (webkit) {
          var last = builder.content.lastChild;
          if (/\bcm-tab\b/.test(last.className) || (last.querySelector && last.querySelector(".cm-tab")))
            { builder.content.className = "cm-tab-wrap-hack"; }
        }

        signal(cm, "renderLine", cm, lineView.line, builder.pre);
        if (builder.pre.className)
          { builder.textClass = joinClasses(builder.pre.className, builder.textClass || ""); }

        return builder
      }

      function defaultSpecialCharPlaceholder(ch) {
        var token = elt("span", "\u2022", "cm-invalidchar");
        token.title = "\\u" + ch.charCodeAt(0).toString(16);
        token.setAttribute("aria-label", token.title);
        return token
      }

      // Build up the DOM representation for a single token, and add it to
      // the line map. Takes care to render special characters separately.
      function buildToken(builder, text, style, startStyle, endStyle, css, attributes) {
        if (!text) { return }
        var displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text;
        var special = builder.cm.state.specialChars, mustWrap = false;
        var content;
        if (!special.test(text)) {
          builder.col += text.length;
          content = document.createTextNode(displayText);
          builder.map.push(builder.pos, builder.pos + text.length, content);
          if (ie && ie_version < 9) { mustWrap = true; }
          builder.pos += text.length;
        } else {
          content = document.createDocumentFragment();
          var pos = 0;
          while (true) {
            special.lastIndex = pos;
            var m = special.exec(text);
            var skipped = m ? m.index - pos : text.length - pos;
            if (skipped) {
              var txt = document.createTextNode(displayText.slice(pos, pos + skipped));
              if (ie && ie_version < 9) { content.appendChild(elt("span", [txt])); }
              else { content.appendChild(txt); }
              builder.map.push(builder.pos, builder.pos + skipped, txt);
              builder.col += skipped;
              builder.pos += skipped;
            }
            if (!m) { break }
            pos += skipped + 1;
            var txt$1 = (void 0);
            if (m[0] == "\t") {
              var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
              txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
              txt$1.setAttribute("role", "presentation");
              txt$1.setAttribute("cm-text", "\t");
              builder.col += tabWidth;
            } else if (m[0] == "\r" || m[0] == "\n") {
              txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"));
              txt$1.setAttribute("cm-text", m[0]);
              builder.col += 1;
            } else {
              txt$1 = builder.cm.options.specialCharPlaceholder(m[0]);
              txt$1.setAttribute("cm-text", m[0]);
              if (ie && ie_version < 9) { content.appendChild(elt("span", [txt$1])); }
              else { content.appendChild(txt$1); }
              builder.col += 1;
            }
            builder.map.push(builder.pos, builder.pos + 1, txt$1);
            builder.pos++;
          }
        }
        builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32;
        if (style || startStyle || endStyle || mustWrap || css) {
          var fullStyle = style || "";
          if (startStyle) { fullStyle += startStyle; }
          if (endStyle) { fullStyle += endStyle; }
          var token = elt("span", [content], fullStyle, css);
          if (attributes) {
            for (var attr in attributes) { if (attributes.hasOwnProperty(attr) && attr != "style" && attr != "class")
              { token.setAttribute(attr, attributes[attr]); } }
          }
          return builder.content.appendChild(token)
        }
        builder.content.appendChild(content);
      }

      // Change some spaces to NBSP to prevent the browser from collapsing
      // trailing spaces at the end of a line when rendering text (issue #1362).
      function splitSpaces(text, trailingBefore) {
        if (text.length > 1 && !/  /.test(text)) { return text }
        var spaceBefore = trailingBefore, result = "";
        for (var i = 0; i < text.length; i++) {
          var ch = text.charAt(i);
          if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
            { ch = "\u00a0"; }
          result += ch;
          spaceBefore = ch == " ";
        }
        return result
      }

      // Work around nonsense dimensions being reported for stretches of
      // right-to-left text.
      function buildTokenBadBidi(inner, order) {
        return function (builder, text, style, startStyle, endStyle, css, attributes) {
          style = style ? style + " cm-force-border" : "cm-force-border";
          var start = builder.pos, end = start + text.length;
          for (;;) {
            // Find the part that overlaps with the start of this text
            var part = (void 0);
            for (var i = 0; i < order.length; i++) {
              part = order[i];
              if (part.to > start && part.from <= start) { break }
            }
            if (part.to >= end) { return inner(builder, text, style, startStyle, endStyle, css, attributes) }
            inner(builder, text.slice(0, part.to - start), style, startStyle, null, css, attributes);
            startStyle = null;
            text = text.slice(part.to - start);
            start = part.to;
          }
        }
      }

      function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
        var widget = !ignoreWidget && marker.widgetNode;
        if (widget) { builder.map.push(builder.pos, builder.pos + size, widget); }
        if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
          if (!widget)
            { widget = builder.content.appendChild(document.createElement("span")); }
          widget.setAttribute("cm-marker", marker.id);
        }
        if (widget) {
          builder.cm.display.input.setUneditable(widget);
          builder.content.appendChild(widget);
        }
        builder.pos += size;
        builder.trailingSpace = false;
      }

      // Outputs a number of spans to make up a line, taking highlighting
      // and marked text into account.
      function insertLineContent(line, builder, styles) {
        var spans = line.markedSpans, allText = line.text, at = 0;
        if (!spans) {
          for (var i$1 = 1; i$1 < styles.length; i$1+=2)
            { builder.addToken(builder, allText.slice(at, at = styles[i$1]), interpretTokenStyle(styles[i$1+1], builder.cm.options)); }
          return
        }

        var len = allText.length, pos = 0, i = 1, text = "", style, css;
        var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed, attributes;
        for (;;) {
          if (nextChange == pos) { // Update current marker set
            spanStyle = spanEndStyle = spanStartStyle = css = "";
            attributes = null;
            collapsed = null; nextChange = Infinity;
            var foundBookmarks = [], endStyles = (void 0);
            for (var j = 0; j < spans.length; ++j) {
              var sp = spans[j], m = sp.marker;
              if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
                foundBookmarks.push(m);
              } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
                if (sp.to != null && sp.to != pos && nextChange > sp.to) {
                  nextChange = sp.to;
                  spanEndStyle = "";
                }
                if (m.className) { spanStyle += " " + m.className; }
                if (m.css) { css = (css ? css + ";" : "") + m.css; }
                if (m.startStyle && sp.from == pos) { spanStartStyle += " " + m.startStyle; }
                if (m.endStyle && sp.to == nextChange) { (endStyles || (endStyles = [])).push(m.endStyle, sp.to); }
                // support for the old title property
                // https://github.com/codemirror/CodeMirror/pull/5673
                if (m.title) { (attributes || (attributes = {})).title = m.title; }
                if (m.attributes) {
                  for (var attr in m.attributes)
                    { (attributes || (attributes = {}))[attr] = m.attributes[attr]; }
                }
                if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
                  { collapsed = sp; }
              } else if (sp.from > pos && nextChange > sp.from) {
                nextChange = sp.from;
              }
            }
            if (endStyles) { for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2)
              { if (endStyles[j$1 + 1] == nextChange) { spanEndStyle += " " + endStyles[j$1]; } } }

            if (!collapsed || collapsed.from == pos) { for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2)
              { buildCollapsedSpan(builder, 0, foundBookmarks[j$2]); } }
            if (collapsed && (collapsed.from || 0) == pos) {
              buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
                                 collapsed.marker, collapsed.from == null);
              if (collapsed.to == null) { return }
              if (collapsed.to == pos) { collapsed = false; }
            }
          }
          if (pos >= len) { break }

          var upto = Math.min(len, nextChange);
          while (true) {
            if (text) {
              var end = pos + text.length;
              if (!collapsed) {
                var tokenText = end > upto ? text.slice(0, upto - pos) : text;
                builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                                 spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", css, attributes);
              }
              if (end >= upto) {text = text.slice(upto - pos); pos = upto; break}
              pos = end;
              spanStartStyle = "";
            }
            text = allText.slice(at, at = styles[i++]);
            style = interpretTokenStyle(styles[i++], builder.cm.options);
          }
        }
      }


      // These objects are used to represent the visible (currently drawn)
      // part of the document. A LineView may correspond to multiple
      // logical lines, if those are connected by collapsed ranges.
      function LineView(doc, line, lineN) {
        // The starting line
        this.line = line;
        // Continuing lines, if any
        this.rest = visualLineContinued(line);
        // Number of logical lines in this visual line
        this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
        this.node = this.text = null;
        this.hidden = lineIsHidden(doc, line);
      }

      // Create a range of LineView objects for the given lines.
      function buildViewArray(cm, from, to) {
        var array = [], nextPos;
        for (var pos = from; pos < to; pos = nextPos) {
          var view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
          nextPos = pos + view.size;
          array.push(view);
        }
        return array
      }

      var operationGroup = null;

      function pushOperation(op) {
        if (operationGroup) {
          operationGroup.ops.push(op);
        } else {
          op.ownsGroup = operationGroup = {
            ops: [op],
            delayedCallbacks: []
          };
        }
      }

      function fireCallbacksForOps(group) {
        // Calls delayed callbacks and cursorActivity handlers until no
        // new ones appear
        var callbacks = group.delayedCallbacks, i = 0;
        do {
          for (; i < callbacks.length; i++)
            { callbacks[i].call(null); }
          for (var j = 0; j < group.ops.length; j++) {
            var op = group.ops[j];
            if (op.cursorActivityHandlers)
              { while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
                { op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm); } }
          }
        } while (i < callbacks.length)
      }

      function finishOperation(op, endCb) {
        var group = op.ownsGroup;
        if (!group) { return }

        try { fireCallbacksForOps(group); }
        finally {
          operationGroup = null;
          endCb(group);
        }
      }

      var orphanDelayedCallbacks = null;

      // Often, we want to signal events at a point where we are in the
      // middle of some work, but don't want the handler to start calling
      // other methods on the editor, which might be in an inconsistent
      // state or simply not expect any other events to happen.
      // signalLater looks whether there are any handlers, and schedules
      // them to be executed when the last operation ends, or, if no
      // operation is active, when a timeout fires.
      function signalLater(emitter, type /*, values...*/) {
        var arr = getHandlers(emitter, type);
        if (!arr.length) { return }
        var args = Array.prototype.slice.call(arguments, 2), list;
        if (operationGroup) {
          list = operationGroup.delayedCallbacks;
        } else if (orphanDelayedCallbacks) {
          list = orphanDelayedCallbacks;
        } else {
          list = orphanDelayedCallbacks = [];
          setTimeout(fireOrphanDelayed, 0);
        }
        var loop = function ( i ) {
          list.push(function () { return arr[i].apply(null, args); });
        };

        for (var i = 0; i < arr.length; ++i)
          loop( i );
      }

      function fireOrphanDelayed() {
        var delayed = orphanDelayedCallbacks;
        orphanDelayedCallbacks = null;
        for (var i = 0; i < delayed.length; ++i) { delayed[i](); }
      }

      // When an aspect of a line changes, a string is added to
      // lineView.changes. This updates the relevant part of the line's
      // DOM structure.
      function updateLineForChanges(cm, lineView, lineN, dims) {
        for (var j = 0; j < lineView.changes.length; j++) {
          var type = lineView.changes[j];
          if (type == "text") { updateLineText(cm, lineView); }
          else if (type == "gutter") { updateLineGutter(cm, lineView, lineN, dims); }
          else if (type == "class") { updateLineClasses(cm, lineView); }
          else if (type == "widget") { updateLineWidgets(cm, lineView, dims); }
        }
        lineView.changes = null;
      }

      // Lines with gutter elements, widgets or a background class need to
      // be wrapped, and have the extra elements added to the wrapper div
      function ensureLineWrapped(lineView) {
        if (lineView.node == lineView.text) {
          lineView.node = elt("div", null, null, "position: relative");
          if (lineView.text.parentNode)
            { lineView.text.parentNode.replaceChild(lineView.node, lineView.text); }
          lineView.node.appendChild(lineView.text);
          if (ie && ie_version < 8) { lineView.node.style.zIndex = 2; }
        }
        return lineView.node
      }

      function updateLineBackground(cm, lineView) {
        var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
        if (cls) { cls += " CodeMirror-linebackground"; }
        if (lineView.background) {
          if (cls) { lineView.background.className = cls; }
          else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null; }
        } else if (cls) {
          var wrap = ensureLineWrapped(lineView);
          lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
          cm.display.input.setUneditable(lineView.background);
        }
      }

      // Wrapper around buildLineContent which will reuse the structure
      // in display.externalMeasured when possible.
      function getLineContent(cm, lineView) {
        var ext = cm.display.externalMeasured;
        if (ext && ext.line == lineView.line) {
          cm.display.externalMeasured = null;
          lineView.measure = ext.measure;
          return ext.built
        }
        return buildLineContent(cm, lineView)
      }

      // Redraw the line's text. Interacts with the background and text
      // classes because the mode may output tokens that influence these
      // classes.
      function updateLineText(cm, lineView) {
        var cls = lineView.text.className;
        var built = getLineContent(cm, lineView);
        if (lineView.text == lineView.node) { lineView.node = built.pre; }
        lineView.text.parentNode.replaceChild(built.pre, lineView.text);
        lineView.text = built.pre;
        if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
          lineView.bgClass = built.bgClass;
          lineView.textClass = built.textClass;
          updateLineClasses(cm, lineView);
        } else if (cls) {
          lineView.text.className = cls;
        }
      }

      function updateLineClasses(cm, lineView) {
        updateLineBackground(cm, lineView);
        if (lineView.line.wrapClass)
          { ensureLineWrapped(lineView).className = lineView.line.wrapClass; }
        else if (lineView.node != lineView.text)
          { lineView.node.className = ""; }
        var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
        lineView.text.className = textClass || "";
      }

      function updateLineGutter(cm, lineView, lineN, dims) {
        if (lineView.gutter) {
          lineView.node.removeChild(lineView.gutter);
          lineView.gutter = null;
        }
        if (lineView.gutterBackground) {
          lineView.node.removeChild(lineView.gutterBackground);
          lineView.gutterBackground = null;
        }
        if (lineView.line.gutterClass) {
          var wrap = ensureLineWrapped(lineView);
          lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
                                          ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + (dims.gutterTotalWidth) + "px"));
          cm.display.input.setUneditable(lineView.gutterBackground);
          wrap.insertBefore(lineView.gutterBackground, lineView.text);
        }
        var markers = lineView.line.gutterMarkers;
        if (cm.options.lineNumbers || markers) {
          var wrap$1 = ensureLineWrapped(lineView);
          var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px"));
          cm.display.input.setUneditable(gutterWrap);
          wrap$1.insertBefore(gutterWrap, lineView.text);
          if (lineView.line.gutterClass)
            { gutterWrap.className += " " + lineView.line.gutterClass; }
          if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
            { lineView.lineNumber = gutterWrap.appendChild(
              elt("div", lineNumberFor(cm.options, lineN),
                  "CodeMirror-linenumber CodeMirror-gutter-elt",
                  ("left: " + (dims.gutterLeft["CodeMirror-linenumbers"]) + "px; width: " + (cm.display.lineNumInnerWidth) + "px"))); }
          if (markers) { for (var k = 0; k < cm.display.gutterSpecs.length; ++k) {
            var id = cm.display.gutterSpecs[k].className, found = markers.hasOwnProperty(id) && markers[id];
            if (found)
              { gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt",
                                         ("left: " + (dims.gutterLeft[id]) + "px; width: " + (dims.gutterWidth[id]) + "px"))); }
          } }
        }
      }

      function updateLineWidgets(cm, lineView, dims) {
        if (lineView.alignable) { lineView.alignable = null; }
        var isWidget = classTest("CodeMirror-linewidget");
        for (var node = lineView.node.firstChild, next = (void 0); node; node = next) {
          next = node.nextSibling;
          if (isWidget.test(node.className)) { lineView.node.removeChild(node); }
        }
        insertLineWidgets(cm, lineView, dims);
      }

      // Build a line's DOM representation from scratch
      function buildLineElement(cm, lineView, lineN, dims) {
        var built = getLineContent(cm, lineView);
        lineView.text = lineView.node = built.pre;
        if (built.bgClass) { lineView.bgClass = built.bgClass; }
        if (built.textClass) { lineView.textClass = built.textClass; }

        updateLineClasses(cm, lineView);
        updateLineGutter(cm, lineView, lineN, dims);
        insertLineWidgets(cm, lineView, dims);
        return lineView.node
      }

      // A lineView may contain multiple logical lines (when merged by
      // collapsed spans). The widgets for all of them need to be drawn.
      function insertLineWidgets(cm, lineView, dims) {
        insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
        if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
          { insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false); } }
      }

      function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
        if (!line.widgets) { return }
        var wrap = ensureLineWrapped(lineView);
        for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
          var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget" + (widget.className ? " " + widget.className : ""));
          if (!widget.handleMouseEvents) { node.setAttribute("cm-ignore-events", "true"); }
          positionLineWidget(widget, node, lineView, dims);
          cm.display.input.setUneditable(node);
          if (allowAbove && widget.above)
            { wrap.insertBefore(node, lineView.gutter || lineView.text); }
          else
            { wrap.appendChild(node); }
          signalLater(widget, "redraw");
        }
      }

      function positionLineWidget(widget, node, lineView, dims) {
        if (widget.noHScroll) {
      (lineView.alignable || (lineView.alignable = [])).push(node);
          var width = dims.wrapperWidth;
          node.style.left = dims.fixedPos + "px";
          if (!widget.coverGutter) {
            width -= dims.gutterTotalWidth;
            node.style.paddingLeft = dims.gutterTotalWidth + "px";
          }
          node.style.width = width + "px";
        }
        if (widget.coverGutter) {
          node.style.zIndex = 5;
          node.style.position = "relative";
          if (!widget.noHScroll) { node.style.marginLeft = -dims.gutterTotalWidth + "px"; }
        }
      }

      function widgetHeight(widget) {
        if (widget.height != null) { return widget.height }
        var cm = widget.doc.cm;
        if (!cm) { return 0 }
        if (!contains(document.body, widget.node)) {
          var parentStyle = "position: relative;";
          if (widget.coverGutter)
            { parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;"; }
          if (widget.noHScroll)
            { parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;"; }
          removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
        }
        return widget.height = widget.node.parentNode.offsetHeight
      }

      // Return true when the given mouse event happened in a widget
      function eventInWidget(display, e) {
        for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
          if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
              (n.parentNode == display.sizer && n != display.mover))
            { return true }
        }
      }

      // POSITION MEASUREMENT

      function paddingTop(display) {return display.lineSpace.offsetTop}
      function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
      function paddingH(display) {
        if (display.cachedPaddingH) { return display.cachedPaddingH }
        var e = removeChildrenAndAdd(display.measure, elt("pre", "x", "CodeMirror-line-like"));
        var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
        var data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)};
        if (!isNaN(data.left) && !isNaN(data.right)) { display.cachedPaddingH = data; }
        return data
      }

      function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
      function displayWidth(cm) {
        return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
      }
      function displayHeight(cm) {
        return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
      }

      // Ensure the lineView.wrapping.heights array is populated. This is
      // an array of bottom offsets for the lines that make up a drawn
      // line. When lineWrapping is on, there might be more than one
      // height.
      function ensureLineHeights(cm, lineView, rect) {
        var wrapping = cm.options.lineWrapping;
        var curWidth = wrapping && displayWidth(cm);
        if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
          var heights = lineView.measure.heights = [];
          if (wrapping) {
            lineView.measure.width = curWidth;
            var rects = lineView.text.firstChild.getClientRects();
            for (var i = 0; i < rects.length - 1; i++) {
              var cur = rects[i], next = rects[i + 1];
              if (Math.abs(cur.bottom - next.bottom) > 2)
                { heights.push((cur.bottom + next.top) / 2 - rect.top); }
            }
          }
          heights.push(rect.bottom - rect.top);
        }
      }

      // Find a line map (mapping character offsets to text nodes) and a
      // measurement cache for the given line number. (A line view might
      // contain multiple lines when collapsed ranges are present.)
      function mapFromLineView(lineView, line, lineN) {
        if (lineView.line == line)
          { return {map: lineView.measure.map, cache: lineView.measure.cache} }
        for (var i = 0; i < lineView.rest.length; i++)
          { if (lineView.rest[i] == line)
            { return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]} } }
        for (var i$1 = 0; i$1 < lineView.rest.length; i$1++)
          { if (lineNo(lineView.rest[i$1]) > lineN)
            { return {map: lineView.measure.maps[i$1], cache: lineView.measure.caches[i$1], before: true} } }
      }

      // Render a line into the hidden node display.externalMeasured. Used
      // when measurement is needed for a line that's not in the viewport.
      function updateExternalMeasurement(cm, line) {
        line = visualLine(line);
        var lineN = lineNo(line);
        var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
        view.lineN = lineN;
        var built = view.built = buildLineContent(cm, view);
        view.text = built.pre;
        removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
        return view
      }

      // Get a {top, bottom, left, right} box (in line-local coordinates)
      // for a given character.
      function measureChar(cm, line, ch, bias) {
        return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
      }

      // Find a line view that corresponds to the given line number.
      function findViewForLine(cm, lineN) {
        if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
          { return cm.display.view[findViewIndex(cm, lineN)] }
        var ext = cm.display.externalMeasured;
        if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
          { return ext }
      }

      // Measurement can be split in two steps, the set-up work that
      // applies to the whole line, and the measurement of the actual
      // character. Functions like coordsChar, that need to do a lot of
      // measurements in a row, can thus ensure that the set-up work is
      // only done once.
      function prepareMeasureForLine(cm, line) {
        var lineN = lineNo(line);
        var view = findViewForLine(cm, lineN);
        if (view && !view.text) {
          view = null;
        } else if (view && view.changes) {
          updateLineForChanges(cm, view, lineN, getDimensions(cm));
          cm.curOp.forceUpdate = true;
        }
        if (!view)
          { view = updateExternalMeasurement(cm, line); }

        var info = mapFromLineView(view, line, lineN);
        return {
          line: line, view: view, rect: null,
          map: info.map, cache: info.cache, before: info.before,
          hasHeights: false
        }
      }

      // Given a prepared measurement object, measures the position of an
      // actual character (or fetches it from the cache).
      function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
        if (prepared.before) { ch = -1; }
        var key = ch + (bias || ""), found;
        if (prepared.cache.hasOwnProperty(key)) {
          found = prepared.cache[key];
        } else {
          if (!prepared.rect)
            { prepared.rect = prepared.view.text.getBoundingClientRect(); }
          if (!prepared.hasHeights) {
            ensureLineHeights(cm, prepared.view, prepared.rect);
            prepared.hasHeights = true;
          }
          found = measureCharInner(cm, prepared, ch, bias);
          if (!found.bogus) { prepared.cache[key] = found; }
        }
        return {left: found.left, right: found.right,
                top: varHeight ? found.rtop : found.top,
                bottom: varHeight ? found.rbottom : found.bottom}
      }

      var nullRect = {left: 0, right: 0, top: 0, bottom: 0};

      function nodeAndOffsetInLineMap(map$$1, ch, bias) {
        var node, start, end, collapse, mStart, mEnd;
        // First, search the line map for the text node corresponding to,
        // or closest to, the target character.
        for (var i = 0; i < map$$1.length; i += 3) {
          mStart = map$$1[i];
          mEnd = map$$1[i + 1];
          if (ch < mStart) {
            start = 0; end = 1;
            collapse = "left";
          } else if (ch < mEnd) {
            start = ch - mStart;
            end = start + 1;
          } else if (i == map$$1.length - 3 || ch == mEnd && map$$1[i + 3] > ch) {
            end = mEnd - mStart;
            start = end - 1;
            if (ch >= mEnd) { collapse = "right"; }
          }
          if (start != null) {
            node = map$$1[i + 2];
            if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
              { collapse = bias; }
            if (bias == "left" && start == 0)
              { while (i && map$$1[i - 2] == map$$1[i - 3] && map$$1[i - 1].insertLeft) {
                node = map$$1[(i -= 3) + 2];
                collapse = "left";
              } }
            if (bias == "right" && start == mEnd - mStart)
              { while (i < map$$1.length - 3 && map$$1[i + 3] == map$$1[i + 4] && !map$$1[i + 5].insertLeft) {
                node = map$$1[(i += 3) + 2];
                collapse = "right";
              } }
            break
          }
        }
        return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
      }

      function getUsefulRect(rects, bias) {
        var rect = nullRect;
        if (bias == "left") { for (var i = 0; i < rects.length; i++) {
          if ((rect = rects[i]).left != rect.right) { break }
        } } else { for (var i$1 = rects.length - 1; i$1 >= 0; i$1--) {
          if ((rect = rects[i$1]).left != rect.right) { break }
        } }
        return rect
      }

      function measureCharInner(cm, prepared, ch, bias) {
        var place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
        var node = place.node, start = place.start, end = place.end, collapse = place.collapse;

        var rect;
        if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
          for (var i$1 = 0; i$1 < 4; i$1++) { // Retry a maximum of 4 times when nonsense rectangles are returned
            while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) { --start; }
            while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) { ++end; }
            if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
              { rect = node.parentNode.getBoundingClientRect(); }
            else
              { rect = getUsefulRect(range(node, start, end).getClientRects(), bias); }
            if (rect.left || rect.right || start == 0) { break }
            end = start;
            start = start - 1;
            collapse = "right";
          }
          if (ie && ie_version < 11) { rect = maybeUpdateRectForZooming(cm.display.measure, rect); }
        } else { // If it is a widget, simply get the box for the whole widget.
          if (start > 0) { collapse = bias = "right"; }
          var rects;
          if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
            { rect = rects[bias == "right" ? rects.length - 1 : 0]; }
          else
            { rect = node.getBoundingClientRect(); }
        }
        if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
          var rSpan = node.parentNode.getClientRects()[0];
          if (rSpan)
            { rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom}; }
          else
            { rect = nullRect; }
        }

        var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
        var mid = (rtop + rbot) / 2;
        var heights = prepared.view.measure.heights;
        var i = 0;
        for (; i < heights.length - 1; i++)
          { if (mid < heights[i]) { break } }
        var top = i ? heights[i - 1] : 0, bot = heights[i];
        var result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                      right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                      top: top, bottom: bot};
        if (!rect.left && !rect.right) { result.bogus = true; }
        if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot; }

        return result
      }

      // Work around problem with bounding client rects on ranges being
      // returned incorrectly when zoomed on IE10 and below.
      function maybeUpdateRectForZooming(measure, rect) {
        if (!window.screen || screen.logicalXDPI == null ||
            screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
          { return rect }
        var scaleX = screen.logicalXDPI / screen.deviceXDPI;
        var scaleY = screen.logicalYDPI / screen.deviceYDPI;
        return {left: rect.left * scaleX, right: rect.right * scaleX,
                top: rect.top * scaleY, bottom: rect.bottom * scaleY}
      }

      function clearLineMeasurementCacheFor(lineView) {
        if (lineView.measure) {
          lineView.measure.cache = {};
          lineView.measure.heights = null;
          if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
            { lineView.measure.caches[i] = {}; } }
        }
      }

      function clearLineMeasurementCache(cm) {
        cm.display.externalMeasure = null;
        removeChildren(cm.display.lineMeasure);
        for (var i = 0; i < cm.display.view.length; i++)
          { clearLineMeasurementCacheFor(cm.display.view[i]); }
      }

      function clearCaches(cm) {
        clearLineMeasurementCache(cm);
        cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
        if (!cm.options.lineWrapping) { cm.display.maxLineChanged = true; }
        cm.display.lineNumChars = null;
      }

      function pageScrollX() {
        // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
        // which causes page_Offset and bounding client rects to use
        // different reference viewports and invalidate our calculations.
        if (chrome && android) { return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft)) }
        return window.pageXOffset || (document.documentElement || document.body).scrollLeft
      }
      function pageScrollY() {
        if (chrome && android) { return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop)) }
        return window.pageYOffset || (document.documentElement || document.body).scrollTop
      }

      function widgetTopHeight(lineObj) {
        var height = 0;
        if (lineObj.widgets) { for (var i = 0; i < lineObj.widgets.length; ++i) { if (lineObj.widgets[i].above)
          { height += widgetHeight(lineObj.widgets[i]); } } }
        return height
      }

      // Converts a {top, bottom, left, right} box from line-local
      // coordinates into another coordinate system. Context may be one of
      // "line", "div" (display.lineDiv), "local"./null (editor), "window",
      // or "page".
      function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
        if (!includeWidgets) {
          var height = widgetTopHeight(lineObj);
          rect.top += height; rect.bottom += height;
        }
        if (context == "line") { return rect }
        if (!context) { context = "local"; }
        var yOff = heightAtLine(lineObj);
        if (context == "local") { yOff += paddingTop(cm.display); }
        else { yOff -= cm.display.viewOffset; }
        if (context == "page" || context == "window") {
          var lOff = cm.display.lineSpace.getBoundingClientRect();
          yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
          var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
          rect.left += xOff; rect.right += xOff;
        }
        rect.top += yOff; rect.bottom += yOff;
        return rect
      }

      // Coverts a box from "div" coords to another coordinate system.
      // Context may be "window", "page", "div", or "local"./null.
      function fromCoordSystem(cm, coords, context) {
        if (context == "div") { return coords }
        var left = coords.left, top = coords.top;
        // First move into "page" coordinate system
        if (context == "page") {
          left -= pageScrollX();
          top -= pageScrollY();
        } else if (context == "local" || !context) {
          var localBox = cm.display.sizer.getBoundingClientRect();
          left += localBox.left;
          top += localBox.top;
        }

        var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
        return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
      }

      function charCoords(cm, pos, context, lineObj, bias) {
        if (!lineObj) { lineObj = getLine(cm.doc, pos.line); }
        return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
      }

      // Returns a box for a given cursor position, which may have an
      // 'other' property containing the position of the secondary cursor
      // on a bidi boundary.
      // A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
      // and after `char - 1` in writing order of `char - 1`
      // A cursor Pos(line, char, "after") is on the same visual line as `char`
      // and before `char` in writing order of `char`
      // Examples (upper-case letters are RTL, lower-case are LTR):
      //     Pos(0, 1, ...)
      //     before   after
      // ab     a|b     a|b
      // aB     a|B     aB|
      // Ab     |Ab     A|b
      // AB     B|A     B|A
      // Every position after the last character on a line is considered to stick
      // to the last character on the line.
      function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
        lineObj = lineObj || getLine(cm.doc, pos.line);
        if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj); }
        function get(ch, right) {
          var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
          if (right) { m.left = m.right; } else { m.right = m.left; }
          return intoCoordSystem(cm, lineObj, m, context)
        }
        var order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
        if (ch >= lineObj.text.length) {
          ch = lineObj.text.length;
          sticky = "before";
        } else if (ch <= 0) {
          ch = 0;
          sticky = "after";
        }
        if (!order) { return get(sticky == "before" ? ch - 1 : ch, sticky == "before") }

        function getBidi(ch, partPos, invert) {
          var part = order[partPos], right = part.level == 1;
          return get(invert ? ch - 1 : ch, right != invert)
        }
        var partPos = getBidiPartAt(order, ch, sticky);
        var other = bidiOther;
        var val = getBidi(ch, partPos, sticky == "before");
        if (other != null) { val.other = getBidi(ch, other, sticky != "before"); }
        return val
      }

      // Used to cheaply estimate the coordinates for a position. Used for
      // intermediate scroll updates.
      function estimateCoords(cm, pos) {
        var left = 0;
        pos = clipPos(cm.doc, pos);
        if (!cm.options.lineWrapping) { left = charWidth(cm.display) * pos.ch; }
        var lineObj = getLine(cm.doc, pos.line);
        var top = heightAtLine(lineObj) + paddingTop(cm.display);
        return {left: left, right: left, top: top, bottom: top + lineObj.height}
      }

      // Positions returned by coordsChar contain some extra information.
      // xRel is the relative x position of the input coordinates compared
      // to the found position (so xRel > 0 means the coordinates are to
      // the right of the character position, for example). When outside
      // is true, that means the coordinates lie outside the line's
      // vertical range.
      function PosWithInfo(line, ch, sticky, outside, xRel) {
        var pos = Pos(line, ch, sticky);
        pos.xRel = xRel;
        if (outside) { pos.outside = outside; }
        return pos
      }

      // Compute the character position closest to the given coordinates.
      // Input must be lineSpace-local ("div" coordinate system).
      function coordsChar(cm, x, y) {
        var doc = cm.doc;
        y += cm.display.viewOffset;
        if (y < 0) { return PosWithInfo(doc.first, 0, null, -1, -1) }
        var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
        if (lineN > last)
          { return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, 1, 1) }
        if (x < 0) { x = 0; }

        var lineObj = getLine(doc, lineN);
        for (;;) {
          var found = coordsCharInner(cm, lineObj, lineN, x, y);
          var collapsed = collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 || found.outside > 0 ? 1 : 0));
          if (!collapsed) { return found }
          var rangeEnd = collapsed.find(1);
          if (rangeEnd.line == lineN) { return rangeEnd }
          lineObj = getLine(doc, lineN = rangeEnd.line);
        }
      }

      function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
        y -= widgetTopHeight(lineObj);
        var end = lineObj.text.length;
        var begin = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y; }, end, 0);
        end = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch).top > y; }, begin, end);
        return {begin: begin, end: end}
      }

      function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
        if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj); }
        var targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
        return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop)
      }

      // Returns true if the given side of a box is after the given
      // coordinates, in top-to-bottom, left-to-right order.
      function boxIsAfter(box, x, y, left) {
        return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x
      }

      function coordsCharInner(cm, lineObj, lineNo$$1, x, y) {
        // Move y into line-local coordinate space
        y -= heightAtLine(lineObj);
        var preparedMeasure = prepareMeasureForLine(cm, lineObj);
        // When directly calling `measureCharPrepared`, we have to adjust
        // for the widgets at this line.
        var widgetHeight$$1 = widgetTopHeight(lineObj);
        var begin = 0, end = lineObj.text.length, ltr = true;

        var order = getOrder(lineObj, cm.doc.direction);
        // If the line isn't plain left-to-right text, first figure out
        // which bidi section the coordinates fall into.
        if (order) {
          var part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)
                       (cm, lineObj, lineNo$$1, preparedMeasure, order, x, y);
          ltr = part.level != 1;
          // The awkward -1 offsets are needed because findFirst (called
          // on these below) will treat its first bound as inclusive,
          // second as exclusive, but we want to actually address the
          // characters in the part's range
          begin = ltr ? part.from : part.to - 1;
          end = ltr ? part.to : part.from - 1;
        }

        // A binary search to find the first character whose bounding box
        // starts after the coordinates. If we run across any whose box wrap
        // the coordinates, store that.
        var chAround = null, boxAround = null;
        var ch = findFirst(function (ch) {
          var box = measureCharPrepared(cm, preparedMeasure, ch);
          box.top += widgetHeight$$1; box.bottom += widgetHeight$$1;
          if (!boxIsAfter(box, x, y, false)) { return false }
          if (box.top <= y && box.left <= x) {
            chAround = ch;
            boxAround = box;
          }
          return true
        }, begin, end);

        var baseX, sticky, outside = false;
        // If a box around the coordinates was found, use that
        if (boxAround) {
          // Distinguish coordinates nearer to the left or right side of the box
          var atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
          ch = chAround + (atStart ? 0 : 1);
          sticky = atStart ? "after" : "before";
          baseX = atLeft ? boxAround.left : boxAround.right;
        } else {
          // (Adjust for extended bound, if necessary.)
          if (!ltr && (ch == end || ch == begin)) { ch++; }
          // To determine which side to associate with, get the box to the
          // left of the character and compare it's vertical position to the
          // coordinates
          sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" :
            (measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight$$1 <= y) == ltr ?
            "after" : "before";
          // Now get accurate coordinates for this place, in order to get a
          // base X position
          var coords = cursorCoords(cm, Pos(lineNo$$1, ch, sticky), "line", lineObj, preparedMeasure);
          baseX = coords.left;
          outside = y < coords.top ? -1 : y >= coords.bottom ? 1 : 0;
        }

        ch = skipExtendingChars(lineObj.text, ch, 1);
        return PosWithInfo(lineNo$$1, ch, sticky, outside, x - baseX)
      }

      function coordsBidiPart(cm, lineObj, lineNo$$1, preparedMeasure, order, x, y) {
        // Bidi parts are sorted left-to-right, and in a non-line-wrapping
        // situation, we can take this ordering to correspond to the visual
        // ordering. This finds the first part whose end is after the given
        // coordinates.
        var index = findFirst(function (i) {
          var part = order[i], ltr = part.level != 1;
          return boxIsAfter(cursorCoords(cm, Pos(lineNo$$1, ltr ? part.to : part.from, ltr ? "before" : "after"),
                                         "line", lineObj, preparedMeasure), x, y, true)
        }, 0, order.length - 1);
        var part = order[index];
        // If this isn't the first part, the part's start is also after
        // the coordinates, and the coordinates aren't on the same line as
        // that start, move one part back.
        if (index > 0) {
          var ltr = part.level != 1;
          var start = cursorCoords(cm, Pos(lineNo$$1, ltr ? part.from : part.to, ltr ? "after" : "before"),
                                   "line", lineObj, preparedMeasure);
          if (boxIsAfter(start, x, y, true) && start.top > y)
            { part = order[index - 1]; }
        }
        return part
      }

      function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
        // In a wrapped line, rtl text on wrapping boundaries can do things
        // that don't correspond to the ordering in our `order` array at
        // all, so a binary search doesn't work, and we want to return a
        // part that only spans one line so that the binary search in
        // coordsCharInner is safe. As such, we first find the extent of the
        // wrapped line, and then do a flat search in which we discard any
        // spans that aren't on the line.
        var ref = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
        var begin = ref.begin;
        var end = ref.end;
        if (/\s/.test(lineObj.text.charAt(end - 1))) { end--; }
        var part = null, closestDist = null;
        for (var i = 0; i < order.length; i++) {
          var p = order[i];
          if (p.from >= end || p.to <= begin) { continue }
          var ltr = p.level != 1;
          var endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
          // Weigh against spans ending before this, so that they are only
          // picked if nothing ends after
          var dist = endX < x ? x - endX + 1e9 : endX - x;
          if (!part || closestDist > dist) {
            part = p;
            closestDist = dist;
          }
        }
        if (!part) { part = order[order.length - 1]; }
        // Clip the part to the wrapped line.
        if (part.from < begin) { part = {from: begin, to: part.to, level: part.level}; }
        if (part.to > end) { part = {from: part.from, to: end, level: part.level}; }
        return part
      }

      var measureText;
      // Compute the default text height.
      function textHeight(display) {
        if (display.cachedTextHeight != null) { return display.cachedTextHeight }
        if (measureText == null) {
          measureText = elt("pre", null, "CodeMirror-line-like");
          // Measure a bunch of lines, for browsers that compute
          // fractional heights.
          for (var i = 0; i < 49; ++i) {
            measureText.appendChild(document.createTextNode("x"));
            measureText.appendChild(elt("br"));
          }
          measureText.appendChild(document.createTextNode("x"));
        }
        removeChildrenAndAdd(display.measure, measureText);
        var height = measureText.offsetHeight / 50;
        if (height > 3) { display.cachedTextHeight = height; }
        removeChildren(display.measure);
        return height || 1
      }

      // Compute the default character width.
      function charWidth(display) {
        if (display.cachedCharWidth != null) { return display.cachedCharWidth }
        var anchor = elt("span", "xxxxxxxxxx");
        var pre = elt("pre", [anchor], "CodeMirror-line-like");
        removeChildrenAndAdd(display.measure, pre);
        var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
        if (width > 2) { display.cachedCharWidth = width; }
        return width || 10
      }

      // Do a bulk-read of the DOM positions and sizes needed to draw the
      // view, so that we don't interleave reading and writing to the DOM.
      function getDimensions(cm) {
        var d = cm.display, left = {}, width = {};
        var gutterLeft = d.gutters.clientLeft;
        for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
          var id = cm.display.gutterSpecs[i].className;
          left[id] = n.offsetLeft + n.clientLeft + gutterLeft;
          width[id] = n.clientWidth;
        }
        return {fixedPos: compensateForHScroll(d),
                gutterTotalWidth: d.gutters.offsetWidth,
                gutterLeft: left,
                gutterWidth: width,
                wrapperWidth: d.wrapper.clientWidth}
      }

      // Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
      // but using getBoundingClientRect to get a sub-pixel-accurate
      // result.
      function compensateForHScroll(display) {
        return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
      }

      // Returns a function that estimates the height of a line, to use as
      // first approximation until the line becomes visible (and is thus
      // properly measurable).
      function estimateHeight(cm) {
        var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
        var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
        return function (line) {
          if (lineIsHidden(cm.doc, line)) { return 0 }

          var widgetsHeight = 0;
          if (line.widgets) { for (var i = 0; i < line.widgets.length; i++) {
            if (line.widgets[i].height) { widgetsHeight += line.widgets[i].height; }
          } }

          if (wrapping)
            { return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th }
          else
            { return widgetsHeight + th }
        }
      }

      function estimateLineHeights(cm) {
        var doc = cm.doc, est = estimateHeight(cm);
        doc.iter(function (line) {
          var estHeight = est(line);
          if (estHeight != line.height) { updateLineHeight(line, estHeight); }
        });
      }

      // Given a mouse event, find the corresponding position. If liberal
      // is false, it checks whether a gutter or scrollbar was clicked,
      // and returns null if it was. forRect is used by rectangular
      // selections, and tries to estimate a character position even for
      // coordinates beyond the right of the text.
      function posFromMouse(cm, e, liberal, forRect) {
        var display = cm.display;
        if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") { return null }

        var x, y, space = display.lineSpace.getBoundingClientRect();
        // Fails unpredictably on IE[67] when mouse is dragged around quickly.
        try { x = e.clientX - space.left; y = e.clientY - space.top; }
        catch (e) { return null }
        var coords = coordsChar(cm, x, y), line;
        if (forRect && coords.xRel > 0 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
          var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
          coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
        }
        return coords
      }

      // Find the view element corresponding to a given line. Return null
      // when the line isn't visible.
      function findViewIndex(cm, n) {
        if (n >= cm.display.viewTo) { return null }
        n -= cm.display.viewFrom;
        if (n < 0) { return null }
        var view = cm.display.view;
        for (var i = 0; i < view.length; i++) {
          n -= view[i].size;
          if (n < 0) { return i }
        }
      }

      // Updates the display.view data structure for a given change to the
      // document. From and to are in pre-change coordinates. Lendiff is
      // the amount of lines added or subtracted by the change. This is
      // used for changes that span multiple lines, or change the way
      // lines are divided into visual lines. regLineChange (below)
      // registers single-line changes.
      function regChange(cm, from, to, lendiff) {
        if (from == null) { from = cm.doc.first; }
        if (to == null) { to = cm.doc.first + cm.doc.size; }
        if (!lendiff) { lendiff = 0; }

        var display = cm.display;
        if (lendiff && to < display.viewTo &&
            (display.updateLineNumbers == null || display.updateLineNumbers > from))
          { display.updateLineNumbers = from; }

        cm.curOp.viewChanged = true;

        if (from >= display.viewTo) { // Change after
          if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
            { resetView(cm); }
        } else if (to <= display.viewFrom) { // Change before
          if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
            resetView(cm);
          } else {
            display.viewFrom += lendiff;
            display.viewTo += lendiff;
          }
        } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
          resetView(cm);
        } else if (from <= display.viewFrom) { // Top overlap
          var cut = viewCuttingPoint(cm, to, to + lendiff, 1);
          if (cut) {
            display.view = display.view.slice(cut.index);
            display.viewFrom = cut.lineN;
            display.viewTo += lendiff;
          } else {
            resetView(cm);
          }
        } else if (to >= display.viewTo) { // Bottom overlap
          var cut$1 = viewCuttingPoint(cm, from, from, -1);
          if (cut$1) {
            display.view = display.view.slice(0, cut$1.index);
            display.viewTo = cut$1.lineN;
          } else {
            resetView(cm);
          }
        } else { // Gap in the middle
          var cutTop = viewCuttingPoint(cm, from, from, -1);
          var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
          if (cutTop && cutBot) {
            display.view = display.view.slice(0, cutTop.index)
              .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
              .concat(display.view.slice(cutBot.index));
            display.viewTo += lendiff;
          } else {
            resetView(cm);
          }
        }

        var ext = display.externalMeasured;
        if (ext) {
          if (to < ext.lineN)
            { ext.lineN += lendiff; }
          else if (from < ext.lineN + ext.size)
            { display.externalMeasured = null; }
        }
      }

      // Register a change to a single line. Type must be one of "text",
      // "gutter", "class", "widget"
      function regLineChange(cm, line, type) {
        cm.curOp.viewChanged = true;
        var display = cm.display, ext = cm.display.externalMeasured;
        if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
          { display.externalMeasured = null; }

        if (line < display.viewFrom || line >= display.viewTo) { return }
        var lineView = display.view[findViewIndex(cm, line)];
        if (lineView.node == null) { return }
        var arr = lineView.changes || (lineView.changes = []);
        if (indexOf(arr, type) == -1) { arr.push(type); }
      }

      // Clear the view.
      function resetView(cm) {
        cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
        cm.display.view = [];
        cm.display.viewOffset = 0;
      }

      function viewCuttingPoint(cm, oldN, newN, dir) {
        var index = findViewIndex(cm, oldN), diff, view = cm.display.view;
        if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
          { return {index: index, lineN: newN} }
        var n = cm.display.viewFrom;
        for (var i = 0; i < index; i++)
          { n += view[i].size; }
        if (n != oldN) {
          if (dir > 0) {
            if (index == view.length - 1) { return null }
            diff = (n + view[index].size) - oldN;
            index++;
          } else {
            diff = n - oldN;
          }
          oldN += diff; newN += diff;
        }
        while (visualLineNo(cm.doc, newN) != newN) {
          if (index == (dir < 0 ? 0 : view.length - 1)) { return null }
          newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
          index += dir;
        }
        return {index: index, lineN: newN}
      }

      // Force the view to cover a given range, adding empty view element
      // or clipping off existing ones as needed.
      function adjustView(cm, from, to) {
        var display = cm.display, view = display.view;
        if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
          display.view = buildViewArray(cm, from, to);
          display.viewFrom = from;
        } else {
          if (display.viewFrom > from)
            { display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view); }
          else if (display.viewFrom < from)
            { display.view = display.view.slice(findViewIndex(cm, from)); }
          display.viewFrom = from;
          if (display.viewTo < to)
            { display.view = display.view.concat(buildViewArray(cm, display.viewTo, to)); }
          else if (display.viewTo > to)
            { display.view = display.view.slice(0, findViewIndex(cm, to)); }
        }
        display.viewTo = to;
      }

      // Count the number of lines in the view whose DOM representation is
      // out of date (or nonexistent).
      function countDirtyView(cm) {
        var view = cm.display.view, dirty = 0;
        for (var i = 0; i < view.length; i++) {
          var lineView = view[i];
          if (!lineView.hidden && (!lineView.node || lineView.changes)) { ++dirty; }
        }
        return dirty
      }

      function updateSelection(cm) {
        cm.display.input.showSelection(cm.display.input.prepareSelection());
      }

      function prepareSelection(cm, primary) {
        if ( primary === void 0 ) primary = true;

        var doc = cm.doc, result = {};
        var curFragment = result.cursors = document.createDocumentFragment();
        var selFragment = result.selection = document.createDocumentFragment();

        for (var i = 0; i < doc.sel.ranges.length; i++) {
          if (!primary && i == doc.sel.primIndex) { continue }
          var range$$1 = doc.sel.ranges[i];
          if (range$$1.from().line >= cm.display.viewTo || range$$1.to().line < cm.display.viewFrom) { continue }
          var collapsed = range$$1.empty();
          if (collapsed || cm.options.showCursorWhenSelecting)
            { drawSelectionCursor(cm, range$$1.head, curFragment); }
          if (!collapsed)
            { drawSelectionRange(cm, range$$1, selFragment); }
        }
        return result
      }

      // Draws a cursor for the given range
      function drawSelectionCursor(cm, head, output) {
        var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);

        var cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"));
        cursor.style.left = pos.left + "px";
        cursor.style.top = pos.top + "px";
        cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";

        if (pos.other) {
          // Secondary cursor, shown when on a 'jump' in bi-directional text
          var otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
          otherCursor.style.display = "";
          otherCursor.style.left = pos.other.left + "px";
          otherCursor.style.top = pos.other.top + "px";
          otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
        }
      }

      function cmpCoords(a, b) { return a.top - b.top || a.left - b.left }

      // Draws the given range as a highlighted selection
      function drawSelectionRange(cm, range$$1, output) {
        var display = cm.display, doc = cm.doc;
        var fragment = document.createDocumentFragment();
        var padding = paddingH(cm.display), leftSide = padding.left;
        var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
        var docLTR = doc.direction == "ltr";

        function add(left, top, width, bottom) {
          if (top < 0) { top = 0; }
          top = Math.round(top);
          bottom = Math.round(bottom);
          fragment.appendChild(elt("div", null, "CodeMirror-selected", ("position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px")));
        }

        function drawForLine(line, fromArg, toArg) {
          var lineObj = getLine(doc, line);
          var lineLen = lineObj.text.length;
          var start, end;
          function coords(ch, bias) {
            return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
          }

          function wrapX(pos, dir, side) {
            var extent = wrappedLineExtentChar(cm, lineObj, null, pos);
            var prop = (dir == "ltr") == (side == "after") ? "left" : "right";
            var ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
            return coords(ch, prop)[prop]
          }

          var order = getOrder(lineObj, doc.direction);
          iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, function (from, to, dir, i) {
            var ltr = dir == "ltr";
            var fromPos = coords(from, ltr ? "left" : "right");
            var toPos = coords(to - 1, ltr ? "right" : "left");

            var openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
            var first = i == 0, last = !order || i == order.length - 1;
            if (toPos.top - fromPos.top <= 3) { // Single line
              var openLeft = (docLTR ? openStart : openEnd) && first;
              var openRight = (docLTR ? openEnd : openStart) && last;
              var left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
              var right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
              add(left, fromPos.top, right - left, fromPos.bottom);
            } else { // Multiple lines
              var topLeft, topRight, botLeft, botRight;
              if (ltr) {
                topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
                topRight = docLTR ? rightSide : wrapX(from, dir, "before");
                botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
                botRight = docLTR && openEnd && last ? rightSide : toPos.right;
              } else {
                topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
                topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
                botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
                botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
              }
              add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
              if (fromPos.bottom < toPos.top) { add(leftSide, fromPos.bottom, null, toPos.top); }
              add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
            }

            if (!start || cmpCoords(fromPos, start) < 0) { start = fromPos; }
            if (cmpCoords(toPos, start) < 0) { start = toPos; }
            if (!end || cmpCoords(fromPos, end) < 0) { end = fromPos; }
            if (cmpCoords(toPos, end) < 0) { end = toPos; }
          });
          return {start: start, end: end}
        }

        var sFrom = range$$1.from(), sTo = range$$1.to();
        if (sFrom.line == sTo.line) {
          drawForLine(sFrom.line, sFrom.ch, sTo.ch);
        } else {
          var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line);
          var singleVLine = visualLine(fromLine) == visualLine(toLine);
          var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
          var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
          if (singleVLine) {
            if (leftEnd.top < rightStart.top - 2) {
              add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
              add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
            } else {
              add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
            }
          }
          if (leftEnd.bottom < rightStart.top)
            { add(leftSide, leftEnd.bottom, null, rightStart.top); }
        }

        output.appendChild(fragment);
      }

      // Cursor-blinking
      function restartBlink(cm) {
        if (!cm.state.focused) { return }
        var display = cm.display;
        clearInterval(display.blinker);
        var on = true;
        display.cursorDiv.style.visibility = "";
        if (cm.options.cursorBlinkRate > 0)
          { display.blinker = setInterval(function () { return display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden"; },
            cm.options.cursorBlinkRate); }
        else if (cm.options.cursorBlinkRate < 0)
          { display.cursorDiv.style.visibility = "hidden"; }
      }

      function ensureFocus(cm) {
        if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm); }
      }

      function delayBlurEvent(cm) {
        cm.state.delayingBlurEvent = true;
        setTimeout(function () { if (cm.state.delayingBlurEvent) {
          cm.state.delayingBlurEvent = false;
          onBlur(cm);
        } }, 100);
      }

      function onFocus(cm, e) {
        if (cm.state.delayingBlurEvent) { cm.state.delayingBlurEvent = false; }

        if (cm.options.readOnly == "nocursor") { return }
        if (!cm.state.focused) {
          signal(cm, "focus", cm, e);
          cm.state.focused = true;
          addClass(cm.display.wrapper, "CodeMirror-focused");
          // This test prevents this from firing when a context
          // menu is closed (since the input reset would kill the
          // select-all detection hack)
          if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
            cm.display.input.reset();
            if (webkit) { setTimeout(function () { return cm.display.input.reset(true); }, 20); } // Issue #1730
          }
          cm.display.input.receivedFocus();
        }
        restartBlink(cm);
      }
      function onBlur(cm, e) {
        if (cm.state.delayingBlurEvent) { return }

        if (cm.state.focused) {
          signal(cm, "blur", cm, e);
          cm.state.focused = false;
          rmClass(cm.display.wrapper, "CodeMirror-focused");
        }
        clearInterval(cm.display.blinker);
        setTimeout(function () { if (!cm.state.focused) { cm.display.shift = false; } }, 150);
      }

      // Read the actual heights of the rendered lines, and update their
      // stored heights to match.
      function updateHeightsInViewport(cm) {
        var display = cm.display;
        var prevBottom = display.lineDiv.offsetTop;
        for (var i = 0; i < display.view.length; i++) {
          var cur = display.view[i], wrapping = cm.options.lineWrapping;
          var height = (void 0), width = 0;
          if (cur.hidden) { continue }
          if (ie && ie_version < 8) {
            var bot = cur.node.offsetTop + cur.node.offsetHeight;
            height = bot - prevBottom;
            prevBottom = bot;
          } else {
            var box = cur.node.getBoundingClientRect();
            height = box.bottom - box.top;
            // Check that lines don't extend past the right of the current
            // editor width
            if (!wrapping && cur.text.firstChild)
              { width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1; }
          }
          var diff = cur.line.height - height;
          if (diff > .005 || diff < -.005) {
            updateLineHeight(cur.line, height);
            updateWidgetHeight(cur.line);
            if (cur.rest) { for (var j = 0; j < cur.rest.length; j++)
              { updateWidgetHeight(cur.rest[j]); } }
          }
          if (width > cm.display.sizerWidth) {
            var chWidth = Math.ceil(width / charWidth(cm.display));
            if (chWidth > cm.display.maxLineLength) {
              cm.display.maxLineLength = chWidth;
              cm.display.maxLine = cur.line;
              cm.display.maxLineChanged = true;
            }
          }
        }
      }

      // Read and store the height of line widgets associated with the
      // given line.
      function updateWidgetHeight(line) {
        if (line.widgets) { for (var i = 0; i < line.widgets.length; ++i) {
          var w = line.widgets[i], parent = w.node.parentNode;
          if (parent) { w.height = parent.offsetHeight; }
        } }
      }

      // Compute the lines that are visible in a given viewport (defaults
      // the the current scroll position). viewport may contain top,
      // height, and ensure (see op.scrollToPos) properties.
      function visibleLines(display, doc, viewport) {
        var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
        top = Math.floor(top - paddingTop(display));
        var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;

        var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom);
        // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
        // forces those lines into the viewport (if possible).
        if (viewport && viewport.ensure) {
          var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
          if (ensureFrom < from) {
            from = ensureFrom;
            to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
          } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
            from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
            to = ensureTo;
          }
        }
        return {from: from, to: Math.max(to, from + 1)}
      }

      // SCROLLING THINGS INTO VIEW

      // If an editor sits on the top or bottom of the window, partially
      // scrolled out of view, this ensures that the cursor is visible.
      function maybeScrollWindow(cm, rect) {
        if (signalDOMEvent(cm, "scrollCursorIntoView")) { return }

        var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
        if (rect.top + box.top < 0) { doScroll = true; }
        else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) { doScroll = false; }
        if (doScroll != null && !phantom) {
          var scrollNode = elt("div", "\u200b", null, ("position: absolute;\n                         top: " + (rect.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (rect.bottom - rect.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + (rect.left) + "px; width: " + (Math.max(2, rect.right - rect.left)) + "px;"));
          cm.display.lineSpace.appendChild(scrollNode);
          scrollNode.scrollIntoView(doScroll);
          cm.display.lineSpace.removeChild(scrollNode);
        }
      }

      // Scroll a given position into view (immediately), verifying that
      // it actually became visible (as line heights are accurately
      // measured, the position of something may 'drift' during drawing).
      function scrollPosIntoView(cm, pos, end, margin) {
        if (margin == null) { margin = 0; }
        var rect;
        if (!cm.options.lineWrapping && pos == end) {
          // Set pos and end to the cursor positions around the character pos sticks to
          // If pos.sticky == "before", that is around pos.ch - 1, otherwise around pos.ch
          // If pos == Pos(_, 0, "before"), pos and end are unchanged
          pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos;
          end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos;
        }
        for (var limit = 0; limit < 5; limit++) {
          var changed = false;
          var coords = cursorCoords(cm, pos);
          var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
          rect = {left: Math.min(coords.left, endCoords.left),
                  top: Math.min(coords.top, endCoords.top) - margin,
                  right: Math.max(coords.left, endCoords.left),
                  bottom: Math.max(coords.bottom, endCoords.bottom) + margin};
          var scrollPos = calculateScrollPos(cm, rect);
          var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
          if (scrollPos.scrollTop != null) {
            updateScrollTop(cm, scrollPos.scrollTop);
            if (Math.abs(cm.doc.scrollTop - startTop) > 1) { changed = true; }
          }
          if (scrollPos.scrollLeft != null) {
            setScrollLeft(cm, scrollPos.scrollLeft);
            if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) { changed = true; }
          }
          if (!changed) { break }
        }
        return rect
      }

      // Scroll a given set of coordinates into view (immediately).
      function scrollIntoView(cm, rect) {
        var scrollPos = calculateScrollPos(cm, rect);
        if (scrollPos.scrollTop != null) { updateScrollTop(cm, scrollPos.scrollTop); }
        if (scrollPos.scrollLeft != null) { setScrollLeft(cm, scrollPos.scrollLeft); }
      }

      // Calculate a new scroll position needed to scroll the given
      // rectangle into view. Returns an object with scrollTop and
      // scrollLeft properties. When these are undefined, the
      // vertical/horizontal position does not need to be adjusted.
      function calculateScrollPos(cm, rect) {
        var display = cm.display, snapMargin = textHeight(cm.display);
        if (rect.top < 0) { rect.top = 0; }
        var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
        var screen = displayHeight(cm), result = {};
        if (rect.bottom - rect.top > screen) { rect.bottom = rect.top + screen; }
        var docBottom = cm.doc.height + paddingVert(display);
        var atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin;
        if (rect.top < screentop) {
          result.scrollTop = atTop ? 0 : rect.top;
        } else if (rect.bottom > screentop + screen) {
          var newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen);
          if (newTop != screentop) { result.scrollTop = newTop; }
        }

        var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
        var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
        var tooWide = rect.right - rect.left > screenw;
        if (tooWide) { rect.right = rect.left + screenw; }
        if (rect.left < 10)
          { result.scrollLeft = 0; }
        else if (rect.left < screenleft)
          { result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10)); }
        else if (rect.right > screenw + screenleft - 3)
          { result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw; }
        return result
      }

      // Store a relative adjustment to the scroll position in the current
      // operation (to be applied when the operation finishes).
      function addToScrollTop(cm, top) {
        if (top == null) { return }
        resolveScrollToPos(cm);
        cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
      }

      // Make sure that at the end of the operation the current cursor is
      // shown.
      function ensureCursorVisible(cm) {
        resolveScrollToPos(cm);
        var cur = cm.getCursor();
        cm.curOp.scrollToPos = {from: cur, to: cur, margin: cm.options.cursorScrollMargin};
      }

      function scrollToCoords(cm, x, y) {
        if (x != null || y != null) { resolveScrollToPos(cm); }
        if (x != null) { cm.curOp.scrollLeft = x; }
        if (y != null) { cm.curOp.scrollTop = y; }
      }

      function scrollToRange(cm, range$$1) {
        resolveScrollToPos(cm);
        cm.curOp.scrollToPos = range$$1;
      }

      // When an operation has its scrollToPos property set, and another
      // scroll action is applied before the end of the operation, this
      // 'simulates' scrolling that position into view in a cheap way, so
      // that the effect of intermediate scroll commands is not ignored.
      function resolveScrollToPos(cm) {
        var range$$1 = cm.curOp.scrollToPos;
        if (range$$1) {
          cm.curOp.scrollToPos = null;
          var from = estimateCoords(cm, range$$1.from), to = estimateCoords(cm, range$$1.to);
          scrollToCoordsRange(cm, from, to, range$$1.margin);
        }
      }

      function scrollToCoordsRange(cm, from, to, margin) {
        var sPos = calculateScrollPos(cm, {
          left: Math.min(from.left, to.left),
          top: Math.min(from.top, to.top) - margin,
          right: Math.max(from.right, to.right),
          bottom: Math.max(from.bottom, to.bottom) + margin
        });
        scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
      }

      // Sync the scrollable area and scrollbars, ensure the viewport
      // covers the visible area.
      function updateScrollTop(cm, val) {
        if (Math.abs(cm.doc.scrollTop - val) < 2) { return }
        if (!gecko) { updateDisplaySimple(cm, {top: val}); }
        setScrollTop(cm, val, true);
        if (gecko) { updateDisplaySimple(cm); }
        startWorker(cm, 100);
      }

      function setScrollTop(cm, val, forceScroll) {
        val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val);
        if (cm.display.scroller.scrollTop == val && !forceScroll) { return }
        cm.doc.scrollTop = val;
        cm.display.scrollbars.setScrollTop(val);
        if (cm.display.scroller.scrollTop != val) { cm.display.scroller.scrollTop = val; }
      }

      // Sync scroller and scrollbar, ensure the gutter elements are
      // aligned.
      function setScrollLeft(cm, val, isScroller, forceScroll) {
        val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
        if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) { return }
        cm.doc.scrollLeft = val;
        alignHorizontally(cm);
        if (cm.display.scroller.scrollLeft != val) { cm.display.scroller.scrollLeft = val; }
        cm.display.scrollbars.setScrollLeft(val);
      }

      // SCROLLBARS

      // Prepare DOM reads needed to update the scrollbars. Done in one
      // shot to minimize update/measure roundtrips.
      function measureForScrollbars(cm) {
        var d = cm.display, gutterW = d.gutters.offsetWidth;
        var docH = Math.round(cm.doc.height + paddingVert(cm.display));
        return {
          clientHeight: d.scroller.clientHeight,
          viewHeight: d.wrapper.clientHeight,
          scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
          viewWidth: d.wrapper.clientWidth,
          barLeft: cm.options.fixedGutter ? gutterW : 0,
          docHeight: docH,
          scrollHeight: docH + scrollGap(cm) + d.barHeight,
          nativeBarWidth: d.nativeBarWidth,
          gutterWidth: gutterW
        }
      }

      var NativeScrollbars = function(place, scroll, cm) {
        this.cm = cm;
        var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
        var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
        vert.tabIndex = horiz.tabIndex = -1;
        place(vert); place(horiz);

        on(vert, "scroll", function () {
          if (vert.clientHeight) { scroll(vert.scrollTop, "vertical"); }
        });
        on(horiz, "scroll", function () {
          if (horiz.clientWidth) { scroll(horiz.scrollLeft, "horizontal"); }
        });

        this.checkedZeroWidth = false;
        // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
        if (ie && ie_version < 8) { this.horiz.style.minHeight = this.vert.style.minWidth = "18px"; }
      };

      NativeScrollbars.prototype.update = function (measure) {
        var needsH = measure.scrollWidth > measure.clientWidth + 1;
        var needsV = measure.scrollHeight > measure.clientHeight + 1;
        var sWidth = measure.nativeBarWidth;

        if (needsV) {
          this.vert.style.display = "block";
          this.vert.style.bottom = needsH ? sWidth + "px" : "0";
          var totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
          // A bug in IE8 can cause this value to be negative, so guard it.
          this.vert.firstChild.style.height =
            Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
        } else {
          this.vert.style.display = "";
          this.vert.firstChild.style.height = "0";
        }

        if (needsH) {
          this.horiz.style.display = "block";
          this.horiz.style.right = needsV ? sWidth + "px" : "0";
          this.horiz.style.left = measure.barLeft + "px";
          var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
          this.horiz.firstChild.style.width =
            Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
        } else {
          this.horiz.style.display = "";
          this.horiz.firstChild.style.width = "0";
        }

        if (!this.checkedZeroWidth && measure.clientHeight > 0) {
          if (sWidth == 0) { this.zeroWidthHack(); }
          this.checkedZeroWidth = true;
        }

        return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0}
      };

      NativeScrollbars.prototype.setScrollLeft = function (pos) {
        if (this.horiz.scrollLeft != pos) { this.horiz.scrollLeft = pos; }
        if (this.disableHoriz) { this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz"); }
      };

      NativeScrollbars.prototype.setScrollTop = function (pos) {
        if (this.vert.scrollTop != pos) { this.vert.scrollTop = pos; }
        if (this.disableVert) { this.enableZeroWidthBar(this.vert, this.disableVert, "vert"); }
      };

      NativeScrollbars.prototype.zeroWidthHack = function () {
        var w = mac && !mac_geMountainLion ? "12px" : "18px";
        this.horiz.style.height = this.vert.style.width = w;
        this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
        this.disableHoriz = new Delayed;
        this.disableVert = new Delayed;
      };

      NativeScrollbars.prototype.enableZeroWidthBar = function (bar, delay, type) {
        bar.style.pointerEvents = "auto";
        function maybeDisable() {
          // To find out whether the scrollbar is still visible, we
          // check whether the element under the pixel in the bottom
          // right corner of the scrollbar box is the scrollbar box
          // itself (when the bar is still visible) or its filler child
          // (when the bar is hidden). If it is still visible, we keep
          // it enabled, if it's hidden, we disable pointer events.
          var box = bar.getBoundingClientRect();
          var elt$$1 = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2)
              : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
          if (elt$$1 != bar) { bar.style.pointerEvents = "none"; }
          else { delay.set(1000, maybeDisable); }
        }
        delay.set(1000, maybeDisable);
      };

      NativeScrollbars.prototype.clear = function () {
        var parent = this.horiz.parentNode;
        parent.removeChild(this.horiz);
        parent.removeChild(this.vert);
      };

      var NullScrollbars = function () {};

      NullScrollbars.prototype.update = function () { return {bottom: 0, right: 0} };
      NullScrollbars.prototype.setScrollLeft = function () {};
      NullScrollbars.prototype.setScrollTop = function () {};
      NullScrollbars.prototype.clear = function () {};

      function updateScrollbars(cm, measure) {
        if (!measure) { measure = measureForScrollbars(cm); }
        var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
        updateScrollbarsInner(cm, measure);
        for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
          if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
            { updateHeightsInViewport(cm); }
          updateScrollbarsInner(cm, measureForScrollbars(cm));
          startWidth = cm.display.barWidth; startHeight = cm.display.barHeight;
        }
      }

      // Re-synchronize the fake scrollbars with the actual size of the
      // content.
      function updateScrollbarsInner(cm, measure) {
        var d = cm.display;
        var sizes = d.scrollbars.update(measure);

        d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
        d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";
        d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent";

        if (sizes.right && sizes.bottom) {
          d.scrollbarFiller.style.display = "block";
          d.scrollbarFiller.style.height = sizes.bottom + "px";
          d.scrollbarFiller.style.width = sizes.right + "px";
        } else { d.scrollbarFiller.style.display = ""; }
        if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
          d.gutterFiller.style.display = "block";
          d.gutterFiller.style.height = sizes.bottom + "px";
          d.gutterFiller.style.width = measure.gutterWidth + "px";
        } else { d.gutterFiller.style.display = ""; }
      }

      var scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars};

      function initScrollbars(cm) {
        if (cm.display.scrollbars) {
          cm.display.scrollbars.clear();
          if (cm.display.scrollbars.addClass)
            { rmClass(cm.display.wrapper, cm.display.scrollbars.addClass); }
        }

        cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function (node) {
          cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
          // Prevent clicks in the scrollbars from killing focus
          on(node, "mousedown", function () {
            if (cm.state.focused) { setTimeout(function () { return cm.display.input.focus(); }, 0); }
          });
          node.setAttribute("cm-not-content", "true");
        }, function (pos, axis) {
          if (axis == "horizontal") { setScrollLeft(cm, pos); }
          else { updateScrollTop(cm, pos); }
        }, cm);
        if (cm.display.scrollbars.addClass)
          { addClass(cm.display.wrapper, cm.display.scrollbars.addClass); }
      }

      // Operations are used to wrap a series of changes to the editor
      // state in such a way that each change won't have to update the
      // cursor and display (which would be awkward, slow, and
      // error-prone). Instead, display updates are batched and then all
      // combined and executed at once.

      var nextOpId = 0;
      // Start a new operation.
      function startOperation(cm) {
        cm.curOp = {
          cm: cm,
          viewChanged: false,      // Flag that indicates that lines might need to be redrawn
          startHeight: cm.doc.height, // Used to detect need to update scrollbar
          forceUpdate: false,      // Used to force a redraw
          updateInput: 0,       // Whether to reset the input textarea
          typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
          changeObjs: null,        // Accumulated changes, for firing change events
          cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
          cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
          selectionChanged: false, // Whether the selection needs to be redrawn
          updateMaxLine: false,    // Set when the widest line needs to be determined anew
          scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
          scrollToPos: null,       // Used to scroll to a specific position
          focus: false,
          id: ++nextOpId           // Unique ID
        };
        pushOperation(cm.curOp);
      }

      // Finish an operation, updating the display and signalling delayed events
      function endOperation(cm) {
        var op = cm.curOp;
        if (op) { finishOperation(op, function (group) {
          for (var i = 0; i < group.ops.length; i++)
            { group.ops[i].cm.curOp = null; }
          endOperations(group);
        }); }
      }

      // The DOM updates done when an operation finishes are batched so
      // that the minimum number of relayouts are required.
      function endOperations(group) {
        var ops = group.ops;
        for (var i = 0; i < ops.length; i++) // Read DOM
          { endOperation_R1(ops[i]); }
        for (var i$1 = 0; i$1 < ops.length; i$1++) // Write DOM (maybe)
          { endOperation_W1(ops[i$1]); }
        for (var i$2 = 0; i$2 < ops.length; i$2++) // Read DOM
          { endOperation_R2(ops[i$2]); }
        for (var i$3 = 0; i$3 < ops.length; i$3++) // Write DOM (maybe)
          { endOperation_W2(ops[i$3]); }
        for (var i$4 = 0; i$4 < ops.length; i$4++) // Read DOM
          { endOperation_finish(ops[i$4]); }
      }

      function endOperation_R1(op) {
        var cm = op.cm, display = cm.display;
        maybeClipScrollbars(cm);
        if (op.updateMaxLine) { findMaxLine(cm); }

        op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
          op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
                             op.scrollToPos.to.line >= display.viewTo) ||
          display.maxLineChanged && cm.options.lineWrapping;
        op.update = op.mustUpdate &&
          new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate);
      }

      function endOperation_W1(op) {
        op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
      }

      function endOperation_R2(op) {
        var cm = op.cm, display = cm.display;
        if (op.updatedDisplay) { updateHeightsInViewport(cm); }

        op.barMeasure = measureForScrollbars(cm);

        // If the max line changed since it was last measured, measure it,
        // and ensure the document's width matches it.
        // updateDisplay_W2 will use these properties to do the actual resizing
        if (display.maxLineChanged && !cm.options.lineWrapping) {
          op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
          cm.display.sizerWidth = op.adjustWidthTo;
          op.barMeasure.scrollWidth =
            Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
          op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
        }

        if (op.updatedDisplay || op.selectionChanged)
          { op.preparedSelection = display.input.prepareSelection(); }
      }

      function endOperation_W2(op) {
        var cm = op.cm;

        if (op.adjustWidthTo != null) {
          cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
          if (op.maxScrollLeft < cm.doc.scrollLeft)
            { setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true); }
          cm.display.maxLineChanged = false;
        }

        var takeFocus = op.focus && op.focus == activeElt();
        if (op.preparedSelection)
          { cm.display.input.showSelection(op.preparedSelection, takeFocus); }
        if (op.updatedDisplay || op.startHeight != cm.doc.height)
          { updateScrollbars(cm, op.barMeasure); }
        if (op.updatedDisplay)
          { setDocumentHeight(cm, op.barMeasure); }

        if (op.selectionChanged) { restartBlink(cm); }

        if (cm.state.focused && op.updateInput)
          { cm.display.input.reset(op.typing); }
        if (takeFocus) { ensureFocus(op.cm); }
      }

      function endOperation_finish(op) {
        var cm = op.cm, display = cm.display, doc = cm.doc;

        if (op.updatedDisplay) { postUpdateDisplay(cm, op.update); }

        // Abort mouse wheel delta measurement, when scrolling explicitly
        if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
          { display.wheelStartX = display.wheelStartY = null; }

        // Propagate the scroll position to the actual DOM scroller
        if (op.scrollTop != null) { setScrollTop(cm, op.scrollTop, op.forceScroll); }

        if (op.scrollLeft != null) { setScrollLeft(cm, op.scrollLeft, true, true); }
        // If we need to scroll a specific position into view, do so.
        if (op.scrollToPos) {
          var rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
                                       clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
          maybeScrollWindow(cm, rect);
        }

        // Fire events for markers that are hidden/unidden by editing or
        // undoing
        var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
        if (hidden) { for (var i = 0; i < hidden.length; ++i)
          { if (!hidden[i].lines.length) { signal(hidden[i], "hide"); } } }
        if (unhidden) { for (var i$1 = 0; i$1 < unhidden.length; ++i$1)
          { if (unhidden[i$1].lines.length) { signal(unhidden[i$1], "unhide"); } } }

        if (display.wrapper.offsetHeight)
          { doc.scrollTop = cm.display.scroller.scrollTop; }

        // Fire change events, and delayed event handlers
        if (op.changeObjs)
          { signal(cm, "changes", cm, op.changeObjs); }
        if (op.update)
          { op.update.finish(); }
      }

      // Run the given function in an operation
      function runInOp(cm, f) {
        if (cm.curOp) { return f() }
        startOperation(cm);
        try { return f() }
        finally { endOperation(cm); }
      }
      // Wraps a function in an operation. Returns the wrapped function.
      function operation(cm, f) {
        return function() {
          if (cm.curOp) { return f.apply(cm, arguments) }
          startOperation(cm);
          try { return f.apply(cm, arguments) }
          finally { endOperation(cm); }
        }
      }
      // Used to add methods to editor and doc instances, wrapping them in
      // operations.
      function methodOp(f) {
        return function() {
          if (this.curOp) { return f.apply(this, arguments) }
          startOperation(this);
          try { return f.apply(this, arguments) }
          finally { endOperation(this); }
        }
      }
      function docMethodOp(f) {
        return function() {
          var cm = this.cm;
          if (!cm || cm.curOp) { return f.apply(this, arguments) }
          startOperation(cm);
          try { return f.apply(this, arguments) }
          finally { endOperation(cm); }
        }
      }

      // HIGHLIGHT WORKER

      function startWorker(cm, time) {
        if (cm.doc.highlightFrontier < cm.display.viewTo)
          { cm.state.highlight.set(time, bind(highlightWorker, cm)); }
      }

      function highlightWorker(cm) {
        var doc = cm.doc;
        if (doc.highlightFrontier >= cm.display.viewTo) { return }
        var end = +new Date + cm.options.workTime;
        var context = getContextBefore(cm, doc.highlightFrontier);
        var changedLines = [];

        doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function (line) {
          if (context.line >= cm.display.viewFrom) { // Visible
            var oldStyles = line.styles;
            var resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null;
            var highlighted = highlightLine(cm, line, context, true);
            if (resetState) { context.state = resetState; }
            line.styles = highlighted.styles;
            var oldCls = line.styleClasses, newCls = highlighted.classes;
            if (newCls) { line.styleClasses = newCls; }
            else if (oldCls) { line.styleClasses = null; }
            var ischange = !oldStyles || oldStyles.length != line.styles.length ||
              oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
            for (var i = 0; !ischange && i < oldStyles.length; ++i) { ischange = oldStyles[i] != line.styles[i]; }
            if (ischange) { changedLines.push(context.line); }
            line.stateAfter = context.save();
            context.nextLine();
          } else {
            if (line.text.length <= cm.options.maxHighlightLength)
              { processLine(cm, line.text, context); }
            line.stateAfter = context.line % 5 == 0 ? context.save() : null;
            context.nextLine();
          }
          if (+new Date > end) {
            startWorker(cm, cm.options.workDelay);
            return true
          }
        });
        doc.highlightFrontier = context.line;
        doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
        if (changedLines.length) { runInOp(cm, function () {
          for (var i = 0; i < changedLines.length; i++)
            { regLineChange(cm, changedLines[i], "text"); }
        }); }
      }

      // DISPLAY DRAWING

      var DisplayUpdate = function(cm, viewport, force) {
        var display = cm.display;

        this.viewport = viewport;
        // Store some values that we'll need later (but don't want to force a relayout for)
        this.visible = visibleLines(display, cm.doc, viewport);
        this.editorIsHidden = !display.wrapper.offsetWidth;
        this.wrapperHeight = display.wrapper.clientHeight;
        this.wrapperWidth = display.wrapper.clientWidth;
        this.oldDisplayWidth = displayWidth(cm);
        this.force = force;
        this.dims = getDimensions(cm);
        this.events = [];
      };

      DisplayUpdate.prototype.signal = function (emitter, type) {
        if (hasHandler(emitter, type))
          { this.events.push(arguments); }
      };
      DisplayUpdate.prototype.finish = function () {
          var this$1 = this;

        for (var i = 0; i < this.events.length; i++)
          { signal.apply(null, this$1.events[i]); }
      };

      function maybeClipScrollbars(cm) {
        var display = cm.display;
        if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
          display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
          display.heightForcer.style.height = scrollGap(cm) + "px";
          display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
          display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
          display.scrollbarsClipped = true;
        }
      }

      function selectionSnapshot(cm) {
        if (cm.hasFocus()) { return null }
        var active = activeElt();
        if (!active || !contains(cm.display.lineDiv, active)) { return null }
        var result = {activeElt: active};
        if (window.getSelection) {
          var sel = window.getSelection();
          if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
            result.anchorNode = sel.anchorNode;
            result.anchorOffset = sel.anchorOffset;
            result.focusNode = sel.focusNode;
            result.focusOffset = sel.focusOffset;
          }
        }
        return result
      }

      function restoreSelection(snapshot) {
        if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) { return }
        snapshot.activeElt.focus();
        if (snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
          var sel = window.getSelection(), range$$1 = document.createRange();
          range$$1.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
          range$$1.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range$$1);
          sel.extend(snapshot.focusNode, snapshot.focusOffset);
        }
      }

      // Does the actual updating of the line display. Bails out
      // (returning false) when there is nothing to be done and forced is
      // false.
      function updateDisplayIfNeeded(cm, update) {
        var display = cm.display, doc = cm.doc;

        if (update.editorIsHidden) {
          resetView(cm);
          return false
        }

        // Bail out if the visible area is already rendered and nothing changed.
        if (!update.force &&
            update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
            (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
            display.renderedView == display.view && countDirtyView(cm) == 0)
          { return false }

        if (maybeUpdateLineNumberWidth(cm)) {
          resetView(cm);
          update.dims = getDimensions(cm);
        }

        // Compute a suitable new viewport (from & to)
        var end = doc.first + doc.size;
        var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
        var to = Math.min(end, update.visible.to + cm.options.viewportMargin);
        if (display.viewFrom < from && from - display.viewFrom < 20) { from = Math.max(doc.first, display.viewFrom); }
        if (display.viewTo > to && display.viewTo - to < 20) { to = Math.min(end, display.viewTo); }
        if (sawCollapsedSpans) {
          from = visualLineNo(cm.doc, from);
          to = visualLineEndNo(cm.doc, to);
        }

        var different = from != display.viewFrom || to != display.viewTo ||
          display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
        adjustView(cm, from, to);

        display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
        // Position the mover div to align with the current scroll position
        cm.display.mover.style.top = display.viewOffset + "px";

        var toUpdate = countDirtyView(cm);
        if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
            (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
          { return false }

        // For big changes, we hide the enclosing element during the
        // update, since that speeds up the operations on most browsers.
        var selSnapshot = selectionSnapshot(cm);
        if (toUpdate > 4) { display.lineDiv.style.display = "none"; }
        patchDisplay(cm, display.updateLineNumbers, update.dims);
        if (toUpdate > 4) { display.lineDiv.style.display = ""; }
        display.renderedView = display.view;
        // There might have been a widget with a focused element that got
        // hidden or updated, if so re-focus it.
        restoreSelection(selSnapshot);

        // Prevent selection and cursors from interfering with the scroll
        // width and height.
        removeChildren(display.cursorDiv);
        removeChildren(display.selectionDiv);
        display.gutters.style.height = display.sizer.style.minHeight = 0;

        if (different) {
          display.lastWrapHeight = update.wrapperHeight;
          display.lastWrapWidth = update.wrapperWidth;
          startWorker(cm, 400);
        }

        display.updateLineNumbers = null;

        return true
      }

      function postUpdateDisplay(cm, update) {
        var viewport = update.viewport;

        for (var first = true;; first = false) {
          if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
            // Clip forced viewport to actual scrollable area.
            if (viewport && viewport.top != null)
              { viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)}; }
            // Updated line heights might result in the drawn area not
            // actually covering the viewport. Keep looping until it does.
            update.visible = visibleLines(cm.display, cm.doc, viewport);
            if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
              { break }
          }
          if (!updateDisplayIfNeeded(cm, update)) { break }
          updateHeightsInViewport(cm);
          var barMeasure = measureForScrollbars(cm);
          updateSelection(cm);
          updateScrollbars(cm, barMeasure);
          setDocumentHeight(cm, barMeasure);
          update.force = false;
        }

        update.signal(cm, "update", cm);
        if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
          update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
          cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo;
        }
      }

      function updateDisplaySimple(cm, viewport) {
        var update = new DisplayUpdate(cm, viewport);
        if (updateDisplayIfNeeded(cm, update)) {
          updateHeightsInViewport(cm);
          postUpdateDisplay(cm, update);
          var barMeasure = measureForScrollbars(cm);
          updateSelection(cm);
          updateScrollbars(cm, barMeasure);
          setDocumentHeight(cm, barMeasure);
          update.finish();
        }
      }

      // Sync the actual display DOM structure with display.view, removing
      // nodes for lines that are no longer in view, and creating the ones
      // that are not there yet, and updating the ones that are out of
      // date.
      function patchDisplay(cm, updateNumbersFrom, dims) {
        var display = cm.display, lineNumbers = cm.options.lineNumbers;
        var container = display.lineDiv, cur = container.firstChild;

        function rm(node) {
          var next = node.nextSibling;
          // Works around a throw-scroll bug in OS X Webkit
          if (webkit && mac && cm.display.currentWheelTarget == node)
            { node.style.display = "none"; }
          else
            { node.parentNode.removeChild(node); }
          return next
        }

        var view = display.view, lineN = display.viewFrom;
        // Loop over the elements in the view, syncing cur (the DOM nodes
        // in display.lineDiv) with the view as we go.
        for (var i = 0; i < view.length; i++) {
          var lineView = view[i];
          if (lineView.hidden) ; else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
            var node = buildLineElement(cm, lineView, lineN, dims);
            container.insertBefore(node, cur);
          } else { // Already drawn
            while (cur != lineView.node) { cur = rm(cur); }
            var updateNumber = lineNumbers && updateNumbersFrom != null &&
              updateNumbersFrom <= lineN && lineView.lineNumber;
            if (lineView.changes) {
              if (indexOf(lineView.changes, "gutter") > -1) { updateNumber = false; }
              updateLineForChanges(cm, lineView, lineN, dims);
            }
            if (updateNumber) {
              removeChildren(lineView.lineNumber);
              lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
            }
            cur = lineView.node.nextSibling;
          }
          lineN += lineView.size;
        }
        while (cur) { cur = rm(cur); }
      }

      function updateGutterSpace(display) {
        var width = display.gutters.offsetWidth;
        display.sizer.style.marginLeft = width + "px";
      }

      function setDocumentHeight(cm, measure) {
        cm.display.sizer.style.minHeight = measure.docHeight + "px";
        cm.display.heightForcer.style.top = measure.docHeight + "px";
        cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + scrollGap(cm)) + "px";
      }

      // Re-align line numbers and gutter marks to compensate for
      // horizontal scrolling.
      function alignHorizontally(cm) {
        var display = cm.display, view = display.view;
        if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) { return }
        var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
        var gutterW = display.gutters.offsetWidth, left = comp + "px";
        for (var i = 0; i < view.length; i++) { if (!view[i].hidden) {
          if (cm.options.fixedGutter) {
            if (view[i].gutter)
              { view[i].gutter.style.left = left; }
            if (view[i].gutterBackground)
              { view[i].gutterBackground.style.left = left; }
          }
          var align = view[i].alignable;
          if (align) { for (var j = 0; j < align.length; j++)
            { align[j].style.left = left; } }
        } }
        if (cm.options.fixedGutter)
          { display.gutters.style.left = (comp + gutterW) + "px"; }
      }

      // Used to ensure that the line number gutter is still the right
      // size for the current document size. Returns true when an update
      // is needed.
      function maybeUpdateLineNumberWidth(cm) {
        if (!cm.options.lineNumbers) { return false }
        var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
        if (last.length != display.lineNumChars) {
          var test = display.measure.appendChild(elt("div", [elt("div", last)],
                                                     "CodeMirror-linenumber CodeMirror-gutter-elt"));
          var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
          display.lineGutter.style.width = "";
          display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
          display.lineNumWidth = display.lineNumInnerWidth + padding;
          display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
          display.lineGutter.style.width = display.lineNumWidth + "px";
          updateGutterSpace(cm.display);
          return true
        }
        return false
      }

      function getGutters(gutters, lineNumbers) {
        var result = [], sawLineNumbers = false;
        for (var i = 0; i < gutters.length; i++) {
          var name = gutters[i], style = null;
          if (typeof name != "string") { style = name.style; name = name.className; }
          if (name == "CodeMirror-linenumbers") {
            if (!lineNumbers) { continue }
            else { sawLineNumbers = true; }
          }
          result.push({className: name, style: style});
        }
        if (lineNumbers && !sawLineNumbers) { result.push({className: "CodeMirror-linenumbers", style: null}); }
        return result
      }

      // Rebuild the gutter elements, ensure the margin to the left of the
      // code matches their width.
      function renderGutters(display) {
        var gutters = display.gutters, specs = display.gutterSpecs;
        removeChildren(gutters);
        display.lineGutter = null;
        for (var i = 0; i < specs.length; ++i) {
          var ref = specs[i];
          var className = ref.className;
          var style = ref.style;
          var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + className));
          if (style) { gElt.style.cssText = style; }
          if (className == "CodeMirror-linenumbers") {
            display.lineGutter = gElt;
            gElt.style.width = (display.lineNumWidth || 1) + "px";
          }
        }
        gutters.style.display = specs.length ? "" : "none";
        updateGutterSpace(display);
      }

      function updateGutters(cm) {
        renderGutters(cm.display);
        regChange(cm);
        alignHorizontally(cm);
      }

      // The display handles the DOM integration, both for input reading
      // and content drawing. It holds references to DOM nodes and
      // display-related state.

      function Display(place, doc, input, options) {
        var d = this;
        this.input = input;

        // Covers bottom-right square when both scrollbars are present.
        d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
        d.scrollbarFiller.setAttribute("cm-not-content", "true");
        // Covers bottom of gutter when coverGutterNextToScrollbar is on
        // and h scrollbar is present.
        d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
        d.gutterFiller.setAttribute("cm-not-content", "true");
        // Will contain the actual code, positioned to cover the viewport.
        d.lineDiv = eltP("div", null, "CodeMirror-code");
        // Elements are added to these to represent selection and cursors.
        d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
        d.cursorDiv = elt("div", null, "CodeMirror-cursors");
        // A visibility: hidden element used to find the size of things.
        d.measure = elt("div", null, "CodeMirror-measure");
        // When lines outside of the viewport are measured, they are drawn in this.
        d.lineMeasure = elt("div", null, "CodeMirror-measure");
        // Wraps everything that needs to exist inside the vertically-padded coordinate system
        d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
                          null, "position: relative; outline: none");
        var lines = eltP("div", [d.lineSpace], "CodeMirror-lines");
        // Moved around its parent to cover visible view.
        d.mover = elt("div", [lines], null, "position: relative");
        // Set to the height of the document, allowing scrolling.
        d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
        d.sizerWidth = null;
        // Behavior of elts with overflow: auto and padding is
        // inconsistent across browsers. This is used to ensure the
        // scrollable area is big enough.
        d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
        // Will contain the gutters, if any.
        d.gutters = elt("div", null, "CodeMirror-gutters");
        d.lineGutter = null;
        // Actual scrollable element.
        d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
        d.scroller.setAttribute("tabIndex", "-1");
        // The element in which the editor lives.
        d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");

        // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
        if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }
        if (!webkit && !(gecko && mobile)) { d.scroller.draggable = true; }

        if (place) {
          if (place.appendChild) { place.appendChild(d.wrapper); }
          else { place(d.wrapper); }
        }

        // Current rendered range (may be bigger than the view window).
        d.viewFrom = d.viewTo = doc.first;
        d.reportedViewFrom = d.reportedViewTo = doc.first;
        // Information about the rendered lines.
        d.view = [];
        d.renderedView = null;
        // Holds info about a single rendered line when it was rendered
        // for measurement, while not in view.
        d.externalMeasured = null;
        // Empty space (in pixels) above the view
        d.viewOffset = 0;
        d.lastWrapHeight = d.lastWrapWidth = 0;
        d.updateLineNumbers = null;

        d.nativeBarWidth = d.barHeight = d.barWidth = 0;
        d.scrollbarsClipped = false;

        // Used to only resize the line number gutter when necessary (when
        // the amount of lines crosses a boundary that makes its width change)
        d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
        // Set to true when a non-horizontal-scrolling line widget is
        // added. As an optimization, line widget aligning is skipped when
        // this is false.
        d.alignWidgets = false;

        d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;

        // Tracks the maximum line length so that the horizontal scrollbar
        // can be kept static when scrolling.
        d.maxLine = null;
        d.maxLineLength = 0;
        d.maxLineChanged = false;

        // Used for measuring wheel scrolling granularity
        d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;

        // True when shift is held down.
        d.shift = false;

        // Used to track whether anything happened since the context menu
        // was opened.
        d.selForContextMenu = null;

        d.activeTouch = null;

        d.gutterSpecs = getGutters(options.gutters, options.lineNumbers);
        renderGutters(d);

        input.init(d);
      }

      // Since the delta values reported on mouse wheel events are
      // unstandardized between browsers and even browser versions, and
      // generally horribly unpredictable, this code starts by measuring
      // the scroll effect that the first few mouse wheel events have,
      // and, from that, detects the way it can convert deltas to pixel
      // offsets afterwards.
      //
      // The reason we want to know the amount a wheel event will scroll
      // is that it gives us a chance to update the display before the
      // actual scrolling happens, reducing flickering.

      var wheelSamples = 0, wheelPixelsPerUnit = null;
      // Fill in a browser-detected starting value on browsers where we
      // know one. These don't have to be accurate -- the result of them
      // being wrong would just be a slight flicker on the first wheel
      // scroll (if it is large enough).
      if (ie) { wheelPixelsPerUnit = -.53; }
      else if (gecko) { wheelPixelsPerUnit = 15; }
      else if (chrome) { wheelPixelsPerUnit = -.7; }
      else if (safari) { wheelPixelsPerUnit = -1/3; }

      function wheelEventDelta(e) {
        var dx = e.wheelDeltaX, dy = e.wheelDeltaY;
        if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) { dx = e.detail; }
        if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) { dy = e.detail; }
        else if (dy == null) { dy = e.wheelDelta; }
        return {x: dx, y: dy}
      }
      function wheelEventPixels(e) {
        var delta = wheelEventDelta(e);
        delta.x *= wheelPixelsPerUnit;
        delta.y *= wheelPixelsPerUnit;
        return delta
      }

      function onScrollWheel(cm, e) {
        var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;

        var display = cm.display, scroll = display.scroller;
        // Quit if there's nothing to scroll here
        var canScrollX = scroll.scrollWidth > scroll.clientWidth;
        var canScrollY = scroll.scrollHeight > scroll.clientHeight;
        if (!(dx && canScrollX || dy && canScrollY)) { return }

        // Webkit browsers on OS X abort momentum scrolls when the target
        // of the scroll event is removed from the scrollable element.
        // This hack (see related code in patchDisplay) makes sure the
        // element is kept around.
        if (dy && mac && webkit) {
          outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
            for (var i = 0; i < view.length; i++) {
              if (view[i].node == cur) {
                cm.display.currentWheelTarget = cur;
                break outer
              }
            }
          }
        }

        // On some browsers, horizontal scrolling will cause redraws to
        // happen before the gutter has been realigned, causing it to
        // wriggle around in a most unseemly way. When we have an
        // estimated pixels/delta value, we just handle horizontal
        // scrolling entirely here. It'll be slightly off from native, but
        // better than glitching out.
        if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
          if (dy && canScrollY)
            { updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit)); }
          setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
          // Only prevent default scrolling if vertical scrolling is
          // actually possible. Otherwise, it causes vertical scroll
          // jitter on OSX trackpads when deltaX is small and deltaY
          // is large (issue #3579)
          if (!dy || (dy && canScrollY))
            { e_preventDefault(e); }
          display.wheelStartX = null; // Abort measurement, if in progress
          return
        }

        // 'Project' the visible viewport to cover the area that is being
        // scrolled into view (if we know enough to estimate it).
        if (dy && wheelPixelsPerUnit != null) {
          var pixels = dy * wheelPixelsPerUnit;
          var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
          if (pixels < 0) { top = Math.max(0, top + pixels - 50); }
          else { bot = Math.min(cm.doc.height, bot + pixels + 50); }
          updateDisplaySimple(cm, {top: top, bottom: bot});
        }

        if (wheelSamples < 20) {
          if (display.wheelStartX == null) {
            display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;
            display.wheelDX = dx; display.wheelDY = dy;
            setTimeout(function () {
              if (display.wheelStartX == null) { return }
              var movedX = scroll.scrollLeft - display.wheelStartX;
              var movedY = scroll.scrollTop - display.wheelStartY;
              var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
                (movedX && display.wheelDX && movedX / display.wheelDX);
              display.wheelStartX = display.wheelStartY = null;
              if (!sample) { return }
              wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
              ++wheelSamples;
            }, 200);
          } else {
            display.wheelDX += dx; display.wheelDY += dy;
          }
        }
      }

      // Selection objects are immutable. A new one is created every time
      // the selection changes. A selection is one or more non-overlapping
      // (and non-touching) ranges, sorted, and an integer that indicates
      // which one is the primary selection (the one that's scrolled into
      // view, that getCursor returns, etc).
      var Selection = function(ranges, primIndex) {
        this.ranges = ranges;
        this.primIndex = primIndex;
      };

      Selection.prototype.primary = function () { return this.ranges[this.primIndex] };

      Selection.prototype.equals = function (other) {
          var this$1 = this;

        if (other == this) { return true }
        if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) { return false }
        for (var i = 0; i < this.ranges.length; i++) {
          var here = this$1.ranges[i], there = other.ranges[i];
          if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) { return false }
        }
        return true
      };

      Selection.prototype.deepCopy = function () {
          var this$1 = this;

        var out = [];
        for (var i = 0; i < this.ranges.length; i++)
          { out[i] = new Range(copyPos(this$1.ranges[i].anchor), copyPos(this$1.ranges[i].head)); }
        return new Selection(out, this.primIndex)
      };

      Selection.prototype.somethingSelected = function () {
          var this$1 = this;

        for (var i = 0; i < this.ranges.length; i++)
          { if (!this$1.ranges[i].empty()) { return true } }
        return false
      };

      Selection.prototype.contains = function (pos, end) {
          var this$1 = this;

        if (!end) { end = pos; }
        for (var i = 0; i < this.ranges.length; i++) {
          var range = this$1.ranges[i];
          if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
            { return i }
        }
        return -1
      };

      var Range = function(anchor, head) {
        this.anchor = anchor; this.head = head;
      };

      Range.prototype.from = function () { return minPos(this.anchor, this.head) };
      Range.prototype.to = function () { return maxPos(this.anchor, this.head) };
      Range.prototype.empty = function () { return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch };

      // Take an unsorted, potentially overlapping set of ranges, and
      // build a selection out of it. 'Consumes' ranges array (modifying
      // it).
      function normalizeSelection(cm, ranges, primIndex) {
        var mayTouch = cm && cm.options.selectionsMayTouch;
        var prim = ranges[primIndex];
        ranges.sort(function (a, b) { return cmp(a.from(), b.from()); });
        primIndex = indexOf(ranges, prim);
        for (var i = 1; i < ranges.length; i++) {
          var cur = ranges[i], prev = ranges[i - 1];
          var diff = cmp(prev.to(), cur.from());
          if (mayTouch && !cur.empty() ? diff > 0 : diff >= 0) {
            var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
            var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
            if (i <= primIndex) { --primIndex; }
            ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
          }
        }
        return new Selection(ranges, primIndex)
      }

      function simpleSelection(anchor, head) {
        return new Selection([new Range(anchor, head || anchor)], 0)
      }

      // Compute the position of the end of a change (its 'to' property
      // refers to the pre-change end).
      function changeEnd(change) {
        if (!change.text) { return change.to }
        return Pos(change.from.line + change.text.length - 1,
                   lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0))
      }

      // Adjust a position to refer to the post-change position of the
      // same text, or the end of the change if the change covers it.
      function adjustForChange(pos, change) {
        if (cmp(pos, change.from) < 0) { return pos }
        if (cmp(pos, change.to) <= 0) { return changeEnd(change) }

        var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
        if (pos.line == change.to.line) { ch += changeEnd(change).ch - change.to.ch; }
        return Pos(line, ch)
      }

      function computeSelAfterChange(doc, change) {
        var out = [];
        for (var i = 0; i < doc.sel.ranges.length; i++) {
          var range = doc.sel.ranges[i];
          out.push(new Range(adjustForChange(range.anchor, change),
                             adjustForChange(range.head, change)));
        }
        return normalizeSelection(doc.cm, out, doc.sel.primIndex)
      }

      function offsetPos(pos, old, nw) {
        if (pos.line == old.line)
          { return Pos(nw.line, pos.ch - old.ch + nw.ch) }
        else
          { return Pos(nw.line + (pos.line - old.line), pos.ch) }
      }

      // Used by replaceSelections to allow moving the selection to the
      // start or around the replaced test. Hint may be "start" or "around".
      function computeReplacedSel(doc, changes, hint) {
        var out = [];
        var oldPrev = Pos(doc.first, 0), newPrev = oldPrev;
        for (var i = 0; i < changes.length; i++) {
          var change = changes[i];
          var from = offsetPos(change.from, oldPrev, newPrev);
          var to = offsetPos(changeEnd(change), oldPrev, newPrev);
          oldPrev = change.to;
          newPrev = to;
          if (hint == "around") {
            var range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0;
            out[i] = new Range(inv ? to : from, inv ? from : to);
          } else {
            out[i] = new Range(from, from);
          }
        }
        return new Selection(out, doc.sel.primIndex)
      }

      // Used to get the editor into a consistent state again when options change.

      function loadMode(cm) {
        cm.doc.mode = getMode(cm.options, cm.doc.modeOption);
        resetModeState(cm);
      }

      function resetModeState(cm) {
        cm.doc.iter(function (line) {
          if (line.stateAfter) { line.stateAfter = null; }
          if (line.styles) { line.styles = null; }
        });
        cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
        startWorker(cm, 100);
        cm.state.modeGen++;
        if (cm.curOp) { regChange(cm); }
      }

      // DOCUMENT DATA STRUCTURE

      // By default, updates that start and end at the beginning of a line
      // are treated specially, in order to make the association of line
      // widgets and marker elements with the text behave more intuitive.
      function isWholeLineUpdate(doc, change) {
        return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
          (!doc.cm || doc.cm.options.wholeLineUpdateBefore)
      }

      // Perform a change on the document data structure.
      function updateDoc(doc, change, markedSpans, estimateHeight$$1) {
        function spansFor(n) {return markedSpans ? markedSpans[n] : null}
        function update(line, text, spans) {
          updateLine(line, text, spans, estimateHeight$$1);
          signalLater(line, "change", line, change);
        }
        function linesFor(start, end) {
          var result = [];
          for (var i = start; i < end; ++i)
            { result.push(new Line(text[i], spansFor(i), estimateHeight$$1)); }
          return result
        }

        var from = change.from, to = change.to, text = change.text;
        var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
        var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;

        // Adjust the line structure
        if (change.full) {
          doc.insert(0, linesFor(0, text.length));
          doc.remove(text.length, doc.size - text.length);
        } else if (isWholeLineUpdate(doc, change)) {
          // This is a whole-line replace. Treated specially to make
          // sure line objects move the way they are supposed to.
          var added = linesFor(0, text.length - 1);
          update(lastLine, lastLine.text, lastSpans);
          if (nlines) { doc.remove(from.line, nlines); }
          if (added.length) { doc.insert(from.line, added); }
        } else if (firstLine == lastLine) {
          if (text.length == 1) {
            update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
          } else {
            var added$1 = linesFor(1, text.length - 1);
            added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight$$1));
            update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
            doc.insert(from.line + 1, added$1);
          }
        } else if (text.length == 1) {
          update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
          doc.remove(from.line + 1, nlines);
        } else {
          update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
          update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
          var added$2 = linesFor(1, text.length - 1);
          if (nlines > 1) { doc.remove(from.line + 1, nlines - 1); }
          doc.insert(from.line + 1, added$2);
        }

        signalLater(doc, "change", doc, change);
      }

      // Call f for all linked documents.
      function linkedDocs(doc, f, sharedHistOnly) {
        function propagate(doc, skip, sharedHist) {
          if (doc.linked) { for (var i = 0; i < doc.linked.length; ++i) {
            var rel = doc.linked[i];
            if (rel.doc == skip) { continue }
            var shared = sharedHist && rel.sharedHist;
            if (sharedHistOnly && !shared) { continue }
            f(rel.doc, shared);
            propagate(rel.doc, doc, shared);
          } }
        }
        propagate(doc, null, true);
      }

      // Attach a document to an editor.
      function attachDoc(cm, doc) {
        if (doc.cm) { throw new Error("This document is already in use.") }
        cm.doc = doc;
        doc.cm = cm;
        estimateLineHeights(cm);
        loadMode(cm);
        setDirectionClass(cm);
        if (!cm.options.lineWrapping) { findMaxLine(cm); }
        cm.options.mode = doc.modeOption;
        regChange(cm);
      }

      function setDirectionClass(cm) {
      (cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
      }

      function directionChanged(cm) {
        runInOp(cm, function () {
          setDirectionClass(cm);
          regChange(cm);
        });
      }

      function History(startGen) {
        // Arrays of change events and selections. Doing something adds an
        // event to done and clears undo. Undoing moves events from done
        // to undone, redoing moves them in the other direction.
        this.done = []; this.undone = [];
        this.undoDepth = Infinity;
        // Used to track when changes can be merged into a single undo
        // event
        this.lastModTime = this.lastSelTime = 0;
        this.lastOp = this.lastSelOp = null;
        this.lastOrigin = this.lastSelOrigin = null;
        // Used by the isClean() method
        this.generation = this.maxGeneration = startGen || 1;
      }

      // Create a history change event from an updateDoc-style change
      // object.
      function historyChangeFromChange(doc, change) {
        var histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)};
        attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
        linkedDocs(doc, function (doc) { return attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1); }, true);
        return histChange
      }

      // Pop all selection events off the end of a history array. Stop at
      // a change event.
      function clearSelectionEvents(array) {
        while (array.length) {
          var last = lst(array);
          if (last.ranges) { array.pop(); }
          else { break }
        }
      }

      // Find the top change event in the history. Pop off selection
      // events that are in the way.
      function lastChangeEvent(hist, force) {
        if (force) {
          clearSelectionEvents(hist.done);
          return lst(hist.done)
        } else if (hist.done.length && !lst(hist.done).ranges) {
          return lst(hist.done)
        } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
          hist.done.pop();
          return lst(hist.done)
        }
      }

      // Register a change in the history. Merges changes that are within
      // a single operation, or are close together with an origin that
      // allows merging (starting with "+") into a single event.
      function addChangeToHistory(doc, change, selAfter, opId) {
        var hist = doc.history;
        hist.undone.length = 0;
        var time = +new Date, cur;
        var last;

        if ((hist.lastOp == opId ||
             hist.lastOrigin == change.origin && change.origin &&
             ((change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500)) ||
              change.origin.charAt(0) == "*")) &&
            (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
          // Merge this change into the last event
          last = lst(cur.changes);
          if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
            // Optimized case for simple insertion -- don't want to add
            // new changesets for every character typed
            last.to = changeEnd(change);
          } else {
            // Add new sub-event
            cur.changes.push(historyChangeFromChange(doc, change));
          }
        } else {
          // Can not be merged, start a new event.
          var before = lst(hist.done);
          if (!before || !before.ranges)
            { pushSelectionToHistory(doc.sel, hist.done); }
          cur = {changes: [historyChangeFromChange(doc, change)],
                 generation: hist.generation};
          hist.done.push(cur);
          while (hist.done.length > hist.undoDepth) {
            hist.done.shift();
            if (!hist.done[0].ranges) { hist.done.shift(); }
          }
        }
        hist.done.push(selAfter);
        hist.generation = ++hist.maxGeneration;
        hist.lastModTime = hist.lastSelTime = time;
        hist.lastOp = hist.lastSelOp = opId;
        hist.lastOrigin = hist.lastSelOrigin = change.origin;

        if (!last) { signal(doc, "historyAdded"); }
      }

      function selectionEventCanBeMerged(doc, origin, prev, sel) {
        var ch = origin.charAt(0);
        return ch == "*" ||
          ch == "+" &&
          prev.ranges.length == sel.ranges.length &&
          prev.somethingSelected() == sel.somethingSelected() &&
          new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500)
      }

      // Called whenever the selection changes, sets the new selection as
      // the pending selection in the history, and pushes the old pending
      // selection into the 'done' array when it was significantly
      // different (in number of selected ranges, emptiness, or time).
      function addSelectionToHistory(doc, sel, opId, options) {
        var hist = doc.history, origin = options && options.origin;

        // A new event is started when the previous origin does not match
        // the current, or the origins don't allow matching. Origins
        // starting with * are always merged, those starting with + are
        // merged when similar and close together in time.
        if (opId == hist.lastSelOp ||
            (origin && hist.lastSelOrigin == origin &&
             (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
              selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
          { hist.done[hist.done.length - 1] = sel; }
        else
          { pushSelectionToHistory(sel, hist.done); }

        hist.lastSelTime = +new Date;
        hist.lastSelOrigin = origin;
        hist.lastSelOp = opId;
        if (options && options.clearRedo !== false)
          { clearSelectionEvents(hist.undone); }
      }

      function pushSelectionToHistory(sel, dest) {
        var top = lst(dest);
        if (!(top && top.ranges && top.equals(sel)))
          { dest.push(sel); }
      }

      // Used to store marked span information in the history.
      function attachLocalSpans(doc, change, from, to) {
        var existing = change["spans_" + doc.id], n = 0;
        doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function (line) {
          if (line.markedSpans)
            { (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans; }
          ++n;
        });
      }

      // When un/re-doing restores text containing marked spans, those
      // that have been explicitly cleared should not be restored.
      function removeClearedSpans(spans) {
        if (!spans) { return null }
        var out;
        for (var i = 0; i < spans.length; ++i) {
          if (spans[i].marker.explicitlyCleared) { if (!out) { out = spans.slice(0, i); } }
          else if (out) { out.push(spans[i]); }
        }
        return !out ? spans : out.length ? out : null
      }

      // Retrieve and filter the old marked spans stored in a change event.
      function getOldSpans(doc, change) {
        var found = change["spans_" + doc.id];
        if (!found) { return null }
        var nw = [];
        for (var i = 0; i < change.text.length; ++i)
          { nw.push(removeClearedSpans(found[i])); }
        return nw
      }

      // Used for un/re-doing changes from the history. Combines the
      // result of computing the existing spans with the set of spans that
      // existed in the history (so that deleting around a span and then
      // undoing brings back the span).
      function mergeOldSpans(doc, change) {
        var old = getOldSpans(doc, change);
        var stretched = stretchSpansOverChange(doc, change);
        if (!old) { return stretched }
        if (!stretched) { return old }

        for (var i = 0; i < old.length; ++i) {
          var oldCur = old[i], stretchCur = stretched[i];
          if (oldCur && stretchCur) {
            spans: for (var j = 0; j < stretchCur.length; ++j) {
              var span = stretchCur[j];
              for (var k = 0; k < oldCur.length; ++k)
                { if (oldCur[k].marker == span.marker) { continue spans } }
              oldCur.push(span);
            }
          } else if (stretchCur) {
            old[i] = stretchCur;
          }
        }
        return old
      }

      // Used both to provide a JSON-safe object in .getHistory, and, when
      // detaching a document, to split the history in two
      function copyHistoryArray(events, newGroup, instantiateSel) {
        var copy = [];
        for (var i = 0; i < events.length; ++i) {
          var event = events[i];
          if (event.ranges) {
            copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event);
            continue
          }
          var changes = event.changes, newChanges = [];
          copy.push({changes: newChanges});
          for (var j = 0; j < changes.length; ++j) {
            var change = changes[j], m = (void 0);
            newChanges.push({from: change.from, to: change.to, text: change.text});
            if (newGroup) { for (var prop in change) { if (m = prop.match(/^spans_(\d+)$/)) {
              if (indexOf(newGroup, Number(m[1])) > -1) {
                lst(newChanges)[prop] = change[prop];
                delete change[prop];
              }
            } } }
          }
        }
        return copy
      }

      // The 'scroll' parameter given to many of these indicated whether
      // the new cursor position should be scrolled into view after
      // modifying the selection.

      // If shift is held or the extend flag is set, extends a range to
      // include a given position (and optionally a second position).
      // Otherwise, simply returns the range between the given positions.
      // Used for cursor motion and such.
      function extendRange(range, head, other, extend) {
        if (extend) {
          var anchor = range.anchor;
          if (other) {
            var posBefore = cmp(head, anchor) < 0;
            if (posBefore != (cmp(other, anchor) < 0)) {
              anchor = head;
              head = other;
            } else if (posBefore != (cmp(head, other) < 0)) {
              head = other;
            }
          }
          return new Range(anchor, head)
        } else {
          return new Range(other || head, head)
        }
      }

      // Extend the primary selection range, discard the rest.
      function extendSelection(doc, head, other, options, extend) {
        if (extend == null) { extend = doc.cm && (doc.cm.display.shift || doc.extend); }
        setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
      }

      // Extend all selections (pos is an array of selections with length
      // equal the number of selections)
      function extendSelections(doc, heads, options) {
        var out = [];
        var extend = doc.cm && (doc.cm.display.shift || doc.extend);
        for (var i = 0; i < doc.sel.ranges.length; i++)
          { out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend); }
        var newSel = normalizeSelection(doc.cm, out, doc.sel.primIndex);
        setSelection(doc, newSel, options);
      }

      // Updates a single range in the selection.
      function replaceOneSelection(doc, i, range, options) {
        var ranges = doc.sel.ranges.slice(0);
        ranges[i] = range;
        setSelection(doc, normalizeSelection(doc.cm, ranges, doc.sel.primIndex), options);
      }

      // Reset the selection to a single range.
      function setSimpleSelection(doc, anchor, head, options) {
        setSelection(doc, simpleSelection(anchor, head), options);
      }

      // Give beforeSelectionChange handlers a change to influence a
      // selection update.
      function filterSelectionChange(doc, sel, options) {
        var obj = {
          ranges: sel.ranges,
          update: function(ranges) {
            var this$1 = this;

            this.ranges = [];
            for (var i = 0; i < ranges.length; i++)
              { this$1.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                         clipPos(doc, ranges[i].head)); }
          },
          origin: options && options.origin
        };
        signal(doc, "beforeSelectionChange", doc, obj);
        if (doc.cm) { signal(doc.cm, "beforeSelectionChange", doc.cm, obj); }
        if (obj.ranges != sel.ranges) { return normalizeSelection(doc.cm, obj.ranges, obj.ranges.length - 1) }
        else { return sel }
      }

      function setSelectionReplaceHistory(doc, sel, options) {
        var done = doc.history.done, last = lst(done);
        if (last && last.ranges) {
          done[done.length - 1] = sel;
          setSelectionNoUndo(doc, sel, options);
        } else {
          setSelection(doc, sel, options);
        }
      }

      // Set a new selection.
      function setSelection(doc, sel, options) {
        setSelectionNoUndo(doc, sel, options);
        addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
      }

      function setSelectionNoUndo(doc, sel, options) {
        if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
          { sel = filterSelectionChange(doc, sel, options); }

        var bias = options && options.bias ||
          (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
        setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));

        if (!(options && options.scroll === false) && doc.cm)
          { ensureCursorVisible(doc.cm); }
      }

      function setSelectionInner(doc, sel) {
        if (sel.equals(doc.sel)) { return }

        doc.sel = sel;

        if (doc.cm) {
          doc.cm.curOp.updateInput = 1;
          doc.cm.curOp.selectionChanged = true;
          signalCursorActivity(doc.cm);
        }
        signalLater(doc, "cursorActivity", doc);
      }

      // Verify that the selection does not partially select any atomic
      // marked ranges.
      function reCheckSelection(doc) {
        setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
      }

      // Return a selection that does not partially select any atomic
      // ranges.
      function skipAtomicInSelection(doc, sel, bias, mayClear) {
        var out;
        for (var i = 0; i < sel.ranges.length; i++) {
          var range = sel.ranges[i];
          var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i];
          var newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear);
          var newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear);
          if (out || newAnchor != range.anchor || newHead != range.head) {
            if (!out) { out = sel.ranges.slice(0, i); }
            out[i] = new Range(newAnchor, newHead);
          }
        }
        return out ? normalizeSelection(doc.cm, out, sel.primIndex) : sel
      }

      function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
        var line = getLine(doc, pos.line);
        if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
          var sp = line.markedSpans[i], m = sp.marker;

          // Determine if we should prevent the cursor being placed to the left/right of an atomic marker
          // Historically this was determined using the inclusiveLeft/Right option, but the new way to control it
          // is with selectLeft/Right
          var preventCursorLeft = ("selectLeft" in m) ? !m.selectLeft : m.inclusiveLeft;
          var preventCursorRight = ("selectRight" in m) ? !m.selectRight : m.inclusiveRight;

          if ((sp.from == null || (preventCursorLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
              (sp.to == null || (preventCursorRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
            if (mayClear) {
              signal(m, "beforeCursorEnter");
              if (m.explicitlyCleared) {
                if (!line.markedSpans) { break }
                else {--i; continue}
              }
            }
            if (!m.atomic) { continue }

            if (oldPos) {
              var near = m.find(dir < 0 ? 1 : -1), diff = (void 0);
              if (dir < 0 ? preventCursorRight : preventCursorLeft)
                { near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null); }
              if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
                { return skipAtomicInner(doc, near, pos, dir, mayClear) }
            }

            var far = m.find(dir < 0 ? -1 : 1);
            if (dir < 0 ? preventCursorLeft : preventCursorRight)
              { far = movePos(doc, far, dir, far.line == pos.line ? line : null); }
            return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
          }
        } }
        return pos
      }

      // Ensure a given position is not inside an atomic range.
      function skipAtomic(doc, pos, oldPos, bias, mayClear) {
        var dir = bias || 1;
        var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
            (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
            skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
            (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true));
        if (!found) {
          doc.cantEdit = true;
          return Pos(doc.first, 0)
        }
        return found
      }

      function movePos(doc, pos, dir, line) {
        if (dir < 0 && pos.ch == 0) {
          if (pos.line > doc.first) { return clipPos(doc, Pos(pos.line - 1)) }
          else { return null }
        } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
          if (pos.line < doc.first + doc.size - 1) { return Pos(pos.line + 1, 0) }
          else { return null }
        } else {
          return new Pos(pos.line, pos.ch + dir)
        }
      }

      function selectAll(cm) {
        cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);
      }

      // UPDATING

      // Allow "beforeChange" event handlers to influence a change
      function filterChange(doc, change, update) {
        var obj = {
          canceled: false,
          from: change.from,
          to: change.to,
          text: change.text,
          origin: change.origin,
          cancel: function () { return obj.canceled = true; }
        };
        if (update) { obj.update = function (from, to, text, origin) {
          if (from) { obj.from = clipPos(doc, from); }
          if (to) { obj.to = clipPos(doc, to); }
          if (text) { obj.text = text; }
          if (origin !== undefined) { obj.origin = origin; }
        }; }
        signal(doc, "beforeChange", doc, obj);
        if (doc.cm) { signal(doc.cm, "beforeChange", doc.cm, obj); }

        if (obj.canceled) {
          if (doc.cm) { doc.cm.curOp.updateInput = 2; }
          return null
        }
        return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin}
      }

      // Apply a change to a document, and add it to the document's
      // history, and propagating it to all linked documents.
      function makeChange(doc, change, ignoreReadOnly) {
        if (doc.cm) {
          if (!doc.cm.curOp) { return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly) }
          if (doc.cm.state.suppressEdits) { return }
        }

        if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
          change = filterChange(doc, change, true);
          if (!change) { return }
        }

        // Possibly split or suppress the update based on the presence
        // of read-only spans in its range.
        var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
        if (split) {
          for (var i = split.length - 1; i >= 0; --i)
            { makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text, origin: change.origin}); }
        } else {
          makeChangeInner(doc, change);
        }
      }

      function makeChangeInner(doc, change) {
        if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) { return }
        var selAfter = computeSelAfterChange(doc, change);
        addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);

        makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
        var rebased = [];

        linkedDocs(doc, function (doc, sharedHist) {
          if (!sharedHist && indexOf(rebased, doc.history) == -1) {
            rebaseHist(doc.history, change);
            rebased.push(doc.history);
          }
          makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
        });
      }

      // Revert a change stored in a document's history.
      function makeChangeFromHistory(doc, type, allowSelectionOnly) {
        var suppress = doc.cm && doc.cm.state.suppressEdits;
        if (suppress && !allowSelectionOnly) { return }

        var hist = doc.history, event, selAfter = doc.sel;
        var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done;

        // Verify that there is a useable event (so that ctrl-z won't
        // needlessly clear selection events)
        var i = 0;
        for (; i < source.length; i++) {
          event = source[i];
          if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
            { break }
        }
        if (i == source.length) { return }
        hist.lastOrigin = hist.lastSelOrigin = null;

        for (;;) {
          event = source.pop();
          if (event.ranges) {
            pushSelectionToHistory(event, dest);
            if (allowSelectionOnly && !event.equals(doc.sel)) {
              setSelection(doc, event, {clearRedo: false});
              return
            }
            selAfter = event;
          } else if (suppress) {
            source.push(event);
            return
          } else { break }
        }

        // Build up a reverse change object to add to the opposite history
        // stack (redo when undoing, and vice versa).
        var antiChanges = [];
        pushSelectionToHistory(selAfter, dest);
        dest.push({changes: antiChanges, generation: hist.generation});
        hist.generation = event.generation || ++hist.maxGeneration;

        var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");

        var loop = function ( i ) {
          var change = event.changes[i];
          change.origin = type;
          if (filter && !filterChange(doc, change, false)) {
            source.length = 0;
            return {}
          }

          antiChanges.push(historyChangeFromChange(doc, change));

          var after = i ? computeSelAfterChange(doc, change) : lst(source);
          makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
          if (!i && doc.cm) { doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)}); }
          var rebased = [];

          // Propagate to the linked documents
          linkedDocs(doc, function (doc, sharedHist) {
            if (!sharedHist && indexOf(rebased, doc.history) == -1) {
              rebaseHist(doc.history, change);
              rebased.push(doc.history);
            }
            makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
          });
        };

        for (var i$1 = event.changes.length - 1; i$1 >= 0; --i$1) {
          var returned = loop( i$1 );

          if ( returned ) return returned.v;
        }
      }

      // Sub-views need their line numbers shifted when text is added
      // above or below them in the parent document.
      function shiftDoc(doc, distance) {
        if (distance == 0) { return }
        doc.first += distance;
        doc.sel = new Selection(map(doc.sel.ranges, function (range) { return new Range(
          Pos(range.anchor.line + distance, range.anchor.ch),
          Pos(range.head.line + distance, range.head.ch)
        ); }), doc.sel.primIndex);
        if (doc.cm) {
          regChange(doc.cm, doc.first, doc.first - distance, distance);
          for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
            { regLineChange(doc.cm, l, "gutter"); }
        }
      }

      // More lower-level change function, handling only a single document
      // (not linked ones).
      function makeChangeSingleDoc(doc, change, selAfter, spans) {
        if (doc.cm && !doc.cm.curOp)
          { return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans) }

        if (change.to.line < doc.first) {
          shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
          return
        }
        if (change.from.line > doc.lastLine()) { return }

        // Clip the change to the size of this doc
        if (change.from.line < doc.first) {
          var shift = change.text.length - 1 - (doc.first - change.from.line);
          shiftDoc(doc, shift);
          change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
                    text: [lst(change.text)], origin: change.origin};
        }
        var last = doc.lastLine();
        if (change.to.line > last) {
          change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
                    text: [change.text[0]], origin: change.origin};
        }

        change.removed = getBetween(doc, change.from, change.to);

        if (!selAfter) { selAfter = computeSelAfterChange(doc, change); }
        if (doc.cm) { makeChangeSingleDocInEditor(doc.cm, change, spans); }
        else { updateDoc(doc, change, spans); }
        setSelectionNoUndo(doc, selAfter, sel_dontScroll);

        if (doc.cantEdit && skipAtomic(doc, Pos(doc.firstLine(), 0)))
          { doc.cantEdit = false; }
      }

      // Handle the interaction of a change to a document with the editor
      // that this document is part of.
      function makeChangeSingleDocInEditor(cm, change, spans) {
        var doc = cm.doc, display = cm.display, from = change.from, to = change.to;

        var recomputeMaxLength = false, checkWidthStart = from.line;
        if (!cm.options.lineWrapping) {
          checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
          doc.iter(checkWidthStart, to.line + 1, function (line) {
            if (line == display.maxLine) {
              recomputeMaxLength = true;
              return true
            }
          });
        }

        if (doc.sel.contains(change.from, change.to) > -1)
          { signalCursorActivity(cm); }

        updateDoc(doc, change, spans, estimateHeight(cm));

        if (!cm.options.lineWrapping) {
          doc.iter(checkWidthStart, from.line + change.text.length, function (line) {
            var len = lineLength(line);
            if (len > display.maxLineLength) {
              display.maxLine = line;
              display.maxLineLength = len;
              display.maxLineChanged = true;
              recomputeMaxLength = false;
            }
          });
          if (recomputeMaxLength) { cm.curOp.updateMaxLine = true; }
        }

        retreatFrontier(doc, from.line);
        startWorker(cm, 400);

        var lendiff = change.text.length - (to.line - from.line) - 1;
        // Remember that these lines changed, for updating the display
        if (change.full)
          { regChange(cm); }
        else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
          { regLineChange(cm, from.line, "text"); }
        else
          { regChange(cm, from.line, to.line + 1, lendiff); }

        var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change");
        if (changeHandler || changesHandler) {
          var obj = {
            from: from, to: to,
            text: change.text,
            removed: change.removed,
            origin: change.origin
          };
          if (changeHandler) { signalLater(cm, "change", cm, obj); }
          if (changesHandler) { (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj); }
        }
        cm.display.selForContextMenu = null;
      }

      function replaceRange(doc, code, from, to, origin) {
        var assign;

        if (!to) { to = from; }
        if (cmp(to, from) < 0) { (assign = [to, from], from = assign[0], to = assign[1]); }
        if (typeof code == "string") { code = doc.splitLines(code); }
        makeChange(doc, {from: from, to: to, text: code, origin: origin});
      }

      // Rebasing/resetting history to deal with externally-sourced changes

      function rebaseHistSelSingle(pos, from, to, diff) {
        if (to < pos.line) {
          pos.line += diff;
        } else if (from < pos.line) {
          pos.line = from;
          pos.ch = 0;
        }
      }

      // Tries to rebase an array of history events given a change in the
      // document. If the change touches the same lines as the event, the
      // event, and everything 'behind' it, is discarded. If the change is
      // before the event, the event's positions are updated. Uses a
      // copy-on-write scheme for the positions, to avoid having to
      // reallocate them all on every rebase, but also avoid problems with
      // shared position objects being unsafely updated.
      function rebaseHistArray(array, from, to, diff) {
        for (var i = 0; i < array.length; ++i) {
          var sub = array[i], ok = true;
          if (sub.ranges) {
            if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true; }
            for (var j = 0; j < sub.ranges.length; j++) {
              rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
              rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
            }
            continue
          }
          for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
            var cur = sub.changes[j$1];
            if (to < cur.from.line) {
              cur.from = Pos(cur.from.line + diff, cur.from.ch);
              cur.to = Pos(cur.to.line + diff, cur.to.ch);
            } else if (from <= cur.to.line) {
              ok = false;
              break
            }
          }
          if (!ok) {
            array.splice(0, i + 1);
            i = 0;
          }
        }
      }

      function rebaseHist(hist, change) {
        var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
        rebaseHistArray(hist.done, from, to, diff);
        rebaseHistArray(hist.undone, from, to, diff);
      }

      // Utility for applying a change to a line by handle or number,
      // returning the number and optionally registering the line as
      // changed.
      function changeLine(doc, handle, changeType, op) {
        var no = handle, line = handle;
        if (typeof handle == "number") { line = getLine(doc, clipLine(doc, handle)); }
        else { no = lineNo(handle); }
        if (no == null) { return null }
        if (op(line, no) && doc.cm) { regLineChange(doc.cm, no, changeType); }
        return line
      }

      // The document is represented as a BTree consisting of leaves, with
      // chunk of lines in them, and branches, with up to ten leaves or
      // other branch nodes below them. The top node is always a branch
      // node, and is the document object itself (meaning it has
      // additional methods and properties).
      //
      // All nodes have parent links. The tree is used both to go from
      // line numbers to line objects, and to go from objects to numbers.
      // It also indexes by height, and is used to convert between height
      // and line object, and to find the total height of the document.
      //
      // See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

      function LeafChunk(lines) {
        var this$1 = this;

        this.lines = lines;
        this.parent = null;
        var height = 0;
        for (var i = 0; i < lines.length; ++i) {
          lines[i].parent = this$1;
          height += lines[i].height;
        }
        this.height = height;
      }

      LeafChunk.prototype = {
        chunkSize: function() { return this.lines.length },

        // Remove the n lines at offset 'at'.
        removeInner: function(at, n) {
          var this$1 = this;

          for (var i = at, e = at + n; i < e; ++i) {
            var line = this$1.lines[i];
            this$1.height -= line.height;
            cleanUpLine(line);
            signalLater(line, "delete");
          }
          this.lines.splice(at, n);
        },

        // Helper used to collapse a small branch into a single leaf.
        collapse: function(lines) {
          lines.push.apply(lines, this.lines);
        },

        // Insert the given array of lines at offset 'at', count them as
        // having the given height.
        insertInner: function(at, lines, height) {
          var this$1 = this;

          this.height += height;
          this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
          for (var i = 0; i < lines.length; ++i) { lines[i].parent = this$1; }
        },

        // Used to iterate over a part of the tree.
        iterN: function(at, n, op) {
          var this$1 = this;

          for (var e = at + n; at < e; ++at)
            { if (op(this$1.lines[at])) { return true } }
        }
      };

      function BranchChunk(children) {
        var this$1 = this;

        this.children = children;
        var size = 0, height = 0;
        for (var i = 0; i < children.length; ++i) {
          var ch = children[i];
          size += ch.chunkSize(); height += ch.height;
          ch.parent = this$1;
        }
        this.size = size;
        this.height = height;
        this.parent = null;
      }

      BranchChunk.prototype = {
        chunkSize: function() { return this.size },

        removeInner: function(at, n) {
          var this$1 = this;

          this.size -= n;
          for (var i = 0; i < this.children.length; ++i) {
            var child = this$1.children[i], sz = child.chunkSize();
            if (at < sz) {
              var rm = Math.min(n, sz - at), oldHeight = child.height;
              child.removeInner(at, rm);
              this$1.height -= oldHeight - child.height;
              if (sz == rm) { this$1.children.splice(i--, 1); child.parent = null; }
              if ((n -= rm) == 0) { break }
              at = 0;
            } else { at -= sz; }
          }
          // If the result is smaller than 25 lines, ensure that it is a
          // single leaf node.
          if (this.size - n < 25 &&
              (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
            var lines = [];
            this.collapse(lines);
            this.children = [new LeafChunk(lines)];
            this.children[0].parent = this;
          }
        },

        collapse: function(lines) {
          var this$1 = this;

          for (var i = 0; i < this.children.length; ++i) { this$1.children[i].collapse(lines); }
        },

        insertInner: function(at, lines, height) {
          var this$1 = this;

          this.size += lines.length;
          this.height += height;
          for (var i = 0; i < this.children.length; ++i) {
            var child = this$1.children[i], sz = child.chunkSize();
            if (at <= sz) {
              child.insertInner(at, lines, height);
              if (child.lines && child.lines.length > 50) {
                // To avoid memory thrashing when child.lines is huge (e.g. first view of a large file), it's never spliced.
                // Instead, small slices are taken. They're taken in order because sequential memory accesses are fastest.
                var remaining = child.lines.length % 25 + 25;
                for (var pos = remaining; pos < child.lines.length;) {
                  var leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
                  child.height -= leaf.height;
                  this$1.children.splice(++i, 0, leaf);
                  leaf.parent = this$1;
                }
                child.lines = child.lines.slice(0, remaining);
                this$1.maybeSpill();
              }
              break
            }
            at -= sz;
          }
        },

        // When a node has grown, check whether it should be split.
        maybeSpill: function() {
          if (this.children.length <= 10) { return }
          var me = this;
          do {
            var spilled = me.children.splice(me.children.length - 5, 5);
            var sibling = new BranchChunk(spilled);
            if (!me.parent) { // Become the parent node
              var copy = new BranchChunk(me.children);
              copy.parent = me;
              me.children = [copy, sibling];
              me = copy;
           } else {
              me.size -= sibling.size;
              me.height -= sibling.height;
              var myIndex = indexOf(me.parent.children, me);
              me.parent.children.splice(myIndex + 1, 0, sibling);
            }
            sibling.parent = me.parent;
          } while (me.children.length > 10)
          me.parent.maybeSpill();
        },

        iterN: function(at, n, op) {
          var this$1 = this;

          for (var i = 0; i < this.children.length; ++i) {
            var child = this$1.children[i], sz = child.chunkSize();
            if (at < sz) {
              var used = Math.min(n, sz - at);
              if (child.iterN(at, used, op)) { return true }
              if ((n -= used) == 0) { break }
              at = 0;
            } else { at -= sz; }
          }
        }
      };

      // Line widgets are block elements displayed above or below a line.

      var LineWidget = function(doc, node, options) {
        var this$1 = this;

        if (options) { for (var opt in options) { if (options.hasOwnProperty(opt))
          { this$1[opt] = options[opt]; } } }
        this.doc = doc;
        this.node = node;
      };

      LineWidget.prototype.clear = function () {
          var this$1 = this;

        var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line);
        if (no == null || !ws) { return }
        for (var i = 0; i < ws.length; ++i) { if (ws[i] == this$1) { ws.splice(i--, 1); } }
        if (!ws.length) { line.widgets = null; }
        var height = widgetHeight(this);
        updateLineHeight(line, Math.max(0, line.height - height));
        if (cm) {
          runInOp(cm, function () {
            adjustScrollWhenAboveVisible(cm, line, -height);
            regLineChange(cm, no, "widget");
          });
          signalLater(cm, "lineWidgetCleared", cm, this, no);
        }
      };

      LineWidget.prototype.changed = function () {
          var this$1 = this;

        var oldH = this.height, cm = this.doc.cm, line = this.line;
        this.height = null;
        var diff = widgetHeight(this) - oldH;
        if (!diff) { return }
        if (!lineIsHidden(this.doc, line)) { updateLineHeight(line, line.height + diff); }
        if (cm) {
          runInOp(cm, function () {
            cm.curOp.forceUpdate = true;
            adjustScrollWhenAboveVisible(cm, line, diff);
            signalLater(cm, "lineWidgetChanged", cm, this$1, lineNo(line));
          });
        }
      };
      eventMixin(LineWidget);

      function adjustScrollWhenAboveVisible(cm, line, diff) {
        if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
          { addToScrollTop(cm, diff); }
      }

      function addLineWidget(doc, handle, node, options) {
        var widget = new LineWidget(doc, node, options);
        var cm = doc.cm;
        if (cm && widget.noHScroll) { cm.display.alignWidgets = true; }
        changeLine(doc, handle, "widget", function (line) {
          var widgets = line.widgets || (line.widgets = []);
          if (widget.insertAt == null) { widgets.push(widget); }
          else { widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget); }
          widget.line = line;
          if (cm && !lineIsHidden(doc, line)) {
            var aboveVisible = heightAtLine(line) < doc.scrollTop;
            updateLineHeight(line, line.height + widgetHeight(widget));
            if (aboveVisible) { addToScrollTop(cm, widget.height); }
            cm.curOp.forceUpdate = true;
          }
          return true
        });
        if (cm) { signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle)); }
        return widget
      }

      // TEXTMARKERS

      // Created with markText and setBookmark methods. A TextMarker is a
      // handle that can be used to clear or find a marked position in the
      // document. Line objects hold arrays (markedSpans) containing
      // {from, to, marker} object pointing to such marker objects, and
      // indicating that such a marker is present on that line. Multiple
      // lines may point to the same marker when it spans across lines.
      // The spans will have null for their from/to properties when the
      // marker continues beyond the start/end of the line. Markers have
      // links back to the lines they currently touch.

      // Collapsed markers have unique ids, in order to be able to order
      // them, which is needed for uniquely determining an outer marker
      // when they overlap (they may nest, but not partially overlap).
      var nextMarkerId = 0;

      var TextMarker = function(doc, type) {
        this.lines = [];
        this.type = type;
        this.doc = doc;
        this.id = ++nextMarkerId;
      };

      // Clear the marker.
      TextMarker.prototype.clear = function () {
          var this$1 = this;

        if (this.explicitlyCleared) { return }
        var cm = this.doc.cm, withOp = cm && !cm.curOp;
        if (withOp) { startOperation(cm); }
        if (hasHandler(this, "clear")) {
          var found = this.find();
          if (found) { signalLater(this, "clear", found.from, found.to); }
        }
        var min = null, max = null;
        for (var i = 0; i < this.lines.length; ++i) {
          var line = this$1.lines[i];
          var span = getMarkedSpanFor(line.markedSpans, this$1);
          if (cm && !this$1.collapsed) { regLineChange(cm, lineNo(line), "text"); }
          else if (cm) {
            if (span.to != null) { max = lineNo(line); }
            if (span.from != null) { min = lineNo(line); }
          }
          line.markedSpans = removeMarkedSpan(line.markedSpans, span);
          if (span.from == null && this$1.collapsed && !lineIsHidden(this$1.doc, line) && cm)
            { updateLineHeight(line, textHeight(cm.display)); }
        }
        if (cm && this.collapsed && !cm.options.lineWrapping) { for (var i$1 = 0; i$1 < this.lines.length; ++i$1) {
          var visual = visualLine(this$1.lines[i$1]), len = lineLength(visual);
          if (len > cm.display.maxLineLength) {
            cm.display.maxLine = visual;
            cm.display.maxLineLength = len;
            cm.display.maxLineChanged = true;
          }
        } }

        if (min != null && cm && this.collapsed) { regChange(cm, min, max + 1); }
        this.lines.length = 0;
        this.explicitlyCleared = true;
        if (this.atomic && this.doc.cantEdit) {
          this.doc.cantEdit = false;
          if (cm) { reCheckSelection(cm.doc); }
        }
        if (cm) { signalLater(cm, "markerCleared", cm, this, min, max); }
        if (withOp) { endOperation(cm); }
        if (this.parent) { this.parent.clear(); }
      };

      // Find the position of the marker in the document. Returns a {from,
      // to} object by default. Side can be passed to get a specific side
      // -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
      // Pos objects returned contain a line object, rather than a line
      // number (used to prevent looking up the same line twice).
      TextMarker.prototype.find = function (side, lineObj) {
          var this$1 = this;

        if (side == null && this.type == "bookmark") { side = 1; }
        var from, to;
        for (var i = 0; i < this.lines.length; ++i) {
          var line = this$1.lines[i];
          var span = getMarkedSpanFor(line.markedSpans, this$1);
          if (span.from != null) {
            from = Pos(lineObj ? line : lineNo(line), span.from);
            if (side == -1) { return from }
          }
          if (span.to != null) {
            to = Pos(lineObj ? line : lineNo(line), span.to);
            if (side == 1) { return to }
          }
        }
        return from && {from: from, to: to}
      };

      // Signals that the marker's widget changed, and surrounding layout
      // should be recomputed.
      TextMarker.prototype.changed = function () {
          var this$1 = this;

        var pos = this.find(-1, true), widget = this, cm = this.doc.cm;
        if (!pos || !cm) { return }
        runInOp(cm, function () {
          var line = pos.line, lineN = lineNo(pos.line);
          var view = findViewForLine(cm, lineN);
          if (view) {
            clearLineMeasurementCacheFor(view);
            cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
          }
          cm.curOp.updateMaxLine = true;
          if (!lineIsHidden(widget.doc, line) && widget.height != null) {
            var oldHeight = widget.height;
            widget.height = null;
            var dHeight = widgetHeight(widget) - oldHeight;
            if (dHeight)
              { updateLineHeight(line, line.height + dHeight); }
          }
          signalLater(cm, "markerChanged", cm, this$1);
        });
      };

      TextMarker.prototype.attachLine = function (line) {
        if (!this.lines.length && this.doc.cm) {
          var op = this.doc.cm.curOp;
          if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
            { (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this); }
        }
        this.lines.push(line);
      };

      TextMarker.prototype.detachLine = function (line) {
        this.lines.splice(indexOf(this.lines, line), 1);
        if (!this.lines.length && this.doc.cm) {
          var op = this.doc.cm.curOp
          ;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
        }
      };
      eventMixin(TextMarker);

      // Create a marker, wire it up to the right lines, and
      function markText(doc, from, to, options, type) {
        // Shared markers (across linked documents) are handled separately
        // (markTextShared will call out to this again, once per
        // document).
        if (options && options.shared) { return markTextShared(doc, from, to, options, type) }
        // Ensure we are in an operation.
        if (doc.cm && !doc.cm.curOp) { return operation(doc.cm, markText)(doc, from, to, options, type) }

        var marker = new TextMarker(doc, type), diff = cmp(from, to);
        if (options) { copyObj(options, marker, false); }
        // Don't connect empty markers unless clearWhenEmpty is false
        if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
          { return marker }
        if (marker.replacedWith) {
          // Showing up as a widget implies collapsed (widget replaces text)
          marker.collapsed = true;
          marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget");
          if (!options.handleMouseEvents) { marker.widgetNode.setAttribute("cm-ignore-events", "true"); }
          if (options.insertLeft) { marker.widgetNode.insertLeft = true; }
        }
        if (marker.collapsed) {
          if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
              from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
            { throw new Error("Inserting collapsed marker partially overlapping an existing one") }
          seeCollapsedSpans();
        }

        if (marker.addToHistory)
          { addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN); }

        var curLine = from.line, cm = doc.cm, updateMaxLine;
        doc.iter(curLine, to.line + 1, function (line) {
          if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
            { updateMaxLine = true; }
          if (marker.collapsed && curLine != from.line) { updateLineHeight(line, 0); }
          addMarkedSpan(line, new MarkedSpan(marker,
                                             curLine == from.line ? from.ch : null,
                                             curLine == to.line ? to.ch : null));
          ++curLine;
        });
        // lineIsHidden depends on the presence of the spans, so needs a second pass
        if (marker.collapsed) { doc.iter(from.line, to.line + 1, function (line) {
          if (lineIsHidden(doc, line)) { updateLineHeight(line, 0); }
        }); }

        if (marker.clearOnEnter) { on(marker, "beforeCursorEnter", function () { return marker.clear(); }); }

        if (marker.readOnly) {
          seeReadOnlySpans();
          if (doc.history.done.length || doc.history.undone.length)
            { doc.clearHistory(); }
        }
        if (marker.collapsed) {
          marker.id = ++nextMarkerId;
          marker.atomic = true;
        }
        if (cm) {
          // Sync editor state
          if (updateMaxLine) { cm.curOp.updateMaxLine = true; }
          if (marker.collapsed)
            { regChange(cm, from.line, to.line + 1); }
          else if (marker.className || marker.startStyle || marker.endStyle || marker.css ||
                   marker.attributes || marker.title)
            { for (var i = from.line; i <= to.line; i++) { regLineChange(cm, i, "text"); } }
          if (marker.atomic) { reCheckSelection(cm.doc); }
          signalLater(cm, "markerAdded", cm, marker);
        }
        return marker
      }

      // SHARED TEXTMARKERS

      // A shared marker spans multiple linked documents. It is
      // implemented as a meta-marker-object controlling multiple normal
      // markers.
      var SharedTextMarker = function(markers, primary) {
        var this$1 = this;

        this.markers = markers;
        this.primary = primary;
        for (var i = 0; i < markers.length; ++i)
          { markers[i].parent = this$1; }
      };

      SharedTextMarker.prototype.clear = function () {
          var this$1 = this;

        if (this.explicitlyCleared) { return }
        this.explicitlyCleared = true;
        for (var i = 0; i < this.markers.length; ++i)
          { this$1.markers[i].clear(); }
        signalLater(this, "clear");
      };

      SharedTextMarker.prototype.find = function (side, lineObj) {
        return this.primary.find(side, lineObj)
      };
      eventMixin(SharedTextMarker);

      function markTextShared(doc, from, to, options, type) {
        options = copyObj(options);
        options.shared = false;
        var markers = [markText(doc, from, to, options, type)], primary = markers[0];
        var widget = options.widgetNode;
        linkedDocs(doc, function (doc) {
          if (widget) { options.widgetNode = widget.cloneNode(true); }
          markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
          for (var i = 0; i < doc.linked.length; ++i)
            { if (doc.linked[i].isParent) { return } }
          primary = lst(markers);
        });
        return new SharedTextMarker(markers, primary)
      }

      function findSharedMarkers(doc) {
        return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function (m) { return m.parent; })
      }

      function copySharedMarkers(doc, markers) {
        for (var i = 0; i < markers.length; i++) {
          var marker = markers[i], pos = marker.find();
          var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
          if (cmp(mFrom, mTo)) {
            var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
            marker.markers.push(subMark);
            subMark.parent = marker;
          }
        }
      }

      function detachSharedMarkers(markers) {
        var loop = function ( i ) {
          var marker = markers[i], linked = [marker.primary.doc];
          linkedDocs(marker.primary.doc, function (d) { return linked.push(d); });
          for (var j = 0; j < marker.markers.length; j++) {
            var subMarker = marker.markers[j];
            if (indexOf(linked, subMarker.doc) == -1) {
              subMarker.parent = null;
              marker.markers.splice(j--, 1);
            }
          }
        };

        for (var i = 0; i < markers.length; i++) loop( i );
      }

      var nextDocId = 0;
      var Doc = function(text, mode, firstLine, lineSep, direction) {
        if (!(this instanceof Doc)) { return new Doc(text, mode, firstLine, lineSep, direction) }
        if (firstLine == null) { firstLine = 0; }

        BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
        this.first = firstLine;
        this.scrollTop = this.scrollLeft = 0;
        this.cantEdit = false;
        this.cleanGeneration = 1;
        this.modeFrontier = this.highlightFrontier = firstLine;
        var start = Pos(firstLine, 0);
        this.sel = simpleSelection(start);
        this.history = new History(null);
        this.id = ++nextDocId;
        this.modeOption = mode;
        this.lineSep = lineSep;
        this.direction = (direction == "rtl") ? "rtl" : "ltr";
        this.extend = false;

        if (typeof text == "string") { text = this.splitLines(text); }
        updateDoc(this, {from: start, to: start, text: text});
        setSelection(this, simpleSelection(start), sel_dontScroll);
      };

      Doc.prototype = createObj(BranchChunk.prototype, {
        constructor: Doc,
        // Iterate over the document. Supports two forms -- with only one
        // argument, it calls that for each line in the document. With
        // three, it iterates over the range given by the first two (with
        // the second being non-inclusive).
        iter: function(from, to, op) {
          if (op) { this.iterN(from - this.first, to - from, op); }
          else { this.iterN(this.first, this.first + this.size, from); }
        },

        // Non-public interface for adding and removing lines.
        insert: function(at, lines) {
          var height = 0;
          for (var i = 0; i < lines.length; ++i) { height += lines[i].height; }
          this.insertInner(at - this.first, lines, height);
        },
        remove: function(at, n) { this.removeInner(at - this.first, n); },

        // From here, the methods are part of the public interface. Most
        // are also available from CodeMirror (editor) instances.

        getValue: function(lineSep) {
          var lines = getLines(this, this.first, this.first + this.size);
          if (lineSep === false) { return lines }
          return lines.join(lineSep || this.lineSeparator())
        },
        setValue: docMethodOp(function(code) {
          var top = Pos(this.first, 0), last = this.first + this.size - 1;
          makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                            text: this.splitLines(code), origin: "setValue", full: true}, true);
          if (this.cm) { scrollToCoords(this.cm, 0, 0); }
          setSelection(this, simpleSelection(top), sel_dontScroll);
        }),
        replaceRange: function(code, from, to, origin) {
          from = clipPos(this, from);
          to = to ? clipPos(this, to) : from;
          replaceRange(this, code, from, to, origin);
        },
        getRange: function(from, to, lineSep) {
          var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
          if (lineSep === false) { return lines }
          return lines.join(lineSep || this.lineSeparator())
        },

        getLine: function(line) {var l = this.getLineHandle(line); return l && l.text},

        getLineHandle: function(line) {if (isLine(this, line)) { return getLine(this, line) }},
        getLineNumber: function(line) {return lineNo(line)},

        getLineHandleVisualStart: function(line) {
          if (typeof line == "number") { line = getLine(this, line); }
          return visualLine(line)
        },

        lineCount: function() {return this.size},
        firstLine: function() {return this.first},
        lastLine: function() {return this.first + this.size - 1},

        clipPos: function(pos) {return clipPos(this, pos)},

        getCursor: function(start) {
          var range$$1 = this.sel.primary(), pos;
          if (start == null || start == "head") { pos = range$$1.head; }
          else if (start == "anchor") { pos = range$$1.anchor; }
          else if (start == "end" || start == "to" || start === false) { pos = range$$1.to(); }
          else { pos = range$$1.from(); }
          return pos
        },
        listSelections: function() { return this.sel.ranges },
        somethingSelected: function() {return this.sel.somethingSelected()},

        setCursor: docMethodOp(function(line, ch, options) {
          setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
        }),
        setSelection: docMethodOp(function(anchor, head, options) {
          setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
        }),
        extendSelection: docMethodOp(function(head, other, options) {
          extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
        }),
        extendSelections: docMethodOp(function(heads, options) {
          extendSelections(this, clipPosArray(this, heads), options);
        }),
        extendSelectionsBy: docMethodOp(function(f, options) {
          var heads = map(this.sel.ranges, f);
          extendSelections(this, clipPosArray(this, heads), options);
        }),
        setSelections: docMethodOp(function(ranges, primary, options) {
          var this$1 = this;

          if (!ranges.length) { return }
          var out = [];
          for (var i = 0; i < ranges.length; i++)
            { out[i] = new Range(clipPos(this$1, ranges[i].anchor),
                               clipPos(this$1, ranges[i].head)); }
          if (primary == null) { primary = Math.min(ranges.length - 1, this.sel.primIndex); }
          setSelection(this, normalizeSelection(this.cm, out, primary), options);
        }),
        addSelection: docMethodOp(function(anchor, head, options) {
          var ranges = this.sel.ranges.slice(0);
          ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
          setSelection(this, normalizeSelection(this.cm, ranges, ranges.length - 1), options);
        }),

        getSelection: function(lineSep) {
          var this$1 = this;

          var ranges = this.sel.ranges, lines;
          for (var i = 0; i < ranges.length; i++) {
            var sel = getBetween(this$1, ranges[i].from(), ranges[i].to());
            lines = lines ? lines.concat(sel) : sel;
          }
          if (lineSep === false) { return lines }
          else { return lines.join(lineSep || this.lineSeparator()) }
        },
        getSelections: function(lineSep) {
          var this$1 = this;

          var parts = [], ranges = this.sel.ranges;
          for (var i = 0; i < ranges.length; i++) {
            var sel = getBetween(this$1, ranges[i].from(), ranges[i].to());
            if (lineSep !== false) { sel = sel.join(lineSep || this$1.lineSeparator()); }
            parts[i] = sel;
          }
          return parts
        },
        replaceSelection: function(code, collapse, origin) {
          var dup = [];
          for (var i = 0; i < this.sel.ranges.length; i++)
            { dup[i] = code; }
          this.replaceSelections(dup, collapse, origin || "+input");
        },
        replaceSelections: docMethodOp(function(code, collapse, origin) {
          var this$1 = this;

          var changes = [], sel = this.sel;
          for (var i = 0; i < sel.ranges.length; i++) {
            var range$$1 = sel.ranges[i];
            changes[i] = {from: range$$1.from(), to: range$$1.to(), text: this$1.splitLines(code[i]), origin: origin};
          }
          var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
          for (var i$1 = changes.length - 1; i$1 >= 0; i$1--)
            { makeChange(this$1, changes[i$1]); }
          if (newSel) { setSelectionReplaceHistory(this, newSel); }
          else if (this.cm) { ensureCursorVisible(this.cm); }
        }),
        undo: docMethodOp(function() {makeChangeFromHistory(this, "undo");}),
        redo: docMethodOp(function() {makeChangeFromHistory(this, "redo");}),
        undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true);}),
        redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true);}),

        setExtending: function(val) {this.extend = val;},
        getExtending: function() {return this.extend},

        historySize: function() {
          var hist = this.history, done = 0, undone = 0;
          for (var i = 0; i < hist.done.length; i++) { if (!hist.done[i].ranges) { ++done; } }
          for (var i$1 = 0; i$1 < hist.undone.length; i$1++) { if (!hist.undone[i$1].ranges) { ++undone; } }
          return {undo: done, redo: undone}
        },
        clearHistory: function() {this.history = new History(this.history.maxGeneration);},

        markClean: function() {
          this.cleanGeneration = this.changeGeneration(true);
        },
        changeGeneration: function(forceSplit) {
          if (forceSplit)
            { this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null; }
          return this.history.generation
        },
        isClean: function (gen) {
          return this.history.generation == (gen || this.cleanGeneration)
        },

        getHistory: function() {
          return {done: copyHistoryArray(this.history.done),
                  undone: copyHistoryArray(this.history.undone)}
        },
        setHistory: function(histData) {
          var hist = this.history = new History(this.history.maxGeneration);
          hist.done = copyHistoryArray(histData.done.slice(0), null, true);
          hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
        },

        setGutterMarker: docMethodOp(function(line, gutterID, value) {
          return changeLine(this, line, "gutter", function (line) {
            var markers = line.gutterMarkers || (line.gutterMarkers = {});
            markers[gutterID] = value;
            if (!value && isEmpty(markers)) { line.gutterMarkers = null; }
            return true
          })
        }),

        clearGutter: docMethodOp(function(gutterID) {
          var this$1 = this;

          this.iter(function (line) {
            if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
              changeLine(this$1, line, "gutter", function () {
                line.gutterMarkers[gutterID] = null;
                if (isEmpty(line.gutterMarkers)) { line.gutterMarkers = null; }
                return true
              });
            }
          });
        }),

        lineInfo: function(line) {
          var n;
          if (typeof line == "number") {
            if (!isLine(this, line)) { return null }
            n = line;
            line = getLine(this, line);
            if (!line) { return null }
          } else {
            n = lineNo(line);
            if (n == null) { return null }
          }
          return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
                  textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
                  widgets: line.widgets}
        },

        addLineClass: docMethodOp(function(handle, where, cls) {
          return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
            var prop = where == "text" ? "textClass"
                     : where == "background" ? "bgClass"
                     : where == "gutter" ? "gutterClass" : "wrapClass";
            if (!line[prop]) { line[prop] = cls; }
            else if (classTest(cls).test(line[prop])) { return false }
            else { line[prop] += " " + cls; }
            return true
          })
        }),
        removeLineClass: docMethodOp(function(handle, where, cls) {
          return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
            var prop = where == "text" ? "textClass"
                     : where == "background" ? "bgClass"
                     : where == "gutter" ? "gutterClass" : "wrapClass";
            var cur = line[prop];
            if (!cur) { return false }
            else if (cls == null) { line[prop] = null; }
            else {
              var found = cur.match(classTest(cls));
              if (!found) { return false }
              var end = found.index + found[0].length;
              line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
            }
            return true
          })
        }),

        addLineWidget: docMethodOp(function(handle, node, options) {
          return addLineWidget(this, handle, node, options)
        }),
        removeLineWidget: function(widget) { widget.clear(); },

        markText: function(from, to, options) {
          return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range")
        },
        setBookmark: function(pos, options) {
          var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                          insertLeft: options && options.insertLeft,
                          clearWhenEmpty: false, shared: options && options.shared,
                          handleMouseEvents: options && options.handleMouseEvents};
          pos = clipPos(this, pos);
          return markText(this, pos, pos, realOpts, "bookmark")
        },
        findMarksAt: function(pos) {
          pos = clipPos(this, pos);
          var markers = [], spans = getLine(this, pos.line).markedSpans;
          if (spans) { for (var i = 0; i < spans.length; ++i) {
            var span = spans[i];
            if ((span.from == null || span.from <= pos.ch) &&
                (span.to == null || span.to >= pos.ch))
              { markers.push(span.marker.parent || span.marker); }
          } }
          return markers
        },
        findMarks: function(from, to, filter) {
          from = clipPos(this, from); to = clipPos(this, to);
          var found = [], lineNo$$1 = from.line;
          this.iter(from.line, to.line + 1, function (line) {
            var spans = line.markedSpans;
            if (spans) { for (var i = 0; i < spans.length; i++) {
              var span = spans[i];
              if (!(span.to != null && lineNo$$1 == from.line && from.ch >= span.to ||
                    span.from == null && lineNo$$1 != from.line ||
                    span.from != null && lineNo$$1 == to.line && span.from >= to.ch) &&
                  (!filter || filter(span.marker)))
                { found.push(span.marker.parent || span.marker); }
            } }
            ++lineNo$$1;
          });
          return found
        },
        getAllMarks: function() {
          var markers = [];
          this.iter(function (line) {
            var sps = line.markedSpans;
            if (sps) { for (var i = 0; i < sps.length; ++i)
              { if (sps[i].from != null) { markers.push(sps[i].marker); } } }
          });
          return markers
        },

        posFromIndex: function(off) {
          var ch, lineNo$$1 = this.first, sepSize = this.lineSeparator().length;
          this.iter(function (line) {
            var sz = line.text.length + sepSize;
            if (sz > off) { ch = off; return true }
            off -= sz;
            ++lineNo$$1;
          });
          return clipPos(this, Pos(lineNo$$1, ch))
        },
        indexFromPos: function (coords) {
          coords = clipPos(this, coords);
          var index = coords.ch;
          if (coords.line < this.first || coords.ch < 0) { return 0 }
          var sepSize = this.lineSeparator().length;
          this.iter(this.first, coords.line, function (line) { // iter aborts when callback returns a truthy value
            index += line.text.length + sepSize;
          });
          return index
        },

        copy: function(copyHistory) {
          var doc = new Doc(getLines(this, this.first, this.first + this.size),
                            this.modeOption, this.first, this.lineSep, this.direction);
          doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;
          doc.sel = this.sel;
          doc.extend = false;
          if (copyHistory) {
            doc.history.undoDepth = this.history.undoDepth;
            doc.setHistory(this.getHistory());
          }
          return doc
        },

        linkedDoc: function(options) {
          if (!options) { options = {}; }
          var from = this.first, to = this.first + this.size;
          if (options.from != null && options.from > from) { from = options.from; }
          if (options.to != null && options.to < to) { to = options.to; }
          var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
          if (options.sharedHist) { copy.history = this.history
          ; }(this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});
          copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];
          copySharedMarkers(copy, findSharedMarkers(this));
          return copy
        },
        unlinkDoc: function(other) {
          var this$1 = this;

          if (other instanceof CodeMirror) { other = other.doc; }
          if (this.linked) { for (var i = 0; i < this.linked.length; ++i) {
            var link = this$1.linked[i];
            if (link.doc != other) { continue }
            this$1.linked.splice(i, 1);
            other.unlinkDoc(this$1);
            detachSharedMarkers(findSharedMarkers(this$1));
            break
          } }
          // If the histories were shared, split them again
          if (other.history == this.history) {
            var splitIds = [other.id];
            linkedDocs(other, function (doc) { return splitIds.push(doc.id); }, true);
            other.history = new History(null);
            other.history.done = copyHistoryArray(this.history.done, splitIds);
            other.history.undone = copyHistoryArray(this.history.undone, splitIds);
          }
        },
        iterLinkedDocs: function(f) {linkedDocs(this, f);},

        getMode: function() {return this.mode},
        getEditor: function() {return this.cm},

        splitLines: function(str) {
          if (this.lineSep) { return str.split(this.lineSep) }
          return splitLinesAuto(str)
        },
        lineSeparator: function() { return this.lineSep || "\n" },

        setDirection: docMethodOp(function (dir) {
          if (dir != "rtl") { dir = "ltr"; }
          if (dir == this.direction) { return }
          this.direction = dir;
          this.iter(function (line) { return line.order = null; });
          if (this.cm) { directionChanged(this.cm); }
        })
      });

      // Public alias.
      Doc.prototype.eachLine = Doc.prototype.iter;

      // Kludge to work around strange IE behavior where it'll sometimes
      // re-fire a series of drag-related events right after the drop (#1551)
      var lastDrop = 0;

      function onDrop(e) {
        var cm = this;
        clearDragCursor(cm);
        if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
          { return }
        e_preventDefault(e);
        if (ie) { lastDrop = +new Date; }
        var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
        if (!pos || cm.isReadOnly()) { return }
        // Might be a file drop, in which case we simply extract the text
        // and insert it.
        if (files && files.length && window.FileReader && window.File) {
          var n = files.length, text = Array(n), read = 0;
          var loadFile = function (file, i) {
            if (cm.options.allowDropFileTypes &&
                indexOf(cm.options.allowDropFileTypes, file.type) == -1)
              { return }

            var reader = new FileReader;
            reader.onload = operation(cm, function () {
              var content = reader.result;
              if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) { content = ""; }
              text[i] = content;
              if (++read == n) {
                pos = clipPos(cm.doc, pos);
                var change = {from: pos, to: pos,
                              text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                              origin: "paste"};
                makeChange(cm.doc, change);
                setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
              }
            });
            reader.readAsText(file);
          };
          for (var i = 0; i < n; ++i) { loadFile(files[i], i); }
        } else { // Normal drop
          // Don't do a replace if the drop happened inside of the selected text.
          if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
            cm.state.draggingText(e);
            // Ensure the editor is re-focused
            setTimeout(function () { return cm.display.input.focus(); }, 20);
            return
          }
          try {
            var text$1 = e.dataTransfer.getData("Text");
            if (text$1) {
              var selected;
              if (cm.state.draggingText && !cm.state.draggingText.copy)
                { selected = cm.listSelections(); }
              setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
              if (selected) { for (var i$1 = 0; i$1 < selected.length; ++i$1)
                { replaceRange(cm.doc, "", selected[i$1].anchor, selected[i$1].head, "drag"); } }
              cm.replaceSelection(text$1, "around", "paste");
              cm.display.input.focus();
            }
          }
          catch(e){}
        }
      }

      function onDragStart(cm, e) {
        if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return }
        if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) { return }

        e.dataTransfer.setData("Text", cm.getSelection());
        e.dataTransfer.effectAllowed = "copyMove";

        // Use dummy image instead of default browsers image.
        // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
        if (e.dataTransfer.setDragImage && !safari) {
          var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
          img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
          if (presto) {
            img.width = img.height = 1;
            cm.display.wrapper.appendChild(img);
            // Force a relayout, or Opera won't use our image for some obscure reason
            img._top = img.offsetTop;
          }
          e.dataTransfer.setDragImage(img, 0, 0);
          if (presto) { img.parentNode.removeChild(img); }
        }
      }

      function onDragOver(cm, e) {
        var pos = posFromMouse(cm, e);
        if (!pos) { return }
        var frag = document.createDocumentFragment();
        drawSelectionCursor(cm, pos, frag);
        if (!cm.display.dragCursor) {
          cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
          cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
        }
        removeChildrenAndAdd(cm.display.dragCursor, frag);
      }

      function clearDragCursor(cm) {
        if (cm.display.dragCursor) {
          cm.display.lineSpace.removeChild(cm.display.dragCursor);
          cm.display.dragCursor = null;
        }
      }

      // These must be handled carefully, because naively registering a
      // handler for each editor will cause the editors to never be
      // garbage collected.

      function forEachCodeMirror(f) {
        if (!document.getElementsByClassName) { return }
        var byClass = document.getElementsByClassName("CodeMirror"), editors = [];
        for (var i = 0; i < byClass.length; i++) {
          var cm = byClass[i].CodeMirror;
          if (cm) { editors.push(cm); }
        }
        if (editors.length) { editors[0].operation(function () {
          for (var i = 0; i < editors.length; i++) { f(editors[i]); }
        }); }
      }

      var globalsRegistered = false;
      function ensureGlobalHandlers() {
        if (globalsRegistered) { return }
        registerGlobalHandlers();
        globalsRegistered = true;
      }
      function registerGlobalHandlers() {
        // When the window resizes, we need to refresh active editors.
        var resizeTimer;
        on(window, "resize", function () {
          if (resizeTimer == null) { resizeTimer = setTimeout(function () {
            resizeTimer = null;
            forEachCodeMirror(onResize);
          }, 100); }
        });
        // When the window loses focus, we want to show the editor as blurred
        on(window, "blur", function () { return forEachCodeMirror(onBlur); });
      }
      // Called when the window resizes
      function onResize(cm) {
        var d = cm.display;
        // Might be a text scaling operation, clear size caches.
        d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
        d.scrollbarsClipped = false;
        cm.setSize();
      }

      var keyNames = {
        3: "Pause", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
        19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
        36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
        46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
        106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 145: "ScrollLock",
        173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
        221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
        63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
      };

      // Number keys
      for (var i = 0; i < 10; i++) { keyNames[i + 48] = keyNames[i + 96] = String(i); }
      // Alphabetic keys
      for (var i$1 = 65; i$1 <= 90; i$1++) { keyNames[i$1] = String.fromCharCode(i$1); }
      // Function keys
      for (var i$2 = 1; i$2 <= 12; i$2++) { keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2; }

      var keyMap = {};

      keyMap.basic = {
        "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
        "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
        "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
        "Tab": "defaultTab", "Shift-Tab": "indentAuto",
        "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
        "Esc": "singleSelection"
      };
      // Note that the save and find-related commands aren't defined by
      // default. User code or addons can define them. Unknown commands
      // are simply ignored.
      keyMap.pcDefault = {
        "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
        "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
        "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
        "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
        "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
        "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
        "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
        "fallthrough": "basic"
      };
      // Very basic readline/emacs-style bindings, which are standard on Mac.
      keyMap.emacsy = {
        "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
        "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
        "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
        "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
        "Ctrl-O": "openLine"
      };
      keyMap.macDefault = {
        "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
        "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
        "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
        "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
        "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
        "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
        "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
        "fallthrough": ["basic", "emacsy"]
      };
      keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;

      // KEYMAP DISPATCH

      function normalizeKeyName(name) {
        var parts = name.split(/-(?!$)/);
        name = parts[parts.length - 1];
        var alt, ctrl, shift, cmd;
        for (var i = 0; i < parts.length - 1; i++) {
          var mod = parts[i];
          if (/^(cmd|meta|m)$/i.test(mod)) { cmd = true; }
          else if (/^a(lt)?$/i.test(mod)) { alt = true; }
          else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true; }
          else if (/^s(hift)?$/i.test(mod)) { shift = true; }
          else { throw new Error("Unrecognized modifier name: " + mod) }
        }
        if (alt) { name = "Alt-" + name; }
        if (ctrl) { name = "Ctrl-" + name; }
        if (cmd) { name = "Cmd-" + name; }
        if (shift) { name = "Shift-" + name; }
        return name
      }

      // This is a kludge to keep keymaps mostly working as raw objects
      // (backwards compatibility) while at the same time support features
      // like normalization and multi-stroke key bindings. It compiles a
      // new normalized keymap, and then updates the old object to reflect
      // this.
      function normalizeKeyMap(keymap) {
        var copy = {};
        for (var keyname in keymap) { if (keymap.hasOwnProperty(keyname)) {
          var value = keymap[keyname];
          if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) { continue }
          if (value == "...") { delete keymap[keyname]; continue }

          var keys = map(keyname.split(" "), normalizeKeyName);
          for (var i = 0; i < keys.length; i++) {
            var val = (void 0), name = (void 0);
            if (i == keys.length - 1) {
              name = keys.join(" ");
              val = value;
            } else {
              name = keys.slice(0, i + 1).join(" ");
              val = "...";
            }
            var prev = copy[name];
            if (!prev) { copy[name] = val; }
            else if (prev != val) { throw new Error("Inconsistent bindings for " + name) }
          }
          delete keymap[keyname];
        } }
        for (var prop in copy) { keymap[prop] = copy[prop]; }
        return keymap
      }

      function lookupKey(key, map$$1, handle, context) {
        map$$1 = getKeyMap(map$$1);
        var found = map$$1.call ? map$$1.call(key, context) : map$$1[key];
        if (found === false) { return "nothing" }
        if (found === "...") { return "multi" }
        if (found != null && handle(found)) { return "handled" }

        if (map$$1.fallthrough) {
          if (Object.prototype.toString.call(map$$1.fallthrough) != "[object Array]")
            { return lookupKey(key, map$$1.fallthrough, handle, context) }
          for (var i = 0; i < map$$1.fallthrough.length; i++) {
            var result = lookupKey(key, map$$1.fallthrough[i], handle, context);
            if (result) { return result }
          }
        }
      }

      // Modifier key presses don't count as 'real' key presses for the
      // purpose of keymap fallthrough.
      function isModifierKey(value) {
        var name = typeof value == "string" ? value : keyNames[value.keyCode];
        return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod"
      }

      function addModifierNames(name, event, noShift) {
        var base = name;
        if (event.altKey && base != "Alt") { name = "Alt-" + name; }
        if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") { name = "Ctrl-" + name; }
        if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") { name = "Cmd-" + name; }
        if (!noShift && event.shiftKey && base != "Shift") { name = "Shift-" + name; }
        return name
      }

      // Look up the name of a key as indicated by an event object.
      function keyName(event, noShift) {
        if (presto && event.keyCode == 34 && event["char"]) { return false }
        var name = keyNames[event.keyCode];
        if (name == null || event.altGraphKey) { return false }
        // Ctrl-ScrollLock has keyCode 3, same as Ctrl-Pause,
        // so we'll use event.code when available (Chrome 48+, FF 38+, Safari 10.1+)
        if (event.keyCode == 3 && event.code) { name = event.code; }
        return addModifierNames(name, event, noShift)
      }

      function getKeyMap(val) {
        return typeof val == "string" ? keyMap[val] : val
      }

      // Helper for deleting text near the selection(s), used to implement
      // backspace, delete, and similar functionality.
      function deleteNearSelection(cm, compute) {
        var ranges = cm.doc.sel.ranges, kill = [];
        // Build up a set of ranges to kill first, merging overlapping
        // ranges.
        for (var i = 0; i < ranges.length; i++) {
          var toKill = compute(ranges[i]);
          while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
            var replaced = kill.pop();
            if (cmp(replaced.from, toKill.from) < 0) {
              toKill.from = replaced.from;
              break
            }
          }
          kill.push(toKill);
        }
        // Next, remove those actual ranges.
        runInOp(cm, function () {
          for (var i = kill.length - 1; i >= 0; i--)
            { replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete"); }
          ensureCursorVisible(cm);
        });
      }

      function moveCharLogically(line, ch, dir) {
        var target = skipExtendingChars(line.text, ch + dir, dir);
        return target < 0 || target > line.text.length ? null : target
      }

      function moveLogically(line, start, dir) {
        var ch = moveCharLogically(line, start.ch, dir);
        return ch == null ? null : new Pos(start.line, ch, dir < 0 ? "after" : "before")
      }

      function endOfLine(visually, cm, lineObj, lineNo, dir) {
        if (visually) {
          var order = getOrder(lineObj, cm.doc.direction);
          if (order) {
            var part = dir < 0 ? lst(order) : order[0];
            var moveInStorageOrder = (dir < 0) == (part.level == 1);
            var sticky = moveInStorageOrder ? "after" : "before";
            var ch;
            // With a wrapped rtl chunk (possibly spanning multiple bidi parts),
            // it could be that the last bidi part is not on the last visual line,
            // since visual lines contain content order-consecutive chunks.
            // Thus, in rtl, we are looking for the first (content-order) character
            // in the rtl chunk that is on the last line (that is, the same line
            // as the last (content-order) character).
            if (part.level > 0 || cm.doc.direction == "rtl") {
              var prep = prepareMeasureForLine(cm, lineObj);
              ch = dir < 0 ? lineObj.text.length - 1 : 0;
              var targetTop = measureCharPrepared(cm, prep, ch).top;
              ch = findFirst(function (ch) { return measureCharPrepared(cm, prep, ch).top == targetTop; }, (dir < 0) == (part.level == 1) ? part.from : part.to - 1, ch);
              if (sticky == "before") { ch = moveCharLogically(lineObj, ch, 1); }
            } else { ch = dir < 0 ? part.to : part.from; }
            return new Pos(lineNo, ch, sticky)
          }
        }
        return new Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after")
      }

      function moveVisually(cm, line, start, dir) {
        var bidi = getOrder(line, cm.doc.direction);
        if (!bidi) { return moveLogically(line, start, dir) }
        if (start.ch >= line.text.length) {
          start.ch = line.text.length;
          start.sticky = "before";
        } else if (start.ch <= 0) {
          start.ch = 0;
          start.sticky = "after";
        }
        var partPos = getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos];
        if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
          // Case 1: We move within an ltr part in an ltr editor. Even with wrapped lines,
          // nothing interesting happens.
          return moveLogically(line, start, dir)
        }

        var mv = function (pos, dir) { return moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir); };
        var prep;
        var getWrappedLineExtent = function (ch) {
          if (!cm.options.lineWrapping) { return {begin: 0, end: line.text.length} }
          prep = prep || prepareMeasureForLine(cm, line);
          return wrappedLineExtentChar(cm, line, prep, ch)
        };
        var wrappedLineExtent = getWrappedLineExtent(start.sticky == "before" ? mv(start, -1) : start.ch);

        if (cm.doc.direction == "rtl" || part.level == 1) {
          var moveInStorageOrder = (part.level == 1) == (dir < 0);
          var ch = mv(start, moveInStorageOrder ? 1 : -1);
          if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
            // Case 2: We move within an rtl part or in an rtl editor on the same visual line
            var sticky = moveInStorageOrder ? "before" : "after";
            return new Pos(start.line, ch, sticky)
          }
        }

        // Case 3: Could not move within this bidi part in this visual line, so leave
        // the current bidi part

        var searchInVisualLine = function (partPos, dir, wrappedLineExtent) {
          var getRes = function (ch, moveInStorageOrder) { return moveInStorageOrder
            ? new Pos(start.line, mv(ch, 1), "before")
            : new Pos(start.line, ch, "after"); };

          for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
            var part = bidi[partPos];
            var moveInStorageOrder = (dir > 0) == (part.level != 1);
            var ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1);
            if (part.from <= ch && ch < part.to) { return getRes(ch, moveInStorageOrder) }
            ch = moveInStorageOrder ? part.from : mv(part.to, -1);
            if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end) { return getRes(ch, moveInStorageOrder) }
          }
        };

        // Case 3a: Look for other bidi parts on the same visual line
        var res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent);
        if (res) { return res }

        // Case 3b: Look for other bidi parts on the next visual line
        var nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1);
        if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
          res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
          if (res) { return res }
        }

        // Case 4: Nowhere to move
        return null
      }

      // Commands are parameter-less actions that can be performed on an
      // editor, mostly used for keybindings.
      var commands = {
        selectAll: selectAll,
        singleSelection: function (cm) { return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll); },
        killLine: function (cm) { return deleteNearSelection(cm, function (range) {
          if (range.empty()) {
            var len = getLine(cm.doc, range.head.line).text.length;
            if (range.head.ch == len && range.head.line < cm.lastLine())
              { return {from: range.head, to: Pos(range.head.line + 1, 0)} }
            else
              { return {from: range.head, to: Pos(range.head.line, len)} }
          } else {
            return {from: range.from(), to: range.to()}
          }
        }); },
        deleteLine: function (cm) { return deleteNearSelection(cm, function (range) { return ({
          from: Pos(range.from().line, 0),
          to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
        }); }); },
        delLineLeft: function (cm) { return deleteNearSelection(cm, function (range) { return ({
          from: Pos(range.from().line, 0), to: range.from()
        }); }); },
        delWrappedLineLeft: function (cm) { return deleteNearSelection(cm, function (range) {
          var top = cm.charCoords(range.head, "div").top + 5;
          var leftPos = cm.coordsChar({left: 0, top: top}, "div");
          return {from: leftPos, to: range.from()}
        }); },
        delWrappedLineRight: function (cm) { return deleteNearSelection(cm, function (range) {
          var top = cm.charCoords(range.head, "div").top + 5;
          var rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div");
          return {from: range.from(), to: rightPos }
        }); },
        undo: function (cm) { return cm.undo(); },
        redo: function (cm) { return cm.redo(); },
        undoSelection: function (cm) { return cm.undoSelection(); },
        redoSelection: function (cm) { return cm.redoSelection(); },
        goDocStart: function (cm) { return cm.extendSelection(Pos(cm.firstLine(), 0)); },
        goDocEnd: function (cm) { return cm.extendSelection(Pos(cm.lastLine())); },
        goLineStart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStart(cm, range.head.line); },
          {origin: "+move", bias: 1}
        ); },
        goLineStartSmart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStartSmart(cm, range.head); },
          {origin: "+move", bias: 1}
        ); },
        goLineEnd: function (cm) { return cm.extendSelectionsBy(function (range) { return lineEnd(cm, range.head.line); },
          {origin: "+move", bias: -1}
        ); },
        goLineRight: function (cm) { return cm.extendSelectionsBy(function (range) {
          var top = cm.cursorCoords(range.head, "div").top + 5;
          return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
        }, sel_move); },
        goLineLeft: function (cm) { return cm.extendSelectionsBy(function (range) {
          var top = cm.cursorCoords(range.head, "div").top + 5;
          return cm.coordsChar({left: 0, top: top}, "div")
        }, sel_move); },
        goLineLeftSmart: function (cm) { return cm.extendSelectionsBy(function (range) {
          var top = cm.cursorCoords(range.head, "div").top + 5;
          var pos = cm.coordsChar({left: 0, top: top}, "div");
          if (pos.ch < cm.getLine(pos.line).search(/\S/)) { return lineStartSmart(cm, range.head) }
          return pos
        }, sel_move); },
        goLineUp: function (cm) { return cm.moveV(-1, "line"); },
        goLineDown: function (cm) { return cm.moveV(1, "line"); },
        goPageUp: function (cm) { return cm.moveV(-1, "page"); },
        goPageDown: function (cm) { return cm.moveV(1, "page"); },
        goCharLeft: function (cm) { return cm.moveH(-1, "char"); },
        goCharRight: function (cm) { return cm.moveH(1, "char"); },
        goColumnLeft: function (cm) { return cm.moveH(-1, "column"); },
        goColumnRight: function (cm) { return cm.moveH(1, "column"); },
        goWordLeft: function (cm) { return cm.moveH(-1, "word"); },
        goGroupRight: function (cm) { return cm.moveH(1, "group"); },
        goGroupLeft: function (cm) { return cm.moveH(-1, "group"); },
        goWordRight: function (cm) { return cm.moveH(1, "word"); },
        delCharBefore: function (cm) { return cm.deleteH(-1, "char"); },
        delCharAfter: function (cm) { return cm.deleteH(1, "char"); },
        delWordBefore: function (cm) { return cm.deleteH(-1, "word"); },
        delWordAfter: function (cm) { return cm.deleteH(1, "word"); },
        delGroupBefore: function (cm) { return cm.deleteH(-1, "group"); },
        delGroupAfter: function (cm) { return cm.deleteH(1, "group"); },
        indentAuto: function (cm) { return cm.indentSelection("smart"); },
        indentMore: function (cm) { return cm.indentSelection("add"); },
        indentLess: function (cm) { return cm.indentSelection("subtract"); },
        insertTab: function (cm) { return cm.replaceSelection("\t"); },
        insertSoftTab: function (cm) {
          var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
          for (var i = 0; i < ranges.length; i++) {
            var pos = ranges[i].from();
            var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
            spaces.push(spaceStr(tabSize - col % tabSize));
          }
          cm.replaceSelections(spaces);
        },
        defaultTab: function (cm) {
          if (cm.somethingSelected()) { cm.indentSelection("add"); }
          else { cm.execCommand("insertTab"); }
        },
        // Swap the two chars left and right of each selection's head.
        // Move cursor behind the two swapped characters afterwards.
        //
        // Doesn't consider line feeds a character.
        // Doesn't scan more than one line above to find a character.
        // Doesn't do anything on an empty line.
        // Doesn't do anything with non-empty selections.
        transposeChars: function (cm) { return runInOp(cm, function () {
          var ranges = cm.listSelections(), newSel = [];
          for (var i = 0; i < ranges.length; i++) {
            if (!ranges[i].empty()) { continue }
            var cur = ranges[i].head, line = getLine(cm.doc, cur.line).text;
            if (line) {
              if (cur.ch == line.length) { cur = new Pos(cur.line, cur.ch - 1); }
              if (cur.ch > 0) {
                cur = new Pos(cur.line, cur.ch + 1);
                cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
                                Pos(cur.line, cur.ch - 2), cur, "+transpose");
              } else if (cur.line > cm.doc.first) {
                var prev = getLine(cm.doc, cur.line - 1).text;
                if (prev) {
                  cur = new Pos(cur.line, 1);
                  cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
                                  prev.charAt(prev.length - 1),
                                  Pos(cur.line - 1, prev.length - 1), cur, "+transpose");
                }
              }
            }
            newSel.push(new Range(cur, cur));
          }
          cm.setSelections(newSel);
        }); },
        newlineAndIndent: function (cm) { return runInOp(cm, function () {
          var sels = cm.listSelections();
          for (var i = sels.length - 1; i >= 0; i--)
            { cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input"); }
          sels = cm.listSelections();
          for (var i$1 = 0; i$1 < sels.length; i$1++)
            { cm.indentLine(sels[i$1].from().line, null, true); }
          ensureCursorVisible(cm);
        }); },
        openLine: function (cm) { return cm.replaceSelection("\n", "start"); },
        toggleOverwrite: function (cm) { return cm.toggleOverwrite(); }
      };


      function lineStart(cm, lineN) {
        var line = getLine(cm.doc, lineN);
        var visual = visualLine(line);
        if (visual != line) { lineN = lineNo(visual); }
        return endOfLine(true, cm, visual, lineN, 1)
      }
      function lineEnd(cm, lineN) {
        var line = getLine(cm.doc, lineN);
        var visual = visualLineEnd(line);
        if (visual != line) { lineN = lineNo(visual); }
        return endOfLine(true, cm, line, lineN, -1)
      }
      function lineStartSmart(cm, pos) {
        var start = lineStart(cm, pos.line);
        var line = getLine(cm.doc, start.line);
        var order = getOrder(line, cm.doc.direction);
        if (!order || order[0].level == 0) {
          var firstNonWS = Math.max(0, line.text.search(/\S/));
          var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
          return Pos(start.line, inWS ? 0 : firstNonWS, start.sticky)
        }
        return start
      }

      // Run a handler that was bound to a key.
      function doHandleBinding(cm, bound, dropShift) {
        if (typeof bound == "string") {
          bound = commands[bound];
          if (!bound) { return false }
        }
        // Ensure previous input has been read, so that the handler sees a
        // consistent view of the document
        cm.display.input.ensurePolled();
        var prevShift = cm.display.shift, done = false;
        try {
          if (cm.isReadOnly()) { cm.state.suppressEdits = true; }
          if (dropShift) { cm.display.shift = false; }
          done = bound(cm) != Pass;
        } finally {
          cm.display.shift = prevShift;
          cm.state.suppressEdits = false;
        }
        return done
      }

      function lookupKeyForEditor(cm, name, handle) {
        for (var i = 0; i < cm.state.keyMaps.length; i++) {
          var result = lookupKey(name, cm.state.keyMaps[i], handle, cm);
          if (result) { return result }
        }
        return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
          || lookupKey(name, cm.options.keyMap, handle, cm)
      }

      // Note that, despite the name, this function is also used to check
      // for bound mouse clicks.

      var stopSeq = new Delayed;

      function dispatchKey(cm, name, e, handle) {
        var seq = cm.state.keySeq;
        if (seq) {
          if (isModifierKey(name)) { return "handled" }
          if (/\'$/.test(name))
            { cm.state.keySeq = null; }
          else
            { stopSeq.set(50, function () {
              if (cm.state.keySeq == seq) {
                cm.state.keySeq = null;
                cm.display.input.reset();
              }
            }); }
          if (dispatchKeyInner(cm, seq + " " + name, e, handle)) { return true }
        }
        return dispatchKeyInner(cm, name, e, handle)
      }

      function dispatchKeyInner(cm, name, e, handle) {
        var result = lookupKeyForEditor(cm, name, handle);

        if (result == "multi")
          { cm.state.keySeq = name; }
        if (result == "handled")
          { signalLater(cm, "keyHandled", cm, name, e); }

        if (result == "handled" || result == "multi") {
          e_preventDefault(e);
          restartBlink(cm);
        }

        return !!result
      }

      // Handle a key from the keydown event.
      function handleKeyBinding(cm, e) {
        var name = keyName(e, true);
        if (!name) { return false }

        if (e.shiftKey && !cm.state.keySeq) {
          // First try to resolve full name (including 'Shift-'). Failing
          // that, see if there is a cursor-motion command (starting with
          // 'go') bound to the keyname without 'Shift-'.
          return dispatchKey(cm, "Shift-" + name, e, function (b) { return doHandleBinding(cm, b, true); })
              || dispatchKey(cm, name, e, function (b) {
                   if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
                     { return doHandleBinding(cm, b) }
                 })
        } else {
          return dispatchKey(cm, name, e, function (b) { return doHandleBinding(cm, b); })
        }
      }

      // Handle a key from the keypress event
      function handleCharBinding(cm, e, ch) {
        return dispatchKey(cm, "'" + ch + "'", e, function (b) { return doHandleBinding(cm, b, true); })
      }

      var lastStoppedKey = null;
      function onKeyDown(e) {
        var cm = this;
        cm.curOp.focus = activeElt();
        if (signalDOMEvent(cm, e)) { return }
        // IE does strange things with escape.
        if (ie && ie_version < 11 && e.keyCode == 27) { e.returnValue = false; }
        var code = e.keyCode;
        cm.display.shift = code == 16 || e.shiftKey;
        var handled = handleKeyBinding(cm, e);
        if (presto) {
          lastStoppedKey = handled ? code : null;
          // Opera has no cut event... we try to at least catch the key combo
          if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
            { cm.replaceSelection("", null, "cut"); }
        }
        if (gecko && !mac && !handled && code == 46 && e.shiftKey && !e.ctrlKey && document.execCommand)
          { document.execCommand("cut"); }

        // Turn mouse into crosshair when Alt is held on Mac.
        if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
          { showCrossHair(cm); }
      }

      function showCrossHair(cm) {
        var lineDiv = cm.display.lineDiv;
        addClass(lineDiv, "CodeMirror-crosshair");

        function up(e) {
          if (e.keyCode == 18 || !e.altKey) {
            rmClass(lineDiv, "CodeMirror-crosshair");
            off(document, "keyup", up);
            off(document, "mouseover", up);
          }
        }
        on(document, "keyup", up);
        on(document, "mouseover", up);
      }

      function onKeyUp(e) {
        if (e.keyCode == 16) { this.doc.sel.shift = false; }
        signalDOMEvent(this, e);
      }

      function onKeyPress(e) {
        var cm = this;
        if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) { return }
        var keyCode = e.keyCode, charCode = e.charCode;
        if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
        if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) { return }
        var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
        // Some browsers fire keypress events for backspace
        if (ch == "\x08") { return }
        if (handleCharBinding(cm, e, ch)) { return }
        cm.display.input.onKeyPress(e);
      }

      var DOUBLECLICK_DELAY = 400;

      var PastClick = function(time, pos, button) {
        this.time = time;
        this.pos = pos;
        this.button = button;
      };

      PastClick.prototype.compare = function (time, pos, button) {
        return this.time + DOUBLECLICK_DELAY > time &&
          cmp(pos, this.pos) == 0 && button == this.button
      };

      var lastClick, lastDoubleClick;
      function clickRepeat(pos, button) {
        var now = +new Date;
        if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
          lastClick = lastDoubleClick = null;
          return "triple"
        } else if (lastClick && lastClick.compare(now, pos, button)) {
          lastDoubleClick = new PastClick(now, pos, button);
          lastClick = null;
          return "double"
        } else {
          lastClick = new PastClick(now, pos, button);
          lastDoubleClick = null;
          return "single"
        }
      }

      // A mouse down can be a single click, double click, triple click,
      // start of selection drag, start of text drag, new cursor
      // (ctrl-click), rectangle drag (alt-drag), or xwin
      // middle-click-paste. Or it might be a click on something we should
      // not interfere with, such as a scrollbar or widget.
      function onMouseDown(e) {
        var cm = this, display = cm.display;
        if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) { return }
        display.input.ensurePolled();
        display.shift = e.shiftKey;

        if (eventInWidget(display, e)) {
          if (!webkit) {
            // Briefly turn off draggability, to allow widgets to do
            // normal dragging things.
            display.scroller.draggable = false;
            setTimeout(function () { return display.scroller.draggable = true; }, 100);
          }
          return
        }
        if (clickInGutter(cm, e)) { return }
        var pos = posFromMouse(cm, e), button = e_button(e), repeat = pos ? clickRepeat(pos, button) : "single";
        window.focus();

        // #3261: make sure, that we're not starting a second selection
        if (button == 1 && cm.state.selectingText)
          { cm.state.selectingText(e); }

        if (pos && handleMappedButton(cm, button, pos, repeat, e)) { return }

        if (button == 1) {
          if (pos) { leftButtonDown(cm, pos, repeat, e); }
          else if (e_target(e) == display.scroller) { e_preventDefault(e); }
        } else if (button == 2) {
          if (pos) { extendSelection(cm.doc, pos); }
          setTimeout(function () { return display.input.focus(); }, 20);
        } else if (button == 3) {
          if (captureRightClick) { cm.display.input.onContextMenu(e); }
          else { delayBlurEvent(cm); }
        }
      }

      function handleMappedButton(cm, button, pos, repeat, event) {
        var name = "Click";
        if (repeat == "double") { name = "Double" + name; }
        else if (repeat == "triple") { name = "Triple" + name; }
        name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;

        return dispatchKey(cm,  addModifierNames(name, event), event, function (bound) {
          if (typeof bound == "string") { bound = commands[bound]; }
          if (!bound) { return false }
          var done = false;
          try {
            if (cm.isReadOnly()) { cm.state.suppressEdits = true; }
            done = bound(cm, pos) != Pass;
          } finally {
            cm.state.suppressEdits = false;
          }
          return done
        })
      }

      function configureMouse(cm, repeat, event) {
        var option = cm.getOption("configureMouse");
        var value = option ? option(cm, repeat, event) : {};
        if (value.unit == null) {
          var rect = chromeOS ? event.shiftKey && event.metaKey : event.altKey;
          value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
        }
        if (value.extend == null || cm.doc.extend) { value.extend = cm.doc.extend || event.shiftKey; }
        if (value.addNew == null) { value.addNew = mac ? event.metaKey : event.ctrlKey; }
        if (value.moveOnDrag == null) { value.moveOnDrag = !(mac ? event.altKey : event.ctrlKey); }
        return value
      }

      function leftButtonDown(cm, pos, repeat, event) {
        if (ie) { setTimeout(bind(ensureFocus, cm), 0); }
        else { cm.curOp.focus = activeElt(); }

        var behavior = configureMouse(cm, repeat, event);

        var sel = cm.doc.sel, contained;
        if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
            repeat == "single" && (contained = sel.contains(pos)) > -1 &&
            (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) &&
            (cmp(contained.to(), pos) > 0 || pos.xRel < 0))
          { leftButtonStartDrag(cm, event, pos, behavior); }
        else
          { leftButtonSelect(cm, event, pos, behavior); }
      }

      // Start a text drag. When it ends, see if any dragging actually
      // happen, and treat as a click if it didn't.
      function leftButtonStartDrag(cm, event, pos, behavior) {
        var display = cm.display, moved = false;
        var dragEnd = operation(cm, function (e) {
          if (webkit) { display.scroller.draggable = false; }
          cm.state.draggingText = false;
          off(display.wrapper.ownerDocument, "mouseup", dragEnd);
          off(display.wrapper.ownerDocument, "mousemove", mouseMove);
          off(display.scroller, "dragstart", dragStart);
          off(display.scroller, "drop", dragEnd);
          if (!moved) {
            e_preventDefault(e);
            if (!behavior.addNew)
              { extendSelection(cm.doc, pos, null, null, behavior.extend); }
            // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
            if (webkit || ie && ie_version == 9)
              { setTimeout(function () {display.wrapper.ownerDocument.body.focus(); display.input.focus();}, 20); }
            else
              { display.input.focus(); }
          }
        });
        var mouseMove = function(e2) {
          moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
        };
        var dragStart = function () { return moved = true; };
        // Let the drag handler handle this.
        if (webkit) { display.scroller.draggable = true; }
        cm.state.draggingText = dragEnd;
        dragEnd.copy = !behavior.moveOnDrag;
        // IE's approach to draggable
        if (display.scroller.dragDrop) { display.scroller.dragDrop(); }
        on(display.wrapper.ownerDocument, "mouseup", dragEnd);
        on(display.wrapper.ownerDocument, "mousemove", mouseMove);
        on(display.scroller, "dragstart", dragStart);
        on(display.scroller, "drop", dragEnd);

        delayBlurEvent(cm);
        setTimeout(function () { return display.input.focus(); }, 20);
      }

      function rangeForUnit(cm, pos, unit) {
        if (unit == "char") { return new Range(pos, pos) }
        if (unit == "word") { return cm.findWordAt(pos) }
        if (unit == "line") { return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))) }
        var result = unit(cm, pos);
        return new Range(result.from, result.to)
      }

      // Normal selection, as opposed to text dragging.
      function leftButtonSelect(cm, event, start, behavior) {
        var display = cm.display, doc = cm.doc;
        e_preventDefault(event);

        var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
        if (behavior.addNew && !behavior.extend) {
          ourIndex = doc.sel.contains(start);
          if (ourIndex > -1)
            { ourRange = ranges[ourIndex]; }
          else
            { ourRange = new Range(start, start); }
        } else {
          ourRange = doc.sel.primary();
          ourIndex = doc.sel.primIndex;
        }

        if (behavior.unit == "rectangle") {
          if (!behavior.addNew) { ourRange = new Range(start, start); }
          start = posFromMouse(cm, event, true, true);
          ourIndex = -1;
        } else {
          var range$$1 = rangeForUnit(cm, start, behavior.unit);
          if (behavior.extend)
            { ourRange = extendRange(ourRange, range$$1.anchor, range$$1.head, behavior.extend); }
          else
            { ourRange = range$$1; }
        }

        if (!behavior.addNew) {
          ourIndex = 0;
          setSelection(doc, new Selection([ourRange], 0), sel_mouse);
          startSel = doc.sel;
        } else if (ourIndex == -1) {
          ourIndex = ranges.length;
          setSelection(doc, normalizeSelection(cm, ranges.concat([ourRange]), ourIndex),
                       {scroll: false, origin: "*mouse"});
        } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
          setSelection(doc, normalizeSelection(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                       {scroll: false, origin: "*mouse"});
          startSel = doc.sel;
        } else {
          replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
        }

        var lastPos = start;
        function extendTo(pos) {
          if (cmp(lastPos, pos) == 0) { return }
          lastPos = pos;

          if (behavior.unit == "rectangle") {
            var ranges = [], tabSize = cm.options.tabSize;
            var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize);
            var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
            var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
            for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
                 line <= end; line++) {
              var text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize);
              if (left == right)
                { ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos))); }
              else if (text.length > leftPos)
                { ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize)))); }
            }
            if (!ranges.length) { ranges.push(new Range(start, start)); }
            setSelection(doc, normalizeSelection(cm, startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                         {origin: "*mouse", scroll: false});
            cm.scrollIntoView(pos);
          } else {
            var oldRange = ourRange;
            var range$$1 = rangeForUnit(cm, pos, behavior.unit);
            var anchor = oldRange.anchor, head;
            if (cmp(range$$1.anchor, anchor) > 0) {
              head = range$$1.head;
              anchor = minPos(oldRange.from(), range$$1.anchor);
            } else {
              head = range$$1.anchor;
              anchor = maxPos(oldRange.to(), range$$1.head);
            }
            var ranges$1 = startSel.ranges.slice(0);
            ranges$1[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head));
            setSelection(doc, normalizeSelection(cm, ranges$1, ourIndex), sel_mouse);
          }
        }

        var editorSize = display.wrapper.getBoundingClientRect();
        // Used to ensure timeout re-tries don't fire when another extend
        // happened in the meantime (clearTimeout isn't reliable -- at
        // least on Chrome, the timeouts still happen even when cleared,
        // if the clear happens after their scheduled firing time).
        var counter = 0;

        function extend(e) {
          var curCount = ++counter;
          var cur = posFromMouse(cm, e, true, behavior.unit == "rectangle");
          if (!cur) { return }
          if (cmp(cur, lastPos) != 0) {
            cm.curOp.focus = activeElt();
            extendTo(cur);
            var visible = visibleLines(display, doc);
            if (cur.line >= visible.to || cur.line < visible.from)
              { setTimeout(operation(cm, function () {if (counter == curCount) { extend(e); }}), 150); }
          } else {
            var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
            if (outside) { setTimeout(operation(cm, function () {
              if (counter != curCount) { return }
              display.scroller.scrollTop += outside;
              extend(e);
            }), 50); }
          }
        }

        function done(e) {
          cm.state.selectingText = false;
          counter = Infinity;
          // If e is null or undefined we interpret this as someone trying
          // to explicitly cancel the selection rather than the user
          // letting go of the mouse button.
          if (e) {
            e_preventDefault(e);
            display.input.focus();
          }
          off(display.wrapper.ownerDocument, "mousemove", move);
          off(display.wrapper.ownerDocument, "mouseup", up);
          doc.history.lastSelOrigin = null;
        }

        var move = operation(cm, function (e) {
          if (e.buttons === 0 || !e_button(e)) { done(e); }
          else { extend(e); }
        });
        var up = operation(cm, done);
        cm.state.selectingText = up;
        on(display.wrapper.ownerDocument, "mousemove", move);
        on(display.wrapper.ownerDocument, "mouseup", up);
      }

      // Used when mouse-selecting to adjust the anchor to the proper side
      // of a bidi jump depending on the visual position of the head.
      function bidiSimplify(cm, range$$1) {
        var anchor = range$$1.anchor;
        var head = range$$1.head;
        var anchorLine = getLine(cm.doc, anchor.line);
        if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) { return range$$1 }
        var order = getOrder(anchorLine);
        if (!order) { return range$$1 }
        var index = getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index];
        if (part.from != anchor.ch && part.to != anchor.ch) { return range$$1 }
        var boundary = index + ((part.from == anchor.ch) == (part.level != 1) ? 0 : 1);
        if (boundary == 0 || boundary == order.length) { return range$$1 }

        // Compute the relative visual position of the head compared to the
        // anchor (<0 is to the left, >0 to the right)
        var leftSide;
        if (head.line != anchor.line) {
          leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
        } else {
          var headIndex = getBidiPartAt(order, head.ch, head.sticky);
          var dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
          if (headIndex == boundary - 1 || headIndex == boundary)
            { leftSide = dir < 0; }
          else
            { leftSide = dir > 0; }
        }

        var usePart = order[boundary + (leftSide ? -1 : 0)];
        var from = leftSide == (usePart.level == 1);
        var ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before";
        return anchor.ch == ch && anchor.sticky == sticky ? range$$1 : new Range(new Pos(anchor.line, ch, sticky), head)
      }


      // Determines whether an event happened in the gutter, and fires the
      // handlers for the corresponding event.
      function gutterEvent(cm, e, type, prevent) {
        var mX, mY;
        if (e.touches) {
          mX = e.touches[0].clientX;
          mY = e.touches[0].clientY;
        } else {
          try { mX = e.clientX; mY = e.clientY; }
          catch(e) { return false }
        }
        if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) { return false }
        if (prevent) { e_preventDefault(e); }

        var display = cm.display;
        var lineBox = display.lineDiv.getBoundingClientRect();

        if (mY > lineBox.bottom || !hasHandler(cm, type)) { return e_defaultPrevented(e) }
        mY -= lineBox.top - display.viewOffset;

        for (var i = 0; i < cm.display.gutterSpecs.length; ++i) {
          var g = display.gutters.childNodes[i];
          if (g && g.getBoundingClientRect().right >= mX) {
            var line = lineAtHeight(cm.doc, mY);
            var gutter = cm.display.gutterSpecs[i];
            signal(cm, type, cm, line, gutter.className, e);
            return e_defaultPrevented(e)
          }
        }
      }

      function clickInGutter(cm, e) {
        return gutterEvent(cm, e, "gutterClick", true)
      }

      // CONTEXT MENU HANDLING

      // To make the context menu work, we need to briefly unhide the
      // textarea (making it as unobtrusive as possible) to let the
      // right-click take effect on it.
      function onContextMenu(cm, e) {
        if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) { return }
        if (signalDOMEvent(cm, e, "contextmenu")) { return }
        if (!captureRightClick) { cm.display.input.onContextMenu(e); }
      }

      function contextMenuInGutter(cm, e) {
        if (!hasHandler(cm, "gutterContextMenu")) { return false }
        return gutterEvent(cm, e, "gutterContextMenu", false)
      }

      function themeChanged(cm) {
        cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
          cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
        clearCaches(cm);
      }

      var Init = {toString: function(){return "CodeMirror.Init"}};

      var defaults = {};
      var optionHandlers = {};

      function defineOptions(CodeMirror) {
        var optionHandlers = CodeMirror.optionHandlers;

        function option(name, deflt, handle, notOnInit) {
          CodeMirror.defaults[name] = deflt;
          if (handle) { optionHandlers[name] =
            notOnInit ? function (cm, val, old) {if (old != Init) { handle(cm, val, old); }} : handle; }
        }

        CodeMirror.defineOption = option;

        // Passed to option handlers when there is no old value.
        CodeMirror.Init = Init;

        // These two are, on init, called from the constructor because they
        // have to be initialized before the editor can start at all.
        option("value", "", function (cm, val) { return cm.setValue(val); }, true);
        option("mode", null, function (cm, val) {
          cm.doc.modeOption = val;
          loadMode(cm);
        }, true);

        option("indentUnit", 2, loadMode, true);
        option("indentWithTabs", false);
        option("smartIndent", true);
        option("tabSize", 4, function (cm) {
          resetModeState(cm);
          clearCaches(cm);
          regChange(cm);
        }, true);

        option("lineSeparator", null, function (cm, val) {
          cm.doc.lineSep = val;
          if (!val) { return }
          var newBreaks = [], lineNo = cm.doc.first;
          cm.doc.iter(function (line) {
            for (var pos = 0;;) {
              var found = line.text.indexOf(val, pos);
              if (found == -1) { break }
              pos = found + val.length;
              newBreaks.push(Pos(lineNo, found));
            }
            lineNo++;
          });
          for (var i = newBreaks.length - 1; i >= 0; i--)
            { replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length)); }
        });
        option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, function (cm, val, old) {
          cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
          if (old != Init) { cm.refresh(); }
        });
        option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function (cm) { return cm.refresh(); }, true);
        option("electricChars", true);
        option("inputStyle", mobile ? "contenteditable" : "textarea", function () {
          throw new Error("inputStyle can not (yet) be changed in a running editor") // FIXME
        }, true);
        option("spellcheck", false, function (cm, val) { return cm.getInputField().spellcheck = val; }, true);
        option("autocorrect", false, function (cm, val) { return cm.getInputField().autocorrect = val; }, true);
        option("autocapitalize", false, function (cm, val) { return cm.getInputField().autocapitalize = val; }, true);
        option("rtlMoveVisually", !windows);
        option("wholeLineUpdateBefore", true);

        option("theme", "default", function (cm) {
          themeChanged(cm);
          updateGutters(cm);
        }, true);
        option("keyMap", "default", function (cm, val, old) {
          var next = getKeyMap(val);
          var prev = old != Init && getKeyMap(old);
          if (prev && prev.detach) { prev.detach(cm, next); }
          if (next.attach) { next.attach(cm, prev || null); }
        });
        option("extraKeys", null);
        option("configureMouse", null);

        option("lineWrapping", false, wrappingChanged, true);
        option("gutters", [], function (cm, val) {
          cm.display.gutterSpecs = getGutters(val, cm.options.lineNumbers);
          updateGutters(cm);
        }, true);
        option("fixedGutter", true, function (cm, val) {
          cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
          cm.refresh();
        }, true);
        option("coverGutterNextToScrollbar", false, function (cm) { return updateScrollbars(cm); }, true);
        option("scrollbarStyle", "native", function (cm) {
          initScrollbars(cm);
          updateScrollbars(cm);
          cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
          cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
        }, true);
        option("lineNumbers", false, function (cm, val) {
          cm.display.gutterSpecs = getGutters(cm.options.gutters, val);
          updateGutters(cm);
        }, true);
        option("firstLineNumber", 1, updateGutters, true);
        option("lineNumberFormatter", function (integer) { return integer; }, updateGutters, true);
        option("showCursorWhenSelecting", false, updateSelection, true);

        option("resetSelectionOnContextMenu", true);
        option("lineWiseCopyCut", true);
        option("pasteLinesPerSelection", true);
        option("selectionsMayTouch", false);

        option("readOnly", false, function (cm, val) {
          if (val == "nocursor") {
            onBlur(cm);
            cm.display.input.blur();
          }
          cm.display.input.readOnlyChanged(val);
        });
        option("disableInput", false, function (cm, val) {if (!val) { cm.display.input.reset(); }}, true);
        option("dragDrop", true, dragDropChanged);
        option("allowDropFileTypes", null);

        option("cursorBlinkRate", 530);
        option("cursorScrollMargin", 0);
        option("cursorHeight", 1, updateSelection, true);
        option("singleCursorHeightPerLine", true, updateSelection, true);
        option("workTime", 100);
        option("workDelay", 100);
        option("flattenSpans", true, resetModeState, true);
        option("addModeClass", false, resetModeState, true);
        option("pollInterval", 100);
        option("undoDepth", 200, function (cm, val) { return cm.doc.history.undoDepth = val; });
        option("historyEventDelay", 1250);
        option("viewportMargin", 10, function (cm) { return cm.refresh(); }, true);
        option("maxHighlightLength", 10000, resetModeState, true);
        option("moveInputWithCursor", true, function (cm, val) {
          if (!val) { cm.display.input.resetPosition(); }
        });

        option("tabindex", null, function (cm, val) { return cm.display.input.getField().tabIndex = val || ""; });
        option("autofocus", null);
        option("direction", "ltr", function (cm, val) { return cm.doc.setDirection(val); }, true);
        option("phrases", null);
      }

      function dragDropChanged(cm, value, old) {
        var wasOn = old && old != Init;
        if (!value != !wasOn) {
          var funcs = cm.display.dragFunctions;
          var toggle = value ? on : off;
          toggle(cm.display.scroller, "dragstart", funcs.start);
          toggle(cm.display.scroller, "dragenter", funcs.enter);
          toggle(cm.display.scroller, "dragover", funcs.over);
          toggle(cm.display.scroller, "dragleave", funcs.leave);
          toggle(cm.display.scroller, "drop", funcs.drop);
        }
      }

      function wrappingChanged(cm) {
        if (cm.options.lineWrapping) {
          addClass(cm.display.wrapper, "CodeMirror-wrap");
          cm.display.sizer.style.minWidth = "";
          cm.display.sizerWidth = null;
        } else {
          rmClass(cm.display.wrapper, "CodeMirror-wrap");
          findMaxLine(cm);
        }
        estimateLineHeights(cm);
        regChange(cm);
        clearCaches(cm);
        setTimeout(function () { return updateScrollbars(cm); }, 100);
      }

      // A CodeMirror instance represents an editor. This is the object
      // that user code is usually dealing with.

      function CodeMirror(place, options) {
        var this$1 = this;

        if (!(this instanceof CodeMirror)) { return new CodeMirror(place, options) }

        this.options = options = options ? copyObj(options) : {};
        // Determine effective options based on given values and defaults.
        copyObj(defaults, options, false);

        var doc = options.value;
        if (typeof doc == "string") { doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction); }
        else if (options.mode) { doc.modeOption = options.mode; }
        this.doc = doc;

        var input = new CodeMirror.inputStyles[options.inputStyle](this);
        var display = this.display = new Display(place, doc, input, options);
        display.wrapper.CodeMirror = this;
        themeChanged(this);
        if (options.lineWrapping)
          { this.display.wrapper.className += " CodeMirror-wrap"; }
        initScrollbars(this);

        this.state = {
          keyMaps: [],  // stores maps added by addKeyMap
          overlays: [], // highlighting overlays, as added by addOverlay
          modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
          overwrite: false,
          delayingBlurEvent: false,
          focused: false,
          suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
          pasteIncoming: -1, cutIncoming: -1, // help recognize paste/cut edits in input.poll
          selectingText: false,
          draggingText: false,
          highlight: new Delayed(), // stores highlight worker timeout
          keySeq: null,  // Unfinished key sequence
          specialChars: null
        };

        if (options.autofocus && !mobile) { display.input.focus(); }

        // Override magic textarea content restore that IE sometimes does
        // on our hidden textarea on reload
        if (ie && ie_version < 11) { setTimeout(function () { return this$1.display.input.reset(true); }, 20); }

        registerEventHandlers(this);
        ensureGlobalHandlers();

        startOperation(this);
        this.curOp.forceUpdate = true;
        attachDoc(this, doc);

        if ((options.autofocus && !mobile) || this.hasFocus())
          { setTimeout(bind(onFocus, this), 20); }
        else
          { onBlur(this); }

        for (var opt in optionHandlers) { if (optionHandlers.hasOwnProperty(opt))
          { optionHandlers[opt](this$1, options[opt], Init); } }
        maybeUpdateLineNumberWidth(this);
        if (options.finishInit) { options.finishInit(this); }
        for (var i = 0; i < initHooks.length; ++i) { initHooks[i](this$1); }
        endOperation(this);
        // Suppress optimizelegibility in Webkit, since it breaks text
        // measuring on line wrapping boundaries.
        if (webkit && options.lineWrapping &&
            getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
          { display.lineDiv.style.textRendering = "auto"; }
      }

      // The default configuration options.
      CodeMirror.defaults = defaults;
      // Functions to run when options are changed.
      CodeMirror.optionHandlers = optionHandlers;

      // Attach the necessary event handlers when initializing the editor
      function registerEventHandlers(cm) {
        var d = cm.display;
        on(d.scroller, "mousedown", operation(cm, onMouseDown));
        // Older IE's will not fire a second mousedown for a double click
        if (ie && ie_version < 11)
          { on(d.scroller, "dblclick", operation(cm, function (e) {
            if (signalDOMEvent(cm, e)) { return }
            var pos = posFromMouse(cm, e);
            if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) { return }
            e_preventDefault(e);
            var word = cm.findWordAt(pos);
            extendSelection(cm.doc, word.anchor, word.head);
          })); }
        else
          { on(d.scroller, "dblclick", function (e) { return signalDOMEvent(cm, e) || e_preventDefault(e); }); }
        // Some browsers fire contextmenu *after* opening the menu, at
        // which point we can't mess with it anymore. Context menu is
        // handled in onMouseDown for these browsers.
        on(d.scroller, "contextmenu", function (e) { return onContextMenu(cm, e); });

        // Used to suppress mouse event handling when a touch happens
        var touchFinished, prevTouch = {end: 0};
        function finishTouch() {
          if (d.activeTouch) {
            touchFinished = setTimeout(function () { return d.activeTouch = null; }, 1000);
            prevTouch = d.activeTouch;
            prevTouch.end = +new Date;
          }
        }
        function isMouseLikeTouchEvent(e) {
          if (e.touches.length != 1) { return false }
          var touch = e.touches[0];
          return touch.radiusX <= 1 && touch.radiusY <= 1
        }
        function farAway(touch, other) {
          if (other.left == null) { return true }
          var dx = other.left - touch.left, dy = other.top - touch.top;
          return dx * dx + dy * dy > 20 * 20
        }
        on(d.scroller, "touchstart", function (e) {
          if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
            d.input.ensurePolled();
            clearTimeout(touchFinished);
            var now = +new Date;
            d.activeTouch = {start: now, moved: false,
                             prev: now - prevTouch.end <= 300 ? prevTouch : null};
            if (e.touches.length == 1) {
              d.activeTouch.left = e.touches[0].pageX;
              d.activeTouch.top = e.touches[0].pageY;
            }
          }
        });
        on(d.scroller, "touchmove", function () {
          if (d.activeTouch) { d.activeTouch.moved = true; }
        });
        on(d.scroller, "touchend", function (e) {
          var touch = d.activeTouch;
          if (touch && !eventInWidget(d, e) && touch.left != null &&
              !touch.moved && new Date - touch.start < 300) {
            var pos = cm.coordsChar(d.activeTouch, "page"), range;
            if (!touch.prev || farAway(touch, touch.prev)) // Single tap
              { range = new Range(pos, pos); }
            else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
              { range = cm.findWordAt(pos); }
            else // Triple tap
              { range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))); }
            cm.setSelection(range.anchor, range.head);
            cm.focus();
            e_preventDefault(e);
          }
          finishTouch();
        });
        on(d.scroller, "touchcancel", finishTouch);

        // Sync scrolling between fake scrollbars and real scrollable
        // area, ensure viewport is updated when scrolling.
        on(d.scroller, "scroll", function () {
          if (d.scroller.clientHeight) {
            updateScrollTop(cm, d.scroller.scrollTop);
            setScrollLeft(cm, d.scroller.scrollLeft, true);
            signal(cm, "scroll", cm);
          }
        });

        // Listen to wheel events in order to try and update the viewport on time.
        on(d.scroller, "mousewheel", function (e) { return onScrollWheel(cm, e); });
        on(d.scroller, "DOMMouseScroll", function (e) { return onScrollWheel(cm, e); });

        // Prevent wrapper from ever scrolling
        on(d.wrapper, "scroll", function () { return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; });

        d.dragFunctions = {
          enter: function (e) {if (!signalDOMEvent(cm, e)) { e_stop(e); }},
          over: function (e) {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e); }},
          start: function (e) { return onDragStart(cm, e); },
          drop: operation(cm, onDrop),
          leave: function (e) {if (!signalDOMEvent(cm, e)) { clearDragCursor(cm); }}
        };

        var inp = d.input.getField();
        on(inp, "keyup", function (e) { return onKeyUp.call(cm, e); });
        on(inp, "keydown", operation(cm, onKeyDown));
        on(inp, "keypress", operation(cm, onKeyPress));
        on(inp, "focus", function (e) { return onFocus(cm, e); });
        on(inp, "blur", function (e) { return onBlur(cm, e); });
      }

      var initHooks = [];
      CodeMirror.defineInitHook = function (f) { return initHooks.push(f); };

      // Indent the given line. The how parameter can be "smart",
      // "add"/null, "subtract", or "prev". When aggressive is false
      // (typically set to true for forced single-line indents), empty
      // lines are not indented, and places where the mode returns Pass
      // are left alone.
      function indentLine(cm, n, how, aggressive) {
        var doc = cm.doc, state;
        if (how == null) { how = "add"; }
        if (how == "smart") {
          // Fall back to "prev" when the mode doesn't have an indentation
          // method.
          if (!doc.mode.indent) { how = "prev"; }
          else { state = getContextBefore(cm, n).state; }
        }

        var tabSize = cm.options.tabSize;
        var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
        if (line.stateAfter) { line.stateAfter = null; }
        var curSpaceString = line.text.match(/^\s*/)[0], indentation;
        if (!aggressive && !/\S/.test(line.text)) {
          indentation = 0;
          how = "not";
        } else if (how == "smart") {
          indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
          if (indentation == Pass || indentation > 150) {
            if (!aggressive) { return }
            how = "prev";
          }
        }
        if (how == "prev") {
          if (n > doc.first) { indentation = countColumn(getLine(doc, n-1).text, null, tabSize); }
          else { indentation = 0; }
        } else if (how == "add") {
          indentation = curSpace + cm.options.indentUnit;
        } else if (how == "subtract") {
          indentation = curSpace - cm.options.indentUnit;
        } else if (typeof how == "number") {
          indentation = curSpace + how;
        }
        indentation = Math.max(0, indentation);

        var indentString = "", pos = 0;
        if (cm.options.indentWithTabs)
          { for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";} }
        if (pos < indentation) { indentString += spaceStr(indentation - pos); }

        if (indentString != curSpaceString) {
          replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
          line.stateAfter = null;
          return true
        } else {
          // Ensure that, if the cursor was in the whitespace at the start
          // of the line, it is moved to the end of that space.
          for (var i$1 = 0; i$1 < doc.sel.ranges.length; i$1++) {
            var range = doc.sel.ranges[i$1];
            if (range.head.line == n && range.head.ch < curSpaceString.length) {
              var pos$1 = Pos(n, curSpaceString.length);
              replaceOneSelection(doc, i$1, new Range(pos$1, pos$1));
              break
            }
          }
        }
      }

      // This will be set to a {lineWise: bool, text: [string]} object, so
      // that, when pasting, we know what kind of selections the copied
      // text was made out of.
      var lastCopied = null;

      function setLastCopied(newLastCopied) {
        lastCopied = newLastCopied;
      }

      function applyTextInput(cm, inserted, deleted, sel, origin) {
        var doc = cm.doc;
        cm.display.shift = false;
        if (!sel) { sel = doc.sel; }

        var recent = +new Date - 200;
        var paste = origin == "paste" || cm.state.pasteIncoming > recent;
        var textLines = splitLinesAuto(inserted), multiPaste = null;
        // When pasting N lines into N selections, insert one line per selection
        if (paste && sel.ranges.length > 1) {
          if (lastCopied && lastCopied.text.join("\n") == inserted) {
            if (sel.ranges.length % lastCopied.text.length == 0) {
              multiPaste = [];
              for (var i = 0; i < lastCopied.text.length; i++)
                { multiPaste.push(doc.splitLines(lastCopied.text[i])); }
            }
          } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
            multiPaste = map(textLines, function (l) { return [l]; });
          }
        }

        var updateInput = cm.curOp.updateInput;
        // Normal behavior is to insert the new text into every selection
        for (var i$1 = sel.ranges.length - 1; i$1 >= 0; i$1--) {
          var range$$1 = sel.ranges[i$1];
          var from = range$$1.from(), to = range$$1.to();
          if (range$$1.empty()) {
            if (deleted && deleted > 0) // Handle deletion
              { from = Pos(from.line, from.ch - deleted); }
            else if (cm.state.overwrite && !paste) // Handle overwrite
              { to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length)); }
            else if (paste && lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
              { from = to = Pos(from.line, 0); }
          }
          var changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i$1 % multiPaste.length] : textLines,
                             origin: origin || (paste ? "paste" : cm.state.cutIncoming > recent ? "cut" : "+input")};
          makeChange(cm.doc, changeEvent);
          signalLater(cm, "inputRead", cm, changeEvent);
        }
        if (inserted && !paste)
          { triggerElectric(cm, inserted); }

        ensureCursorVisible(cm);
        if (cm.curOp.updateInput < 2) { cm.curOp.updateInput = updateInput; }
        cm.curOp.typing = true;
        cm.state.pasteIncoming = cm.state.cutIncoming = -1;
      }

      function handlePaste(e, cm) {
        var pasted = e.clipboardData && e.clipboardData.getData("Text");
        if (pasted) {
          e.preventDefault();
          if (!cm.isReadOnly() && !cm.options.disableInput)
            { runInOp(cm, function () { return applyTextInput(cm, pasted, 0, null, "paste"); }); }
          return true
        }
      }

      function triggerElectric(cm, inserted) {
        // When an 'electric' character is inserted, immediately trigger a reindent
        if (!cm.options.electricChars || !cm.options.smartIndent) { return }
        var sel = cm.doc.sel;

        for (var i = sel.ranges.length - 1; i >= 0; i--) {
          var range$$1 = sel.ranges[i];
          if (range$$1.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range$$1.head.line)) { continue }
          var mode = cm.getModeAt(range$$1.head);
          var indented = false;
          if (mode.electricChars) {
            for (var j = 0; j < mode.electricChars.length; j++)
              { if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
                indented = indentLine(cm, range$$1.head.line, "smart");
                break
              } }
          } else if (mode.electricInput) {
            if (mode.electricInput.test(getLine(cm.doc, range$$1.head.line).text.slice(0, range$$1.head.ch)))
              { indented = indentLine(cm, range$$1.head.line, "smart"); }
          }
          if (indented) { signalLater(cm, "electricInput", cm, range$$1.head.line); }
        }
      }

      function copyableRanges(cm) {
        var text = [], ranges = [];
        for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
          var line = cm.doc.sel.ranges[i].head.line;
          var lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)};
          ranges.push(lineRange);
          text.push(cm.getRange(lineRange.anchor, lineRange.head));
        }
        return {text: text, ranges: ranges}
      }

      function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
        field.setAttribute("autocorrect", autocorrect ? "" : "off");
        field.setAttribute("autocapitalize", autocapitalize ? "" : "off");
        field.setAttribute("spellcheck", !!spellcheck);
      }

      function hiddenTextarea() {
        var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none");
        var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
        // The textarea is kept positioned near the cursor to prevent the
        // fact that it'll be scrolled into view on input from scrolling
        // our fake cursor out of view. On webkit, when wrap=off, paste is
        // very slow. So make the area wide instead.
        if (webkit) { te.style.width = "1000px"; }
        else { te.setAttribute("wrap", "off"); }
        // If border: 0; -- iOS fails to open keyboard (issue #1287)
        if (ios) { te.style.border = "1px solid black"; }
        disableBrowserMagic(te);
        return div
      }

      // The publicly visible API. Note that methodOp(f) means
      // 'wrap f in an operation, performed on its `this` parameter'.

      // This is not the complete set of editor methods. Most of the
      // methods defined on the Doc type are also injected into
      // CodeMirror.prototype, for backwards compatibility and
      // convenience.

      function addEditorMethods(CodeMirror) {
        var optionHandlers = CodeMirror.optionHandlers;

        var helpers = CodeMirror.helpers = {};

        CodeMirror.prototype = {
          constructor: CodeMirror,
          focus: function(){window.focus(); this.display.input.focus();},

          setOption: function(option, value) {
            var options = this.options, old = options[option];
            if (options[option] == value && option != "mode") { return }
            options[option] = value;
            if (optionHandlers.hasOwnProperty(option))
              { operation(this, optionHandlers[option])(this, value, old); }
            signal(this, "optionChange", this, option);
          },

          getOption: function(option) {return this.options[option]},
          getDoc: function() {return this.doc},

          addKeyMap: function(map$$1, bottom) {
            this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map$$1));
          },
          removeKeyMap: function(map$$1) {
            var maps = this.state.keyMaps;
            for (var i = 0; i < maps.length; ++i)
              { if (maps[i] == map$$1 || maps[i].name == map$$1) {
                maps.splice(i, 1);
                return true
              } }
          },

          addOverlay: methodOp(function(spec, options) {
            var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
            if (mode.startState) { throw new Error("Overlays may not be stateful.") }
            insertSorted(this.state.overlays,
                         {mode: mode, modeSpec: spec, opaque: options && options.opaque,
                          priority: (options && options.priority) || 0},
                         function (overlay) { return overlay.priority; });
            this.state.modeGen++;
            regChange(this);
          }),
          removeOverlay: methodOp(function(spec) {
            var this$1 = this;

            var overlays = this.state.overlays;
            for (var i = 0; i < overlays.length; ++i) {
              var cur = overlays[i].modeSpec;
              if (cur == spec || typeof spec == "string" && cur.name == spec) {
                overlays.splice(i, 1);
                this$1.state.modeGen++;
                regChange(this$1);
                return
              }
            }
          }),

          indentLine: methodOp(function(n, dir, aggressive) {
            if (typeof dir != "string" && typeof dir != "number") {
              if (dir == null) { dir = this.options.smartIndent ? "smart" : "prev"; }
              else { dir = dir ? "add" : "subtract"; }
            }
            if (isLine(this.doc, n)) { indentLine(this, n, dir, aggressive); }
          }),
          indentSelection: methodOp(function(how) {
            var this$1 = this;

            var ranges = this.doc.sel.ranges, end = -1;
            for (var i = 0; i < ranges.length; i++) {
              var range$$1 = ranges[i];
              if (!range$$1.empty()) {
                var from = range$$1.from(), to = range$$1.to();
                var start = Math.max(end, from.line);
                end = Math.min(this$1.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
                for (var j = start; j < end; ++j)
                  { indentLine(this$1, j, how); }
                var newRanges = this$1.doc.sel.ranges;
                if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
                  { replaceOneSelection(this$1.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll); }
              } else if (range$$1.head.line > end) {
                indentLine(this$1, range$$1.head.line, how, true);
                end = range$$1.head.line;
                if (i == this$1.doc.sel.primIndex) { ensureCursorVisible(this$1); }
              }
            }
          }),

          // Fetch the parser token for a given character. Useful for hacks
          // that want to inspect the mode state (say, for completion).
          getTokenAt: function(pos, precise) {
            return takeToken(this, pos, precise)
          },

          getLineTokens: function(line, precise) {
            return takeToken(this, Pos(line), precise, true)
          },

          getTokenTypeAt: function(pos) {
            pos = clipPos(this.doc, pos);
            var styles = getLineStyles(this, getLine(this.doc, pos.line));
            var before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
            var type;
            if (ch == 0) { type = styles[2]; }
            else { for (;;) {
              var mid = (before + after) >> 1;
              if ((mid ? styles[mid * 2 - 1] : 0) >= ch) { after = mid; }
              else if (styles[mid * 2 + 1] < ch) { before = mid + 1; }
              else { type = styles[mid * 2 + 2]; break }
            } }
            var cut = type ? type.indexOf("overlay ") : -1;
            return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1)
          },

          getModeAt: function(pos) {
            var mode = this.doc.mode;
            if (!mode.innerMode) { return mode }
            return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode
          },

          getHelper: function(pos, type) {
            return this.getHelpers(pos, type)[0]
          },

          getHelpers: function(pos, type) {
            var this$1 = this;

            var found = [];
            if (!helpers.hasOwnProperty(type)) { return found }
            var help = helpers[type], mode = this.getModeAt(pos);
            if (typeof mode[type] == "string") {
              if (help[mode[type]]) { found.push(help[mode[type]]); }
            } else if (mode[type]) {
              for (var i = 0; i < mode[type].length; i++) {
                var val = help[mode[type][i]];
                if (val) { found.push(val); }
              }
            } else if (mode.helperType && help[mode.helperType]) {
              found.push(help[mode.helperType]);
            } else if (help[mode.name]) {
              found.push(help[mode.name]);
            }
            for (var i$1 = 0; i$1 < help._global.length; i$1++) {
              var cur = help._global[i$1];
              if (cur.pred(mode, this$1) && indexOf(found, cur.val) == -1)
                { found.push(cur.val); }
            }
            return found
          },

          getStateAfter: function(line, precise) {
            var doc = this.doc;
            line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);
            return getContextBefore(this, line + 1, precise).state
          },

          cursorCoords: function(start, mode) {
            var pos, range$$1 = this.doc.sel.primary();
            if (start == null) { pos = range$$1.head; }
            else if (typeof start == "object") { pos = clipPos(this.doc, start); }
            else { pos = start ? range$$1.from() : range$$1.to(); }
            return cursorCoords(this, pos, mode || "page")
          },

          charCoords: function(pos, mode) {
            return charCoords(this, clipPos(this.doc, pos), mode || "page")
          },

          coordsChar: function(coords, mode) {
            coords = fromCoordSystem(this, coords, mode || "page");
            return coordsChar(this, coords.left, coords.top)
          },

          lineAtHeight: function(height, mode) {
            height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top;
            return lineAtHeight(this.doc, height + this.display.viewOffset)
          },
          heightAtLine: function(line, mode, includeWidgets) {
            var end = false, lineObj;
            if (typeof line == "number") {
              var last = this.doc.first + this.doc.size - 1;
              if (line < this.doc.first) { line = this.doc.first; }
              else if (line > last) { line = last; end = true; }
              lineObj = getLine(this.doc, line);
            } else {
              lineObj = line;
            }
            return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page", includeWidgets || end).top +
              (end ? this.doc.height - heightAtLine(lineObj) : 0)
          },

          defaultTextHeight: function() { return textHeight(this.display) },
          defaultCharWidth: function() { return charWidth(this.display) },

          getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo}},

          addWidget: function(pos, node, scroll, vert, horiz) {
            var display = this.display;
            pos = cursorCoords(this, clipPos(this.doc, pos));
            var top = pos.bottom, left = pos.left;
            node.style.position = "absolute";
            node.setAttribute("cm-ignore-events", "true");
            this.display.input.setUneditable(node);
            display.sizer.appendChild(node);
            if (vert == "over") {
              top = pos.top;
            } else if (vert == "above" || vert == "near") {
              var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
              hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
              // Default to positioning above (if specified and possible); otherwise default to positioning below
              if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
                { top = pos.top - node.offsetHeight; }
              else if (pos.bottom + node.offsetHeight <= vspace)
                { top = pos.bottom; }
              if (left + node.offsetWidth > hspace)
                { left = hspace - node.offsetWidth; }
            }
            node.style.top = top + "px";
            node.style.left = node.style.right = "";
            if (horiz == "right") {
              left = display.sizer.clientWidth - node.offsetWidth;
              node.style.right = "0px";
            } else {
              if (horiz == "left") { left = 0; }
              else if (horiz == "middle") { left = (display.sizer.clientWidth - node.offsetWidth) / 2; }
              node.style.left = left + "px";
            }
            if (scroll)
              { scrollIntoView(this, {left: left, top: top, right: left + node.offsetWidth, bottom: top + node.offsetHeight}); }
          },

          triggerOnKeyDown: methodOp(onKeyDown),
          triggerOnKeyPress: methodOp(onKeyPress),
          triggerOnKeyUp: onKeyUp,
          triggerOnMouseDown: methodOp(onMouseDown),

          execCommand: function(cmd) {
            if (commands.hasOwnProperty(cmd))
              { return commands[cmd].call(null, this) }
          },

          triggerElectric: methodOp(function(text) { triggerElectric(this, text); }),

          findPosH: function(from, amount, unit, visually) {
            var this$1 = this;

            var dir = 1;
            if (amount < 0) { dir = -1; amount = -amount; }
            var cur = clipPos(this.doc, from);
            for (var i = 0; i < amount; ++i) {
              cur = findPosH(this$1.doc, cur, dir, unit, visually);
              if (cur.hitSide) { break }
            }
            return cur
          },

          moveH: methodOp(function(dir, unit) {
            var this$1 = this;

            this.extendSelectionsBy(function (range$$1) {
              if (this$1.display.shift || this$1.doc.extend || range$$1.empty())
                { return findPosH(this$1.doc, range$$1.head, dir, unit, this$1.options.rtlMoveVisually) }
              else
                { return dir < 0 ? range$$1.from() : range$$1.to() }
            }, sel_move);
          }),

          deleteH: methodOp(function(dir, unit) {
            var sel = this.doc.sel, doc = this.doc;
            if (sel.somethingSelected())
              { doc.replaceSelection("", null, "+delete"); }
            else
              { deleteNearSelection(this, function (range$$1) {
                var other = findPosH(doc, range$$1.head, dir, unit, false);
                return dir < 0 ? {from: other, to: range$$1.head} : {from: range$$1.head, to: other}
              }); }
          }),

          findPosV: function(from, amount, unit, goalColumn) {
            var this$1 = this;

            var dir = 1, x = goalColumn;
            if (amount < 0) { dir = -1; amount = -amount; }
            var cur = clipPos(this.doc, from);
            for (var i = 0; i < amount; ++i) {
              var coords = cursorCoords(this$1, cur, "div");
              if (x == null) { x = coords.left; }
              else { coords.left = x; }
              cur = findPosV(this$1, coords, dir, unit);
              if (cur.hitSide) { break }
            }
            return cur
          },

          moveV: methodOp(function(dir, unit) {
            var this$1 = this;

            var doc = this.doc, goals = [];
            var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
            doc.extendSelectionsBy(function (range$$1) {
              if (collapse)
                { return dir < 0 ? range$$1.from() : range$$1.to() }
              var headPos = cursorCoords(this$1, range$$1.head, "div");
              if (range$$1.goalColumn != null) { headPos.left = range$$1.goalColumn; }
              goals.push(headPos.left);
              var pos = findPosV(this$1, headPos, dir, unit);
              if (unit == "page" && range$$1 == doc.sel.primary())
                { addToScrollTop(this$1, charCoords(this$1, pos, "div").top - headPos.top); }
              return pos
            }, sel_move);
            if (goals.length) { for (var i = 0; i < doc.sel.ranges.length; i++)
              { doc.sel.ranges[i].goalColumn = goals[i]; } }
          }),

          // Find the word at the given position (as returned by coordsChar).
          findWordAt: function(pos) {
            var doc = this.doc, line = getLine(doc, pos.line).text;
            var start = pos.ch, end = pos.ch;
            if (line) {
              var helper = this.getHelper(pos, "wordChars");
              if ((pos.sticky == "before" || end == line.length) && start) { --start; } else { ++end; }
              var startChar = line.charAt(start);
              var check = isWordChar(startChar, helper)
                ? function (ch) { return isWordChar(ch, helper); }
                : /\s/.test(startChar) ? function (ch) { return /\s/.test(ch); }
                : function (ch) { return (!/\s/.test(ch) && !isWordChar(ch)); };
              while (start > 0 && check(line.charAt(start - 1))) { --start; }
              while (end < line.length && check(line.charAt(end))) { ++end; }
            }
            return new Range(Pos(pos.line, start), Pos(pos.line, end))
          },

          toggleOverwrite: function(value) {
            if (value != null && value == this.state.overwrite) { return }
            if (this.state.overwrite = !this.state.overwrite)
              { addClass(this.display.cursorDiv, "CodeMirror-overwrite"); }
            else
              { rmClass(this.display.cursorDiv, "CodeMirror-overwrite"); }

            signal(this, "overwriteToggle", this, this.state.overwrite);
          },
          hasFocus: function() { return this.display.input.getField() == activeElt() },
          isReadOnly: function() { return !!(this.options.readOnly || this.doc.cantEdit) },

          scrollTo: methodOp(function (x, y) { scrollToCoords(this, x, y); }),
          getScrollInfo: function() {
            var scroller = this.display.scroller;
            return {left: scroller.scrollLeft, top: scroller.scrollTop,
                    height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
                    width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
                    clientHeight: displayHeight(this), clientWidth: displayWidth(this)}
          },

          scrollIntoView: methodOp(function(range$$1, margin) {
            if (range$$1 == null) {
              range$$1 = {from: this.doc.sel.primary().head, to: null};
              if (margin == null) { margin = this.options.cursorScrollMargin; }
            } else if (typeof range$$1 == "number") {
              range$$1 = {from: Pos(range$$1, 0), to: null};
            } else if (range$$1.from == null) {
              range$$1 = {from: range$$1, to: null};
            }
            if (!range$$1.to) { range$$1.to = range$$1.from; }
            range$$1.margin = margin || 0;

            if (range$$1.from.line != null) {
              scrollToRange(this, range$$1);
            } else {
              scrollToCoordsRange(this, range$$1.from, range$$1.to, range$$1.margin);
            }
          }),

          setSize: methodOp(function(width, height) {
            var this$1 = this;

            var interpret = function (val) { return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val; };
            if (width != null) { this.display.wrapper.style.width = interpret(width); }
            if (height != null) { this.display.wrapper.style.height = interpret(height); }
            if (this.options.lineWrapping) { clearLineMeasurementCache(this); }
            var lineNo$$1 = this.display.viewFrom;
            this.doc.iter(lineNo$$1, this.display.viewTo, function (line) {
              if (line.widgets) { for (var i = 0; i < line.widgets.length; i++)
                { if (line.widgets[i].noHScroll) { regLineChange(this$1, lineNo$$1, "widget"); break } } }
              ++lineNo$$1;
            });
            this.curOp.forceUpdate = true;
            signal(this, "refresh", this);
          }),

          operation: function(f){return runInOp(this, f)},
          startOperation: function(){return startOperation(this)},
          endOperation: function(){return endOperation(this)},

          refresh: methodOp(function() {
            var oldHeight = this.display.cachedTextHeight;
            regChange(this);
            this.curOp.forceUpdate = true;
            clearCaches(this);
            scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
            updateGutterSpace(this.display);
            if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
              { estimateLineHeights(this); }
            signal(this, "refresh", this);
          }),

          swapDoc: methodOp(function(doc) {
            var old = this.doc;
            old.cm = null;
            // Cancel the current text selection if any (#5821)
            if (this.state.selectingText) { this.state.selectingText(); }
            attachDoc(this, doc);
            clearCaches(this);
            this.display.input.reset();
            scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
            this.curOp.forceScroll = true;
            signalLater(this, "swapDoc", this, old);
            return old
          }),

          phrase: function(phraseText) {
            var phrases = this.options.phrases;
            return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText
          },

          getInputField: function(){return this.display.input.getField()},
          getWrapperElement: function(){return this.display.wrapper},
          getScrollerElement: function(){return this.display.scroller},
          getGutterElement: function(){return this.display.gutters}
        };
        eventMixin(CodeMirror);

        CodeMirror.registerHelper = function(type, name, value) {
          if (!helpers.hasOwnProperty(type)) { helpers[type] = CodeMirror[type] = {_global: []}; }
          helpers[type][name] = value;
        };
        CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
          CodeMirror.registerHelper(type, name, value);
          helpers[type]._global.push({pred: predicate, val: value});
        };
      }

      // Used for horizontal relative motion. Dir is -1 or 1 (left or
      // right), unit can be "char", "column" (like char, but doesn't
      // cross line boundaries), "word" (across next word), or "group" (to
      // the start of next group of word or non-word-non-whitespace
      // chars). The visually param controls whether, in right-to-left
      // text, direction 1 means to move towards the next index in the
      // string, or towards the character to the right of the current
      // position. The resulting position will have a hitSide=true
      // property if it reached the end of the document.
      function findPosH(doc, pos, dir, unit, visually) {
        var oldPos = pos;
        var origDir = dir;
        var lineObj = getLine(doc, pos.line);
        function findNextLine() {
          var l = pos.line + dir;
          if (l < doc.first || l >= doc.first + doc.size) { return false }
          pos = new Pos(l, pos.ch, pos.sticky);
          return lineObj = getLine(doc, l)
        }
        function moveOnce(boundToLine) {
          var next;
          if (visually) {
            next = moveVisually(doc.cm, lineObj, pos, dir);
          } else {
            next = moveLogically(lineObj, pos, dir);
          }
          if (next == null) {
            if (!boundToLine && findNextLine())
              { pos = endOfLine(visually, doc.cm, lineObj, pos.line, dir); }
            else
              { return false }
          } else {
            pos = next;
          }
          return true
        }

        if (unit == "char") {
          moveOnce();
        } else if (unit == "column") {
          moveOnce(true);
        } else if (unit == "word" || unit == "group") {
          var sawType = null, group = unit == "group";
          var helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
          for (var first = true;; first = false) {
            if (dir < 0 && !moveOnce(!first)) { break }
            var cur = lineObj.text.charAt(pos.ch) || "\n";
            var type = isWordChar(cur, helper) ? "w"
              : group && cur == "\n" ? "n"
              : !group || /\s/.test(cur) ? null
              : "p";
            if (group && !first && !type) { type = "s"; }
            if (sawType && sawType != type) {
              if (dir < 0) {dir = 1; moveOnce(); pos.sticky = "after";}
              break
            }

            if (type) { sawType = type; }
            if (dir > 0 && !moveOnce(!first)) { break }
          }
        }
        var result = skipAtomic(doc, pos, oldPos, origDir, true);
        if (equalCursorPos(oldPos, result)) { result.hitSide = true; }
        return result
      }

      // For relative vertical movement. Dir may be -1 or 1. Unit can be
      // "page" or "line". The resulting position will have a hitSide=true
      // property if it reached the end of the document.
      function findPosV(cm, pos, dir, unit) {
        var doc = cm.doc, x = pos.left, y;
        if (unit == "page") {
          var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
          var moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3);
          y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;

        } else if (unit == "line") {
          y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
        }
        var target;
        for (;;) {
          target = coordsChar(cm, x, y);
          if (!target.outside) { break }
          if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break }
          y += dir * 5;
        }
        return target
      }

      // CONTENTEDITABLE INPUT STYLE

      var ContentEditableInput = function(cm) {
        this.cm = cm;
        this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
        this.polling = new Delayed();
        this.composing = null;
        this.gracePeriod = false;
        this.readDOMTimeout = null;
      };

      ContentEditableInput.prototype.init = function (display) {
          var this$1 = this;

        var input = this, cm = input.cm;
        var div = input.div = display.lineDiv;
        disableBrowserMagic(div, cm.options.spellcheck, cm.options.autocorrect, cm.options.autocapitalize);

        on(div, "paste", function (e) {
          if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }
          // IE doesn't fire input events, so we schedule a read for the pasted content in this way
          if (ie_version <= 11) { setTimeout(operation(cm, function () { return this$1.updateFromDOM(); }), 20); }
        });

        on(div, "compositionstart", function (e) {
          this$1.composing = {data: e.data, done: false};
        });
        on(div, "compositionupdate", function (e) {
          if (!this$1.composing) { this$1.composing = {data: e.data, done: false}; }
        });
        on(div, "compositionend", function (e) {
          if (this$1.composing) {
            if (e.data != this$1.composing.data) { this$1.readFromDOMSoon(); }
            this$1.composing.done = true;
          }
        });

        on(div, "touchstart", function () { return input.forceCompositionEnd(); });

        on(div, "input", function () {
          if (!this$1.composing) { this$1.readFromDOMSoon(); }
        });

        function onCopyCut(e) {
          if (signalDOMEvent(cm, e)) { return }
          if (cm.somethingSelected()) {
            setLastCopied({lineWise: false, text: cm.getSelections()});
            if (e.type == "cut") { cm.replaceSelection("", null, "cut"); }
          } else if (!cm.options.lineWiseCopyCut) {
            return
          } else {
            var ranges = copyableRanges(cm);
            setLastCopied({lineWise: true, text: ranges.text});
            if (e.type == "cut") {
              cm.operation(function () {
                cm.setSelections(ranges.ranges, 0, sel_dontScroll);
                cm.replaceSelection("", null, "cut");
              });
            }
          }
          if (e.clipboardData) {
            e.clipboardData.clearData();
            var content = lastCopied.text.join("\n");
            // iOS exposes the clipboard API, but seems to discard content inserted into it
            e.clipboardData.setData("Text", content);
            if (e.clipboardData.getData("Text") == content) {
              e.preventDefault();
              return
            }
          }
          // Old-fashioned briefly-focus-a-textarea hack
          var kludge = hiddenTextarea(), te = kludge.firstChild;
          cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
          te.value = lastCopied.text.join("\n");
          var hadFocus = document.activeElement;
          selectInput(te);
          setTimeout(function () {
            cm.display.lineSpace.removeChild(kludge);
            hadFocus.focus();
            if (hadFocus == div) { input.showPrimarySelection(); }
          }, 50);
        }
        on(div, "copy", onCopyCut);
        on(div, "cut", onCopyCut);
      };

      ContentEditableInput.prototype.prepareSelection = function () {
        var result = prepareSelection(this.cm, false);
        result.focus = this.cm.state.focused;
        return result
      };

      ContentEditableInput.prototype.showSelection = function (info, takeFocus) {
        if (!info || !this.cm.display.view.length) { return }
        if (info.focus || takeFocus) { this.showPrimarySelection(); }
        this.showMultipleSelections(info);
      };

      ContentEditableInput.prototype.getSelection = function () {
        return this.cm.display.wrapper.ownerDocument.getSelection()
      };

      ContentEditableInput.prototype.showPrimarySelection = function () {
        var sel = this.getSelection(), cm = this.cm, prim = cm.doc.sel.primary();
        var from = prim.from(), to = prim.to();

        if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
          sel.removeAllRanges();
          return
        }

        var curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
        var curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
        if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
            cmp(minPos(curAnchor, curFocus), from) == 0 &&
            cmp(maxPos(curAnchor, curFocus), to) == 0)
          { return }

        var view = cm.display.view;
        var start = (from.line >= cm.display.viewFrom && posToDOM(cm, from)) ||
            {node: view[0].measure.map[2], offset: 0};
        var end = to.line < cm.display.viewTo && posToDOM(cm, to);
        if (!end) {
          var measure = view[view.length - 1].measure;
          var map$$1 = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
          end = {node: map$$1[map$$1.length - 1], offset: map$$1[map$$1.length - 2] - map$$1[map$$1.length - 3]};
        }

        if (!start || !end) {
          sel.removeAllRanges();
          return
        }

        var old = sel.rangeCount && sel.getRangeAt(0), rng;
        try { rng = range(start.node, start.offset, end.offset, end.node); }
        catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
        if (rng) {
          if (!gecko && cm.state.focused) {
            sel.collapse(start.node, start.offset);
            if (!rng.collapsed) {
              sel.removeAllRanges();
              sel.addRange(rng);
            }
          } else {
            sel.removeAllRanges();
            sel.addRange(rng);
          }
          if (old && sel.anchorNode == null) { sel.addRange(old); }
          else if (gecko) { this.startGracePeriod(); }
        }
        this.rememberSelection();
      };

      ContentEditableInput.prototype.startGracePeriod = function () {
          var this$1 = this;

        clearTimeout(this.gracePeriod);
        this.gracePeriod = setTimeout(function () {
          this$1.gracePeriod = false;
          if (this$1.selectionChanged())
            { this$1.cm.operation(function () { return this$1.cm.curOp.selectionChanged = true; }); }
        }, 20);
      };

      ContentEditableInput.prototype.showMultipleSelections = function (info) {
        removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
        removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
      };

      ContentEditableInput.prototype.rememberSelection = function () {
        var sel = this.getSelection();
        this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset;
        this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset;
      };

      ContentEditableInput.prototype.selectionInEditor = function () {
        var sel = this.getSelection();
        if (!sel.rangeCount) { return false }
        var node = sel.getRangeAt(0).commonAncestorContainer;
        return contains(this.div, node)
      };

      ContentEditableInput.prototype.focus = function () {
        if (this.cm.options.readOnly != "nocursor") {
          if (!this.selectionInEditor())
            { this.showSelection(this.prepareSelection(), true); }
          this.div.focus();
        }
      };
      ContentEditableInput.prototype.blur = function () { this.div.blur(); };
      ContentEditableInput.prototype.getField = function () { return this.div };

      ContentEditableInput.prototype.supportsTouch = function () { return true };

      ContentEditableInput.prototype.receivedFocus = function () {
        var input = this;
        if (this.selectionInEditor())
          { this.pollSelection(); }
        else
          { runInOp(this.cm, function () { return input.cm.curOp.selectionChanged = true; }); }

        function poll() {
          if (input.cm.state.focused) {
            input.pollSelection();
            input.polling.set(input.cm.options.pollInterval, poll);
          }
        }
        this.polling.set(this.cm.options.pollInterval, poll);
      };

      ContentEditableInput.prototype.selectionChanged = function () {
        var sel = this.getSelection();
        return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
          sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset
      };

      ContentEditableInput.prototype.pollSelection = function () {
        if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) { return }
        var sel = this.getSelection(), cm = this.cm;
        // On Android Chrome (version 56, at least), backspacing into an
        // uneditable block element will put the cursor in that element,
        // and then, because it's not editable, hide the virtual keyboard.
        // Because Android doesn't allow us to actually detect backspace
        // presses in a sane way, this code checks for when that happens
        // and simulates a backspace press in this case.
        if (android && chrome && this.cm.display.gutterSpecs.length && isInGutter(sel.anchorNode)) {
          this.cm.triggerOnKeyDown({type: "keydown", keyCode: 8, preventDefault: Math.abs});
          this.blur();
          this.focus();
          return
        }
        if (this.composing) { return }
        this.rememberSelection();
        var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
        var head = domToPos(cm, sel.focusNode, sel.focusOffset);
        if (anchor && head) { runInOp(cm, function () {
          setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
          if (anchor.bad || head.bad) { cm.curOp.selectionChanged = true; }
        }); }
      };

      ContentEditableInput.prototype.pollContent = function () {
        if (this.readDOMTimeout != null) {
          clearTimeout(this.readDOMTimeout);
          this.readDOMTimeout = null;
        }

        var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
        var from = sel.from(), to = sel.to();
        if (from.ch == 0 && from.line > cm.firstLine())
          { from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length); }
        if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine())
          { to = Pos(to.line + 1, 0); }
        if (from.line < display.viewFrom || to.line > display.viewTo - 1) { return false }

        var fromIndex, fromLine, fromNode;
        if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
          fromLine = lineNo(display.view[0].line);
          fromNode = display.view[0].node;
        } else {
          fromLine = lineNo(display.view[fromIndex].line);
          fromNode = display.view[fromIndex - 1].node.nextSibling;
        }
        var toIndex = findViewIndex(cm, to.line);
        var toLine, toNode;
        if (toIndex == display.view.length - 1) {
          toLine = display.viewTo - 1;
          toNode = display.lineDiv.lastChild;
        } else {
          toLine = lineNo(display.view[toIndex + 1].line) - 1;
          toNode = display.view[toIndex + 1].node.previousSibling;
        }

        if (!fromNode) { return false }
        var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
        var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
        while (newText.length > 1 && oldText.length > 1) {
          if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine--; }
          else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++; }
          else { break }
        }

        var cutFront = 0, cutEnd = 0;
        var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
        while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
          { ++cutFront; }
        var newBot = lst(newText), oldBot = lst(oldText);
        var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
                                 oldBot.length - (oldText.length == 1 ? cutFront : 0));
        while (cutEnd < maxCutEnd &&
               newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
          { ++cutEnd; }
        // Try to move start of change to start of selection if ambiguous
        if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
          while (cutFront && cutFront > from.ch &&
                 newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
            cutFront--;
            cutEnd++;
          }
        }

        newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "");
        newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "");

        var chFrom = Pos(fromLine, cutFront);
        var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
        if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
          replaceRange(cm.doc, newText, chFrom, chTo, "+input");
          return true
        }
      };

      ContentEditableInput.prototype.ensurePolled = function () {
        this.forceCompositionEnd();
      };
      ContentEditableInput.prototype.reset = function () {
        this.forceCompositionEnd();
      };
      ContentEditableInput.prototype.forceCompositionEnd = function () {
        if (!this.composing) { return }
        clearTimeout(this.readDOMTimeout);
        this.composing = null;
        this.updateFromDOM();
        this.div.blur();
        this.div.focus();
      };
      ContentEditableInput.prototype.readFromDOMSoon = function () {
          var this$1 = this;

        if (this.readDOMTimeout != null) { return }
        this.readDOMTimeout = setTimeout(function () {
          this$1.readDOMTimeout = null;
          if (this$1.composing) {
            if (this$1.composing.done) { this$1.composing = null; }
            else { return }
          }
          this$1.updateFromDOM();
        }, 80);
      };

      ContentEditableInput.prototype.updateFromDOM = function () {
          var this$1 = this;

        if (this.cm.isReadOnly() || !this.pollContent())
          { runInOp(this.cm, function () { return regChange(this$1.cm); }); }
      };

      ContentEditableInput.prototype.setUneditable = function (node) {
        node.contentEditable = "false";
      };

      ContentEditableInput.prototype.onKeyPress = function (e) {
        if (e.charCode == 0 || this.composing) { return }
        e.preventDefault();
        if (!this.cm.isReadOnly())
          { operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0); }
      };

      ContentEditableInput.prototype.readOnlyChanged = function (val) {
        this.div.contentEditable = String(val != "nocursor");
      };

      ContentEditableInput.prototype.onContextMenu = function () {};
      ContentEditableInput.prototype.resetPosition = function () {};

      ContentEditableInput.prototype.needsContentAttribute = true;

      function posToDOM(cm, pos) {
        var view = findViewForLine(cm, pos.line);
        if (!view || view.hidden) { return null }
        var line = getLine(cm.doc, pos.line);
        var info = mapFromLineView(view, line, pos.line);

        var order = getOrder(line, cm.doc.direction), side = "left";
        if (order) {
          var partPos = getBidiPartAt(order, pos.ch);
          side = partPos % 2 ? "right" : "left";
        }
        var result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
        result.offset = result.collapse == "right" ? result.end : result.start;
        return result
      }

      function isInGutter(node) {
        for (var scan = node; scan; scan = scan.parentNode)
          { if (/CodeMirror-gutter-wrapper/.test(scan.className)) { return true } }
        return false
      }

      function badPos(pos, bad) { if (bad) { pos.bad = true; } return pos }

      function domTextBetween(cm, from, to, fromLine, toLine) {
        var text = "", closing = false, lineSep = cm.doc.lineSeparator(), extraLinebreak = false;
        function recognizeMarker(id) { return function (marker) { return marker.id == id; } }
        function close() {
          if (closing) {
            text += lineSep;
            if (extraLinebreak) { text += lineSep; }
            closing = extraLinebreak = false;
          }
        }
        function addText(str) {
          if (str) {
            close();
            text += str;
          }
        }
        function walk(node) {
          if (node.nodeType == 1) {
            var cmText = node.getAttribute("cm-text");
            if (cmText) {
              addText(cmText);
              return
            }
            var markerID = node.getAttribute("cm-marker"), range$$1;
            if (markerID) {
              var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
              if (found.length && (range$$1 = found[0].find(0)))
                { addText(getBetween(cm.doc, range$$1.from, range$$1.to).join(lineSep)); }
              return
            }
            if (node.getAttribute("contenteditable") == "false") { return }
            var isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
            if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0) { return }

            if (isBlock) { close(); }
            for (var i = 0; i < node.childNodes.length; i++)
              { walk(node.childNodes[i]); }

            if (/^(pre|p)$/i.test(node.nodeName)) { extraLinebreak = true; }
            if (isBlock) { closing = true; }
          } else if (node.nodeType == 3) {
            addText(node.nodeValue.replace(/\u200b/g, "").replace(/\u00a0/g, " "));
          }
        }
        for (;;) {
          walk(from);
          if (from == to) { break }
          from = from.nextSibling;
          extraLinebreak = false;
        }
        return text
      }

      function domToPos(cm, node, offset) {
        var lineNode;
        if (node == cm.display.lineDiv) {
          lineNode = cm.display.lineDiv.childNodes[offset];
          if (!lineNode) { return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true) }
          node = null; offset = 0;
        } else {
          for (lineNode = node;; lineNode = lineNode.parentNode) {
            if (!lineNode || lineNode == cm.display.lineDiv) { return null }
            if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) { break }
          }
        }
        for (var i = 0; i < cm.display.view.length; i++) {
          var lineView = cm.display.view[i];
          if (lineView.node == lineNode)
            { return locateNodeInLineView(lineView, node, offset) }
        }
      }

      function locateNodeInLineView(lineView, node, offset) {
        var wrapper = lineView.text.firstChild, bad = false;
        if (!node || !contains(wrapper, node)) { return badPos(Pos(lineNo(lineView.line), 0), true) }
        if (node == wrapper) {
          bad = true;
          node = wrapper.childNodes[offset];
          offset = 0;
          if (!node) {
            var line = lineView.rest ? lst(lineView.rest) : lineView.line;
            return badPos(Pos(lineNo(line), line.text.length), bad)
          }
        }

        var textNode = node.nodeType == 3 ? node : null, topNode = node;
        if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
          textNode = node.firstChild;
          if (offset) { offset = textNode.nodeValue.length; }
        }
        while (topNode.parentNode != wrapper) { topNode = topNode.parentNode; }
        var measure = lineView.measure, maps = measure.maps;

        function find(textNode, topNode, offset) {
          for (var i = -1; i < (maps ? maps.length : 0); i++) {
            var map$$1 = i < 0 ? measure.map : maps[i];
            for (var j = 0; j < map$$1.length; j += 3) {
              var curNode = map$$1[j + 2];
              if (curNode == textNode || curNode == topNode) {
                var line = lineNo(i < 0 ? lineView.line : lineView.rest[i]);
                var ch = map$$1[j] + offset;
                if (offset < 0 || curNode != textNode) { ch = map$$1[j + (offset ? 1 : 0)]; }
                return Pos(line, ch)
              }
            }
          }
        }
        var found = find(textNode, topNode, offset);
        if (found) { return badPos(found, bad) }

        // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
        for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
          found = find(after, after.firstChild, 0);
          if (found)
            { return badPos(Pos(found.line, found.ch - dist), bad) }
          else
            { dist += after.textContent.length; }
        }
        for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
          found = find(before, before.firstChild, -1);
          if (found)
            { return badPos(Pos(found.line, found.ch + dist$1), bad) }
          else
            { dist$1 += before.textContent.length; }
        }
      }

      // TEXTAREA INPUT STYLE

      var TextareaInput = function(cm) {
        this.cm = cm;
        // See input.poll and input.reset
        this.prevInput = "";

        // Flag that indicates whether we expect input to appear real soon
        // now (after some event like 'keypress' or 'input') and are
        // polling intensively.
        this.pollingFast = false;
        // Self-resetting timeout for the poller
        this.polling = new Delayed();
        // Used to work around IE issue with selection being forgotten when focus moves away from textarea
        this.hasSelection = false;
        this.composing = null;
      };

      TextareaInput.prototype.init = function (display) {
          var this$1 = this;

        var input = this, cm = this.cm;
        this.createField(display);
        var te = this.textarea;

        display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);

        // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
        if (ios) { te.style.width = "0px"; }

        on(te, "input", function () {
          if (ie && ie_version >= 9 && this$1.hasSelection) { this$1.hasSelection = null; }
          input.poll();
        });

        on(te, "paste", function (e) {
          if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }

          cm.state.pasteIncoming = +new Date;
          input.fastPoll();
        });

        function prepareCopyCut(e) {
          if (signalDOMEvent(cm, e)) { return }
          if (cm.somethingSelected()) {
            setLastCopied({lineWise: false, text: cm.getSelections()});
          } else if (!cm.options.lineWiseCopyCut) {
            return
          } else {
            var ranges = copyableRanges(cm);
            setLastCopied({lineWise: true, text: ranges.text});
            if (e.type == "cut") {
              cm.setSelections(ranges.ranges, null, sel_dontScroll);
            } else {
              input.prevInput = "";
              te.value = ranges.text.join("\n");
              selectInput(te);
            }
          }
          if (e.type == "cut") { cm.state.cutIncoming = +new Date; }
        }
        on(te, "cut", prepareCopyCut);
        on(te, "copy", prepareCopyCut);

        on(display.scroller, "paste", function (e) {
          if (eventInWidget(display, e) || signalDOMEvent(cm, e)) { return }
          if (!te.dispatchEvent) {
            cm.state.pasteIncoming = +new Date;
            input.focus();
            return
          }

          // Pass the `paste` event to the textarea so it's handled by its event listener.
          var event = new Event("paste");
          event.clipboardData = e.clipboardData;
          te.dispatchEvent(event);
        });

        // Prevent normal selection in the editor (we handle our own)
        on(display.lineSpace, "selectstart", function (e) {
          if (!eventInWidget(display, e)) { e_preventDefault(e); }
        });

        on(te, "compositionstart", function () {
          var start = cm.getCursor("from");
          if (input.composing) { input.composing.range.clear(); }
          input.composing = {
            start: start,
            range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
          };
        });
        on(te, "compositionend", function () {
          if (input.composing) {
            input.poll();
            input.composing.range.clear();
            input.composing = null;
          }
        });
      };

      TextareaInput.prototype.createField = function (_display) {
        // Wraps and hides input textarea
        this.wrapper = hiddenTextarea();
        // The semihidden textarea that is focused when the editor is
        // focused, and receives input.
        this.textarea = this.wrapper.firstChild;
      };

      TextareaInput.prototype.prepareSelection = function () {
        // Redraw the selection and/or cursor
        var cm = this.cm, display = cm.display, doc = cm.doc;
        var result = prepareSelection(cm);

        // Move the hidden textarea near the cursor to prevent scrolling artifacts
        if (cm.options.moveInputWithCursor) {
          var headPos = cursorCoords(cm, doc.sel.primary().head, "div");
          var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
          result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                              headPos.top + lineOff.top - wrapOff.top));
          result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                               headPos.left + lineOff.left - wrapOff.left));
        }

        return result
      };

      TextareaInput.prototype.showSelection = function (drawn) {
        var cm = this.cm, display = cm.display;
        removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
        removeChildrenAndAdd(display.selectionDiv, drawn.selection);
        if (drawn.teTop != null) {
          this.wrapper.style.top = drawn.teTop + "px";
          this.wrapper.style.left = drawn.teLeft + "px";
        }
      };

      // Reset the input to correspond to the selection (or to be empty,
      // when not typing and nothing is selected)
      TextareaInput.prototype.reset = function (typing) {
        if (this.contextMenuPending || this.composing) { return }
        var cm = this.cm;
        if (cm.somethingSelected()) {
          this.prevInput = "";
          var content = cm.getSelection();
          this.textarea.value = content;
          if (cm.state.focused) { selectInput(this.textarea); }
          if (ie && ie_version >= 9) { this.hasSelection = content; }
        } else if (!typing) {
          this.prevInput = this.textarea.value = "";
          if (ie && ie_version >= 9) { this.hasSelection = null; }
        }
      };

      TextareaInput.prototype.getField = function () { return this.textarea };

      TextareaInput.prototype.supportsTouch = function () { return false };

      TextareaInput.prototype.focus = function () {
        if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
          try { this.textarea.focus(); }
          catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
        }
      };

      TextareaInput.prototype.blur = function () { this.textarea.blur(); };

      TextareaInput.prototype.resetPosition = function () {
        this.wrapper.style.top = this.wrapper.style.left = 0;
      };

      TextareaInput.prototype.receivedFocus = function () { this.slowPoll(); };

      // Poll for input changes, using the normal rate of polling. This
      // runs as long as the editor is focused.
      TextareaInput.prototype.slowPoll = function () {
          var this$1 = this;

        if (this.pollingFast) { return }
        this.polling.set(this.cm.options.pollInterval, function () {
          this$1.poll();
          if (this$1.cm.state.focused) { this$1.slowPoll(); }
        });
      };

      // When an event has just come in that is likely to add or change
      // something in the input textarea, we poll faster, to ensure that
      // the change appears on the screen quickly.
      TextareaInput.prototype.fastPoll = function () {
        var missed = false, input = this;
        input.pollingFast = true;
        function p() {
          var changed = input.poll();
          if (!changed && !missed) {missed = true; input.polling.set(60, p);}
          else {input.pollingFast = false; input.slowPoll();}
        }
        input.polling.set(20, p);
      };

      // Read input from the textarea, and update the document to match.
      // When something is selected, it is present in the textarea, and
      // selected (unless it is huge, in which case a placeholder is
      // used). When nothing is selected, the cursor sits after previously
      // seen text (can be empty), which is stored in prevInput (we must
      // not reset the textarea when typing, because that breaks IME).
      TextareaInput.prototype.poll = function () {
          var this$1 = this;

        var cm = this.cm, input = this.textarea, prevInput = this.prevInput;
        // Since this is called a *lot*, try to bail out as cheaply as
        // possible when it is clear that nothing happened. hasSelection
        // will be the case when there is a lot of text in the textarea,
        // in which case reading its value would be expensive.
        if (this.contextMenuPending || !cm.state.focused ||
            (hasSelection(input) && !prevInput && !this.composing) ||
            cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
          { return false }

        var text = input.value;
        // If nothing changed, bail.
        if (text == prevInput && !cm.somethingSelected()) { return false }
        // Work around nonsensical selection resetting in IE9/10, and
        // inexplicable appearance of private area unicode characters on
        // some key combos in Mac (#2689).
        if (ie && ie_version >= 9 && this.hasSelection === text ||
            mac && /[\uf700-\uf7ff]/.test(text)) {
          cm.display.input.reset();
          return false
        }

        if (cm.doc.sel == cm.display.selForContextMenu) {
          var first = text.charCodeAt(0);
          if (first == 0x200b && !prevInput) { prevInput = "\u200b"; }
          if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo") }
        }
        // Find the part of the input that is actually new
        var same = 0, l = Math.min(prevInput.length, text.length);
        while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) { ++same; }

        runInOp(cm, function () {
          applyTextInput(cm, text.slice(same), prevInput.length - same,
                         null, this$1.composing ? "*compose" : null);

          // Don't leave long text in the textarea, since it makes further polling slow
          if (text.length > 1000 || text.indexOf("\n") > -1) { input.value = this$1.prevInput = ""; }
          else { this$1.prevInput = text; }

          if (this$1.composing) {
            this$1.composing.range.clear();
            this$1.composing.range = cm.markText(this$1.composing.start, cm.getCursor("to"),
                                               {className: "CodeMirror-composing"});
          }
        });
        return true
      };

      TextareaInput.prototype.ensurePolled = function () {
        if (this.pollingFast && this.poll()) { this.pollingFast = false; }
      };

      TextareaInput.prototype.onKeyPress = function () {
        if (ie && ie_version >= 9) { this.hasSelection = null; }
        this.fastPoll();
      };

      TextareaInput.prototype.onContextMenu = function (e) {
        var input = this, cm = input.cm, display = cm.display, te = input.textarea;
        if (input.contextMenuPending) { input.contextMenuPending(); }
        var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
        if (!pos || presto) { return } // Opera is difficult.

        // Reset the current text selection only if the click is done outside of the selection
        // and 'resetSelectionOnContextMenu' option is true.
        var reset = cm.options.resetSelectionOnContextMenu;
        if (reset && cm.doc.sel.contains(pos) == -1)
          { operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll); }

        var oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText;
        var wrapperBox = input.wrapper.offsetParent.getBoundingClientRect();
        input.wrapper.style.cssText = "position: static";
        te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
        var oldScrollY;
        if (webkit) { oldScrollY = window.scrollY; } // Work around Chrome issue (#2712)
        display.input.focus();
        if (webkit) { window.scrollTo(null, oldScrollY); }
        display.input.reset();
        // Adds "Select all" to context menu in FF
        if (!cm.somethingSelected()) { te.value = input.prevInput = " "; }
        input.contextMenuPending = rehide;
        display.selForContextMenu = cm.doc.sel;
        clearTimeout(display.detectingSelectAll);

        // Select-all will be greyed out if there's nothing to select, so
        // this adds a zero-width space so that we can later check whether
        // it got selected.
        function prepareSelectAllHack() {
          if (te.selectionStart != null) {
            var selected = cm.somethingSelected();
            var extval = "\u200b" + (selected ? te.value : "");
            te.value = "\u21da"; // Used to catch context-menu undo
            te.value = extval;
            input.prevInput = selected ? "" : "\u200b";
            te.selectionStart = 1; te.selectionEnd = extval.length;
            // Re-set this, in case some other handler touched the
            // selection in the meantime.
            display.selForContextMenu = cm.doc.sel;
          }
        }
        function rehide() {
          if (input.contextMenuPending != rehide) { return }
          input.contextMenuPending = false;
          input.wrapper.style.cssText = oldWrapperCSS;
          te.style.cssText = oldCSS;
          if (ie && ie_version < 9) { display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos); }

          // Try to detect the user choosing select-all
          if (te.selectionStart != null) {
            if (!ie || (ie && ie_version < 9)) { prepareSelectAllHack(); }
            var i = 0, poll = function () {
              if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
                  te.selectionEnd > 0 && input.prevInput == "\u200b") {
                operation(cm, selectAll)(cm);
              } else if (i++ < 10) {
                display.detectingSelectAll = setTimeout(poll, 500);
              } else {
                display.selForContextMenu = null;
                display.input.reset();
              }
            };
            display.detectingSelectAll = setTimeout(poll, 200);
          }
        }

        if (ie && ie_version >= 9) { prepareSelectAllHack(); }
        if (captureRightClick) {
          e_stop(e);
          var mouseup = function () {
            off(window, "mouseup", mouseup);
            setTimeout(rehide, 20);
          };
          on(window, "mouseup", mouseup);
        } else {
          setTimeout(rehide, 50);
        }
      };

      TextareaInput.prototype.readOnlyChanged = function (val) {
        if (!val) { this.reset(); }
        this.textarea.disabled = val == "nocursor";
      };

      TextareaInput.prototype.setUneditable = function () {};

      TextareaInput.prototype.needsContentAttribute = false;

      function fromTextArea(textarea, options) {
        options = options ? copyObj(options) : {};
        options.value = textarea.value;
        if (!options.tabindex && textarea.tabIndex)
          { options.tabindex = textarea.tabIndex; }
        if (!options.placeholder && textarea.placeholder)
          { options.placeholder = textarea.placeholder; }
        // Set autofocus to true if this textarea is focused, or if it has
        // autofocus and no other element is focused.
        if (options.autofocus == null) {
          var hasFocus = activeElt();
          options.autofocus = hasFocus == textarea ||
            textarea.getAttribute("autofocus") != null && hasFocus == document.body;
        }

        function save() {textarea.value = cm.getValue();}

        var realSubmit;
        if (textarea.form) {
          on(textarea.form, "submit", save);
          // Deplorable hack to make the submit method do the right thing.
          if (!options.leaveSubmitMethodAlone) {
            var form = textarea.form;
            realSubmit = form.submit;
            try {
              var wrappedSubmit = form.submit = function () {
                save();
                form.submit = realSubmit;
                form.submit();
                form.submit = wrappedSubmit;
              };
            } catch(e) {}
          }
        }

        options.finishInit = function (cm) {
          cm.save = save;
          cm.getTextArea = function () { return textarea; };
          cm.toTextArea = function () {
            cm.toTextArea = isNaN; // Prevent this from being ran twice
            save();
            textarea.parentNode.removeChild(cm.getWrapperElement());
            textarea.style.display = "";
            if (textarea.form) {
              off(textarea.form, "submit", save);
              if (!options.leaveSubmitMethodAlone && typeof textarea.form.submit == "function")
                { textarea.form.submit = realSubmit; }
            }
          };
        };

        textarea.style.display = "none";
        var cm = CodeMirror(function (node) { return textarea.parentNode.insertBefore(node, textarea.nextSibling); },
          options);
        return cm
      }

      function addLegacyProps(CodeMirror) {
        CodeMirror.off = off;
        CodeMirror.on = on;
        CodeMirror.wheelEventPixels = wheelEventPixels;
        CodeMirror.Doc = Doc;
        CodeMirror.splitLines = splitLinesAuto;
        CodeMirror.countColumn = countColumn;
        CodeMirror.findColumn = findColumn;
        CodeMirror.isWordChar = isWordCharBasic;
        CodeMirror.Pass = Pass;
        CodeMirror.signal = signal;
        CodeMirror.Line = Line;
        CodeMirror.changeEnd = changeEnd;
        CodeMirror.scrollbarModel = scrollbarModel;
        CodeMirror.Pos = Pos;
        CodeMirror.cmpPos = cmp;
        CodeMirror.modes = modes;
        CodeMirror.mimeModes = mimeModes;
        CodeMirror.resolveMode = resolveMode;
        CodeMirror.getMode = getMode;
        CodeMirror.modeExtensions = modeExtensions;
        CodeMirror.extendMode = extendMode;
        CodeMirror.copyState = copyState;
        CodeMirror.startState = startState;
        CodeMirror.innerMode = innerMode;
        CodeMirror.commands = commands;
        CodeMirror.keyMap = keyMap;
        CodeMirror.keyName = keyName;
        CodeMirror.isModifierKey = isModifierKey;
        CodeMirror.lookupKey = lookupKey;
        CodeMirror.normalizeKeyMap = normalizeKeyMap;
        CodeMirror.StringStream = StringStream;
        CodeMirror.SharedTextMarker = SharedTextMarker;
        CodeMirror.TextMarker = TextMarker;
        CodeMirror.LineWidget = LineWidget;
        CodeMirror.e_preventDefault = e_preventDefault;
        CodeMirror.e_stopPropagation = e_stopPropagation;
        CodeMirror.e_stop = e_stop;
        CodeMirror.addClass = addClass;
        CodeMirror.contains = contains;
        CodeMirror.rmClass = rmClass;
        CodeMirror.keyNames = keyNames;
      }

      // EDITOR CONSTRUCTOR

      defineOptions(CodeMirror);

      addEditorMethods(CodeMirror);

      // Set up methods on CodeMirror's prototype to redirect to the editor's document.
      var dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
      for (var prop in Doc.prototype) { if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
        { CodeMirror.prototype[prop] = (function(method) {
          return function() {return method.apply(this.doc, arguments)}
        })(Doc.prototype[prop]); } }

      eventMixin(Doc);
      CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput};

      // Extra arguments are stored as the mode's dependencies, which is
      // used by (legacy) mechanisms like loadmode.js to automatically
      // load a mode. (Preferred mechanism is the require/define calls.)
      CodeMirror.defineMode = function(name/*, mode, …*/) {
        if (!CodeMirror.defaults.mode && name != "null") { CodeMirror.defaults.mode = name; }
        defineMode.apply(this, arguments);
      };

      CodeMirror.defineMIME = defineMIME;

      // Minimal default mode.
      CodeMirror.defineMode("null", function () { return ({token: function (stream) { return stream.skipToEnd(); }}); });
      CodeMirror.defineMIME("text/plain", "null");

      // EXTENSIONS

      CodeMirror.defineExtension = function (name, func) {
        CodeMirror.prototype[name] = func;
      };
      CodeMirror.defineDocExtension = function (name, func) {
        Doc.prototype[name] = func;
      };

      CodeMirror.fromTextArea = fromTextArea;

      addLegacyProps(CodeMirror);

      CodeMirror.version = "5.50.2";

      return CodeMirror;

    })));
    });

    /* components/CodeMirror/CodeMirror.svelte generated by Svelte v3.23.0 */
    const file$b = "components/CodeMirror/CodeMirror.svelte";

    function create_fragment$b(ctx) {
    	let link;
    	let t;
    	let textarea;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			textarea = element("textarea");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "./components/CodeMirror/style.css");
    			add_location(link, file$b, 48, 2, 992);
    			attr_dev(textarea, "class", "textarea");
    			textarea.value = /*text*/ ctx[0];
    			add_location(textarea, file$b, 51, 0, 1075);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t, anchor);
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[7](textarea);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) {
    				prop_dev(textarea, "value", /*text*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[7](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { text = "" } = $$props;
    	let { autofocus = true } = $$props;
    	let editor;
    	let el;

    	let { highlight = () => {
    		
    	} } = $$props;

    	let { onEnter = e => {
    		return lib.Pass;
    	} } = $$props;

    	const clear = function (doc) {
    		doc.getAllMarks().forEach(m => m.clear());
    	};

    	onMount(() => {
    		editor = lib.fromTextArea(el, { autofocus, extraKeys: { Enter: onEnter } });

    		editor.on("change", doc => {
    			clear(doc);
    			$$invalidate(0, text = doc.getValue());
    			let offsets = highlight(text);

    			offsets.forEach(m => {
    				let start = doc.posFromIndex(m.start);
    				let end = doc.posFromIndex(m.end);
    				editor.markText(start, end, { className: m.tag });
    			});
    		});

    		lib.signal(editor, "change", editor);
    	});

    	const writable_props = ["text", "autofocus", "highlight", "onEnter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CodeMirror> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CodeMirror", $$slots, []);

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("autofocus" in $$props) $$invalidate(2, autofocus = $$props.autofocus);
    		if ("highlight" in $$props) $$invalidate(3, highlight = $$props.highlight);
    		if ("onEnter" in $$props) $$invalidate(4, onEnter = $$props.onEnter);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		CodeMirror: lib,
    		text,
    		autofocus,
    		editor,
    		el,
    		highlight,
    		onEnter,
    		clear
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("autofocus" in $$props) $$invalidate(2, autofocus = $$props.autofocus);
    		if ("editor" in $$props) editor = $$props.editor;
    		if ("el" in $$props) $$invalidate(1, el = $$props.el);
    		if ("highlight" in $$props) $$invalidate(3, highlight = $$props.highlight);
    		if ("onEnter" in $$props) $$invalidate(4, onEnter = $$props.onEnter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, el, autofocus, highlight, onEnter, editor, clear, textarea_binding];
    }

    class CodeMirror_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			text: 0,
    			autofocus: 2,
    			highlight: 3,
    			onEnter: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeMirror_1",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get text() {
    		throw new Error("<CodeMirror>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<CodeMirror>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autofocus() {
    		throw new Error("<CodeMirror>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<CodeMirror>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlight() {
    		throw new Error("<CodeMirror>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlight(value) {
    		throw new Error("<CodeMirror>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onEnter() {
    		throw new Error("<CodeMirror>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onEnter(value) {
    		throw new Error("<CodeMirror>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */

    const { console: console_1$1 } = globals;

    // (33:0) {:else}
    function create_else_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(33:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:0) {#if !$user}
    function create_if_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:0) {#if !$user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let updating_text;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block_anchor;
    	let current;

    	function codemirror_text_binding(value) {
    		/*codemirror_text_binding*/ ctx[7].call(null, value);
    	}

    	let codemirror_props = { highlight: /*highlight*/ ctx[2] };

    	if (/*text*/ ctx[0] !== void 0) {
    		codemirror_props.text = /*text*/ ctx[0];
    	}

    	const codemirror = new CodeMirror_1({ props: codemirror_props, $$inline: true });
    	binding_callbacks.push(() => bind(codemirror, "text", codemirror_text_binding));

    	const daypick = new DayPick$1({
    			props: { callback: /*func*/ ctx[8] },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (!/*$user*/ ctx[1]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			create_component(codemirror.$$.fragment);
    			t0 = space();
    			t1 = text(/*text*/ ctx[0]);
    			t2 = space();
    			create_component(daypick.$$.fragment);
    			t3 = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(codemirror, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(daypick, target, anchor);
    			insert_dev(target, t3, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const codemirror_changes = {};

    			if (!updating_text && dirty & /*text*/ 1) {
    				updating_text = true;
    				codemirror_changes.text = /*text*/ ctx[0];
    				add_flush_callback(() => updating_text = false);
    			}

    			codemirror.$set(codemirror_changes);
    			if (!current || dirty & /*text*/ 1) set_data_dev(t1, /*text*/ ctx[0]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(codemirror.$$.fragment, local);
    			transition_in(daypick.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(codemirror.$$.fragment, local);
    			transition_out(daypick.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(codemirror, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			destroy_component(daypick, detaching);
    			if (detaching) detach_dev(t3);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $user;
    	let $pass;
    	let $data;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(1, $user = $$value));
    	validate_store(pass, "pass");
    	component_subscribe($$self, pass, $$value => $$invalidate(3, $pass = $$value));
    	validate_store(data$1, "data");
    	component_subscribe($$self, data$1, $$value => $$invalidate(4, $data = $$value));

    	const logout = function () {
    		set_store_value(user, $user = "");
    		set_store_value(pass, $pass = "");
    		localStorage.setItem("user", "");
    		localStorage.setItem("pass", "");
    		set_store_value(data$1, $data = {});
    	};

    	const submit = () => {
    		
    	};

    	const highlight = function (str = "") {
    		let matches = [...str.matchAll(/\.[^\s\.]+/g)];

    		return matches.map(m => {
    			return {
    				start: m.index,
    				end: m[0].length + m.index,
    				tag: "tag"
    			};
    		});
    	};

    	let text = "in the .town where i was born.. there liv.ed a man";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function codemirror_text_binding(value) {
    		text = value;
    		$$invalidate(0, text);
    	}

    	const func = date => console.log(date.format());

    	$$self.$capture_state = () => ({
    		User,
    		Login,
    		DayPick: DayPick$1,
    		CodeMirror: CodeMirror_1,
    		user,
    		pass,
    		data: data$1,
    		logout,
    		submit,
    		highlight,
    		text,
    		$user,
    		$pass,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		text,
    		$user,
    		highlight,
    		$pass,
    		$data,
    		logout,
    		submit,
    		codemirror_text_binding,
    		func
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    // allow bookmarking user/pass
    let u$1 = undefined;
    let p$1 = undefined;

    // wire-in query params
    const URLSearchParams = window.URLSearchParams;
    if (typeof URLSearchParams !== undefined) {
      const urlParams = new URLSearchParams(window.location.search);
      let param = urlParams.get('u');
      if (param) {
        u$1 = param;
      }
      param = urlParams.get('p');
      if (param) {
        p$1 = param;
      }
    }

    const app = new App({
      target: document.body,
      props: { u: u$1, p: p$1 },
    });

    return app;

}());
