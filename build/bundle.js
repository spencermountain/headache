
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
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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

    class MarginItem {
      constructor(parseable_text) {
        this.raw_data = get_top_level_text(parseable_text);
        this.value = this.get_value();
        this.annotations = this.set_annotations();
        this.children = [];
        var _this = this; // allows this instance to be visible inside forEach loop

        var child_parseable_text = get_child_text_trees(parseable_text);
        console.log(child_parseable_text);

        child_parseable_text.forEach(function (child_text) {
          var child_item = new MarginItem(child_text);
          _this.children.push(child_item);
        });
      }

      get_value() {
        // leading characters regex:  /^([-_> ])*/g;
        // trailing characters regex: /(([-_>* ])+$)/g;
        // annotations regex = ??????? // <-----TODO
        var regex_trim_these = /(^([-_>* \t])*)|(([-_>* \t])+$)/g;
        return this.raw_data.replace(regex_trim_these, '')
      }

      trim_characters(str, characters_to_remove, leading = true) {}

      get_annotations(key = false) {
        if (!key) {
          return this.annotations
        }
        return this.annotations[key]
      }

      set_annotations() {
        // bracketed segments regex: /\[(?:[^\]\[]+|\[(?:[^\]\[]+|\[[^\]\[]*\])*\])*\]/g
        var annotations = {};
        var key_value_separator = ':';
        var regex_annotations = /\[(?:[^\]\[]+|\[(?:[^\]\[]+|\[[^\]\[]*\])*\])*\]/g;
        var raw_annotations = this.raw_data.match(regex_annotations);

        if (raw_annotations) {
          raw_annotations.forEach(function (raw_annotation) {
            var key;
            var value = null;
            var raw_annotation_unwrapped = raw_annotation.slice(1, -1); // remove ] & [
            var key_value_separator_index = raw_annotation_unwrapped.indexOf(key_value_separator);
            if (key_value_separator_index < 0) {
              // no annotation separator found
              key = raw_annotation_unwrapped;
            } else {
              key = raw_annotation_unwrapped.substring(0, key_value_separator_index);
              value = raw_annotation_unwrapped.substring(key_value_separator_index + 1, raw_annotation_unwrapped.length);
            }
            annotations[key] = value; // <-------- TODO: assign annotation's value to annotation's key(not currently functioning)
          });
        }
        return annotations
      }
    }

    function get_child_text_trees(text_tree) {

      var lines = text_tree.split('\n');
      var top_level = get_line_indentation_number(lines[0]);

      // Strip off parent text:
      for (var i = 0; i < lines.length; i++) {
        if (get_line_indentation_number(lines[i]) === top_level) {
          lines.splice(i, 1);
        }
      }

      return get_margin_text_from_line_array(lines)
    }

    function get_top_level_text(text_tree) {
      var lines = text_tree.split('\n');
      return lines[0]
    }

    function get_margin_text_from_line_array(lines) {
      var child_texts = [];
      var current_indentation = null;
      var current_child_text = '';

      for (var i = 0; i < lines.length; i++) {
        if (!current_indentation) {
          current_indentation = get_line_indentation_number(lines[i]);
          current_child_text += lines[i];
        } else {
          if (get_line_indentation_number(lines[i]) === current_indentation) {
            child_texts.push(current_child_text);
            current_indentation = get_line_indentation_number(lines[i]);
            current_child_text = lines[i];
          } else {
            current_child_text += '\n' + lines[i];
          }
        }
      }

      if (current_child_text) {
        child_texts.push(current_child_text);
      }

      return child_texts
    }

    function get_line_indentation_number(text) {
      return text.search(/\S|$/)
    }

    var MarginParser = MarginItem;

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var TreeModel = createCommonjsModule(function (module, exports) {
    (function (f) {
      {
        module.exports = f();
      }
    })(function () {
      return (function () {
        function r(e, n, t) {
          function o(i, f) {
            if (!n[i]) {
              if (!e[i]) {
                var c = 'function' == typeof commonjsRequire && commonjsRequire;
                if (!f && c) return c(i, !0)
                if (u) return u(i, !0)
                var a = new Error("Cannot find module '" + i + "'");
                throw ((a.code = 'MODULE_NOT_FOUND'), a)
              }
              var p = (n[i] = { exports: {} });
              e[i][0].call(
                p.exports,
                function (r) {
                  var n = e[i][1][r];
                  return o(n || r)
                },
                p,
                p.exports,
                r,
                e,
                n,
                t
              );
            }
            return n[i].exports
          }
          for (var u = 'function' == typeof commonjsRequire && commonjsRequire, i = 0; i < t.length; i++) o(t[i]);
          return o
        }
        return r
      })()(
        {
          1: [
            function (require, module, exports) {
              var mergeSort, findInsertIndex;
              mergeSort = require('mergesort');
              findInsertIndex = require('find-insert-index');

              module.exports = (function () {

                var walkStrategies;

                walkStrategies = {};

                function k(result) {
                  return function () {
                    return result
                  }
                }

                function TreeModel(config) {
                  config = config || {};
                  this.config = config;
                  this.config.childrenPropertyName = config.childrenPropertyName || 'children';
                  this.config.modelComparatorFn = config.modelComparatorFn;
                }

                function addChildToNode(node, child) {
                  child.parent = node;
                  node.children.push(child);
                  return child
                }

                function Node(config, model) {
                  this.config = config;
                  this.model = model;
                  this.children = [];
                }

                TreeModel.prototype.parse = function (model) {
                  var i, childCount, node;

                  if (!(model instanceof Object)) {
                    throw new TypeError('Model must be of type object.')
                  }

                  node = new Node(this.config, model);
                  if (model[this.config.childrenPropertyName] instanceof Array) {
                    if (this.config.modelComparatorFn) {
                      model[this.config.childrenPropertyName] = mergeSort(
                        this.config.modelComparatorFn,
                        model[this.config.childrenPropertyName]
                      );
                    }
                    for (i = 0, childCount = model[this.config.childrenPropertyName].length; i < childCount; i++) {
                      addChildToNode(node, this.parse(model[this.config.childrenPropertyName][i]));
                    }
                  }
                  return node
                };

                function hasComparatorFunction(node) {
                  return typeof node.config.modelComparatorFn === 'function'
                }

                Node.prototype.isRoot = function () {
                  return this.parent === undefined
                };

                Node.prototype.hasChildren = function () {
                  return this.children.length > 0
                };

                function addChild(self, child, insertIndex) {
                  var index;

                  if (!(child instanceof Node)) {
                    throw new TypeError('Child must be of type Node.')
                  }

                  child.parent = self;
                  if (!(self.model[self.config.childrenPropertyName] instanceof Array)) {
                    self.model[self.config.childrenPropertyName] = [];
                  }

                  if (hasComparatorFunction(self)) {
                    // Find the index to insert the child
                    index = findInsertIndex(
                      self.config.modelComparatorFn,
                      self.model[self.config.childrenPropertyName],
                      child.model
                    );

                    // Add to the model children
                    self.model[self.config.childrenPropertyName].splice(index, 0, child.model);

                    // Add to the node children
                    self.children.splice(index, 0, child);
                  } else {
                    if (insertIndex === undefined) {
                      self.model[self.config.childrenPropertyName].push(child.model);
                      self.children.push(child);
                    } else {
                      if (insertIndex < 0 || insertIndex > self.children.length) {
                        throw new Error('Invalid index.')
                      }
                      self.model[self.config.childrenPropertyName].splice(insertIndex, 0, child.model);
                      self.children.splice(insertIndex, 0, child);
                    }
                  }
                  return child
                }

                Node.prototype.addChild = function (child) {
                  return addChild(this, child)
                };

                Node.prototype.addChildAtIndex = function (child, index) {
                  if (hasComparatorFunction(this)) {
                    throw new Error('Cannot add child at index when using a comparator function.')
                  }

                  return addChild(this, child, index)
                };

                Node.prototype.setIndex = function (index) {
                  if (hasComparatorFunction(this)) {
                    throw new Error('Cannot set node index when using a comparator function.')
                  }

                  if (this.isRoot()) {
                    if (index === 0) {
                      return this
                    }
                    throw new Error('Invalid index.')
                  }

                  if (index < 0 || index >= this.parent.children.length) {
                    throw new Error('Invalid index.')
                  }

                  var oldIndex = this.parent.children.indexOf(this);

                  this.parent.children.splice(index, 0, this.parent.children.splice(oldIndex, 1)[0]);

                  this.parent.model[this.parent.config.childrenPropertyName].splice(
                    index,
                    0,
                    this.parent.model[this.parent.config.childrenPropertyName].splice(oldIndex, 1)[0]
                  );

                  return this
                };

                Node.prototype.getPath = function () {
                  var path = []
                  ;(function addToPath(node) {
                    path.unshift(node);
                    if (!node.isRoot()) {
                      addToPath(node.parent);
                    }
                  })(this);
                  return path
                };

                Node.prototype.getIndex = function () {
                  if (this.isRoot()) {
                    return 0
                  }
                  return this.parent.children.indexOf(this)
                };

                /**
                 * Parse the arguments of traversal functions. These functions can take one optional
                 * first argument which is an options object. If present, this object will be stored
                 * in args.options. The only mandatory argument is the callback function which can
                 * appear in the first or second position (if an options object is given). This
                 * function will be saved to args.fn. The last optional argument is the context on
                 * which the callback function will be called. It will be available in args.ctx.
                 *
                 * @returns Parsed arguments.
                 */
                function parseArgs() {
                  var args = {};
                  if (arguments.length === 1) {
                    if (typeof arguments[0] === 'function') {
                      args.fn = arguments[0];
                    } else {
                      args.options = arguments[0];
                    }
                  } else if (arguments.length === 2) {
                    if (typeof arguments[0] === 'function') {
                      args.fn = arguments[0];
                      args.ctx = arguments[1];
                    } else {
                      args.options = arguments[0];
                      args.fn = arguments[1];
                    }
                  } else {
                    args.options = arguments[0];
                    args.fn = arguments[1];
                    args.ctx = arguments[2];
                  }
                  args.options = args.options || {};
                  if (!args.options.strategy) {
                    args.options.strategy = 'pre';
                  }
                  if (!walkStrategies[args.options.strategy]) {
                    throw new Error(
                      "Unknown tree walk strategy. Valid strategies are 'pre' [default], 'post' and 'breadth'."
                    )
                  }
                  return args
                }

                Node.prototype.walk = function () {
                  var args;
                  args = parseArgs.apply(this, arguments);
                  walkStrategies[args.options.strategy].call(this, args.fn, args.ctx);
                };

                walkStrategies.pre = function depthFirstPreOrder(callback, context) {
                  var i, childCount, keepGoing;
                  keepGoing = callback.call(context, this);
                  for (i = 0, childCount = this.children.length; i < childCount; i++) {
                    if (keepGoing === false) {
                      return false
                    }
                    keepGoing = depthFirstPreOrder.call(this.children[i], callback, context);
                  }
                  return keepGoing
                };

                walkStrategies.post = function depthFirstPostOrder(callback, context) {
                  var i, childCount, keepGoing;
                  for (i = 0, childCount = this.children.length; i < childCount; i++) {
                    keepGoing = depthFirstPostOrder.call(this.children[i], callback, context);
                    if (keepGoing === false) {
                      return false
                    }
                  }
                  keepGoing = callback.call(context, this);
                  return keepGoing
                };

                walkStrategies.breadth = function breadthFirst(callback, context) {
                  var queue = [this]
                  ;(function processQueue() {
                    var i, childCount, node;
                    if (queue.length === 0) {
                      return
                    }
                    node = queue.shift();
                    for (i = 0, childCount = node.children.length; i < childCount; i++) {
                      queue.push(node.children[i]);
                    }
                    if (callback.call(context, node) !== false) {
                      processQueue();
                    }
                  })();
                };

                Node.prototype.all = function () {
                  var args,
                    all = [];
                  args = parseArgs.apply(this, arguments);
                  args.fn = args.fn || k(true);
                  walkStrategies[args.options.strategy].call(
                    this,
                    function (node) {
                      if (args.fn.call(args.ctx, node)) {
                        all.push(node);
                      }
                    },
                    args.ctx
                  );
                  return all
                };

                Node.prototype.first = function () {
                  var args, first;
                  args = parseArgs.apply(this, arguments);
                  args.fn = args.fn || k(true);
                  walkStrategies[args.options.strategy].call(
                    this,
                    function (node) {
                      if (args.fn.call(args.ctx, node)) {
                        first = node;
                        return false
                      }
                    },
                    args.ctx
                  );
                  return first
                };

                Node.prototype.drop = function () {
                  var indexOfChild;
                  if (!this.isRoot()) {
                    indexOfChild = this.parent.children.indexOf(this);
                    this.parent.children.splice(indexOfChild, 1);
                    this.parent.model[this.config.childrenPropertyName].splice(indexOfChild, 1);
                    this.parent = undefined;
                    delete this.parent;
                  }
                  return this
                };

                return TreeModel
              })();
            },
            { 'find-insert-index': 2, mergesort: 3 },
          ],
          2: [
            function (require, module, exports) {
              module.exports = (function () {

                /**
                 * Find the index to insert an element in array keeping the sort order.
                 *
                 * @param {function} comparatorFn The comparator function which sorted the array.
                 * @param {array} arr The sorted array.
                 * @param {object} el The element to insert.
                 */
                function findInsertIndex(comparatorFn, arr, el) {
                  var i, len;
                  for (i = 0, len = arr.length; i < len; i++) {
                    if (comparatorFn(arr[i], el) > 0) {
                      break
                    }
                  }
                  return i
                }

                return findInsertIndex
              })();
            },
            {},
          ],
          3: [
            function (require, module, exports) {
              module.exports = (function () {

                /**
                 * Sort an array using the merge sort algorithm.
                 *
                 * @param {function} comparatorFn The comparator function.
                 * @param {array} arr The array to sort.
                 * @returns {array} The sorted array.
                 */
                function mergeSort(comparatorFn, arr) {
                  var len = arr.length,
                    firstHalf,
                    secondHalf;
                  if (len >= 2) {
                    firstHalf = arr.slice(0, len / 2);
                    secondHalf = arr.slice(len / 2, len);
                    return merge(comparatorFn, mergeSort(comparatorFn, firstHalf), mergeSort(comparatorFn, secondHalf))
                  } else {
                    return arr.slice()
                  }
                }

                /**
                 * The merge part of the merge sort algorithm.
                 *
                 * @param {function} comparatorFn The comparator function.
                 * @param {array} arr1 The first sorted array.
                 * @param {array} arr2 The second sorted array.
                 * @returns {array} The merged and sorted array.
                 */
                function merge(comparatorFn, arr1, arr2) {
                  var result = [],
                    left1 = arr1.length,
                    left2 = arr2.length;
                  while (left1 > 0 && left2 > 0) {
                    if (comparatorFn(arr1[0], arr2[0]) <= 0) {
                      result.push(arr1.shift());
                      left1--;
                    } else {
                      result.push(arr2.shift());
                      left2--;
                    }
                  }
                  if (left1 > 0) {
                    result.push.apply(result, arr1);
                  } else {
                    result.push.apply(result, arr2);
                  }
                  return result
                }

                return mergeSort
              })();
            },
            {},
          ],
        },
        {},
        [1]
      )(1)
    });
    });

    class MarginTree extends TreeModel {}

    const parse = function (txt) {
      var sampleTree = new MarginTree();
      let item = new MarginParser(txt);
      var res = sampleTree.parse(item).model;
      return res
    };
    // let txt = 'i am [key: val] trying this out'
    // console.log(parse(txt))

    /* Margin.svelte generated by Svelte v3.23.0 */
    const file = "Margin.svelte";

    function create_fragment(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "class", "textarea svelte-1gmm70e");
    			add_location(textarea, file, 21, 0, 352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[3]),
    					listen_dev(
    						textarea,
    						"input",
    						function () {
    							if (is_function(/*onInput*/ ctx[1])) /*onInput*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			run_all(dispose);
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

    function instance($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;

    	let { callback = () => {
    		
    	} } = $$props;

    	let { onInput = () => {
    		let res = parse(value);
    		callback(res);
    	} } = $$props;

    	const writable_props = ["value", "callback", "onInput"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Margin> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Margin", $$slots, []);

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("callback" in $$props) $$invalidate(2, callback = $$props.callback);
    		if ("onInput" in $$props) $$invalidate(1, onInput = $$props.onInput);
    	};

    	$$self.$capture_state = () => ({ parse, value, callback, onInput });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("callback" in $$props) $$invalidate(2, callback = $$props.callback);
    		if ("onInput" in $$props) $$invalidate(1, onInput = $$props.onInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, onInput, callback, textarea_input_handler];
    }

    class Margin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { value: 0, callback: 2, onInput: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Margin",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get value() {
    		throw new Error("<Margin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Margin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<Margin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Margin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onInput() {
    		throw new Error("<Margin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onInput(value) {
    		throw new Error("<Margin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* App.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals;
    const file$1 = "App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (24:2) {#each keys as key}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*key*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file$1, 24, 4, 409);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*keys*/ 4 && t_value !== (t_value = /*key*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:2) {#each keys as key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let t0;
    	let input;
    	let t1;
    	let div1;
    	let updating_value;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let current;
    	let mounted;
    	let dispose;

    	function margin_value_binding(value) {
    		/*margin_value_binding*/ ctx[5].call(null, value);
    	}

    	let margin_props = { callback: /*onType*/ ctx[3] };

    	if (/*value*/ ctx[1] !== void 0) {
    		margin_props.value = /*value*/ ctx[1];
    	}

    	const margin = new Margin({ props: margin_props, $$inline: true });
    	binding_callbacks.push(() => bind(margin, "value", margin_value_binding));
    	let each_value = /*keys*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("user:\n  ");
    			input = element("input");
    			t1 = space();
    			div1 = element("div");
    			create_component(margin.$$.fragment);
    			t2 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			div3.textContent = "[calendar]";
    			add_location(input, file$1, 17, 2, 257);
    			attr_dev(div0, "class", "main row nowrap");
    			add_location(div0, file$1, 15, 0, 217);
    			attr_dev(div1, "class", "main");
    			add_location(div1, file$1, 19, 0, 292);
    			attr_dev(div2, "class", "main row");
    			add_location(div2, file$1, 22, 0, 360);
    			attr_dev(div3, "class", "main");
    			add_location(div3, file$1, 27, 0, 443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, input);
    			set_input_value(input, /*user*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(margin, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user*/ 1 && input.value !== /*user*/ ctx[0]) {
    				set_input_value(input, /*user*/ ctx[0]);
    			}

    			const margin_changes = {};

    			if (!updating_value && dirty & /*value*/ 2) {
    				updating_value = true;
    				margin_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			margin.$set(margin_changes);

    			if (dirty & /*keys*/ 4) {
    				each_value = /*keys*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(margin.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(margin.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(margin);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
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
    	let { user = "" } = $$props;
    	let value = "";
    	let keys = [];

    	function onType(res) {
    		console.log(res);
    		$$invalidate(2, keys = keys.concat(["more"]));
    	}

    	const writable_props = ["user"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler() {
    		user = this.value;
    		$$invalidate(0, user);
    	}

    	function margin_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	$$self.$set = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({ Margin, user, value, keys, onType });

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("keys" in $$props) $$invalidate(2, keys = $$props.keys);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user, value, keys, onType, input_input_handler, margin_value_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { user: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get user() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let user = '';
    // wire-in query params
    const URLSearchParams = window.URLSearchParams;
    if (typeof URLSearchParams !== undefined) {
      const urlParams = new URLSearchParams(window.location.search);
      const myParam = urlParams.get('user');
      if (myParam) {
        user = myParam;
      }
    }

    const app = new App({
      target: document.body,
      props: { user: user },
    });

    return app;

}());
