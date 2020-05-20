function debounce(func, delay) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    const args = arguments, that = this;
    timeout = setTimeout(() => func.apply(that,args), delay);
  }
}

module.exports = { debounce };
