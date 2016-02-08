/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactElement', function() {
  var ComponentClass;
  var originalSymbol;

  beforeEach(function() {
    jest.resetModuleRegistry();

    // Delete the native Symbol if we have one to ensure we test the
    // unpolyfilled environment.
    originalSymbol = global.Symbol;
    global.Symbol = undefined;

    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    ComponentClass = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });
  });

  afterEach(function() {
    global.Symbol = originalSymbol;
  });

  it('uses the fallback value when in an environment without Symbol', function() {
    expect(<div />.$$typeof).toBe(0xeac7);
  });

  it('returns a complete element according to spec', function() {
    var element = React.createFactory(ComponentClass)();
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    var expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('allows a string to be passed as the type', function() {
    var element = React.createFactory('div')();
    expect(element.type).toBe('div');
    expect(element.key).toBe(null);
    expect(element.ref).toBe(null);
    var expectation = {};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('returns an immutable element', function() {
    var element = React.createFactory(ComponentClass)();
    expect(() => element.type = 'div').toThrow();
  });

  it('does not reuse the original config object', function() {
    var config = {foo: 1};
    var element = React.createFactory(ComponentClass)(config);
    expect(element.props.foo).toBe(1);
    config.foo = 2;
    expect(element.props.foo).toBe(1);
  });

  it('extracts key and ref from the config', function() {
    var element = React.createFactory(ComponentClass)({
      key: '12',
      ref: '34',
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe('34');
    var expectation = {foo:'56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('coerces the key to a string', function() {
    var element = React.createFactory(ComponentClass)({
      key: 12,
      foo: '56',
    });
    expect(element.type).toBe(ComponentClass);
    expect(element.key).toBe('12');
    expect(element.ref).toBe(null);
    var expectation = {foo:'56'};
    Object.freeze(expectation);
    expect(element.props).toEqual(expectation);
  });

  it('preserves the owner on the element', function() {
    var Component = React.createFactory(ComponentClass);
    var element;

    var Wrapper = React.createClass({
      render: function() {
        element = Component();
        return element;
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Wrapper)
    );

    expect(element._owner.getPublicInstance()).toBe(instance);
  });

  it('merges an additional argument onto the children prop', function() {
    spyOn(console, 'error');
    var a = 1;
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    }, a);
    expect(element.props.children).toBe(a);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('does not override children if no rest args are provided', function() {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    });
    expect(element.props.children).toBe('text');
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('overrides children if null is provided as an argument', function() {
    spyOn(console, 'error');
    var element = React.createFactory(ComponentClass)({
      children: 'text',
    }, null);
    expect(element.props.children).toBe(null);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('merges rest arguments onto the children prop in an array', function() {
    spyOn(console, 'error');
    var a = 1;
    var b = 2;
    var c = 3;
    var element = React.createFactory(ComponentClass)(null, a, b, c);
    expect(element.props.children).toEqual([1, 2, 3]);
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('allows static methods to be called using the type property', function() {
    spyOn(console, 'error');

    var StaticMethodComponentClass = React.createClass({
      statics: {
        someStaticMethod: function() {
          return 'someReturnValue';
        },
      },
      getInitialState: function() {
        return {valueToReturn: 'hi'};
      },
      render: function() {
        return React.createElement('div');
      },
    });

    var element = React.createElement(StaticMethodComponentClass);
    expect(element.type.someStaticMethod()).toBe('someReturnValue');
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('identifies valid elements', function() {
    var Component = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });

    expect(React.isValidElement(React.createElement('div')))
      .toEqual(true);
    expect(React.isValidElement(React.createElement(Component)))
      .toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.DOM.div)).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({ type: 'div', props: {} })).toEqual(false);

    var jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(true);
  });

  it('allows the use of PropTypes validators in statics', function() {
    // TODO: This test was added to cover a special case where we proxied
    // methods. However, we don't do that any more so this test can probably
    // be removed. Leaving it in classic as a safety precaution.
    var Component = React.createClass({
      render: () => null,
      statics: {
        specialType: React.PropTypes.shape({monkey: React.PropTypes.any}),
      },
    });

    expect(typeof Component.specialType).toBe('function');
    expect(typeof Component.specialType.isRequired).toBe('function');
  });

  it('is indistinguishable from a plain object', function() {
    var element = React.createElement('div', {className: 'foo'});
    var object = {};
    expect(element.constructor).toBe(object.constructor);
  });

  it('should use default prop value when removing a prop', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {fruit: 'persimmon'};
      },
      render: function() {
        return React.createElement('span');
      },
    });

    var container = document.createElement('div');
    var instance = ReactDOM.render(
      React.createElement(Component, {fruit: 'mango'}),
      container
    );
    expect(instance.props.fruit).toBe('mango');

    ReactDOM.render(React.createElement(Component), container);
    expect(instance.props.fruit).toBe('persimmon');
  });

  it('should normalize props with default values', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      render: function() {
        return React.createElement('span', null, this.props.prop);
      },
    });

    var instance = ReactTestUtils.renderIntoDocument(
      React.createElement(Component)
    );
    expect(instance.props.prop).toBe('testKey');

    var inst2 = ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: null})
    );
    expect(inst2.props.prop).toBe(null);
  });

  it('should normalize props with default values in cloning', function() {
    var Component = React.createClass({
      getDefaultProps: function() {
        return {prop: 'testKey'};
      },
      render: function() {
        return <span />;
      },
    });

    var instance = React.createElement(Component);
    var clonedInstance = React.cloneElement(instance, {prop: undefined});
    expect(clonedInstance.props.prop).toBe('testKey');
    var clonedInstance2 = React.cloneElement(instance, {prop: null});
    expect(clonedInstance2.props.prop).toBe(null);

    var instance2 = React.createElement(Component, {prop: 'newTestKey'});
    var cloneInstance3 = React.cloneElement(instance2, {prop: undefined});
    expect(cloneInstance3.props.prop).toBe('testKey');
    var cloneInstance4 = React.cloneElement(instance2, {});
    expect(cloneInstance4.props.prop).toBe('newTestKey');
  });

  it('throws when changing a prop (in dev) after element creation', function() {
    var Outer = React.createClass({
      render: function() {
        var el = <div className="moo" />;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();
        expect(el.props.className).toBe('moo');

        return el;
      },
    });
    var outer = ReactTestUtils.renderIntoDocument(<Outer color="orange" />);
    expect(ReactDOM.findDOMNode(outer).className).toBe('moo');
  });

  it('throws when adding a prop (in dev) after element creation', function() {
    var container = document.createElement('div');
    var Outer = React.createClass({
      getDefaultProps: () => ({sound: 'meow'}),
      render: function() {
        var el = <div>{this.props.sound}</div>;

        expect(function() {
          el.props.className = 'quack';
        }).toThrow();

        expect(el.props.className).toBe(undefined);

        return el;
      },
    });
    var outer = ReactDOM.render(<Outer />, container);
    expect(ReactDOM.findDOMNode(outer).textContent).toBe('meow');
    expect(ReactDOM.findDOMNode(outer).className).toBe('');
  });

  it('does not warn for NaN props', function() {
    spyOn(console, 'error');
    var Test = React.createClass({
      render: function() {
        return <div />;
      },
    });
    var test = ReactTestUtils.renderIntoDocument(<Test value={+undefined} />);
    expect(test.props.value).toBeNaN();
    expect(console.error.argsForCall.length).toBe(0);
  });

  it('identifies elements, but not JSON, if Symbols are supported', function() {
    // Rudimentary polyfill
    // Once all jest engines support Symbols natively we can swap this to test
    // WITH native Symbols by default.
    var REACT_ELEMENT_TYPE = function() {}; // fake Symbol
    var OTHER_SYMBOL = function() {}; // another fake Symbol
    global.Symbol = function(name) {
      return OTHER_SYMBOL;
    };
    global.Symbol.for = function(key) {
      if (key === 'react.element') {
        return REACT_ELEMENT_TYPE;
      }
      return OTHER_SYMBOL;
    };

    jest.resetModuleRegistry();

    React = require('React');

    var Component = React.createClass({
      render: function() {
        return React.createElement('div');
      },
    });

    expect(React.isValidElement(React.createElement('div')))
      .toEqual(true);
    expect(React.isValidElement(React.createElement(Component)))
      .toEqual(true);

    expect(React.isValidElement(null)).toEqual(false);
    expect(React.isValidElement(true)).toEqual(false);
    expect(React.isValidElement({})).toEqual(false);
    expect(React.isValidElement('string')).toEqual(false);
    expect(React.isValidElement(React.DOM.div)).toEqual(false);
    expect(React.isValidElement(Component)).toEqual(false);
    expect(React.isValidElement({ type: 'div', props: {} })).toEqual(false);

    var jsonElement = JSON.stringify(React.createElement('div'));
    expect(React.isValidElement(JSON.parse(jsonElement))).toBe(false);
  });

});

describe('comparing jsx vs .createFactory() vs .createElement()', function() {
  var Child;

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    Child = jest.genMockFromModule('ReactElementTestChild');
  });


  describe('when using jsx only', function() {
    var Parent, instance;
    beforeEach(function() {
      Parent = React.createClass({
        render: function() {
          return (
            <div>
              <Child ref="child" foo="foo value">children value</Child>
            </div>
          );
        },
      });
      instance = ReactTestUtils.renderIntoDocument(<Parent/>);
    });

    it('should scry children but cannot', function() {
      var children = ReactTestUtils.scryRenderedComponentsWithType(instance, Child);
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', function() {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', function() {
      expect(Child.mock.calls[0][0]).toEqual({ foo: 'foo value', children: 'children value' });
    });
  });

  describe('when using parent that uses .createFactory()', function() {
    var factory, instance;
    beforeEach(function() {
      var childFactory = React.createFactory(Child);
      var Parent = React.createClass({
        render: function() {
          return React.DOM.div({}, childFactory({ ref: 'child', foo: 'foo value' }, 'children value'));
        },
      });
      factory = React.createFactory(Parent);
      instance = ReactTestUtils.renderIntoDocument(factory());
    });

    it('can properly scry children', function() {
      var children = ReactTestUtils.scryRenderedComponentsWithType(instance, Child);
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', function() {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', function() {
      expect(Child.mock.calls[0][0]).toEqual({ foo: 'foo value', children: 'children value' });
    });
  });

  describe('when using parent that uses .createElement()', function() {
    var factory, instance;
    beforeEach(function() {
      var Parent = React.createClass({
        render: function() {
          return React.DOM.div({}, React.createElement(Child, { ref: 'child', foo: 'foo value' }, 'children value'));
        },
      });
      factory = React.createFactory(Parent);
      instance = ReactTestUtils.renderIntoDocument(factory());
    });

    it('should scry children but cannot', function() {
      var children = ReactTestUtils.scryRenderedComponentsWithType(instance, Child);
      expect(children.length).toBe(1);
    });

    it('does not maintain refs', function() {
      expect(instance.refs.child).not.toBeUndefined();
    });

    it('can capture Child instantiation calls', function() {
      expect(Child.mock.calls[0][0]).toEqual({ foo: 'foo value', children: 'children value' });
    });
  });
});
