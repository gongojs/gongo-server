'use strict';

jest.useFakeTimers();

const utils = require('./utils');

describe('utils', () => {

  it('debounce', () => {
    const fn = jest.fn();
    const debouncedFn = utils.debounce(fn, 10);
    debouncedFn();
    debouncedFn();
    jest.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

});
