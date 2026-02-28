var debounce = function(fn, t) {
    let timer;
    return function(...args) {
        clearTimeout(timer)

        timer = setTimeout(() => {
          fn(...args)
        }, t);
    }
};

let a = debounce(sum, 2000)

a(6,4,2)